const express = require("express");
const router = express.Router();
const { Event, Artist } = require("../models");

// Homepage
router.get("/", async (req, res) => {
  try {
    // Fetch approved events from the database
    const events = await Event.findAll({
      where: { status: "approved" },
      include: [{ model: Artist, attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
      limit: 3,
    });

    // If no events found, provide some fallback events
    const displayEvents =
      events.length > 0
        ? events
        : [
            {
              id: 1,
              name: "Electronic Music Festival",
              date: "2025-06-15T20:00:00",
              location: "Warehouse District",
              price: "49.99",
              imageUrl: "/images/event1.jpg",
            },
            {
              id: 2,
              name: "Underground Hip-Hop Night",
              date: "2025-06-22T21:00:00",
              location: "The Basement Lounge",
              price: "25.00",
              imageUrl: "/images/event2.jpg",
            },
            {
              id: 3,
              name: "Indie Rock Showcase",
              date: "2025-07-01T19:30:00",
              location: "The Sound Garden",
              price: "35.50",
              imageUrl: "/images/event3.jpg",
            },
          ];

    res.render("index", {
      title: "Vynyl - Home",
      events: displayEvents,
    });
  } catch (error) {
    console.error("Error fetching events for homepage:", error);
    // If there's an error, still render the page with fallback events
    res.render("index", {
      title: "Vynyl - Home",
      events: [
        {
          id: 1,
          name: "Electronic Music Festival",
          date: "2025-06-15T20:00:00",
          location: "Warehouse District",
          price: "49.99",
          imageUrl: "/images/event1.jpg",
        },
        {
          id: 2,
          name: "Underground Hip-Hop Night",
          date: "2025-06-22T21:00:00",
          location: "The Basement Lounge",
          price: "25.00",
          imageUrl: "/images/event2.jpg",
        },
        {
          id: 3,
          name: "Indie Rock Showcase",
          date: "2025-07-01T19:30:00",
          location: "The Sound Garden",
          price: "35.50",
          imageUrl: "/images/event3.jpg",
        },
      ],
    });
  }
});

// About Page
router.get("/about", (req, res) => {
  res.render("about", { title: "About Vynyl" });
});

module.exports = router;
