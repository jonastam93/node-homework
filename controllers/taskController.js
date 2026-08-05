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

async function index(req, res) {
    const tasks = await pool.query(
      "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
      [global.user_id]
    );

    if (tasks.rows.length === 0) {
        return res.status(404).json({
            message: "No tasks found",
        });
    }

    return res.status(200).json(tasks.rows);
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

async function update(req, res) {
  const { error, value: taskChange } = patchTaskSchema.validate(
    req.body || {},
    {
      abortEarly: false,
    },
  );

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const taskId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(taskId)) {
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

  const values = entries.map(([, value]) => value);

  const idParameter = `$${values.length + 1}`;
  const userParameter = `$${values.length + 2}`;

  const updatedTask = await pool.query(
    `UPDATE tasks
     SET ${setClause}
     WHERE id = ${idParameter}
       AND user_id = ${userParameter}
     RETURNING id, title, is_completed`,
    [...values, taskId, global.user_id],
  );

  if (updatedTask.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  return res.status(200).json(updatedTask.rows[0]);
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