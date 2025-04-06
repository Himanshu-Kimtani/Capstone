const Event = require("../models/Event");
const Artist = require("../models/Artist");
const Booking = require("../models/Booking");

//  Get all approved events (Public)
exports.getAllApprovedEvents = async (req, res) => {
  try {
    const { q, location, date, genre, minPrice, maxPrice } = req.query;

    let whereClause = { status: "approved" };

    if (q) whereClause.name = { $like: `%${q}%` };
    if (location) whereClause.location = { $like: `%${location}%` };
    if (date) whereClause.date = date;
    if (genre) whereClause.genre = genre;
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.$gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.$lte = parseFloat(maxPrice);
    }

    const events = await Event.findAll({ where: whereClause });

    res.render("events", { title: "Events", events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Get event details by ID (Public)
exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Get event details
    const event = await Event.findByPk(eventId, {
      include: [{ model: Artist, attributes: ["id", "name"] }],
    });

    if (!event) {
      req.flash("error", "Event not found");
      return res.redirect("/events");
    }

    // Ensure price is a number
    if (event.price) {
      event.price = parseFloat(event.price);
    }

    // Check if the user has already booked this event
    let isBooked = false;
    if (req.session.user) {
      try {
        // Use a simpler query that doesn't specify fields
        const booking = await Booking.findOne({
          where: {
            userId: req.session.user.id,
            eventId: event.id,
          },
          attributes: ["id"], // Only select the ID to check existence
        });
        isBooked = !!booking;
      } catch (error) {
        console.error("Error checking booking:", error);
        // Continue even if booking check fails
      }
    }

    res.render("eventDetails", {
      title: event.name,
      event,
      user: req.session.user,
      isBooked,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    console.error("Error getting event details:", error);
    req.flash("error", "Error loading event details");
    res.redirect("/events");
  }
};

// Create an event (Only for logged-in users)
exports.createEvent = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "Please log in to create an event.");
      return res.redirect("/users/login");
    }

    const { name, date, location, genre, price, imageUrl } = req.body;
    const status = req.session.user.role === "admin" ? "approved" : "pending";

    await Event.create({
      name,
      date,
      location,
      genre,
      price,
      imageUrl,
      status,
      createdBy: req.session.user.id,
    });

    req.flash("success", "Event submitted for approval.");
    res.redirect("/events");
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Approve an event (Admin Only)
exports.approveEvent = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      req.flash("error", "Unauthorized.");
      return res.redirect("/events");
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    event.status = "approved";
    await event.save();

    req.flash("success", "Event approved successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error approving event:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Edit an event (Admin Only)
exports.editEvent = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      req.flash("error", "Unauthorized.");
      return res.redirect("/events");
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    const { name, date, location, genre, price, imageUrl } = req.body;
    await event.update({ name, date, location, genre, price, imageUrl });

    req.flash("success", "Event updated successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error editing event:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Delete an event (Admin Only)
exports.deleteEvent = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      req.flash("error", "Unauthorized.");
      return res.redirect("/events");
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    await event.destroy();

    req.flash("success", "Event deleted successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send("Internal Server Error");
  }
};
