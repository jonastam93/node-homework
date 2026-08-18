const express = require("express");

const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const authMiddleware = require("./middleware/auth");
const prisma = require("./db/prisma");

const app = express();

global.user_id = null;

// Parse JSON
app.use(express.json());

// Health check
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      db: "connected",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "not connected",
      error: err.message,
    });
  }
});

// Routes
app.use("/api/users", userRouter);

app.use("/api/tasks", authMiddleware, taskRouter);

app.use("/api/analytics", authMiddleware, analyticsRoutes);

// 404 middleware
app.use(notFound);

// Error handler
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

async function shutdown() {
  console.log("Shutting down...");

  server.close();

  await prisma.$disconnect();
  console.log("Prisma disconnected");

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = { app, server };