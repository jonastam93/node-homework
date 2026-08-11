const {
  taskSchema,
  patchTaskSchema,
} = require("../validation/taskSchema");

const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

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
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    return next(error);
  }
}

async function index(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: {
        title: true,
        isCompleted: true,
        id: true,
      },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    return next(error);
  }
}

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
          id,
          userId: global.user_id,
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
        },
      });

      if (!task) {
        return res.status(404).json({
          message: "The task was not found.",
        });
      }
      
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

async function update(req, res, next) {
    const { error, value } = patchTaskSchema.validate(
      req.body || {},
      {
        abortEarly: false,
        stripUnknown: true,
      });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details,
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        message: "Invalid task id",
      });
    }

    try {
      const task = await prisma.task.update({
        data: value,
        where: {
          id,
          userId: global.user_id,
        },
        select: {
          title: true,
          isCompleted: true,
          id: true,
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
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1
         AND user_id = $2
       RETURNING
         id,
         title,
         is_completed AS "isCompleted"`,
      [taskId, global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};