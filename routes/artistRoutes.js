const express = require("express");
const router = express.Router();
const { Artist, Event, User } = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Get the multer upload instance from the express app
const getMulter = (req) => {
  const uploadInstance = req.app.get("upload");
  if (uploadInstance) return uploadInstance;

  // If no instance is available, create a basic one
  const dest = req.originalUrl.includes("/events")
    ? "public/uploads/events/"
    : "public/uploads/artists/";

  return multer({
    dest: dest,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
      // Accept images only
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error("Only image files are allowed!"), false);
      }
      cb(null, true);
    },
  });
};

// Middleware to check if user is an artist
const isArtist = (req, res, next) => {
  if (req.session.user && req.session.user.role === "artist") {
    return next();
  }
  req.flash(
    "error",
    "You need to be logged in as an artist to access this page"
  );
  res.redirect("/users/login");
};

// Artist Dashboard - main landing page for logged in artists
router.get("/dashboard", isArtist, async (req, res) => {
  try {
    // Get artist information from the logged-in user
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
      include: [
        {
          model: Event,
          where: { status: "approved" },
          required: false,
        },
      ],
    });

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/users/login");
    }

    // Count upcoming events
    const upcomingEvents = artist.Events
      ? artist.Events.filter((event) => {
          return new Date(event.date) >= new Date();
        })
      : [];

    // Count past events
    const pastEvents = artist.Events
      ? artist.Events.filter((event) => {
          return new Date(event.date) < new Date();
        })
      : [];

    res.render("artist/dashboard", {
      title: "Artist Dashboard",
      user: req.session.user,
      artist: artist,
      upcomingEvents: upcomingEvents,
      pastEvents: pastEvents,
      upcomingCount: upcomingEvents.length,
      pastCount: pastEvents.length,
      totalEvents: artist.Events ? artist.Events.length : 0,
    });
  } catch (error) {
    console.error("Error loading artist dashboard:", error);
    req.flash("error", "Failed to load dashboard");
    res.redirect("/users/login");
  }
});

// Artist Profile - public view
router.get("/profile", isArtist, async (req, res) => {
  try {
    console.log("Artist profile requested for user ID:", req.session.user.id);

    // Get artist information from the logged-in user
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
      include: [
        {
          model: Event,
          required: false,
        },
      ],
    });

    console.log("Artist query result:", artist ? "Found" : "Not found");

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/users/login");
    }

    // Filter events by status after fetching
    const approvedEvents = artist.Events
      ? artist.Events.filter((event) => event.status === "approved")
      : [];

    console.log("Artist found:", artist.name);
    console.log("Events count:", approvedEvents.length);

    // Format social media data
    try {
      if (typeof artist.socialMedia === "string" && artist.socialMedia) {
        artist.socialMedia = JSON.parse(artist.socialMedia);
      }
    } catch (e) {
      console.error("Error parsing social media in route:", e);
      artist.socialMedia = {};
    }

    res.render("artist/profile", {
      title: "My Artist Profile",
      user: req.session.user,
      artist: artist,
      events: approvedEvents,
    });
  } catch (error) {
    console.error("Error loading artist profile:", error);
    console.error(error.stack);
    req.flash("error", "Failed to load profile: " + error.message);
    res.redirect("/artist/dashboard");
  }
});

// Edit Artist Profile
router.get("/profile/edit", isArtist, async (req, res) => {
  try {
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
    });

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/artist/dashboard");
    }

    res.render("artist/editProfile", {
      title: "Edit Artist Profile",
      user: req.session.user,
      artist: artist,
    });
  } catch (error) {
    console.error("Error loading edit profile form:", error);
    req.flash("error", "Failed to load edit profile form");
    res.redirect("/artist/dashboard");
  }
});

// Update Artist Profile
router.post("/profile/update", isArtist, async (req, res) => {
  try {
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
    });

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/artist/dashboard");
    }

    const { name, bio, genre, socialMedia } = req.body;

    // Update artist information
    artist.name = name;
    artist.bio = bio || artist.bio;
    artist.genre = genre || artist.genre;

    // Parse social media links if provided
    if (socialMedia) {
      artist.socialMedia =
        typeof socialMedia === "object" ? socialMedia : JSON.parse(socialMedia);
    }

    await artist.save();

    // Also update the user name to keep them in sync
    const user = await User.findByPk(req.session.user.id);
    if (user) {
      user.name = name;
      user.fullName = name;
      await user.save();

      // Update session data
      req.session.user.name = name;
      req.session.user.fullName = name;
    }

    req.flash("success", "Profile updated successfully");
    res.redirect("/artist/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    req.flash("error", "Failed to update profile");
    res.redirect("/artist/profile/edit");
  }
});

// Artist Events - list of all events
router.get("/events", isArtist, async (req, res) => {
  try {
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
      include: [
        {
          model: Event,
          required: false,
        },
      ],
    });

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/users/login");
    }

    // Sort events by date
    const events = artist.Events || [];
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.render("artist/events", {
      title: "My Events",
      user: req.session.user,
      artist: artist,
      events: events,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading artist events:", error);
    req.flash("error", "Failed to load events");
    res.redirect("/artist/dashboard");
  }
});

// Display event creation form
router.get("/events/create", isArtist, async (req, res) => {
  try {
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
    });

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/artist/dashboard");
    }

    res.render("artist/createEvent", {
      title: "Create Event",
      artist: artist,
      user: req.session.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error displaying event creation form:", error);
    req.flash("error", "Failed to load event creation form");
    res.redirect("/artist/events");
  }
});

// Handle event creation
router.post("/events/create", isArtist, async (req, res) => {
  try {
    // Use multer middleware for this request to handle file upload
    const upload = getMulter(req);

    upload.single("picture")(req, res, async function (err) {
      if (err) {
        console.error("Error uploading file:", err);
        req.flash("error", "Error uploading file: " + err.message);
        return res.redirect("/artist/events/create");
      }

      try {
        // Debug file upload
        console.log("File upload info:", req.file);

        const artist = await Artist.findOne({
          where: { userId: req.session.user.id },
        });

        if (!artist) {
          req.flash("error", "Artist profile not found");
          return res.redirect("/artist/dashboard");
        }

        const { name, date, time, location, price, genre, description } =
          req.body;

        // Debug form data
        console.log("Form data:", {
          name,
          date,
          time,
          location,
          price,
          genre,
          description,
        });

        // Ensure we have an image (either uploaded or default)
        if (!req.file) {
          req.flash("error", "Please upload an event image - it's required");
          return res.redirect("/artist/events/create");
        }

        // Make sure the file exists and we have a filename
        const imageFileName =
          req.file && req.file.filename ? req.file.filename : null;
        if (!imageFileName) {
          req.flash("error", "Image upload failed - please try again");
          return res.redirect("/artist/events/create");
        }

        // Combine date and time
        const eventDateTime = new Date(`${date}T${time}`);

        // Create the event with pending status
        const event = await Event.create({
          name,
          date: eventDateTime,
          location,
          genre: genre || "", // Provide empty string instead of null for non-nullable fields
          price,
          description: description || "",
          status: "pending", // Default to pending for artist-created events
          createdBy: req.session.user.id,
          artistId: artist.id,
          createdByAdmin: false,
          approvedByAdmin: null,
          // Handle image properly
          picture: imageFileName,
          imageUrl: imageFileName, // Both fields must match
        });

        req.flash(
          "success",
          "Event submitted successfully! It's now awaiting admin approval."
        );
        res.redirect("/artist/events");
      } catch (error) {
        console.error("Error creating event:", error);
        console.error("Error details:", error.errors); // Log detailed validation errors
        req.flash(
          "error",
          "An error occurred while creating the event: " + error.message
        );
        res.redirect("/artist/events/create");
      }
    });
  } catch (error) {
    console.error("Error in event creation route:", error);
    req.flash("error", "An unexpected error occurred");
    res.redirect("/artist/events/create");
  }
});

// Display event edit form
router.get("/events/:id/edit", isArtist, async (req, res) => {
  try {
    const eventId = req.params.id;
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
    });

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/artist/dashboard");
    }

    // Find event and check if it belongs to the artist
    const event = await Event.findOne({
      where: {
        id: eventId,
        artistId: artist.id,
        status: "pending", // Only allow editing of pending events
      },
    });

    if (!event) {
      req.flash("error", "Event not found or cannot be edited.");
      return res.redirect("/artist/events");
    }

    res.render("artist/editEvent", {
      title: "Edit Event",
      event,
      artist,
      user: req.session.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error displaying edit form:", error);
    req.flash(
      "error",
      "An error occurred while loading the edit form: " + error.message
    );
    res.redirect("/artist/events");
  }
});

// Handle event update
router.post("/events/:id/edit", isArtist, async (req, res) => {
  try {
    // Use multer middleware for this request to handle file upload
    const upload = getMulter(req);

    upload.single("picture")(req, res, async function (err) {
      if (err) {
        console.error("Error uploading file:", err);
        req.flash("error", "Error uploading file: " + err.message);
        return res.redirect(`/artist/events/${req.params.id}/edit`);
      }

      try {
        const eventId = req.params.id;
        console.log("Updating event ID:", eventId);

        const artist = await Artist.findOne({
          where: { userId: req.session.user.id },
        });

        if (!artist) {
          req.flash("error", "Artist profile not found");
          return res.redirect("/artist/dashboard");
        }

        // Find event and check if it belongs to the artist and is pending
        const event = await Event.findOne({
          where: {
            id: eventId,
            artistId: artist.id,
            status: "pending", // Only allow editing of pending events
          },
        });

        if (!event) {
          req.flash("error", "Event not found or cannot be edited.");
          return res.redirect("/artist/events");
        }

        console.log("Current event image data:", {
          picture: event.picture,
          imageUrl: event.imageUrl,
        });

        const { name, date, time, location, price, genre, description } =
          req.body;

        // Combine date and time
        const eventDateTime = new Date(`${date}T${time}`);

        // Update the event
        const updateData = {
          name,
          date: eventDateTime,
          location,
          genre: genre || "",
          price,
          description: description || "",
        };

        // Add image if uploaded
        if (req.file) {
          // Debug the uploaded file
          console.log("New file uploaded:", req.file);

          // Delete old picture if exists
          if (artist.picture) {
            const oldPicturePath = path.join(
              __dirname,
              "../public/uploads/artists",
              artist.picture
            );

            console.log("Checking for old picture at:", oldPicturePath);

            if (fs.existsSync(oldPicturePath)) {
              console.log("Deleting old picture file");
              fs.unlinkSync(oldPicturePath);
            } else {
              console.log("Old picture file not found");
            }
          }

          updateData.picture = req.file.filename;
          updateData.imageUrl = req.file.filename; // Also update imageUrl to match picture

          console.log("Updated event with new image:", {
            filename: req.file.filename,
            picture: updateData.picture,
            imageUrl: updateData.imageUrl,
          });

          // Check if the new file exists
          const newPicturePath = path.join(
            __dirname,
            "../public/uploads/events",
            req.file.filename
          );

          if (fs.existsSync(newPicturePath)) {
            console.log("New image file confirmed at:", newPicturePath);
          } else {
            console.log(
              "WARNING: New image file not found at expected location"
            );
          }
        } else {
          console.log("No new file uploaded, keeping existing image");
        }

        await event.update(updateData);
        console.log("Event updated successfully");

        req.flash("success", "Event updated successfully!");
        res.redirect("/artist/events");
      } catch (error) {
        console.error("Error updating event:", error);
        req.flash(
          "error",
          "An error occurred while updating the event: " + error.message
        );
        res.redirect(`/artist/events/${req.params.id}/edit`);
      }
    });
  } catch (error) {
    console.error("Error in event update route:", error);
    req.flash("error", "An unexpected error occurred");
    res.redirect(`/artist/events/${req.params.id}/edit`);
  }
});

// Handle event deletion
router.post("/events/:id/delete", isArtist, async (req, res) => {
  try {
    const eventId = req.params.id;
    const artist = await Artist.findOne({
      where: { userId: req.session.user.id },
    });

    if (!artist) {
      req.flash("error", "Artist profile not found");
      return res.redirect("/artist/dashboard");
    }

    // Find event and check if it belongs to the artist and is pending
    const event = await Event.findOne({
      where: {
        id: eventId,
        artistId: artist.id,
        status: "pending", // Only allow deletion of pending events
      },
    });

    if (!event) {
      req.flash("error", "Event not found or cannot be deleted.");
      return res.redirect("/artist/events");
    }

    // Delete event image if exists
    if (event.picture) {
      const picturePath = path.join(
        __dirname,
        "../public/uploads/events",
        event.picture
      );
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    // Delete the event
    await event.destroy();

    req.flash("success", "Event deleted successfully!");
    res.redirect("/artist/events");
  } catch (error) {
    console.error("Error deleting event:", error);
    req.flash(
      "error",
      "An error occurred while deleting the event: " + error.message
    );
    res.redirect("/artist/events");
  }
});

// Upload artist profile picture
router.post("/profile/picture", isArtist, async (req, res) => {
  try {
    // Use multer middleware for this request
    const upload = getMulter(req);

    // Handle the file upload
    upload.single("picture")(req, res, async function (err) {
      if (err) {
        console.error("Error uploading file:", err);
        req.flash("error", "Error uploading file: " + err.message);
        return res.redirect("/artist/profile/edit");
      }

      try {
        const artist = await Artist.findOne({
          where: { userId: req.session.user.id },
        });

        if (!artist) {
          req.flash("error", "Artist profile not found");
          return res.redirect("/artist/dashboard");
        }

        // Check if we have a file
        if (!req.file) {
          req.flash("error", "Please select an image to upload");
          return res.redirect("/artist/profile/edit");
        }

        // Delete old picture if exists
        if (artist.picture) {
          const oldPicturePath = path.join(
            __dirname,
            "../public/uploads/artists",
            artist.picture
          );
          if (fs.existsSync(oldPicturePath)) {
            fs.unlinkSync(oldPicturePath);
          }
        }

        // Update artist with new picture path
        artist.picture = req.file.filename;
        await artist.save();

        req.flash("success", "Profile picture updated successfully");
        res.redirect("/artist/profile");
      } catch (error) {
        console.error("Error updating profile picture:", error);
        req.flash(
          "error",
          "Failed to update profile picture: " + error.message
        );
        res.redirect("/artist/profile/edit");
      }
    });
  } catch (error) {
    console.error("Error in profile picture route:", error);
    req.flash("error", "An unexpected error occurred");
    res.redirect("/artist/profile/edit");
  }
});

module.exports = router;
