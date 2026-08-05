const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

async function create(req, res) {
  const { error, value } = taskSchema.validate(req.body || {});

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  const result = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, title, is_completed`,
    [
      value.title,
      value.isCompleted,
      global.user_id,
    ],
  );

  return res.status(201).json(result.rows[0]);
}

async function index(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         id,
         title,
         is_completed AS "isCompleted",
         created_at AS "createdAt"
       FROM tasks
       WHERE user_id = $1
       ORDER BY id`,
      [global.user_id.id],
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
}

async function show(req, res) {
    const taskId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(taskId)) {
        return res.status(400).json({
            message: "Invalid task ID",
        });
    }

    const showTask = await pool.query(
      `SELECT id, title, is_completed FROM tasks
       WHERE id = $1 AND user_id = $2`,
      [taskId, global.user_id]  
    );

    if (showTask.rows.length === 0) {
        return res.status(404).json({
            message: "Task not found",
        });
    }

    return res.status(200).json(showTask.rows[0]);
}

async function update(req, res, next) {
  try {
    const { error, value: taskChange } = patchTaskSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: error.details.map((detail) => detail.message).join(", "),
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
      .map(([key], index) => `${columnMap[key]} = $${index + 1}`)
      .join(", ");

    const values = entries.map(([, value]) => value);

    values.push(taskId, global.user_id.id);

    const result = await pool.query(
      `UPDATE tasks
       SET ${setClause}
       WHERE id = $${values.length - 1}
         AND user_id = $${values.length}
       RETURNING
         id,
         title,
         is_completed AS "isCompleted",
         created_at AS "createdAt"`,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res) {
  const taskId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  const deletedTask = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, is_completed`,
    [taskId, global.user_id]
  );

  if (deletedTask.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  return res.status(200).json(deletedTask.rows[0]); 
}

module.exports = { create, index, show, update, deleteTask, };