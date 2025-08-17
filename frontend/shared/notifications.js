/**
 * NeighbourGuard™ Notification System
 * Handles snackbars, alerts, and toast notifications
 */
class NotificationSystem {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.nextId = 1;
    this.init();
  }

  /**
   * Initialize notification system
   */
  init() {
    this.createContainer();
    this.attachStyles();
  }

  /**
   * Create notification container
   */
  createContainer() {
    this.container = document.createElement("div");
    this.container.id = "notification-container";
    this.container.className = "notification-container";
    document.body.appendChild(this.container);
  }

  /**
   * Attach notification styles
   */
  attachStyles() {
    if (document.getElementById("notification-styles")) return;

    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: var(--z-toast, 10001);
        pointer-events: none;
        max-width: 400px;
        width: 100%;
      }

      .notification {
        background: white;
        border-radius: var(--radius-lg, 8px);
        box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
        margin-bottom: var(--spacing-md, 12px);
        padding: var(--spacing-lg, 16px);
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-md, 12px);
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: var(--transition-base, all 0.2s ease-in-out);
        border-left: 4px solid;
        position: relative;
        overflow: hidden;
      }

      .notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .notification.hide {
        transform: translateX(100%);
        opacity: 0;
      }

      .notification--success {
        border-left-color: var(--color-success, #10b981);
        background: var(--color-success-50, #ecfdf5);
      }

      .notification--error {
        border-left-color: var(--color-error, #ef4444);
        background: var(--color-error-50, #fef2f2);
      }

      .notification--warning {
        border-left-color: var(--color-warning, #f59e0b);
        background: var(--color-warning-50, #fffbeb);
      }

      .notification--info {
        border-left-color: var(--color-info, #3b82f6);
        background: var(--color-info-50, #eff6ff);
      }

      .notification__icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        margin-top: 2px;
      }

      .notification__icon--success {
        color: var(--color-success-600, #059669);
      }

      .notification__icon--error {
        color: var(--color-error-600, #dc2626);
      }

      .notification__icon--warning {
        color: var(--color-warning-600, #d97706);
      }

      .notification__icon--info {
        color: var(--color-info-600, #2563eb);
      }

      .notification__content {
        flex: 1;
        min-width: 0;
      }

      .notification__title {
        font-weight: var(--font-weight-semibold, 600);
        font-size: var(--font-size-sm, 14px);
        color: var(--color-text-primary, #111827);
        margin: 0 0 4px 0;
      }

      .notification__message {
        font-size: var(--font-size-sm, 14px);
        color: var(--color-text-secondary, #6b7280);
        margin: 0;
        line-height: var(--line-height-base, 1.5);
      }

      .notification__close {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--spacing-xs, 4px);
        border-radius: var(--radius-default, 4px);
        color: var(--color-text-muted, #9ca3af);
        transition: var(--transition-base, all 0.2s ease-in-out);
        flex-shrink: 0;
      }

      .notification__close:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--color-text-secondary, #6b7280);
      }

      .notification__progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.3;
        transform-origin: left;
        transition: transform linear;
      }

      .notification--success .notification__progress {
        color: var(--color-success-600, #059669);
      }

      .notification--error .notification__progress {
        color: var(--color-error-600, #dc2626);
      }

      .notification--warning .notification__progress {
        color: var(--color-warning-600, #d97706);
      }

      .notification--info .notification__progress {
        color: var(--color-info-600, #2563eb);
      }

      /* Action buttons */
      .notification__actions {
        display: flex;
        gap: var(--spacing-sm, 8px);
        margin-top: var(--spacing-sm, 8px);
      }

      .notification__action {
        background: none;
        border: 1px solid currentColor;
        color: inherit;
        border-radius: var(--radius-default, 4px);
        padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
        font-size: var(--font-size-xs, 12px);
        font-weight: var(--font-weight-medium, 500);
        cursor: pointer;
        transition: var(--transition-base, all 0.2s ease-in-out);
      }

      .notification__action:hover {
        background: currentColor;
        color: white;
      }

      /* Mobile responsiveness */
      @media (max-width: 640px) {
        .notification-container {
          left: 20px;
          right: 20px;
          max-width: none;
        }

        .notification {
          transform: translateY(-100%);
        }

        .notification.show {
          transform: translateY(0);
        }

        .notification.hide {
          transform: translateY(-100%);
        }
      }

      /* High contrast mode */
      @media (prefers-contrast: high) {
        .notification {
          border-left-width: 6px;
          border: 2px solid;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .notification {
          transition: opacity 0.1s ease-in-out;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Show notification
   */
  show(options) {
    const {
      type = "info",
      title,
      message,
      duration = 5000,
      persistent = false,
      actions = [],
      onClose,
    } = options;

    const id = this.nextId++;
    const notification = this.createNotification(id, {
      type,
      title,
      message,
      persistent,
      actions,
      onClose,
    });

    this.notifications.set(id, notification);
    this.container.appendChild(notification.element);

    // Trigger show animation
    requestAnimationFrame(() => {
      notification.element.classList.add("show");
    });

    // Auto-hide after duration
    if (!persistent && duration > 0) {
      notification.progressBar?.style.setProperty(
        "transition",
        `transform ${duration}ms linear`
      );
      notification.progressBar?.style.setProperty("transform", "scaleX(0)");

      notification.timeout = setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return id;
  }

  /**
   * Create notification element
   */
  createNotification(id, options) {
    const { type, title, message, persistent, actions, onClose } = options;

    const element = document.createElement("div");
    element.className = `notification notification--${type}`;
    element.setAttribute("role", "alert");
    element.setAttribute(
      "aria-live",
      type === "error" ? "assertive" : "polite"
    );

    const icon = this.getIcon(type);
    const hasActions = actions.length > 0;

    element.innerHTML = `
      <div class="notification__icon notification__icon--${type}">
        ${icon}
      </div>
      <div class="notification__content">
        ${title ? `<p class="notification__title">${title}</p>` : ""}
        <p class="notification__message">${message}</p>
        ${
          hasActions
            ? `
          <div class="notification__actions">
            ${actions
              .map(
                (action, index) =>
                  `<button class="notification__action" data-action="${index}">
                ${action.label}
              </button>`
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
      <button class="notification__close" aria-label="Close notification">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      ${!persistent ? '<div class="notification__progress"></div>' : ""}
    `;

    // Add event listeners
    const closeBtn = element.querySelector(".notification__close");
    closeBtn.addEventListener("click", () => {
      this.hide(id);
      onClose?.();
    });

    // Add action button listeners
    if (hasActions) {
      const actionButtons = element.querySelectorAll(".notification__action");
      actionButtons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
          const action = actions[index];
          action.handler?.();
          if (action.closeOnClick !== false) {
            this.hide(id);
          }
        });
      });
    }

    return {
      element,
      progressBar: element.querySelector(".notification__progress"),
      timeout: null,
    };
  }

  /**
   * Hide notification
   */
  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    if (notification.timeout) {
      clearTimeout(notification.timeout);
    }

    notification.element.classList.add("hide");

    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 200);
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications.forEach((_, id) => {
      this.hide(id);
    });
  }

  /**
   * Get icon for notification type
   */
  getIcon(type) {
    const icons = {
      success: `
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      `,
      error: `
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      `,
      warning: `
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      `,
      info: `
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      `,
    };

    return icons[type] || icons.info;
  }

  /**
   * Convenience methods
   */
  success(title, message, options = {}) {
    return this.show({
      type: "success",
      title,
      message,
      ...options,
    });
  }

  error(title, message, options = {}) {
    return this.show({
      type: "error",
      title,
      message,
      duration: 8000, // Longer duration for errors
      ...options,
    });
  }

  warning(title, message, options = {}) {
    return this.show({
      type: "warning",
      title,
      message,
      ...options,
    });
  }

  info(title, message, options = {}) {
    return this.show({
      type: "info",
      title,
      message,
      ...options,
    });
  }

  /**
   * Show API error notification
   */
  showAPIError(error, customMessage) {
    let title = "Error";
    let message =
      customMessage || error.message || "An unexpected error occurred";

    if (error.isAuthError?.()) {
      title = "Authentication Error";
      message = "Please log in again to continue";
    } else if (error.isValidationError?.()) {
      title = "Validation Error";
      message = "Please check your input and try again";
    }

    return this.error(title, message, {
      actions: error.isAuthError?.()
        ? [
            {
              label: "Login",
              handler: () => {
                window.location.href = "/";
              },
            },
          ]
        : [],
    });
  }

  /**
   * Show loading notification
   */
  showLoading(message = "Loading...") {
    return this.show({
      type: "info",
      message,
      persistent: true,
    });
  }
}

// Create global notification system
window.notifications = new NotificationSystem();

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = NotificationSystem;
}
