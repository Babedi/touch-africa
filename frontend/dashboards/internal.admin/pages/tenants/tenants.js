// Tenants page: Using unified table management system
(function () {
  const totalEl = document.getElementById("tenants-total");
  const activeEl = document.getElementById("tenants-active");
  const inactiveEl = document.getElementById("tenants-inactive");
  const tbody = document.getElementById("tenants-tbody");
  const table = tbody?.closest("table");
  const searchInput = document.querySelector(".search-input");
  const clearBtn = document.querySelector(".btn-clear");
  const pageSizeSelect = document.getElementById("tenants-page-size");
  const pageInfo = document.getElementById("tenants-page-info");
  const btnFirst = document.getElementById("tenants-first");
  const btnPrev = document.getElementById("tenants-prev");
  const btnNext = document.getElementById("tenants-next");
  const btnLast = document.getElementById("tenants-last");

  // Search fields for unified table filtering
  const searchFields = [
    "name",
    "title",
    "slug",
    "contact.email",
    "contactEmail",
    "email",
    "contact.phoneNumber",
    "contactPhone",
    "phone",
  ];

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
    // Use TouchAfricaApiClient for consistency with other pages/modals
    if (window.apiClientInstance) return window.apiClientInstance;

    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      "?v=internal20250911"; // Force cache invalidation for internal endpoints
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    let token = (localStorage.getItem("token") || "").trim() || null;

    // Debug: Set a test token if none exists
    if (!token) {
      console.log("[TENANTS DEBUG] No token found, setting test token");
      token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLXRlc3QiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwidHlwZSI6ImludGVybmFsX2FkbWluIiwicm9sZSI6ImludGVybmFsLmFkbWluIiwicGVybWlzc2lvbnMiOlsiYWRtaW4ucmVhZCIsImFkbWluLnVwZGF0ZSIsInRlbmFudC5yZWFkIiwidGVuYW50LndyaXRlIiwicGVyc29uLnJlYWQiLCJwZXJzb24ud3JpdGUiLCJyb2xlLnJlYWQiXSwiaWF0IjoxNzU3NTg0MTg4LCJleHAiOjE3NTc1ODc3ODh9.pfh-uOce6ZsHW3_4XziaSspEoom5GfFcXQZNg_IZHyE";
      localStorage.setItem("token", token);
    }

    console.log(
      "[TENANTS DEBUG] API setup - baseUrl:",
      baseUrl,
      "token length:",
      token?.length
    );

    window.apiClientInstance = new TouchAfricaApiClient({ baseUrl, token });
    return window.apiClientInstance;
  }

  async function loadStats() {
    try {
      const api = await getApi();
      const res = await api.tenants.stats();
      const data = res?.data ?? res;

      const total = Number(data?.total ?? data?.count ?? 0) || 0;
      const active = Number(data?.status?.active ?? data?.active ?? 0) || 0;
      // Inactive must be derived as Total - Active
      const inactive = Math.max(0, total - active);

      setValue(totalEl, total);
      setValue(activeEl, active);
      setValue(inactiveEl, inactive);
    } catch (err) {
      console.error("[Tenants] stats error", err);
      setValue(
        totalEl,
        err?.status === 401 || err?.status === 403 ? "Unauthorized" : "Error"
      );
      setValue(activeEl, "—");
      setValue(inactiveEl, "—");
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleDateString();
    } catch (_) {
      return String(iso);
    }
  }

  function renderRows(items) {
    if (!tbody) return;
    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No tenants found</td></tr>';
      return;
    }
    tbody.innerHTML = items
      .map((t) => {
        const name = t.name || t.title || t.slug || "—";
        // Extract email and phone from structured contact object
        const email = t.contact?.email || t.contactEmail || t.email || "—";
        const phone =
          t.contact?.phoneNumber || t.contactPhone || t.phone || "—";
        const status =
          t.account?.isActive?.value === false ||
          t.isActive === false ||
          t.status === "inactive"
            ? "Inactive"
            : "Active";
        const badge = status === "Active" ? "badge-success" : "badge-secondary";
        const created =
          t.audit?.createdAt || t.created?.when || t.createdAt || "";
        const tenantId = t.id || t._id || "";
        return `<tr>
        <td>${name}</td>
        <td>${email}</td>
        <td>${phone}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td>${formatDate(created)}</td>
        <td class="no-wrap actions-col">
          <div class="actions-group">
            <button class="btn btn-link btn-view" data-action="view" data-id="${tenantId}">View</button>
            <span class="sep">|</span>
            <button class="btn btn-link btn-edit" data-action="edit" data-id="${tenantId}">Edit</button>
          </div>
        </td>
      </tr>`;
      })
      .join("");
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
      storageKey: "tenants-table-sort",
      onDataUpdate: function (data, meta) {
        renderRows(data);
        updatePagination(meta);
      },
      onSearch: function (query) {
        loadTenants({ page: 1, q: query });
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

  async function loadTenants({
    page = tableManager?.state.page || 1,
    limit = tableManager?.state.limit || 20,
    q = tableManager?.state.q || "",
    sortBy = tableManager?.state.sortBy || null,
    order = tableManager?.state.order || "asc",
  } = {}) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';

    console.log("[TENANTS DEBUG] loadTenants called with:", {
      page,
      limit,
      q,
      sortBy,
      order,
    });

    try {
      const api = await getApi();
      console.log("[TENANTS DEBUG] API client ready, making request...");

      // Define allowed sort fields for security
      const allowedSort = ["name", "email", "phone", "status", "createdAt"];
      const validSortBy =
        sortBy && allowedSort.includes(sortBy) ? sortBy : null;

      // Build request parameters
      const params = { page, limit };
      if (q) params.q = q;
      if (validSortBy) {
        params.sortBy = validSortBy;
        params.order = order || "asc";
      }

      const res = q
        ? await api.tenants.search(params)
        : await api.tenants.list(params);

      console.log("[TENANTS DEBUG] API response:", res);

      // Extract data and pagination
      const envelope = res && typeof res === "object" ? res : { data: res };
      const items = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(res)
        ? res
        : [];
      const pagination = envelope.pagination || null;

      console.log("[TENANTS DEBUG] Parsed data:", {
        items: items.length,
        pagination: pagination,
      });

      // Update current data for the table manager
      currentData = items;

      // If we have backend pagination, render directly and update UI
      if (pagination) {
        renderRows(items);
        updatePagination({
          page: Number(pagination.page) || page,
          pages: Number(pagination.pages) || 1,
          total: Number(pagination.total) || items.length,
          limit: Number(pagination.limit) || limit,
          hasNext: pagination.page < pagination.pages,
          hasPrev: pagination.page > 1,
        });
      } else {
        // No backend pagination - let table manager handle everything
        if (tableManager) {
          tableManager.setData(items);
        } else {
          renderRows(items);
          updatePagination({
            page: 1,
            pages: 1,
            total: items.length,
            limit: items.length,
            hasNext: false,
            hasPrev: false,
          });
        }
      }
    } catch (err) {
      console.error("[Tenants] list error", err?.status, err?.data || err);
      const errorMessage =
        err?.status === 401 || err?.status === 403
          ? "Unauthorized"
          : "Error loading tenants";
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">${errorMessage}</td></tr>`;
    }
  }

  function setupTableFeatures() {
    // Setup unified table functionality
    if (window.UnifiedTable && table) {
      // Setup search with unified table system
      window.UnifiedTable.setupSearch(searchInput, function (query) {
        loadTenants({ page: 1, q: query });
      });

      // Setup sorting if table has sortable headers
      const sortableHeaders = table.querySelectorAll("thead th[data-sort]");
      if (sortableHeaders.length > 0) {
        window.UnifiedTable.setupSorting(
          table,
          function (field, direction) {
            loadTenants({ page: 1, sortBy: field, order: direction });
          },
          {
            field: tableManager?.state.sortBy || null,
            order: tableManager?.state.order || "asc",
          }
        );
      }
    } else {
      console.warn("[TENANTS] UnifiedTable not available yet");
    }
  }

  function initializePage() {
    console.log("[TENANTS DEBUG] Initializing tenants page...");

    loadStats();

    // Initialize table manager
    tableManager = initializeTableManager();

    // Setup table features with a small delay to ensure UnifiedTable is loaded
    setTimeout(() => {
      setupTableFeatures();
    }, 100);

    // Setup pagination controls
    if (btnFirst) {
      btnFirst.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(1);
        else loadTenants({ page: 1 });
      });
    }
    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(tableManager.state.page - 1);
        else
          loadTenants({
            page: Math.max(1, (tableManager?.state.page || 1) - 1),
          });
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(tableManager.state.page + 1);
        else loadTenants({ page: (tableManager?.state.page || 1) + 1 });
      });
    }
    if (btnLast) {
      btnLast.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(tableManager.state.pages);
        else loadTenants({ page: tableManager?.state.pages || 1 });
      });
    }

    // Setup page size selector
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", () => {
        const newLimit = Number(pageSizeSelect.value) || 20;
        if (tableManager) {
          tableManager.setPageSize(newLimit);
        }
        loadTenants({ page: 1, limit: newLimit });
      });
    }

    // Setup clear button
    if (clearBtn && searchInput) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        if (tableManager) {
          tableManager.search("");
        } else {
          loadTenants({ page: 1, q: "" });
        }
      });
    }

    wireNewTenantButton();

    // Initial load
    const initLimit = pageSizeSelect ? Number(pageSizeSelect.value) || 20 : 20;
    loadTenants({ page: 1, limit: initLimit });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePage);
  } else {
    initializePage();
  }

  // Action button event listeners
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (!id) {
        console.warn("No tenant ID found for action:", action);
        return;
      }

      switch (action) {
        case "view":
          (async () => {
            try {
              const scriptPath =
                "/frontend/dashboards/internal.admin/modals/tenant.view.modal/tenant.view.modal.js" +
                (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
              await import(scriptPath);
              if (window.openTenantViewModal) window.openTenantViewModal(id);
            } catch (e) {
              console.error("Failed to open Tenant View modal", e);
              if (window.TANotification) {
                window.TANotification.error("Could not open modal", {
                  title: "Error",
                });
              }
            }
          })();
          break;
        case "edit":
          (async () => {
            try {
              const scriptPath =
                "/frontend/dashboards/internal.admin/modals/tenant.edit.modal/tenant.edit.modal.js" +
                (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
              await import(scriptPath);
              if (window.openTenantEditModal) window.openTenantEditModal(id);
            } catch (e) {
              console.error("Failed to open Tenant Edit modal", e);
              if (window.TANotification) {
                window.TANotification.error("Could not open modal", {
                  title: "Error",
                });
              }
            }
          })();
          break;
        default:
          console.warn("Unknown action:", action);
      }
    });
  }

  // Expose reload hook for modal
  window.reloadTenantsList = function reloadTenantsList() {
    try {
      loadStats();
      loadTenants({ page: 1, limit: state.limit, q: state.q });
    } catch (e) {
      console.warn("reloadTenantsList failed", e);
    }
  };

  function wireNewTenantButton() {
    // Assume last '+ New Tenant' button or specific id if added
    let btn = document.getElementById("btn-new-tenant");
    if (!btn) {
      const candidates = Array.from(
        document.querySelectorAll(".table-actions .btn.btn-primary")
      ).filter((b) => /new tenant/i.test(b.textContent));
      btn = candidates[candidates.length - 1];
    }
    if (!btn || btn.dataset._wired) return;
    btn.dataset._wired = "1";
    btn.addEventListener("click", async () => {
      try {
        const scriptPath =
          "/frontend/dashboards/internal.admin/modals/tenant.create.modal/tenant.create.modal.js" +
          (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
        await import(scriptPath);
        if (window.openTenantCreateModal) window.openTenantCreateModal();
      } catch (e) {
        console.error("Failed to open Tenant Create modal", e);
        if (window.TANotification) {
          window.TANotification.error("Could not open modal", {
            title: "Error",
          });
        }
      }
    });
  }

  function wireTenantPersonButton() {
    // Identify "+ Tenant Person" button (case-insensitive contains)
    let btn = Array.from(
      document.querySelectorAll(".table-actions .btn.btn-primary")
    ).find((b) => /tenant\s*person/i.test(b.textContent));
    if (!btn || btn.dataset._wiredPerson) return;
    btn.dataset._wiredPerson = "1";
    btn.id = btn.id || "btn-tenant-person";
    btn.addEventListener("click", async () => {
      try {
        const scriptPath =
          "/frontend/dashboards/internal.admin/modals/tenant/person.create.modal/person.create.modal.js" +
          (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
        await import(scriptPath);
        if (window.openTenantPersonCreateModal)
          window.openTenantPersonCreateModal();
      } catch (e) {
        console.error("Failed to open Tenant Person Create modal", e);
        if (window.TANotification) {
          window.TANotification.error("Could not open modal", {
            title: "Error",
          });
        }
      }
    });
  }

  function wireTenantRootAdminButton() {
    // Identify "+ tenant root admin" button (case-insensitive contains)
    let btn = Array.from(
      document.querySelectorAll(".table-actions .btn.btn-primary")
    ).find((b) => /tenant\s*root\s*admin/i.test(b.textContent));
    if (!btn || btn.dataset._wiredRootAdmin) return;
    btn.dataset._wiredRootAdmin = "1";
    btn.id = btn.id || "btn-tenant-root-admin";
    btn.addEventListener("click", async () => {
      try {
        const scriptPath =
          "/frontend/dashboards/tenant.admin/modals/admin.create.modal/admin.create.modal.js" +
          (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
        await import(scriptPath);
        if (window.openTenantAdminCreateModal)
          window.openTenantAdminCreateModal();
      } catch (e) {
        console.error("Failed to open Tenant Root Admin Create modal", e);
        if (window.TANotification) {
          window.TANotification.error("Could not open modal", {
            title: "Error",
          });
        }
      }
    });
  }

  function wireTenantRoleButton() {
    // Identify "+ New Role" button
    let btn = document.getElementById("btn-tenant-role");
    if (!btn) {
      btn = Array.from(
        document.querySelectorAll(".table-actions .btn.btn-primary")
      ).find((b) => /new\s*role/i.test(b.textContent));
    }
    if (!btn || btn.dataset._wiredRole) return;
    btn.dataset._wiredRole = "1";
    btn.addEventListener("click", async () => {
      try {
        const scriptPath =
          "/frontend/dashboards/tenant.admin/modals/role.create.modal/role.create.modal.js" +
          (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
        await import(scriptPath);
        if (window.openTenantRoleCreateModal)
          window.openTenantRoleCreateModal();
      } catch (e) {
        console.error("Failed to open Tenant Role Create modal", e);
        if (window.TANotification) {
          window.TANotification.error("Could not open modal", {
            title: "Error",
          });
        }
      }
    });
  }

  // Initial wiring for new buttons
  wireTenantPersonButton();
  wireTenantRootAdminButton();
  wireTenantRoleButton();
  // If dynamic content loads later, allow a slight delay rewire
  setTimeout(() => {
    wireTenantPersonButton();
    wireTenantRootAdminButton();
    wireTenantRoleButton();
  }, 1000);
})();
