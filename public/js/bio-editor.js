document.addEventListener("DOMContentLoaded", function () {
  const bioText = document.getElementById("bioText");
  const editBioBtn = document.getElementById("editBioBtn");
  const bioEditContainer = document.getElementById("bioEditContainer");
  const bioInput = document.getElementById("bioInput");
  const saveBioBtn = document.getElementById("saveBioBtn");
  const cancelBioBtn = document.getElementById("cancelBioBtn");

  // Show edit form
  editBioBtn.addEventListener("click", function () {
    bioText.classList.add("d-none");
    editBioBtn.classList.add("d-none");
    bioEditContainer.classList.remove("d-none");
    bioInput.focus();
  });

  // Cancel editing
  cancelBioBtn.addEventListener("click", function () {
    bioText.classList.remove("d-none");
    editBioBtn.classList.remove("d-none");
    bioEditContainer.classList.add("d-none");
    bioInput.value = bioInput.defaultValue; // Reset to original value
  });

  // Save bio
  saveBioBtn.addEventListener("click", async function () {
    try {
      const newBio = bioInput.value.trim();
      saveBioBtn.disabled = true; // Disable button while saving
      saveBioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      const response = await fetch("/users/update-bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ bio: newBio }),
        credentials: "include", // Important for session cookies
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the displayed bio text
        bioText.textContent = newBio || "Tell us about yourself!";

        // Hide edit form and show text
        bioText.classList.remove("d-none");
        editBioBtn.classList.remove("d-none");
        bioEditContainer.classList.add("d-none");

        // Show success message
        showNotification("Bio updated successfully!", "success");
      } else {
        throw new Error(data.message || "Failed to update bio");
      }
    } catch (error) {
      console.error("Error updating bio:", error);
      showNotification(
        error.message || "Failed to update bio. Please try again.",
        "error"
      );
    } finally {
      // Re-enable button and restore original text
      saveBioBtn.disabled = false;
      saveBioBtn.innerHTML = '<i class="fas fa-check me-1"></i> Save';
    }
  });

  // Notification helper
  function showNotification(message, type) {
    // Remove any existing notifications
    const existingNotifications =
      document.querySelectorAll(".bio-notification");
    existingNotifications.forEach((notification) => notification.remove());

    const notification = document.createElement("div");
    notification.className = `bio-notification alert alert-${
      type === "success" ? "success" : "danger"
    } position-fixed top-0 start-50 translate-middle-x mt-3`;
    notification.style.zIndex = "1050";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
});
