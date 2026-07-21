const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");

const dogsRouter = require("./routes/dogs");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

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

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// Build-in middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Content-Type validation middleware
app.use((req, res, next) => {
  const methodsWithBodies = ["POST", "PUT", "PATCH"];

  if(
    methodsWithBodies.includes(req.method) &&
    !req.is("application/json")
  ) {
    return res.status(415).json({
      error: "Content-Type must be application/json",
      requestId: req.requestId,
    });
  }
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

