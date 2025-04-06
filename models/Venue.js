const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venue = sequelize.define('Venue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  imageUrl: {
    type: DataTypes.STRING
  },
  capacity: {
    type: DataTypes.INTEGER
  },
  contactInfo: {
    type: DataTypes.STRING
  },
  websiteUrl: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'venues',
  timestamps: true
});

Venue.associate = function(models) {
  // Venue.hasMany(models.FeedPost, { foreignKey: 'venueId' });
};

module.exports = Venue; 