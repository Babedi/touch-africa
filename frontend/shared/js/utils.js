/**
 * Utility Functions
 * Common helper functions used throughout the application
 */

window.TouchAfrica = window.TouchAfrica || {};

window.TouchAfrica.utils = window.TouchAfrica.utils || {};

// Extend existing utils with additional functionality
Object.assign(window.TouchAfrica.utils, {
  // Form utilities
  serializeForm: (form) => {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (like checkboxes)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  },

  populateForm: (form, data) => {
    Object.entries(data).forEach(([key, value]) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === "checkbox" || field.type === "radio") {
          field.checked = value === field.value || value === true;
        } else {
          field.value = value || "";
        }
      }
    });
  },

  clearForm: (form) => {
    const fields = form.querySelectorAll("input, select, textarea");
    fields.forEach((field) => {
      if (field.type === "checkbox" || field.type === "radio") {
        field.checked = false;
      } else {
        field.value = "";
      }
    });
  },

  validateForm: (form) => {
    const errors = {};
    const fields = form.querySelectorAll("[required], [data-validate]");

    fields.forEach((field) => {
      const value = field.value.trim();
      const fieldName = field.name || field.id;

      if (field.hasAttribute("required") && !value) {
        errors[fieldName] = "This field is required";
        return;
      }

      const validation = field.dataset.validate;
      if (validation && value) {
        switch (validation) {
          case "email":
            if (!window.TouchAfrica.utils.isValidEmail(value)) {
              errors[fieldName] = "Please enter a valid email address";
            }
            break;
          case "sa-id":
            if (!window.TouchAfrica.utils.isValidSAID(value)) {
              errors[fieldName] =
                "Please enter a valid South African ID number";
            }
            break;
          case "phone":
            if (!window.TouchAfrica.utils.isValidPhone(value)) {
              errors[fieldName] = "Please enter a valid phone number";
            }
            break;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // South African ID validation - simplified to format-only
  isValidSAID: (id) => {
    if (!id || id.length !== 13) return false;

    // Check if all characters are digits (13-digit format: 0000000000000)
    return /^\d{13}$/.test(id);
  },

  // Email validation using centralized pattern
  isValidEmail: (email) => {
    const emailRegex =
      window.TouchAfrica?.ValidationPatterns?.EMAIL_REGEX ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (South African format) using centralized pattern
  isValidPhone: (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    const saPhoneRegex =
      window.TouchAfrica?.ValidationPatterns?.SA_PHONE_REGEX ||
      /^(\+27|0)[6-8][0-9]{8}$/;
    return saPhoneRegex.test(cleaned);
  },

  // Format phone number
  formatPhone: (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("27")) {
      return `+${cleaned.substring(0, 2)} ${cleaned.substring(
        2,
        4
      )} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    } else if (cleaned.startsWith("0")) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(
        3,
        6
      )} ${cleaned.substring(6)}`;
    }
    return phone;
  },

  // URL utilities
  getQueryParams: () => {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    for (let [key, value] of urlParams) {
      params[key] = value;
    }
    return params;
  },

  updateURL: (params) => {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.replaceState({}, "", url);
  },

  // Local storage utilities
  storage: {
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        // Failed to save to localStorage
      }
    },

    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        // Failed to read from localStorage
        return defaultValue;
      }
    },

    remove: (key) => {
      localStorage.removeItem(key);
    },

    clear: () => {
      localStorage.clear();
    },
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Deep clone object
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Generate random ID
  generateId: (prefix = "id") => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Notification system
  showNotification: (message, type = "info", duration = 3000) => {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add("show"), 100);

    // Remove after duration
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  // Loading overlay
  showLoadingOverlay: (message = "Loading...") => {
    const overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.className = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  hideLoadingOverlay: () => {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.remove();
    }
  },

  // Role mapping for display purposes (role code to role name)
  ROLE_DISPLAY_MAPPINGS: {
    // Modern role codes
    INTERNAL_ROOT_ADMIN: "Internal Root Admin",
    INTERNAL_SUPER_ADMIN: "Internal Super Admin",
    INTERNAL_STANDARD_ADMIN: "Internal Standard Admin",
    EXTERNAL_SUPER_ADMIN: "External Super Admin",
    EXTERNAL_STANDARD_ADMIN: "External Standard Admin",
    LOOKUP_MANAGER: "Lookup Manager",
    TENANT_ADMIN: "Tenant Admin",
    TENANT_USER: "Tenant User",
    SERVICE_ADMIN: "Service Admin",
    SERVICE_USER: "Service User",

    // Legacy/simple role codes
    admin: "Administrator",
    superadmin: "Super Administrator",
    "internal.admin": "Service Administrator",
    "internal.root": "Internal Root Administrator",
    "external.admin": "External Administrator",
    user: "User",
    manager: "Manager",
  },

  /**
   * Convert role code to human-readable role name
   * @param {string|array} roles - Role code(s) to convert
   * @param {Object} options - Formatting options
   * @param {boolean} options.compact - For dashboard display (shows first + count)
   * @param {number} options.maxDisplay - Maximum roles to display before truncating
   * @returns {string} Human-readable role name(s)
   */
  formatRoleName: function (roles, options = {}) {
    if (!roles) return "—";

    const { compact = false, maxDisplay = 2 } = options;

    // Handle single role (string)
    if (typeof roles === "string") {
      return this.ROLE_DISPLAY_MAPPINGS[roles] || roles;
    }

    // Handle multiple roles (array)
    if (Array.isArray(roles)) {
      if (roles.length === 0) return "—";

      const roleNames = roles.map(
        (role) => this.ROLE_DISPLAY_MAPPINGS[role] || role
      );

      if (compact && roleNames.length > 1) {
        // For dashboard display, show first role + count if more
        return `${roleNames[0]} (+${roleNames.length - 1})`;
      }

      // For table display, limit and show truncation
      if (roleNames.length > maxDisplay) {
        return `${roleNames.slice(0, maxDisplay).join(", ")}, +${
          roleNames.length - maxDisplay
        } more`;
      }

      return roleNames.join(", ");
    }

    return String(roles);
  },
});
