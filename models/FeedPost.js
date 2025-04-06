'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FeedPost extends Model {
    static associate(models) {
      FeedPost.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  
  FeedPost.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'FeedPost',
    tableName: 'feed_posts'
  });
  
  return FeedPost;
}; 