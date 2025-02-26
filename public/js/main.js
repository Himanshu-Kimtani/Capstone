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
});
