document.addEventListener('DOMContentLoaded', function () {
  let previousButton = null;

  const buttons = document.querySelectorAll('.animated-button');
  buttons.forEach(button => {
    button.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const targetElement = document.querySelector(targetId);

      const allDetails = document.querySelectorAll('.character-details');
      allDetails.forEach(detail => {
        detail.classList.remove('show');
        detail.style.display = 'none';
      });

      if (targetElement) {
        targetElement.style.display = 'block';
        setTimeout(() => {
          targetElement.classList.add('show');
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }, /*delay=*/50);
      }

      if (previousButton && previousButton != this) {
        previousButton.classList.remove('clicked');
        previousButton.classList.remove('expanded');
      }

      this.classList.add('clicked');
      this.classList.add('expanded');
      previousButton = this;
    });
  });
});
