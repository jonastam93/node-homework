const express = require("express");
const taskController = require("../controllers/taskControllers");
const auth = require("../middleware/auth");

const router = express.Router();

// Protect all task routes
router.use(auth);

router.post("/", taskController.create);
router.get("/", tasktController.index);
router.get("/:id", taskController.show);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;