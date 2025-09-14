// Base Modal Component for TouchAfrica
class ModalBase {
  constructor(options = {}) {
    this.options = {
      id: options.id || `modal-${Date.now()}`,
      title: options.title || "",
      content: options.content || "",
      size: options.size || "md", // sm, md, lg, xl, fullscreen
      backdrop: options.backdrop !== false, // true, false, 'static'
      keyboard: options.keyboard !== false,
      focus: options.focus !== false,
      show: options.show !== false,
      animation: options.animation !== false,
      className: options.className || "",
      onShow: options.onShow || null,
      onShown: options.onShown || null,
      onHide: options.onHide || null,
      onHidden: options.onHidden || null,
    };

    this.isShown = false;
    this.element = null;
    this.overlay = null;
    this.focusableElements = [];
    this.previousActiveElement = null;

    this.create();
    this.bindEvents();

    if (this.options.show) {
      this.show();
    }
  }

  create() {
    // Create modal overlay
    this.overlay = document.createElement("div");
    this.overlay.className = `modal-overlay${
      this.options.animation ? " modal-fade" : ""
    }`;
    this.overlay.id = this.options.id;

    if (this.options.className) {
      this.overlay.classList.add(this.options.className);
    }

    // Create modal dialog
    const dialog = document.createElement("div");
    dialog.className = `modal-dialog modal-${this.options.size}`;

    // Create modal content
    this.element = document.createElement("div");
    this.element.className = "modal-content";

    // Create header
    if (this.options.title) {
      const header = document.createElement("div");
      header.className = "modal-header";

      const title = document.createElement("h3");
      title.className = "modal-title";
      title.textContent = this.options.title;

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "modal-close";
      closeButton.innerHTML = "&times;";
      closeButton.setAttribute("aria-label", "Close");

      header.appendChild(title);
      header.appendChild(closeButton);
      this.element.appendChild(header);
    }

    // Create body
    const body = document.createElement("div");
    body.className = "modal-body";

    if (typeof this.options.content === "string") {
      body.innerHTML = this.options.content;
    } else if (this.options.content instanceof HTMLElement) {
      body.appendChild(this.options.content);
    }

    this.element.appendChild(body);

    // Assemble modal
    dialog.appendChild(this.element);
    this.overlay.appendChild(dialog);

    // Add to DOM but keep hidden
    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    // Close button
    const closeButton = this.element.querySelector(".modal-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.hide());
    }

    // Backdrop click
    if (this.options.backdrop === true) {
      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) {
          this.hide();
        }
      });
    }

    // Keyboard events
    if (this.options.keyboard) {
      document.addEventListener("keydown", (e) => {
        if (this.isShown && e.key === "Escape") {
          this.hide();
        }

        // Trap focus
        if (this.isShown && e.key === "Tab") {
          this.trapFocus(e);
        }
      });
    }
  }

  show() {
    if (this.isShown) return;

    // Store currently focused element
    this.previousActiveElement = document.activeElement;

    // Call onShow callback
    if (this.options.onShow) {
      const result = this.options.onShow(this);
      if (result === false) return;
    }

    // Show modal
    this.overlay.classList.add("show");
    this.isShown = true;
    document.body.classList.add("modal-open");

    // Set focus
    if (this.options.focus) {
      this.setFocus();
    }

    // Update focusable elements
    this.updateFocusableElements();

    // Call onShown callback
    if (this.options.onShown) {
      setTimeout(() => this.options.onShown(this), 150);
    }
  }

  hide() {
    if (!this.isShown) return;

    // Call onHide callback
    if (this.options.onHide) {
      const result = this.options.onHide(this);
      if (result === false) return;
    }

    // Hide modal
    this.overlay.classList.remove("show");
    this.isShown = false;
    document.body.classList.remove("modal-open");

    // Restore focus
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }

    // Call onHidden callback
    if (this.options.onHidden) {
      setTimeout(() => this.options.onHidden(this), 150);
    }
  }

  toggle() {
    if (this.isShown) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy() {
    this.hide();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }

  setTitle(title) {
    const titleElement = this.element.querySelector(".modal-title");
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  setContent(content) {
    const body = this.element.querySelector(".modal-body");
    if (body) {
      if (typeof content === "string") {
        body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        body.innerHTML = "";
        body.appendChild(content);
      }
    }
    this.updateFocusableElements();
  }

  getContent() {
    const body = this.element.querySelector(".modal-body");
    return body ? body.innerHTML : "";
  }

  setFooter(content) {
    let footer = this.element.querySelector(".modal-footer");

    if (!footer) {
      footer = document.createElement("div");
      footer.className = "modal-footer";
      this.element.appendChild(footer);
    }

    if (typeof content === "string") {
      footer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      footer.innerHTML = "";
      footer.appendChild(content);
    }
  }

  removeFooter() {
    const footer = this.element.querySelector(".modal-footer");
    if (footer) {
      footer.remove();
    }
  }

  updateFocusableElements() {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors)
    );
  }

  setFocus() {
    const firstFocusable = this.focusableElements[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      this.element.focus();
    }
  }

  trapFocus(event) {
    if (this.focusableElements.length === 0) return;

    const firstFocusable = this.focusableElements[0];
    const lastFocusable =
      this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        event.preventDefault();
      }
    }
  }

  // Static methods for creating common modals
  static alert(message, title = "Alert") {
    return new ModalBase({
      title: title,
      content: `<p>${message}</p>`,
      size: "sm",
    });
  }

  static confirm(
    message,
    title = "Confirm",
    onConfirm = null,
    onCancel = null
  ) {
    const modal = new ModalBase({
      title: title,
      content: `<p>${message}</p>`,
      size: "sm",
    });

    modal.setFooter(`
            <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="btn btn-primary" data-action="confirm">Confirm</button>
        `);

    modal.element.addEventListener("click", (e) => {
      if (e.target.dataset.action === "confirm") {
        if (onConfirm) onConfirm();
        modal.hide();
      } else if (e.target.dataset.action === "cancel") {
        if (onCancel) onCancel();
        modal.hide();
      }
    });

    return modal;
  }

  static loading(message = "Loading...") {
    return new ModalBase({
      content: `
                <div class="text-center">
                    <div class="spinner spinner-lg mb-3"></div>
                    <p>${message}</p>
                </div>
            `,
      size: "sm",
      backdrop: "static",
      keyboard: false,
    });
  }
}

// Make globally available
window.ModalBase = ModalBase;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ModalBase;
}
