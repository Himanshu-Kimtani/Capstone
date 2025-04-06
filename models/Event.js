const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2), // Ensures proper financial calculations
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false, // Every event must have an image
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "approved",
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER, // Stores the User ID (Artist/Admin)
      allowNull: false,
    },
    artistId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    picture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { timestamps: true }
);

Event.associate = function (models) {
  Event.belongsTo(models.Artist, { foreignKey: "artistId" });
};

module.exports = Event;
