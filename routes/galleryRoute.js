const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  Gallery,
  User,
  Artist,
  GalleryComment,
  GalleryLike,
  sequelize,
} = require("../models");
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");

// ✅ Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: "./public/uploads/gallery",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extName = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      return cb(new Error("Only JPEG, JPG, and PNG files are allowed."));
    }
  },
});

// ✅ Display Gallery Page with Uploaded Images
router.get("/", async (req, res) => {
  try {
    // Get all images with user and artist info
    const images = await Gallery.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "profilePicture"],
        },
        { model: Artist, as: "artist", attributes: ["id", "name", "picture"] },
      ],
    });

    // Get all artists for the upload form
    const artists = await Artist.findAll({
      order: [["name", "ASC"]],
      attributes: ["id", "name"],
    });

    // Get user's likes for UI state
    let userLikes = [];
    if (req.session.user) {
      const likes = await GalleryLike.findAll({
        where: { userId: req.session.user.id },
        attributes: ["imageId"],
      });
      userLikes = likes.map((like) => like.imageId);
    }

    res.render("gallery", {
      title: "Concert Gallery",
      images,
      artists,
      userLikes,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    req.flash("error", "Error loading gallery.");
    res.redirect("/");
  }
});

// ✅ Upload an Image (Only for Logged-in Users)
router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        req.flash("error", "Please select an image to upload.");
        return res.redirect("/gallery");
      }

      console.log("Image upload - form data:", {
        caption: req.body.caption,
        artistId: req.body.artistId,
        venueName: req.body.venueName,
        category: req.body.category,
      });

      // Create the new gallery post
      const newImage = await Gallery.create({
        userId: req.session.user.id,
        imageUrl: `/uploads/gallery/${req.file.filename}`,
        caption: req.body.caption || "",
        artistId: req.body.artistId || null,
        venueName: req.body.venueName || null,
        category: req.body.category || "Concert", // Default to Concert
      });

      console.log(`New gallery post created with ID: ${newImage.id}`);

      // Add success message
      req.flash("success", "Your moment has been shared!");

      // Redirect to gallery with highlight parameter
      res.redirect(`/gallery?highlight=${newImage.id}`);
    } catch (error) {
      console.error("Error uploading image:", error);
      req.flash("error", "Error uploading image: " + error.message);
      res.redirect("/gallery");
    }
  }
);

// ✅ Get Comments for an Image
router.get("/:id/comments", ensureAuthenticated, async (req, res) => {
  try {
    const comments = await GalleryComment.findAll({
      where: { imageId: req.params.id },
      order: [["createdAt", "ASC"]],
      include: [{ model: User, as: "user", attributes: ["id", "name"] }],
    });

    res.json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, error: "Failed to load comments" });
  }
});

// ✅ Add Comment to an Image
router.post("/:id/comment", ensureAuthenticated, async (req, res) => {
  try {
    const { comment } = req.body;
    const imageId = req.params.id;

    if (!comment || comment.trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: "Comment cannot be empty" });
    }

    // Start a transaction
    const result = await sequelize.transaction(async (t) => {
      // Add the comment
      const newComment = await GalleryComment.create(
        {
          imageId,
          userId: req.session.user.id,
          comment,
        },
        { transaction: t }
      );

      // Update comment count on the image
      const image = await Gallery.findByPk(imageId, { transaction: t });
      await image.update(
        {
          commentsCount: image.commentsCount + 1,
        },
        { transaction: t }
      );

      return { newComment, commentsCount: image.commentsCount + 1 };
    });

    res.json({
      success: true,
      comment: result.newComment,
      commentsCount: result.commentsCount,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: "Failed to add comment" });
  }
});

// ✅ Toggle Like on an Image
router.post("/:id/like", ensureAuthenticated, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.session.user.id;

    // Start a transaction
    const result = await sequelize.transaction(async (t) => {
      // Check if user has already liked the image
      const existingLike = await GalleryLike.findOne({
        where: { imageId, userId },
        transaction: t,
      });

      const image = await Gallery.findByPk(imageId, { transaction: t });

      if (existingLike) {
        // Unlike: Remove the like
        await existingLike.destroy({ transaction: t });
        await image.update(
          {
            likesCount: Math.max(0, image.likesCount - 1),
          },
          { transaction: t }
        );

        return { liked: false, likesCount: image.likesCount - 1 };
      } else {
        // Like: Add a new like
        await GalleryLike.create(
          {
            imageId,
            userId,
          },
          { transaction: t }
        );

        await image.update(
          {
            likesCount: image.likesCount + 1,
          },
          { transaction: t }
        );

        return { liked: true, likesCount: image.likesCount + 1 };
      }
    });

    res.json({
      success: true,
      liked: result.liked,
      likesCount: result.likesCount,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, error: "Failed to process like" });
  }
});

// ✅ Delete an Image (Only for Admins)
router.get("/:id/delete", ensureAdmin, async (req, res) => {
  try {
    const image = await Gallery.findByPk(req.params.id);
    if (!image) {
      req.flash("error", "Image not found.");
      return res.redirect("/gallery");
    }

    // Delete the image file from filesystem (optional)
    const fs = require("fs");
    const filePath = path.join(__dirname, "..", "public", image.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete associated likes and comments
    await GalleryLike.destroy({ where: { imageId: image.id } });
    await GalleryComment.destroy({ where: { imageId: image.id } });

    // Delete the image record
    await image.destroy();

    req.flash("success", "Image deleted successfully.");
    res.redirect("/gallery");
  } catch (error) {
    console.error("Error deleting image:", error);
    req.flash("error", "Error deleting image.");
    res.redirect("/gallery");
  }
});

module.exports = router;
