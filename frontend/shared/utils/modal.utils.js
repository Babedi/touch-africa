/**
 * Modal Management Utility Functions
 * Provides consistent modal operations and function naming conventions
 */

/**
 * Standard modal configuration options
 */
const ModalDefaults = {
  fadeOutDuration: 300,
  backdropSelector: ".modal-backdrop",
  modalSelector: ".modal",
  formSelector: "form",
  closeButtonSelectors: '[data-bs-dismiss="modal"], .btn-close, .modal-close',
};

/**
 * Closes a modal with consistent behavior and options
 * @param {Object} options - Modal close options
 * @param {HTMLElement} options.modal - The modal element (optional, will find current modal if not provided)
 * @param {boolean} options.success - Whether the modal closed due to successful operation
 * @param {Function} options.onClose - Callback function to execute after close
 * @param {Object} options.result - Result data to pass to callback
 * @param {boolean} options.refreshParent - Whether to refresh parent data
 */
function closeModal(options = {}) {
  const {
    modal = document.querySelector(".modal.show"),
    success = false,
    onClose = null,
    result = null,
    refreshParent = false,
  } = options;

  if (!modal) return;

  // Reset modal form if present
  if (success) {
    resetModalForm(modal);
  }

  // Hide modal with native DOM methods
  modal.classList.remove("show");
  modal.style.display = "none";

  // Remove backdrop
  const backdrop = document.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.remove();
  }

  // Reset body classes
  document.body.classList.remove("modal-open");
  document.body.style.paddingRight = "";

  // Trigger custom modal hidden event
  setTimeout(() => {
    modal.dispatchEvent(new Event("modalhidden"));
  }, 50);

  // Execute callback after modal closes
  setTimeout(() => {
    if (typeof onClose === "function") {
      onClose(result);
    }

    // Refresh parent data if requested
    if (refreshParent && typeof window.refreshData === "function") {
      window.refreshData();
    }
  }, ModalDefaults.fadeOutDuration);
}

/**
 * Resets a modal form to its initial state
 * @param {HTMLElement} modalOrForm - The modal element or form element
 * @param {Object} options - Reset options
 * @param {boolean} options.clearErrors - Whether to clear validation errors
 * @param {boolean} options.resetSelects - Whether to reset select elements
 * @param {Array} options.preserveFields - Field names to preserve values
 */
function resetModalForm(modalOrForm, options = {}) {
  const {
    clearErrors = true,
    resetSelects = true,
    preserveFields = [],
  } = options;

  if (!modalOrForm) return;

  // Find the form element
  let form = modalOrForm;
  if (!form.tagName || form.tagName.toLowerCase() !== "form") {
    form = modalOrForm.querySelector("form");
  }

  if (!form) return;

  // Store values of fields to preserve
  const preservedValues = {};
  preserveFields.forEach((fieldName) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      preservedValues[fieldName] = field.value;
    }
  });

  // Reset the form
  form.reset();

  // Restore preserved values
  Object.entries(preservedValues).forEach(([fieldName, value]) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.value = value;
    }
  });

  // Clear validation errors
  if (clearErrors && window.ValidationUtils) {
    window.ValidationUtils.clearAllErrors(form);
  }

  // Reset select elements to their first option
  if (resetSelects) {
    const selects = form.querySelectorAll("select");
    selects.forEach((select) => {
      if (preserveFields.includes(select.name)) return;

      if (select.options.length > 0) {
        select.selectedIndex = 0;
      }
    });
  }

  // Clear any dynamic content areas
  const dynamicContainers = form.querySelectorAll("[data-dynamic-content]");
  dynamicContainers.forEach((container) => {
    container.innerHTML = "";
  });

  // Reset any file inputs
  const fileInputs = form.querySelectorAll('input[type="file"]');
  fileInputs.forEach((input) => {
    input.value = "";
  });

  // Reset checkboxes and radio buttons
  const checkboxes = form.querySelectorAll(
    'input[type="checkbox"], input[type="radio"]'
  );
  checkboxes.forEach((input) => {
    if (preserveFields.includes(input.name)) return;
    input.checked = input.defaultChecked;
  });
}

/**
 * Shows a modal with consistent behavior
 * @param {HTMLElement|string} modal - The modal element or selector
 * @param {Object} options - Show options
 * @param {Object} options.data - Data to populate in the modal
 * @param {Function} options.onShow - Callback after modal is shown
 * @param {boolean} options.resetForm - Whether to reset form before showing
 */
function showModal(modal, options = {}) {
  const { data = {}, onShow = null, resetForm = true } = options;

  // Get modal element
  const modalElement =
    typeof modal === "string" ? document.querySelector(modal) : modal;

  if (!modalElement) return;

  // Reset form if requested
  if (resetForm) {
    resetModalForm(modalElement);
  }

  // Populate with data
  if (Object.keys(data).length > 0) {
    populateModalForm(modalElement, data);
  }

  // Show modal with native DOM methods
  modalElement.classList.add("show");
  modalElement.style.display = "block";

  // Add body classes for modal styling
  document.body.classList.add("modal-open");

  // Execute callback and trigger custom event
  if (typeof onShow === "function") {
    // Use a small delay to ensure modal is fully shown
    setTimeout(() => {
      onShow();
      // Trigger custom modal shown event
      modalElement.dispatchEvent(new Event("modalshown"));
    }, 100);
  } else {
    // Still trigger the event even if no callback
    setTimeout(() => {
      modalElement.dispatchEvent(new Event("modalshown"));
    }, 100);
  }
}

/**
 * Populates a modal form with data
 * @param {HTMLElement} modal - The modal element
 * @param {Object} data - The data to populate
 */
function populateModalForm(modal, data) {
  if (!modal || !data) return;

  const form = modal.querySelector("form");
  if (!form) return;

  Object.entries(data).forEach(([key, value]) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (!field) return;

    const fieldType = field.type || field.tagName.toLowerCase();

    switch (fieldType) {
      case "checkbox":
        field.checked = Boolean(value);
        break;
      case "radio":
        if (field.value === String(value)) {
          field.checked = true;
        }
        break;
      case "select":
      case "select-one":
      case "select-multiple":
        field.value = value;
        break;
      default:
        field.value = value || "";
    }
  });
}

/**
 * Sets modal loading state
 * @param {HTMLElement} modal - The modal element
 * @param {boolean} loading - Whether modal is in loading state
 * @param {string} message - Loading message to display
 */
function setModalLoading(modal, loading = true, message = "Loading...") {
  if (!modal) return;

  const form = modal.querySelector("form");
  const submitButtons = modal.querySelectorAll(
    'button[type="submit"], .btn-primary'
  );
  const overlay = modal.querySelector(".modal-loading-overlay");

  if (loading) {
    // Disable form elements
    if (form) {
      const elements = form.querySelectorAll("input, select, textarea, button");
      elements.forEach((el) => {
        el.disabled = true;
      });
    }

    // Show loading overlay or create one
    if (overlay) {
      overlay.style.display = "block";
      const messageEl = overlay.querySelector(".loading-message");
      if (messageEl) {
        messageEl.textContent = message;
      }
    } else {
      const newOverlay = document.createElement("div");
      newOverlay.className = "modal-loading-overlay";
      newOverlay.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <div class="loading-message mt-2">${message}</div>
          </div>
        </div>
      `;
      modal.querySelector(".modal-content").appendChild(newOverlay);
    }

    // Update submit button text
    submitButtons.forEach((btn) => {
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    });
  } else {
    // Enable form elements
    if (form) {
      const elements = form.querySelectorAll("input, select, textarea, button");
      elements.forEach((el) => {
        el.disabled = false;
      });
    }

    // Hide loading overlay
    if (overlay) {
      overlay.style.display = "none";
    }

    // Restore submit button text
    submitButtons.forEach((btn) => {
      if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
        delete btn.dataset.originalText;
      }
    });
  }
}

/**
 * Handles form submission with standardized loading and error handling
 * @param {HTMLFormElement} form - The form element
 * @param {Function} submitHandler - The function to handle form submission
 * @param {Object} options - Submission options
 */
async function handleFormSubmission(form, submitHandler, options = {}) {
  const {
    validateBeforeSubmit = true,
    showLoading = true,
    loadingMessage = "Saving...",
    onSuccess = null,
    onError = null,
    customValidationRules = {},
  } = options;

  if (!form || typeof submitHandler !== "function") return;

  const modal = form.closest(".modal");

  try {
    // Validate form if requested
    if (validateBeforeSubmit && window.ValidationUtils) {
      const isValid = window.ValidationUtils.validateForm(
        form,
        customValidationRules
      );
      if (!isValid) {
        return;
      }
    }

    // Show loading state
    if (showLoading && modal) {
      setModalLoading(modal, true, loadingMessage);
    }

    // Execute submit handler
    const result = await submitHandler(form);

    // Handle success
    if (typeof onSuccess === "function") {
      onSuccess(result);
    } else {
      // Default success behavior
      closeModal({
        modal,
        success: true,
        result,
        refreshParent: true,
      });
    }
  } catch (error) {
    console.error("Form submission error:", error);

    // Handle error
    if (typeof onError === "function") {
      onError(error);
    } else {
      // Default error handling
      alert("An error occurred. Please try again.");
    }
  } finally {
    // Hide loading state
    if (showLoading && modal) {
      setModalLoading(modal, false);
    }
  }
}

/**
 * Sets up standard event listeners for a modal
 * @param {HTMLElement} modal - The modal element
 * @param {Object} handlers - Event handler functions
 */
function setupModalEventListeners(modal, handlers = {}) {
  if (!modal) return;

  const {
    onShow = null,
    onHide = null,
    onSubmit = null,
    onReset = null,
  } = handlers;

  // Modal show event (custom implementation)
  if (onShow) {
    modal.addEventListener("modalshown", onShow);
  }

  // Modal hide event (custom implementation)
  if (onHide) {
    modal.addEventListener("modalhidden", onHide);
  }

  // Form submission
  const form = modal.querySelector("form");
  if (form && onSubmit) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleFormSubmission(form, onSubmit);
    });
  }

  // Form reset
  if (form && onReset) {
    form.addEventListener("reset", onReset);
  }

  // Close button handlers
  const closeButtons = modal.querySelectorAll(
    ModalDefaults.closeButtonSelectors
  );
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeModal({ modal });
    });
  });
}

// Export functions for use in modals
if (typeof module !== "undefined" && module.exports) {
  // Node.js environment
  module.exports = {
    ModalDefaults,
    closeModal,
    resetModalForm,
    showModal,
    populateModalForm,
    setModalLoading,
    handleFormSubmission,
    setupModalEventListeners,
  };
} else {
  // Browser environment - attach to window
  window.ModalUtils = {
    ModalDefaults,
    closeModal,
    resetModalForm,
    showModal,
    populateModalForm,
    setModalLoading,
    handleFormSubmission,
    setupModalEventListeners,
  };
}
