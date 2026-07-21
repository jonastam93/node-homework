const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");

const dogsRouter = require("./routes/dogs");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

// Build-in middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Custom request ID middleware
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

//Logging middleware
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`
  );
  next();
});


app.use("/", dogsRouter);// Do not remove this line

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Internal Server Error",
    requestId: req.requestId,
  });
});


if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

