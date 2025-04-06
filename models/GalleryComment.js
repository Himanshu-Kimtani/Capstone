const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GalleryComment = sequelize.define(
  "GalleryComment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    imageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Galleries",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { timestamps: true }
);

// Define associations
GalleryComment.associate = function (models) {
  GalleryComment.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  GalleryComment.belongsTo(models.Gallery, {
    foreignKey: "imageId",
    as: "image",
  });
};

module.exports = GalleryComment;
