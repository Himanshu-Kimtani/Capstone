document.addEventListener("DOMContentLoaded", () => {
  console.log("Vynyl is Ready! 🚀");

  // Example: Add click event to all buttons
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mouseover", () => {
      button.style.boxShadow = "0px 0px 10px #8a2be2";
    });
    button.addEventListener("mouseout", () => {
      button.style.boxShadow = "none";
    });
  });

  // Ensure dropdowns work properly
  // Initialize all dropdowns
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle")
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl);
  });

  // Add hover effect for desktop
  if (window.innerWidth >= 992) {
    document.querySelectorAll(".navbar .dropdown").forEach(function (element) {
      element.addEventListener("mouseover", function () {
        this.querySelector(".dropdown-toggle").click();
      });

      element.addEventListener("mouseout", function () {
        this.querySelector(".dropdown-toggle").click();
      });
    });
  }

  // Fix for manual opening
  document.querySelectorAll(".dropdown-toggle").forEach(function (element) {
    element.addEventListener("click", function (e) {
      e.stopPropagation();
      var dropdown = bootstrap.Dropdown.getInstance(this);
      if (!dropdown._isShown()) {
        dropdown.show();
      } else {
        dropdown.hide();
      }
    });
  });
});
