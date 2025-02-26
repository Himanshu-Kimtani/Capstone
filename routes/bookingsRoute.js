const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/auth");

// Book an event (Protected Route)
router.post("/book", authMiddleware, bookingController.bookEvent);

// Get user's bookings (Protected)
router.get("/my-bookings", authMiddleware, bookingController.getUserBookings);

module.exports = router;
