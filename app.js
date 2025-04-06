// Middleware for file uploads
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const express = require("express");

// Ensure uploads directories exist
const artistUploadsDir = path.join(__dirname, "public/uploads/artists");
const eventUploadsDir = path.join(__dirname, "public/uploads/events");

if (!fs.existsSync(path.join(__dirname, "public/uploads"))) {
  fs.mkdirSync(path.join(__dirname, "public/uploads"), { recursive: true });
}

if (!fs.existsSync(artistUploadsDir)) {
  fs.mkdirSync(artistUploadsDir, { recursive: true });
}

if (!fs.existsSync(eventUploadsDir)) {
  fs.mkdirSync(eventUploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on route
    if (req.originalUrl.includes("/artist/profile")) {
      cb(null, artistUploadsDir);
    } else if (
      req.originalUrl.includes("/events") ||
      req.originalUrl.includes("/event")
    ) {
      cb(null, eventUploadsDir);
    } else {
      cb(null, path.join(__dirname, "public/uploads"));
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Make upload available app-wide
app.set("upload", upload);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Double-check that uploads are served properly
console.log(
  "Setting up static file serving for uploads:",
  path.join(__dirname, "public/uploads")
);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
