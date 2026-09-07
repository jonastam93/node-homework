const {
  taskSchema,
  patchTaskSchema,
} = require("../validation/taskSchema");
const prisma = require("../db/prisma");
const e = require("express");

async function create(req, res, next) {
  try {
    const { error, value } = taskSchema.validate(req.body || {}, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details,
      });
    }

    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
}

async function index(req, res, next) {
  try {
    // Parse pagination parameters
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    // Validate pagination
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

    // Only get tasks belonging to the logged-in user
    const whereClause = {
      userId: req.user.id,
    };

    // Optional title search
    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    // Get tasks with pagination, search, and eager loading
    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "No tasks found for user"
      });
    }

    // Count only tasks matching the same filter
    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      tasks,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
}

// Bulk create with validation
async function bulkCreate(req, res, next) {
  const { tasks } = req.body || {};

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch (err) {
    return next(err);
  }
};

async function show(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      message: "Invalid task id",
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      message: "Invalid task id",
    });
  }

  const { error, value } = patchTaskSchema.validate(req.body || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    const task = await prisma.task.update({
      where: {
        id_userId: {
          id,
          userId: req.user.id,
        },
      },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }

    return next(err);
  }
}

async function deleteTask(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      message: "Invalid task id",
    });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }

    return next(err);
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
};