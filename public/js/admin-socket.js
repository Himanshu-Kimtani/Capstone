document.addEventListener("DOMContentLoaded", function () {
  const socket = io();

  // User created event
  socket.on("userCreated", function (data) {
    // Update total users count
    document.getElementById("totalUsersCount").textContent = data.totalUsers;

    // Add user to the users table
    const userTable = document.querySelector("#users table tbody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
      <td>${data.user.name}</td>
      <td>${data.user.email}</td>
      <td>${data.user.role}</td>
      <td class="d-flex gap-2">
        ${
          data.user.role === "user"
            ? `<form action="/admin/user/${data.user.id}/promote" method="POST" class="me-2">
            <button class="btn btn-success btn-sm">Promote to Artist</button>
          </form>`
            : data.user.role === "artist"
            ? `<form action="/admin/artist/${data.user.id}/demote" method="POST" class="me-2">
            <button class="btn btn-warning btn-sm">Demote to User</button>
          </form>`
            : ""
        }
        <a href="/admin/user/${
          data.user.id
        }/edit" class="btn btn-primary btn-sm me-2">Edit</a>
        <form action="/admin/user/${
          data.user.id
        }/delete" method="POST" class="me-2">
          <button class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete this user?')">Delete</button>
        </form>
      </td>
    `;

    // Add new row at the beginning
    if (userTable.firstChild) {
      userTable.insertBefore(newRow, userTable.firstChild);
    } else {
      userTable.appendChild(newRow);
    }

    // If there was a "No users found" message, remove it
    const noUsersRow = userTable.querySelector('td[colspan="4"].text-muted');
    if (noUsersRow) {
      noUsersRow.parentElement.remove();
    }
  });

  // Event created event
  socket.on("eventCreated", function (data) {
    // Update total events count
    document.getElementById("totalEventsCount").textContent = data.totalEvents;

    // Add event to the events table
    const eventTable = document.querySelector("#events table tbody");
    const newRow = document.createElement("tr");

    const event = data.event;
    const formattedDate = new Date(event.date).toLocaleDateString();

    newRow.innerHTML = `
      <td>
        <img src="/uploads/events/${event.picture}" 
             alt="${event.name}" 
             style="width: 50px; height: 50px; object-fit: cover">
      </td>
      <td>${event.name}</td>
      <td>${event.Artist ? event.Artist.name : "N/A"}</td>
      <td>${formattedDate}</td>
      <td>${event.location}</td>
      <td>${event.status}</td>
      <td class="d-flex gap-2">
        <a href="/admin/event/${
          event.id
        }/edit" class="btn btn-primary btn-sm me-2">Edit</a>
        <form action="/admin/event/${
          event.id
        }/delete" method="POST" class="me-2">
          <button class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete this event?')">Delete</button>
        </form>
      </td>
    `;

    // Add new row at the beginning
    if (eventTable.firstChild) {
      eventTable.insertBefore(newRow, eventTable.firstChild);
    } else {
      eventTable.appendChild(newRow);
    }

    // If there was a "No events found" message, remove it
    const noEventsRow = eventTable.querySelector('td[colspan="4"].text-muted');
    if (noEventsRow) {
      noEventsRow.parentElement.remove();
    }
  });

  // Artist created event
  socket.on("artistCreated", function (data) {
    // Update total artists count
    document.getElementById("totalArtistsCount").textContent =
      data.totalArtists;

    // Add artist to the artists table
    const artistTable = document.querySelector("#artists table tbody");
    const newRow = document.createElement("tr");

    const artist = data.artist;

    newRow.innerHTML = `
      <td>
        <img src="/uploads/artists/${artist.picture}" 
             alt="${artist.name}" 
             class="rounded-circle"
             style="width: 50px; height: 50px; object-fit: cover">
      </td>
      <td>${artist.name}</td>
      <td>${artist.genre}</td>
      <td class="d-flex gap-2">
        <a href="/admin/artist/${artist.id}/edit" class="btn btn-primary btn-sm me-2">Edit</a>
        <form action="/admin/artist/${artist.id}/delete" method="POST" class="me-2">
          <button class="btn btn-danger btn-sm" onclick="return confirm('Are you sure you want to delete this artist?')">Delete</button>
        </form>
      </td>
    `;

    // Add new row at the beginning
    if (artistTable.firstChild) {
      artistTable.insertBefore(newRow, artistTable.firstChild);
    } else {
      artistTable.appendChild(newRow);
    }

    // If there was a "No artists found" message, remove it
    const noArtistsRow = artistTable.querySelector(
      'td[colspan="3"].text-muted'
    );
    if (noArtistsRow) {
      noArtistsRow.parentElement.remove();
    }
  });

  // Handle updates
  socket.on("userUpdated", function (data) {
    const userRows = document.querySelectorAll("#users table tbody tr");
    userRows.forEach((row) => {
      const userId = row
        .querySelector("form:last-child")
        .action.split("/")
        .slice(-2)[0];
      if (userId === data.user.id.toString()) {
        row.children[0].textContent = data.user.name;
        row.children[1].textContent = data.user.email;
        row.children[2].textContent = data.user.role;
      }
    });
  });

  socket.on("artistUpdated", function (data) {
    const artistRows = document.querySelectorAll("#artists table tbody tr");
    artistRows.forEach((row) => {
      const artistId = row
        .querySelector("form:last-child")
        .action.split("/")
        .slice(-2)[0];
      if (artistId === data.artist.id.toString()) {
        row.children[0].querySelector(
          "img"
        ).src = `/uploads/artists/${data.artist.picture}`;
        row.children[1].textContent = data.artist.name;
        row.children[2].textContent = data.artist.genre;
      }
    });
  });

  socket.on("eventUpdated", function (data) {
    const eventRows = document.querySelectorAll("#events table tbody tr");
    eventRows.forEach((row) => {
      const eventId = row
        .querySelector("form:last-child")
        .action.split("/")
        .slice(-2)[0];
      if (eventId === data.event.id.toString()) {
        row.children[0].querySelector(
          "img"
        ).src = `/uploads/events/${data.event.picture}`;
        row.children[1].textContent = data.event.name;
        row.children[2].textContent = data.event.Artist
          ? data.event.Artist.name
          : "N/A";
        row.children[3].textContent = new Date(
          data.event.date
        ).toLocaleDateString();
        row.children[4].textContent = data.event.location;
        row.children[5].textContent = data.event.status;
      }
    });
  });

  // Handle deletions
  socket.on("galleryImageDeleted", function (data) {
    document.getElementById("totalGalleryCount").textContent = data.totalImages;
    const imageElement = document.getElementById(
      `gallery-image-${data.imageId}`
    );
    if (imageElement) {
      imageElement.remove();
    }
  });
});
