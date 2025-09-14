/* filepath: c:\Users\Development\Desktop\New TouchAfrica\frontend\home\modals\service.request.modal\service.request.modal.js */
/**
 * Service Request Modal - Modern Clean Implementation
 */

// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
  ValidationHelpers,
  VALIDATION_MESSAGES,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  "use strict";

  let modal = null;
  let form = null;
  let submitBtn = null;
  let isSubmitting = false;

  // Lightweight API client loader (browser ESM)
  let api = null;

  async function getApiClient() {
    if (api) return api;
    const loc = window.location;
    let baseUrl =
      window.__API_BASE_URL__ ||
      (loc.origin.endsWith("/") ? loc.origin.slice(0, -1) : loc.origin);
    let clientPath = window.__API_CLIENT_PATH__ || "/integration/api-client.js";

    // Heuristic: if running the page on a non-5000 port and no overrides are set,
    // assume the Express server is on port 5000 for both the API base and client path.
    if (!window.__API_BASE_URL__) {
      if (loc.port && loc.port !== "5000") {
        baseUrl = `${loc.protocol}//${loc.hostname}:5000`;
      }
    }
    if (!window.__API_CLIENT_PATH__ && clientPath.startsWith("/")) {
      if (loc.port && loc.port !== "5000") {
        clientPath = `${loc.protocol}//${loc.hostname}:5000${clientPath}`;
      }
    }
    // Debug: show where we're loading the client from
    try {
      console.debug(
        "[ServiceRequest] API client path:",
        clientPath,
        "baseUrl:",
        baseUrl
      );
    } catch {}

    // Load the TouchAfrica API client via dynamic import
    const module = await import(clientPath);
    api = new module.TouchAfricaApiClient({ baseUrl });
    console.debug(
      "[ServiceRequest] Successfully loaded TouchAfricaApiClient from:",
      clientPath
    );

    return api;
  }

  // Initialize modal
  async function initModal() {
    try {
      // Create modal container if it doesn't exist
      if (!document.getElementById("serviceRequestModal")) {
        const modalContainer = document.createElement("div");
        modalContainer.id = "serviceRequestModal";
        document.body.appendChild(modalContainer);
      }

      modal = document.getElementById("serviceRequestModal");

      // Load modal HTML
      const response = await fetch(
        "/frontend/home/modals/service.request.modal/service.request.modal.html"
      );
      if (!response.ok) throw new Error("Failed to load modal HTML");

      const html = await response.text();
      modal.innerHTML = html;

      // Get form elements
      form = document.getElementById("serviceReq_serviceRequestForm");
      submitBtn = form.querySelector(".btn-submit");

      // Setup event handlers
      setupEventHandlers();
      setupValidation();

      // Populate dynamic selects
      await populateTitleOptions();
    } catch (error) {
      console.error("Error initializing service request modal:", error);
    }
  }

  // Setup event handlers
  function setupEventHandlers() {
    // Close button
    const closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    // Click outside to close
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Form submission
    form.addEventListener("submit", handleSubmit);

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("show")) {
        closeModal();
      }
    });
  }

  // Setup real-time validation
  function setupValidation() {
    const inputs = form.querySelectorAll(
      'input:not([type="hidden"]), textarea, select'
    );

    inputs.forEach((input) => {
      // Clear error on focus
      input.addEventListener("focus", () => {
        input.classList.remove("error");
        const errorEl = form.querySelector(
          `.error-message[data-for="${input.name}"]`
        );
        if (errorEl) {
          errorEl.textContent = "";
          errorEl.style.display = ""; // let :empty hide again
        }
      });

      // Validate on blur/change
      input.addEventListener("blur", () => {
        validateField(input);
      });
      if (input.tagName === "SELECT") {
        input.addEventListener("change", () => validateField(input));
      }

      // Real-time validation for some fields
      if (input.type === "email") {
        input.addEventListener(
          "input",
          debounce(() => validateField(input), 500)
        );
      }
    });
  }

  // Validate individual field
  function validateField(field) {
    const name = field.name;
    const value = field.value.trim();
    const errorEl = form.querySelector(`.error-message[data-for="${name}"]`);

    // Reset error state
    field.classList.remove("error");
    if (errorEl) errorEl.textContent = "";

    // Required check
    if (field.required && !value) {
      showFieldError(field, "This field is required");
      return false;
    }

    // Select validation
    if (field.tagName === "SELECT") {
      if (field.required && !value) {
        showFieldError(field, "Please select an option");
        return false;
      }
      if (value && value.length < 2) {
        showFieldError(field, "Please choose a valid option");
        return false;
      }
    }

    // Email validation
    if (field.type === "email" && value) {
      if (!ValidationHelpers.isValidEmail(value)) {
        showFieldError(field, VALIDATION_MESSAGES.EMAIL);
        return false;
      }
    }

    // Phone validation using centralized SA phone regex
    if (field.type === "tel" && value) {
      if (!ValidationHelpers.isValidSAPhone(value.replace(/[\s()-]/g, ""))) {
        showFieldError(field, VALIDATION_MESSAGES.SA_PHONE);
        return false;
      }
      return true;
    }

    // Min length validation
    if (field.minLength > 0 && value.length < field.minLength) {
      showFieldError(field, `Minimum ${field.minLength} characters required`);
      return false;
    }

    // Max length validation
    if (field.maxLength > 0 && value.length > field.maxLength) {
      showFieldError(field, `Maximum ${field.maxLength} characters allowed`);
      return false;
    }

    return true;
  }

  // Show field error
  function showFieldError(field, message) {
    field.classList.add("error");
    const errorEl = form.querySelector(
      `.error-message[data-for="${field.name}"]`
    );
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block"; // ensure visible despite :empty rule
    }
  }

  // Validate entire form
  function validateForm() {
    const inputs = form.querySelectorAll(
      'input:not([type="hidden"]), textarea, select'
    );
    let isValid = true;

    inputs.forEach((input) => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate form
    if (!validateForm()) {
      // Find first error and focus
      const firstError = form.querySelector(".error");
      if (firstError) firstError.focus();
      return;
    }

    isSubmitting = true;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    try {
      // Prepare data
      const formData = new FormData(form);
      const data = {};

      // Process form data
      formData.forEach((value, key) => {
        if (key.includes(".")) {
          // Handle nested objects (contactInfo.email)
          const keys = key.split(".");
          let obj = data;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
          }
          obj[keys[keys.length - 1]] = value;
        } else {
          data[key] = value;
        }
      });

      // Clean phone number
      if (data.contactInfo && data.contactInfo.phoneNumber) {
        data.contactInfo.phoneNumber = data.contactInfo.phoneNumber.replace(
          /[\s()-]/g,
          ""
        );
      }

      // Submit to API via client
      const client = await getApiClient();
      const result = await client.serviceRequests.create(data);

      if (result) {
        // Success
        showSuccess(
          "Your request has been submitted successfully! We'll get back to you within 1 business day."
        );
        form.reset();
        // Close the modal first, then show the toast afterwards
        setTimeout(() => {
          closeModal();
          // Show toast after modal is closed
          (async () => {
            await showToast("success", "Service request created", {
              title: "Success",
              duration: 4000,
            });
          })();
        }, 3000);
      } else {
        // API error
        showError("Failed to submit request. Please try again.");
        await showToast("error", "Failed to create service request", {
          title: "Error",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      const msg =
        error?.data?.message ||
        error?.message ||
        "Network error. Please check your connection and try again.";
      showError(msg);
      await showToast("error", msg, { title: "Error", duration: 6000 });
    } finally {
      isSubmitting = false;
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  }

  // Toast helper using the single source of truth (TANotification)
  async function showToast(type, message, opts = {}) {
    try {
      if (window.ensureNotifications) {
        await window.ensureNotifications();
      } else if (!window.TANotification) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "/frontend/shared/scripts/components/notification.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (window.TANotification) {
        const fn = type === "success" ? "success" : "error";
        window.TANotification[fn](
          message,
          Object.assign({ duration: 3500 }, opts)
        );
      }
    } catch {}
  }

  // Show success message
  function showSuccess(message) {
    // Create or update success element
    let successEl = form.querySelector(".success-message");
    if (!successEl) {
      successEl = document.createElement("div");
      successEl.className = "success-message";
      form.insertBefore(successEl, submitBtn);
    }
    successEl.textContent = message;
    successEl.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
            animation: slideDown 0.3s ease;
        `;
  }

  // Show error message
  function showError(message) {
    // Create or update error element
    let errorEl = form.querySelector(".form-error-message");
    if (!errorEl) {
      errorEl = document.createElement("div");
      errorEl.className = "form-error-message";
      form.insertBefore(errorEl, submitBtn);
    }
    errorEl.textContent = message;
    errorEl.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: center;
            animation: shake 0.3s ease;
        `;

    // Remove after 5 seconds
    setTimeout(() => {
      errorEl.remove();
    }, 5000);
  }

  // Open modal
  function openModal() {
    if (!modal) {
      initModal().then(() => {
        modal.classList.add("show");
        // Focus first visible input
        const firstInput = form.querySelector('input:not([type="hidden"])');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
      });
    } else {
      modal.classList.add("show");
      const firstInput = form.querySelector('input:not([type="hidden"])');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  }

  // Close modal
  function closeModal() {
    if (modal) {
      // Reset form and validation state
      try {
        form.reset();
      } catch {}
      const errEls = form.querySelectorAll(".error-message");
      errEls.forEach((e) => {
        e.textContent = "";
        e.style.display = "";
      });
      const errored = form.querySelectorAll(".error");
      errored.forEach((el) => el.classList.remove("error"));
      // Remove transient messages
      const messages = form.querySelectorAll(
        ".success-message, .form-error-message"
      );
      messages.forEach((msg) => msg.remove());
      modal.classList.remove("show");
    }
  }

  // Populate Title options with a hard-coded standard list
  async function populateTitleOptions() {
    const select = form.querySelector("#serviceReq_title");
    if (!select) return;

    // Clear then add default
    select.innerHTML = '<option value="">Select Title</option>';

    const titles = [
      "Mr",
      "Mrs",
      "Ms",
      "Miss",
      "Mx",
      "Dr",
      "Prof",
      "Sir",
      "Dame",
      "Rev",
    ];

    titles.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });
  }

  // Utility: Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModal);
  } else {
    initModal();
  }

  // Export to global scope
  window.openServiceRequestModal = openModal;
  window.closeServiceRequestModal = closeModal;
})();
