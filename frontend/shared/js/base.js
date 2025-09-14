/**
 * Base JavaScript utilities
 * Core functionality used across the application
 */

// Base application namespace
window.TouchAfrica = window.TouchAfrica || {};

// Utility functions
window.TouchAfrica.utils = {
  // DOM utilities
  querySelector: (selector, context = document) =>
    context.querySelector(selector),
  querySelectorAll: (selector, context = document) =>
    context.querySelectorAll(selector),

  // Element creation helpers
  createElement: (tag, attributes = {}, content = "") => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value;
      } else if (key === "dataset") {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    if (content) {
      element.textContent = content;
    }
    return element;
  },

  // Event handling
  addEvent: (element, event, handler) => {
    element.addEventListener(event, handler);
  },

  removeEvent: (element, event, handler) => {
    element.removeEventListener(event, handler);
  },

  // CSS class utilities
  addClass: (element, className) => {
    element.classList.add(className);
  },

  removeClass: (element, className) => {
    element.classList.remove(className);
  },

  toggleClass: (element, className) => {
    element.classList.toggle(className);
  },

  hasClass: (element, className) => {
    return element.classList.contains(className);
  },

  // Show/hide utilities
  show: (element) => {
    element.classList.remove("hidden");
    element.style.display = "";
  },

  hide: (element) => {
    element.classList.add("hidden");
  },

  // String utilities
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),

  // Data formatting
  formatDate: (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString();
  },

  formatDateTime: (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleString();
  },

  // Validation helpers
  isValidEmail: (email) => {
    return (
      window.TouchAfrica.ValidationPatterns?.ValidationHelpers.isValidEmail(
        email
      ) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ); // Fallback
  },

  // Loading state management
  showLoading: (element) => {
    element.classList.add("loading");
    element.disabled = true;
  },

  hideLoading: (element) => {
    element.classList.remove("loading");
    element.disabled = false;
  },
};

// Global error handler
window.TouchAfrica.handleError = (error, context = "Application") => {
  console.error(`[${context}] Error:`, error);

  // Show user-friendly error message
  const errorMessage = error.message || "An unexpected error occurred";
  window.TouchAfrica.showNotification?.(errorMessage, "error");
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("TouchAfrica Base JavaScript loaded");
});

console.log("Base JavaScript utilities initialized");
