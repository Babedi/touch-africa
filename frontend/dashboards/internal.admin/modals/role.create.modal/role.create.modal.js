// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
  ValidationHelpers,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "roleCreateModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/role.create.modal/role.create.modal.html";
  function qs(s, r = document) {
    return r.querySelector(s);
  }
  function qsa(s, r = document) {
    return Array.from(r.querySelectorAll(s));
  }
  let apiInstance = null;
  let submitting = false;
  const DEBUG = !!window.__DEBUG__;

  /* ------------------------------------------- */
  /* Validation Helpers (mirrors person modal)   */
  /* ------------------------------------------- */
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

  // Rules derived from backend InternalRoleSchema in role.validation.js
  const RULES = {
    roleName: {
      required: true,
      validate: (v) => {
        if (v.length < 3) return "Role name must be at least 3 characters";
        if (v.length > 50) return "Role name cannot exceed 50 characters";
        return true;
      },
    },
    roleCode: {
      required: true,
      validate: (v) => {
        if (v.length < 2) return "Role code must be at least 2 characters";
        if (v.length > 30) return "Role code cannot exceed 30 characters";
        if (!ValidationHelpers.isValidRoleCode(v))
          return "Role code must contain only uppercase letters and underscores";
        return true;
      },
    },
    description: {
      required: true,
      validate: (v) => {
        if (v.length < 10) return "Description must be at least 10 characters";
        if (v.length > 200) return "Description cannot exceed 200 characters";
        return true;
      },
    },
  };

  function validateField(field, root) {
    if (!field) return true;
    const name = field.name || field.id;
    const rule = RULES[name];
    if (!rule) return true; // no rule
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

  function validatePermissions(root) {
    const fieldset = qs("[data-permissions-fieldset]", root);
    if (!fieldset) return true;
    const boxes = qsa('input[name="permissions[]"]', fieldset);
    const checked = boxes.filter((b) => b.checked);
    const feedback = qs('.invalid-feedback[data-for="permissions"]', fieldset);
    fieldset.classList.remove("is-invalid");
    if (feedback) {
      feedback.textContent = "";
      feedback.style.display = "";
    }
    if (!checked.length) {
      fieldset.classList.add("is-invalid");
      if (feedback) {
        feedback.textContent = "At least one permission must be selected";
        feedback.style.display = "block";
      }
      return false;
    }
    return true;
  }

  function validateAll(form, root) {
    let ok = true;
    ["roleName", "roleCode", "description"].forEach((n) => {
      const f = form.querySelector(`[name="${n}"]`);
      if (!validateField(f, root)) ok = false;
    });
    if (!validatePermissions(root)) ok = false;
    return ok;
  }

  function focusFirstInvalid(root) {
    const first = qs(".is-invalid", root);
    if (first && typeof first.focus === "function") {
      first.focus();
    }
  }

  function attachRealtimeValidation(root) {
    const form = qs("#roleCreateForm", root);
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
    form.addEventListener("change", (e) => {
      const t = e.target;
      if (t && t.name === "permissions[]") {
        validatePermissions(root);
      }
    });
  }
  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "modal-overlay modal-lg modal-role modal-role-create";
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
        console.error("[RoleCreate] html load failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Create Role</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load create modal.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="cancel">Close</button></div></div></div></div>';
      }
      // Ensure dialog sizing class present
      const dlg = qs(".modal-dialog", c);
      if (dlg && !dlg.classList.contains("modal-lg"))
        dlg.classList.add("modal-lg");
      wire(c);
      c.dataset.loaded = "1";
    }
    return c;
  }
  async function getApi() {
    if (apiInstance) return apiInstance;
    // Use TouchAfricaApiClient for consistency with other modals
    if (window.apiClientInstance) {
      apiInstance = window.apiClientInstance;
      return apiInstance;
    }

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
    const form = qs("#roleCreateForm", root);
    if (form) {
      form.addEventListener("submit", submitHandler);
    }
    attachRealtimeValidation(root);
    loadPermissions(root).catch((e) => console.warn("perm load failed", e));
  }
  // Inject permission modules directly into the fieldset (mirrors edit modal approach)
  async function loadPermissions(root) {
    const fieldset = qs("[data-permissions-fieldset]", root);
    if (!fieldset) return;
    // Remove loading element if present
    const loading = qs(".loading-permissions", fieldset);
    if (loading) loading.remove();

    try {
      console.log("[RoleCreate] Starting permission load...");
      const api = await getApi();

      // Load permissions from API - no fallbacks or mock data
      let res;
      try {
        console.log("[RoleCreate] Attempting api.permissions.list...");
        res = await api.permissions.list({ limit: 500 });
        console.log("[RoleCreate] API call successful:", res);
      } catch (apiError) {
        console.error("[RoleCreate] API call failed:", apiError);
        fieldset.insertAdjacentHTML(
          "beforeend",
          '<div class="text-error" style="font-size:0.75rem;">Failed to load permissions. Please try again.</div>'
        );
        return;
      }

      console.log("[RoleCreate] Raw permissions response:", res);
      const env = res?.data ?? res;
      console.log("[RoleCreate] Permissions envelope:", env);
      const list = Array.isArray(env?.data)
        ? env.data
        : Array.isArray(env)
        ? env
        : env?.items || [];
      console.log("[RoleCreate] Permissions list:", list);

      if (!list.length) {
        fieldset.insertAdjacentHTML(
          "beforeend",
          '<div class="text-muted">No permissions available.</div>'
        );
        return;
      }

      const groups = {};
      list.forEach((p) => {
        const mod = p.module || p.moduleCode || "general";
        (groups[mod] = groups[mod] || []).push(p);
      });

      const modulesHtml = Object.keys(groups)
        .sort()
        .map((mod) => {
          const items = groups[mod].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
          );
          const chips = items
            .flatMap((p) => {
              console.log("[RoleCreate] Processing permission:", p);
              const baseId = p.permissionId || p.code || p.id || "unknown";

              // Check if permissions property exists (new structure)
              if (Array.isArray(p.permissions) && p.permissions.length > 0) {
                return p.permissions.map((permName, index) => {
                  // Use the actual permission name as the value (not indexed)
                  return `<label class="perm-item"><input type="checkbox" name="permissions[]" value="${permName}" data-permission-id="${baseId}" data-module="${
                    p.module || p.moduleCode || "general"
                  }"/> <span>${permName}</span></label>`;
                });
              }
              // Fallback: If name is an array (old structure)
              else if (Array.isArray(p.name) && p.name.length > 0) {
                return p.name.map((permName, index) => {
                  // Use the actual permission name as the value (not indexed)
                  return `<label class="perm-item"><input type="checkbox" name="permissions[]" value="${permName}" data-permission-id="${baseId}" data-module="${
                    p.module || p.moduleCode || "general"
                  }"/> <span>${permName}</span></label>`;
                });
              } else {
                // Handle single permission
                const displayName =
                  p.name ||
                  p.displayName ||
                  p.permission ||
                  p.code ||
                  baseId ||
                  "Unnamed Permission";
                return [
                  `<label class="perm-item"><input type="checkbox" name="permissions[]" value="${displayName}" data-permission-id="${baseId}" data-module="${
                    p.module || p.moduleCode || "general"
                  }"/> <span>${displayName}</span></label>`,
                ];
              }
            })
            .join("");

          // Add module header with "Select All" checkbox
          return `<div class="perm-module" data-module="${mod}">
            <div class="module-header" style="display: flex; align-items: center; margin-bottom: 10px;">
              <h4 style="margin: 0; margin-right: 10px;">${mod}</h4>
              <label class="perm-item select-all-module" style="font-size: 0.9em; color: #6c757d;">
                <input type="checkbox" class="select-all-${mod}" data-module="${mod}" /> 
                <span>Select All</span>
              </label>
            </div>
            <div class="perm-list">${chips}</div>
          </div>`;
        })
        .join("");

      const invalid = qs('.invalid-feedback[data-for="permissions"]', fieldset);
      if (invalid) invalid.insertAdjacentHTML("beforebegin", modulesHtml);
      else fieldset.insertAdjacentHTML("beforeend", modulesHtml);

      // Set up bulk selection handlers
      setupBulkSelectionHandlers(root);

      console.log("[RoleCreate] Permissions loaded successfully");
    } catch (e) {
      console.error("[RoleCreate] Permission loading failed:", e);
      fieldset.insertAdjacentHTML(
        "beforeend",
        '<div class="text-error" style="font-size:0.75rem;">Failed to load permissions. Check console for details.</div>'
      );
      throw e;
    }
  }

  function setupBulkSelectionHandlers(root) {
    const fieldset = qs("[data-permissions-fieldset]", root);
    if (!fieldset) return;

    // Handle "all.access" checkbox
    const allAccessCheckbox = qs("#roleCreate_allAccessCheckbox", fieldset);
    if (allAccessCheckbox) {
      allAccessCheckbox.addEventListener("change", function () {
        const allPermissionCheckboxes = qsa(
          'input[name="permissions[]"]:not(#allAccessCheckbox)',
          fieldset
        );
        const allModuleCheckboxes = qsa(
          'input[class^="select-all-"]',
          fieldset
        );

        if (this.checked) {
          // If all.access is checked, disable and uncheck all other permissions
          allPermissionCheckboxes.forEach((cb) => {
            cb.checked = false;
            cb.disabled = true;
          });
          allModuleCheckboxes.forEach((cb) => {
            cb.checked = false;
            cb.disabled = true;
          });
        } else {
          // If all.access is unchecked, re-enable all permissions
          allPermissionCheckboxes.forEach((cb) => {
            cb.disabled = false;
          });
          allModuleCheckboxes.forEach((cb) => {
            cb.disabled = false;
          });
        }
        validatePermissions(root);
      });
    }

    // Handle module "Select All" checkboxes
    const moduleCheckboxes = qsa('input[class^="select-all-"]', fieldset);
    moduleCheckboxes.forEach((moduleCheckbox) => {
      moduleCheckbox.addEventListener("change", function () {
        const moduleName = this.getAttribute("data-module");
        const modulePermissions = qsa(
          `input[name="permissions[]"][data-module="${moduleName}"]`,
          fieldset
        );

        modulePermissions.forEach((cb) => {
          cb.checked = this.checked;
        });

        validatePermissions(root);
      });
    });

    // Handle individual permission checkboxes to update module "Select All" state
    const permissionCheckboxes = qsa(
      'input[name="permissions[]"]:not(#allAccessCheckbox)',
      fieldset
    );
    permissionCheckboxes.forEach((permCheckbox) => {
      permCheckbox.addEventListener("change", function () {
        const moduleName = this.getAttribute("data-module");
        if (!moduleName) return;

        const moduleSelectAll = qs(`input.select-all-${moduleName}`, fieldset);
        if (!moduleSelectAll) return;

        const modulePermissions = qsa(
          `input[name="permissions[]"][data-module="${moduleName}"]`,
          fieldset
        );
        const checkedCount = modulePermissions.filter(
          (cb) => cb.checked
        ).length;

        // Update the module "Select All" checkbox state
        if (checkedCount === 0) {
          moduleSelectAll.checked = false;
          moduleSelectAll.indeterminate = false;
        } else if (checkedCount === modulePermissions.length) {
          moduleSelectAll.checked = true;
          moduleSelectAll.indeterminate = false;
        } else {
          moduleSelectAll.checked = false;
          moduleSelectAll.indeterminate = true;
        }

        validatePermissions(root);
      });
    });
  }

  function collect(form) {
    const o = {};
    qsa("input,textarea,select", form).forEach((el) => {
      if (!el.name) return;
      if (el.type === "checkbox") {
        if (el.name === "permissions[]") return; // handled below
        o[el.name] = el.checked;
      } else {
        o[el.name] = el.value.trim();
      }
    });
    const permissions = qsa('input[name="permissions[]"]', form)
      .filter((b) => b.checked)
      .map((b) => b.value);
    o.permissions = permissions; // flat array matching schema
    if (o.isActive == null) o.isActive = true;
    return o;
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
      try {
        await api.roles.create(payload);
      } catch (e) {
        console.warn("[RoleCreate] Internal API failed, trying CoreUtils:", e);
        await CoreUtils.api.request("POST", "/internal/roles", payload);
      }
      window.TANotification?.success?.("Role created");
      close();
      window.reloadRolesList?.();
    } catch (err) {
      console.error("[RoleCreate] create failed", err);
      window.TANotification?.error?.("Create failed");
    } finally {
      submitting = false;
      const submitBtn = qs('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = false;
    }
  }
  async function open() {
    const c = await ensureContainer();
    c.classList.add("show");
    const form = qs("#roleCreateForm", c);
    if (form) form.reset();
  }
  function close() {
    const c = qs("#" + containerId);
    if (!c) return;
    c.classList.remove("show");
    const form = qs("#roleCreateForm", c);
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
  window.openRoleCreateModal = open;
})();
