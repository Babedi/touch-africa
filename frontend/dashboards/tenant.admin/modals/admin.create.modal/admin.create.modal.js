// Tenant Admin - Create Root Admin Modal
// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  // Fallback for legacy window-based imports (can be removed later)
  const {
    ValidationHelper: LegacyValidationHelper,
    FIELD_VALIDATORS: LegacyFieldValidators,
  } = window.ModalValidationHelper || {};

  // Import utility functions
  const {
    escapeHtml,
    secureSetHTML,
    trustedSetHTML,
    buildSecureSelectOptions,
  } = window.SecurityUtils || {};
  const { clearAllErrors, setupRealtimeValidation } =
    window.ValidationUtils || {};
  const { resetModalForm, setModalLoading, handleFormSubmission } =
    window.ModalUtils || {};

  const containerId = "tenantAdminCreateModal";
  const htmlPath =
    "/frontend/dashboards/tenant.admin/modals/admin.create.modal/admin.create.modal.html";
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
      el.className = "modal-overlay modal-md modal-tenant-admin-create";
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureNotifications() {
    try {
      if (window.ensureNotifications) return window.ensureNotifications();
      if (!window.TANotification) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "/frontend/shared/scripts/components/notification.js";
          s.onload = res;
          s.onerror = rej;
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
      if (DEBUG) console.warn("toast failed", e);
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

  const RULES = {
    personId: FIELD_VALIDATORS.personId,
    roles: {
      required: true,
      validate: (v) =>
        Array.isArray(v)
          ? v.length > 0 || "Select at least one role"
          : !!v || "Select at least one role",
    },
    email: ValidationHelper.createEmailValidator("@touchafrica.co.za"),
    password: FIELD_VALIDATORS.password,
  };

  function getFieldValue(field) {
    if (field.multiple)
      return Array.from(field.selectedOptions).map((o) => o.value);
    return field.value.trim();
  }
  function validateField(field, root) {
    const name = field.name || field.id;
    if (!RULES[name]) return true;
    const rule = RULES[name];
    const value = field.multiple ? getFieldValue(field) : field.value.trim();
    let valid = true;
    let msg = "";
    if (rule.required && (field.multiple ? value.length === 0 : !value)) {
      valid = false;
      msg = "Required";
    }
    if (valid && rule.validate) {
      const r = rule.validate(value);
      if (r !== true) {
        valid = false;
        msg = r;
      }
    }
    const fb = root.querySelector(`.invalid-feedback[data-for="${name}"]`);
    if (!valid) {
      field.classList.add("is-invalid");
      if (fb) fb.textContent = msg;
    } else {
      field.classList.remove("is-invalid");
      if (fb) fb.textContent = "";
    }
    return valid;
  }
  function validateForm(form) {
    let ok = true;
    qsa("[name]", form).forEach((f) => {
      if (!validateField(f, form)) ok = false;
    });
    return ok;
  }

  async function populateRoles(root, tenantId = null) {
    const select = qs("#adminCreate_adminRoles", root);
    if (!select) return;

    console.log("[DEBUG] populateRoles called with tenantId:", tenantId);

    try {
      const api = await getApi();
      let res;

      if (!tenantId) {
        // Load standard roles initially (no tenant selected)
        console.log("[DEBUG] Loading standard roles (no tenant selected)");
        res = await api.standardRoles.list({
          page: 1,
          limit: 500,
          order: "asc",
          sortBy: "roleName",
        });
      } else {
        // Load tenant-specific roles when tenant is selected
        console.log(
          "[DEBUG] Loading tenant-specific roles for tenant:",
          tenantId
        );
        console.log(
          "[DEBUG] API tenantRoles method exists:",
          !!api.tenantRoles
        );
        if (api.tenantRoles && api.tenantRoles.list) {
          console.log(
            "[DEBUG] Calling api.tenantRoles.list for tenant:",
            tenantId
          );
          console.log("[DEBUG] Expected URL:", `/api/v1/${tenantId}/roles`);
          res = await api.tenantRoles.list(tenantId, {
            page: 1,
            limit: 500,
            order: "asc",
            sortBy: "roleName",
          });
        } else {
          console.error("[DEBUG] api.tenantRoles.list method not available");
          return;
        }
      }

      console.log("[DEBUG] API response:", res);
      const arr = res?.data?.data || res?.data || res;
      const items = Array.isArray(arr) ? arr : [];
      console.log("[DEBUG] Parsed roles array:", items);

      if (tenantId && items.length === 0) {
        // No tenant-specific roles found, show a helpful message
        const noRolesOption =
          '<option value="">No roles available for this tenant</option>';
        if (trustedSetHTML) {
          trustedSetHTML(select, noRolesOption);
        } else {
          select.innerHTML = noRolesOption;
        }
        console.log(
          "[DEBUG] No tenant-specific roles found for tenant:",
          tenantId
        );
      } else {
        // Use secure function to build select options
        const selectOptions = buildSecureSelectOptions
          ? buildSecureSelectOptions(
              items.map((r) => ({
                value: r.roleId || r.id || r.code || r.name,
                text: r.roleName || r.name || r.roleId || r.id || r.code,
              })),
              ""
            )
          : items
              .map((r) => {
                const id = escapeHtml
                  ? escapeHtml(r.roleId || r.id || r.code || r.name)
                  : r.roleId || r.id || r.code || r.name;
                const name = escapeHtml
                  ? escapeHtml(r.roleName || r.name || id)
                  : r.roleName || r.name || id;
                return `<option value="${id}">${name}</option>`;
              })
              .join("");

        if (trustedSetHTML) {
          trustedSetHTML(select, selectOptions);
        } else {
          select.innerHTML = selectOptions;
        }
      }

      console.log("[DEBUG] Roles dropdown updated with", items.length, "roles");
    } catch (e) {
      console.error("[DEBUG] roles load failed:", e);
      if (DEBUG) console.warn("roles load failed", e);
    }
  }

  async function populateTenants(root) {
    const select = qs("#adminCreate_adminTenantId", root);
    if (!select) return;
    try {
      const api = await getApi();
      const res = await api.tenants.list({
        page: 1,
        limit: 500,
        order: "asc",
        sortBy: "name",
      });
      const arr = res?.data?.data || res?.data || res;
      const items = Array.isArray(arr) ? arr : [];

      // Use secure function to build select options
      const selectOptions = buildSecureSelectOptions
        ? buildSecureSelectOptions(
            items.map((t) => ({
              value: t.tenantId || t.id,
              text: `${t.name || t.tenantId || t.id} (${t.tenantId || t.id})`,
            })),
            "",
            "Select a tenant..."
          )
        : '<option value="">Select a tenant...</option>' +
          items
            .map((t) => {
              const id = escapeHtml
                ? escapeHtml(t.tenantId || t.id)
                : t.tenantId || t.id;
              const name = escapeHtml ? escapeHtml(t.name || id) : t.name || id;
              return `<option value="${id}">${name} (${id})</option>`;
            })
            .join("");

      if (trustedSetHTML) {
        trustedSetHTML(select, selectOptions);
      } else {
        select.innerHTML = selectOptions;
      }
    } catch (e) {
      if (DEBUG) console.warn("tenants load failed", e);
    }
  }

  async function populatePersons(root, tenantId = null) {
    const select = qs("#adminCreate_personId", root);
    if (!select) return;

    // Clear the dropdown if no tenant is selected
    if (!tenantId) {
      const defaultOption = '<option value="">Select a person...</option>';
      if (trustedSetHTML) {
        trustedSetHTML(select, defaultOption);
      } else {
        select.innerHTML = defaultOption;
      }
      return;
    }

    try {
      const api = await getApi();
      const res = await api.externalPersons.list(tenantId, {
        page: 1,
        limit: 500,
        order: "asc",
        sortBy: "firstName",
      });
      const arr = res?.data?.data || res?.data || res;
      const items = Array.isArray(arr) ? arr : [];

      // Use secure function to build select options
      const selectOptions = buildSecureSelectOptions
        ? buildSecureSelectOptions(
            items.map((p) => {
              const pid = p.id || p.personId || p.idNumber;
              const firstName = p.firstName || p.personalInfo?.firstName || "";
              const surname = p.surname || p.personalInfo?.surname || "";
              const name =
                firstName && surname
                  ? `${firstName} ${surname}`
                  : firstName || surname || `Person ${pid}`;
              return {
                value: pid,
                text: `${pid} - ${name}`,
              };
            }),
            "",
            "Select a person..."
          )
        : '<option value="">Select a person...</option>' +
          items
            .map((p) => {
              const pid = escapeHtml
                ? escapeHtml(p.id || p.personId || p.idNumber)
                : p.id || p.personId || p.idNumber;
              const firstName = escapeHtml
                ? escapeHtml(p.firstName || p.personalInfo?.firstName || "")
                : p.firstName || p.personalInfo?.firstName || "";
              const surname = escapeHtml
                ? escapeHtml(p.surname || p.personalInfo?.surname || "")
                : p.surname || p.personalInfo?.surname || "";
              const name =
                firstName && surname
                  ? `${firstName} ${surname}`
                  : firstName || surname || `Person ${pid}`;
              return `<option value="${pid}">${pid} - ${name}</option>`;
            })
            .join("");

      if (trustedSetHTML) {
        trustedSetHTML(select, selectOptions);
      } else {
        select.innerHTML = selectOptions;
      }
    } catch (e) {
      if (DEBUG) console.warn("persons load failed", e);
      // Show error state in dropdown
      const errorOption = '<option value="">Error loading people...</option>';
      if (trustedSetHTML) {
        trustedSetHTML(select, errorOption);
      } else {
        select.innerHTML = errorOption;
      }
    }
  }

  function buildPayload(form) {
    const rolesField = form.elements["roles"];
    const roles = rolesField
      ? Array.from(rolesField.selectedOptions)
          .map((o) => o.value)
          .filter(Boolean)
      : [];
    return {
      roles,
      personId: form.elements["personId"].value.trim(),
      accessDetails: {
        email: form.elements["email"].value.trim(),
        password: form.elements["password"].value,
      },
      account: {
        isActive: {
          value: form.elements["isActive"].value === "true",
          changes: [],
        },
      },
    };
  }

  function wire(container) {
    const form = qs("#tenantAdminCreateForm", container);
    if (!form) return;
    const cancelBtn = qsa('[data-action="cancel"]', form)[0];
    if (cancelBtn) cancelBtn.addEventListener("click", () => closeModal());

    // Add tenant selection change listener
    const tenantSelect = qs("#adminCreate_adminTenantId", container);
    if (tenantSelect) {
      tenantSelect.addEventListener("change", (e) => {
        const selectedTenantId = e.target.value.trim();
        console.log("[DEBUG] Tenant selected:", selectedTenantId);
        // Refresh the persons dropdown based on selected tenant
        populatePersons(container, selectedTenantId || null);
        // Refresh the roles dropdown based on selected tenant
        populateRoles(container, selectedTenantId || null);
      });
    }

    form.addEventListener("input", (e) => {
      if (e.target && e.target.name) validateField(e.target, form);
    });
    form.addEventListener("change", (e) => {
      if (e.target && e.target.name) validateField(e.target, form);
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;
      const tenantId = form.elements["tenantId"]?.value?.trim();
      if (!tenantId) {
        await showToast("error", "Please select a tenant");
        return;
      }
      const payload = buildPayload(form);
      try {
        form.classList.add("is-loading");
        const api = await getApi();
        await api.externalAdmins.create(tenantId, payload);
        await showToast("success", "Root admin created successfully");
        closeModal(true);
        if (window.reloadTenantAdminsList) window.reloadTenantAdminsList();
      } catch (err) {
        let msg = "Could not create admin";
        if (err?.data?.errors) {
          Object.entries(err.data.errors).forEach(([field, errorMsg]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
              input.classList.add("is-invalid");
              const fb = form.querySelector(
                `.invalid-feedback[data-for="${field}"]`
              );
              if (fb)
                fb.textContent = Array.isArray(errorMsg)
                  ? errorMsg.join(", ")
                  : String(errorMsg);
            }
          });
          msg = "Please fix highlighted errors";
        } else if (err?.data?.message) {
          msg = err.data.message;
        }
        await showToast("error", msg, { title: "Error" });
      } finally {
        form.classList.remove("is-loading");
      }
    });

    populateRoles(container, null); // Initially load standard roles (no tenant selected)
    populatePersons(container, null); // Initially populate with no tenant selected
    populateTenants(container);
  }

  function openModal() {
    (async () => {
      try {
        await ensureNotifications();
        const overlay = ensureOverlay();
        if (!overlay.dataset.loaded) {
          const res = await fetch(htmlPath, { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to load modal HTML");
          overlay.innerHTML = await res.text();
          overlay.dataset.loaded = "1";
          wire(overlay);
        }
        overlay.classList.add("show");
        const closeBtn = qs(".modal-close", overlay);
        if (closeBtn) closeBtn.addEventListener("click", () => closeModal());
        // Removed overlay click to close - only explicit close buttons should close modal
        document.addEventListener(
          "keydown",
          function esc(ev) {
            if (ev.key === "Escape") {
              closeModal();
            }
          },
          { once: true }
        );
      } catch (e) {
        console.error("Open tenant admin modal failed", e);
        showToast("error", "Could not open modal");
      }
    })();
  }

  function closeModal() {
    const overlay = qs("#" + containerId);
    if (!overlay) return;

    overlay.classList.remove("show");

    // Clear any errors and reset form
    const form = qs("#adminCreateForm", overlay);
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

  window.openTenantAdminCreateModal = openModal;
})();
