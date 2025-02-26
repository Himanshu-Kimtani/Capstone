document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");

  if (searchInput) {
    searchInput.addEventListener("keyup", () => {
      const filter = searchInput.value.toLowerCase();
      document.querySelectorAll(".event-card").forEach((card) => {
        const title = card.querySelector(".card-title").innerText.toLowerCase();
        card.style.display = title.includes(filter) ? "block" : "none";
      });
    });
  }
});
