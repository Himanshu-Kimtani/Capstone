const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClientUser = sequelize.define(
  "ClientUser",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users', // This refers to the main User table
        key: 'id'
      },
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    bio: {
      type: DataTypes.TEXT,
      defaultValue: 'Tell us about yourself'
    },
    profilePhoto: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    backgroundImage: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    // JSON field for highlights - stores an array of objects
    highlights: {
      type: DataTypes.JSONB,
      defaultValue: [],
      get() {
        // Parse JSON if needed
        const value = this.getDataValue('highlights');
        if (value === null) return [];
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            return [];
          }
        }
        return value;
      },
      set(value) {
        // Make sure the value is properly stringified if needed
        if (value === null) {
          this.setDataValue('highlights', []);
        } else if (typeof value === 'string') {
          this.setDataValue('highlights', value);
        } else {
          this.setDataValue('highlights', value);
        }
      }
    },
    // JSON field for achievements - stores an array of strings
    achievements: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // JSON field for Spotify integration data
    spotify: {
      type: DataTypes.JSONB,
      defaultValue: {
        accessToken: null,
        refreshToken: null,
        expiresIn: null,
        tokenCreationTime: null
      }
    }
  },
  { timestamps: true }
);

module.exports = ClientUser; 