(function () {
  const containerId = "roleViewModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/role.view.modal/role.view.modal.html";
  let apiInstance = null;
  function qs(s, r = document) {
    return r.querySelector(s);
  }
  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "modal-overlay modal-lg modal-role-view";
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
        console.error("[RoleView] load html failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Role</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Failed to load role view.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="close">Close</button></div></div></div></div>';
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
  function renderPermissions(container, permissions) {
    const list = qs("#view_rolePermissions", container);
    const counter = qs("#view_permissionsCounter", container);
    if (!list) return;

    const permsArray = Array.isArray(permissions) ? permissions : [];
    if (permsArray.length === 0) {
      list.innerHTML =
        '<span class="text-muted">No permissions assigned</span>';
    } else {
      list.innerHTML = permsArray
        .slice(0, 100)
        .map((perm) => {
          const name = perm.name || perm.permission || perm.code || perm;
          return `<span class="permission-tag">${escapeHtml(name)}</span>`;
        })
        .join(" ");
    }

    if (counter) {
      counter.textContent = `${permsArray.length} permission${
        permsArray.length !== 1 ? "s" : ""
      }`;
    }
  }
  function fill(container, role) {
    // Set record ID in header
    const recordIdEl = qs("#roleView_recordIdDisplay", container);
    if (recordIdEl) {
      // Use comprehensive ID resolution to match table logic
      const roleId =
        role.id || role.roleId || role._id || role.code || role.roleCode || "—";
      recordIdEl.textContent = sanitizeText(roleId);
    }

    // Fill form controls with readonly data
    const roleNameEl = qs("#view_roleName", container);
    if (roleNameEl) {
      roleNameEl.value = sanitizeText(role.roleName || role.name);
    }

    const roleCodeEl = qs("#view_roleCode", container);
    if (roleCodeEl) {
      roleCodeEl.value = sanitizeText(role.roleCode || role.code);
    }

    const descriptionEl = qs("#view_description", container);
    if (descriptionEl) {
      descriptionEl.value = sanitizeText(role.description);
    }

    const activeEl = qs("#view_isActive", container);
    if (activeEl) {
      activeEl.value = role.isActive ?? true ? "Active" : "Inactive";
    }

    // Render permissions
    renderPermissions(container, role.permissions);
  }
  async function open(id) {
    const container = await ensureContainer();
    container.classList.add("show");
    try {
      console.log("[RoleView] Fetching role with ID:", id);
      const api = await getApi();

      // Use the TouchAfricaApiClient roles.get method
      const role = await api.roles.get(id);
      const roleData = role?.data ?? role;

      console.log("[RoleView] Fetched role data:", roleData);
      fill(container, roleData || {});
    } catch (e) {
      console.error("[RoleView] fetch failed", e);
      // Show error in modal instead of failing silently
      const descriptionEl = qs("#view_description", container);
      if (descriptionEl) {
        descriptionEl.value = `Failed to load role: ${
          e.message || "Unknown error"
        }`;
      }
    }
  }
  function close() {
    const c = qs("#" + containerId);
    if (!c) return;
    c.classList.remove("show");
  }
  window.openRoleViewModal = open;
})();
