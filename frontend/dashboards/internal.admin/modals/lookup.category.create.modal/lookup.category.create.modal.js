// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "lookupCategoryCreateModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/lookup.category.create.modal/lookup.category.create.modal.html";

  function qs(s, r = document) {
    return r.querySelector(s);
  }
  function qsa(s, r = document) {
    return Array.from(r.querySelectorAll(s));
  }

  let apiInstance = null;
  let submitting = false;

  // Toast helper with graceful fallbacks - uses toast notifications only
  async function notify(type, message) {
    try {
      // Ensure notification system is loaded
      await ensureNotificationSystem();

      const tn = window.TANotification;
      if (tn && typeof tn[type] === "function") return tn[type](message);
      if (tn && typeof tn.show === "function") return tn.show(message, type);
    } catch (e) {
      console.error("Failed to show notification:", e);
    }

    // Log to console as fallback (no more alerts)
    if (type === "error") console.error(message);
    else console.log(message);
  }

  // Ensure notification system is available
  async function ensureNotificationSystem() {
    if (window.TANotification) return;

    // Load notification system if not already loaded
    if (!document.querySelector('script[src*="notification.js"]')) {
      const script = document.createElement("script");
      script.src = "/frontend/shared/scripts/components/notification.js";
      document.head.appendChild(script);

      // Wait for script to load
      await new Promise((resolve) => {
        script.onload = resolve;
        script.onerror = resolve; // Continue even if fails
      });
    }

    // Initialize if available
    if (
      window.TANotification &&
      typeof window.TANotification.init === "function"
    ) {
      window.TANotification.init({
        position: "top-right",
        maxNotifications: 5,
      });
    }
  }

  const RULES = {
    category: {
      required: true,
      validate: (v) => {
        if (v.length < 3) return "Category must be at least 3 characters";
        if (v.length > 50) return "Category cannot exceed 50 characters";
        return true;
      },
    },
    description: {
      required: true,
      validate: (v) => {
        if (v.length < 3) return "Description must be at least 3 characters";
        if (v.length > 200) return "Description cannot exceed 200 characters";
        return true;
      },
    },
  };

  function findErrorEl(field, root) {
    if (!field) return null;
    const name = field.name || field.id;
    return (
      qs(`.invalid-feedback[data-for="${name}"]`, root) ||
      qs(`.invalid-feedback[data-for="${field.id}"]`, root)
    );
  }
  function setFieldError(field, message, root) {
    if (!field) return;
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    const el = findErrorEl(field, root);
    if (el) {
      el.textContent = message || "";
      el.style.display = message ? "block" : "";
    }
  }
  function clearFieldError(field, root) {
    if (!field) return;
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
    const name = field.name || field.id;
    const rule = RULES[name];
    if (!rule) return true;
    const value = (field.value || "").trim();
    clearFieldError(field, root);
    if (rule.required && !value) {
      setFieldError(field, "This field is required", root);
      return false;
    }
    if (value && rule.validate) {
      const res = rule.validate(value);
      if (res !== true) {
        setFieldError(field, typeof res === "string" ? res : "Invalid", root);
        return false;
      }
    }
    return true;
  }
  function validateAll(form, root) {
    let ok = true;
    ["category", "description"].forEach((n) => {
      const f = form.querySelector(`[name="${n}"]`);
      if (!validateField(f, root)) ok = false;
    });
    return ok;
  }
  function focusFirstInvalid(root) {
    const first = qs(".is-invalid", root);
    if (first && typeof first.focus === "function") first.focus();
  }

  function attachRealtimeValidation(root) {
    const form = qs("#lookupCategoryCreateForm", root);
    if (!form || form.dataset._realtime) return;
    form.dataset._realtime = "1";
    ["input", "blur"].forEach((evt) => {
      form.addEventListener(
        evt,
        (e) => {
          if (!(e.target instanceof HTMLElement)) return;
          if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
            validateField(e.target, root);
          }
        },
        true
      );
    });
  }

  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className =
        "modal-overlay modal-lg modal-lookup-category modal-lookup-category-create";
      document.body.appendChild(el);
    }
    return el;
  }
  async function ensureContainer() {
    const c = ensureOverlay();
    if (!c.dataset.loaded) {
      try {
        const res = await fetch(htmlPath, { cache: "no-store" });
        c.innerHTML = await res.text();
      } catch (e) {
        console.error("[LookupCategoryCreate] html load failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Create Lookup Category</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load create modal.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="cancel">Close</button></div></div></div></div>';
      }
      const dlg = qs(".modal-dialog", c);
      if (dlg) {
        dlg.classList.remove("modal-sm");
        if (!dlg.classList.contains("modal-lg")) dlg.classList.add("modal-lg");
      }
      wire(c);
      c.dataset.loaded = "1";
    }
    return c;
  }

  async function getApi() {
    if (apiInstance) return apiInstance;
    if (window.apiClientInstance)
      return (apiInstance = window.apiClientInstance);
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;
    window.apiClientInstance = new TouchAfricaApiClient({
      baseUrl,
      token,
      timeout: 10000,
    });
    apiInstance = window.apiClientInstance;
    return apiInstance;
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";
    // Removed overlay click to close - only explicit close buttons should close modal
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    const cancel = qs('[data-action="cancel"]', root);
    if (cancel) cancel.addEventListener("click", close);
    const form = qs("#lookupCategoryCreateForm", root);
    if (form) form.addEventListener("submit", submitHandler);
    attachRealtimeValidation(root);
  }

  function collect(form) {
    const o = {};
    qsa("input,textarea,select", form).forEach((el) => {
      if (!el.name) return;
      if (el.type === "checkbox") o[el.name] = el.checked;
      else o[el.name] = (el.value || "").trim();
    });
    return { category: o.category || "", description: o.description || "" };
  }

  async function submitHandler(e) {
    e.preventDefault();
    if (submitting) return;
    const form = e.target;
    const root = form.closest(".modal-overlay") || document;
    if (!validateAll(form, root)) {
      focusFirstInvalid(root);
      return;
    }
    const payload = collect(form);
    try {
      submitting = true;
      const submitBtn = qs('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = true;
      const api = await getApi();
      await api.lookupCategories.create(payload);
      notify("success", "Category created");
      close();
      window.reloadLookupsList?.();
    } catch (err) {
      console.error("[LookupCategoryCreate] create failed", err);
      const msg = err?.data?.message || err?.message || "Create failed";
      notify("error", msg);
      // Map backend validation errors to fields if present
      if (err?.data?.errors && typeof err.data.errors === "object") {
        const errors = err.data.errors;
        Object.keys(errors).forEach((k) => {
          const field = form.querySelector(`[name="${k}"]`);
          if (field) setFieldError(field, errors[k], root);
        });
      }
    } finally {
      submitting = false;
      const submitBtn = qs('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function open() {
    const c = await ensureContainer();
    c.classList.add("show");
    const form = qs("#lookupCategoryCreateForm", c);
    if (form) form.reset();
  }
  function close() {
    const c = qs("#" + containerId);
    if (!c) return;
    c.classList.remove("show");
    const form = qs("#lookupCategoryCreateForm", c);
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
  }

  window.openLookupCategoryCreateModal = open;
})();
