const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

// Get all events
router.get("/", eventController.getAllEvents);

// Get details of a specific event by ID
router.get("/:id", eventController.getEventById);

module.exports = router;
