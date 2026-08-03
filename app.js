const express = require("express");

const userRouter = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const pool = require("./db/pg-pool");

const app = express();

// In memory "database"
global.user_id = null;
global.users = [];
global.tasks = [];


// Parse JSON 
app.use(express.json());

// Routes
app.use("/api/users", userRouter);

// Mount the router
app.use("/api/tasks", authMiddleware, taskRouter);

// 404 middleware (must come after routes)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});

async function shutdown() {
    console.log('Shutting down...');

    // Stop accepting new connections
    server.close();

    // Close all PostgreSQL connections
    await pool.end();

    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server };