const express = require("express");
const router = express.Router();

// Homepage
router.get("/", (req, res) => {
  res.render("index", {
    title: "Vynyl - Home",
    events: [
      {
        id: 1,
        name: "Electronic Music Festival",
        date: "Jun 15, 2025",
        time: "8:00 PM",
        venue: "Warehouse District",
        price: "49.99",
        imageUrl: "/images/event1.jpg",
      },
      {
        id: 2,
        name: "Underground Hip-Hop Night",
        date: "Jun 22, 2025",
        time: "9:00 PM",
        venue: "The Basement Lounge",
        price: "25.00",
        imageUrl: "/images/event2.jpg",
      },
      {
        id: 3,
        name: "Indie Rock Showcase",
        date: "Jul 01, 2025",
        time: "7:30 PM",
        venue: "The Sound Garden",
        price: "35.50",
        imageUrl: "/images/event3.jpg",
      },
      {
        id: 4,
        name: "Summer DJ Battle",
        date: "Jul 08, 2025",
        time: "10:00 PM",
        venue: "Rooftop Plaza",
        price: "40.00",
        imageUrl: "/images/event4.jpg",
      },
    ],
  });
});

// About Page
router.get("/about", (req, res) => {
  res.render("about", { title: "About Vynyl" });
});

module.exports = router;
