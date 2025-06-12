// Dark mode toggle functionality
// Add this to assets/js/dark-mode.js

(function() {
  // Check for saved theme preference or default to light mode
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Create toggle button
  function createToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'theme-toggle';
    toggleButton.innerHTML = `
      <span class="sun-icon">☀️</span>
      <span class="moon-icon">🌙</span>
    `;
    toggleButton.setAttribute('aria-label', 'Toggle dark mode');
    
    document.body.appendChild(toggleButton);
    return toggleButton;
  }

  // Toggle theme function
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = createToggleButton();
    toggleButton.addEventListener('click', toggleTheme);
  });
})();
