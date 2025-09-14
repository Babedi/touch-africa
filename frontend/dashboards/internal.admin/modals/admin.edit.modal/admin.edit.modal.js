// Import centralized validation patterns
import {
  FIELD_VALIDATORS,
  ValidationHelper,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "adminEditModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/admin.edit.modal/admin.edit.modal.html";
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
      el.className = "modal-overlay modal-lg modal-admin-edit";
      el.setAttribute("data-modal-size", "modal-lg");
      el.setAttribute("data-version", "2.0");
      document.body.appendChild(el);
    } else {
      // Ensure existing modal has correct class
      el.className = "modal-overlay modal-lg modal-admin-edit";
      el.setAttribute("data-modal-size", "modal-lg");
      el.setAttribute("data-version", "2.0");
    }
    return el;
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

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      const res = await fetch(htmlPath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load admin edit modal HTML");
      container.innerHTML = await res.text();
      container.dataset.loaded = "1";
    }
    await ensureNotifications();
    return container;
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
    personId: FIELD_VALIDATORS.personId,
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
    password: FIELD_VALIDATORS.passwordOptional,
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
    if (!field) return true;

    // Skip validation for readonly fields completely
    if (
      field.readOnly ||
      field.hasAttribute("readonly") ||
      field.id === "personId" ||
      field.id === "email"
    ) {
      clearFieldError(field, root);
      return true;
    }

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
    const select = qs("#adminEdit_roles", root);
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

  async function loadAdmin(adminId, root) {
    if (DEBUG) console.log("Loading admin with ID:", adminId);
    const api = await getApi();
    const res = api.admins?.get
      ? await api.admins.get(adminId)
      : await api.get(`/api/v1/internal/admins/${adminId}`);
    const env = res?.data ?? res;
    if (DEBUG) console.log("Loaded admin data:", env);
    return env || {};
  }

  function setRolesSelection(root, roles) {
    const select = qs("#adminEdit_roles", root);
    if (!select) return;
    const set = new Set((roles || []).map(String));
    qsa("option", select).forEach((opt) => {
      opt.selected = set.has(String(opt.value));
    });
  }

  function wire(container, adminId) {
    const form = qs("#adminEditForm", container);
    const closeBtn = qs(".modal-close", container);
    const cancelBtn = qs('[data-action="cancel"]', container);
    if (!form) return;

    // listeners
    qsa("input, select, textarea", form).forEach((el) => {
      // Skip adding validation listeners to readonly fields
      if (
        el.readOnly ||
        el.hasAttribute("readonly") ||
        el.id === "personId" ||
        el.id === "email"
      ) {
        return;
      }

      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener("focus", () => clearFieldError(el, form));
      el.addEventListener(evt, () => validateField(el, form));
      el.addEventListener("blur", () => validateField(el, form));
    });

    const close = () => {
      container.classList.remove("show");

      // Clear any errors and reset form
      const form = qs("#adminEditForm", container);
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
        // Skip validation for readonly fields during form submission
        if (
          el.readOnly ||
          el.hasAttribute("readonly") ||
          el.id === "personId" ||
          el.id === "email"
        ) {
          return;
        }
        ok = validateField(el, form) && ok;
      });
      if (!ok) return;

      const id = qs("#adminEdit_adminId", form).value.trim() || adminId;
      const personId = qs("#adminEdit_personId", form).value.trim();
      const rolesSel = qs("#adminEdit_roles", form);
      const roles = Array.from(rolesSel.selectedOptions)
        .map((o) => o.value)
        .filter(Boolean);
      const email = qs("#adminEdit_email", form).value.trim();
      const password = qs("#adminEdit_password", form).value; // optional
      const isActiveVal = qs("#adminEdit_isActive", form).value;
      const isActive = String(isActiveVal) === "true";

      const body = {
        roles,
        personId,
        accessDetails: { email },
        account: { isActive: { value: isActive } },
      };
      if (password) body.accessDetails.password = password;

      try {
        const api = await getApi();
        const res = api.admins?.update
          ? await api.admins.update(id, body)
          : await api.put(`/api/v1/internal/admins/${id}`, { body });
        await showToast("success", "Admin updated successfully");
        window.dispatchEvent(
          new CustomEvent("admin:updated", { detail: res?.data ?? res })
        );
        close();
      } catch (err) {
        if (DEBUG) console.error("Update admin failed", err);
        const status = err?.status;
        const data = err?.data;
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
            : data?.message || "Failed to update admin"
        );
      }
    });
  }

  async function open(adminId) {
    if (DEBUG) console.log("Opening admin edit modal for adminId:", adminId);

    const container = await ensureContainer();
    // Inject HTML and wire if first time
    // Populate roles first, then load admin, then set selections/values
    const form = () => qs("#adminEditForm", container);
    if (!form()) {
      if (DEBUG) console.log("Form not found, reloading container");
      // not expected, ensure loaded again
      container.dataset.loaded = "";
      await ensureContainer();
    }

    if (DEBUG) console.log("Populating roles...");
    await populateRoles(container);
    try {
      const data = await loadAdmin(adminId, container);
      if (DEBUG) console.log("Populating form with data:", data);

      const adminIdValue = data.id || data.adminId || adminId || "";
      qs("#adminEdit_adminId", container).value = adminIdValue;

      // Store record ID on container for reference
      container.dataset.recordId = adminIdValue;

      // Update the record ID display in the header
      const recordIdEl = qs("#adminEdit_recordIdDisplay", container);
      if (recordIdEl) {
        recordIdEl.textContent = adminIdValue;
        // Ensure no masking attributes and proper display
        recordIdEl.style.webkitTextSecurity = "none";
        recordIdEl.style.textSecurity = "none";
        recordIdEl.style.fontFamily = "monospace";
        recordIdEl.setAttribute("data-no-mask", "true");
        if (DEBUG)
          console.log("[AdminEdit] Setting record ID display:", adminIdValue);
      }

      qs("#adminEdit_personId", container).value = data.personId || "";
      const email = data.accessDetails?.email || data.email || "";
      qs("#adminEdit_email", container).value = email;
      setRolesSelection(container, data.roles || []);
      const isActive = !!(
        data.account?.isActive?.value ??
        data.isActive ??
        data.active ??
        true
      );
      qs("#adminEdit_isActive", container).value = isActive ? "true" : "false";
      const lastLogin =
        Array.isArray(data.accessDetails?.lastLogin) &&
        data.accessDetails.lastLogin.length
          ? new Date(
              data.accessDetails.lastLogin[
                data.accessDetails.lastLogin.length - 1
              ]
            ).toLocaleString()
          : "—";
      const lastLoginEl = qs("#adminEdit_lastLogin", container);
      if (lastLoginEl) lastLoginEl.value = lastLogin;
    } catch (e) {
      if (DEBUG) console.error("Failed to load admin data:", e);
      await showToast("error", "Failed to load admin data");

      // Set record ID even if data loading failed
      const recordIdEl = qs("#adminEdit_recordIdDisplay", container);
      if (recordIdEl) {
        recordIdEl.textContent = adminId || "—";
        recordIdEl.style.webkitTextSecurity = "none";
        recordIdEl.style.textSecurity = "none";
        recordIdEl.style.fontFamily = "monospace";
        recordIdEl.setAttribute("data-no-mask", "true");
      }
    }

    // Wire events (idempotent)
    if (!container.dataset._wired) {
      wire(container, adminId);
      container.dataset._wired = "1";
    }

    // Use flex display for proper centering (not block)
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    setTimeout(() => container.classList.add("show"), 0);
  }

  window.openAdminEditModal = open;
})();
