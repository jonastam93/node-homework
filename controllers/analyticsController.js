const prisma = require("../db/prisma");

async function getUserAnalytics(req, res, next) {
    try {
        // Parse and validate user ID
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({
                message: "Invalid user ID",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        
        // groupBy counts tasks by completion status
        const taskStats = await prisma.task.groupBy({
            by: ["isCompleted"],
            where: { userId },
            _count: {
                id: true
            }
        });

        // Include recent task activity with eager loading
        const recentTasks = await prisma.task.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                isCompleted: true,
                priority: true,
                createdAt: true,
                userId: true,
                User: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        // Calculate weekly progress using groupBy
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyProgress = await  prisma.task.groupBy({
            by: ["createdAt"],
            where: {
                userId,
                createdAt: { gte: oneWeekAgo }
            },
            _count: { id: true }
        });

        // Return response with taskStats, recentTasks, and weeklyProgress
        res.status(200).json({
            taskStats,
            recentTasks,
            weeklyProgress,
        });
    } catch (error) {
      return next (error);
    }
}

// method for listing users with task counts and pagination
async function getUsersWithStats(req, res, next) {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        message: "Page must be a positive integer",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Limit must be an integer between 1 and 100",
      });
    }

    const skip = (page - 1) * limit;

    const usersRaw = await prisma.user.findMany({
      include: {
        Task: {
          where: {
            isCompleted: false,
          },
          select: {
            id: true,
          },
          take: 5,
        },
        _count: {
          select: {
            Task: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      Task: user.Task,
    }));

    const totalUsers = await prisma.user.count();

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      users,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
}

async function searchTasks(req, res, next) {
  try {
    const searchQuery = req.query.q;

    if (
      typeof searchQuery !== "string" ||
      searchQuery.trim().length < 2
    ) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Limit must be an integer between 1 and 100",
      });
    }

    const trimmedQuery = searchQuery.trim();
    const searchPattern = `%${trimmedQuery}%`;
    const exactMatch = trimmedQuery;
    const startsWith = `${trimmedQuery}%`;

    const searchResults = await prisma.$queryRaw`
      SELECT
        t.id,
        t.title,
        t.is_completed AS "isCompleted",
        t.priority,
        t.created_at AS "createdAt",
        t.user_id AS "userId",
        u.name AS "user_name"
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.title ILIKE ${searchPattern}
         OR u.name ILIKE ${searchPattern}
      ORDER BY
        CASE
          WHEN t.title ILIKE ${exactMatch} THEN 1
          WHEN t.title ILIKE ${startsWith} THEN 2
          WHEN t.title ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        t.created_at DESC
      LIMIT ${limit}
    `;

    return res.status(200).json({
      results: searchResults,
      query: trimmedQuery,
      count: searchResults.length,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
    getUserAnalytics,
    getUsersWithStats,
    searchTasks,
};