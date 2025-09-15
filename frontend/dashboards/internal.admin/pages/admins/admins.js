// Admins page: load stats and list of admins using TouchAfricaApiClient
(function () {
  // Unified table manager
  let tableManager = null;

  // Current data for table manager
  let currentData = [];

  // Search fields configuration
  const searchFields = [
    "email",
    "firstName",
    "lastName",
    "roles",
    "status",
    "tenantName",
  ];

  const totalEl = document.getElementById("admins-total");
  const activeEl = document.getElementById("admins-active");
  const inactiveEl = document.getElementById("admins-inactive");
  const tbody = document.getElementById("admins-tbody");
  const searchInput = document.querySelector(".page-admins .search-input");
  const clearBtn = document.querySelector(".page-admins .btn-clear");
  const pageSizeSelect = document.getElementById("admins-page-size");
  const pageInfo = document.getElementById("admins-page-info");
  const btnFirst = document.getElementById("admins-first");
  const btnPrev = document.getElementById("admins-prev");
  const btnNext = document.getElementById("admins-next");
  const btnLast = document.getElementById("admins-last");
  const btnNew = document.querySelector(
    '.page-admins [data-action="create-admin"]'
  );

  const state = {
    page: 1,
    limit: 20,
    q: "",
    pages: 1,
    total: 0,
    sortBy: null,
    order: "asc",
  };

  const SORT_STORAGE_KEY = "admins.sortSpec";

  /**
   * Convert role code to human-readable role name
   * Uses shared utility if available, otherwise uses local fallback
   */
  function formatRoleName(roles) {
    if (window.TouchAfrica?.utils?.formatRoleName) {
      return window.TouchAfrica.utils.formatRoleName(roles);
    }

    // Local fallback mapping
    const ROLE_DISPLAY_MAPPINGS = {
      // Modern role codes
      INTERNAL_ROOT_ADMIN: "Internal Root Admin",
      INTERNAL_SUPER_ADMIN: "Internal Super Admin",
      INTERNAL_STANDARD_ADMIN: "Internal Standard Admin",
      EXTERNAL_SUPER_ADMIN: "External Super Admin",
      EXTERNAL_STANDARD_ADMIN: "External Standard Admin",
      LOOKUP_MANAGER: "Lookup Manager",
      TENANT_ADMIN: "Tenant Admin",
      TENANT_USER: "Tenant User",
      SERVICE_ADMIN: "Service Admin",
      SERVICE_USER: "Service User",

      // Legacy/simple role codes
      admin: "Administrator",
      superadmin: "Super Administrator",
      "internal.admin": "Service Administrator",
      "internal.root": "Internal Root Administrator",
      "external.admin": "External Administrator",
      user: "User",
      manager: "Manager",
    };

    if (!roles) return "—";

    if (typeof roles === "string") {
      return ROLE_DISPLAY_MAPPINGS[roles] || roles;
    }

    if (Array.isArray(roles)) {
      if (roles.length === 0) return "—";

      const roleNames = roles.map(
        (role) => ROLE_DISPLAY_MAPPINGS[role] || role
      );

      if (roleNames.length > 2) {
        return `${roleNames.slice(0, 2).join(", ")}, +${
          roleNames.length - 2
        } more`;
      }
      return roleNames.join(", ");
    }

    return String(roles);
  }

  function saveSortSpec() {
    try {
      localStorage.setItem(
        SORT_STORAGE_KEY,
        JSON.stringify({
          primary: state.sortBy,
          order: state.order,
        })
      );
    } catch (_) {}
  }
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

  function setValue(el, value) {
    if (!el) return;
    if (typeof value === "number") el.textContent = value.toLocaleString();
    else if (typeof value === "string" && value) el.textContent = value;
    else el.textContent = "—";
  }

  async function getApi() {
    // Prefer unified browser client if present
    if (window.TouchAfrica && window.TouchAfrica.api) {
      return window.TouchAfrica.api;
    }

    // Fallback: dynamically import the ESM integration client
    try {
      const clientPath =
        (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
        (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");

      const mod = await import(clientPath);
      const baseUrl =
        window.API_BASE_URL ||
        (window.__API_BASE_URL__
          ? `${window.__API_BASE_URL__}/api/v1`
          : `${window.location.origin}/api/v1`);
      const token =
        (window.TouchAfrica &&
          window.TouchAfrica.api &&
          window.TouchAfrica.api.getAuthToken &&
          window.TouchAfrica.api.getAuthToken()) ||
        localStorage.getItem("authToken") ||
        null;

      const api = new mod.TouchAfricaApiClient({ baseUrl, token });
      return api;
    } catch (err) {
      // Minimal shim to avoid crashes; endpoints will throw if used
      return {
        admins: {
          stats: async () => {
            throw new Error("API client unavailable");
          },
          list: async () => {
            throw new Error("API client unavailable");
          },
          search: async () => {
            throw new Error("API client unavailable");
          },
        },
      };
    }
  }

  async function loadStats() {
    try {
      const api = await getApi();
      // Unified client: api.admins.stats(); Integration client: same path
      const res = await (api.admins?.stats
        ? api.admins.stats()
        : api.get("/internal/admins/stats"));
      const data = res?.data ?? res;

      // Backend returns stats in this format:
      // { total: number, active: number, inactive: number, pending: number, ... }
      const total = data?.total ?? data?.count ?? 0;
      const active = data?.active ?? data?.status?.active ?? null;
      const inactive =
        data?.inactive ?? data?.status?.inactive ?? data?.disabled ?? null;

      setValue(totalEl, total);
      setValue(activeEl, active);
      setValue(inactiveEl, inactive);
    } catch (err) {
      console.error("❌ Stats loading error:", err);
      setValue(
        totalEl,
        err?.status === 401 || err?.status === 403 ? "Unauthorized" : "Error"
      );
      setValue(activeEl, "—");
      setValue(inactiveEl, "—");
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) {
        if (window.__DEBUG__) {
          console.warn("[AdminTable] Invalid date format:", iso);
        }
        return String(iso);
      }
      return d.toLocaleDateString();
    } catch (e) {
      if (window.__DEBUG__) {
        console.warn("[AdminTable] Date parsing error:", e, iso);
      }
      return String(iso) || "—";
    }
  }

  // Generate initials from an admin's name
  function generateInitials(firstName, lastName, fullName) {
    let first = (firstName || "").trim();
    let last = (lastName || "").trim();

    // If we don't have firstName/lastName, try to extract from fullName
    if (!first && !last && fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        first = nameParts[0];
        last = nameParts[nameParts.length - 1];
      } else if (nameParts.length === 1) {
        first = nameParts[0];
      }
    }

    if (!first && !last) return "??";

    const firstInitial = first ? first.charAt(0).toUpperCase() : "";
    const lastInitial = last ? last.charAt(0).toUpperCase() : "";

    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial;
    } else if (firstInitial) {
      return (
        firstInitial + (first.length > 1 ? first.charAt(1).toUpperCase() : "")
      );
    } else if (lastInitial) {
      return (
        lastInitial + (last.length > 1 ? last.charAt(1).toUpperCase() : "")
      );
    }

    return "??";
  }

  function renderRows(items) {
    if (!tbody) return;
    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No admins found</td></tr>';
      currentData = [];
      return;
    }

    // Store current data for table manager
    currentData = items;
    tbody.innerHTML = items
      .map((a) => {
        const name =
          a.name ||
          a.fullName ||
          `${a.firstName || ""} ${a.lastName || a.surname || ""}`.trim();
        const email = a.email || a.contact?.email || "";
        const roleData = a.roles || (a.role ? [a.role] : null);
        const role = formatRoleName(roleData);
        const status =
          a.active === false || a.status === "disabled" ? "Disabled" : "Active";
        const badge = status === "Active" ? "badge-success" : "badge-secondary";

        // Use a.created.when strictly for created date
        const created = a.created?.when || "";

        // Debug logging for date issues
        if (window.__DEBUG__) {
          console.log("[AdminTable] Admin data structure:", {
            adminId: a.id || a.adminId,
            created: a.created,
            extractedCreated: created,
          });
        }

        const id = a.id || a.adminId || email || name || "";
        const initials = generateInitials(
          a.firstName,
          a.lastName || a.surname,
          name
        );

        return `<tr>
        <td class="avatar-col">
          <div class="avatar-circle">${initials}</div>
        </td>
        <td>${name || "—"}</td>
        <td>${email || "—"}</td>
        <td>${role}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td>${formatDate(created)}</td>
        <td class="no-wrap actions-col">
          <div class="actions-group">
            <button class="btn btn-link btn-view" data-action="view" data-id="${id}" aria-label="View ${
          name || email
        }">View</button>
            <span class="sep">|</span>
            <button class="btn btn-link btn-edit" data-action="edit" data-id="${id}" aria-label="Edit ${
          name || email
        }">Edit</button>
          </div>
        </td>
      </tr>`;
      })
      .join("");

    // Wire action clicks (view and edit)
    tbody.querySelectorAll('[data-action="view"]').forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", async (e) => {
        const adminId = e.currentTarget.getAttribute("data-id");
        try {
          if (!window.openAdminViewModal) {
            await import(
              "/frontend/dashboards/internal.admin/modals/admin.view.modal/admin.view.modal.js"
            );
          }
          if (window.openAdminViewModal) window.openAdminViewModal(adminId);
        } catch (err) {
          console.error("Open view modal failed", err);
          window.TANotification?.error("Failed to open view");
        }
      });
    });

    tbody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", async (e) => {
        const adminId = e.currentTarget.getAttribute("data-id");
        try {
          if (!window.openAdminEditModal) {
            await import(
              "/frontend/dashboards/internal.admin/modals/admin.edit.modal/admin.edit.modal.js"
            );
          }
          if (window.openAdminEditModal) window.openAdminEditModal(adminId);
        } catch (err) {
          // Error opening edit modal - could show user feedback here
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
      storageKey: "admins-table-sort",
      onDataUpdate: function (data, meta) {
        renderRows(data);
        updatePagination(meta);
      },
      onSearch: function (query) {
        loadAdmins({ page: 1, q: query });
      },
    });
  }

  // Setup table features
  function setupTableFeatures() {
    tableManager = initializeTableManager();
    if (!tableManager) {
      console.error("Failed to initialize table manager");
      return;
    }

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
            loadAdmins({ page: 1, sortBy: field, order: order });
          },
          { field: state.sortBy, order: state.order }
        );
      }
    }
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
  async function loadAdmins({
    page = state.page,
    limit = state.limit,
    q = state.q,
    sortBy = state.sortBy,
    order = state.order,
  } = {}) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';
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
      const allowedSort = [
        "personalInfo.firstName",
        "personalInfo.lastName",
        "personalInfo.email",
        "role",
        "status",
        "createdAt",
        "updatedAt",
      ];
      if (sortBy && !allowedSort.includes(sortBy)) {
        sortBy = "createdAt";
        order = "desc";
      }
      const buildParams = (omitSort = false) => {
        const p = { page, limit };
        if (q) p.search = q;
        if (!omitSort) {
          if (sortBy) p.sortBy = sortBy;
          if (order) p.order = order;
        }
        return p;
      };
      let envelope;
      try {
        let res;
        if (api.admins?.search && api.admins?.list) {
          res = q
            ? await api.admins.search(buildParams(false))
            : await api.admins.list(buildParams(false));
        } else {
          // Integration client fallback
          const params = buildParams(false);
          res = q
            ? await api.get("/internal/admins/search", { params })
            : await api.get("/internal/admins", { params });
        }
        envelope = res?.data ?? res;
      } catch (err) {
        if (err?.status === 400 && (sortBy || order)) {
          try {
            localStorage.removeItem(SORT_STORAGE_KEY);
            state.sortBy = null;
            state.order = "asc";
          } catch {}
          let res2;
          if (api.admins?.search && api.admins?.list) {
            res2 = q
              ? await api.admins.search(buildParams(true))
              : await api.admins.list(buildParams(true));
          } else {
            const params2 = buildParams(true);
            res2 = q
              ? await api.get("/internal/admins/search", { params: params2 })
              : await api.get("/internal/admins", { params: params2 });
          }
          envelope = res2?.data ?? res2;
        } else throw err;
      }
      const items = Array.isArray(envelope?.data)
        ? envelope.data
        : Array.isArray(envelope)
        ? envelope
        : [];
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
      tbody.innerHTML = `<tr><td colspan="7">${
        err?.status === 401 || err?.status === 403
          ? "Unauthorized"
          : "Error loading admins"
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

    loadAdmins({
      page: 1,
      limit: initLimit,
      sortBy: state.sortBy,
      order: state.order,
    });

    // Wire New Admin modal
    if (btnNew && !btnNew.dataset._wired) {
      btnNew.dataset._wired = "1";
      btnNew.addEventListener("click", async () => {
        try {
          if (!window.openAdminCreateModal) {
            await import(
              "/frontend/dashboards/internal.admin/modals/admin.create.modal/admin.create.modal.js"
            );
          }
          window.openAdminCreateModal && window.openAdminCreateModal();
        } catch (e) {
          // Error opening create modal - could show user feedback here
        }
      });
    }

    // Refresh table/stats after creation
    window.addEventListener("admin:created", () => {
      loadStats();
      loadAdmins({ page: 1, limit: state.limit, q: state.q });
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  if (searchInput) {
    let t;
    searchInput.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = searchInput.value.trim();
        state.q = q;
        loadAdmins({ page: 1, limit: state.limit, q });
      }, 300);
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.q = "";
      loadAdmins({ page: 1, limit: state.limit });
    });
  }

  if (pageSizeSelect)
    pageSizeSelect.addEventListener("change", () => {
      const newLimit = Number(pageSizeSelect.value) || 20;
      state.limit = newLimit;
      loadAdmins({ page: 1, limit: newLimit, q: state.q });
    });

  if (btnFirst)
    btnFirst.addEventListener("click", () => {
      if (state.page > 1)
        loadAdmins({ page: 1, limit: state.limit, q: state.q });
    });
  if (btnPrev)
    btnPrev.addEventListener("click", () => {
      if (state.page > 1)
        loadAdmins({ page: state.page - 1, limit: state.limit, q: state.q });
    });
  if (btnNext)
    btnNext.addEventListener("click", () => {
      if (state.page < state.pages)
        loadAdmins({ page: state.page + 1, limit: state.limit, q: state.q });
    });
  if (btnLast)
    btnLast.addEventListener("click", () => {
      if (state.page < state.pages)
        loadAdmins({ page: state.pages, limit: state.limit, q: state.q });
    });

  // Refresh after edit
  window.addEventListener("admin:updated", () => {
    loadStats();
    loadAdmins({ page: state.page, limit: state.limit, q: state.q });
  });
})();
