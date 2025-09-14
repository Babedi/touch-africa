// Tenants page: load stats and list using TouchAfricaApiClient (external tenants module)
(function () {
  const totalEl = document.getElementById("tenants-total");
  const activeEl = document.getElementById("tenants-active");
  const inactiveEl = document.getElementById("tenants-inactive");
  const tbody = document.getElementById("tenants-tbody");
  const searchInput = document.querySelector(".search-input");
  const clearBtn = document.querySelector(".btn-clear");
  const pageSizeSelect = document.getElementById("tenants-page-size");
  const pageInfo = document.getElementById("tenants-page-info");
  const btnFirst = document.getElementById("tenants-first");
  const btnPrev = document.getElementById("tenants-prev");
  const btnNext = document.getElementById("tenants-next");
  const btnLast = document.getElementById("tenants-last");

  const state = { page: 1, limit: 20, q: "", pages: 1, total: 0 };

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

  async function loadTenants({
    page = state.page,
    limit = state.limit,
    q = state.q,
    clientSortField = null,
    clientSortDir = "asc",
  } = {}) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Loading…</td></tr>';

    console.log("[TENANTS DEBUG] loadTenants called with:", { page, limit, q });

    try {
      const api = await getApi();
      console.log("[TENANTS DEBUG] API client ready, making request...");

      const res = q
        ? await api.tenants.search({ page, limit, q })
        : await api.tenants.list({ page, limit });

      console.log("[TENANTS DEBUG] API response:", res);

      // Use the same pattern as people.js - preserve the response envelope
      const envelope = res && typeof res === "object" ? res : { data: res };
      const items = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(res)
        ? res
        : [];
      const pagination = envelope.pagination || null;

      console.log("[TENANTS DEBUG] Parsed data:", {
        envelope: !!envelope,
        items: items.length,
        pagination: pagination,
        rawResponse: res,
        envelopeKeys: Object.keys(envelope || {}),
        responseType: typeof res,
        hasData: !!envelope.data,
        hasPagination: !!envelope.pagination,
      });

      if (pagination) {
        state.page = Number(pagination.page) || page || 1;
        state.limit = Number(pagination.limit) || limit || 20;
        state.pages = Number(pagination.pages) || 1;
        state.total = Number(pagination.total) || items.length || 0;
        console.log("[TENANTS DEBUG] Updated state from pagination:", state);
      } else {
        state.page = page || 1;
        state.limit = limit || 20;
        state.pages = 1;
        state.total = items.length || 0;
        console.log(
          "[TENANTS DEBUG] No pagination data, using defaults:",
          state
        );
      }
      let rows = items;
      if (clientSortField && window.CoreUtils && CoreUtils.table) {
        rows = CoreUtils.table.sort(rows, clientSortField, clientSortDir);
      }
      renderRows(rows);
      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    } catch (err) {
      console.error("[Tenants] list error", err?.status, err?.data || err);
      tbody.innerHTML = `<tr><td colspan="6">${
        err?.status === 401 || err?.status === 403
          ? "Unauthorized"
          : "Error loading tenants"
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
    console.log("[TENANTS DEBUG] Initializing tenants page...");

    const initLimit = pageSizeSelect ? Number(pageSizeSelect.value) || 20 : 20;
    state.limit = initLimit;

    // Bind event handlers after DOM is ready
    if (searchInput) {
      let t;
      searchInput.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const q = searchInput.value.trim();
          state.q = q;
          loadTenants({ page: 1, limit: state.limit, q });
        }, 300);
      });
      console.log("[TENANTS DEBUG] Search input event handler attached");
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener("click", () => {
        console.log("[TENANTS DEBUG] Clear button clicked");
        searchInput.value = "";
        state.q = "";
        loadTenants({ page: 1, limit: state.limit });
      });
      console.log("[TENANTS DEBUG] Clear button event handler attached");
    } else {
      console.log("[TENANTS DEBUG] Clear button or search input not found", {
        clearBtn: !!clearBtn,
        searchInput: !!searchInput,
      });
    }

    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", () => {
        const newLimit = Number(pageSizeSelect.value) || 20;
        state.limit = newLimit;
        loadTenants({ page: 1, limit: newLimit, q: state.q });
      });
      console.log("[TENANTS DEBUG] Page size select event handler attached");
    }

    if (btnFirst) {
      btnFirst.addEventListener("click", () => {
        if (state.page > 1)
          loadTenants({ page: 1, limit: state.limit, q: state.q });
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        if (state.page > 1)
          loadTenants({ page: state.page - 1, limit: state.limit, q: state.q });
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (state.page < state.pages)
          loadTenants({ page: state.page + 1, limit: state.limit, q: state.q });
      });
    }

    if (btnLast) {
      btnLast.addEventListener("click", () => {
        if (state.page < state.pages)
          loadTenants({ page: state.pages, limit: state.limit, q: state.q });
      });
    }

    console.log(
      "[TENANTS DEBUG] All event handlers attached, loading initial data..."
    );
    loadStats();
    loadTenants({ page: 1, limit: initLimit, q: state.q || "" });
    wireNewTenantButton();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

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
