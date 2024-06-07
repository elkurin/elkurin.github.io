document.addEventListener('DOMContentLoaded', function () {
  let previousButton = null;

  const buttons = document.querySelectorAll('.animated-button');
  buttons.forEach(button => {
    button.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const targetElement = document.querySelector(targetId);

      const allDetails = document.querySelectorAll('.character-details');
      allDetails.forEach(detail => detail.style.display = 'none');
      if (targetElement) {
        targetElement.style.display = 'block';
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }

      if (previousButton && previousButton != this) {
        previousButton.classList.remove('clicked');
      }

      this.classList.add('clicked');
      previousButton = this;
    });
  });
});
