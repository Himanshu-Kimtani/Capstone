const express = require("express");
const router = express.Router();
const SpotifyWebApi = require("spotify-web-api-node");

// Create a Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Log the configured redirect URI on startup
console.log("Spotify Redirect URI:", process.env.SPOTIFY_REDIRECT_URI);

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
  console.log("Session in status check:", {
    hasAccessToken: !!req.session.spotifyAccessToken,
    hasRefreshToken: !!req.session.spotifyRefreshToken,
    userId: req.session.user ? req.session.user.id : null,
  });

  const connected = !!req.session.spotifyAccessToken;
  console.log(
    "Spotify status check:",
    connected ? "Connected" : "Not connected"
  );

  // Force the session to save any changes
  req.session.save((err) => {
    if (err) {
      console.error("Error saving session:", err);
    }
    res.json({ connected });
  });
});

// Initiate Spotify connection
router.get("/connect", isLoggedIn, (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "playlist-read-private",
    "playlist-read-collaborative",
  ];

  // Generate and log the complete authorize URL for debugging
  const authorizeURL = spotifyApi.createAuthorizeURL(
    scopes,
    req.session.user.id
  );
  console.log("Spotify Authorization URL:", authorizeURL);

  // Redirect directly to Spotify authorization page instead of returning JSON
  res.redirect(authorizeURL);
});

// Handle Spotify callback
router.get("/callback", async (req, res) => {
  try {
    console.log("Spotify callback received with query params:", req.query);
    const { code } = req.query;

    if (!code) {
      const error = req.query.error || "No authorization code received";
      console.error("Spotify callback error:", error);
      req.flash("error", `Spotify connection failed: ${error}`);
      return res.redirect("/users/dashboard");
    }

    console.log("Exchanging authorization code for tokens...");
    const data = await spotifyApi.authorizationCodeGrant(code);

    // Save tokens in session
    req.session.spotifyAccessToken = data.body["access_token"];
    req.session.spotifyRefreshToken = data.body["refresh_token"];
    console.log("Spotify tokens received and saved to session:", {
      hasAccessToken: !!req.session.spotifyAccessToken,
      accessTokenLength: req.session.spotifyAccessToken
        ? req.session.spotifyAccessToken.length
        : 0,
      hasRefreshToken: !!req.session.spotifyRefreshToken,
    });

    // Set tokens on API object
    spotifyApi.setAccessToken(data.body["access_token"]);
    spotifyApi.setRefreshToken(data.body["refresh_token"]);

    // Make sure the session is saved before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session after Spotify auth:", err);
        req.flash("error", "Failed to save Spotify connection to your session");
      } else {
        console.log("Session successfully saved with Spotify tokens");
        req.flash("success", "Successfully connected to Spotify!");
      }
      res.redirect("/users/dashboard");
    });
  } catch (error) {
    console.error("Spotify callback error details:", error);
    req.flash("error", "Failed to connect to Spotify: " + error.message);
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
    console.log("Spotify playlists request received");

    if (!req.session.spotifyAccessToken) {
      console.log("No Spotify access token found for playlists request");
      return res
        .status(401)
        .json({ error: "Not connected to Spotify", playlists: [] });
    }

    // Set access token
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    console.log("Requesting playlists from Spotify API...");

    try {
      // Get playlists
      const response = await spotifyApi.getUserPlaylists({ limit: 50 });

      console.log("Playlists response received:", {
        hasBody: !!response.body,
        itemsCount:
          response.body && response.body.items ? response.body.items.length : 0,
      });

      if (!response.body || !response.body.items) {
        console.log("No playlists found in response");
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

      console.log(`Returning ${playlists.length} playlists`);
      res.json({ playlists });
    } catch (apiError) {
      console.error("Spotify API error:", apiError);

      // Check if token expired
      if (apiError.statusCode === 401) {
        console.log("Token expired, attempting refresh for playlists request");

        try {
          spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
          const refreshData = await spotifyApi.refreshAccessToken();
          req.session.spotifyAccessToken = refreshData.body.access_token;
          console.log("Access token refreshed successfully");

          // Retry with new token
          spotifyApi.setAccessToken(req.session.spotifyAccessToken);
          const response = await spotifyApi.getUserPlaylists({ limit: 50 });

          if (!response.body || !response.body.items) {
            console.log("No playlists found after token refresh");
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

          console.log(
            `Returning ${playlists.length} playlists after token refresh`
          );
          res.json({ playlists });
          return;
        } catch (refreshError) {
          console.error("Token refresh failed for playlists:", refreshError);
          return res.status(401).json({
            error: "Session expired. Please reconnect to Spotify.",
            errorDetail: refreshError.message,
            playlists: [],
          });
        }
      }

      // For other errors
      return res.status(apiError.statusCode || 500).json({
        error: "Failed to get playlists",
        errorDetail: apiError.message,
        playlists: [],
      });
    }
  } catch (error) {
    console.error("Unexpected error in playlists route:", error);
    res.status(500).json({
      error: "Server error while getting playlists",
      errorDetail: error.message,
      playlists: [],
    });
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
