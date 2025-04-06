document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin Panel Loaded");

  // ✅ Smooth Scrolling for Navigation Links
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  // Add click event listeners to each link
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Check if the element exists before trying to access its properties
      const targetId = this.getAttribute("data-target");
      const targetElement = targetId ? document.getElementById(targetId) : null;

      // Only proceed if target element exists
      if (targetElement) {
        e.preventDefault();
        // Scroll to element logic here
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: "smooth",
        });
      }
      // If no target specified, let the link navigate normally
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
