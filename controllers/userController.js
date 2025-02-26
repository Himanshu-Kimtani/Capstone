const User = require("../models/User");
const bcrypt = require("bcrypt");

// Hardcoded Admin Credentials
const ADMIN_EMAIL = "admin@vynyl.com";
const ADMIN_PASSWORD = "admin123";

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash("error", "User already exists.");
      return res.redirect("/users/register");
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    await User.create({ name, email, password: hashedPassword });

    req.flash("success", "Registration successful! Please log in.");
    res.redirect("/users/login");
  } catch (error) {
    console.error("Error registering user:", error);
    req.flash("error", "Internal Server Error");
    res.redirect("/users/register");
  }
};

// Login User (Using Sessions)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if entered credentials are for admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      req.session.user = { isAdmin: true, email };
      return res.redirect("/admin"); // Redirect to Admin Dashboard
    }

    // ✅ Check if it's a normal user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/users/login");
    }

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/users/login");
    }

    // ✅ Store user session and redirect to profile page
    req.session.user = { id: user.id, name: user.name, email: user.email };

    req.flash("success", "Login successful!");
    res.redirect("/users/profile");
  } catch (error) {
    console.error("Error logging in:", error);
    req.flash("error", "Internal Server Error");
    res.redirect("/users/login");
  }
};

// Get Profile (Ensure user is logged in)
exports.getProfile = async (req, res) => {
  if (!req.session.user) {
    req.flash("error", "Please log in first.");
    return res.redirect("/users/login");
  }

  try {
    res.render("profile", { title: "My Profile", user: req.session.user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    req.flash("error", "Internal Server Error");
    res.redirect("/");
  }
};

// Logout User (Destroy Session)
exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    req.flash("success", "Logged out successfully.");
    res.redirect("/users/login");
  });
};
