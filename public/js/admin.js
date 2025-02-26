document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin Panel Loaded");

  // ✅ Smooth Scrolling for Navigation Links
  document.querySelectorAll("a.nav-link").forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);
      window.scrollTo({
        top: targetSection.offsetTop - 50, // Adjust for navbar height
        behavior: "smooth",
      });
    });
  });

  // ✅ Confirm Before Deleting Events
  document.querySelectorAll(".delete-event").forEach((button) => {
    button.addEventListener("click", function () {
      if (!confirm("Are you sure you want to delete this event?")) {
        return false;
      }
    });
  });

  // ✅ Confirm Before Deleting Users
  document.querySelectorAll(".delete-user").forEach((button) => {
    button.addEventListener("click", function () {
      if (!confirm("Are you sure you want to delete this user?")) {
        return false;
      }
    });
  });

  // ✅ Show Flash Messages and Auto-Dismiss after 3 seconds
  const flashMessages = document.querySelectorAll(".alert");
  flashMessages.forEach((message) => {
    setTimeout(() => {
      message.style.display = "none";
    }, 3000);
  });
});
