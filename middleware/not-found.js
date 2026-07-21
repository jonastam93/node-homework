function notFound(req, res) {
    return res.status(404).json({
        error: "Route Not Found",
    });
}

module.exports = notFound;