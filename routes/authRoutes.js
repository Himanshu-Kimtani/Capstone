const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models");

// Show login form
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// Handle login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // If no user found or password doesn't match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/auth/login");
    }

    // Set user session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Redirect based on user role
    if (user.role === "admin") {
      res.redirect("/admin");
    } else if (user.role === "artist") {
      res.redirect("/artist/dashboard");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error", "An error occurred during login");
    res.redirect("/auth/login");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/auth/login");
});

module.exports = router;
