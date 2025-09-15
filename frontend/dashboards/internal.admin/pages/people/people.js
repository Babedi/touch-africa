// People page script: Using unified table management system
(function () {
  const totalEl = document.getElementById("people-total");
  const maleEl = document.getElementById("people-male");
  const femaleEl = document.getElementById("people-female");
  const otherEl = document.getElementById("people-other-gender");
  const tbody = document.getElementById("people-tbody");
  const table = tbody?.closest("table");
  const searchInput = document.querySelector(".search-input");
  const clearBtn = document.querySelector(".btn-clear");
  const pageSizeSelect = document.getElementById("people-page-size");
  const pageInfo = document.getElementById("people-page-info");
  const btnFirst = document.getElementById("people-first");
  const btnPrev = document.getElementById("people-prev");
  const btnNext = document.getElementById("people-next");
  const btnLast = document.getElementById("people-last");

  // Search fields for unified table filtering
  const searchFields = [
    "personalInfo.firstName",
    "firstName",
    "personalInfo.lastName",
    "surname",
    "lastName",
    "personalInfo.fullName",
    "contactInfo.email",
    "contact.email",
    "email",
    "idNumber",
    "personalInfo.idNumber",
    "gender",
    "personalInfo.gender",
    "demographics.gender",
  ];

  // Backend allowed sort fields
  const allowedSort = [
    "firstName",
    "surname",
    "lastName",
    "email",
    "idNumber",
    "gender",
    "audit.createdAt",
    "createdAt",
  ];

  // Create table manager instance
  let tableManager;
  let currentData = [];

  function setValue(el, value) {
    if (!el) return;
    if (typeof value === "number") {
      el.textContent = value.toLocaleString();
    } else if (typeof value === "string" && value) {
      el.textContent = value;
    } else {
      el.textContent = "—";
    }
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
      baseUrl,
      token,
      timeout: 10000,
    });

    return window.apiClientInstance;
  }

  async function loadStats() {
    try {
      const api = await getApi();
      // Prefer the dedicated method if available
      let stats;
      stats = await api.persons.stats();

      // Handle both wrapped and raw success responses
      const payload = stats?.data ?? stats;
      if (!payload || typeof payload !== "object") {
        throw Object.assign(new Error("Invalid stats payload"), {
          code: 0,
          data: stats,
        });
      }
      const g = payload?.gender || {};
      const male = Number(g.male) || 0;
      const female = Number(g.female) || 0;
      const computedTotalFromGender = Object.values(g).reduce(
        (sum, v) => sum + (Number(v) || 0),
        0
      );
      const total = Number(payload?.total) || computedTotalFromGender;
      const other = Math.max(0, total - male - female);

      setValue(totalEl, total);
      setValue(maleEl, male);
      setValue(femaleEl, female);
      setValue(otherEl, other);
    } catch (err) {
      const status = (err && (err.status || err.code)) || 0;
      const isAuth = status === 401 || status === 403;
      const isTimeout =
        err && (err.message === "timeout" || err.name === "AbortError");
      const isConnectionError = status === 0;

      let logMessage, displayMessage;
      if (isTimeout) {
        logMessage = "timeout";
        displayMessage = "Timeout";
      } else if (isConnectionError) {
        logMessage = "connection failed";
        displayMessage = "Offline";
      } else if (isAuth) {
        logMessage = status;
        displayMessage = "Unauthorized";
      } else {
        logMessage = status;
        displayMessage = "Error";
      }

      console.error(
        "Failed to load people stats:",
        logMessage,
        err?.data || err
      );
      setValue(totalEl, displayMessage);
      setValue(maleEl, "—");
      setValue(femaleEl, "—");
      setValue(otherEl, "—");

      // Optional: surface a small toast/message for UX (no-op if not present)
      if (window?.showToast) {
        window.showToast(
          isAuth
            ? "Please sign in again to view people stats."
            : "Could not load people stats."
        );
      }
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

  // Generate initials from a person's name
  function generateInitials(firstName, lastName) {
    const first = (firstName || "").trim();
    const last = (lastName || "").trim();

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
      tbody.innerHTML = '<tr><td colspan="7">No people found</td></tr>';
      return;
    }

    const rows = items.map((p) => {
      // Support both flat and nested person shapes
      const first = p.personalInfo?.firstName || p.firstName || "";
      const last = p.personalInfo?.lastName || p.surname || p.lastName || "";
      const full =
        p.personalInfo?.fullName || [first, last].filter(Boolean).join(" ");
      const email = p.contactInfo?.email || p.contact?.email || p.email || "";
      const idNum = p.idNumber || p.personalInfo?.idNumber || "";
      const gender =
        p.gender || p.personalInfo?.gender || p.demographics?.gender || "";
      const created =
        p.audit?.createdAt || p.createdAt || p.personalInfo?.createdAt || "";
      const id = p.id || p.personalInfo?.id || "";
      const initials = generateInitials(first, last);

      return `<tr data-id="${id}">
        <td class="avatar-col">
          <div class="avatar-circle">${initials}</div>
        </td>
        <td>${full || "—"}</td>
        <td>${email || "—"}</td>
        <td>${idNum || "—"}</td>
        <td>${gender || "—"}</td>
        <td>${formatDate(created)}</td>
        <td class="no-wrap actions-col">
          <div class="actions-group">
            <button class="btn btn-link btn-view" data-action="view" data-id="${id}">View</button>
            <span class="sep">|</span>
            <button class="btn btn-link btn-edit" data-action="edit" data-id="${id}">Edit</button>
          </div>
        </td>
      </tr>`;
    });
    tbody.innerHTML = rows.join("");

    // Wire action buttons
    tbody.querySelectorAll("button[data-action]").forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", async (e) => {
        const action = btn.getAttribute("data-action");
        const pid = btn.getAttribute("data-id");
        if (action === "view") {
          try {
            if (!window.openPersonViewModal) {
              const scriptPath =
                "/frontend/dashboards/internal.admin/modals/person.view.modal/person.view.modal.js" +
                (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
              await import(scriptPath);
            }
            if (typeof window.openPersonViewModal === "function")
              return window.openPersonViewModal(pid);
          } catch (e) {
            console.error("Failed to open Person View modal", e);
          }
          console.info("View person:", pid);
          if (window.TANotification)
            window.TANotification.info("View not implemented yet");
        } else if (action === "edit") {
          try {
            if (!window.openPersonEditModal) {
              const scriptPath =
                "/frontend/dashboards/internal.admin/modals/person.edit.modal/person.edit.modal.js" +
                (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
              await import(scriptPath);
            }
            if (typeof window.openPersonEditModal === "function")
              return window.openPersonEditModal(pid);
          } catch (e) {
            console.error("Failed to open Person Edit modal", e);
          }
          console.info("Edit person:", pid);
          if (window.TANotification)
            window.TANotification.info("Edit not implemented yet");
        }
      });
    });
  }

  function updatePager(meta) {
    if (!pageInfo) return;
    const { page, pages, total, limit } = meta || state;
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

  async function loadPeople({
    page = tableManager?.state.page || 1,
    limit = tableManager?.state.limit || 20,
    q = tableManager?.state.q || "",
    sortBy = tableManager?.state.sortBy || null,
    order = tableManager?.state.order || "asc",
  } = {}) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';

    try {
      const api = await getApi();
      const params = { page, limit };
      if (q) params.q = q;
      if (sortBy) params.sortBy = sortBy;
      if (order) params.order = order;

      console.info("[People] Loading with params:", params);

      const res = q
        ? await api.persons.search(params)
        : await api.persons.list(params);

      // Extract data and pagination
      const envelope = res && typeof res === "object" ? res : { data: res };
      const items = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(res)
        ? res
        : [];
      const pagination = envelope.pagination || null;

      console.info(
        "[People] Loaded",
        items.length,
        "items",
        pagination ? `page ${pagination.page}/${pagination.pages}` : ""
      );

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
      const status = err?.status || 0;
      const isTimeout =
        err && (err.message === "timeout" || err.name === "AbortError");
      const isConnectionError = status === 0;

      let displayMessage;
      if (isTimeout) {
        displayMessage = "Connection timeout - please refresh to try again";
      } else if (isConnectionError) {
        displayMessage = "Unable to connect to server";
      } else if (status === 401 || status === 403) {
        displayMessage = "Unauthorized";
      } else {
        displayMessage = "Error loading people";
      }

      console.error("Failed to load people:", status, err?.data || err);

      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">
        ${displayMessage}
        ${
          isTimeout || isConnectionError
            ? "<br><small>Please check your connection and try again</small>"
            : ""
        }
      </td></tr>`;
    }
  }

  // Initialize unified table manager
  function initializeTableManager() {
    if (!window.UnifiedTable) {
      console.warn("UnifiedTable not available, will retry...");
      return null;
    }

    return window.UnifiedTable.createManager({
      data: currentData,
      searchFields: searchFields,
      storageKey: "people-table-sort",
      onDataUpdate: function (data, meta) {
        renderRows(data);
        updatePagination(meta);
      },
      onSort: function (field, order) {
        // For backend-supported fields, reload from server
        if (allowedSort.includes(field)) {
          loadPeople({
            page: 1,
            sortBy: field,
            order: order,
          });
        }
      },
      onSearch: function (query) {
        // Always reload from server for search
        loadPeople({
          page: 1,
          q: query,
        });
      },
    });
  }

  // Update pagination UI
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

  // expose a reload hook used by modals to refresh list after create
  window.reloadPeopleList = function reloadPeopleList() {
    try {
      loadStats();
      loadPeople({ page: 1 });
    } catch (e) {
      console.warn("reloadPeopleList failed", e);
    }
  };

  // After DOMContentLoaded wiring, attach New Person button handler
  function wireNewPersonButton() {
    const btn = document.getElementById("btn-new-person");
    if (!btn || btn.dataset._wired) return;
    btn.dataset._wired = "1";
    btn.addEventListener("click", async () => {
      try {
        const scriptPath =
          "/frontend/dashboards/internal.admin/modals/person.create.modal/person.create.modal.js" +
          (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
        await import(scriptPath);
        if (window.openPersonCreateModal) window.openPersonCreateModal();
      } catch (e) {
        console.error("Failed to open Person Create modal", e);
        if (window.TANotification) {
          window.TANotification.error("Could not open modal", {
            title: "Error",
          });
        }
      }
    });
  }

  function initializePage() {
    loadStats();

    // Initialize table manager with retry mechanism
    function tryInitializeTable(attempts = 0) {
      tableManager = initializeTableManager();

      if (!tableManager && attempts < 5) {
        console.log(
          `[People] Retrying table initialization... (attempt ${attempts + 1})`
        );
        setTimeout(() => tryInitializeTable(attempts + 1), 100);
        return;
      }

      if (!tableManager) {
        console.error(
          "[People] Failed to initialize table manager after retries"
        );
        // Continue without UnifiedTable - basic functionality will still work
      }

      // Setup unified table functionality
      if (window.UnifiedTable && table) {
        // Setup search with unified table system
        window.UnifiedTable.setupSearch(searchInput, function (query) {
          loadPeople({ page: 1, q: query });
        });

        // Setup sorting with unified table system
        window.UnifiedTable.setupSorting(
          table,
          function (field, direction) {
            loadPeople({ page: 1, sortBy: field, order: direction });
          },
          {
            field: tableManager?.state.sortBy || null,
            order: tableManager?.state.order || "asc",
          }
        );
      }
    }

    tryInitializeTable();

    // Setup pagination controls
    if (btnFirst) {
      btnFirst.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(1);
        else loadPeople({ page: 1 });
      });
    }
    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(tableManager.state.page - 1);
        else
          loadPeople({
            page: Math.max(1, (tableManager?.state.page || 1) - 1),
          });
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(tableManager.state.page + 1);
        else loadPeople({ page: (tableManager?.state.page || 1) + 1 });
      });
    }
    if (btnLast) {
      btnLast.addEventListener("click", () => {
        if (tableManager) tableManager.goToPage(tableManager.state.pages);
        else loadPeople({ page: tableManager?.state.pages || 1 });
      });
    }

    // Setup page size selector
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener("change", () => {
        const newLimit = Number(pageSizeSelect.value) || 20;
        if (tableManager) {
          tableManager.setPageSize(newLimit);
        }
        loadPeople({ page: 1, limit: newLimit });
      });
    }

    // Setup clear button
    if (clearBtn && searchInput) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        if (tableManager) {
          tableManager.search("");
        } else {
          loadPeople({ page: 1, q: "" });
        }
      });
    }

    wireNewPersonButton();

    // Initial load
    const initLimit = pageSizeSelect ? Number(pageSizeSelect.value) || 20 : 20;
    loadPeople({ page: 1, limit: initLimit });
  }

  // Initialize when DOM is ready
  // Wait for dependencies to load before initializing
  function waitForDependencies(callback, maxAttempts = 10, attempt = 0) {
    if (window.UnifiedTable) {
      callback();
    } else if (attempt < maxAttempts) {
      console.log(
        `[People] Waiting for dependencies... (attempt ${attempt + 1})`
      );
      setTimeout(
        () => waitForDependencies(callback, maxAttempts, attempt + 1),
        50
      );
    } else {
      console.warn(
        "[People] Dependencies not loaded, initializing without UnifiedTable"
      );
      callback();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () =>
      waitForDependencies(initializePage)
    );
  } else {
    waitForDependencies(initializePage);
  }
})();
