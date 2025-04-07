const { User, Booking, Event, Artist } = require("../models");
const bcrypt = require("bcrypt");

// Hardcoded Admin Credentials
const ADMIN_EMAIL = "admin@vynyl.com";
const ADMIN_PASSWORD = "admin123";

exports.getSignupPage = (req, res) => {
  res.render("signup", { title: "Signup - Vynyl" });
};

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate passwords match
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

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with 'user' role
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user", // Default role
    });

    console.log(`New user created: ${newUser.id} - ${newUser.email}`);
    req.flash("success", "Account created successfully! Please login.");
    res.redirect("/users/login");
  } catch (error) {
    console.error("Error registering user:", error);
    req.flash("error", "Registration failed. Please try again.");
    res.redirect("/users/signup");
  }
};

//  Render Login Page
exports.getLoginPage = (req, res) => {
  res.render("login", { title: "Login - Vynyl" });
};

//  Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      req.session.user = {
        id: 0,
        name: "Admin",
        email: ADMIN_EMAIL,
        role: "admin",
      };
      req.flash("success", "Welcome, Admin!");
      return res.redirect("/admin");
    }

    // Find user by email (for regular users)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/users/login");
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/users/login");
    }

    // Set user session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Role-based redirect
    if (user.role === "admin") {
      req.flash("success", "Welcome to Admin Dashboard!");
      return res.redirect("/admin");
    } else if (user.role === "artist") {
      return res.redirect("/artist/dashboard");
    } else {
      return res.redirect("/users/profile");
    }
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error", "An error occurred during login");
    res.redirect("/users/login");
  }
};

//  Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get full user details from database
    const user = await User.findByPk(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    // Get user's booked events (if Booking model exists)
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
      // Continue with profile display even if bookings fail
    }

    // Add this: Get all artists for the share modal
    const artists = await Artist.findAll({
      order: [["name", "ASC"]],
      attributes: ["id", "name"],
    });

    res.render("profile", {
      title: "My Profile",
      user: user,
      upcomingEvents,
      pastEvents,
      artists, // Include artists for the dropdown
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    req.flash("error", "Error loading profile");
    res.redirect("/");
  }
};

//  Render Edit Profile Page
exports.getEditProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/users/dashboard");
    }

    res.render("editProfile", {
      title: "Edit Profile",
      user: user,
    });
  } catch (error) {
    console.error("Error loading edit profile page:", error);
    req.flash("error", "Error loading edit profile page");
    res.redirect("/users/dashboard");
  }
};

//  Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { name, currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/users/dashboard");
    }

    // Update fields
    let updateFields = { name };

    // Handle password change if provided
    if (newPassword && newPassword.trim() !== "") {
      // Verify current password
      const validCurrentPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!validCurrentPassword) {
        req.flash("error", "Current password is incorrect");
        return res.redirect("/users/edit-profile");
      }

      // Check if new passwords match
      if (newPassword !== confirmPassword) {
        req.flash("error", "New passwords do not match");
        return res.redirect("/users/edit-profile");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateFields.password = hashedPassword;
    }

    // Update profile picture if uploaded
    if (req.file) {
      console.log("Profile picture uploaded:", req.file);
      updateFields.profilePhoto = req.file.filename;

      // Also update profilePicture for backward compatibility
      updateFields.profilePicture = req.file.filename;
    }

    // Update user
    await user.update(updateFields);

    // Update session
    req.session.user.name = name;

    console.log(`User profile updated: ${user.id} - ${user.email}`);
    req.flash("success", "Profile updated successfully");
    res.redirect("/users/dashboard");
  } catch (error) {
    console.error("Error updating profile:", error);
    req.flash("error", "Error updating profile: " + error.message);
    res.redirect("/users/edit-profile");
  }
};

//  Logout User
exports.logoutUser = (req, res) => {
  const userName = req.session.user ? req.session.user.name : "";

  // Store flash message before destroying session
  req.flash("success", "Logged out successfully");

  // Save flash message to a cookie for after session destruction
  const flashSuccess = req.flash();
  res.cookie("flashSuccess", JSON.stringify(flashSuccess), {
    maxAge: 30000,
    httpOnly: true,
  });

  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/");
    }

    console.log(`User logged out: ${userName}`);
    res.redirect("/?message=logged_out");
  });
};

// Get user's tickets
exports.getUserTickets = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "You must be logged in to view your tickets");
      return res.redirect("/users/login");
    }

    const userId = req.session.user.id;

    // Get user's bookings with event details
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        {
          model: Event,
          attributes: ["id", "name", "date", "location", "description"],
        },
      ],
      order: [["purchaseDate", "DESC"]],
    });

    res.render("user/tickets", {
      title: "My Tickets",
      user: req.session.user,
      bookings,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (error) {
    console.error("Error getting user tickets:", error);
    req.flash("error", "Error loading tickets");
    res.redirect("/users/dashboard");
  }
};

// Get ticket for a specific event
exports.getEventTicket = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.session.user.id;

    // Find the booking
    const booking = await Booking.findOne({
      where: {
        userId: userId,
        eventId: eventId,
      },
      include: [
        {
          model: Event,
          attributes: [
            "id",
            "name",
            "date",
            "location",
            "genre",
            "price",
            "imageUrl",
            "picture",
          ],
        },
      ],
    });

    if (!booking) {
      req.flash("error", "You have not booked this event");
      return res.redirect("/users/tickets");
    }

    // Get a ticket number (you can use the booking ID + some prefix)
    const ticketNumber = `VYNYL-${booking.id}-${Date.now()
      .toString()
      .substring(6)}`;

    res.render("user/ticket", {
      title: "Event Ticket",
      booking: booking,
      ticketNumber: ticketNumber,
      user: req.session.user,
      qrCodeData: `${process.env.BASE_URL}/tickets/verify/${ticketNumber}`,
    });
  } catch (error) {
    console.error("Error getting event ticket:", error);
    req.flash("error", "Error retrieving ticket");
    res.redirect("/users/tickets");
  }
};
