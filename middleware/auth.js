module.exports = {
  // ✅ Ensure User is Authenticated
  ensureAuthenticated: (req, res, next) => {
    if (!req.session.user) {
      req.flash("error", "Please log in first.");
      return res.redirect("/users/login");
    }
    next();
  },

  // ✅ Ensure User is Admin
  ensureAdmin: (req, res, next) => {
    if (!req.session.user || req.session.user.role !== "admin") {
      req.flash("error", "Unauthorized access.");
      return res.redirect("/");
    }
    next();
  },

  // ✅ Ensure User is Artist
  ensureArtist: (req, res, next) => {
    if (!req.session.user || req.session.user.role !== "artist") {
      req.flash("error", "Unauthorized access.");
      return res.redirect("/");
    }
    next();
  },
};
