// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/client/auth/login');
};

// Middleware to check if user is a guest (not authenticated)
exports.isGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/client/user/profile');
}; 