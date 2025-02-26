require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path"); // Import path module
const { sequelize } = require("./models");
const loggerMiddleware = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = 7777;

// Set View Engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set views folder

// Middleware
app.use(cors());
app.use(
  session({
    secret: "vynyl",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(loggerMiddleware);

// Load Routes
const indexRoute = require("./routes/indexRoute");
const eventsRoute = require("./routes/eventsRoute");
const usersRoute = require("./routes/usersRoute");
const artistsRoute = require("./routes/artistsRoute");
const bookingsRoute = require("./routes/bookingsRoute");
const adminRoutes = require("./routes/adminRoutes");

app.use("/", indexRoute);
app.use("/events", eventsRoute);
app.use("/users", usersRoute);
app.use("/artists", artistsRoute);
app.use("/bookings", bookingsRoute);
app.use("/admin", adminRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start server & sync database
sequelize.sync().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
});
