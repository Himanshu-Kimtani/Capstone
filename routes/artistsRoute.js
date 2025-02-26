const express = require("express");
const router = express.Router();
const artistController = require("../controllers/artistController");

// Get all artists
router.get("/", artistController.getAllArtists);

// Get details of a specific artist by ID
router.get("/:id", artistController.getArtistById);

module.exports = router;
