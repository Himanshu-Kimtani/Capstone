const Booking = require("../models/Booking");
const Event = require("../models/Event");

// ✅ Book an event (Ensures event is approved & prevents duplicate bookings)
exports.bookEvent = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "Please log in to book an event.");
      return res.redirect("/users/login");
    }

    const { eventId, tickets = 1 } = req.body;
    const userId = req.session.user.id;

    const event = await Event.findByPk(eventId);

    if (!event) {
      req.flash("error", "Event not found.");
      return res.redirect("/events");
    }

    if (event.status !== "approved") {
      req.flash("error", "This event is not available for booking.");
      return res.redirect("/events");
    }

    // ✅ Check if user already booked this event
    const existingBooking = await Booking.findOne({
      where: { userId, eventId },
      attributes: ["id"], // Only select ID to check existence
    });

    if (existingBooking) {
      req.flash("error", "You have already booked this event.");
      return res.redirect("/events");
    }

    await Booking.create({
      userId,
      eventId,
      tickets,
      purchaseDate: new Date(),
      status: "completed",
    });

    req.flash(
      "success",
      `Successfully booked ${tickets} ticket(s) for ${event.name}.`
    );
    res.redirect("/users/dashboard");
  } catch (error) {
    console.error("Error booking event:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/events");
  }
};

// ✅ Get all bookings for logged-in user
exports.getUserBookings = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "Please log in to view your bookings.");
      return res.redirect("/users/login");
    }

    const userId = req.session.user.id;

    const bookings = await Booking.findAll({
      where: { userId },
      include: { model: Event, as: "event" },
    });

    res.render("profile", {
      title: "My Bookings",
      user: req.session.user,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/users/profile");
  }
};

// ✅ Cancel a booking (Only if event is not yet started)
exports.cancelBooking = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "Please log in to cancel bookings.");
      return res.redirect("/users/login");
    }

    const bookingId = req.params.bookingId;
    const userId = req.session.user.id;

    const booking = await Booking.findOne({
      where: { id: bookingId, userId },
      include: "event",
    });

    if (!booking) {
      req.flash("error", "Booking not found.");
      return res.redirect("/users/profile");
    }

    const eventDate = new Date(booking.event.date);
    const now = new Date();

    if (now >= eventDate) {
      req.flash("error", "You cannot cancel a past or ongoing event.");
      return res.redirect("/users/profile");
    }

    await booking.destroy();
    req.flash("success", "Booking canceled successfully.");
    res.redirect("/users/dashboard");
  } catch (error) {
    console.error("Error canceling booking:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/users/profile");
  }
};
