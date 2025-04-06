const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Moment = sequelize.define(
  "Moment",
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
    mediaType: {
      type: DataTypes.ENUM("image", "video"),
      defaultValue: "image",
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
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
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Events",
        key: "id",
      },
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    privacy: {
      type: DataTypes.ENUM("public", "followers", "private"),
      defaultValue: "public",
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPromoted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isReported: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "Moments",
    timestamps: true,
    indexes: [
      {
        name: "moments_userid_index",
        fields: ["userId"],
      },
      {
        name: "moments_artistid_index",
        fields: ["artistId"],
      },
      {
        name: "moments_eventid_index",
        fields: ["eventId"],
      },
    ],
  }
);

Moment.associate = function (models) {
  Moment.belongsTo(models.User, { foreignKey: "userId" });
  Moment.belongsTo(models.Artist, { foreignKey: "artistId" });
  Moment.belongsTo(models.Venue, { foreignKey: "venueId" });
  Moment.belongsTo(models.Event, { foreignKey: "eventId" });
  Moment.hasMany(models.MomentComment, { foreignKey: "momentId" });
  Moment.hasMany(models.MomentLike, { foreignKey: "momentId" });
};

module.exports = Moment;
