// Import centralized validation patterns
import {
  createValidationRules,
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "adminCreateModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/admin.create.modal/admin.create.modal.html";
  let apiClientInstance = null;
  const DEBUG = !!window.__DEBUG__;

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }
  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      // Force modal-lg class and add version for cache busting
      el.className = "modal-overlay modal-lg modal-admin-create";
      el.setAttribute("data-modal-size", "modal-lg");
      el.setAttribute("data-version", "2.0");
      document.body.appendChild(el);
    } else {
      // Ensure existing modal has correct class
      el.className = "modal-overlay modal-lg modal-admin-create";
      el.setAttribute("data-modal-size", "modal-lg");
      el.setAttribute("data-version", "2.0");
    }
    return el;
  }

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      const res = await fetch(htmlPath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load admin create modal HTML");
      container.innerHTML = await res.text();
      container.dataset.loaded = "1";
      await ensureNotifications();
      wire(container);
    }
    return container;
  }

  async function ensureNotifications() {
    try {
      if (window.ensureNotifications) return window.ensureNotifications();
      if (!window.TANotification) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "/frontend/shared/scripts/components/notification.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (
        window.TANotification &&
        typeof window.TANotification.init === "function"
      ) {
        window.TANotification.init({
          position: "top-right",
          maxNotifications: 6,
          zIndex: 2147483647,
        });
      }
    } catch (e) {
      if (DEBUG) console.warn("Notification preload failed", e);
    }
  }

  async function showToast(type, message, opts = {}) {
    try {
      await ensureNotifications();
      if (window.TANotification) {
        const fn = type === "success" ? "success" : "error";
        window.TANotification[fn](
          message,
          Object.assign({ duration: 3500 }, opts)
        );
      }
    } catch (e) {
      if (DEBUG) console.warn("Toast failed", e);
    }
  }

  async function getApi() {
    if (apiClientInstance) return apiClientInstance;
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token =
      (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        ""
      ).trim() || null;
    apiClientInstance = new TouchAfricaApiClient({ baseUrl, token });
    return apiClientInstance;
  }

  const RULES = {
    personId: {
      required: true,
      validate: (v) => (v && v.trim().length > 0) || "Please select a person",
    },
    roles: {
      required: true,
      validate: (v) =>
        Array.isArray(v)
          ? v.length > 0 ||
            "Please select at least one role. Hold Ctrl/Cmd to select multiple roles."
          : (v && v.trim().length > 0) ||
            "Please select at least one role. Hold Ctrl/Cmd to select multiple roles.",
    },
    email: {
      required: true,
      validate: ValidationHelper.createEmailValidator("@touchafrica.co.za"),
    },
    password: FIELD_VALIDATORS.password,
    isActive: {
      required: false,
    },
  };

  function findErrorEl(field, root) {
    return (
      qs(`.invalid-feedback[data-for="${field.id}"]`, root) ||
      qs(`.invalid-feedback[data-for="${field.name}"]`, root)
    );
  }
  function setFieldError(field, message, root) {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    const el = findErrorEl(field, root);
    if (el) {
      el.textContent = message || "";
      el.style.display = message ? "block" : "";
    }
  }
  function clearFieldError(field, root) {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    const el = findErrorEl(field, root);
    if (el) {
      el.textContent = "";
      el.style.display = "";
    }
  }
  function validateField(field, root) {
    const name = field.name || field.id;
    const v = (field.value || "").trim();
    clearFieldError(field, root);
    const rule = RULES[name];
    if (!rule) return true;
    const value = field.multiple
      ? Array.from(field.selectedOptions).map((o) => o.value)
      : field.type === "checkbox"
      ? field.checked
      : v;
    if (
      rule.required &&
      (field.multiple
        ? value.length === 0
        : field.type === "checkbox"
        ? !value
        : !v)
    ) {
      setFieldError(field, "This field is required", root);
      return false;
    }
    if (rule.validate) {
      const res = rule.validate(value);
      if (res !== true) {
        setFieldError(field, typeof res === "string" ? res : "Invalid", root);
        return false;
      }
    }
    return true;
  }

  async function populateRoles(root) {
    const select = qs("#adminCreate_roles", root);
    if (!select) return;
    try {
      const api = await getApi();
      const res = await api.roles.list({
        page: 1,
        limit: 1000,
        order: "asc",
        sortBy: "roleName",
      });
      const env = res?.data ?? res;
      const items = Array.isArray(env?.data)
        ? env.data
        : Array.isArray(env)
        ? env
        : [];
      select.innerHTML = items
        .map((r) => {
          const id = r.roleId || r.id || r.code || r.name;
          const name = r.roleName || r.name || r.displayName || id;
          return `<option value="${id}">${name}</option>`;
        })
        .join("");
    } catch (e) {
      if (DEBUG) console.warn("Failed to load roles", e);
    }
  }

  async function populatePersons(root) {
    const select = qs("#adminCreate_personId", root);
    if (!select) return;
    try {
      const api = await getApi();
      const res = await api.persons.list({
        page: 1,
        limit: 1000,
        order: "asc",
        sortBy: "personalInfo.fullName",
      });
      const env = res?.data ?? res;
      const items = Array.isArray(env?.data)
        ? env.data
        : Array.isArray(env)
        ? env
        : [];

      // Keep the default "Select a person..." option and add persons
      const options = [`<option value="">Select a person...</option>`];

      items.forEach((person) => {
        // Use ONLY database ID format (PERSON000...) - NO UUID fallback
        const personId = person.id || "UNKNOWN";

        // More robust name handling
        let firstName = "";
        let lastName = "";
        let fullName = "";

        // Try to get from personalInfo first
        if (person.personalInfo) {
          firstName = person.personalInfo.firstName || "";
          lastName = person.personalInfo.lastName || "";
          fullName = person.personalInfo.fullName || "";
        }

        // Fallback to direct properties
        if (!firstName && person.firstName) firstName = person.firstName;
        if (!lastName && person.lastName) lastName = person.lastName;
        if (!lastName && person.surname) lastName = person.surname; // API uses 'surname' not 'lastName'
        if (!fullName && person.fullName) fullName = person.fullName;

        // Construct the final display name
        let displayName = "";
        if (fullName) {
          displayName = fullName;
        } else if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`;
        } else if (firstName) {
          displayName = firstName;
        } else if (lastName) {
          displayName = lastName;
        } else {
          displayName = `Person ${personId}`;
        }

        // Final fallback if somehow we still have empty name
        if (!displayName || displayName.trim() === "") {
          displayName = `Person ${personId}`;
        }

        // Display format: "ID123456789 - John Doe"
        const displayText = `${personId} - ${displayName}`;

        options.push(`<option value="${personId}">${displayText}</option>`);
      });

      select.innerHTML = options.join("");

      if (DEBUG) console.log(`Populated ${items.length} persons in dropdown`);
    } catch (e) {
      if (DEBUG) console.warn("Failed to load persons", e);

      // Fallback: Show a helpful message when API fails
      const fallbackOptions = [
        `<option value="">Select a person...</option>`,
        `<option value="" disabled>⚠️ Unable to load persons (Authentication required)</option>`,
        `<option value="" disabled>Please ensure you are logged in</option>`,
      ];
      select.innerHTML = fallbackOptions.join("");
    }
  }

  function wire(container) {
    const form = qs("#adminCreateForm", container);
    const closeBtn = qs(".modal-close", container);
    const cancelBtn = qs('[data-action="cancel"]', container);
    if (!form) return;

    // Field listeners for realtime validation
    qsa("input, select, textarea", form).forEach((el) => {
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => validateField(el, form));
      el.addEventListener("blur", () => validateField(el, form));
    });

    // Populate roles and persons on open
    populateRoles(container);
    populatePersons(container);

    const close = () => {
      container.classList.remove("show");

      // Clear any errors and reset form
      const form = qs("#adminCreateForm", container);
      if (form) {
        form.reset();
        // Clear all error messages
        qsa(".invalid-feedback", form).forEach((el) => {
          el.textContent = "";
          el.style.display = "";
        });
        // Remove validation error classes
        qsa(".is-invalid", form).forEach((el) =>
          el.classList.remove("is-invalid")
        );
      }

      setTimeout(() => {
        container.style.display = "none";
      }, 150);
    };
    closeBtn && closeBtn.addEventListener("click", close);
    cancelBtn && cancelBtn.addEventListener("click", close);
    // Removed overlay click to close - only explicit close buttons should close modal

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      qsa("input, select, textarea", form).forEach((el) => {
        ok = validateField(el, form) && ok;
      });
      if (!ok) return;

      const personId = qs("#adminCreate_personId", form).value.trim();
      const rolesSel = qs("#adminCreate_roles", form);
      const roles = Array.from(rolesSel.selectedOptions)
        .map((o) => o.value)
        .filter(Boolean);
      const email = qs("#adminCreate_email", form).value.trim();
      const password = qs("#adminCreate_password", form).value;
      const isActiveVal = qs("#adminCreate_isActive", form).value;
      const isActive = String(isActiveVal) === "true";

      const payload = {
        roles,
        personId,
        accessDetails: { email, password, lastLogin: [] },
        account: { isActive: { value: isActive, changes: [] } },
      };

      try {
        const api = await getApi();
        // Prefer module method
        const res = api.admins?.create
          ? await api.admins.create(payload)
          : await api.post("/api/v1/internal/admins", { body: payload });
        await showToast("success", "Admin created successfully");
        // Emit event so page can refresh
        const evt = new CustomEvent("admin:created", {
          detail: res?.data ?? res,
        });
        window.dispatchEvent(evt);
        close();
      } catch (err) {
        if (DEBUG) console.error("Create admin failed", err);
        const status = err?.status;
        const data = err?.data;
        // Try to map server-side validation errors
        if (data && typeof data === "object") {
          const map = data.errors || data.validation || data.fieldErrors || {};
          Object.keys(map).forEach((key) => {
            let field = qs(`#${key}`, form) || qs(`[name="${key}"]`, form);
            if (!field && key.includes(".")) {
              const last = key.split(".").pop();
              field = qs(`#${last}`, form) || qs(`[name="${last}"]`, form);
            }
            if (field)
              setFieldError(field, String(map[key] || "Invalid"), form);
          });
        }
        await showToast(
          "error",
          status === 401 || status === 403
            ? "Unauthorized"
            : data?.message || "Failed to create admin"
        );
      }
    });

    // ESC to close while open
    const escHandler = (evt) => {
      if (evt.key === "Escape") {
        evt.preventDefault();
        close();
      }
    };
    container.addEventListener("transitionend", () => {
      if (container.classList.contains("show"))
        document.addEventListener("keydown", escHandler);
      else document.removeEventListener("keydown", escHandler);
    });
  }

  async function open() {
    const container = await ensureContainer();
    // Use flex display for proper centering (not block)
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    setTimeout(() => container.classList.add("show"), 0);
  }

  window.openAdminCreateModal = open;
})();
