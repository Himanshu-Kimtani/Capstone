const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const adminController = require("../controllers/adminController");
const upload = require("../middleware/upload");
const { Artist, Venue, Event } = require("../models");

// Configure multer for different upload types
const eventStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/events");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const artistStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/artists");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const imageFileFilter = function (req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images only!");
  }
};

const uploadEvent = multer({
  storage: eventStorage,
  fileFilter: imageFileFilter,
});

const uploadArtist = multer({
  storage: artistStorage,
  fileFilter: imageFileFilter,
});

// Middleware to check if user is Admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next(); // Allow access
  }
  req.flash("error", "Unauthorized access.");
  res.redirect("/users/login"); // Redirect to login if not admin
};

// Admin Dashboard - Main Route
router.get("/", isAdmin, async (req, res) => {
  try {
    console.log("Starting admin dashboard render...");

    // Create a database connection manually to ensure fresh data
    const db = require("../models");
    await db.sequelize.authenticate();
    console.log("Database connection established successfully");

    // Fetch all users
    const users = await db.User.findAll();

    // Fetch all artists
    const artists = await db.Artist.findAll();

    // Fetch approved events with their artists
    const events = await db.Event.findAll({
      where: { status: "approved" },
      include: [{ model: db.Artist }],
      order: [["createdAt", "DESC"]],
    });

    // Fetch pending events
    const pendingEvents = await db.Event.findAll({
      where: { status: "pending" },
      include: [{ model: db.Artist }],
    });

    console.log("====== ADMIN DASHBOARD DATA ======");
    console.log(`Users: ${users.length}`);
    console.log(`Artists: ${artists.length}`);
    console.log(`Approved Events: ${events.length}`);
    console.log(`Pending Events: ${pendingEvents.length}`);

    if (events.length > 0) {
      console.log(
        "Sample event data:",
        JSON.stringify(events[0].dataValues, null, 2)
      );
    }

    // Always provide these values directly, not as objects that might not be accessible
    const totalUsers = users.length;
    const totalArtists = artists.length;
    const totalEvents = events.length;

    console.log("Ready to render admin dashboard template");

    return res.render("admin", {
      title: "Admin Dashboard",
      user: req.session.user,
      users,
      artists,
      events,
      pendingEvents,
      totalUsers,
      totalArtists,
      totalEvents,
      timestamp: new Date().toISOString(), // Add timestamp to prevent caching
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    req.flash("error", `Error loading admin dashboard: ${error.message}`);
    return res.redirect("/users/login");
  }
});

// User Management
router.post("/user/:id/delete", isAdmin, adminController.deleteUser);
router.get("/user/:id/edit", isAdmin, adminController.getUserEditForm);
router.post("/user/:id/edit", isAdmin, adminController.updateUser);

// Event Management
router.post("/event/:id/approve", isAdmin, adminController.approveEvent);
router.post("/event/:id/reject", isAdmin, adminController.rejectEvent);
router.get("/event/create", isAdmin, adminController.getCreateEventForm);
router.post(
  "/event/create",
  isAdmin,
  uploadEvent.single("picture"),
  adminController.createEvent
);
router.get("/event/:id/edit", isAdmin, adminController.getEditEventForm);
router.post(
  "/event/:id/edit",
  isAdmin,
  uploadEvent.single("picture"),
  adminController.updateEvent
);
router.post("/event/:id/delete", isAdmin, adminController.deleteEvent);

// Artist Management
router.get("/artist/create", isAdmin, adminController.getCreateArtistForm);
router.post(
  "/artist/create",
  isAdmin,
  uploadArtist.single("picture"),
  adminController.createArtist
);
router.post("/artist/:id/verify", isAdmin, adminController.verifyArtist);
router.get("/artist/:id/edit", isAdmin, adminController.getEditArtistForm);
router.post(
  "/artist/:id/edit",
  isAdmin,
  uploadArtist.single("picture"),
  adminController.updateArtist
);
router.post("/artist/:id/delete", isAdmin, adminController.deleteArtist);

// Gallery Management
router.get("/gallery", isAdmin, adminController.getGallery);
router.post("/gallery/:id/delete", isAdmin, adminController.deleteGalleryImage);

// Support Management
router.get("/support", isAdmin, adminController.getSupport);
router.post("/support/:id/respond", isAdmin, adminController.respondToTicket);

// Authentication
router.get("/logout", adminController.logout);

// Add this test route near the authentication routes
router.get("/test", (req, res) => {
  res.send("Admin routes are working!");
});

// Admin dashboard
router.get("/dashboard", async (req, res) => {
  try {
    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Error loading dashboard");
  }
});

// Artist management
router.get("/artists", async (req, res) => {
  try {
    const artists = await Artist.findAll();
    res.render("admin/artists", {
      title: "Manage Artists",
      artists,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error loading artists:", error);
    res.status(500).send("Error loading artists");
  }
});

router.post("/artists", upload.single("image"), async (req, res) => {
  try {
    // Handle artist creation
    res.redirect("/admin/artists");
  } catch (error) {
    console.error("Error creating artist:", error);
    res.status(500).send("Error creating artist");
  }
});

// Venue management
router.get("/venues", async (req, res) => {
  try {
    const venues = await Venue.findAll();
    res.render("admin/venues", {
      title: "Manage Venues",
      venues,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error loading venues:", error);
    res.status(500).send("Error loading venues");
  }
});

router.post("/venues", upload.single("image"), async (req, res) => {
  try {
    // Handle venue creation
    res.redirect("/admin/venues");
  } catch (error) {
    console.error("Error creating venue:", error);
    res.status(500).send("Error creating venue");
  }
});

// Event management
router.get("/events", async (req, res) => {
  try {
    const events = await Event.findAll();
    res.render("admin/events", {
      title: "Manage Events",
      events,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error loading events:", error);
    res.status(500).send("Error loading events");
  }
});

router.post("/events", upload.single("image"), async (req, res) => {
  try {
    // Handle event creation
    res.redirect("/admin/events");
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).send("Error creating event");
  }
});

module.exports = router;
