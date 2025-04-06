const express = require("express");
const router = express.Router();
const { Event, Artist } = require("../models");
const eventController = require("../controllers/eventController");

// Route to display all approved events
router.get("/", async (req, res) => {
  try {
    console.log("PUBLIC EVENTS PAGE REQUESTED");

    // Debug database state first
    const allEventsCount = await Event.count();
    const approvedCount = await Event.count({ where: { status: "approved" } });
    console.log(
      `Database contains ${allEventsCount} events, ${approvedCount} are approved`
    );

    // Get all approved events with their artists
    const events = await Event.findAll({
      where: { status: "approved" },
      include: [{ model: Artist, attributes: ["id", "name"] }],
      order: [["date", "ASC"]],
    });

    console.log(`Found ${events.length} approved events to display`);
    if (events.length > 0) {
      console.log("First event:", {
        id: events[0].id,
        name: events[0].name,
        status: events[0].status,
      });
    }

    res.render("events", {
      events,
      user: req.session.user || null,
      title: "All Events",
    });
  } catch (error) {
    console.error("PUBLIC EVENTS PAGE ERROR:", error);
    req.flash("error", "Failed to load events.");
    res.redirect("/");
  }
});

// Route to display details for a specific event
router.get("/:id", eventController.getEventById);

module.exports = router;
