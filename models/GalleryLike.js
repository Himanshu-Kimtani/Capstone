const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GalleryLike = sequelize.define(
  "GalleryLike",
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
  },
  {
    timestamps: true,
    indexes: [
      // Composite unique index to prevent duplicate likes
      {
        unique: true,
        fields: ["imageId", "userId"],
      },
    ],
  }
);

// Define associations
GalleryLike.associate = function (models) {
  GalleryLike.belongsTo(models.User, { foreignKey: "userId", as: "user" });
  GalleryLike.belongsTo(models.Gallery, { foreignKey: "imageId", as: "image" });
};

module.exports = GalleryLike;
