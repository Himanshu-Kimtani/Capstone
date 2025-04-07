require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { sequelize } = require("./models");
const loggerMiddleware = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 7778;

// Set View Engine to EJS
app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views")]);

// Middleware
app.use(cors());

// Initialize session
const sessionStore = new SequelizeStore({
  db: sequelize,
});

app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "vynyl_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
    store: sessionStore,
  })
);

// The Sessions table will be created in the setupDatabase function
// No need to call sessionStore.sync() here

app.use(flash());

// Make flash messages & user data available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || null;
  next();
});

// Add cookie flash message handling
app.use((req, res, next) => {
  if (req.cookies && req.cookies.flashSuccess) {
    const flashMessages = JSON.parse(req.cookies.flashSuccess);
    res.locals.success = flashMessages.success;
    res.clearCookie("flashSuccess");
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(loggerMiddleware);

// Ensure Upload Directory Exists
const fs = require("fs");
const uploadDir = path.join(__dirname, "public/uploads/gallery");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create directories for artist uploads
const artistsUploadDir = path.join(__dirname, "public/uploads/artists");
if (!fs.existsSync(artistsUploadDir)) {
  fs.mkdirSync(artistsUploadDir, { recursive: true });
}

// Create directories for event uploads
const eventsUploadDir = path.join(__dirname, "public/uploads/events");
if (!fs.existsSync(eventsUploadDir)) {
  fs.mkdirSync(eventsUploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Check the route to determine the appropriate upload directory
    if (req.originalUrl.includes("/artist/profile/picture")) {
      cb(null, artistsUploadDir);
    } else {
      cb(null, uploadDir); // Default to gallery uploads
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Make multer available to routes
app.set("upload", upload);

// Authentication middleware
const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash("error", "Please login to continue");
    return res.redirect("/users/login");
  }
  next();
};

const checkAdminAuth = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/auth/login");
  }
  next();
};

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use(
  "/admin",
  (req, res, next) => {
    console.log("Admin route accessed, session:", req.session.user);

    // Check if user is admin
    if (!req.session.user || req.session.user.role !== "admin") {
      console.log("Non-admin tried to access admin area");
      req.flash("error", "Admin access required");
      return res.redirect("/users/login");
    }

    console.log("Admin authenticated, proceeding to admin routes");
    next();
  },
  require("./routes/adminRoutes")
);

// Artist routes with middleware to check for artist role
app.use(
  "/artist",
  (req, res, next) => {
    console.log("Artist route accessed, session:", req.session.user);

    // Check if user is an artist
    if (!req.session.user || req.session.user.role !== "artist") {
      console.log("Non-artist tried to access artist area");
      req.flash("error", "Artist access required");
      return res.redirect("/users/login");
    }

    console.log("Artist authenticated, proceeding to artist routes");
    next();
  },
  require("./routes/artistRoutes")
);

app.use("/events", require("./routes/eventRoutes"));
app.use("/users", require("./routes/usersRoute"));
app.use("/artists", require("./routes/artistRoutes"));
app.use("/bookings", require("./routes/bookingsRoute"));
app.use("/gallery", require("./routes/galleryRoute"));
app.use("/moments", require("./routes/momentRoutes"));
app.use("/spotify", require("./routes/spotifyRoutes"));

// Add these routes to your server.js
app.use("/events", require("./routes/paymentRoutes"));
app.use("/webhooks", require("./routes/webhookRoutes"));

// Add root route handler
app.use("/", require("./routes/indexRoute")); // This should be last after other routes

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Error destroying session:", err);
    res.clearCookie("connect.sid");
    res.redirect("/?message=logged_out");
  });
});

// Error Handling Middleware
app.use(errorHandler);

// Sync all models with the database, respecting dependencies
const setupDatabase = async () => {
  try {
    console.log("Starting database setup...");

    // Check database connection
    await sequelize.authenticate();
    console.log("Database connection established");

    // Only create the Sessions table if it doesn't exist
    await sessionStore.sync({ force: false });
    console.log("Sessions table ready");

    // Set alter to true to add missing columns
    console.log("Checking database tables...");
    await sequelize.sync({ force: false, alter: true });
    console.log("Database ready");

    return true;
  } catch (err) {
    console.error("Error connecting to database:", err);
    return false;
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  setupDatabase().then((success) => {
    if (success) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT}`);
      });
    } else {
      console.error("Failed to set up database. Server not started.");
    }
  });
}

module.exports = app;
