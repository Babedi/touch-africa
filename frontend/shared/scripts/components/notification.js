/**
 * Notification System
 * Provides toast notifications, alerts, and status messages
 */
class NotificationService {
  constructor(options = {}) {
    this.options = {
      container: "body",
      position: "top-right", // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
      maxNotifications: 5,
      defaultDuration: 5000,
      animationDuration: 300,
      allowDuplicates: false,
      pauseOnHover: true,
      closeButton: true,
      progressBar: true,
      zIndex: 2147483647,
      ...options,
    };

    this.notifications = [];
    this.container = null;
    this.init();
  }

  init() {
    this.createContainer();
    this.addStyles();
  }

  createContainer() {
    const containerId = "notification-container";
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.className = `notifications-container ${this.options.position}`;

      const parent =
        typeof this.options.container === "string"
          ? document.querySelector(this.options.container)
          : this.options.container;

      parent.appendChild(container);
    }

    // Ensure z-index is above modals/overlays
    try {
      container.style.zIndex = String(this.options.zIndex);
    } catch {}

    this.container = container;
  }

  addStyles() {
    const styleId = "notification-styles";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = this.getStyles();
    document.head.appendChild(style);
  }

  getStyles() {
    return `
            .notifications-container {
                position: fixed;
                z-index: 9999;
                max-width: 400px;
                pointer-events: none;
            }

            .notifications-container.top-right {
                top: 20px;
                right: 20px;
            }

            .notifications-container.top-left {
                top: 20px;
                left: 20px;
            }

            .notifications-container.bottom-right {
                bottom: 20px;
                right: 20px;
            }

            .notifications-container.bottom-left {
                bottom: 20px;
                left: 20px;
            }

            .notifications-container.top-center {
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
            }

            .notifications-container.bottom-center {
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
            }

            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                padding: 16px;
                position: relative;
                pointer-events: auto;
                overflow: hidden;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                border-left: 4px solid #007bff;
                min-width: 300px;
                max-width: 400px;
            }

            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .notification.hide {
                opacity: 0;
                transform: translateX(100%);
                margin-bottom: 0;
                padding-top: 0;
                padding-bottom: 0;
                max-height: 0;
            }

            .notification.success {
                border-left-color: #28a745;
            }

            .notification.warning {
                border-left-color: #ffc107;
            }

            .notification.error {
                border-left-color: #dc3545;
            }

            .notification.info {
                border-left-color: #17a2b8;
            }

            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .notification-title {
                font-weight: 600;
                font-size: 14px;
                color: #212529;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .notification-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: white;
                font-weight: bold;
            }

            .notification.success .notification-icon {
                background-color: #28a745;
            }

            .notification.warning .notification-icon {
                background-color: #ffc107;
            }

            .notification.error .notification-icon {
                background-color: #dc3545;
            }

            .notification.info .notification-icon {
                background-color: #17a2b8;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .notification-close:hover {
                color: #495057;
            }

            .notification-message {
                font-size: 13px;
                color: #6c757d;
                line-height: 1.4;
                margin: 0;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background-color: rgba(0, 0, 0, 0.1);
                transition: width linear;
            }

            .notification.success .notification-progress {
                background-color: #28a745;
            }

            .notification.warning .notification-progress {
                background-color: #ffc107;
            }

            .notification.error .notification-progress {
                background-color: #dc3545;
            }

            .notification.info .notification-progress {
                background-color: #17a2b8;
            }

            .notification.paused .notification-progress {
                animation-play-state: paused;
            }

            @media (max-width: 480px) {
                .notifications-container {
                    left: 10px !important;
                    right: 10px !important;
                    max-width: none;
                    transform: none !important;
                }

                .notification {
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
  }

  // Main notification method
  show(message, options = {}) {
    const config = {
      type: "info",
      title: null,
      duration: this.options.defaultDuration,
      persistent: false,
      onClick: null,
      ...options,
    };

    // Check for duplicates
    if (!this.options.allowDuplicates) {
      const existing = this.notifications.find(
        (n) => n.message === message && n.type === config.type && !n.isRemoving
      );
      if (existing) return existing;
    }

    // Remove oldest if at max capacity
    if (this.notifications.length >= this.options.maxNotifications) {
      this.remove(this.notifications[0]);
    }

    const notification = this.createNotification(message, config);
    this.notifications.push(notification);

    return notification;
  }

  createNotification(message, config) {
    const notification = {
      id: this.generateId(),
      message,
      type: config.type,
      title: config.title,
      duration: config.duration,
      persistent: config.persistent,
      onClick: config.onClick,
      element: null,
      timer: null,
      progressBar: null,
      startTime: null,
      remainingTime: config.duration,
      isPaused: false,
      isRemoving: false,
    };

    notification.element = this.createElement(notification);
    this.container.appendChild(notification.element);

    // Trigger show animation
    requestAnimationFrame(() => {
      notification.element.classList.add("show");
    });

    // Start auto-remove timer
    if (!notification.persistent && notification.duration > 0) {
      this.startTimer(notification);
    }

    return notification;
  }

  createElement(notification) {
    const element = document.createElement("div");
    element.className = `notification ${notification.type}`;
    element.dataset.notificationId = notification.id;

    const iconContent = this.getIconContent(notification.type);
    const title = notification.title || this.getDefaultTitle(notification.type);

    element.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <span class="notification-icon">${iconContent}</span>
                    ${title}
                </div>
                ${
                  this.options.closeButton
                    ? `
                    <button class="notification-close" type="button" aria-label="Close">
                        ×
                    </button>
                `
                    : ""
                }
            </div>
            <p class="notification-message">${notification.message}</p>
            ${
              this.options.progressBar && !notification.persistent
                ? `
                <div class="notification-progress"></div>
            `
                : ""
            }
        `;

    // Event listeners
    if (this.options.closeButton) {
      const closeBtn = element.querySelector(".notification-close");
      closeBtn.addEventListener("click", () => this.remove(notification));
    }

    if (notification.onClick) {
      element.style.cursor = "pointer";
      element.addEventListener("click", notification.onClick);
    }

    if (this.options.pauseOnHover && !notification.persistent) {
      element.addEventListener("mouseenter", () =>
        this.pauseTimer(notification)
      );
      element.addEventListener("mouseleave", () =>
        this.resumeTimer(notification)
      );
    }

    return element;
  }

  getIconContent(type) {
    const icons = {
      success: "✓",
      warning: "!",
      error: "×",
      info: "i",
    };
    return icons[type] || icons.info;
  }

  getDefaultTitle(type) {
    const titles = {
      success: "Success",
      warning: "Warning",
      error: "Error",
      info: "Information",
    };
    return titles[type] || titles.info;
  }

  startTimer(notification) {
    notification.startTime = Date.now();
    notification.timer = setTimeout(() => {
      this.remove(notification);
    }, notification.remainingTime);

    if (this.options.progressBar) {
      this.startProgressBar(notification);
    }
  }

  startProgressBar(notification) {
    const progressBar = notification.element.querySelector(
      ".notification-progress"
    );
    if (progressBar) {
      progressBar.style.width = "100%";
      progressBar.style.transition = `width ${notification.remainingTime}ms linear`;

      requestAnimationFrame(() => {
        progressBar.style.width = "0%";
      });

      notification.progressBar = progressBar;
    }
  }

  pauseTimer(notification) {
    if (notification.timer && !notification.isPaused) {
      clearTimeout(notification.timer);
      notification.remainingTime -= Date.now() - notification.startTime;
      notification.isPaused = true;

      if (notification.progressBar) {
        notification.progressBar.style.animationPlayState = "paused";
      }
    }
  }

  resumeTimer(notification) {
    if (notification.isPaused && notification.remainingTime > 0) {
      this.startTimer(notification);
      notification.isPaused = false;
    }
  }

  remove(notification) {
    if (notification.isRemoving) return;

    notification.isRemoving = true;

    if (notification.timer) {
      clearTimeout(notification.timer);
    }

    notification.element.classList.add("hide");

    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }

      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, this.options.animationDuration);
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, { ...options, type: "success" });
  }

  warning(message, options = {}) {
    return this.show(message, { ...options, type: "warning" });
  }

  error(message, options = {}) {
    return this.show(message, { ...options, type: "error" });
  }

  info(message, options = {}) {
    return this.show(message, { ...options, type: "info" });
  }

  // Management methods
  clear() {
    this.notifications.forEach((notification) => this.remove(notification));
  }

  clearByType(type) {
    this.notifications
      .filter((n) => n.type === type)
      .forEach((notification) => this.remove(notification));
  }

  removeById(id) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      this.remove(notification);
    }
  }

  // Utility methods
  generateId() {
    return "notification_" + Math.random().toString(36).substr(2, 9);
  }

  updatePosition(position) {
    this.options.position = position;
    this.container.className = `notifications-container ${position}`;
  }

  getActiveNotifications() {
    return this.notifications.filter((n) => !n.isRemoving);
  }

  hasActiveNotifications() {
    return this.getActiveNotifications().length > 0;
  }
}

// Global notification instance
let globalNotificationService = null;

// Global notification functions
const Notification = {
  init(options = {}) {
    globalNotificationService = new NotificationService(options);
    return globalNotificationService;
  },

  show(message, options = {}) {
    if (!globalNotificationService) {
      globalNotificationService = new NotificationService();
    }
    return globalNotificationService.show(message, options);
  },

  success(message, options = {}) {
    return this.show(message, { ...options, type: "success" });
  },

  warning(message, options = {}) {
    return this.show(message, { ...options, type: "warning" });
  },

  error(message, options = {}) {
    return this.show(message, { ...options, type: "error" });
  },

  info(message, options = {}) {
    return this.show(message, { ...options, type: "info" });
  },

  clear() {
    if (globalNotificationService) {
      globalNotificationService.clear();
    }
  },

  clearByType(type) {
    if (globalNotificationService) {
      globalNotificationService.clearByType(type);
    }
  },
};

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = { NotificationService, Notification };
}

// Also expose a safe global alias to avoid clashing with the Web Notifications API
// This makes it easy to access as window.TANotification from other scripts
if (typeof window !== "undefined") {
  try {
    // Prefer existing alias if already set
    if (!window.TANotification) {
      window.TANotification = Notification;
    }
  } catch {}
}
