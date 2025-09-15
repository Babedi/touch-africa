// Roles page: Using unified table management system
(function () {
  const totalEl = document.getElementById("roles-total");
  const standardEl = document.getElementById("roles-standard");
  const customEl = document.getElementById("roles-custom");
  const tbody = document.getElementById("roles-tbody");
  const table = tbody?.closest("table");
  const searchInput = document.querySelector(".page-roles .search-input");
  const clearBtn = document.querySelector(".page-roles .btn-clear");
  const pageSizeSelect = document.getElementById("roles-page-size");
  const pageInfo = document.getElementById("roles-page-info");
  const btnFirst = document.getElementById("roles-first");
  const btnPrev = document.getElementById("roles-prev");
  const btnNext = document.getElementById("roles-next");
  const btnLast = document.getElementById("roles-last");

  // Search fields for unified table filtering
  const searchFields = ["name", "description", "module"];

  // State object for table management
  const state = {
    page: 1,
    limit: 20,
    q: "",
    pages: 1,
    total: 0,
    sortBy: null,
    order: "asc",
  };

  const SORT_STORAGE_KEY = "roles.sortSpec";

  function restoreSortSpec() {
    try {
      const raw = localStorage.getItem(SORT_STORAGE_KEY);
      if (!raw) return;
      const spec = JSON.parse(raw);
      if (spec && spec.primary) {
        state.sortBy = spec.primary;
        state.order = spec.order || "asc";
      }
    } catch (_) {}
  }

  // Table manager instance
  let tableManager;
  let currentData = [];

  function setValue(el, value) {
    if (!el) return;
    if (typeof value === "number") el.textContent = value.toLocaleString();
    else if (typeof value === "string" && value) el.textContent = value;
    else el.textContent = "—";
  }

  async function getApi() {
    // Use TouchAfricaApiClient for consistency with modals
    if (window.apiClientInstance) return window.apiClientInstance;

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
    });

    return window.apiClientInstance;
  }

  async function loadStats() {
    try {
      const api = await getApi();
      const res = await api.roles.stats();
      const data = res?.data ?? res;
      const total = data?.total ?? data?.count ?? 0;
      const standard = data?.byType?.standard ?? null;
      const custom = data?.byType?.custom ?? null;
      setValue(totalEl, total);
      setValue(standardEl, standard);
      setValue(customEl, custom);
    } catch (err) {
      console.error("[Roles] stats error", err);
      try {
        // Fallback: derive total from list() pagination
        const api = await getApi();
        const listRes = await api.roles.list({ page: 1, limit: 1 });
        const env = listRes?.data ?? listRes;
        const total =
          env?.pagination?.total ?? (Array.isArray(env) ? env.length : 0);
        setValue(totalEl, total);
        setValue(standardEl, "—");
        setValue(customEl, "—");
      } catch (e2) {
        console.error("[Roles] stats fallback also failed", e2);
        setValue(
          totalEl,
          err?.status === 401 || err?.status === 403 ? "Unauthorized" : "Error"
        );
        setValue(standardEl, "—");
        setValue(customEl, "—");
      }
    }
  }

  const rolePermCache = {};
  async function fetchRolePermissions(roleId) {
    if (rolePermCache[roleId]) return rolePermCache[roleId];
    try {
      const api = await getApi();
      const r = await api.roles.get(roleId);
      const env = r?.data ?? r;
      const perms = env.permissions || [];
      rolePermCache[roleId] = perms;
      return perms;
    } catch (e) {
      console.warn("perm fetch failed", e);
      return [];
    }
  }
  function closePermPopover() {
    const ex = document.getElementById("perm-popover");
    if (ex) ex.remove();
    document.removeEventListener("keydown", escHandler);
    document.removeEventListener("click", bodyClickHandler, true);
  }
  function escHandler(e) {
    if (e.key === "Escape") closePermPopover();
  }
  function bodyClickHandler(e) {
    const pop = document.getElementById("perm-popover");
    if (!pop) return;
    if (pop.contains(e.target)) return;
    if (e.target.closest(".perm-btn")) return;
    closePermPopover();
  }
  async function showPermPopover(roleId, anchor) {
    closePermPopover();
    const perms = await fetchRolePermissions(roleId);
    const div = document.createElement("div");
    div.id = "perm-popover";
    div.className = "popover small";
    const list = Array.isArray(perms) ? perms : [];
    let content = "";
    if (!list.length) content = '<div class="text-muted">No permissions</div>';
    else {
      const names = list
        .map((p) => p.name || p.permission || p.code || p)
        .filter(Boolean);
      const shown = names.slice(0, 15);
      const more = names.length - shown.length;
      content =
        '<ul class="unstyled perm-list">' +
        shown.map((n) => `<li>${n}</li>`).join("") +
        "</ul>" +
        (more > 0 ? `<div class="more text-muted">+${more} more</div>` : "");
    }
    div.innerHTML = `<div class="popover-inner"><div class="popover-header">Permissions <button class="btn-close-pop" aria-label="Close">×</button></div><div class="popover-body">${content}</div></div>`;
    document.body.appendChild(div);
    const rect = anchor.getBoundingClientRect();
    const top = window.scrollY + rect.bottom + 4;
    const left = Math.min(
      window.scrollX + rect.left,
      window.scrollX + window.innerWidth - div.offsetWidth - 10
    );
    div.style.position = "absolute";
    div.style.top = top + "px";
    div.style.left = left + "px";
    div
      .querySelector(".btn-close-pop")
      ?.addEventListener("click", closePermPopover);
    setTimeout(() => {
      document.addEventListener("keydown", escHandler);
      document.addEventListener("click", bodyClickHandler, true);
    }, 0);
  }

  function renderRows(items) {
    if (!tbody) return;
    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No roles found</td></tr>';
      currentData = [];
      return;
    }

    // Store current data for table manager
    currentData = items;
    tbody.innerHTML = items
      .map((r) => {
        const name = r.roleName || r.name || r.roleCode || r.displayName || "—";
        const desc = r.description || "";
        // Module column removed
        const perms = Array.isArray(r.permissions)
          ? r.permissions.length
          : r.permissionCount ?? "—";
        const isActive =
          r.isActive ?? r.active ?? (r.status ? r.status === "active" : true);
        const status = isActive ? "Active" : "Disabled";
        const badge = status === "Active" ? "badge-success" : "badge-secondary";
        const id = r.roleId || r.id || r.code || name;
        const typeLabel = r.isSystem ? "Standard" : "Custom";
        const typeBadge = r.isSystem ? "badge-info" : "badge-dark";

        // Determine editability: only non-system roles (no isSystem flag) are editable
        const isSystemRole = !!r.isSystem || id === "INTERNAL_ROOT_ADMIN";
        return `<tr data-id="${id}" data-system="${isSystemRole ? "1" : "0"}">
          <td>${name}</td>
          <td class="text-wrap">${desc || "—"}</td>
          <td><span class="badge ${typeBadge}">${typeLabel}</span></td>
          <td><button type="button" class="btn btn-link perm-btn" data-action="perms" data-id="${id}" aria-label="View permissions for ${name}">${perms}</button></td>
          <td><span class="badge ${badge}">${status}</span></td>
          <td class="no-wrap actions-col">
            <div class="actions-group">
              <button class="btn btn-link btn-view" data-action="view" data-id="${id}">View</button>
      ${isSystemRole ? "" : '<span class="sep">|</span>'}
      ${
        isSystemRole
          ? ""
          : `<button class=\"btn btn-link btn-edit\" data-action=\"edit\" data-id=\"${id}\">Edit</button>`
      }
            </div>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("button[data-action]").forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", async (e) => {
        const action = btn.getAttribute("data-action");
        const rid = btn.getAttribute("data-id");
        if (action === "view") {
          try {
            if (!window.openRoleViewModal)
              await import(
                "/frontend/dashboards/internal.admin/modals/role.view.modal/role.view.modal.js"
              );
            window.openRoleViewModal(rid);
          } catch (err) {
            console.error("Open view modal failed", err);
            window.TANotification?.error("Failed to open view");
          }
        } else if (action === "edit") {
          try {
            if (!window.openRoleEditModal)
              await import(
                "/frontend/dashboards/internal.admin/modals/role.edit.modal/role.edit.modal.js"
              );
            window.openRoleEditModal(rid);
          } catch (err) {
            console.error("Open edit modal failed", err);
            window.TANotification?.error("Failed to open edit");
          }
        } else if (action === "perms") {
          showPermPopover(rid, btn);
        }
      });
    });
  }

  function updatePager(meta) {
    const { page, pages, total, limit } = meta || state;
    if (pageInfo)
      pageInfo.textContent = `Page ${page} of ${pages} • ${total} total`;
    if (btnFirst) btnFirst.disabled = page <= 1;
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= pages;
    if (btnLast) btnLast.disabled = page >= pages;
    if (pageSizeSelect) {
      const val = String(limit || state.limit);
      if (pageSizeSelect.value !== val) pageSizeSelect.value = val;
    }
  }

  // Initialize unified table manager
  function initializeTableManager() {
    if (!window.UnifiedTable) {
      console.error("UnifiedTable not available");
      return null;
    }

    return window.UnifiedTable.createManager({
      data: currentData,
      searchFields: searchFields,
      storageKey: "roles-table-sort",
      onDataUpdate: function (data, meta) {
        renderRows(data);
        updatePagination(meta);
      },
      onSearch: function (query) {
        loadRoles({ page: 1, q: query });
      },
    });
  }

  // Update pagination UI using unified table system
  function updatePagination(meta) {
    if (!pageInfo) return;
    const { page, pages, total, limit } = meta;

    pageInfo.textContent = `Page ${page} of ${pages} • ${total.toLocaleString()} total`;

    if (btnFirst) btnFirst.disabled = page <= 1;
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= pages;
    if (btnLast) btnLast.disabled = page >= pages;

    if (pageSizeSelect) {
      const val = String(limit);
      if (pageSizeSelect.value !== val) {
        pageSizeSelect.value = val;
      }
    }
  }

  // Initialize unified table features
  function setupTableFeatures() {
    tableManager = initializeTableManager();
    if (!tableManager) return;

    // Setup search using UnifiedTable directly
    if (
      searchInput &&
      window.UnifiedTable &&
      typeof window.UnifiedTable.setupSearch === "function"
    ) {
      window.UnifiedTable.setupSearch(searchInput, function (query) {
        tableManager.search(query);
      });
    }

    // Setup sorting using UnifiedTable directly
    if (
      window.UnifiedTable &&
      typeof window.UnifiedTable.setupSorting === "function"
    ) {
      const table = tbody?.closest("table");
      if (table) {
        window.UnifiedTable.setupSorting(
          table,
          function (field, order) {
            loadRoles({ page: 1, sortBy: field, order: order });
          },
          { field: state.sortBy, order: state.order }
        );
      }
    }
  }

  async function loadRoles({
    page = state.page,
    limit = state.limit,
    q = state.q,
    sortBy = state.sortBy,
    order = state.order,
  } = {}) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';
    try {
      const api = await getApi();

      // Update state with current parameters
      state.page = page;
      state.limit = limit;
      state.q = q;
      state.sortBy = sortBy;
      state.order = order;

      // Use current single sort state
      // sortBy and order are already set from state.sortBy and state.order

      // Allowlist & fallback
      const allowedSort = [
        "createdAt",
        "roleName",
        "roleCode",
        "description",
        "permissions",
        "isSystem",
        "isActive",
        "name", // backend fallback
        "id", // backend fallback
      ];
      if (sortBy && !allowedSort.includes(sortBy)) {
        console.warn(
          "[Roles] unsupported sort field sent by UI, falling back:",
          sortBy
        );
        sortBy = "createdAt";
        order = "desc";
      }

      const buildParams = (omitSort = false) => {
        const p = { page, limit };
        if (q) {
          p.search = q; // primary param currently used in codebase
          p.q = q; // compatibility with endpoints expecting 'q'
        }
        if (!omitSort) {
          if (sortBy) p.sortBy = sortBy; // backend expects 'sortBy'
          if (order) p.order = order;
        }
        return p;
      };

      let envelope;
      try {
        const res = await api.roles.list(buildParams(false));
        envelope = res?.data ?? res;
      } catch (err) {
        if (err?.status === 400 && (sortBy || order)) {
          console.warn("[Roles] 400 with sort, retrying without sort");
          // Clear problematic sort from localStorage to prevent repeat issues
          try {
            localStorage.removeItem(SORT_STORAGE_KEY);
            state.sortBy = null;
            state.order = "asc";
          } catch {}
          const res2 = await api.roles.list(buildParams(true));
          envelope = res2?.data ?? res2;
        } else throw err;
      }

      // Defensive unwrap: handle legacy shape { data: { data: [...], pagination } }
      let itemsCandidate = envelope;
      if (Array.isArray(envelope?.data)) {
        itemsCandidate = envelope.data;
      } else if (envelope?.data && Array.isArray(envelope.data.data)) {
        itemsCandidate = envelope.data.data; // double-wrapped
      }
      const items = Array.isArray(itemsCandidate) ? itemsCandidate : [];
      const pagination = envelope?.pagination || null;
      if (pagination) {
        state.page = Number(pagination.page) || page || 1;
        state.limit = Number(pagination.limit) || limit || 20;
        state.pages = Number(pagination.pages) || 1;
        state.total = Number(pagination.total) || items.length || 0;
      } else {
        state.page = page || 1;
        state.limit = limit || 20;
        state.pages = 1;
        state.total = items.length || 0;
      }
      renderRows(items);
      if (tableManager) {
        tableManager.setData(items);
      }
      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    } catch (err) {
      console.error("[Roles] list error", err?.status, err?.data || err);
      const errorDetails =
        err?.data?.message || err?.message || "Unknown error";
      const statusText = err?.status ? ` (${err.status})` : "";
      tbody.innerHTML = `<tr><td colspan="6">${
        err?.status === 401 || err?.status === 403
          ? "Unauthorized"
          : `Error loading roles${statusText}: ${errorDetails}`
      }</td></tr>`;
      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    }
  }

  function init() {
    const initLimit = pageSizeSelect ? Number(pageSizeSelect.value) || 20 : 20;
    state.limit = initLimit;
    restoreSortSpec();
    loadStats();

    // Setup table features with a small delay to ensure UnifiedTable is loaded
    setTimeout(() => {
      setupTableFeatures();
    }, 100);

    loadRoles({
      page: 1,
      limit: initLimit,
      sortBy: state.sortBy,
      order: state.order,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (searchInput) {
    let t;
    searchInput.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = searchInput.value.trim();
        state.q = q;
        loadRoles({ page: 1, limit: state.limit, q });
      }, 300);
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.q = "";
      loadRoles({ page: 1, limit: state.limit });
    });
  }

  if (pageSizeSelect)
    pageSizeSelect.addEventListener("change", () => {
      const newLimit = Number(pageSizeSelect.value) || 20;
      state.limit = newLimit;
      loadRoles({ page: 1, limit: newLimit, q: state.q });
    });

  if (btnFirst)
    btnFirst.addEventListener("click", () => {
      if (state.page > 1)
        loadRoles({ page: 1, limit: state.limit, q: state.q });
    });
  if (btnPrev)
    btnPrev.addEventListener("click", () => {
      if (state.page > 1)
        loadRoles({ page: state.page - 1, limit: state.limit, q: state.q });
    });
  if (btnNext)
    btnNext.addEventListener("click", () => {
      if (state.page < state.pages)
        loadRoles({ page: state.page + 1, limit: state.limit, q: state.q });
    });
  if (btnLast)
    btnLast.addEventListener("click", () => {
      if (state.page < state.pages)
        loadRoles({ page: state.pages, limit: state.limit, q: state.q });
    });

  // Expose reload for modals
  window.reloadRolesList = function () {
    loadRoles({
      page: state.page,
      limit: state.limit,
      q: state.q,
      sortBy: state.sortBy,
      order: state.order,
    });
    loadStats();
  };

  // New Role button (align with people create modal pattern)
  const newBtn = document.querySelector(".page-roles .btn-new-role");
  if (newBtn && !newBtn.dataset._wired) {
    newBtn.dataset._wired = "1";
    newBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        if (!window.openRoleCreateModal) {
          await import(
            "/frontend/dashboards/internal.admin/modals/role.create.modal/role.create.modal.js"
          );
        }
        window.openRoleCreateModal();
      } catch (err) {
        console.error("[Roles] open create failed", err);
        window.TANotification?.error("Failed to open create");
      }
    });
  }
})();
