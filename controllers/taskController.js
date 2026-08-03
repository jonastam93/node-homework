const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

let currentTaskId = 1;

function taskCounter() {
    return currentTaskId++;
}

async function create(req, res) {
    if (!req.body) {
        req.body = {};
    }

    const { error, value } = taskSchema.validate(req.body, {
        abortEarly: false,
    });

    if (error) {
        return res.status(400).json({
            message: error.message,
        });
    }

    const task = await pool.query(
      `INSERT INTO tasks (title, is_completed, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed`,
       [value.title, value.is_completed, global.user_id]
    );

    return res.status(201).json(task.rows[0]);
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

function show(req, res) {
    const taskId = parseInt(req.params?.id, 10);

    if (Number.isNaN(taskId)) {
        return res.status(400).json({
            message: "Invalid task ID",
        });
    }

    const task = global.tasks.find(
        (task) =>
            task.id === taskId &&
            task.userId === global.user_id.email
    );

    if (!task) {
        return res.status(404).json({
            message: "Task not found",
        });
    }

    return res.status(200).json(sanitizedTask);
}

async function update(req, res) {
  if (!req.body) {
    req.body = {};
  }

  const { error, value: taskChange } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

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

  let keys = Object.keys(taskChange);

  keys = keys.map((key) =>
    key === "is_completed" ? "is_completed" : key);

  const setClause = keys.map((key, index) => 
    `${key} = $${i + 1}`).join(", ");

  const idParm = `$${keys.length + 1}`;

  const userParm = `$${keys.length + 2}`;

  const updatedTask = await pool.query(
    `UPDATE tasks 
     SET ${setClause} 
     WHERE id = ${idParm} AND user_id = ${userParm} 
     RETURNING id, title, is_completed`,
    [...Object.values(taskChange), req.params.id, global.user_id]
  );
}

function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id, 10);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  const taskIndex = global.tasks.findIndex(
    (task) =>
      task.id === taskId &&
      task.userId === global.user_id.email
  );

  if (taskIndex === -1) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  const task = global.tasks[taskIndex];

  const { userId, ...sanitizedTask } = task;

  global.tasks.splice(taskIndex, 1);

  return res.status(200).json(sanitizedTask);
}

module.exports = { create, index, show, update, deleteTask, };