const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false }, // Changed to UUID
    eventId: { type: DataTypes.UUID, allowNull: false }, // Changed to UUID
    tickets: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  { timestamps: true }
);

// Associations
Booking.associate = (models) => {
  Booking.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  Booking.belongsTo(models.Event, { foreignKey: "eventId", as: "event" });
};

module.exports = Booking;
