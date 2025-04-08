const sequelize = require("../config/database");
const User = require("./User");
const Event = require("./Event");
const Booking = require("./Booking");
const Artist = require("./Artist");
const Gallery = require("./Gallery");
// Import the new models directly like your existing models
const GalleryComment = require("./GalleryComment");
const GalleryLike = require("./GalleryLike");
const { DataTypes } = require("sequelize");
const ClientUser = require("./ClientUser");
const FeedPost = require("./FeedPost");
const Venue = require("./Venue");
const Moment = require("./Moment");
const MomentComment = require("./MomentComment");
const MomentLike = require("./MomentLike");
const ArtistFollow = require("./ArtistFollow");

// Add all models to the db object
const db = {
  sequelize,
  User,
  Event,
  Booking,
  Artist,
  Gallery,
  GalleryComment,
  GalleryLike,
  ClientUser,
  FeedPost,
  Venue,
  Moment,
  MomentComment,
  MomentLike,
  ArtistFollow,
};

// Set up associations for all models
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

// Define relationships
User.hasOne(ClientUser, {
  foreignKey: "userId",
  as: "clientProfile",
});

ClientUser.belongsTo(User, {
  foreignKey: "userId",
});

// Venue.hasMany(FeedPost, { foreignKey: 'venueId' });
// FeedPost.belongsTo(Venue, { foreignKey: 'venueId' });

// Add Artist Follow relationships
User.belongsToMany(Artist, {
  through: ArtistFollow,
  foreignKey: "userId",
  as: "followedArtistsList",
});

Artist.belongsToMany(User, {
  through: ArtistFollow,
  foreignKey: "artistId",
  as: "followersList",
});

module.exports = db;
