const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

// ✅ Render Signup Page
router.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup - Vynyl" });
});

// ✅ Handle Signup (POST) - No need for separate /register
router.post("/signup", userController.registerUser);

// ✅ Render Login Page
router.get("/login", (req, res) => {
  res.render("login", { title: "Login - Vynyl" });
});

// ✅ Login a user (POST) - Redirect to `/admin` if admin, else `/`
router.post("/login", userController.loginUser);

// ✅ Get user profile (Protected)
router.get("/profile", authMiddleware, userController.getProfile);

// ✅ Logout user
router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect("/users/login");
    });
  } else {
    res.redirect("/");
  }
});

// ✅ Redirect /register to /signup for clarity
router.get("/register", (req, res) => {
  res.redirect("/users/signup");
});

module.exports = router;
