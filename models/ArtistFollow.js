const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ArtistFollow = sequelize.define(
  "ArtistFollow",
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
    artistId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Artists",
        key: "id",
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  { timestamps: true }
);

ArtistFollow.associate = function (models) {
  ArtistFollow.belongsTo(models.User, { foreignKey: "userId" });
  ArtistFollow.belongsTo(models.Artist, { foreignKey: "artistId" });
};

module.exports = ArtistFollow;
