const { User, Event, Artist, Gallery, Support, Venue } = require("../models");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const bcrypt = require("bcrypt");

// Dashboard controller
exports.getDashboard = async (req, res) => {
  try {
    const stats = {
      artistCount: await Artist.count(),
      venueCount: await Venue.count(),
      eventCount: await Event.count(),
      userCount: await User.count(),
    };

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      stats,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    req.flash("error", "Error loading dashboard");
    res.redirect("/admin");
  }
};

// User management controllers
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin");
    }
    await user.destroy();
    req.flash("success", "User deleted successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting user:", error);
    req.flash("error", "Failed to delete user.");
    res.redirect("/admin");
  }
};

exports.promoteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin");
    }
    user.role = "artist";
    await user.save();
    req.flash("success", `${user.name} is now an artist.`);
    res.redirect("/admin");
  } catch (error) {
    console.error("Error promoting user:", error);
    req.flash("error", "Failed to promote user.");
    res.redirect("/admin");
  }
};

exports.demoteArtist = async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id);
    if (!artist) {
      req.flash("error", "Artist not found.");
      return res.redirect("/admin");
    }
    const user = await User.findByPk(artist.userId);
    user.role = "user";
    await user.save();
    await artist.destroy(); // Remove artist profile
    req.flash("success", `${user.name} is now a regular user.`);
    res.redirect("/admin");
  } catch (error) {
    console.error("Error demoting artist:", error);
    req.flash("error", "Failed to demote artist.");
    res.redirect("/admin");
  }
};

// Event management controllers
exports.approveEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      req.flash("error", "Event not found.");
      return res.redirect("/admin");
    }
    event.status = "approved";
    await event.save();
    req.flash("success", "Event approved successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error approving event:", error);
    req.flash("error", "Failed to approve event.");
    res.redirect("/admin");
  }
};

exports.rejectEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      req.flash("error", "Event not found.");
      return res.redirect("/admin");
    }
    event.status = "rejected";
    await event.save();
    req.flash("success", "Event rejected.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error rejecting event:", error);
    req.flash("error", "Failed to reject event.");
    res.redirect("/admin");
  }
};

exports.getCreateEventForm = async (req, res) => {
  try {
    res.render("createEvent", {
      user: req.session.user,
      title: "Create Event",
    });
  } catch (error) {
    console.error("Error loading create event form:", error);
    req.flash("error", "Failed to load create event form.");
    res.redirect("/admin");
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { name, artistName, price, location, date, genre } = req.body;
    // Use the uploaded file's filename for imageUrl if available
    const imageUrl = req.file ? req.file.filename : null;

    // Add explicit debugging
    console.log("CREATE EVENT FUNCTION CALLED");
    console.log("Form data:", {
      name,
      artistName,
      price,
      location,
      date,
      imageUrl,
      genre,
    });

    // Find or create artist based on name
    let artist;
    if (artistName) {
      // Look for existing artist with this name
      artist = await Artist.findOne({ where: { name: artistName } });

      // If artist doesn't exist, create a new one
      if (!artist) {
        artist = await Artist.create({
          name: artistName,
          genre: genre || "Unknown", // Use event genre or 'Unknown' as default
          bio: `Artist for ${name} event`, // Default bio
        });
        console.log("NEW ARTIST CREATED:", artist.toJSON());
      }
    }

    // Force status to be approved
    const newEvent = await Event.create({
      name,
      artistId: artist ? artist.id : null,
      price,
      location,
      date,
      imageUrl, // Changed from picture to imageUrl
      genre,
      createdBy: req.session.user.id, // Set createdBy to admin's user ID
      status: "approved",
    });

    console.log("EVENT CREATED SUCCESSFULLY:", newEvent.toJSON());

    req.flash("success", "Event created successfully!");
    res.redirect("/admin?action=created");
  } catch (error) {
    console.error("EVENT CREATION ERROR:", error);
    req.flash("error", `Event creation failed: ${error.message}`);
    res.redirect("/admin/event/create");
  }
};

exports.getEditEventForm = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [Artist],
    });

    if (!event) {
      req.flash("error", "Event not found.");
      return res.redirect("/admin");
    }

    res.render("editEvent", {
      event,
      user: req.session.user,
      title: "Edit Event",
    });
  } catch (error) {
    console.error("Error loading event edit form:", error);
    req.flash("error", "Failed to load event edit form.");
    res.redirect("/admin");
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      req.flash("error", "Event not found.");
      return res.redirect("/admin");
    }

    const { name, artistName, price, location, date, genre } = req.body;

    // Find or create artist based on name
    let artistId = null;
    if (artistName) {
      // Look for existing artist with this name
      let artist = await Artist.findOne({ where: { name: artistName } });

      // If artist doesn't exist, create a new one
      if (!artist) {
        artist = await Artist.create({
          name: artistName,
          genre: genre || "Unknown",
          bio: `Artist for ${name} event`,
        });
        console.log("NEW ARTIST CREATED:", artist.toJSON());
      }

      artistId = artist.id;
    }

    event.name = name;
    event.artistId = artistId;
    event.price = price;
    event.location = location;
    event.date = date;
    if (genre) event.genre = genre;

    if (req.file) {
      // Save to both fields to ensure consistency
      event.picture = req.file.filename;
      event.imageUrl = req.file.filename;

      console.log("Updated event with new image:", {
        filename: req.file.filename,
        picture: event.picture,
        imageUrl: event.imageUrl,
      });
    }

    await event.save();

    req.flash("success", "Event updated successfully.");
    res.redirect("/admin?action=updated");
  } catch (error) {
    console.error("Error updating event:", error);
    req.flash("error", "Failed to update event.");
    res.redirect("/admin");
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      req.flash("error", "Event not found.");
      return res.redirect("/admin");
    }

    await event.destroy();

    req.flash("success", "Event deleted successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting event:", error);
    req.flash("error", "Failed to delete event.");
    res.redirect("/admin");
  }
};

// Artist management controllers
exports.getCreateArtistForm = (req, res) => {
  res.render("createArtist", {
    user: req.session.user,
  });
};

exports.createArtist = async (req, res) => {
  try {
    const { name, bio, genre, email, password, confirmPassword, username } =
      req.body;
    const imageUrl = req.file ? `/uploads/artists/${req.file.filename}` : null;
    const picture = req.file ? req.file.filename : null;

    // Validate password match
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/admin/artist/create");
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash("error", "Email already in use");
      return res.redirect("/admin/artist/create");
    }

    // Create user account for the artist
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name,
      fullName: name,
      email: email,
      password: hashedPassword, // Now properly hashed
      role: "artist",
      bio: bio || "Artist at Vynyl",
    });

    console.log("Created user account for artist:", newUser.id);

    // Create the artist profile linked to the user
    const newArtist = await Artist.create({
      name,
      bio,
      genre,
      picture,
      userId: newUser.id,
      isVerified: true,
      socialMedia: req.body.socialMedia || {},
    });

    console.log("Created artist profile:", newArtist.id);

    req.flash("success", "Artist created successfully with login credentials");
    res.redirect("/admin?action=created");
  } catch (error) {
    console.error("Error creating artist:", error);
    req.flash("error", `Error creating artist: ${error.message}`);
    res.redirect("/admin/artist/create");
  }
};

exports.verifyArtist = async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id);
    if (!artist) {
      req.flash("error", "Artist not found.");
      return res.redirect("/admin");
    }

    artist.isVerified = true;
    await artist.save();

    req.flash("success", `Artist "${artist.name}" has been verified.`);
    res.redirect("/admin");
  } catch (error) {
    console.error("Error verifying artist:", error);
    req.flash("error", "Failed to verify artist.");
    res.redirect("/admin");
  }
};

exports.getEditArtistForm = async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id, {
      include: [{ model: User }],
    });

    if (!artist) {
      req.flash("error", "Artist not found.");
      return res.redirect("/admin");
    }

    // Log if user is associated for debugging
    if (artist.User) {
      console.log(
        `Artist ${artist.id} is linked to user ${artist.User.id} (${artist.User.email})`
      );
    } else {
      console.log(`Artist ${artist.id} has no linked user account`);
    }

    res.render("editArtist", {
      artist,
      user: req.session.user,
      title: `Edit Artist - ${artist.name}`,
    });
  } catch (error) {
    console.error("Error loading artist edit form:", error);
    req.flash("error", `Failed to load artist edit form: ${error.message}`);
    res.redirect("/admin");
  }
};

exports.updateArtist = async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id, {
      include: [{ model: User }],
    });

    if (!artist) {
      req.flash("error", "Artist not found.");
      return res.redirect("/admin");
    }

    const {
      name,
      bio,
      genre,
      socialMedia,
      email,
      password,
      confirmPassword,
      resetPassword,
    } = req.body;

    // Update artist profile
    artist.name = name;
    artist.bio = bio;
    artist.genre = genre;
    artist.socialMedia = socialMedia || {};

    if (req.file) {
      artist.picture = req.file.filename;
    }

    await artist.save();

    // Update associated user if it exists
    if (artist.userId) {
      const user = await User.findByPk(artist.userId);

      if (user) {
        // Update basic info
        user.name = name;
        user.fullName = name;

        // Update email if provided
        if (email && email !== user.email) {
          // Check if email is already in use by another user
          const existingUser = await User.findOne({
            where: {
              email,
              id: { [sequelize.Op.ne]: user.id },
            },
          });

          if (existingUser) {
            req.flash("error", "Email already in use by another account");
            return res.redirect(`/admin/artist/${artist.id}/edit`);
          }

          user.email = email;
        }

        // Update password if requested
        if (resetPassword === "yes" && password) {
          if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match");
            return res.redirect(`/admin/artist/${artist.id}/edit`);
          }

          // Hash the password before saving
          const hashedPassword = await bcrypt.hash(password, 10);
          user.password = hashedPassword;
        }

        await user.save();
      }
    } else if (email && password) {
      // Create new user account for this artist if credentials are provided
      if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match");
        return res.redirect(`/admin/artist/${artist.id}/edit`);
      }

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        req.flash("error", "Email already in use");
        return res.redirect(`/admin/artist/${artist.id}/edit`);
      }

      // Create user account for the artist
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name: name,
        fullName: name,
        email: email,
        password: hashedPassword, // Now properly hashed
        role: "artist",
        bio: bio || "Artist at Vynyl",
      });

      // Link artist to user
      artist.userId = newUser.id;
      await artist.save();
    }

    req.flash("success", "Artist updated successfully.");
    res.redirect("/admin?action=updated");
  } catch (error) {
    console.error("Error updating artist:", error);
    req.flash("error", `Failed to update artist: ${error.message}`);
    res.redirect(`/admin/artist/${req.params.id}/edit`);
  }
};

exports.deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id);
    if (!artist) {
      req.flash("error", "Artist not found.");
      return res.redirect("/admin");
    }

    await artist.destroy();

    req.flash("success", "Artist deleted successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting artist:", error);
    req.flash("error", "Failed to delete artist.");
    res.redirect("/admin");
  }
};

// Gallery management controllers
exports.getGallery = async (req, res) => {
  try {
    const galleryImages = await Gallery.findAll({
      include: [{ model: User, attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });

    res.render("adminGallery", {
      galleryImages,
      totalImages: galleryImages.length,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error loading gallery:", error);
    req.flash("error", "Failed to load gallery.");
    res.redirect("/admin");
  }
};

exports.deleteGalleryImage = async (req, res) => {
  try {
    const image = await Gallery.findByPk(req.params.id);
    if (!image) {
      req.flash("error", "Image not found.");
      return res.redirect("/admin/gallery");
    }

    // Delete the file from the server
    const imagePath = path.join(
      __dirname,
      "../public/uploads/gallery",
      image.imageUrl
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await image.destroy();

    req.flash("success", "Image deleted successfully.");
    res.redirect("/admin/gallery");
  } catch (error) {
    console.error("Error deleting image:", error);
    req.flash("error", "Failed to delete image.");
    res.redirect("/admin/gallery");
  }
};

// Support management controllers
exports.getSupport = async (req, res) => {
  try {
    const supportTickets = await Support.findAll({
      include: [{ model: User, attributes: ["name", "email"] }],
      order: [["createdAt", "DESC"]],
    });

    res.render("adminSupport", {
      supportTickets,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error loading support tickets:", error);
    req.flash("error", "Failed to load support tickets.");
    res.redirect("/admin");
  }
};

exports.respondToTicket = async (req, res) => {
  try {
    const ticket = await Support.findByPk(req.params.id);
    if (!ticket) {
      req.flash("error", "Support ticket not found.");
      return res.redirect("/admin/support");
    }

    const { response } = req.body;

    ticket.adminResponse = response;
    ticket.status = "responded";
    ticket.respondedAt = new Date();
    ticket.respondedBy = req.session.user.id;

    await ticket.save();

    req.flash("success", "Response sent successfully.");
    res.redirect("/admin/support");
  } catch (error) {
    console.error("Error responding to ticket:", error);
    req.flash("error", "Failed to send response.");
    res.redirect("/admin/support");
  }
};

// Authentication
exports.logout = (req, res) => {
  // Store a temp variable for redirection
  const redirectUrl = "/";

  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/admin");
    }

    // Clear the cookie
    res.clearCookie("connect.sid");

    // Redirect to home page
    res.redirect(redirectUrl);
  });
};

// User edit form
exports.getUserEditForm = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin");
    }

    res.render("editUser", {
      user,
      currentUser: req.session.user,
    });
  } catch (error) {
    console.error("Error loading user edit form:", error);
    req.flash("error", "Failed to load user edit form.");
    res.redirect("/admin");
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/admin");
    }

    const { name, email, role } = req.body;

    user.name = name;
    user.email = email;
    user.role = role;

    await user.save();

    // If changing role to artist, create artist profile if it doesn't exist
    if (role === "artist") {
      const existingArtist = await Artist.findOne({
        where: { userId: user.id },
      });
      if (!existingArtist) {
        await Artist.create({
          name: user.name,
          userId: user.id,
          bio: "",
          genre: "",
          socialMedia: "",
          isVerified: true,
        });
      }
    }

    req.flash("success", "User updated successfully.");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error updating user:", error);
    req.flash("error", "Failed to update user.");
    res.redirect("/admin");
  }
};

// User list management
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
    });

    res.render("admin/users", {
      title: "Users Management",
      users,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    req.flash("error", "Failed to load users list");
    res.redirect("/admin");
  }
};

// Artist list management
exports.getArtists = async (req, res) => {
  try {
    const artists = await Artist.findAll({
      include: [
        {
          model: Event,
          attributes: ["id"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.render("admin/artists", {
      title: "Artists Management",
      artists,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    req.flash("error", "Failed to load artists list");
    res.redirect("/admin");
  }
};
