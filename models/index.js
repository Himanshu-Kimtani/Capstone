const sequelize = require("../config/database");
const User = require("./User");
const Event = require("./Event");
const Booking = require("./Booking");
const Artist = require("./Artist");

const db = { sequelize, User, Event, Booking, Artist };

// Set up model associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
