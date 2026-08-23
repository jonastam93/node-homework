const express = require("express");

const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");

const router = express.Router();

// Bulk task creation
router.post("/bulk", taskController.bulkCreate);

// Regular task routes
router.post("/", taskController.create);
router.get("/", taskController.index);

// Routes with task ID
router.get("/:id", taskController.show);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;