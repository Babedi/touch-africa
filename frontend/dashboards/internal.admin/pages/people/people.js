// People page script: fetch stats from internal persons API via TouchAfricaApiClient and update cards
(function () {
  const totalEl = document.getElementById("people-total");
  const maleEl = document.getElementById("people-male");
  const femaleEl = document.getElementById("people-female");
  const otherEl = document.getElementById("people-other-gender");
  const tbody = document.getElementById("people-tbody");
  const searchInput = document.querySelector(".search-input");
  const clearBtn = document.querySelector(".btn-clear");
  const pageSizeSelect = document.getElementById("people-page-size");
  const pageInfo = document.getElementById("people-page-info");
  const btnFirst = document.getElementById("people-first");
  const btnPrev = document.getElementById("people-prev");
  const btnNext = document.getElementById("people-next");
  const btnLast = document.getElementById("people-last");

  const state = {
    page: 1,
    limit: 20,
    q: "",
    pages: 1,
    total: 0,
    sortBy: null, // e.g., "audit.createdAt" or "firstName"
    order: "asc", // "asc" | "desc"
  };

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
      let res;
      const params = { page, limit };
      if (q) params.q = q;
      if (sortBy) params.sortBy = sortBy;
      if (order) params.order = order;

      console.info("[People] Loading with params:", params);

      res = q
        ? await api.persons.search(params)
        : await api.persons.list(params);
      // Preserve the response envelope so we can read pagination metadata
      const envelope = res && typeof res === "object" ? res : { data: res };
      const items = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(res)
        ? res
        : [];
      const pagination = envelope.pagination || null;
      console.info(
        "[People] Loaded",
        Array.isArray(items) ? items.length : 0,
        "items",
        pagination ? `page ${pagination.page}/${pagination.pages}` : ""
      );
      console.info("[People] Sort params sent:", { sortBy, order });
      console.info(
        "[People] Backend sort applied:",
        pagination && sortBy && allowedSort.includes(sortBy)
      );

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
      let rows = items;

      // Apply client-side sorting if:
      // 1. Backend sort was requested but failed, OR
      // 2. The requested sort field is not in allowedSort list, OR
      // 3. No backend sort was applied but we have a sort preference
      const backendSortApplied =
        pagination && sortBy && allowedSort.includes(sortBy);
      const needsClientSort =
        sortBy &&
        order &&
        (!backendSortApplied || !allowedSort.includes(sortBy));

      if (needsClientSort && window.CoreUtils && CoreUtils.table) {
        console.info("[People] Applying client-side sort:", sortBy, order);
        rows = sortTableClientSide(rows, sortBy, order);
      } else if ((!sortBy || !order) && window.CoreUtils && CoreUtils.table) {
        // Pick a deterministic column (full name) if present for stable display
        rows = CoreUtils.table.sort(
          rows.map((p) => ({
            ...p,
            _fullName:
              p.personalInfo?.fullName ||
              [
                p.personalInfo?.firstName || p.firstName || "",
                p.personalInfo?.lastName || p.surname || p.lastName || "",
              ]
                .filter(Boolean)
                .join(" "),
          })),
          "_fullName",
          "asc"
        );
      }

      renderRows(rows);
      updateSortHeaderIndicators();
      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    } catch (err) {
      const status = err?.status || 0;
      const isTimeout =
        err && (err.message === "timeout" || err.name === "AbortError");
      const isConnectionError = status === 0;

      let logMessage, displayMessage;
      if (isTimeout) {
        logMessage = "timeout";
        displayMessage = "Connection timeout - please refresh to try again";
      } else if (isConnectionError) {
        logMessage = "connection failed";
        displayMessage = "Unable to connect to server";
      } else if (status === 401 || status === 403) {
        logMessage = status;
        displayMessage = "Unauthorized";
      } else {
        logMessage = status;
        displayMessage = "Error loading people";
      }

      console.error("Failed to load people:", logMessage, err?.data || err);

      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">
        ${displayMessage}
        ${
          isTimeout || isConnectionError
            ? "<br><small>Please check your connection and try again</small>"
            : ""
        }
      </td></tr>`;

      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    }
  }

  // Comprehensive list of allowed sort fields that match actual backend data structure
  const allowedSort = [
    // Flat structure fields that actually exist in the data
    "firstName",
    "surname",
    "gender",
    "idNumber",
    "audit.createdAt",
    "createdAt",
    "contact.email",
    "contact.mobile",
    "addresses.residential.city",
    "addresses.residential.province",
    // Legacy nested structure fields (may not exist but kept for backwards compatibility)
    "personalInfo.firstName",
    "personalInfo.lastName",
    "personalInfo.fullName",
    "personalInfo.gender",
    "contactInfo.email",
    "contactInfo.mobile",
    "address.city",
    "address.province",
    // Additional flat fields
    "lastName",
    "email",
  ];

  // Client-side sorting fallback for unsupported backend fields
  function sortTableClientSide(data, sortField, order = "asc") {
    if (!Array.isArray(data) || !sortField) return data;

    return [...data].sort((a, b) => {
      let aVal, bVal;

      // Extract values based on sort field, supporting nested paths
      const getNestedValue = (obj, path) => {
        return path.split(".").reduce((o, p) => o?.[p], obj);
      };

      // Handle different field mappings based on actual data structure
      switch (sortField) {
        case "firstName":
        case "firstName,surname":
          // For name sorting, combine firstName and surname from flat structure
          aVal = [
            getNestedValue(a, "firstName") || "",
            getNestedValue(a, "surname") || "",
          ]
            .filter(Boolean)
            .join(" ");
          bVal = [
            getNestedValue(b, "firstName") || "",
            getNestedValue(b, "surname") || "",
          ]
            .filter(Boolean)
            .join(" ");
          break;
        case "email":
          // Backend sorts by "email" field, but data structure contains contact.email
          // Try both paths for robustness
          aVal =
            getNestedValue(a, "email") ||
            getNestedValue(a, "contact.email") ||
            "";
          bVal =
            getNestedValue(b, "email") ||
            getNestedValue(b, "contact.email") ||
            "";
          break;
        case "gender":
          aVal = getNestedValue(a, "gender") || "";
          bVal = getNestedValue(b, "gender") || "";
          break;
        case "idNumber":
          aVal = getNestedValue(a, "idNumber") || "";
          bVal = getNestedValue(b, "idNumber") || "";
          break;
        case "audit.createdAt":
        case "createdAt":
          aVal =
            getNestedValue(a, "audit.createdAt") ||
            getNestedValue(a, "createdAt") ||
            "";
          bVal =
            getNestedValue(b, "audit.createdAt") ||
            getNestedValue(b, "createdAt") ||
            "";
          break;
        default:
          aVal = getNestedValue(a, sortField) || "";
          bVal = getNestedValue(b, sortField) || "";
      }

      // Handle different data types
      if (aVal === "" && bVal === "") return 0;
      if (aVal === "") return 1;
      if (bVal === "") return -1;

      // Date handling
      if (sortField.includes("createdAt") || sortField.includes("Date")) {
        const dateA = new Date(aVal);
        const dateB = new Date(bVal);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
      }

      // Numeric handling
      const numA = parseFloat(aVal);
      const numB = parseFloat(bVal);
      if (!isNaN(numA) && !isNaN(numB)) {
        return order === "asc" ? numA - numB : numB - numA;
      }

      // String comparison (case-insensitive)
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (order === "asc") {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });
  }

  // Sorting: map header clicks to sortBy/order and reload
  function getSortableHeaders() {
    const table = tbody?.closest("table");
    if (!table) return [];
    return Array.from(table.querySelectorAll("thead th[data-sort]"));
  }

  function normalizeSortField(th) {
    if (!th) return null;
    const raw = (th.getAttribute("data-sort") || "").trim();
    if (!raw) return null;
    // data-sort may contain multiple candidates, pick the first allowed one
    const candidates = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Find the first candidate that's actually supported by the backend
    for (const candidate of candidates) {
      if (allowedSort.includes(candidate)) {
        return candidate;
      }
    }

    // Fallback to first candidate if none are in allowedSort (for client-side sorting)
    return candidates[0] || null;
  }

  function updateSortHeaderIndicators() {
    const headers = getSortableHeaders();
    headers.forEach((th) => {
      const field = normalizeSortField(th);
      const isActive = field && state.sortBy === field;
      th.setAttribute("aria-sort", isActive ? state.order || "asc" : "none");
      // Optional: small arrow indicator
      const label = th.textContent.replace(/[\s▲▼]+$/, "");
      if (isActive) {
        th.textContent = `${label} ${state.order === "desc" ? "▼" : "▲"}`;
      } else {
        th.textContent = label;
      }
    });
  }

  function wireSorting() {
    const headers = getSortableHeaders();
    if (headers.length === 0) return;
    headers.forEach((th) => {
      if (th.dataset._wired) return;
      th.dataset._wired = "1";
      const activate = () => {
        const field = normalizeSortField(th);
        if (!field) return;
        if (state.sortBy === field) {
          // toggle order
          state.order = state.order === "asc" ? "desc" : "asc";
        } else {
          state.sortBy = field;
          state.order = field.toLowerCase().includes("createdat")
            ? "desc"
            : "asc";
        }

        // Try backend sorting first, fall back to client-side if field not supported
        loadPeople({
          page: 1,
          limit: state.limit,
          q: state.q,
          sortBy: state.sortBy,
          order: state.order,
        });
      };
      th.addEventListener("click", activate);
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  // expose a reload hook used by modals to refresh list after create
  window.reloadPeopleList = function reloadPeopleList() {
    try {
      loadStats();
      loadPeople({ page: 1, limit: state.limit, q: state.q });
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

  // kick off after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadStats();
      const initLimit = pageSizeSelect
        ? Number(pageSizeSelect.value) || 20
        : 20;
      state.limit = initLimit;
      wireSorting();
      loadPeople({ page: 1, limit: initLimit });
      wireNewPersonButton();
    });
  } else {
    loadStats();
    const initLimit = pageSizeSelect ? Number(pageSizeSelect.value) || 20 : 20;
    state.limit = initLimit;
    wireSorting();
    loadPeople({ page: 1, limit: initLimit });
    wireNewPersonButton();
  }

  // Basic search wiring
  if (searchInput) {
    let t;
    searchInput.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const q = searchInput.value.trim();
        state.q = q;
        loadPeople({ page: 1, limit: state.limit, q });
      }, 300);
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.q = "";
      loadPeople({ page: 1, limit: state.limit });
    });
  }

  // Page size change
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      const newLimit = Number(pageSizeSelect.value) || 20;
      state.limit = newLimit;
      loadPeople({ page: 1, limit: newLimit, q: state.q });
    });
  }

  // Pager buttons
  if (btnFirst)
    btnFirst.addEventListener("click", () => {
      if (state.page > 1)
        loadPeople({ page: 1, limit: state.limit, q: state.q });
    });
  if (btnPrev)
    btnPrev.addEventListener("click", () => {
      if (state.page > 1)
        loadPeople({ page: state.page - 1, limit: state.limit, q: state.q });
    });
  if (btnNext)
    btnNext.addEventListener("click", () => {
      if (state.page < state.pages)
        loadPeople({ page: state.page + 1, limit: state.limit, q: state.q });
    });
  if (btnLast)
    btnLast.addEventListener("click", () => {
      if (state.page < state.pages)
        loadPeople({ page: state.pages, limit: state.limit, q: state.q });
    });
})();
