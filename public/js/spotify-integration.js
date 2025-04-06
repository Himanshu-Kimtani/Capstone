// Spotify Integration JavaScript

// DOM Elements
let currentTrackElement;
let albumArtElement;
let trackNameElement;
let artistNameElement;
let progressBarElement;
let currentTimeElement;
let totalTimeElement;
let playPauseButton;
let prevButton;
let nextButton;
let connectButton;
let playerControls;
let spotifySection;
let nowPlayingSection;
let playlistContainer;
let playlistsDropdown;

// State tracking
let isPlaying = false;
let connected = false;
let currentUpdateInterval = null;
let currentTrack = null;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize elements
  initElements();

  // Check Spotify connection status
  checkSpotifyStatus();

  // Add event listeners
  addEventListeners();
});

function initElements() {
  // Get all the DOM elements
  currentTrackElement = document.getElementById("current-track");
  albumArtElement = document.getElementById("album-art");
  trackNameElement = document.getElementById("track-name");
  artistNameElement = document.getElementById("artist-name");
  progressBarElement = document.getElementById("progress-bar");
  currentTimeElement = document.getElementById("current-time");
  totalTimeElement = document.getElementById("total-time");
  playPauseButton = document.getElementById("play-pause-button");
  prevButton = document.getElementById("prev-button");
  nextButton = document.getElementById("next-button");
  connectButton = document.getElementById("spotify-connect");
  playerControls = document.getElementById("player-controls");
  spotifySection = document.getElementById("spotify-section");
  nowPlayingSection = document.getElementById("now-playing");
  playlistContainer = document.getElementById("playlist-container");
  playlistsDropdown = document.getElementById("playlists-dropdown");
}

function addEventListeners() {
  // Connect to Spotify
  if (connectButton) {
    connectButton.addEventListener("click", connectToSpotify);
  }

  // Playback controls
  if (playPauseButton) {
    playPauseButton.addEventListener("click", togglePlayPause);
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => controlPlayback("previous"));
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => controlPlayback("next"));
  }

  // Playlist dropdown
  if (playlistsDropdown) {
    playlistsDropdown.addEventListener("change", loadPlaylistTracks);
  }
}

function checkSpotifyStatus() {
  fetch("/spotify/status")
    .then((response) => response.json())
    .then((data) => {
      connected = data.connected;
      updateUIBasedOnConnection();

      if (connected) {
        loadPlaylists();
        updateCurrentTrack();
        // Start polling for track updates
        startTrackUpdates();
      }
    })
    .catch((error) => {
      console.error("Error checking Spotify status:", error);
      connected = false;
      updateUIBasedOnConnection();
    });
}

function updateUIBasedOnConnection() {
  if (spotifySection) {
    if (connected) {
      // Show player controls
      if (connectButton) connectButton.style.display = "none";
      if (playerControls) playerControls.style.display = "flex";
      if (nowPlayingSection) nowPlayingSection.style.display = "block";
      if (playlistContainer) playlistContainer.style.display = "block";
    } else {
      // Show connect button
      if (connectButton) connectButton.style.display = "block";
      if (playerControls) playerControls.style.display = "none";
      if (nowPlayingSection) nowPlayingSection.style.display = "none";
      if (playlistContainer) playlistContainer.style.display = "none";
    }
  }
}

function connectToSpotify() {
  fetch("/spotify/connect")
    .then((response) => response.json())
    .then((data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    })
    .catch((error) => {
      console.error("Error connecting to Spotify:", error);
    });
}

function updateCurrentTrack() {
  fetch("/spotify/playback")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.track) {
        currentTrack = data.track;
        isPlaying = data.isPlaying;

        // Update UI elements
        updateTrackInfo(data.track);
        updatePlayPauseButton();
      } else {
        // No track playing
        displayNoTrackPlaying();
      }
    })
    .catch((error) => {
      console.error("Error updating current track:", error);
      if (error.message.includes("401")) {
        // Token expired, reconnect
        connected = false;
        updateUIBasedOnConnection();
      }
    });
}

function updateTrackInfo(track) {
  if (!track) return;

  // Update album art
  if (albumArtElement) {
    albumArtElement.src = track.albumArt;
    albumArtElement.alt = `${track.name} album art`;
  }

  // Update track name
  if (trackNameElement) {
    trackNameElement.textContent = track.name;
  }

  // Update artist name
  if (artistNameElement) {
    artistNameElement.textContent = track.artist;
  }

  // Update progress bar
  if (progressBarElement) {
    progressBarElement.style.width = `${track.percent}%`;
  }

  // Update time display
  if (currentTimeElement) {
    currentTimeElement.textContent = track.currentTime;
  }

  if (totalTimeElement) {
    totalTimeElement.textContent = track.totalTime;
  }

  // Show the track info
  if (nowPlayingSection) {
    nowPlayingSection.style.display = "block";
  }
}

function displayNoTrackPlaying() {
  if (nowPlayingSection) {
    // Set default image and text
    if (albumArtElement) {
      albumArtElement.src = "/images/album/album-art.jpeg";
      albumArtElement.alt = "No track playing";
    }

    if (trackNameElement) {
      trackNameElement.textContent = "No track playing";
    }

    if (artistNameElement) {
      artistNameElement.textContent = "Open Spotify and play something";
    }

    // Reset progress
    if (progressBarElement) {
      progressBarElement.style.width = "0%";
    }

    if (currentTimeElement) {
      currentTimeElement.textContent = "0:00";
    }

    if (totalTimeElement) {
      totalTimeElement.textContent = "0:00";
    }

    // Still show the section
    nowPlayingSection.style.display = "block";
  }
}

function updatePlayPauseButton() {
  if (playPauseButton) {
    if (isPlaying) {
      playPauseButton.innerHTML = '<i class="fas fa-pause"></i>';
      playPauseButton.setAttribute("title", "Pause");
    } else {
      playPauseButton.innerHTML = '<i class="fas fa-play"></i>';
      playPauseButton.setAttribute("title", "Play");
    }
  }
}

function togglePlayPause() {
  const action = isPlaying ? "pause" : "play";
  controlPlayback(action);
}

function controlPlayback(action) {
  fetch(`/spotify/playback/${action}`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update state
        if (action === "play") isPlaying = true;
        if (action === "pause") isPlaying = false;

        // Immediate UI update
        updatePlayPauseButton();

        // Get latest track info after a short delay
        setTimeout(updateCurrentTrack, 300);
      }
    })
    .catch((error) => {
      console.error(`Error controlling playback (${action}):`, error);
    });
}

function startTrackUpdates() {
  // Stop any existing interval
  if (currentUpdateInterval) {
    clearInterval(currentUpdateInterval);
  }

  // Check for updates every 5 seconds
  currentUpdateInterval = setInterval(updateCurrentTrack, 5000);
}

function loadPlaylists() {
  if (!playlistsDropdown) return;

  fetch("/spotify/playlists")
    .then((response) => response.json())
    .then((data) => {
      if (data.playlists && data.playlists.length > 0) {
        // Clear dropdown
        playlistsDropdown.innerHTML =
          '<option value="">Select a playlist</option>';

        // Add playlists to dropdown
        data.playlists.forEach((playlist) => {
          const option = document.createElement("option");
          option.value = playlist.id;
          option.textContent = `${playlist.name} (${playlist.trackCount} tracks)`;
          playlistsDropdown.appendChild(option);
        });

        // Show the playlist section
        if (playlistContainer) {
          playlistContainer.style.display = "block";
        }
      }
    })
    .catch((error) => {
      console.error("Error loading playlists:", error);
    });
}

function loadPlaylistTracks() {
  const playlistId = playlistsDropdown.value;
  if (!playlistId) return;

  const tracksContainer = document.getElementById("playlist-tracks");
  if (!tracksContainer) return;

  // Show loading indicator
  tracksContainer.innerHTML = "<p>Loading tracks...</p>";

  fetch(`/spotify/playlists/${playlistId}/tracks`)
    .then((response) => response.json())
    .then((data) => {
      if (data.tracks && data.tracks.length > 0) {
        tracksContainer.innerHTML =
          '<table class="tracks-table"><thead><tr><th>Title</th><th>Artist</th><th>Album</th><th>Duration</th></tr></thead><tbody></tbody></table>';

        const tbody = tracksContainer.querySelector("tbody");

        data.tracks.forEach((track) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                        <td>${track.name}</td>
                        <td>${track.artist}</td>
                        <td>${track.album}</td>
                        <td>${track.duration}</td>
                    `;
          tbody.appendChild(row);
        });
      } else {
        tracksContainer.innerHTML = "<p>No tracks found in this playlist</p>";
      }
    })
    .catch((error) => {
      console.error("Error loading playlist tracks:", error);
      tracksContainer.innerHTML =
        "<p>Error loading tracks. Please try again.</p>";
    });
}
