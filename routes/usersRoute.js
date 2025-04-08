const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const userController = require("../controllers/userController");
const { ensureAuthenticated } = require("../middleware/auth");
const { User } = require("../models");
const bcrypt = require("bcrypt");
const { ClientUser } = require("../models");
const { Booking } = require("../models");
const { Event } = require("../models");
const { ArtistFollow } = require("../models");
const { Artist } = require("../models");
const fs = require("fs");

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create directory if it doesn't exist
    const dir = path.join(__dirname, "../public/uploads/profile");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Error: Images Only!"));
    }
  },
});

// ✅ Render Signup Page
router.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up" });
});

// Handle signup form submission
router.post("/signup", async (req, res) => {
  console.log("Signup attempt with:", req.body);
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/users/signup");
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/users/signup");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash("error", "Email already in use");
      return res.redirect("/users/signup");
    }

    try {
      // Step 1: Create main user in PostgreSQL
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name,
        fullName: name,
        email,
        password: hashedPassword, // Now properly hashed
        role: "user",
      });

      console.log("Main user created successfully:", newUser.id);

      // Step 2: Create client user profile in PostgreSQL
      const clientUser = await ClientUser.create({
        userId: newUser.id,
        username: email.split("@")[0],
        name: name,
        email: email,
        bio: "Tell us about yourself",
        profilePhoto: "",
        backgroundImage: "",
        highlights: [],
        achievements: [],
      });

      console.log("Client profile created successfully:", clientUser.id);

      // Log the user in automatically
      req.session.user = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        fullName: newUser.fullName,
        role: newUser.role,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          req.flash(
            "error",
            "Account created but could not log in automatically"
          );
          return res.redirect("/users/login");
        }

        req.flash("success", "Account created successfully!");
        return res.redirect("/users/dashboard");
      });
    } catch (dbError) {
      console.error("Database error during signup:", dbError);
      req.flash("error", "Error creating account: " + dbError.message);
      return res.redirect("/users/signup");
    }
  } catch (error) {
    console.error("Signup error:", error);
    req.flash("error", "An error occurred during signup");
    return res.redirect("/users/signup");
  }
});

// ✅ Render Login Page
router.get("/login", userController.getLoginPage);

// ✅ Handle Login (POST)
router.post("/login", async (req, res) => {
  console.log("Attempting login...");
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for email: ${email}`);

    // For admin login, check against admin credentials
    if (email === "admin@vynyl.com" && password === "admin123") {
      console.log("Admin credentials detected");

      // Admin login
      req.session.user = {
        id: 9999, // Default admin ID
        email: email,
        name: "Admin",
        role: "admin",
      };

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          req.flash("error", "Session error");
          return res.redirect("/users/login");
        }

        console.log("Admin session saved successfully:", req.session.user);

        // Redirect admin to admin dashboard
        console.log("Redirecting to /admin");
        return res.redirect("/admin");
      });

      return; // Exit early for admin
    }

    console.log("Regular user login attempt");

    // Regular user - find in PostgreSQL (add logging)
    let user;
    try {
      user = await User.findOne({ where: { email } });
      console.log("Database query complete");
      console.log("User found?", !!user);
      if (user) {
        console.log("User ID:", user.id);
        console.log("User email:", user.email);
        console.log("User role:", user.role);
      }
    } catch (dbError) {
      console.error("Database error during login:", dbError);
      req.flash("error", "Database error during login");
      return res.redirect("/users/login");
    }

    // Check credentials
    if (!user) {
      console.log("No user found with email:", email);
      req.flash("error", "Invalid email or password");
      return res.redirect("/users/login");
    }

    // Use bcrypt to compare the password
    const bcrypt = require("bcrypt");
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("Password mismatch");
      req.flash("error", "Invalid email or password");
      return res.redirect("/users/login");
    }

    console.log("Login successful for user:", user.id);

    // Set user session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      fullName: user.fullName,
      role: user.role,
    };

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        req.flash("error", "Session error");
        return res.redirect("/users/login");
      }

      console.log("User session saved successfully:", req.session.user);

      // Redirect based on user role
      if (user.role === "admin") {
        console.log("Redirecting admin to /admin");
        return res.redirect("/admin");
      } else if (user.role === "artist") {
        console.log("Redirecting artist to /artist/dashboard");
        return res.redirect("/artist/dashboard");
      } else {
        return res.redirect("/users/dashboard");
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error", "An error occurred during login");
    return res.redirect("/users/login");
  }
});

router.get("/profile", async (req, res) => {
  // Check if user is in session
  if (!req.session.user) {
    return res.redirect("/users/login");
  }

  // Redirect to dashboard instead of rendering profile
  return res.redirect("/users/dashboard");
});

// New Dashboard Route
router.get("/dashboard", async (req, res) => {
  try {
    // Check if user is in session
    if (!req.session.user) {
      return res.redirect("/users/login");
    }

    const userId = req.session.user.id;

    // Get full user details from database
    const user = await User.findByPk(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    // Get user's booked events
    let upcomingEvents = [];
    let pastEvents = [];

    try {
      // Get bookings with associated events
      const bookings = await Booking.findAll({
        where: { userId },
        include: [{ model: Event }],
      });

      const now = new Date();

      // Sort events into upcoming and past
      if (bookings && bookings.length > 0) {
        bookings.forEach((booking) => {
          if (booking.Event) {
            const eventDate = new Date(booking.Event.date);
            if (eventDate > now) {
              upcomingEvents.push(booking.Event);
            } else {
              pastEvents.push(booking.Event);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    }

    // Get followed artists
    let followedArtists = [];
    try {
      // Assuming there's a model for artist follows
      const artistFollows = await ArtistFollow.findAll({
        where: { userId },
        include: [{ model: Artist }],
      });

      followedArtists = artistFollows
        .map((follow) => follow.Artist)
        .filter((artist) => artist);
    } catch (error) {
      console.error("Error fetching followed artists:", error);
    }

    // Get user activity - recent bookings, moments, etc.
    const recentActivity = [];

    // Render the dashboard
    res.render("user/dashboard", {
      title: "My Dashboard",
      user: user,
      upcomingEvents: upcomingEvents.slice(0, 3),
      pastEvents: pastEvents.slice(0, 3),
      totalUpcoming: upcomingEvents.length,
      totalPast: pastEvents.length,
      followedArtists: followedArtists.slice(0, 5),
      recentActivity: recentActivity,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/");
  }
});

// Get Edit Profile Page
router.get("/edit-profile", ensureAuthenticated, userController.getEditProfile);

// Add profile edit route that matches dashboard link
router.get("/profile/edit", ensureAuthenticated, (req, res) => {
  res.redirect("/users/edit-profile");
});

// User's events route (upcoming and past)
router.get("/events", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const filter = req.query.filter || "upcoming";

    // Get user's booked events
    const bookings = await Booking.findAll({
      where: { userId },
      include: [{ model: Event }],
    });

    const now = new Date();
    let events = [];

    // Filter events based on query parameter
    if (bookings && bookings.length > 0) {
      events = bookings
        .filter((booking) => booking.Event)
        .map((booking) => booking.Event)
        .filter((event) => {
          const eventDate = new Date(event.date);
          if (filter === "past") {
            return eventDate <= now;
          } else {
            return eventDate > now;
          }
        });
    }

    res.render("user/events", {
      title: filter === "past" ? "Past Events" : "Upcoming Events",
      events: events,
      filter: filter,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching user events:", error);
    req.flash("error", "Error loading events");
    res.redirect("/users/dashboard");
  }
});

// User's tickets route
router.get("/tickets", ensureAuthenticated, userController.getUserTickets);

// View specific event ticket
router.get(
  "/events/:eventId/ticket",
  ensureAuthenticated,
  userController.getEventTicket
);

// User's followed artists
router.get("/following", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get followed artists
    const artistFollows = await ArtistFollow.findAll({
      where: { userId },
      include: [{ model: Artist }],
    });

    const followedArtists = artistFollows
      .map((follow) => follow.Artist)
      .filter((artist) => artist);

    res.render("user/following", {
      title: "Artists I Follow",
      artists: followedArtists,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching followed artists:", error);
    req.flash("error", "Error loading followed artists");
    res.redirect("/users/dashboard");
  }
});

//  Update Profile
router.post(
  "/edit-profile",
  ensureAuthenticated,
  upload.single("profilePicture"),
  userController.updateProfile
);

//  Check Authentication Status API
router.get("/check-auth", (req, res) => {
  if (req.session.user) {
    res.json({
      isAuthenticated: true,
      user: {
        id: req.session.user.id,
        name: req.session.user.name,
        role: req.session.user.role,
      },
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

//  Logout User
router.get("/logout", userController.logoutUser);

//  Redirect /register to /signup for clarity
router.get("/register", (req, res) => {
  res.redirect("/users/signup");
});

//  Change Password (optional alternative route)
router.get("/change-password", ensureAuthenticated, (req, res) => {
  res.render("changePassword", { title: "Change Password" });
});

router.post(
  "/change-password",
  ensureAuthenticated,
  userController.updateProfile
);

// Add this route to check if login worked
router.get("/check-session", (req, res) => {
  console.log("Current session:", req.session);
  res.json({
    sessionExists: !!req.session.user,
    user: req.session.user,
  });
});

// Update user bio
router.post("/update-bio", async (req, res) => {
  try {
    const { bio } = req.body;

    // Check if user is logged in
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to update your bio",
      });
    }

    const userId = req.session.user.id;
    console.log("Updating bio for user:", userId);
    console.log("New bio:", bio);

    // Update User table
    const [userUpdateCount] = await User.update(
      { bio: bio },
      { where: { id: userId } }
    );

    // Update ClientUser table
    const [clientUpdateCount] = await ClientUser.update(
      { bio: bio },
      { where: { userId: userId } }
    );

    console.log(
      "Update results - User:",
      userUpdateCount,
      "Client:",
      clientUpdateCount
    );

    if (userUpdateCount > 0 || clientUpdateCount > 0) {
      // At least one update was successful
      res.json({
        success: true,
        message: "Bio updated successfully",
      });
    } else {
      // No records were updated
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error updating bio:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update bio",
    });
  }
});

// Export middleware for use in other routes
exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash("error", "Please login to continue");
  res.redirect("/users/login");
};

module.exports = router;
