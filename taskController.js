let currentTaskId = 1;

function taskCounter() {
    return currentTaskId++;
}

module.exports = taskCounter;