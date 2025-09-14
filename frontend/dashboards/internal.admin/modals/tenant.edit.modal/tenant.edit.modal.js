// Edit Tenant Modal
// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "tenantEditModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/tenant.edit.modal/tenant.edit.modal.html";
  let apiClientInstance = null;
  const DEBUG = !!window.__DEBUG__;
  let currentTenantId = null;

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
      el.className = "modal-overlay modal-tenant-edit";
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      const res = await fetch(htmlPath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load tenant edit modal HTML");
      container.innerHTML = await res.text();
      container.dataset.loaded = "1";
      wire(container);
    }
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
      if (window.ensureNotifications) await window.ensureNotifications();
      else if (!window.TANotification) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "/frontend/shared/scripts/components/notification.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
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

  // Validation rules for tenant edit modal - Updated for ModalHelper
  const VALIDATION_RULES = {
    tenant_edit_name: {
      required: true,
      requiredMessage: "Tenant name is required",
      validate: (v) => {
        if (v.trim().length < 3) return "Must be at least 3 characters";
        if (v.trim().length > 50) return "Must be at most 50 characters";
        return true;
      },
    },
    tenant_edit_email: {
      required: false, // Email is readonly, so don't validate as required
      type: "email",
      emailMessage: "Please enter a valid email address",
    },
    tenant_edit_phone: {
      required: true,
      type: "phone",
      requiredMessage: "Phone number is required",
      phoneMessage: "Please enter a valid South African phone number",
    },
    tenant_edit_active: {
      required: false, // Checkbox is not required but should be monitored for changes
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
    const rule = VALIDATION_RULES[name];
    if (rule) {
      if (rule.required && !v) {
        setFieldError(
          field,
          rule.requiredMessage || "This field is required",
          root
        );
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

  function toPayload(root) {
    const get = (id) => (qs("#" + id, root)?.value || "").trim();
    const active = !!qs("#tenant_edit_active", root)?.checked;
    // Email is readonly and MUST be preserved exactly as loaded. We don't send it to backend to avoid unintended changes.
    const payload = {
      name: get("tenant_edit_name"),
      contact: { phoneNumber: get("tenant_edit_phone") },
      account: { isActive: { value: active } },
    };
    return payload;
  }

  function populate(data, root) {
    qs("#tenantEdit_tenantEditRecordId", root).textContent =
      data.id || data._id || "—";
    const set = (id, val) => {
      const el = qs("#" + id, root);
      if (el) el.value = val ?? "";
    };
    set("tenant_edit_name", data.name || "");
    set("tenant_edit_email", data.contact?.email || data.email || "");
    set("tenant_edit_phone", data.contact?.phoneNumber || data.phone || "");
    const active = data.account?.isActive?.value !== false;
    const activeEl = qs("#tenant_edit_active", root);
    if (activeEl) activeEl.checked = active;

    // Update ModalHelper original values after populating data
    if (root._modalHelper) {
      // Small delay to ensure all form fields are updated
      setTimeout(() => {
        root._modalHelper.updateOriginalValues();
      }, 100);
    }
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

    const form = qs("#tenantEditForm", root);
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
            successMessage: "Tenant updated successfully",
            errorPrefix: "Failed to update tenant",
            onSubmit: async (formData) => {
              const api = await getApi();
              const payload = {
                name: formData.tenant_edit_name,
                contact: {
                  email: formData.tenant_edit_email,
                  phoneNumber: formData.tenant_edit_phone,
                },
                account: {
                  isActive: {
                    value:
                      formData.tenant_edit_active !== undefined
                        ? formData.tenant_edit_active
                        : true,
                  },
                },
              };

              if (DEBUG)
                console.log("Updating tenant", currentTenantId, payload);
              const result = await api.tenants.update(currentTenantId, payload);
              if (DEBUG) console.log("Tenant update response", result);

              // Refresh list and close modal
              if (window.reloadTenantsList) window.reloadTenantsList();
              setTimeout(() => close(), 50);

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
        btn.textContent = "Saving...";
      }
      try {
        const api = await getApi();
        const payload = toPayload(root);
        if (DEBUG) console.log("Updating tenant", currentTenantId, payload);

        // Validate payload before sending
        if (!payload.name || payload.name.length < 3) {
          setFieldError(
            qs("#tenant_edit_name", root),
            "Name must be at least 3 characters",
            root
          );
          focusFirstInvalid(qs("#tenantEditForm", root));
          return;
        }
        if (
          !payload.contact?.phoneNumber ||
          payload.contact.phoneNumber.length < 10
        ) {
          setFieldError(
            qs("#tenant_edit_phone", root),
            "Phone must be at least 10 characters",
            root
          );
          focusFirstInvalid(qs("#tenantEditForm", root));
          return;
        }

        const res = await api.tenants.update(currentTenantId, payload);
        if (DEBUG) console.log("Tenant update response", res);
        await showToast("success", "Tenant updated successfully", {
          title: "Success",
        });
        if (window.reloadTenantsList) window.reloadTenantsList();
        setTimeout(() => close(), 50);
      } catch (err) {
        console.error("Update tenant failed", err?.status, err?.data || err);
        if (DEBUG) {
          console.error("Error details:", {
            status: err?.status,
            message: err?.message,
            data: err?.data,
            response: err?.response,
            toString: err?.toString(),
          });
        }
        let msg = "Failed to update tenant";
        if (err?.status === 409) msg = err?.data?.message || "Duplicate tenant";
        else if (err?.status === 400) {
          // Handle backend validation errors
          const details =
            err?.data?.error?.details ||
            err?.data?.details ||
            err?.data?.errors;
          if (details && Array.isArray(details)) {
            // Map backend validation errors to form fields
            for (const d of details) {
              let fieldName = null;
              let message = "Invalid";
              if (d && typeof d === "object") {
                // Map backend field names to frontend field IDs
                if (d.field === "name") fieldName = "tenant_edit_name";
                else if (d.field === "contact.phoneNumber")
                  fieldName = "tenant_edit_phone";
                message = d.message || message;
              }
              if (fieldName) {
                const field = qs("#" + fieldName, root);
                if (field) setFieldError(field, message, root);
              }
            }
            focusFirstInvalid(qs("#tenantEditForm", root));
            return; // Don't show toast, field errors are enough
          }
          msg = err?.data?.message || "Invalid data provided";
        } else if (err?.data?.message) msg = err.data.message;
        else if (err?.message) msg = err.message;
        await showToast("error", msg, { title: "Error" });
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = orig || "Save Changes";
        }
      }
    });
  }

  async function open(tenantId) {
    if (!tenantId) return;
    currentTenantId = tenantId;
    const container = await ensureContainer();
    container.classList.add("show");
    const nameInput = qs("#tenant_edit_name", container);
    if (nameInput) nameInput.value = "Loading...";
    try {
      const api = await getApi();
      const res = await api.tenants.get(tenantId);
      const data = res?.data ?? res;
      populate(data, container);
    } catch (err) {
      if (DEBUG) console.error("Failed to load tenant for edit", err);
      populate({ name: "Error loading tenant" }, container);
    }
  }

  function close() {
    const container = qs("#" + containerId);
    if (!container) return;

    // Clean up ModalHelper if it exists
    if (container._modalHelper) {
      container._modalHelper.reset();
    }

    container.classList.remove("show");
    const form = qs("#tenantEditForm", container);
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

  window.openTenantEditModal = open;
})();
