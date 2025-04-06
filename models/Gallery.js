const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Gallery = sequelize.define(
  "Gallery",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    artistId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Artists",
        key: "id",
      },
    },
    venueId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    venueName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    likesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    commentsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    category: {
      type: DataTypes.ENUM("Concert", "Artist", "Venue", "Other"),
      defaultValue: "Other",
    },
  },
  { timestamps: true }
);

// Associations
Gallery.associate = function (models) {
  Gallery.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  Gallery.belongsTo(models.Artist, { foreignKey: "artistId", as: "artist" });
  Gallery.hasMany(models.GalleryComment, {
    foreignKey: "imageId",
    as: "comments",
  });
  Gallery.hasMany(models.GalleryLike, { foreignKey: "imageId", as: "likes" });
};

module.exports = Gallery;
