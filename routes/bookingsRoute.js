const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { ensureAuthenticated } = require("../middleware/auth");

// ✅ Book an event (Protected Route)
router.post("/book", ensureAuthenticated, bookingController.bookEvent);

// ✅ Get user's bookings (Protected)
router.get(
  "/my-bookings",
  ensureAuthenticated,
  bookingController.getUserBookings
);

// ✅ Cancel a booking (Protected)
router.delete(
  "/:bookingId/cancel",
  ensureAuthenticated,
  bookingController.cancelBooking
);

module.exports = router;
