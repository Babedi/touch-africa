// Tenant Admin - Create External Role Modal
// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
  ValidationHelpers,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  // Import utility functions with consistent destructuring
  const {
    escapeHtml,
    secureSetHTML,
    trustedSetHTML,
    secureInsertHTML,
    trustedInsertHTML,
    buildSecureSelectOptions,
  } = window.SecurityUtils || {};

  const {
    ValidationRules,
    FieldValidationConfig,
    validateField,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setupRealtimeValidation,
  } = window.ValidationUtils || {};

  const {
    closeModal,
    resetModalForm,
    setModalLoading,
    handleFormSubmission,
    showModal,
  } = window.ModalUtils || {};

  const containerId = "tenantRoleCreateModal";
  const htmlPath =
    "/frontend/dashboards/tenant.admin/modals/role.create.modal/role.create.modal.html";
  const DEBUG = !!window.__DEBUG__;
  let apiClientInstance = null;

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
      el.className = "modal-overlay modal-lg modal-tenant-role-create";
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
      if (DEBUG) console.warn("Notifications load failed", e);
    }
  }

  async function getApi() {
    // Force reload to bypass cache during debugging
    apiClientInstance = null;
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      `?v=${Date.now()}`; // Force cache busting
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;
    apiClientInstance = new TouchAfricaApiClient({
      baseUrl,
      token,
      timeout: 15000,
    });

    // Debug logging (only when DEBUG is enabled)
    if (DEBUG) {
      console.log(
        "[TenantRoleCreate] API client created with methods:",
        Object.keys(apiClientInstance)
      );
      console.log(
        "[TenantRoleCreate] standardPermissions exists:",
        !!apiClientInstance.standardPermissions
      );
      if (apiClientInstance.standardPermissions) {
        console.log(
          "[TenantRoleCreate] standardPermissions methods:",
          Object.keys(apiClientInstance.standardPermissions)
        );
      }
    }

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
      if (DEBUG) console.warn("toast failed", e);
    }
  }

  // Validation per backend ExternalRoleSchema (role.validation.js)
  // Custom validation rules for role creation using ValidationUtils framework
  const customValidationRules = {
    tenantId: [ValidationRules.required],
    roleName: [
      ValidationRules.required,
      ValidationRules.minLength(3),
      ValidationRules.maxLength(50),
    ],
    roleCode: [
      ValidationRules.required,
      ValidationRules.minLength(2),
      ValidationRules.maxLength(30),
      {
        validate: (value) => {
          if (!ValidationHelpers.isValidRoleCode(value)) {
            return "Role code must contain only uppercase letters and underscores";
          }
          return true;
        },
      },
    ],
    description: [
      ValidationRules.required,
      ValidationRules.minLength(10),
      ValidationRules.maxLength(200),
    ],
  };

  // Custom permissions validation function
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

  function setupBulkSelectionHandlers(root) {
    const fieldset = qs("[data-permissions-fieldset]", root);
    if (!fieldset) return;
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
          allPermissionCheckboxes.forEach((cb) => {
            cb.checked = false;
            cb.disabled = true;
          });
          allModuleCheckboxes.forEach((cb) => {
            cb.checked = false;
            cb.disabled = true;
          });
        } else {
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

  async function loadPermissions(root, tenantId = null) {
    const fieldset = qs("[data-permissions-fieldset]", root);
    if (!fieldset) return;
    const loading = qs(".loading-permissions", fieldset);
    if (loading) loading.remove();

    // Clear existing permissions before loading
    const existingModules = qsa(".perm-module", fieldset);
    existingModules.forEach((mod) => mod.remove());

    try {
      const api = await getApi();
      let res;

      if (!tenantId) {
        // Load standard permissions when no tenant is selected
        try {
          if (DEBUG) {
            console.log(
              "[TenantRoleCreate] Loading standard permissions (no tenant selected)"
            );
            console.log("[TenantRoleCreate] API object:", api);
            console.log(
              "[TenantRoleCreate] standardPermissions method exists:",
              typeof api.standardPermissions?.list
            );
          }

          if (
            !api.standardPermissions ||
            typeof api.standardPermissions.list !== "function"
          ) {
            if (DEBUG)
              console.error(
                "[TenantRoleCreate] standardPermissions.list method not found! Falling back to permissions.list"
              );
            // Fallback to old method for debugging
            res = await api.permissions.list({ limit: 500 });
          } else {
            if (DEBUG)
              console.log(
                "[TenantRoleCreate] Calling api.standardPermissions.list"
              );
            res = await api.standardPermissions.list({ limit: 500 });
          }
        } catch (apiError) {
          console.error(
            "[TenantRoleCreate] Standard permissions load failed:",
            apiError
          );
          const errorHtml =
            '<div class="text-error" style="font-size:0.75rem;">Failed to load standard permissions. Please try again.</div>';
          if (trustedInsertHTML) {
            trustedInsertHTML(fieldset, "beforeend", errorHtml);
          } else {
            fieldset.insertAdjacentHTML("beforeend", errorHtml);
          }
          return;
        }
      } else {
        // Load tenant-specific permissions when a tenant is selected
        try {
          res = await api.externalPermissions.list(tenantId, { limit: 500 });
        } catch (apiError) {
          console.error(
            "[TenantRoleCreate] external permissions list failed",
            apiError
          );
          const errorHtml =
            '<div class="text-error" style="font-size:0.75rem;">Failed to load tenant permissions. Please try again.</div>';
          if (trustedInsertHTML) {
            trustedInsertHTML(fieldset, "beforeend", errorHtml);
          } else {
            fieldset.insertAdjacentHTML("beforeend", errorHtml);
          }
          return;
        }
      }

      const env = res?.data ?? res;
      const list = Array.isArray(env?.data)
        ? env.data
        : Array.isArray(env)
        ? env
        : env?.items || [];
      if (!list.length) {
        const message = tenantId
          ? "No permissions available for this tenant."
          : "No standard permissions available. Please add standard permissions first.";
        const messageHtml = `<div class="text-muted">${
          escapeHtml ? escapeHtml(message) : message
        }</div>`;
        if (trustedInsertHTML) {
          trustedInsertHTML(fieldset, "beforeend", messageHtml);
        } else {
          fieldset.insertAdjacentHTML("beforeend", messageHtml);
        }
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
              const baseId = p.permissionId || p.code || p.id || "unknown";
              const safeBaseId = escapeHtml
                ? escapeHtml(String(baseId))
                : String(baseId);

              if (Array.isArray(p.permissions) && p.permissions.length > 0) {
                return p.permissions.map((permName) => {
                  const safePermName = escapeHtml
                    ? escapeHtml(String(permName))
                    : String(permName);
                  const safeModule = escapeHtml
                    ? escapeHtml(String(p.module || p.moduleCode || "general"))
                    : String(p.module || p.moduleCode || "general");
                  return `<label class="perm-item"><input type="checkbox" name="permissions[]" value="${safePermName}" data-permission-id="${safeBaseId}" data-module="${safeModule}"/> <span>${safePermName}</span></label>`;
                });
              } else if (Array.isArray(p.name) && p.name.length > 0) {
                return p.name.map((permName) => {
                  const safePermName = escapeHtml
                    ? escapeHtml(String(permName))
                    : String(permName);
                  const safeModule = escapeHtml
                    ? escapeHtml(String(p.module || p.moduleCode || "general"))
                    : String(p.module || p.moduleCode || "general");
                  return `<label class="perm-item"><input type="checkbox" name="permissions[]" value="${safePermName}" data-permission-id="${safeBaseId}" data-module="${safeModule}"/> <span>${safePermName}</span></label>`;
                });
              } else {
                const displayName =
                  p.name ||
                  p.displayName ||
                  p.permission ||
                  p.code ||
                  baseId ||
                  "Unnamed Permission";

                // Escape all user data to prevent XSS
                const safeDisplayName = escapeHtml
                  ? escapeHtml(String(displayName))
                  : String(displayName);
                const safeBaseId = escapeHtml
                  ? escapeHtml(String(baseId))
                  : String(baseId);
                const safeModule = escapeHtml
                  ? escapeHtml(String(p.module || p.moduleCode || "general"))
                  : String(p.module || p.moduleCode || "general");

                return [
                  `<label class="perm-item"><input type="checkbox" name="permissions[]" value="${safeDisplayName}" data-permission-id="${safeBaseId}" data-module="${safeModule}"/> <span>${safeDisplayName}</span></label>`,
                ];
              }
            })
            .join("");

          // Escape module name for safe rendering
          const safeModuleName = escapeHtml
            ? escapeHtml(String(mod))
            : String(mod);
          const safeModuleData = escapeHtml
            ? escapeHtml(String(mod))
            : String(mod);

          return `<div class="perm-module" data-module="${safeModuleData}">
          <div class="module-header" style="display:flex;align-items:center;margin-bottom:10px;">
            <h4 style="margin:0;margin-right:10px;">${safeModuleName}</h4>
            <label class="perm-item select-all-module" style="font-size:0.9em;color:#6c757d;">
              <input type="checkbox" class="select-all-${safeModuleData}" data-module="${safeModuleData}" />
              <span>Select All</span>
            </label>
          </div>
          <div class="perm-list">${chips}</div>
        </div>`;
        })
        .join("");
      const invalid = qs('.invalid-feedback[data-for="permissions"]', fieldset);
      if (trustedInsertHTML) {
        if (invalid) {
          trustedInsertHTML(invalid, "beforebegin", modulesHtml);
        } else {
          trustedInsertHTML(fieldset, "beforeend", modulesHtml);
        }
      } else {
        // Secure fallback when trustedInsertHTML is not available
        if (invalid) {
          if (trustedInsertHTML) {
            trustedInsertHTML(invalid, "beforebegin", modulesHtml);
          } else {
            invalid.insertAdjacentHTML("beforebegin", modulesHtml);
          }
        } else {
          if (trustedInsertHTML) {
            trustedInsertHTML(fieldset, "beforeend", modulesHtml);
          } else {
            fieldset.insertAdjacentHTML("beforeend", modulesHtml);
          }
        }
      }
      setupBulkSelectionHandlers(root);
    } catch (e) {
      console.error("[TenantRoleCreate] Permission loading failed:", e);
      const errorHtml =
        '<div class="text-error" style="font-size:0.75rem;">Failed to load permissions. Check console for details.</div>';
      if (trustedInsertHTML) {
        trustedInsertHTML(fieldset, "beforeend", errorHtml);
      } else {
        // Secure fallback when trustedInsertHTML is not available
        fieldset.insertAdjacentHTML("beforeend", errorHtml);
      }
    }
  }

  function collect(form) {
    const data = {};
    qsa("input,textarea,select", form).forEach((el) => {
      if (!el.name) return;
      if (el.type === "checkbox") {
        if (el.name === "permissions[]") return;
        data[el.name] = el.checked;
      } else {
        data[el.name] = el.value.trim();
      }
    });
    data.permissions = qsa('input[name="permissions[]"]', form)
      .filter((b) => b.checked)
      .map((b) => b.value);
    if (data.isActive == null) data.isActive = true;
    // Defaults from schema
    data.isSystem = false;
    data.priority = 50;
    return data;
  }

  async function populateTenants(root) {
    const select = qs("#roleCreate_tenantRoleTenantId", root);
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

      // Use consistent SecurityUtils approach
      const selectOptions = buildSecureSelectOptions
        ? buildSecureSelectOptions(
            items.map((t) => ({
              value: t.tenantId || t.id,
              text: `${t.name || t.tenantId || t.id} (${t.tenantId || t.id})`,
            })),
            "",
            "No specific tenant (use standard permissions)"
          )
        : '<option value="">No specific tenant (use standard permissions)</option>' +
          items
            .map((t) => {
              const id = escapeHtml
                ? escapeHtml(String(t.tenantId || t.id))
                : String(t.tenantId || t.id);
              const name = escapeHtml
                ? escapeHtml(String(t.name || id))
                : String(t.name || id);
              return `<option value="${id}">${name} (${id})</option>`;
            })
            .join("");

      // Use consistent DOM manipulation
      if (trustedSetHTML) {
        trustedSetHTML(select, selectOptions);
      } else {
        select.innerHTML = selectOptions;
      }
    } catch (e) {
      if (DEBUG) console.warn("tenants load failed", e);
    }
  }

  function wire(container) {
    const form = qs("#tenantRoleCreateForm", container);
    if (!form) return;
    const cancelBtn = qsa('[data-action="cancel"]', form)[0];
    if (cancelBtn)
      cancelBtn.addEventListener("click", () =>
        closeModal({ modal: container })
      );

    // Handle tenant selection change to reload permissions
    const tenantSelect = qs("#roleCreate_tenantRoleTenantId", container);
    if (tenantSelect) {
      tenantSelect.addEventListener("change", (e) => {
        const selectedTenantId = e.target.value.trim();
        // Reload permissions based on selected tenant
        loadPermissions(container, selectedTenantId || null);
      });
    }

    // Setup realtime validation using ValidationUtils
    if (setupRealtimeValidation) {
      setupRealtimeValidation(form, customValidationRules);
    } else {
      // Fallback realtime validation
      form.addEventListener("input", (e) => {
        if (e.target && e.target.name && validateField) {
          validateField(e.target, container, customValidationRules);
        }
      });
      form.addEventListener(
        "blur",
        (e) => {
          if (e.target && e.target.name && validateField) {
            validateField(e.target, container, customValidationRules);
          }
        },
        true
      );
    }

    // Handle permissions validation
    form.addEventListener("change", (e) => {
      if (e.target && e.target.name === "permissions[]")
        validatePermissions(container);
    });

    populateTenants(container);
    loadPermissions(container, null); // Initially load with no tenant selected

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Use standardized validation
      let isValid = true;
      if (validateForm) {
        isValid = validateForm(form, customValidationRules);
      }
      if (!validatePermissions(container)) {
        isValid = false;
      }

      if (!isValid) return;

      const tenantId = form.elements["tenantId"].value.trim();
      const payload = collect(form);

      try {
        // Use ModalUtils loading state if available
        if (setModalLoading) {
          setModalLoading(container, true);
        } else {
          form.classList.add("is-loading");
        }

        const api = await getApi();
        await api.tenantRoles.create(tenantId, payload);
        await showToast("success", "Role created successfully");

        // Use standardized modal close
        closeModal({
          modal: container,
          success: true,
          refreshParent: true,
        });

        if (window.reloadTenantRolesList) window.reloadTenantRolesList();
      } catch (err) {
        let msg = "Could not create role";
        if (err?.data?.errors) {
          Object.entries(err.data.errors).forEach(([field, errorMsg]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input && setFieldError) {
              const errorText = Array.isArray(errorMsg)
                ? errorMsg.join(", ")
                : String(errorMsg);
              setFieldError(input, errorText, form);
            } else if (input) {
              // Fallback error handling
              input.classList.add("is-invalid");
              const fb = form.querySelector(
                `.invalid-feedback[data-for="${field}"]`
              );
              if (fb) {
                fb.textContent = Array.isArray(errorMsg)
                  ? errorMsg.join(", ")
                  : String(errorMsg);
              }
            }
          });
          msg = "Please fix the highlighted errors";
        } else if (err?.data?.message) {
          msg = err.data.message;
        }
        await showToast("error", msg, { title: "Error" });
      } finally {
        // Clear loading state
        if (setModalLoading) {
          setModalLoading(container, false);
        } else {
          form.classList.remove("is-loading");
        }
      }
    });
  }

  function openModal() {
    (async () => {
      try {
        await ensureNotifications();
        const overlay = ensureOverlay();
        if (!overlay.dataset.loaded) {
          const res = await fetch(htmlPath, { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to load modal HTML");

          // Safely set HTML content from trusted source (our own HTML files)
          const htmlContent = await res.text();
          if (trustedSetHTML) {
            trustedSetHTML(overlay, htmlContent);
          } else {
            overlay.innerHTML = htmlContent;
          }

          overlay.dataset.loaded = "1";
          wire(overlay);
        } else {
          // Reset form if modal already loaded
          if (resetModalForm) {
            resetModalForm(overlay);
          }
        }

        overlay.classList.add("show");
        const closeBtn = qs(".modal-close", overlay);
        if (closeBtn)
          closeBtn.addEventListener("click", () =>
            closeModal({ modal: overlay })
          );

        // Handle escape key
        document.addEventListener(
          "keydown",
          function esc(ev) {
            if (ev.key === "Escape") {
              closeModal({ modal: overlay });
              document.removeEventListener("keydown", esc);
            }
          },
          { once: true }
        );
      } catch (e) {
        console.error("Open tenant role modal failed", e);
        showToast("error", "Could not open modal");
      }
    })();
  }

  window.openTenantRoleCreateModal = openModal;
})();
