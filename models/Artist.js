const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Artist = sequelize.define(
  "Artist",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    genre: { type: DataTypes.STRING, allowNull: false },
    bio: { type: DataTypes.TEXT, allowNull: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    socialMedia: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    picture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  { timestamps: true }
);

// ✅ Associations (Make sure models are correctly linked)
Artist.associate = function (models) {
  Artist.hasMany(models.Event, { foreignKey: "artistId" });
  Artist.belongsTo(models.User, { foreignKey: "userId" });
};

module.exports = Artist;
