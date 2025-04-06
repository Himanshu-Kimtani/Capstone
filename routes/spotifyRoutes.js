const express = require("express");
const router = express.Router();
const SpotifyWebApi = require("spotify-web-api-node");

// Create a Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash("error", "You must be logged in to access this page");
    res.redirect("/users/login");
  }
};

// Check connection status
router.get("/status", isLoggedIn, (req, res) => {
  const connected = !!req.session.spotifyAccessToken;
  console.log(
    "Spotify status check:",
    connected ? "Connected" : "Not connected"
  );
  res.json({ connected });
});

// Initiate Spotify connection
router.get("/connect", isLoggedIn, (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
  ];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  res.json({ url: authorizeURL });
});

// Handle Spotify callback
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const data = await spotifyApi.authorizationCodeGrant(code);

    // Save tokens in session
    req.session.spotifyAccessToken = data.body["access_token"];
    req.session.spotifyRefreshToken = data.body["refresh_token"];

    // Set tokens on API object
    spotifyApi.setAccessToken(data.body["access_token"]);
    spotifyApi.setRefreshToken(data.body["refresh_token"]);

    res.redirect("/users/dashboard");
  } catch (error) {
    console.error("Spotify callback error:", error);
    req.flash("error", "Failed to connect to Spotify");
    res.redirect("/users/dashboard");
  }
});

// Get current playback state
router.get("/playback", isLoggedIn, async (req, res) => {
  try {
    console.log("Spotify playback request received");

    if (!req.session.spotifyAccessToken) {
      console.log("No Spotify access token found");
      return res.status(401).json({ error: "Not connected to Spotify" });
    }

    // Set the access token
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);

    // Get playback state
    const data = await spotifyApi.getMyCurrentPlaybackState();
    console.log("Playback state received:", data.body ? "Yes" : "No");

    if (data.body && data.body.item) {
      // Calculate progress percentage
      const progress = data.body.progress_ms || 0;
      const duration = data.body.item.duration_ms || 1; // Avoid division by zero
      const progressPercent = Math.min((progress / duration) * 100, 100);

      res.json({
        isPlaying: data.body.is_playing,
        track: {
          name: data.body.item.name,
          artist: data.body.item.artists[0].name,
          albumArt:
            data.body.item.album.images[0]?.url ||
            "/images/album/album-art.jpeg",
          progress: progress,
          duration: duration,
          percent: progressPercent,
          currentTime: formatTime(progress),
          totalTime: formatTime(duration),
        },
      });
    } else {
      console.log("No track currently playing");
      res.json({ isPlaying: false, track: null });
    }
  } catch (error) {
    console.error("Spotify playback error:", error);

    // Check if token expired
    if (error.statusCode === 401) {
      try {
        console.log("Token expired, attempting refresh");
        spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
        const data = await spotifyApi.refreshAccessToken();
        req.session.spotifyAccessToken = data.body["access_token"];

        // Retry the request with new token
        spotifyApi.setAccessToken(req.session.spotifyAccessToken);
        const playbackData = await spotifyApi.getMyCurrentPlaybackState();

        if (playbackData.body && playbackData.body.item) {
          const progress = playbackData.body.progress_ms || 0;
          const duration = playbackData.body.item.duration_ms || 1;
          const progressPercent = Math.min((progress / duration) * 100, 100);

          res.json({
            isPlaying: playbackData.body.is_playing,
            track: {
              name: playbackData.body.item.name,
              artist: playbackData.body.item.artists[0].name,
              albumArt:
                playbackData.body.item.album.images[0]?.url ||
                "/images/album/album-art.jpeg",
              progress: progress,
              duration: duration,
              percent: progressPercent,
              currentTime: formatTime(progress),
              totalTime: formatTime(duration),
            },
          });
          return;
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }

    res.status(500).json({ error: "Failed to get playback state" });
  }
});

// Playback controls
router.post("/playback/:action", isLoggedIn, async (req, res) => {
  try {
    if (!req.session.spotifyAccessToken) {
      return res.status(401).json({ error: "Not connected to Spotify" });
    }

    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    const { action } = req.params;

    switch (action) {
      case "play":
        await spotifyApi.play();
        break;
      case "pause":
        await spotifyApi.pause();
        break;
      case "next":
        await spotifyApi.skipToNext();
        break;
      case "previous":
        await spotifyApi.skipToPrevious();
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Playback control error:", error);
    res.status(500).json({ error: "Failed to control playback" });
  }
});

// Get user playlists
router.get("/playlists", isLoggedIn, async (req, res) => {
  try {
    if (!req.session.spotifyAccessToken) {
      return res.status(401).json({ error: "Not connected to Spotify" });
    }

    // Set access token
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);

    // Get playlists
    const response = await spotifyApi.getUserPlaylists({ limit: 50 });

    if (!response.body || !response.body.items) {
      return res.json({ playlists: [] });
    }

    const playlists = response.body.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || "",
      imageUrl:
        playlist.images && playlist.images.length > 0
          ? playlist.images[0].url
          : null,
      trackCount: playlist.tracks ? playlist.tracks.total : 0,
    }));

    res.json({ playlists });
  } catch (error) {
    console.error("Playlist error:", error.message);

    // Try token refresh if unauthorized
    if (error.statusCode === 401) {
      try {
        spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
        const refreshData = await spotifyApi.refreshAccessToken();
        req.session.spotifyAccessToken = refreshData.body.access_token;

        // Retry with new token
        spotifyApi.setAccessToken(req.session.spotifyAccessToken);
        const response = await spotifyApi.getUserPlaylists({ limit: 50 });

        if (!response.body || !response.body.items) {
          return res.json({ playlists: [] });
        }

        const playlists = response.body.items.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || "",
          imageUrl:
            playlist.images && playlist.images.length > 0
              ? playlist.images[0].url
              : null,
          trackCount: playlist.tracks ? playlist.tracks.total : 0,
        }));

        res.json({ playlists });
        return;
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }

    res.status(500).json({ error: "Failed to get playlists" });
  }
});

// Get playlist tracks
router.get("/playlists/:id/tracks", isLoggedIn, async (req, res) => {
  try {
    if (!req.session.spotifyAccessToken) {
      return res.status(401).json({ error: "Not connected to Spotify" });
    }

    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    const data = await spotifyApi.getPlaylistTracks(req.params.id);

    if (!data.body || !data.body.items) {
      return res.json({ tracks: [] });
    }

    const tracks = data.body.items.map((item) => {
      const track = item.track;
      return {
        id: track.id,
        name: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        duration: formatTime(track.duration_ms),
        albumArt:
          track.album.images && track.album.images.length > 0
            ? track.album.images[0].url
            : null,
        uri: track.uri,
      };
    });

    res.json({ tracks });
  } catch (error) {
    console.error("Error getting playlist tracks:", error);
    res.status(500).json({ error: "Failed to get playlist tracks" });
  }
});

// Helper function to format milliseconds to MM:SS
function formatTime(ms) {
  if (!ms || typeof ms !== "number") return "0:00";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

module.exports = router;
