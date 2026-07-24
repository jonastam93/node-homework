let currentTaskId = 1;

function taskCounter() {
    return currentTaskId++;
}

const task = {
    id: taskCounter(),
    title: req.body.title,
    isCompleted: false,
    userId: global.user_id.email, 
};

global.tasks.push(task);

const { userId, ...sanitizedTask } = task;

return res.status(201).json(sanitizedTask);

module.exports = taskCounter;