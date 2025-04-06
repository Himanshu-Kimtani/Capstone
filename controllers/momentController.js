const db = require("../models");
const Moment = db.Moment;
const User = db.User;
const Artist = db.Artist;
const Venue = db.Venue;
const Event = db.Event;
const MomentComment = db.MomentComment;
const MomentLike = db.MomentLike;
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");

// Create a new moment
exports.createMoment = async (req, res) => {
  try {
    console.log("Creating moment. Session user:", req.session.user);

    if (!req.session.user) {
      req.flash("error", "You must be logged in to share moments");
      return res.redirect("/users/login");
    }

    const { caption, artistId, venueId, eventId, venueName, location } =
      req.body;

    console.log("Form data:", {
      caption,
      artistId,
      venueId,
      eventId,
      venueName,
      location,
    });

    // Ensure we have a file
    if (!req.file) {
      req.flash("error", "Please upload an image or video");
      return res.redirect("/moments/new");
    }

    console.log("File uploaded:", req.file);

    // Determine media type
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const isVideo = [".mp4", ".mov", ".avi", ".webm"].includes(fileExtension);
    const mediaType = isVideo ? "video" : "image";

    console.log("Creating moment with models:", { Moment: typeof Moment });

    // Always set privacy to public
    // Create moment
    const moment = await Moment.create({
      userId: req.session.user.id,
      mediaType: mediaType,
      mediaUrl: req.file.filename,
      caption: caption,
      artistId: artistId || null,
      venueId: venueId || null,
      eventId: eventId || null,
      venueName: venueName || null,
      privacy: "public", // Always public
      location: location || null,
      tags: [], // Empty array for now
    });

    console.log("Moment created successfully:", moment.id);
    req.flash("success", "Your moment has been shared!");
    return res.redirect("/moments/gallery");
  } catch (error) {
    console.error("Error creating moment:", error);
    req.flash("error", "Error sharing moment: " + error.message);
    return res.redirect("/moments/new");
  }
};

// Get form to create a new moment
exports.getNewMomentForm = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "You must be logged in to share moments");
      return res.redirect("/users/login");
    }

    // Get artists and events to populate the form
    const artists = await Artist.findAll({
      order: [["name", "ASC"]],
      attributes: ["id", "name"],
    });

    const events = await Event.findAll({
      where: {
        date: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 90)),
        },
      },
      order: [["date", "DESC"]],
      attributes: ["id", "name", "date", "location"],
    });

    const venues = await Venue.findAll({
      order: [["name", "ASC"]],
      attributes: ["id", "name", "location"],
    });

    res.render("user/createMoment", {
      title: "Share a Moment",
      user: req.session.user,
      artists,
      events,
      venues,
    });
  } catch (error) {
    console.error("Error loading new moment form:", error);
    req.flash("error", "Error loading form: " + error.message);
    return res.redirect("/users/dashboard");
  }
};

// Get all moments (gallery view - public)
exports.getAllMoments = async (req, res) => {
  try {
    console.log("Loading gallery page...");

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    // Filters
    const artistId = req.query.artist;
    const venueId = req.query.venue;
    const search = req.query.search;

    // Query conditions
    const where = {
      privacy: "public",
    };

    // Add filters if provided
    if (artistId) where.artistId = artistId;
    if (venueId) where.venueId = venueId;
    if (search) {
      where[Op.or] = [
        { caption: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { venueName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Check if Moment table exists
    try {
      // Get total count for pagination
      const totalCount = await Moment.count({ where });
      const totalPages = Math.ceil(totalCount / limit);

      // Get moments with user and artist info
      const moments = await Moment.findAll({
        where,
        include: [
          { model: User, attributes: ["id", "name", "profilePhoto"] },
          { model: Artist, attributes: ["id", "name", "genre"] },
          { model: Event, attributes: ["id", "name", "date"] },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      // Format for display
      const formattedMoments = moments.map((moment) => {
        const momentObj = moment.get({ plain: true });

        // Calculate time ago string
        const timeAgo = getTimeAgo(moment.createdAt);

        return {
          ...momentObj,
          timeAgo,
        };
      });

      res.render("gallery", {
        title: "Moments Gallery",
        moments: formattedMoments,
        user: req.session.user,
        currentPage: page,
        totalPages,
        artistId,
        venueId,
        search,
      });
    } catch (err) {
      console.error("Error with Moment table:", err);
      // If there's an error with the Moment table, render empty gallery
      res.render("gallery", {
        title: "Moments Gallery",
        moments: [],
        user: req.session.user,
        currentPage: 1,
        totalPages: 0,
        artistId: null,
        venueId: null,
        search: null,
      });
    }
  } catch (error) {
    console.error("Error getting moments gallery:", error);
    req.flash("error", "Error loading gallery: " + error.message);
    return res.redirect("/");
  }
};

// Get user's moments
exports.getUserMoments = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "You must be logged in to view your moments");
      return res.redirect("/users/login");
    }

    const userId = req.session.user.id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    // Get moments count
    const totalCount = await Moment.count({ where: { userId } });
    const totalPages = Math.ceil(totalCount / limit);

    // Get moments
    const moments = await Moment.findAll({
      where: { userId },
      include: [
        { model: Artist, attributes: ["id", "name"] },
        { model: Event, attributes: ["id", "name", "date"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.render("user/myMoments", {
      title: "My Moments",
      moments,
      user: req.session.user,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error getting user moments:", error);
    req.flash("error", "Error loading your moments: " + error.message);
    return res.redirect("/users/dashboard");
  }
};

// Get a single moment details
exports.getMomentDetails = async (req, res) => {
  try {
    const momentId = req.params.id;

    const moment = await Moment.findByPk(momentId, {
      include: [
        { model: User, attributes: ["id", "name", "profilePhoto"] },
        { model: Artist, attributes: ["id", "name", "genre"] },
        { model: Event, attributes: ["id", "name", "date", "location"] },
        {
          model: MomentComment,
          include: [
            { model: User, attributes: ["id", "name", "profilePhoto"] },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!moment) {
      req.flash("error", "Moment not found");
      return res.redirect("/gallery");
    }

    // Check privacy settings
    if (
      moment.privacy !== "public" &&
      (!req.session.user || moment.userId !== req.session.user.id)
    ) {
      req.flash("error", "You don't have permission to view this moment");
      return res.redirect("/gallery");
    }

    // Format time
    const timeAgo = getTimeAgo(moment.createdAt);

    // Get total likes
    const likeCount = await MomentLike.count({ where: { momentId } });

    // Check if current user has liked
    let userLiked = false;
    if (req.session.user) {
      userLiked =
        (await MomentLike.findOne({
          where: { momentId, userId: req.session.user.id },
        })) !== null;
    }

    res.render("moments/details", {
      title: "Moment Details",
      moment,
      timeAgo,
      likeCount,
      userLiked,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error getting moment details:", error);
    req.flash("error", "Error loading moment: " + error.message);
    return res.redirect("/gallery");
  }
};

// Like a moment
exports.likeMoment = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to like moments",
      });
    }

    const momentId = req.params.id;
    const userId = req.session.user.id;

    // Check if moment exists
    const moment = await Moment.findByPk(momentId);
    if (!moment) {
      return res
        .status(404)
        .json({ success: false, message: "Moment not found" });
    }

    // Check if already liked
    const existingLike = await MomentLike.findOne({
      where: { momentId, userId },
    });

    if (existingLike) {
      // Unlike
      await existingLike.destroy();

      // Update like count
      await Moment.update(
        { likes: sequelize.literal("likes - 1") },
        { where: { id: momentId } }
      );

      return res.json({ success: true, liked: false });
    } else {
      // Like
      await MomentLike.create({
        momentId,
        userId,
      });

      // Update like count
      await Moment.update(
        { likes: sequelize.literal("likes + 1") },
        { where: { id: momentId } }
      );

      return res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error("Error liking moment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add a comment to a moment
exports.addComment = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "You must be logged in to comment");
      return res.redirect(`/moments/${req.params.id}`);
    }

    const momentId = req.params.id;
    const userId = req.session.user.id;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      req.flash("error", "Comment cannot be empty");
      return res.redirect(`/moments/${momentId}`);
    }

    // Create comment
    await MomentComment.create({
      momentId,
      userId,
      content,
    });

    req.flash("success", "Comment added");
    return res.redirect(`/moments/${momentId}`);
  } catch (error) {
    console.error("Error adding comment:", error);
    req.flash("error", "Error adding comment: " + error.message);
    return res.redirect(`/moments/${req.params.id}`);
  }
};

// Delete a moment (owner only)
exports.deleteMoment = async (req, res) => {
  try {
    if (!req.session.user) {
      req.flash("error", "You must be logged in");
      return res.redirect("/users/login");
    }

    const momentId = req.params.id;
    const userId = req.session.user.id;

    // Find the moment
    const moment = await Moment.findByPk(momentId);

    if (!moment) {
      req.flash("error", "Moment not found");
      return res.redirect("/users/moments");
    }

    // Check ownership
    if (moment.userId !== userId && req.session.user.role !== "admin") {
      req.flash("error", "You don't have permission to delete this moment");
      return res.redirect("/users/moments");
    }

    // Delete associated files
    if (moment.mediaUrl) {
      const filePath = path.join(
        __dirname,
        "../public/uploads/moments",
        moment.mediaUrl
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete associated comments and likes
    await MomentComment.destroy({ where: { momentId } });
    await MomentLike.destroy({ where: { momentId } });

    // Delete the moment
    await moment.destroy();

    req.flash("success", "Moment deleted successfully");
    return res.redirect("/moments/user");
  } catch (error) {
    console.error("Error deleting moment:", error);
    req.flash("error", "Error deleting moment: " + error.message);
    return res.redirect("/users/moments");
  }
};

// Utility functions
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + " years ago";
  if (interval === 1) return "1 year ago";

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + " months ago";
  if (interval === 1) return "1 month ago";

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + " days ago";
  if (interval === 1) return "1 day ago";

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + " hours ago";
  if (interval === 1) return "1 hour ago";

  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + " minutes ago";
  if (interval === 1) return "1 minute ago";

  if (seconds < 10) return "just now";

  return Math.floor(seconds) + " seconds ago";
}
