const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");

// ✅ Get all approved events (Public)
router.get("/", eventController.getAllApprovedEvents);

// ✅ Get details of a specific event by ID (Public)
router.get("/:id", eventController.getEventById);

// ✅ Create an event (Only for logged-in users)
router.post("/create", ensureAuthenticated, eventController.createEvent);

// ✅ Admin: Approve an event
router.post("/:id/approve", ensureAdmin, eventController.approveEvent);

// ✅ Admin: Delete an event
router.delete("/:id/delete", ensureAdmin, eventController.deleteEvent);

// ✅ Admin: Edit an event
router.put("/:id/edit", ensureAdmin, eventController.editEvent);

module.exports = router;
