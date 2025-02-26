const Artist = require("../models/Artist");

exports.getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.findAll();
    res.render("artists", { title: "Artists", artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id);
    if (!artist) return res.status(404).send("Artist not found");
    res.render("artist-profile", { title: artist.name, artist });
  } catch (error) {
    console.error("Error fetching artist:", error);
    res.status(500).send("Internal Server Error");
  }
};
