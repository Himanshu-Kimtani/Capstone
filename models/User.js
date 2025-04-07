const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "artist", "admin"),
      defaultValue: "user",
    },
    bio: {
      type: DataTypes.TEXT,
      defaultValue: "Tell us about yourself",
    },
    profilePhoto: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    profilePicture: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    backgroundImage: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    highlights: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  { timestamps: true }
);

User.associate = function (models) {
  // Temporarily comment this out
  // User.hasMany(models.FeedPost, { foreignKey: 'userId' });
};

module.exports = User;
