// Login Modal Scripts (decoupled, dynamically loaded)
// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
  ValidationHelpers,
  VALIDATION_MESSAGES,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "loginModal";
  const htmlPath = "/frontend/home/modals/login.modal/login.modal.html";
  let apiClientInstance = null; // cached TouchAfricaApiClient instance

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }
  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  // Clear all form fields and errors inside the modal container
  function clearForms(root) {
    if (!root) return;
    // Reset all forms
    qsa("form", root).forEach((f) => {
      try {
        f.reset();
      } catch {}
    });
    // Clear error messages
    qsa(".error-message", root).forEach((el) => (el.textContent = ""));
    // Remove error classes
    qsa("input, select, textarea", root).forEach((el) => {
      if (el.classList) el.classList.remove("error");
    });
  }

  async function ensureModal() {
    let container = qs("#" + containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      // overlay is styled in modals.styles.css
      document.body.appendChild(container);
    }
    if (!container.dataset.loaded) {
      try {
        const res = await fetch(htmlPath, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load login modal HTML");
        container.innerHTML = await res.text();
        container.dataset.loaded = "1";
      } catch (err) {
        console.error(err);
      }
    }
    return container;
  }

  // Lazy-load the browser ESM API client and return a configured instance
  async function getApiClient() {
    if (apiClientInstance) return apiClientInstance;
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      `?v=${window.__APP_BUILD_TS__ || Date.now()}`;
    try {
      const mod = await import(clientPath);
      const { TouchAfricaApiClient } = mod;
      const baseUrl = window.__API_BASE_URL__ || window.location.origin;
      const token = localStorage.getItem("token") || null;
      apiClientInstance = new TouchAfricaApiClient({ baseUrl, token });
      return apiClientInstance;
    } catch (e) {
      console.error("Failed to load API client", e);
      throw e;
    }
  }

  // Ensure Notification component is available (single source of truth)
  // Provided by /frontend/shared/scripts/components/ensure-notification.js
  async function ensureNotifications() {
    if (window.ensureNotifications) return window.ensureNotifications();
    if (window.TANotification) return window.TANotification;
    // Fallback to dynamic load if helper wasn't included
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/frontend/shared/scripts/components/notification.js";
      s.async = true;
      s.onload = () => resolve(window.TANotification);
      s.onerror = (err) => reject(err);
      document.head.appendChild(s);
    });
  }

  async function open() {
    const container = await ensureModal();
    if (!container) return;
    showSelection(container);
    wire(container);
    // Populate tenant selects on first open
    try {
      await populateTenantSelects(container);
    } catch (e) {
      console.warn("Failed to populate tenant selects", e);
    }
    container.classList.add("show");
  }

  function close() {
    const container = qs("#" + containerId);
    if (!container) return;
    // Clear forms and errors before hiding
    clearForms(container);
    // Return to selection view next time it opens
    showSelection(container);
    container.classList.remove("show");
  }

  function showSelection(root) {
    const sel = qs("#login_loginSelection", root);
    const i = qs("#login_internalLogin", root);
    const ta = qs("#login_tenantAdminLogin", root);
    const tu = qs("#login_tenantUserLogin", root);
    if (sel) sel.style.display = "block";
    if (i) i.style.display = "none";
    if (ta) ta.style.display = "none";
    if (tu) tu.style.display = "none";
  }

  function wire(root) {
    // Close button
    const closeBtn = qs(".modal-close", root) || qs("#login_closeModal", root);
    if (closeBtn && !closeBtn.dataset._wired) {
      closeBtn.dataset._wired = "1";
      closeBtn.addEventListener("click", close);
    }

    // Clicking outside closes
    if (!root.dataset._overlayWired) {
      root.dataset._overlayWired = "1";
      root.addEventListener("click", (e) => {
        if (e.target === root) close();
      });
      // ESC key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });
    }

    // Options
    qsa(".login-option", root).forEach((opt) => {
      if (opt.dataset._wired) return;
      opt.dataset._wired = "1";
      opt.addEventListener("click", () => {
        const type = opt.getAttribute("data-type");
        const sel = qs("#login_loginSelection", root);
        if (sel) sel.style.display = "none";
        if (type === "internal")
          qs("#login_internalLogin", root).style.display = "block";
        if (type === "tenant-admin")
          qs("#login_tenantAdminLogin", root).style.display = "block";
        if (type === "tenant-user")
          qs("#login_tenantUserLogin", root).style.display = "block";
      });
    });

    // Back buttons
    qsa('[data-action="back"]', root).forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", () => showSelection(root));
    });

    // Validation helpers
    const findErrorEl = (field) =>
      qs(`.error-message[data-for="${field.id}"]`, root) ||
      qs(`.error-message[data-for="${field.name}"]`, root);
    const showFieldError = (field, message) => {
      if (!field) return; // Add null check
      field.classList.add("error");
      const el = findErrorEl(field);
      if (el) {
        el.textContent = message || "This field is required";
        el.style.display = "block"; // ensure visible even if CSS uses :empty rule
      }
    };
    const clearFieldError = (field) => {
      field.classList.remove("error");
      const el = findErrorEl(field);
      if (el) {
        el.textContent = "";
        el.style.display = "";
      }
    };
    const validateField = (field) => {
      const val = (field.value || "").trim();
      clearFieldError(field);
      // required
      if (field.hasAttribute("required") && !val) {
        showFieldError(field, "This field is required");
        return false;
      }
      // specific rules
      if (field.type === "email" && val) {
        if (!ValidationHelpers.isValidEmail(val)) {
          showFieldError(field, VALIDATION_MESSAGES.EMAIL);
          return false;
        }
      }
      if (field.type === "tel" && val) {
        const digits = val.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 13) {
          showFieldError(field, "Enter a valid phone number (10-13 digits)");
          return false;
        }
      }
      if (field.name === "pin" && val) {
        const digits = val.replace(/\D/g, "");
        if (digits.length < 4 || digits.length > 6) {
          showFieldError(field, "PIN must be 4-6 digits");
          return false;
        }
      }
      return true;
    };
    const validateForm = (form) => {
      let ok = true;
      qsa("input, select, textarea", form).forEach((f) => {
        if (!validateField(f)) ok = false;
      });
      return ok;
    };
    const debounce = (fn, wait = 400) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    };

    // Attach realtime validation per form
    qsa("#internalForm, #tenantAdminForm, #tenantUserForm", root).forEach(
      (form) => {
        if (form.dataset._wired) return;
        form.dataset._wired = "1";

        qsa("input, select, textarea", form).forEach((field) => {
          field.addEventListener("focus", () => clearFieldError(field));
          field.addEventListener("blur", () => validateField(field));
          if (field.tagName === "SELECT")
            field.addEventListener("change", () => validateField(field));
          if (
            field.type === "email" ||
            field.type === "tel" ||
            field.name === "pin"
          ) {
            field.addEventListener(
              "input",
              debounce(() => validateField(field), 400)
            );
          }
        });

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!validateForm(form)) {
            const first =
              qs(".error, [aria-invalid='true']", form) ||
              qs("input, select, textarea", form);
            if (first && first.focus) first.focus();
            return;
          }

          // Service Admin login flow
          if (form.id === "internalForm") {
            const emailEl = qs("#login_internalEmail", form);
            const passEl = qs("#login_internalPassword", form);
            const submitBtn = qs('button[type="submit"]', form);

            // loading state
            const origText = submitBtn?.textContent;
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = "Logging in...";
            }

            try {
              const client = await getApiClient();
              const res = await client.admins.login({
                email: (emailEl?.value || "").trim(),
                password: passEl?.value || "",
              });

              // Accept both standardized and raw structures
              const payload = res && res.data ? res.data : res;
              const token = payload?.token;
              const admin = payload?.admin || payload?.user || null;
              if (!token)
                throw new Error("Invalid server response: token missing");

              // Persist token and minimal session state
              localStorage.setItem("token", token);
              localStorage.setItem("userRole", "internal_admin");
              if (admin) {
                try {
                  localStorage.setItem("user", JSON.stringify(admin));
                } catch {}
              }
              try {
                client.setToken(token);
              } catch {}

              // Close modal, then toast, then redirect to service admin dashboard
              close();
              try {
                await ensureNotifications();
              } catch {}
              setTimeout(() => {
                if (window.TANotification) {
                  window.TANotification.success(
                    "Welcome back! Redirecting to dashboard...",
                    { title: "Login successful", duration: 2200 }
                  );
                }
                setTimeout(() => {
                  window.location.href =
                    "/dashboards/internal.admin/dashboard.html";
                }, 500);
              }, 200);
              return; // stop here for internal login
            } catch (err) {
              console.error("Service admin login failed", err);

              // Enhanced error handling for timeout and connection issues
              let msg;
              if (
                err &&
                (err.message === "timeout" || err.name === "AbortError")
              ) {
                msg =
                  "Connection timeout. Please check your internet connection and try again.";
              } else if (err && err.status === 401) {
                msg = "Invalid email or password";
              } else if (err && err.status === 0) {
                msg =
                  "Unable to connect to server. Please check your connection.";
              } else {
                msg =
                  (err && (err.data?.error?.message || err.data?.message)) ||
                  "Login failed. Please try again.";
              }

              // show field-level error on password
              showFieldError(passEl, msg);
              passEl?.focus();
              // toast error message
              try {
                await ensureNotifications();
                if (window.TANotification) {
                  window.TANotification.error(msg, {
                    title: "Login failed",
                    duration: 4000,
                  });
                }
              } catch {}
            } finally {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = origText || "Login";
              }
            }
            return; // do not fall through
          }

          // Tenant Admin login flow
          if (form.id === "tenantAdminForm") {
            const orgEl = qs("#login_adminOrganization", form);
            const emailEl = qs("#login_adminEmail", form);
            const passEl = qs("#login_adminPassword", form);
            const submitBtn = qs('button[type="submit"]', form);

            // Ensure organization selected
            const tenantId = (orgEl?.value || "").trim();
            if (!tenantId) {
              // surface error on select
              const selError = qs(
                '.error-message[data-for="adminOrganization"]',
                form
              );
              if (selError)
                selError.textContent = "Please select an organization";
              orgEl?.classList.add("error");
              orgEl?.focus();
              return;
            }

            // loading state
            const origText = submitBtn?.textContent;
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.textContent = "Logging in...";
            }

            try {
              const client = await getApiClient();
              const res = await client.externalAdmins.login(tenantId, {
                email: (emailEl?.value || "").trim(),
                password: passEl?.value || "",
              });

              const payload = res && res.data ? res.data : res;
              const token = payload?.token;
              const admin = payload?.admin || payload?.user || null;
              if (!token)
                throw new Error("Invalid server response: token missing");

              // Persist token, role, user, and tenant context
              try {
                localStorage.setItem("token", token);
              } catch {}
              try {
                localStorage.setItem("userRole", "tenant_admin");
              } catch {}
              try {
                localStorage.setItem("tenantId", tenantId);
              } catch {}
              if (admin) {
                try {
                  localStorage.setItem("user", JSON.stringify(admin));
                } catch {}
              }
              try {
                client.setToken(token);
              } catch {}

              // Close modal, toast, and redirect to tenant admin dashboard
              close();
              try {
                await ensureNotifications();
              } catch {}
              setTimeout(() => {
                if (window.TANotification) {
                  window.TANotification.success(
                    "Welcome back! Redirecting to dashboard...",
                    { title: "Login successful", duration: 2200 }
                  );
                }
                setTimeout(() => {
                  window.location.href =
                    "/dashboards/tenant.admin/dashboard.html";
                }, 500);
              }, 200);
              return; // stop here for tenant admin
            } catch (err) {
              console.error("Tenant admin login failed", err);
              let msg;
              if (
                err &&
                (err.message === "timeout" || err.name === "AbortError")
              ) {
                msg =
                  "Connection timeout. Please check your internet connection and try again.";
              } else if (err && err.status === 401) {
                msg = "Invalid email or password";
              } else if (err && err.status === 0) {
                msg =
                  "Unable to connect to server. Please check your connection.";
              } else {
                msg =
                  (err && (err.data?.error?.message || err.data?.message)) ||
                  "Login failed. Please try again.";
              }
              // show field-level error on password
              const errField = passEl || emailEl || orgEl;
              if (errField) {
                errField.classList.add("error");
                const el = qs(
                  `.error-message[data-for="${errField.id}"]`,
                  form
                );
                if (el) {
                  el.textContent = msg;
                  el.style.display = "block";
                }
                try {
                  errField.focus();
                } catch {}
              }
              try {
                await ensureNotifications();
                if (window.TANotification) {
                  window.TANotification.error(msg, {
                    title: "Login failed",
                    duration: 4000,
                  });
                }
              } catch {}
            } finally {
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = origText || "Login";
              }
            }
            return; // do not fall through
          }

          // Tenant User placeholder (unchanged)
          if (form.id === "tenantUserForm") {
            close();
          }
        });
      }
    );
    function clearForms(root) {
      // Reset all forms
      qsa("form", root).forEach((f) => {
        try {
          f.reset();
        } catch {}
      });
      // Clear error messages
      qsa(".error-message", root).forEach((el) => (el.textContent = ""));
      // Remove error classes
      qsa("input, select, textarea", root).forEach(
        (el) => el.classList && el.classList.remove("error")
      );
    }
  }

  // Fetch tenant names via public endpoint and populate selects
  async function populateTenantSelects(root) {
    const adminSel = qs("#login_adminOrganization", root);
    const userSel = qs("#login_userOrganization", root);
    if (!adminSel && !userSel) return;

    const client = await getApiClient();
    let items = [];
    let usedFallback = false;
    try {
      if (
        client?.general &&
        typeof client.general.tenantsMinimal === "function"
      ) {
        const res = await client.general.tenantsMinimal();
        items = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
      } else {
        usedFallback = true;
        const r = await fetch("/api/v1/tenants/minimal", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        items = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [];
      }
    } catch (err) {
      console.error("Error fetching tenant minimal data", err);
      items = [];
    }

    const options = items.map((it) => ({
      value: it.id || it,
      label: it.name || it,
    }));

    const applyOptions = (selectEl) => {
      if (!selectEl) return;
      // Preserve first placeholder option
      const first = selectEl.querySelector("option");
      selectEl.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select Organization";
      selectEl.appendChild(placeholder);
      for (const { value, label } of options) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        selectEl.appendChild(opt);
      }
    };

    applyOptions(adminSel);
    applyOptions(userSel);
  }

  // expose
  window.openLoginModal = open;
})();
