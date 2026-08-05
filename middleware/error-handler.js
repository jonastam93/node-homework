function errorHandler(err, req, res, next) {
  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.error(
      "Database connection was refused. Is the database service running?",
    );
  }

  console.error(err);

  return res.status(err.statusCode || 500).json({
    error: err.statusCode ? err.message : "Internal Server Error",
    requestId: req.requestId,
  });
}

module.exports = errorHandler;