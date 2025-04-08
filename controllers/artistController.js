const { Artist, User, Event, ArtistFollow } = require("../models");
const { Op } = require("sequelize");

exports.getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.findAll({
      order: [["name", "ASC"]],
    });

    res.render("artists", { title: "Artists", artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getArtistById = async (req, res) => {
  try {
    const artistId = parseInt(req.params.id, 10);
    if (isNaN(artistId)) return res.status(400).send("Invalid artist ID"); // ✅ Prevents crashes

    const artist = await Artist.findByPk(artistId, {
      include: [{ model: Event, as: "events" }], // ✅ Include artist's events
    });

    if (!artist) return res.status(404).send("Artist not found");

    res.render("artist-profile", { title: artist.name, artist });
  } catch (error) {
    console.error("Error fetching artist:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Display event creation form
exports.getCreateEventForm = async (req, res) => {
  try {
    res.render("artist/createEvent", {
      title: "Create Event",
      artist: req.session.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error displaying event creation form:", error);
    req.flash("error", "An error occurred while loading the form.");
    res.redirect("/artist/events");
  }
};

// Create new event (status: pending)
exports.createEvent = async (req, res) => {
  try {
    const { name, date, time, location, price, genre, description } = req.body;

    // Combine date and time
    const eventDateTime = new Date(`${date}T${time}`);

    // Create the event with pending status
    const event = await Event.create({
      name,
      date: eventDateTime,
      location,
      genre: genre || null,
      price,
      description: description || null,
      status: "pending", // Default to pending for artist-created events
      createdBy: req.session.user.id,
      artistId: req.session.user.id,
      createdByAdmin: false,
      approvedByAdmin: null,
      // Handle image upload if provided
      picture: req.file ? req.file.filename : null,
    });

    req.flash(
      "success",
      "Event submitted successfully! It's now awaiting admin approval."
    );
    res.redirect("/artist/events");
  } catch (error) {
    console.error("Error creating event:", error);
    req.flash("error", "An error occurred while creating the event.");
    res.redirect("/artist/events/create");
  }
};

// Display event edit form
exports.getEditEventForm = async (req, res) => {
  try {
    const eventId = req.params.id;
    const artistId = req.session.user.id;

    // Find event and check if it belongs to the artist
    const event = await Event.findOne({
      where: {
        id: eventId,
        artistId: artistId,
        status: "pending", // Only allow editing of pending events
      },
    });

    if (!event) {
      req.flash("error", "Event not found or cannot be edited.");
      return res.redirect("/artist/events");
    }

    res.render("artist/editEvent", {
      title: "Edit Event",
      event,
      artist: req.session.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error displaying edit form:", error);
    req.flash("error", "An error occurred while loading the edit form.");
    res.redirect("/artist/events");
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const artistId = req.session.user.id;
    const { name, date, time, location, price, genre, description } = req.body;

    // Combine date and time
    const eventDateTime = new Date(`${date}T${time}`);

    // Find event and check if it belongs to the artist and is pending
    const event = await Event.findOne({
      where: {
        id: eventId,
        artistId: artistId,
        status: "pending", // Only allow editing of pending events
      },
    });

    if (!event) {
      req.flash("error", "Event not found or cannot be edited.");
      return res.redirect("/artist/events");
    }

    // Update the event
    const updateData = {
      name,
      date: eventDateTime,
      location,
      genre: genre || null,
      price,
      description: description || null,
    };

    // Add image if uploaded
    if (req.file) {
      updateData.picture = req.file.filename;
    }

    await event.update(updateData);

    req.flash("success", "Event updated successfully!");
    res.redirect("/artist/events");
  } catch (error) {
    console.error("Error updating event:", error);
    req.flash("error", "An error occurred while updating the event.");
    res.redirect(`/artist/events/${req.params.id}/edit`);
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const artistId = req.session.user.id;

    // Find event and check if it belongs to the artist and is pending
    const event = await Event.findOne({
      where: {
        id: eventId,
        artistId: artistId,
        status: "pending", // Only allow deletion of pending events
      },
    });

    if (!event) {
      req.flash("error", "Event not found or cannot be deleted.");
      return res.redirect("/artist/events");
    }

    // Delete the event
    await event.destroy();

    req.flash("success", "Event deleted successfully!");
    res.redirect("/artist/events");
  } catch (error) {
    console.error("Error deleting event:", error);
    req.flash("error", "An error occurred while deleting the event.");
    res.redirect("/artist/events");
  }
};

// Get all artists for discovery page
exports.getDiscoverArtists = async (req, res) => {
  try {
    const artists = await Artist.findAll({
      include: [
        {
          model: Event,
          required: false,
          where: {
            date: {
              [Op.gte]: new Date(),
            },
          },
        },
        {
          model: User,
          as: "followersList",
          through: ArtistFollow,
          attributes: ["id"],
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    res.render("artists/discover", {
      title: "Discover Artists",
      artists,
      user: req.session.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    req.flash("error", "Failed to load artists");
    res.redirect("/");
  }
};

// Follow/Unfollow artist
exports.toggleFollow = async (req, res) => {
  try {
    const artistId = req.params.id;
    const userId = req.session.user.id;

    console.log(
      `[FOLLOW] User ${userId} attempting to toggle follow for artist ${artistId}`
    );

    // Check if already following
    const existingFollow = await ArtistFollow.findOne({
      where: { userId, artistId },
    });

    let result;
    if (existingFollow) {
      // Unfollow
      await existingFollow.destroy();
      result = {
        success: true,
        action: "unfollow",
        message: "Successfully unfollowed artist",
      };
      console.log(`[FOLLOW] User ${userId} unfollowed artist ${artistId}`);
    } else {
      // Follow
      await ArtistFollow.create({ userId, artistId });
      result = {
        success: true,
        action: "follow",
        message: "Successfully followed artist",
      };
      console.log(`[FOLLOW] User ${userId} followed artist ${artistId}`);
    }

    // Send JSON response for fetch API
    res.json(result);
  } catch (error) {
    console.error("[FOLLOW] Error in toggleFollow:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update follow status",
    });
  }
};

// Get artist profile
exports.getArtistProfile = async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          where: {
            date: {
              [Op.gte]: new Date(),
            },
          },
          required: false,
          order: [["date", "ASC"]],
        },
        {
          model: User,
          as: "followersList",
          through: ArtistFollow,
          attributes: ["id", "name"], // Include name for potential future use
          required: false,
        },
      ],
    });

    if (!artist) {
      req.flash("error", "Artist not found");
      return res.redirect("/artists/discover");
    }

    // Log followers count for debugging
    console.log(
      `[ARTIST PROFILE] Artist ${artist.id} has ${
        artist.followersList ? artist.followersList.length : 0
      } followers`
    );

    res.render("artists/profile", {
      title: `${artist.name} | Vynyl`,
      artist,
      user: req.session.user,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching artist profile:", error);
    req.flash("error", "Failed to load artist profile");
    res.redirect("/artists/discover");
  }
};
