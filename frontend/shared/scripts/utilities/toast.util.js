/**
 * Toast Notification Utility
 *
 * Provides a consistent interface for showing toast notifications
 * across the TouchAfrica application. Ensures the notification
 * system is loaded and initialized before showing notifications.
 *
 * This utility replaces all native alert() and provides better UX.
 */

class ToastNotificationUtil {
  static isInitialized = false;
  static initPromise = null;

  /**
   * Ensures the notification system is loaded and initialized
   * @returns {Promise<boolean>} True if initialization successful
   */
  static async ensureInitialized() {
    if (this.isInitialized) return true;

    // Prevent multiple simultaneous initializations
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    const result = await this.initPromise;
    this.initPromise = null;
    return result;
  }

  static async _initialize() {
    try {
      // Check if notification system is already available
      if (window.TANotification) {
        this.isInitialized = true;
        return true;
      }

      // Load notification system if not already loaded
      if (!document.querySelector('script[src*="notification.js"]')) {
        const script = document.createElement("script");
        script.src = "/frontend/shared/scripts/components/notification.js";
        document.head.appendChild(script);

        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          // Timeout after 5 seconds
          setTimeout(
            () => reject(new Error("Notification script load timeout")),
            5000
          );
        });
      }

      // Wait a bit more for the script to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Initialize if available
      if (
        window.TANotification &&
        typeof window.TANotification.init === "function"
      ) {
        window.TANotification.init({
          position: "top-right",
          maxNotifications: 5,
          defaultDuration: 5000,
          pauseOnHover: true,
          closeButton: true,
          progressBar: true,
        });
        this.isInitialized = true;
        return true;
      }

      console.warn("TANotification not available after loading script");
      return false;
    } catch (error) {
      console.error("Failed to initialize notification system:", error);
      return false;
    }
  }

  /**
   * Shows a success notification
   * @param {string} message - The success message
   * @param {Object} options - Additional options
   */
  static async success(message, options = {}) {
    await this.ensureInitialized();
    if (window.TANotification) {
      window.TANotification.success(message, options);
    } else {
      console.log("✅ SUCCESS:", message);
    }
  }

  /**
   * Shows an error notification
   * @param {string} message - The error message
   * @param {Object} options - Additional options
   */
  static async error(message, options = {}) {
    await this.ensureInitialized();
    if (window.TANotification) {
      window.TANotification.error(message, options);
    } else {
      console.error("❌ ERROR:", message);
    }
  }

  /**
   * Shows a warning notification
   * @param {string} message - The warning message
   * @param {Object} options - Additional options
   */
  static async warning(message, options = {}) {
    await this.ensureInitialized();
    if (window.TANotification) {
      window.TANotification.warning(message, options);
    } else {
      console.warn("⚠️ WARNING:", message);
    }
  }

  /**
   * Shows an info notification
   * @param {string} message - The info message
   * @param {Object} options - Additional options
   */
  static async info(message, options = {}) {
    await this.ensureInitialized();
    if (window.TANotification) {
      window.TANotification.info(message, options);
    } else {
      console.info("ℹ️ INFO:", message);
    }
  }

  /**
   * Shows a notification with specified type
   * @param {string} type - Type of notification (success, error, warning, info)
   * @param {string} message - The message to show
   * @param {Object} options - Additional options
   */
  static async show(type, message, options = {}) {
    switch (type.toLowerCase()) {
      case "success":
        return this.success(message, options);
      case "error":
        return this.error(message, options);
      case "warning":
        return this.warning(message, options);
      case "info":
        return this.info(message, options);
      default:
        return this.info(message, options);
    }
  }

  /**
   * DEPRECATED: Use ToastNotificationUtil.error() instead
   * @deprecated This method is provided for backward compatibility only
   */
  static alert(message) {
    console.warn(
      "alert() is deprecated. Use ToastNotificationUtil.error() instead."
    );
    this.error(message, { title: "Alert" });
  }

  /**
   * Shows a validation error with multiple field errors
   * @param {Object} errors - Object with field names as keys and error messages as values
   * @param {string} title - Optional title for the notification
   */
  static async validationError(errors, title = "Validation Error") {
    const fieldCount = Object.keys(errors).length;
    const firstError = Object.values(errors)[0];

    if (fieldCount === 1) {
      await this.error(firstError, { title });
    } else {
      const errorList = Object.entries(errors)
        .map(([field, message]) => `• ${field}: ${message}`)
        .join("\n");

      await this.error(`Multiple validation errors:\n${errorList}`, {
        title,
        duration: 8000, // Longer duration for multiple errors
      });
    }
  }

  /**
   * Shows a network error notification with retry suggestion
   * @param {string} operation - What operation failed
   * @param {Error} error - The network error
   */
  static async networkError(operation, error) {
    const message = `Failed to ${operation}. Please check your connection and try again.`;
    await this.error(message, {
      title: "Network Error",
      duration: 6000,
    });
    console.error(`Network error during ${operation}:`, error);
  }

  /**
   * Shows an operation success notification
   * @param {string} operation - What operation succeeded
   * @param {string} details - Optional additional details
   */
  static async operationSuccess(operation, details = "") {
    const message = `${operation} completed successfully${
      details ? ": " + details : ""
    }`;
    await this.success(message, {
      title: "Success",
      duration: 4000,
    });
  }
}

// Make it globally available
if (typeof window !== "undefined") {
  window.ToastNotificationUtil = ToastNotificationUtil;

  // Also provide a shorter alias
  window.Toast = ToastNotificationUtil;
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ToastNotificationUtil;
}
