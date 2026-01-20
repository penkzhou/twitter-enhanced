/**
 * Twitter Enhanced Landing Page JavaScript
 * Handles theme switching and dynamic version fetching
 */

(function () {
  'use strict';

  // Theme Management
  const THEME_KEY = 'twitter-enhanced-theme';

  function getPreferredTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  // Initialize theme on page load
  setTheme(getPreferredTheme());

  // Listen for system theme changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });

  // Version Fetching
  const GITHUB_API_URL =
    'https://api.github.com/repos/penkzhou/twitter-enhanced/releases/latest';

  async function fetchLatestVersion() {
    const versionBadge = document.getElementById('version-badge');
    if (!versionBadge) return;

    try {
      const response = await fetch(GITHUB_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const version = data.tag_name || 'Unknown';

      versionBadge.textContent = version;
      versionBadge.classList.remove('animate-pulse');
    } catch (error) {
      console.error('Failed to fetch version:', error);
      versionBadge.textContent = 'v1.x';
      versionBadge.classList.remove('animate-pulse');
    }
  }

  // DOM Ready Handler
  function onDOMReady() {
    // Set up theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Fetch latest version
    fetchLatestVersion();

    // Add intersection observer for scroll animations
    const animatedElements = document.querySelectorAll('.animate-slide-up');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      animatedElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        observer.observe(el);
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }
})();
