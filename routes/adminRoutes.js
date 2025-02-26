const express = require("express");
const router = express.Router();
const { User, Event, Artist } = require("../models"); // ✅ Import all required models

// Middleware to check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    return next(); // Allow access
  }
  req.flash("error", "Unauthorized access.");
  res.redirect("/users/login"); // Redirect to login if not admin
};

// ✅ Admin Dashboard Route (Pass `totalUsers`, `totalEvents`, `events`, `users`, `artists` to admin.ejs)
router.get("/", isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count(); // ✅ Get total number of users
    const totalEvents = await Event.count(); // ✅ Get total number of events
    const events = await Event.findAll({ order: [["date", "ASC"]] }); // ✅ Fetch all events
    const users = await User.findAll({ order: [["createdAt", "DESC"]] }); // ✅ Fetch all users
    const artists = await Artist.findAll({ order: [["name", "ASC"]] }); // ✅ Fetch all artists

    res.render("admin", { totalUsers, totalEvents, events, users, artists }); // ✅ Pass data to admin.ejs
  } catch (error) {
    console.error("Error fetching admin data:", error);
    req.flash("error", "Error loading admin dashboard.");
    res.redirect("/users/login");
  }
});

module.exports = router;
