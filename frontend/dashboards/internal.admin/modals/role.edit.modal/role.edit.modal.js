// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
  ValidationHelpers,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "roleEditModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/role.edit.modal/role.edit.modal.html";
  function qs(s, r = document) {
    return r.querySelector(s);
  }
  function qsa(s, r = document) {
    return Array.from(r.querySelectorAll(s));
  }
  let apiInstance = null;
  let submitting = false;
  let currentRoleData = null;
  let nuclearFixTimeout = null; // Track pending nuclear fix timeout
  let currentRoleId = null; // Track current role to prevent race conditions
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
    const form = qs("#roleEditForm", root);
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
      el.className = "modal-overlay modal-lg modal-role modal-role-edit";
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
        console.error("[RoleEdit] html load failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Edit Role</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load edit modal.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="cancel">Close</button></div></div></div></div>';
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
    const form = qs("#roleEditForm", root);
    if (form) {
      form.addEventListener("submit", submitHandler);
    }
    attachRealtimeValidation(root);
    loadPermissions(root).catch((e) => console.warn("perm load failed", e));
  }
  // Inject permission modules directly into the fieldset (mirrors create modal approach)
  async function loadPermissions(root) {
    const fieldset = qs("[data-permissions-fieldset]", root);
    if (!fieldset) return;
    // Remove loading element if present
    const loading = qs(".loading-permissions", fieldset);
    if (loading) loading.remove();

    try {
      console.log("[RoleEdit] Starting permission load...");
      const api = await getApi();

      // Load permissions from API - no fallbacks or mock data
      let res;
      try {
        console.log("[RoleEdit] Attempting api.permissions.list...");
        res = await api.permissions.list({ limit: 500 });
        console.log("[RoleEdit] API call successful:", res);
      } catch (apiError) {
        console.error("[RoleEdit] API call failed:", apiError);
        fieldset.insertAdjacentHTML(
          "beforeend",
          '<div class="text-error" style="font-size:0.75rem;">Failed to load permissions. Please try again.</div>'
        );
        return;
      }

      console.log("[RoleEdit] Raw permissions response:", res);
      const env = res?.data ?? res;
      console.log("[RoleEdit] Permissions envelope:", env);
      const list = Array.isArray(env?.data)
        ? env.data
        : Array.isArray(env)
        ? env
        : env?.items || [];
      console.log("[RoleEdit] Permissions list:", list);

      if (!list.length) {
        fieldset.insertAdjacentHTML(
          "beforeend",
          '<div class="text-muted">No permissions available.</div>'
        );
        return;
      }

      // First, flatten all permissions to avoid duplicates
      const allPermissions = new Set();
      const permissionsByModule = {};

      list.forEach((p) => {
        const mod = p.module || p.moduleCode || "general";

        // Extract all permission names from this permission object
        let permissionNames = [];

        // Handle different data structures
        if (Array.isArray(p.permissions) && p.permissions.length > 0) {
          permissionNames = p.permissions;
        } else if (Array.isArray(p.name) && p.name.length > 0) {
          permissionNames = p.name;
        } else if (p.name || p.displayName || p.permission || p.code) {
          const singlePerm = p.name || p.displayName || p.permission || p.code;
          permissionNames = [singlePerm];
        }

        // Add each permission to the module, avoiding duplicates
        permissionNames.forEach((permName) => {
          if (permName && !allPermissions.has(permName)) {
            allPermissions.add(permName);
            if (!permissionsByModule[mod]) {
              permissionsByModule[mod] = [];
            }
            permissionsByModule[mod].push({
              name: permName,
              id: p.permissionId || p.code || p.id || permName,
              module: mod,
            });
          }
        });
      });

      const modulesHtml = Object.keys(permissionsByModule)
        .sort()
        .map((mod) => {
          const items = permissionsByModule[mod].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
          );
          const chips = items
            .map((perm) => {
              console.log(
                "[RoleEdit] Creating checkbox for permission:",
                perm.name
              );
              return `<label class="perm-item"><input type="checkbox" name="permissions[]" value="${perm.name}" data-permission-id="${perm.id}" data-module="${perm.module}"/> <span>${perm.name}</span></label>`;
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

      // Pre-populate with current role permissions (with race condition protection)
      if (currentRoleData) {
        // Store the role ID for this specific population request
        const roleIdForDelayedPopulation =
          currentRoleData.roleId || currentRoleData.id || Date.now();

        setTimeout(() => {
          // Check if we're still working with the same role
          if (
            currentRoleData &&
            (currentRoleData.roleId || currentRoleData.id) ===
              roleIdForDelayedPopulation
          ) {
            console.log(
              `[RoleEdit] Populating permissions after DOM update for role: ${roleIdForDelayedPopulation}`
            );
            populatePermissions(root, currentRoleData.permissions || []);
          } else {
            console.log(
              `[RoleEdit] Skipping delayed permission population - role changed from ${roleIdForDelayedPopulation} to ${
                currentRoleData?.roleId || currentRoleData?.id || "none"
              }`
            );
          }
        }, 50);
      }

      console.log("[RoleEdit] Permissions loaded successfully");
    } catch (e) {
      console.error("[RoleEdit] Permission loading failed:", e);
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
    const allAccessCheckbox = qs(
      "#roleEdit_roleEditAllAccessCheckbox",
      fieldset
    );
    if (allAccessCheckbox) {
      allAccessCheckbox.addEventListener("change", function () {
        const allPermissionCheckboxes = qsa(
          'input[name="permissions[]"]:not(#roleEditAllAccessCheckbox)',
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
      'input[name="permissions[]"]:not(#roleEditAllAccessCheckbox)',
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

  function populateForm(root, data) {
    const form = qs("#roleEditForm", root);
    if (!form || !data) return;

    // Populate form fields
    const fields = {
      roleName: qs("#roleEdit_roleEditName", form),
      roleCode: qs("#roleEdit_roleEditCode", form),
      description: qs("#roleEdit_roleEditDescription", form),
      isActive: qs("#roleEdit_roleEditIsActive", form),
    };

    Object.keys(fields).forEach((key) => {
      const field = fields[key];
      if (!field) return;

      if (field.type === "checkbox") {
        field.checked = !!data[key];
      } else {
        field.value = data[key] || "";
      }
    });

    // Populate Role ID display
    const roleIdDisplay = qs("#roleEdit_roleRecordIdDisplay", root);
    if (roleIdDisplay) {
      const displayId = data.roleId || data.id || data._id || "—";
      roleIdDisplay.textContent = displayId;
      // Ensure no masking attributes
      roleIdDisplay.style.webkitTextSecurity = "none";
    }
  }

  function populatePermissions(root, permissions) {
    console.log("[RoleEdit] === POPULATE PERMISSIONS START ===");
    console.log("[RoleEdit] populatePermissions called with:", permissions);
    console.log("[RoleEdit] Current role data:", currentRoleData);

    if (!Array.isArray(permissions)) {
      console.log("[RoleEdit] Permissions is not an array, returning");
      return;
    }

    const fieldset = qs("[data-permissions-fieldset]", root);
    if (!fieldset) {
      console.log("[RoleEdit] Permissions fieldset not found, returning");
      return;
    }

    console.log("[RoleEdit] Found permissions fieldset, proceeding...");

    // IMPORTANT: Cancel any pending nuclear fix to prevent race conditions
    if (nuclearFixTimeout) {
      console.log(
        "[RoleEdit] ⚠️  Canceling previous nuclear fix timeout to prevent race condition"
      );
      clearTimeout(nuclearFixTimeout);
      nuclearFixTimeout = null;
    }

    // Store the role ID this permissions population is for
    const roleIdForThisPopulation =
      currentRoleData?.roleId || currentRoleData?.id || `temp-${Date.now()}`;
    currentRoleId = roleIdForThisPopulation;
    console.log(
      `[RoleEdit] 🔄 Setting up permissions for role: ${roleIdForThisPopulation}`
    );

    // ENHANCED RESET: Completely clear all checkbox states first
    const allCheckboxes = qsa('input[name="permissions[]"]', fieldset);
    console.log(
      `[RoleEdit] 🧹 Found ${allCheckboxes.length} permission checkboxes to reset`
    );

    // First pass: Complete reset of all checkboxes
    allCheckboxes.forEach((cb, index) => {
      // Uncheck using all methods
      cb.checked = false;
      cb.defaultChecked = false;
      cb.removeAttribute("checked");

      // ENABLE all checkboxes by default - critical for all access functionality
      cb.disabled = false;

      // Clear any visual state
      cb.classList.remove("checked", "selected");

      // Force visual update with reflow
      const originalDisplay = cb.style.display;
      cb.style.display = "none";
      cb.offsetHeight; // Force reflow
      cb.style.display = originalDisplay;
    });

    console.log(
      `[RoleEdit] ✅ Reset ${allCheckboxes.length} checkboxes to unchecked state`
    );

    // Second pass: Check only the required permissions
    let checkedCount = 0;
    const permissionsToCheck = new Set(); // Track duplicates

    permissions.forEach((perm) => {
      // Handle both string permissions and permission objects
      let permissionName;
      if (typeof perm === "string") {
        permissionName = perm;
      } else if (typeof perm === "object" && perm !== null) {
        // Extract permission name from object - try various properties
        permissionName =
          perm.name ||
          perm.permission ||
          perm.code ||
          perm.permissionName ||
          perm.displayName;
        console.log(
          `[RoleEdit] Permission object:`,
          perm,
          `-> extracted name: "${permissionName}"`
        );
      } else {
        console.log(`[RoleEdit] ❌ Invalid permission format:`, perm);
        return;
      }

      if (!permissionName) {
        console.log(
          `[RoleEdit] ❌ Could not extract permission name from:`,
          perm
        );
        return;
      }

      // Check for duplicates
      if (permissionsToCheck.has(permissionName)) {
        console.log(
          `[RoleEdit] ⚠️  Duplicate permission detected and skipped: "${permissionName}"`
        );
        return;
      }
      permissionsToCheck.add(permissionName);

      console.log(
        `[RoleEdit] 🔍 Looking for checkbox with value: "${permissionName}"`
      );
      const checkbox = qs(
        `input[name="permissions[]"][value="${permissionName}"]`,
        fieldset
      );

      if (checkbox) {
        // Set checked state using multiple methods
        checkbox.checked = true;
        checkbox.defaultChecked = true;
        checkbox.setAttribute("checked", "checked");

        // Force visual refresh with reflow
        const originalDisplay = checkbox.style.display;
        checkbox.style.display = "none";
        checkbox.offsetHeight; // Force reflow
        checkbox.style.display = originalDisplay;

        checkedCount++;
        console.log(
          `[RoleEdit] ✅ Checked permission: "${permissionName}" (${checkedCount}/${permissions.length})`
        );
      } else {
        console.log(
          `[RoleEdit] ❌ Checkbox not found for permission: "${permissionName}"`
        );
      }
    });

    console.log(
      `[RoleEdit] populatePermissions completed: ${checkedCount}/${permissions.length} permissions checked`
    );

    // ENHANCED NUCLEAR FIX with race condition protection
    nuclearFixTimeout = setTimeout(() => {
      // Verify we're still working with the same role (prevent race conditions)
      if (currentRoleId !== roleIdForThisPopulation) {
        console.log(
          `[RoleEdit] Nuclear fix canceled - role changed from ${roleIdForThisPopulation} to ${currentRoleId}`
        );
        return;
      }

      const checkedBoxes = qsa('input[name="permissions[]"]:checked', fieldset);
      console.log(
        `[RoleEdit] Nuclear fix starting for role ${roleIdForThisPopulation}: found ${checkedBoxes.length} checked checkboxes`
      );

      if (checkedBoxes.length > 0) {
        console.log(
          `[RoleEdit] Applying nuclear checkbox fix for visual state...`
        );

        checkedBoxes.forEach((originalCheckbox, index) => {
          try {
            const value = originalCheckbox.value;
            const name = originalCheckbox.name;
            const id = originalCheckbox.id;

            console.log(`[RoleEdit] Nuclear fix ${index + 1}: ${value}`);

            // Find the parent label
            const label =
              originalCheckbox.closest("label") ||
              originalCheckbox.parentElement;

            if (label) {
              // Create a completely new checkbox
              const newCheckbox = document.createElement("input");
              newCheckbox.type = "checkbox";
              newCheckbox.name = name;
              newCheckbox.value = value;
              if (id) newCheckbox.id = id;

              // Set it as checked using all possible methods
              newCheckbox.checked = true;
              newCheckbox.defaultChecked = true;
              newCheckbox.setAttribute("checked", "checked");

              // PRESERVE DISABLED STATE - Critical for all access checkbox functionality
              if (originalCheckbox.disabled) {
                newCheckbox.disabled = true;
                console.log(
                  `[RoleEdit] ✅ Preserved disabled state for: ${value}`
                );
              }

              // Copy any classes
              if (originalCheckbox.className) {
                newCheckbox.className = originalCheckbox.className;
              }

              // Replace the original
              label.replaceChild(newCheckbox, originalCheckbox);

              // Force immediate reflow
              newCheckbox.style.display = "none";
              newCheckbox.offsetHeight;
              newCheckbox.style.display = "";

              console.log(
                `[RoleEdit] ✅ Nuclear fixed: ${value} - checked=${newCheckbox.checked}`
              );
            } else {
              console.log(`[RoleEdit] ❌ Could not find parent for ${value}`);
            }
          } catch (error) {
            console.error(
              `[RoleEdit] Error in nuclear fix for checkbox ${index + 1}:`,
              error
            );
          }
        });

        console.log(
          `[RoleEdit] Nuclear checkbox fix completed for role ${roleIdForThisPopulation}`
        );
        nuclearFixTimeout = null; // Clear the timeout reference

        // CRITICAL: Re-apply all access checkbox logic after nuclear fix
        // This ensures that if all access is checked, other checkboxes remain disabled
        const allAccessCheckbox = qs(
          "#roleEdit_roleEditAllAccessCheckbox",
          fieldset
        );
        if (allAccessCheckbox && allAccessCheckbox.checked) {
          console.log(
            "[RoleEdit] ⚠️  All access is checked, re-disabling other checkboxes after nuclear fix"
          );

          const allPermissionCheckboxes = qsa(
            'input[name="permissions[]"]:not(#roleEditAllAccessCheckbox)',
            fieldset
          );
          const allModuleCheckboxes = qsa(
            'input[class^="select-all-"]',
            fieldset
          );

          // Disable all other checkboxes as all access is checked
          allPermissionCheckboxes.forEach((cb) => {
            cb.disabled = true;
          });
          allModuleCheckboxes.forEach((cb) => {
            cb.disabled = true;
          });

          console.log(
            `[RoleEdit] ✅ Re-disabled ${
              allPermissionCheckboxes.length + allModuleCheckboxes.length
            } checkboxes for all access`
          );
        }
      }
    }, 200);

    // Update module "Select All" states
    setupBulkSelectionHandlers(root);
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

    if (!currentRoleData || !currentRoleData.roleId) {
      console.error("[RoleEdit] No role data available for update");
      window.TANotification?.error?.("No role selected for editing");
      return;
    }

    try {
      submitting = true;
      const submitBtn = qs('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = true;
      const api = await getApi();

      try {
        await api.roles.update(currentRoleData.roleId, payload);
      } catch (e) {
        console.warn("[RoleEdit] Internal API failed, trying CoreUtils:", e);
        await CoreUtils.api.request(
          "PUT",
          `/internal/roles/${currentRoleData.roleId}`,
          payload
        );
      }

      window.TANotification?.success?.("Role updated successfully");
      close();
      window.reloadRolesList?.();
    } catch (err) {
      console.error("[RoleEdit] update failed", err);
      window.TANotification?.error?.("Update failed");
    } finally {
      submitting = false;
      const submitBtn = qs('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = false;
    }
  }
  async function open(roleDataOrId) {
    if (!roleDataOrId) {
      console.error("[RoleEdit] No role data or ID provided");
      return;
    }

    console.log("[RoleEdit] === OPENING ROLE EDIT MODAL ===");
    console.log("[RoleEdit] Input data:", roleDataOrId);

    // IMPORTANT: Clean up any previous state to prevent race conditions
    if (nuclearFixTimeout) {
      console.log("[RoleEdit] Clearing previous nuclear fix timeout");
      clearTimeout(nuclearFixTimeout);
      nuclearFixTimeout = null;
    }

    let roleData;

    // Check if we received a role object or just an ID
    if (typeof roleDataOrId === "string") {
      // We received an ID, need to fetch the role data
      console.log("[RoleEdit] Fetching role data for ID:", roleDataOrId);
      try {
        const api = await getApi();
        const response = await api.roles.get(roleDataOrId);
        roleData = response.data || response;
        console.log("[RoleEdit] Fetched role data:", roleData);
      } catch (err) {
        console.error("[RoleEdit] Failed to fetch role data:", err);
        window.TANotification?.error?.("Failed to load role data");
        return;
      }
    } else {
      // We received the full role object
      roleData = roleDataOrId;
    }

    if (!roleData) {
      console.error("[RoleEdit] No valid role data found");
      return;
    }

    // Set current role data with enhanced logging
    const newRoleId = roleData.roleId || roleData.id || Date.now();
    console.log(
      `[RoleEdit] Setting current role to: ${newRoleId} (${
        roleData.roleName || "Unnamed Role"
      })`
    );
    currentRoleData = roleData;
    currentRoleId = newRoleId;

    const c = await ensureContainer();
    c.classList.add("show");

    // Populate form with role data
    populateForm(c, roleData);

    // If permissions are already loaded in the DOM, populate them immediately
    const fieldset = qs("[data-permissions-fieldset]", c);
    if (fieldset && fieldset.children.length > 1) {
      // More than just error messages
      const permCheckboxes = qsa('input[name="permissions[]"]', fieldset);
      if (permCheckboxes.length > 0) {
        console.log(
          `[RoleEdit] Permissions already loaded (${permCheckboxes.length} checkboxes), populating immediately`
        );
        populatePermissions(c, roleData.permissions || []);
      }
    }

    // Permissions will also be populated automatically when loadPermissions() completes
    // This ensures they're populated whether permissions are already loaded or still loading
  }
  function close() {
    console.log("[RoleEdit] === CLOSING ROLE EDIT MODAL ===");
    const c = qs("#" + containerId);
    if (!c) return;

    c.classList.remove("show");
    const form = qs("#roleEditForm", c);
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

    // IMPORTANT: Complete cleanup to prevent race conditions
    if (nuclearFixTimeout) {
      console.log("[RoleEdit] Clearing nuclear fix timeout on close");
      clearTimeout(nuclearFixTimeout);
      nuclearFixTimeout = null;
    }

    // Reset all permission checkboxes to prevent state bleeding
    const fieldset = qs("[data-permissions-fieldset]", c);
    if (fieldset) {
      const allCheckboxes = qsa('input[name="permissions[]"]', fieldset);
      console.log(
        `[RoleEdit] Resetting ${allCheckboxes.length} checkboxes on close`
      );
      allCheckboxes.forEach((cb) => {
        cb.checked = false;
        cb.defaultChecked = false;
        cb.removeAttribute("checked");
        // RE-ENABLE all checkboxes on close to prevent state bleeding
        cb.disabled = false;
      });
    }

    console.log("[RoleEdit] Clearing current role data");
    currentRoleData = null;
    currentRoleId = null;
  }
  window.openRoleEditModal = open;
})();
