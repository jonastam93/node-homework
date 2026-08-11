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
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const result = await pool.query(
      `SELECT
         id,
         title,
         is_completed AS "isCompleted"
       FROM tasks
       WHERE id = $1
         AND user_id = $2`,
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

async function update(req, res, next) {
  try {
    const { error, value: taskChange } = patchTaskSchema.validate(
      req.body || {},
      {
        abortEarly: false,
        stripUnknown: true,
      },
    );

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details,
      });
    }

    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const columnMap = {
      title: "title",
      isCompleted: "is_completed",
    };

    const entries = Object.entries(taskChange);

    const setClause = entries
      .map(([key], index) => {
        return `${columnMap[key]} = $${index + 1}`;
      })
      .join(", ");

    const values = entries.map(([, fieldValue]) => fieldValue);

    const taskIdPosition = values.length + 1;
    const userIdPosition = values.length + 2;

    values.push(taskId, global.user_id);

    const result = await pool.query(
      `UPDATE tasks
       SET ${setClause}
       WHERE id = $${taskIdPosition}
         AND user_id = $${userIdPosition}
       RETURNING
         id,
         title,
         is_completed AS "isCompleted"`,
      values,
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