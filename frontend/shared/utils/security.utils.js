/**
 * Security Utility Functions
 * Provides XSS protection and secure DOM manipulation for all modals
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Safely sets innerHTML with XSS protection
 * @param {HTMLElement} element - The target element
 * @param {string} content - The content to set (will be escaped)
 */
function secureSetHTML(element, content) {
  if (!element) return;
  element.innerHTML = escapeHtml(content);
}

/**
 * Safely sets innerHTML for trusted content (pre-escaped or known safe)
 * Use this only for content that is already sanitized or comes from trusted sources
 * @param {HTMLElement} element - The target element
 * @param {string} content - The trusted content to set
 */
function trustedSetHTML(element, content) {
  if (!element) return;
  element.innerHTML = content;
}

/**
 * Safely inserts HTML with XSS protection
 * @param {HTMLElement} element - The target element
 * @param {string} position - The position to insert ('beforebegin', 'afterbegin', 'beforeend', 'afterend')
 * @param {string} content - The content to insert (will be escaped)
 */
function secureInsertHTML(element, position, content) {
  if (!element) return;
  element.insertAdjacentHTML(position, escapeHtml(content));
}

/**
 * Safely inserts trusted HTML content
 * Use this only for content that is already sanitized or comes from trusted sources
 * @param {HTMLElement} element - The target element
 * @param {string} position - The position to insert
 * @param {string} content - The trusted content to insert
 */
function trustedInsertHTML(element, position, content) {
  if (!element) return;
  element.insertAdjacentHTML(position, content);
}

/**
 * Safely sets text content (automatically safe from XSS)
 * @param {HTMLElement} element - The target element
 * @param {string} content - The text content to set
 */
function secureSetText(element, content) {
  if (!element) return;
  element.textContent = content || "";
}

/**
 * Validates and sanitizes server response before DOM insertion
 * @param {string} response - The server response
 * @returns {string} - The sanitized response
 */
function sanitizeServerResponse(response) {
  if (typeof response !== "string") return "";

  // Basic sanitization - remove script tags and dangerous attributes
  return response
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Creates a secure option element for select dropdowns
 * @param {string} value - The option value
 * @param {string} text - The option text
 * @param {boolean} selected - Whether the option is selected
 * @returns {string} - The safe option HTML
 */
function createSecureOption(value, text, selected = false) {
  const escapedValue = escapeHtml(value);
  const escapedText = escapeHtml(text);
  const selectedAttr = selected ? " selected" : "";
  return `<option value="${escapedValue}"${selectedAttr}>${escapedText}</option>`;
}

/**
 * Builds secure select options from data array
 * @param {Array} items - Array of {value, text} objects
 * @param {string} selectedValue - The currently selected value
 * @param {string} defaultOption - Default option text (optional)
 * @returns {string} - The safe options HTML
 */
function buildSecureSelectOptions(
  items,
  selectedValue = "",
  defaultOption = null
) {
  let html = "";

  if (defaultOption) {
    html += createSecureOption("", defaultOption, !selectedValue);
  }

  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (item && typeof item === "object") {
        const value = item.value || item.id || "";
        const text = item.text || item.name || item.description || value;
        const selected = String(value) === String(selectedValue);
        html += createSecureOption(value, text, selected);
      }
    });
  }

  return html;
}

// Export functions for use in modals
if (typeof module !== "undefined" && module.exports) {
  // Node.js environment
  module.exports = {
    escapeHtml,
    secureSetHTML,
    trustedSetHTML,
    secureInsertHTML,
    trustedInsertHTML,
    secureSetText,
    sanitizeServerResponse,
    createSecureOption,
    buildSecureSelectOptions,
  };
} else {
  // Browser environment - attach to window
  window.SecurityUtils = {
    escapeHtml,
    secureSetHTML,
    trustedSetHTML,
    secureInsertHTML,
    trustedInsertHTML,
    secureSetText,
    sanitizeServerResponse,
    createSecureOption,
    buildSecureSelectOptions,
  };
}
