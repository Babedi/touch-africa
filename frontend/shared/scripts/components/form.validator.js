/**
 * Form Validator
 * Provides comprehensive form validation with custom rules and real-time feedback
 */
class FormValidator {
  constructor(form, options = {}) {
    this.form = typeof form === "string" ? document.querySelector(form) : form;
    this.options = {
      validateOnInput: true,
      validateOnBlur: true,
      validateOnSubmit: true,
      showSuccessMessage: false,
      errorClass: "is-invalid",
      successClass: "is-valid",
      errorMessageClass: "invalid-feedback",
      successMessageClass: "valid-feedback",
      submitButton: null,
      rules: {},
      messages: {},
      ...options,
    };

    this.fields = new Map();
    this.errors = new Map();
    this.isValid = false;

    this.init();
  }

  init() {
    this.setupFields();
    this.attachEvents();
    this.addStyles();
  }

  setupFields() {
    const inputs = this.form.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      const fieldName = input.name || input.id;
      if (!fieldName) return;

      const fieldConfig = {
        element: input,
        name: fieldName,
        rules: this.parseRules(input),
        messages: this.options.messages[fieldName] || {},
        isValid: null,
        errorMessage: null,
      };

      this.fields.set(fieldName, fieldConfig);
      this.createFeedbackElement(input);
    });
  }

  parseRules(input) {
    const rules = [];

    // HTML5 validation attributes
    if (input.required) {
      rules.push({ type: "required" });
    }

    if (input.type === "email") {
      rules.push({ type: "email" });
    }

    if (input.type === "url") {
      rules.push({ type: "url" });
    }

    if (input.type === "number") {
      if (input.min !== "") {
        rules.push({ type: "min", value: parseFloat(input.min) });
      }
      if (input.max !== "") {
        rules.push({ type: "max", value: parseFloat(input.max) });
      }
    }

    if (input.minLength) {
      rules.push({ type: "minLength", value: parseInt(input.minLength) });
    }

    if (input.maxLength) {
      rules.push({ type: "maxLength", value: parseInt(input.maxLength) });
    }

    if (input.pattern) {
      rules.push({ type: "pattern", value: new RegExp(input.pattern) });
    }

    // Custom data attributes
    const customRules = input.dataset.rules;
    if (customRules) {
      try {
        const parsed = JSON.parse(customRules);
        rules.push(...parsed);
      } catch (e) {
        console.warn("Invalid rules format for field:", input.name);
      }
    }

    // Rules from options
    const fieldRules = this.options.rules[input.name || input.id];
    if (fieldRules) {
      rules.push(...fieldRules);
    }

    return rules;
  }

  createFeedbackElement(input) {
    const existingFeedback = input.parentNode.querySelector(
      `.${this.options.errorMessageClass}, .${this.options.successMessageClass}`
    );
    if (existingFeedback) return;

    const feedback = document.createElement("div");
    feedback.className = this.options.errorMessageClass;
    feedback.style.display = "none";

    input.parentNode.appendChild(feedback);
  }

  attachEvents() {
    if (this.options.validateOnInput) {
      this.form.addEventListener("input", (e) => {
        if (e.target.matches("input, select, textarea")) {
          this.validateField(e.target.name || e.target.id);
        }
      });
    }

    if (this.options.validateOnBlur) {
      this.form.addEventListener(
        "blur",
        (e) => {
          if (e.target.matches("input, select, textarea")) {
            this.validateField(e.target.name || e.target.id);
          }
        },
        true
      );
    }

    if (this.options.validateOnSubmit) {
      this.form.addEventListener("submit", (e) => {
        if (!this.validateAll()) {
          e.preventDefault();
          this.focusFirstError();
        }
      });
    }
  }

  addStyles() {
    const styleId = "form-validator-styles";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
            .${this.options.errorClass} {
                border-color: #dc3545 !important;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
            }

            .${this.options.successClass} {
                border-color: #28a745 !important;
                box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
            }

            .${this.options.errorMessageClass} {
                display: block;
                width: 100%;
                margin-top: 0.25rem;
                font-size: 0.875rem;
                color: #dc3545;
            }

            .${this.options.successMessageClass} {
                display: block;
                width: 100%;
                margin-top: 0.25rem;
                font-size: 0.875rem;
                color: #28a745;
            }

            .form-field-error {
                animation: shake 0.5s ease-in-out;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
    document.head.appendChild(style);
  }

  // Validation methods
  validateField(fieldName) {
    const field = this.fields.get(fieldName);
    if (!field) return true;

    const value = this.getFieldValue(field.element);
    const result = this.runValidationRules(value, field.rules, field);

    field.isValid = result.isValid;
    field.errorMessage = result.errorMessage;

    this.updateFieldDisplay(field);
    this.updateFormState();

    return result.isValid;
  }

  validateAll() {
    let allValid = true;

    this.fields.forEach((field, fieldName) => {
      const isValid = this.validateField(fieldName);
      if (!isValid) allValid = false;
    });

    this.isValid = allValid;
    this.updateSubmitButton();

    if (allValid) {
      this.onValidationSuccess();
    } else {
      this.onValidationError();
    }

    return allValid;
  }

  runValidationRules(value, rules, field) {
    for (const rule of rules) {
      const result = this.validateRule(value, rule, field);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true, errorMessage: null };
  }

  validateRule(value, rule, field) {
    const validators = {
      required: (val) =>
        val !== null && val !== undefined && val.toString().trim() !== "",
      email: (val) =>
        !val ||
        window.TouchAfrica?.ValidationPatterns?.EMAIL_REGEX?.test(val) ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      url: (val) => !val || /^https?:\/\/.+/.test(val),
      min: (val, min) => !val || parseFloat(val) >= min,
      max: (val, max) => !val || parseFloat(val) <= max,
      minLength: (val, length) => !val || val.toString().length >= length,
      maxLength: (val, length) => !val || val.toString().length <= length,
      pattern: (val, pattern) => !val || pattern.test(val),
      matches: (val, targetField) => {
        const target = this.fields.get(targetField);
        return target ? val === this.getFieldValue(target.element) : true;
      },
      custom: (val, validator) => validator(val, field.element, this.form),
    };

    const validator = validators[rule.type];
    if (!validator) {
      console.warn(`Unknown validation rule: ${rule.type}`);
      return { isValid: true, errorMessage: null };
    }

    const isValid = validator(value, rule.value);
    const errorMessage = isValid
      ? null
      : this.getErrorMessage(rule, field, value);

    return { isValid, errorMessage };
  }

  getErrorMessage(rule, field, value) {
    const customMessage = field.messages[rule.type];
    if (customMessage) {
      return this.interpolateMessage(customMessage, rule, field, value);
    }

    const defaultMessages = {
      required: "This field is required.",
      email: "Please enter a valid email address.",
      url: "Please enter a valid URL.",
      min: `Value must be at least ${rule.value}.`,
      max: `Value must be at most ${rule.value}.`,
      minLength: `Must be at least ${rule.value} characters long.`,
      maxLength: `Must be at most ${rule.value} characters long.`,
      pattern: "Please enter a valid value.",
      matches: "Values do not match.",
      custom: "Invalid value.",
    };

    return defaultMessages[rule.type] || "Invalid value.";
  }

  interpolateMessage(message, rule, field, value) {
    return message
      .replace("{value}", value)
      .replace("{min}", rule.value)
      .replace("{max}", rule.value)
      .replace("{length}", rule.value)
      .replace("{field}", field.name);
  }

  getFieldValue(element) {
    if (element.type === "checkbox") {
      return element.checked;
    } else if (element.type === "radio") {
      const checked = this.form.querySelector(
        `input[name="${element.name}"]:checked`
      );
      return checked ? checked.value : "";
    } else if (element.type === "file") {
      return element.files;
    } else {
      return element.value;
    }
  }

  updateFieldDisplay(field) {
    const element = field.element;
    const feedback = element.parentNode.querySelector(
      `.${this.options.errorMessageClass}, .${this.options.successMessageClass}`
    );

    // Remove existing classes
    element.classList.remove(
      this.options.errorClass,
      this.options.successClass
    );

    if (field.isValid === null) {
      // Not validated yet
      if (feedback) {
        feedback.style.display = "none";
        feedback.textContent = "";
      }
    } else if (field.isValid) {
      // Valid
      if (this.options.showSuccessMessage) {
        element.classList.add(this.options.successClass);
        if (feedback) {
          feedback.className = this.options.successMessageClass;
          feedback.style.display = "block";
          feedback.textContent = "Looks good!";
        }
      } else if (feedback) {
        feedback.style.display = "none";
        feedback.textContent = "";
      }
    } else {
      // Invalid
      element.classList.add(this.options.errorClass);
      if (feedback) {
        feedback.className = this.options.errorMessageClass;
        feedback.style.display = "block";
        feedback.textContent = field.errorMessage;
      }

      // Add shake animation
      element.classList.add("form-field-error");
      setTimeout(() => element.classList.remove("form-field-error"), 500);
    }
  }

  updateFormState() {
    let hasValidated = false;
    let allValid = true;

    this.fields.forEach((field) => {
      if (field.isValid !== null) {
        hasValidated = true;
        if (!field.isValid) {
          allValid = false;
        }
      }
    });

    this.isValid = hasValidated && allValid;
    this.updateSubmitButton();
  }

  updateSubmitButton() {
    const submitButton = this.options.submitButton
      ? typeof this.options.submitButton === "string"
        ? document.querySelector(this.options.submitButton)
        : this.options.submitButton
      : this.form.querySelector('[type="submit"]');

    if (submitButton) {
      submitButton.disabled = !this.isValid;
    }
  }

  focusFirstError() {
    for (const [fieldName, field] of this.fields) {
      if (!field.isValid) {
        field.element.focus();
        break;
      }
    }
  }

  // Event handlers
  onValidationSuccess() {
    this.emit("validationSuccess", {
      form: this.form,
      data: this.getFormData(),
    });
  }

  onValidationError() {
    this.emit("validationError", {
      form: this.form,
      errors: this.getErrors(),
    });
  }

  // Public API methods
  addRule(fieldName, rule) {
    const field = this.fields.get(fieldName);
    if (field) {
      field.rules.push(rule);
    }
  }

  removeRule(fieldName, ruleType) {
    const field = this.fields.get(fieldName);
    if (field) {
      field.rules = field.rules.filter((rule) => rule.type !== ruleType);
    }
  }

  setCustomMessage(fieldName, ruleType, message) {
    const field = this.fields.get(fieldName);
    if (field) {
      field.messages[ruleType] = message;
    }
  }

  reset() {
    this.fields.forEach((field) => {
      field.isValid = null;
      field.errorMessage = null;
      this.updateFieldDisplay(field);
    });

    this.errors.clear();
    this.isValid = false;
    this.updateSubmitButton();
  }

  getFormData() {
    const data = {};
    this.fields.forEach((field, fieldName) => {
      data[fieldName] = this.getFieldValue(field.element);
    });
    return data;
  }

  getErrors() {
    const errors = {};
    this.fields.forEach((field, fieldName) => {
      if (!field.isValid && field.errorMessage) {
        errors[fieldName] = field.errorMessage;
      }
    });
    return errors;
  }

  isFieldValid(fieldName) {
    const field = this.fields.get(fieldName);
    return field ? field.isValid : null;
  }

  getFieldError(fieldName) {
    const field = this.fields.get(fieldName);
    return field ? field.errorMessage : null;
  }

  // Event system
  emit(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    this.form.dispatchEvent(event);
  }

  on(eventName, handler) {
    this.form.addEventListener(eventName, handler);
  }

  // Destroy method
  destroy() {
    this.fields.clear();
    this.errors.clear();
  }
}

// Static validation methods
FormValidator.validateEmail = (email) => {
  return (
    window.TouchAfrica?.ValidationPatterns?.EMAIL_REGEX?.test(email) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
};

FormValidator.validatePhone = (phone) => {
  return (
    window.TouchAfrica?.ValidationPatterns?.SA_PHONE_REGEX?.test(phone) ||
    /^\+?[\d\s\-\(\)]+$/.test(phone)
  );
};

FormValidator.validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  if (password.length < minLength) return false;
  if (requireUppercase && !/[A-Z]/.test(password)) return false;
  if (requireLowercase && !/[a-z]/.test(password)) return false;
  if (requireNumbers && !/\d/.test(password)) return false;
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return false;

  return true;
};

FormValidator.validateCreditCard = (number) => {
  // Luhn algorithm
  const digits = number.replace(/\D/g, "");
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = FormValidator;
}
