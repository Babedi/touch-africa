/**
 * Validation Utility Functions
 * Provides consistent validation patterns and rules for all modals
 */

/**
 * Standard validation rules used across all modals
 */
const ValidationRules = {
  // Basic validation rules
  required: {
    validate: (value) => {
      const trimmed = typeof value === "string" ? value.trim() : value;
      return trimmed && trimmed.length > 0 ? true : "This field is required";
    },
  },

  // Email validation
  email: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value)
        ? true
        : "Please enter a valid email address";
    },
  },

  // Phone number validation
  phone: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(value)
        ? true
        : "Please enter a valid phone number";
    },
  },

  // Name validation (no numbers or special chars except spaces, hyphens, apostrophes)
  name: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
      return nameRegex.test(value)
        ? true
        : "Name can only contain letters, spaces, hyphens, and apostrophes";
    },
  },

  // Username validation (alphanumeric and underscores)
  username: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
      return usernameRegex.test(value)
        ? true
        : "Username must be at least 3 characters and contain only letters, numbers, and underscores";
    },
  },

  // Password validation
  password: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      if (value.length < 8)
        return "Password must be at least 8 characters long";
      if (!/(?=.*[a-z])/.test(value))
        return "Password must contain at least one lowercase letter";
      if (!/(?=.*[A-Z])/.test(value))
        return "Password must contain at least one uppercase letter";
      if (!/(?=.*\d)/.test(value))
        return "Password must contain at least one number";
      return true;
    },
  },

  // URL validation
  url: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      try {
        new URL(value);
        return true;
      } catch {
        return "Please enter a valid URL";
      }
    },
  },

  // Date validation
  date: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const date = new Date(value);
      return !isNaN(date.getTime()) ? true : "Please enter a valid date";
    },
  },

  // Age validation (must be 18 or older)
  adultAge: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age >= 18 ? true : "Must be 18 years or older";
    },
  },

  // Minimum length validation
  minLength: (min) => ({
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      return value.length >= min
        ? true
        : `Must be at least ${min} characters long`;
    },
  }),

  // Maximum length validation
  maxLength: (max) => ({
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      return value.length <= max
        ? true
        : `Must be no more than ${max} characters long`;
    },
  }),

  // Numeric validation
  numeric: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      return !isNaN(value) && !isNaN(parseFloat(value))
        ? true
        : "Must be a valid number";
    },
  },

  // Positive number validation
  positiveNumber: {
    validate: (value) => {
      if (!value) return true; // Allow empty if not required
      const num = parseFloat(value);
      return !isNaN(num) && num > 0 ? true : "Must be a positive number";
    },
  },
};

/**
 * Field validation configuration
 * Maps field names to their validation rules
 */
const FieldValidationConfig = {
  // Person fields
  firstName: [ValidationRules.required, ValidationRules.name],
  lastName: [ValidationRules.required, ValidationRules.name],
  middleName: [ValidationRules.name],
  email: [ValidationRules.email],
  phone: [ValidationRules.phone],
  dateOfBirth: [ValidationRules.date],

  // Admin fields
  username: [ValidationRules.required, ValidationRules.username],
  password: [ValidationRules.required, ValidationRules.password],

  // Role fields
  roleName: [ValidationRules.required, ValidationRules.minLength(2)],
  roleDescription: [ValidationRules.maxLength(500)],

  // Lookup fields
  lookupName: [ValidationRules.required, ValidationRules.minLength(2)],
  lookupCode: [ValidationRules.required],
  lookupDescription: [ValidationRules.maxLength(255)],
};

/**
 * Sets field error state and message
 * @param {HTMLElement} field - The input field
 * @param {string} message - The error message
 * @param {HTMLElement} container - The container to search for error elements
 */
function setFieldError(field, message, container = document) {
  if (!field) return;

  // Add error class to field
  field.classList.add("is-invalid");
  field.classList.remove("is-valid");

  // Find or create error message element
  let errorElement = container.querySelector(
    `[data-error-for="${field.name}"]`
  );
  if (!errorElement) {
    errorElement = container.querySelector(`#${field.name}-error`);
  }
  if (!errorElement) {
    errorElement = field.parentElement?.querySelector(".invalid-feedback");
  }

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
}

/**
 * Clears field error state
 * @param {HTMLElement} field - The input field
 * @param {HTMLElement} container - The container to search for error elements
 */
function clearFieldError(field, container = document) {
  if (!field) return;

  // Remove error classes
  field.classList.remove("is-invalid");
  field.classList.add("is-valid");

  // Hide error message
  let errorElement = container.querySelector(
    `[data-error-for="${field.name}"]`
  );
  if (!errorElement) {
    errorElement = container.querySelector(`#${field.name}-error`);
  }
  if (!errorElement) {
    errorElement = field.parentElement?.querySelector(".invalid-feedback");
  }

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.style.display = "none";
  }
}

/**
 * Validates a single field using standardized rules
 * @param {HTMLElement} field - The input field to validate
 * @param {HTMLElement} container - The container for error message display
 * @param {Object} customRules - Custom validation rules for specific fields
 * @returns {boolean} - True if field is valid, false otherwise
 */
function validateField(field, container = document, customRules = {}) {
  if (!field) return true;

  const fieldName = field.name || field.id;
  const fieldValue = field.value || "";

  // Get validation rules for this field
  const rules =
    customRules[fieldName] || FieldValidationConfig[fieldName] || [];

  // Clear previous error state
  clearFieldError(field, container);

  // Run validation rules
  for (const rule of rules) {
    if (rule && typeof rule.validate === "function") {
      const result = rule.validate(fieldValue);
      if (result !== true) {
        const errorMessage =
          typeof result === "string" ? result : "Invalid input";
        setFieldError(field, errorMessage, container);
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates an entire form using standardized rules
 * @param {HTMLFormElement} form - The form to validate
 * @param {Object} customRules - Custom validation rules
 * @returns {boolean} - True if form is valid, false otherwise
 */
function validateForm(form, customRules = {}) {
  if (!form) return true;

  let isValid = true;
  const fields = form.querySelectorAll(
    "input[name], select[name], textarea[name]"
  );

  fields.forEach((field) => {
    if (!validateField(field, form, customRules)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Clears all validation errors in a form
 * @param {HTMLFormElement|HTMLElement} container - The form or container
 */
function clearAllErrors(container) {
  if (!container) return;

  // Remove error classes from all fields
  const fields = container.querySelectorAll(".is-invalid");
  fields.forEach((field) => {
    field.classList.remove("is-invalid");
    field.classList.remove("is-valid");
  });

  // Hide all error messages
  const errorElements = container.querySelectorAll(
    ".invalid-feedback, [data-error-for]"
  );
  errorElements.forEach((element) => {
    element.textContent = "";
    element.style.display = "none";
  });
}

/**
 * Sets up real-time validation for form fields
 * @param {HTMLFormElement} form - The form to setup
 * @param {Object} customRules - Custom validation rules
 */
function setupRealtimeValidation(form, customRules = {}) {
  if (!form) return;

  const fields = form.querySelectorAll(
    "input[name], select[name], textarea[name]"
  );

  fields.forEach((field) => {
    // Validate on blur
    field.addEventListener("blur", () => {
      validateField(field, form, customRules);
    });

    // Clear errors on input (but don't validate until blur)
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        clearFieldError(field, form);
      }
    });

    // Validate on change for select elements
    if (field.tagName.toLowerCase() === "select") {
      field.addEventListener("change", () => {
        validateField(field, form, customRules);
      });
    }
  });
}

// Export functions for use in modals
if (typeof module !== "undefined" && module.exports) {
  // Node.js environment
  module.exports = {
    ValidationRules,
    FieldValidationConfig,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setupRealtimeValidation,
  };
} else {
  // Browser environment - attach to window
  window.ValidationUtils = {
    ValidationRules,
    FieldValidationConfig,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setupRealtimeValidation,
  };
}
