const express = require("express");

const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const prisma = require("./db/prisma");

const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

// Security Headers
app.use(helmet());

// Parse Cookies
app.use(cookieParser());

// Parse JSON
app.use(express.json());

// XSS Protection
app.use(xss());

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
app.use("/user", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/analytics", analyticsRoutes);

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