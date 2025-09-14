/**
 * Modal Validation and Toast Helper
 * Provides consistent realtime validation and toast messages for all modals
 */

// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
  ValidationHelpers,
  VALIDATION_MESSAGES,
} from "/frontend/shared/js/modal-validation-helper.js";

class ModalHelper {
  constructor(options = {}) {
    this.options = {
      form: options.form,
      submitButton: options.submitButton,
      validationRules: options.validationRules || {},
      onSubmit: options.onSubmit || null,
      onValidationChange: options.onValidationChange || null,
      realTimeValidation: options.realTimeValidation !== false,
      showSuccessToast: options.showSuccessToast !== false,
      successMessage:
        options.successMessage || "Operation completed successfully",
      errorPrefix: options.errorPrefix || "Error",
      enableOnChange: options.enableOnChange !== false, // Enable button when form changes
      ...options,
    };

    this.isSubmitting = false;
    this.validationErrors = new Map();
    this.fields = new Map();
    this.originalValues = new Map(); // Store original field values
    this.hasChanges = false; // Track if form has changes

    if (this.options.form) {
      this.init();
    }
  }

  async init() {
    // Ensure notification system is available
    await this.ensureNotificationSystem();

    // Initialize form fields
    this.initializeFields();

    // Setup event listeners
    this.setupEventListeners();

    // Initial validation state
    this.validateForm();
  }

  async ensureNotificationSystem() {
    try {
      if (window.ensureNotifications) {
        await window.ensureNotifications();
      } else if (!window.TANotification) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "/frontend/shared/scripts/components/notification.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Initialize notification service if needed
      if (
        window.TANotification &&
        typeof window.TANotification.init === "function"
      ) {
        window.TANotification.init();
      }
    } catch (error) {
      console.warn("Failed to load notification system:", error);
    }
  }

  initializeFields() {
    if (!this.options.form) return;

    const formElements = this.options.form.querySelectorAll(
      "input, select, textarea"
    );
    formElements.forEach((element) => {
      const fieldName = element.name || element.id;
      if (fieldName) {
        // Include all fields, even those without validation rules
        const rule = this.options.validationRules[fieldName] || {};
        this.fields.set(fieldName, {
          element,
          rule,
          errorElement: rule.required
            ? this.findOrCreateErrorElement(element)
            : null,
        });

        // Store original value for change detection
        this.originalValues.set(fieldName, this.getFieldValue(element));
      }
    });
  }

  findOrCreateErrorElement(fieldElement) {
    const fieldName = fieldElement.name || fieldElement.id;
    let errorElement = this.options.form.querySelector(
      `[data-error-for="${fieldName}"]`
    );

    if (!errorElement) {
      errorElement = this.options.form.querySelector(`#${fieldName}-error`);
    }

    if (!errorElement) {
      // Create error element
      errorElement = document.createElement("div");
      errorElement.className = "field-error text-danger small mt-1";
      errorElement.id = `${fieldName}-error`;
      errorElement.setAttribute("data-error-for", fieldName);
      errorElement.style.display = "none";

      // Insert after the field or its container
      const container =
        fieldElement.closest(".form-group, .mb-3, .field-container") ||
        fieldElement.parentNode;
      container.appendChild(errorElement);
    }

    return errorElement;
  }

  setupEventListeners() {
    if (!this.options.form) return;

    // Realtime validation on field changes
    if (this.options.realTimeValidation) {
      this.fields.forEach((fieldData, fieldName) => {
        const { element } = fieldData;

        // Validate on blur for better UX
        element.addEventListener("blur", () => {
          this.validateField(fieldName);
          this.checkForChanges();
        });

        // Validate on input for immediate feedback (with debouncing)
        let timeout;
        element.addEventListener("input", () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            this.validateField(fieldName);
            this.checkForChanges();
          }, 300);
        });

        // Also listen for change events
        element.addEventListener("change", () => {
          this.validateField(fieldName);
          this.checkForChanges();
        });
      });
    }

    // Form submission
    if (this.options.form && this.options.onSubmit) {
      this.options.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Submit button click (alternative to form submission)
    if (this.options.submitButton && this.options.onSubmit) {
      this.options.submitButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  validateField(fieldName) {
    const fieldData = this.fields.get(fieldName);
    if (!fieldData) return true;

    const { element, rule, errorElement } = fieldData;
    const value = this.getFieldValue(element);

    // Only validate if there are actual validation rules
    if (!rule || Object.keys(rule).length === 0) {
      return true; // No validation rules, consider it valid
    }

    // Clear previous error
    this.clearFieldError(fieldName);

    // Required validation
    if (rule.required && (!value || value.toString().trim() === "")) {
      this.setFieldError(
        fieldName,
        rule.requiredMessage || `${this.getFieldLabel(element)} is required`
      );
      return false;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === "") {
      return true;
    }

    // Custom validation function
    if (rule.validate && typeof rule.validate === "function") {
      const result = rule.validate(value, element);
      if (result !== true) {
        this.setFieldError(fieldName, result || "Invalid value");
        return false;
      }
    }

    // Email validation using centralized patterns
    if (rule.type === "email" || element.type === "email") {
      if (!ValidationHelpers.isValidEmail(value)) {
        this.setFieldError(
          fieldName,
          rule.emailMessage || VALIDATION_MESSAGES.EMAIL
        );
        return false;
      }
    }

    // Phone validation using centralized patterns
    if (rule.type === "phone" || element.type === "tel") {
      if (!ValidationHelpers.isValidSAPhone(value.replace(/[\s()-]/g, ""))) {
        this.setFieldError(
          fieldName,
          rule.phoneMessage || VALIDATION_MESSAGES.SA_PHONE
        );
        return false;
      }
    }

    return true;
  }

  checkForChanges() {
    this.hasChanges = false;

    this.fields.forEach((fieldData, fieldName) => {
      const currentValue = this.getFieldValue(fieldData.element);
      const originalValue = this.originalValues.get(fieldName);

      if (currentValue !== originalValue) {
        this.hasChanges = true;
      }
    });

    // Update submit button state
    this.updateSubmitButtonState();
  }

  updateSubmitButtonState() {
    if (!this.options.submitButton) return;

    const isValid = this.validationErrors.size === 0;
    const shouldEnable = this.options.enableOnChange
      ? isValid && this.hasChanges
      : isValid;

    this.options.submitButton.disabled = !shouldEnable || this.isSubmitting;
  }

  validateForm() {
    let isValid = true;

    this.fields.forEach((fieldData, fieldName) => {
      if (!this.validateField(fieldName)) {
        isValid = false;
      }
    });

    // Update submit button state
    this.updateSubmitButtonState();

    // Notify validation change
    if (this.options.onValidationChange) {
      this.options.onValidationChange(isValid);
    }

    return isValid;
  }

  setFieldError(fieldName, message) {
    const fieldData = this.fields.get(fieldName);
    if (!fieldData || !fieldData.errorElement) return;

    const { element, errorElement } = fieldData;

    this.validationErrors.set(fieldName, message);

    // Show error message
    errorElement.textContent = message;
    errorElement.style.display = "block";

    // Add error styling to field
    element.classList.add("is-invalid");
    element.classList.remove("is-valid");
  }

  clearFieldError(fieldName) {
    const fieldData = this.fields.get(fieldName);
    if (!fieldData || !fieldData.errorElement) return;

    const { element, errorElement } = fieldData;

    this.validationErrors.delete(fieldName);

    // Hide error message
    errorElement.style.display = "none";
    errorElement.textContent = "";

    // Remove error styling from field
    element.classList.remove("is-invalid");
    element.classList.add("is-valid");
  }

  clearAllErrors() {
    this.fields.forEach((fieldData, fieldName) => {
      this.clearFieldError(fieldName);
    });
  }

  getFieldValue(element) {
    if (element.type === "checkbox") {
      return element.checked;
    } else if (element.type === "radio") {
      const form = element.closest("form");
      const radioGroup = form.querySelectorAll(`input[name="${element.name}"]`);
      for (let radio of radioGroup) {
        if (radio.checked) return radio.value;
      }
      return "";
    } else {
      return element.value;
    }
  }

  getFieldLabel(element) {
    // Try to find associated label
    let label = element.closest(".form-group, .mb-3")?.querySelector("label");
    if (label) return label.textContent.replace("*", "").trim();

    // Try placeholder
    if (element.placeholder) return element.placeholder;

    // Use field name as fallback
    return element.name || element.id || "Field";
  }

  getFormData() {
    const data = {};
    this.fields.forEach((fieldData, fieldName) => {
      data[fieldName] = this.getFieldValue(fieldData.element);
    });

    // Include other form fields not in validation rules
    const formData = new FormData(this.options.form);
    for (let [key, value] of formData.entries()) {
      if (!data.hasOwnProperty(key)) {
        data[key] = value;
      }
    }

    return data;
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    // Validate form
    if (!this.validateForm()) {
      this.showToast("error", "Please fix the errors below before submitting");
      return;
    }

    this.setSubmitting(true);

    try {
      const formData = this.getFormData();
      const result = await this.options.onSubmit(formData);

      if (this.options.showSuccessToast) {
        this.showToast("success", this.options.successMessage);
      }

      return result;
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage =
        error.message || "An error occurred while processing your request";
      this.showToast("error", `${this.options.errorPrefix}: ${errorMessage}`);
      throw error;
    } finally {
      this.setSubmitting(false);
    }
  }

  setSubmitting(submitting) {
    this.isSubmitting = submitting;

    // Update submit button state
    this.updateSubmitButtonState();

    if (this.options.submitButton) {
      // Update button text if it has data attributes for loading
      if (submitting) {
        const loadingText =
          this.options.submitButton.dataset.loadingText || "Processing...";
        this.options.submitButton.dataset.originalText =
          this.options.submitButton.textContent;
        this.options.submitButton.textContent = loadingText;
      } else if (this.options.submitButton.dataset.originalText) {
        this.options.submitButton.textContent =
          this.options.submitButton.dataset.originalText;
      }
    }
  }

  showToast(type, message, options = {}) {
    try {
      if (window.TANotification) {
        const method =
          window.TANotification[type] || window.TANotification.info;
        method.call(window.TANotification, message, {
          duration: type === "error" ? 5000 : 3500,
          ...options,
        });
      } else {
        console.warn("Notification system not available. Message:", message);
      }
    } catch (error) {
      console.warn("Failed to show toast:", error, "Message:", message);
    }
  }

  // Public methods for external use
  reset() {
    if (this.options.form) {
      this.options.form.reset();
    }
    this.clearAllErrors();
    this.setSubmitting(false);

    // Reset original values and changes
    this.hasChanges = false;
    this.originalValues.clear();
    this.initializeFields(); // Re-capture original values after reset
  }

  updateOriginalValues() {
    // Update the original values to current values (useful after successful save)
    this.fields.forEach((fieldData, fieldName) => {
      this.originalValues.set(fieldName, this.getFieldValue(fieldData.element));
    });
    this.hasChanges = false;
    this.updateSubmitButtonState();
  }

  updateValidationRules(newRules) {
    this.options.validationRules = {
      ...this.options.validationRules,
      ...newRules,
    };
    this.initializeFields();
  }

  destroy() {
    // Remove event listeners and clean up
    this.fields.clear();
    this.validationErrors.clear();
    this.originalValues.clear();
    this.isSubmitting = false;
    this.hasChanges = false;
  }
}

// Make available globally
if (typeof window !== "undefined") {
  window.ModalHelper = ModalHelper;
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ModalHelper;
}
