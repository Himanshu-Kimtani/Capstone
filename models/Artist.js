const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Artist = sequelize.define(
  "Artist",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    genre: { type: DataTypes.STRING, allowNull: false },
    bio: { type: DataTypes.TEXT, allowNull: true },
  },
  { timestamps: true }
);

Artist.associate = (models) => {
  Artist.hasMany(models.Event, { foreignKey: "artistId", as: "events" });
};

module.exports = Artist;
