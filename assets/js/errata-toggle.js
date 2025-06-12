document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".errata-toggle");
  const hidden = document.querySelector(".errata-hidden");

  if (toggle && hidden) {
    toggle.addEventListener("click", () => {
      hidden.style.display = hidden.style.display === "none" ? "block" : "none";
    });
  }
});
