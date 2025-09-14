(function () {
  const containerId = "adminViewModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/admin.view.modal/admin.view.modal.html";
  let apiInstance = null;

  function qs(s, r = document) {
    return r.querySelector(s);
  }

  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "modal-overlay modal-lg modal-admin-view";
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
        console.error("[AdminView] load html failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Admin</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Failed to load admin view.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="close">Close</button></div></div></div></div>';
      }
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
      baseUrl: baseUrl,
      token: token,
      timeout: 10000,
    });
    apiInstance = window.apiClientInstance;
    return apiInstance;
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    const btn = qs('[data-action="close"]', root);
    if (btn) btn.addEventListener("click", close);
  }

  function sanitizeText(v) {
    return (v ?? "").toString().trim() || "—";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return sanitizeText(dateStr);
    }
  }

  function renderRoles(container, roles) {
    const rolesDisplay = qs("#view_roles", container);
    if (!rolesDisplay) return;

    const rolesArray = Array.isArray(roles) ? roles : [];
    if (rolesArray.length === 0) {
      rolesDisplay.innerHTML =
        '<span class="text-muted">No roles assigned</span>';
    } else {
      rolesDisplay.innerHTML = rolesArray
        .slice(0, 50)
        .map((role) => {
          const name = role.name || role.roleName || role.code || role;
          return `<span class="permission-tag">${escapeHtml(name)}</span>`;
        })
        .join(" ");
    }
  }

  function fill(container, admin) {
    // Set record ID in header
    const recordIdEl = qs("#adminView_recordIdDisplay", container);
    if (recordIdEl) {
      recordIdEl.textContent = sanitizeText(admin.id || admin._id);
    }

    // Fill form controls with readonly data
    const personIdEl = qs("#view_personId", container);
    if (personIdEl) {
      personIdEl.value = sanitizeText(admin.personId);
    }

    const emailEl = qs("#view_email", container);
    if (emailEl) {
      emailEl.value = sanitizeText(admin.accessDetails?.email || admin.email);
    }

    const activeEl = qs("#view_isActive", container);
    if (activeEl) {
      const isActive = admin.account?.isActive?.value ?? admin.isActive ?? true;
      activeEl.value = isActive ? "Active" : "Inactive";
    }

    const lastLoginEl = qs("#view_lastLogin", container);
    if (lastLoginEl) {
      const lastLogin = admin.accessDetails?.lastLogin;
      if (Array.isArray(lastLogin) && lastLogin.length > 0) {
        const latest = lastLogin[lastLogin.length - 1];
        lastLoginEl.value = formatDate(
          latest.when || latest.timestamp || latest
        );
      } else {
        lastLoginEl.value = "Never";
      }
    }

    const createdEl = qs("#view_created", container);
    if (createdEl) {
      createdEl.value = formatDate(admin.created?.when || admin.createdAt);
    }

    const modifiedEl = qs("#view_modified", container);
    if (modifiedEl) {
      modifiedEl.value = formatDate(admin.updated?.when || admin.updatedAt);
    }

    // Render roles
    renderRoles(container, admin.roles);
  }

  async function open(id) {
    const container = await ensureContainer();
    container.classList.add("show");
    try {
      console.log("[AdminView] Fetching admin with ID:", id);
      const api = await getApi();

      // Use the TouchAfricaApiClient admins.get method
      const admin = await api.admins.get(id);
      const adminData = admin?.data ?? admin;

      console.log("[AdminView] Fetched admin data:", adminData);
      fill(container, adminData || {});
    } catch (e) {
      console.error("[AdminView] fetch failed", e);
      // Show error in modal instead of failing silently
      const emailEl = qs("#view_email", container);
      if (emailEl) {
        emailEl.value = `Failed to load admin: ${e.message || "Unknown error"}`;
      }
    }
  }

  function close() {
    const c = qs("#" + containerId);
    if (!c) return;
    c.classList.remove("show");
  }

  window.openAdminViewModal = open;
})();
