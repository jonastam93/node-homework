const express = require("express");
const timeController = require("../controllers/timeController");

const router = express.Router();

router.get("/time", timeController.getTime);
router.post("/echo", timeController.echoBody);

console.log("Exporting router:", typeof router);
module.exports = router;