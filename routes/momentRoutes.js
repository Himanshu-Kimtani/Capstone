const express = require("express");
const router = express.Router();
const momentController = require("../controllers/momentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../public/uploads/moments");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created uploads directory for moments:", uploadDir);
  } catch (err) {
    console.error("Error creating uploads directory:", err);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "moment-" + uniqueSuffix + ext);
  },
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = [".jpg", ".jpeg", ".png", ".gif"];
  const allowedVideoTypes = [".mp4", ".mov", ".avi", ".webm"];
  const ext = path.extname(file.originalname).toLowerCase();

  if ([...allowedImageTypes, ...allowedVideoTypes].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("error", "You must be logged in to access this page");
    res.redirect("/users/login");
  }
};

// Routes
// Public gallery
router.get("/gallery", momentController.getAllMoments);

// Redirect from root gallery to moments gallery
router.get("/", (req, res) => {
  res.redirect("/moments/gallery");
});

// Create new moment - form
router.get("/new", isLoggedIn, momentController.getNewMomentForm);

// Create new moment - process
router.post(
  "/create",
  isLoggedIn,
  upload.single("media"),
  momentController.createMoment
);

// View moment details
router.get("/:id", momentController.getMomentDetails);

// User's own moments
router.get("/user", isLoggedIn, momentController.getUserMoments);

// Like/unlike a moment
router.post("/:id/like", isLoggedIn, momentController.likeMoment);

// Add comment
router.post("/:id/comment", isLoggedIn, momentController.addComment);

// Delete moment
router.post("/:id/delete", isLoggedIn, momentController.deleteMoment);

module.exports = router;
