const Booking = require("../models/Booking");
const Event = require("../models/Event");

exports.bookEvent = async (req, res) => {
  try {
    const { eventId, tickets } = req.body;
    const userId = req.user.id;

    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).send("Event not found");

    await Booking.create({ userId, eventId, tickets });

    res.redirect("/profile");
  } catch (error) {
    console.error("Error booking event:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: "event",
    });

    res.render("profile", { title: "My Bookings", user: req.user, bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send("Internal Server Error");
  }
};
