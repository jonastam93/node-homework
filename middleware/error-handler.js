function errorHandler(err, req, res, next) {
    console.error(err);

    return res.status(500).json({
        error: "Internal Server Error",
        requestId: req.requestId,
    });
}

module.exports = errorHandler;