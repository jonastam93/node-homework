function notFound(req, res) {
    return res.status(404).json({
        error: "Route not found",
        requestId: req.requestId,
    });
}

module.exports = notFound;