// Add New Tenant Modal (Service Admin)
// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "tenantCreateModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/tenant.create.modal/tenant.create.modal.html";
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
      el.className = "modal-overlay modal-tenant-create"; // Reuse existing modal overlay styling
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      const res = await fetch(htmlPath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load tenant create modal HTML");
      container.innerHTML = await res.text();
      container.dataset.loaded = "1";
      await ensureNotifications();
      wire(container);
    }
    return container;
  }

  async function ensureNotifications() {
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

  async function getApi() {
    if (apiClientInstance) return apiClientInstance;
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;
    apiClientInstance = new TouchAfricaApiClient({
      baseUrl,
      token,
      timeout: 15000,
    });
    return apiClientInstance;
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

  // Validation rules (aligned with TenantSchema) - Updated for ModalHelper
  const VALIDATION_RULES = {
    tenant_name: {
      required: true,
      requiredMessage: "Tenant name is required",
      validate: (v) => {
        if (v.trim().length < 3) return "Must be at least 3 characters";
        if (v.trim().length > 50) return "Must be at most 50 characters";
        return true;
      },
    },
    tenant_email: {
      required: true,
      type: "email",
      requiredMessage: "Email is required",
      emailMessage: "Please enter a valid email address",
    },
    tenant_phone: {
      required: true,
      type: "phone",
      requiredMessage: "Phone number is required",
      phoneMessage: "Please enter a valid South African phone number",
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
    if (rule) {
      if (rule.required && !v) {
        setFieldError(field, "This field is required", root);
        return false;
      }
      if (rule.validate) {
        const res = rule.validate(v);
        if (res !== true) {
          setFieldError(field, typeof res === "string" ? res : "Invalid", root);
          return false;
        }
      }
    }
    return true;
  }
  function focusFirstInvalid(form) {
    const candidates = Array.from(
      form.querySelectorAll("input, select, textarea")
    );
    const invalids = candidates.filter((el) =>
      el.classList.contains("is-invalid")
    );
    const target = (invalids.length ? invalids : candidates).find(
      (el) => !el.disabled && el.type !== "hidden" && el.offsetParent !== null
    );
    if (target && typeof target.focus === "function") target.focus();
    return target || null;
  }

  function toPayload(form, root) {
    const get = (id) => (qs("#" + id, root)?.value || "").trim();
    const active = !!qs("#tenant_active", root)?.checked;
    return {
      name: get("tenant_name"),
      contact: {
        email: get("tenant_email"),
        phoneNumber: get("tenant_phone"),
      },
      account: { isActive: { value: active } },
    };
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";

    // Basic modal close functionality
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", () => close());
    // Removed overlay click to close - only explicit close buttons should close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    const form = qs("#tenantCreateForm", root);
    if (!form) return;

    const submitBtn = qs('button[type="submit"]', form);
    const btnCancel = qs('[data-action="cancel"]', form);
    if (btnCancel) btnCancel.addEventListener("click", () => close());

    // Load ModalHelper and initialize form validation
    loadModalHelper()
      .then(() => {
        if (window.ModalHelper) {
          const modalHelper = new window.ModalHelper({
            form: form,
            submitButton: submitBtn,
            validationRules: VALIDATION_RULES,
            successMessage: "Tenant created successfully",
            errorPrefix: "Failed to create tenant",
            onSubmit: async (formData) => {
              const api = await getApi();
              const payload = {
                name: formData.tenant_name,
                contact: {
                  email: formData.tenant_email,
                  phoneNumber: formData.tenant_phone,
                },
                account: {
                  isActive: {
                    value:
                      formData.tenant_active !== undefined
                        ? formData.tenant_active
                        : true,
                    changes: [],
                  },
                },
              };

              if (DEBUG) console.log("Creating tenant payload", payload);
              const result = await api.tenants.create(payload);
              if (DEBUG) console.log("Tenant create response", result);

              // Close modal and refresh list
              setTimeout(() => close(), 50);
              if (window.reloadTenantsList) window.reloadTenantsList();

              return result;
            },
          });

          // Store modal helper for cleanup
          root._modalHelper = modalHelper;
        }
      })
      .catch((error) => {
        console.warn(
          "Failed to load ModalHelper, falling back to basic validation:",
          error
        );
        // Fallback to existing validation if ModalHelper fails to load
        setupFallbackValidation(form, root);
      });
  }

  // Load ModalHelper script if not already available
  async function loadModalHelper() {
    if (window.ModalHelper) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/frontend/shared/scripts/components/modal.helper.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Fallback validation (original implementation)
  function setupFallbackValidation(form, root) {
    const inputs = qsa("input, select, textarea", form);
    inputs.forEach((field) => {
      field.addEventListener("focus", () => clearFieldError(field, root));
      field.addEventListener("blur", () => validateField(field, root));
      field.addEventListener("input", () => validateField(field, root));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      inputs.forEach((f) => {
        if (!validateField(f, root)) ok = false;
      });
      if (!ok) {
        focusFirstInvalid(form);
        return;
      }

      const btn = qs('button[type="submit"]', form);
      const orig = btn?.textContent;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Creating...";
      }
      try {
        const api = await getApi();
        const payload = toPayload(form, root);
        if (DEBUG) console.log("Creating tenant payload", payload);
        const res = await api.tenants.create(payload);
        if (DEBUG) console.log("Tenant create response", res);
        await showToast("success", "Tenant created successfully", {
          title: "Success",
        });
        setTimeout(() => close(), 50);
        if (window.reloadTenantsList) window.reloadTenantsList();
      } catch (err) {
        console.error("Create tenant failed", err?.status, err?.data || err);
        let msg = "Failed to create tenant";
        if (err?.status === 409) msg = err?.data?.message || "Duplicate tenant";
        else if (err?.data?.message) msg = err.data.message;
        else if (err?.message) msg = err.message;
        await showToast("error", msg, { title: "Error" });
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = orig || "Create Tenant";
        }
      }
    });
  }

  async function open() {
    const container = await ensureContainer();
    container.classList.add("show");
  }
  function close() {
    const container = qs("#" + containerId);
    if (!container) return;

    // Clean up ModalHelper if it exists
    if (container._modalHelper) {
      container._modalHelper.reset();
    }

    container.classList.remove("show");
    const form = qs("#tenantCreateForm", container);
    if (form) {
      form.reset();
      qsa(".invalid-feedback", form).forEach((el) => {
        el.textContent = "";
        el.style.display = "";
      });
      qsa(".is-invalid, .is-valid", form).forEach((el) => {
        el.classList.remove("is-invalid", "is-valid");
      });
    }
  }

  window.openTenantCreateModal = open;
})();
