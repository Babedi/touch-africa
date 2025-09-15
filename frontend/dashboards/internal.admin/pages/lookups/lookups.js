// Lookups page: load stats and list using TouchAfricaApiClient
(function () {
  // Unified table managers
  let tableManager = null;
  let categoryTableManager = null;
  let subcategoryTableManager = null;

  // Current data for table managers
  let currentData = [];
  let currentCategoryData = [];
  let currentSubcategoryData = [];

  // Search fields configuration
  const searchFields = [
    "category",
    "subcategory",
    "value",
    "description",
    "status",
  ];
  const categorySearchFields = [
    "categoryName",
    "description",
    "colorCode",
    "status",
  ];
  const subcategorySearchFields = [
    "subcategoryName",
    "categoryName",
    "description",
    "colorCode",
    "status",
  ];

  const lookupsTotalEl = document.getElementById("lookups-total");
  const catTotalEl = document.getElementById("lookup-categories-total");
  const subCatTotalEl = document.getElementById("lookup-sub-categories-total");
  const tbody = document.getElementById("lookups-tbody");
  const searchInput = document.getElementById("lookups-search");
  const clearBtn = document.getElementById("lookups-clear");
  const pageSizeSelect = document.getElementById("lookups-page-size");
  const pageInfo = document.getElementById("lookups-page-info");
  const btnFirst = document.getElementById("lookups-first");
  const btnPrev = document.getElementById("lookups-prev");
  const btnNext = document.getElementById("lookups-next");
  const btnLast = document.getElementById("lookups-last");

  // Categories DOM
  const cat = {
    searchInput: document.getElementById("lookup-categories-search"),
    clearBtn: document.getElementById("lookup-categories-clear"),
    tbody: document.getElementById("lookup-categories-tbody"),
    pageSize: document.getElementById("lookup-categories-page-size"),
    pageInfo: document.getElementById("lookup-categories-page-info"),
    first: document.getElementById("lookup-categories-first"),
    prev: document.getElementById("lookup-categories-prev"),
    next: document.getElementById("lookup-categories-next"),
    last: document.getElementById("lookup-categories-last"),
    table: document.getElementById("lookup-categories-table"),
  };

  // Sub-Categories DOM
  const sub = {
    searchInput: document.getElementById("lookup-sub-categories-search"),
    clearBtn: document.getElementById("lookup-sub-categories-clear"),
    tbody: document.getElementById("lookup-sub-categories-tbody"),
    pageSize: document.getElementById("lookup-sub-categories-page-size"),
    pageInfo: document.getElementById("lookup-sub-categories-page-info"),
    first: document.getElementById("lookup-sub-categories-first"),
    prev: document.getElementById("lookup-sub-categories-prev"),
    next: document.getElementById("lookup-sub-categories-next"),
    last: document.getElementById("lookup-sub-categories-last"),
    table: document.getElementById("lookup-sub-categories-table"),
  };

  const state = {
    page: 1,
    limit: 20,
    q: "",
    pages: 1,
    total: 0,
    sortBy: "category",
    order: "asc",
  };

  // Color coding state
  const colorState = {
    categoryColors: new Map(),
    subcategoryColors: new Map(),
    categoryIndex: 0,
    subcategoryIndex: 0,
  };

  // Dynamic color assignment functions
  function getOrAssignCategoryColor(category) {
    if (!category || category === "—") return null;

    if (!colorState.categoryColors.has(category)) {
      const colorIndex = colorState.categoryIndex % 10;
      colorState.categoryColors.set(category, colorIndex);
      colorState.categoryIndex++;
    }

    return colorState.categoryColors.get(category);
  }

  function getOrAssignSubcategoryColor(subcategory, category) {
    if (!subcategory || subcategory === "—") return null;

    const key = `${category}|${subcategory}`;
    if (!colorState.subcategoryColors.has(key)) {
      const colorIndex = colorState.subcategoryIndex % 10;
      colorState.subcategoryColors.set(key, colorIndex);
      colorState.subcategoryIndex++;
    }

    return colorState.subcategoryColors.get(key);
  }

  function updateColorLegend() {
    const legendContainer = document.getElementById("color-legend");
    const legendItems = document.getElementById("legend-items");

    if (!legendContainer || !legendItems) return;

    const categories = Array.from(colorState.categoryColors.entries());
    const subcategories = Array.from(colorState.subcategoryColors.entries());

    if (categories.length === 0 && subcategories.length === 0) {
      legendContainer.style.display = "none";
      return;
    }

    let legendHTML = "";

    // Add category legend items
    if (categories.length > 0) {
      categories.forEach(([category, colorIndex]) => {
        legendHTML += `
          <div class="legend-item">
            <div class="legend-color category-color-${colorIndex}"></div>
            <span><strong>${category}</strong> (Category)</span>
          </div>
        `;
      });
    }

    // Add subcategory legend items
    if (subcategories.length > 0) {
      subcategories.forEach(([key, colorIndex]) => {
        const [category, subcategory] = key.split("|");
        legendHTML += `
          <div class="legend-item">
            <div class="legend-color subcategory-color-${colorIndex}"></div>
            <span>${subcategory} (Sub of ${category})</span>
          </div>
        `;
      });
    }

    legendItems.innerHTML = legendHTML;
    // Keep color legend hidden
    legendContainer.style.display = "none";
  }

  // Sort storage key for persistence
  const SORT_STORAGE_KEY = "lookups_sort_spec";
  const CAT_SORT_STORAGE_KEY = "lookup_categories_sort_spec";
  const SUB_SORT_STORAGE_KEY = "lookup_sub_categories_sort_spec";

  // Allowed sort fields for backend validation
  const allowedSort = [
    "category",
    "subCategory",
    "items",
    "description",
    "status",
  ];

  function saveSortSpec() {
    try {
      const spec = { sortBy: state.sortBy, order: state.order };
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(spec));
    } catch (e) {
      console.warn("[Lookups] Cannot save sort spec", e);
    }
  }

  function restoreSortSpec() {
    try {
      const stored = localStorage.getItem(SORT_STORAGE_KEY);
      if (stored) {
        const spec = JSON.parse(stored);
        if (spec.sortBy && allowedSort.includes(spec.sortBy)) {
          state.sortBy = spec.sortBy;
          state.order = spec.order === "desc" ? "desc" : "asc";
        }
      }
    } catch (e) {
      console.warn("[Lookups] Cannot restore sort spec", e);
    }
  }

  // Initialize unified table manager for main lookups table
  function initializeTableManager() {
    if (!window.UnifiedTable) {
      console.error("UnifiedTable not available");
      return null;
    }

    return window.UnifiedTable.createManager({
      data: currentData,
      searchFields: searchFields,
      storageKey: "lookups-table-sort",
      onDataUpdate: function (data, meta) {
        renderRows(data);
        updatePagination(meta);
      },
      onSearch: function (query) {
        loadLookups({ page: 1, q: query });
      },
    });
  }

  // Initialize unified table manager for categories table
  function initializeCategoryTableManager() {
    if (!window.UnifiedTable) {
      console.error("UnifiedTable not available");
      return null;
    }

    return window.UnifiedTable.createManager({
      data: currentCategoryData,
      searchFields: categorySearchFields,
      storageKey: "lookup-categories-table-sort",
      onDataUpdate: function (data, meta) {
        renderCategories(data);
        updateCategoryPagination(meta);
      },
      onSearch: function (query) {
        loadCategories({ page: 1, q: query });
      },
    });
  }

  // Initialize unified table manager for subcategories table
  function initializeSubcategoryTableManager() {
    if (!window.UnifiedTable) {
      console.error("UnifiedTable not available");
      return null;
    }

    return window.UnifiedTable.createManager({
      data: currentSubcategoryData,
      searchFields: subcategorySearchFields,
      storageKey: "lookup-subcategories-table-sort",
      onDataUpdate: function (data, meta) {
        renderSubCategories(data);
        updateSubcategoryPagination(meta);
      },
      onSearch: function (query) {
        loadSubcategories({ page: 1, q: query });
      },
    });
  }

  // Setup table features for main lookups table
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
            loadLookups({ page: 1, sortBy: field, order: order });
          },
          { field: state.sortBy, order: state.order }
        );
      }
    }
  }

  // Setup table features for categories table
  function setupCategoryTableFeatures() {
    categoryTableManager = initializeCategoryTableManager();
    if (!categoryTableManager) return;

    // Setup search using UnifiedTable directly
    if (
      cat.searchInput &&
      window.UnifiedTable &&
      typeof window.UnifiedTable.setupSearch === "function"
    ) {
      window.UnifiedTable.setupSearch(cat.searchInput, function (query) {
        categoryTableManager.search(query);
      });
    }

    // Setup sorting using UnifiedTable directly
    if (
      window.UnifiedTable &&
      typeof window.UnifiedTable.setupSorting === "function" &&
      cat.table
    ) {
      window.UnifiedTable.setupSorting(
        cat.table,
        function (field, order) {
          loadCategories({ page: 1, sortBy: field, order: order });
        },
        { field: catState.sortBy, order: catState.order }
      );
    }
  }

  // Setup table features for subcategories table
  function setupSubcategoryTableFeatures() {
    subcategoryTableManager = initializeSubcategoryTableManager();
    if (!subcategoryTableManager) return;

    // Setup search using UnifiedTable directly
    if (
      sub.searchInput &&
      window.UnifiedTable &&
      typeof window.UnifiedTable.setupSearch === "function"
    ) {
      window.UnifiedTable.setupSearch(sub.searchInput, function (query) {
        subcategoryTableManager.search(query);
      });
    }

    // Setup sorting using UnifiedTable directly
    if (
      window.UnifiedTable &&
      typeof window.UnifiedTable.setupSorting === "function" &&
      sub.table
    ) {
      window.UnifiedTable.setupSorting(
        sub.table,
        function (field, order) {
          loadSubCategories({ page: 1, sortBy: field, order: order });
        },
        { field: subState.sortBy, order: subState.order }
      );
    }
  }

  // Update pagination UI for main table
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

  // Update pagination UI for categories table
  function updateCategoryPagination(meta) {
    if (!cat.pageInfo) return;
    const { page, pages, total, limit } = meta;

    cat.pageInfo.textContent = `Page ${page} of ${pages} • ${total.toLocaleString()} total`;

    if (cat.first) cat.first.disabled = page <= 1;
    if (cat.prev) cat.prev.disabled = page <= 1;
    if (cat.next) cat.next.disabled = page >= pages;
    if (cat.last) cat.last.disabled = page >= pages;

    if (cat.pageSize) {
      const val = String(limit);
      if (cat.pageSize.value !== val) {
        cat.pageSize.value = val;
      }
    }
  }

  // Update pagination UI for subcategories table
  function updateSubcategoryPagination(meta) {
    if (!sub.pageInfo) return;
    const { page, pages, total, limit } = meta;

    sub.pageInfo.textContent = `Page ${page} of ${pages} • ${total.toLocaleString()} total`;

    if (sub.first) sub.first.disabled = page <= 1;
    if (sub.prev) sub.prev.disabled = page <= 1;
    if (sub.next) sub.next.disabled = page >= pages;
    if (sub.last) sub.last.disabled = page >= pages;

    if (sub.pageSize) {
      const val = String(limit);
      if (sub.pageSize.value !== val) {
        sub.pageSize.value = val;
      }
    }
  }

  function getSortableHeaders() {
    const table = document.querySelector(".page-lookups table");
    if (!table) return [];
    return Array.from(table.querySelectorAll("thead th[data-sort]"));
  }

  function getSortableHeadersIn(el) {
    if (!el) return [];
    return Array.from(el.querySelectorAll("thead th[data-sort]"));
  }

  function normalizeSortField(th) {
    const field = th?.dataset?.sort;
    return allowedSort.includes(field) ? field : null;
  }

  function updateSortHeaderIndicators() {
    const headers = getSortableHeaders();
    headers.forEach((th) => {
      const field = normalizeSortField(th);
      if (!field) return;
      const isActive = field === state.sortBy;
      const base = th.textContent.replace(/[▲▼].*$/, "").trim();
      if (isActive) {
        const arrow = state.order === "desc" ? "▼" : "▲";
        th.textContent = `${base} ${arrow}`;
        th.setAttribute("aria-sort", state.order);
      } else {
        th.textContent = base;
        th.setAttribute("aria-sort", "none");
      }
    });
  }

  function updateSortHeaderIndicatorsScoped(tableEl, sortBy, order) {
    const headers = getSortableHeadersIn(tableEl);
    headers.forEach((th) => {
      const field = th?.dataset?.sort;
      if (!field) return;
      const base = th.textContent.replace(/[▲▼].*$/, "").trim();
      if (field === sortBy) {
        const arrow = order === "desc" ? "▼" : "▲";
        th.textContent = `${base} ${arrow}`;
        th.setAttribute("aria-sort", order);
      } else {
        th.textContent = base;
        th.setAttribute("aria-sort", "none");
      }
    });
  }

  // Client-side sorting function as fallback
  function sortTableClientSide(field, order) {
    if (!tbody) return;
    if (window.CoreUtils && CoreUtils.table) {
      // Build a lightweight data model from rows
      const rows = Array.from(tbody.querySelectorAll("tr")).map((r) => ({
        _el: r,
        category: r.cells[0]?.textContent.trim() || "",
        subCategory: r.cells[1]?.textContent.trim() || "",
        items: r.cells[2]?.textContent.trim() || "",
        description: r.cells[3]?.textContent.trim() || "",
        status: r.cells[4]?.textContent.trim() || "",
      }));
      const sorted = CoreUtils.table.sort(rows, field, order).map((r) => r._el);
      tbody.innerHTML = "";
      sorted.forEach((r) => tbody.appendChild(r));
      return;
    }
    // Legacy fallback
    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.sort((a, b) => {
      let aVal, bVal;
      switch (field) {
        case "category":
          aVal = a.cells[0]?.textContent.trim() || "";
          bVal = b.cells[0]?.textContent.trim() || "";
          break;
        case "subCategory":
          aVal = a.cells[1]?.textContent.trim() || "";
          bVal = b.cells[1]?.textContent.trim() || "";
          break;
        case "items":
          // Extract number from "X item(s)" format
          const aItemsText = a.cells[2]?.textContent.trim() || "0";
          const bItemsText = b.cells[2]?.textContent.trim() || "0";
          aVal = parseInt(aItemsText.match(/(\d+)/)?.[1] || "0");
          bVal = parseInt(bItemsText.match(/(\d+)/)?.[1] || "0");
          break;
        case "description":
          aVal = a.cells[3]?.textContent.trim() || "";
          bVal = b.cells[3]?.textContent.trim() || "";
          break;
        case "status":
          aVal = a.cells[4]?.textContent.trim() || "";
          bVal = b.cells[4]?.textContent.trim() || "";
          break;
        default:
          return 0;
      }
      if (typeof aVal === "number" && typeof bVal === "number")
        return order === "asc" ? aVal - bVal : bVal - aVal;
      const cmp = aVal.localeCompare(bVal);
      return order === "asc" ? cmp : -cmp;
    });
    tbody.innerHTML = "";
    rows.forEach((r) => tbody.appendChild(r));
  }

  function wireSorting() {
    const headers = getSortableHeaders();
    headers.forEach((th) => {
      if (th.dataset._wired) return;
      th.dataset._wired = "1";
      const activate = (e) => {
        const field = normalizeSortField(th);
        if (!field) return;

        // Single column sorting only
        if (state.sortBy === field) {
          // Toggle order if same column
          state.order = state.order === "asc" ? "desc" : "asc";
        } else {
          // Set new sort column
          state.sortBy = field;
          state.order = "asc"; // Default to ascending for new columns
        }

        saveSortSpec();

        // Try backend sorting first, fallback to client-side
        loadLookups({
          page: 1,
          limit: state.limit,
          q: state.q,
          sortBy: state.sortBy,
          order: state.order,
        })
          .then(() => {
            // Check if backend sorting worked by applying client-side sorting as fallback
            setTimeout(() => {
              sortTableClientSide(state.sortBy, state.order);
              updateSortHeaderIndicators();
            }, 100);
          })
          .catch(() => {
            // If backend fails, use client-side sorting
            sortTableClientSide(state.sortBy, state.order);
            updateSortHeaderIndicators();
          });
      };
      th.addEventListener("click", activate);
      th.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(e);
        }
      });
    });
  }

  function wireSortingScoped(tableEl, getState, setState, loadFn, storageKey) {
    const headers = getSortableHeadersIn(tableEl);
    headers.forEach((th) => {
      if (th.dataset._wired) return;
      th.dataset._wired = "1";
      const activate = () => {
        const field = th?.dataset?.sort;
        if (!field) return;
        const st = getState();
        if (st.sortBy === field) st.order = st.order === "asc" ? "desc" : "asc";
        else {
          st.sortBy = field;
          st.order = "asc";
        }
        setState(st);
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ sortBy: st.sortBy, order: st.order })
          );
        } catch {}
        loadFn({
          page: 1,
          limit: st.limit,
          q: st.q,
          sortBy: st.sortBy,
          order: st.order,
        }).then(() => {
          updateSortHeaderIndicatorsScoped(tableEl, st.sortBy, st.order);
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
      const lookupsStats = await api.lookups.stats();
      const data = lookupsStats?.data ?? lookupsStats;
      // Primary total (all lookups)
      setValue(lookupsTotalEl, data?.total ?? data?.count ?? 0);

      // Pre-computed fallback counts derived from lookups stats (unique category / subCategory values)
      const fallbackCategoryCount = Array.isArray(data?.insights?.categories)
        ? data.insights.categories.length
        : null;
      const fallbackSubCategoryCount = Array.isArray(
        data?.insights?.subCategories
      )
        ? data.insights.subCategories.length
        : null;

      // Categories (preferred: dedicated stats route)
      try {
        const catRes = await api.lookupCategories.stats();
        const catData = catRes?.data ?? catRes;
        const catTotal =
          catData?.total ??
          catData?.count ??
          catData?.overview?.total ??
          fallbackCategoryCount;
        setValue(catTotalEl, catTotal != null ? catTotal : "—");
      } catch (e) {
        setValue(
          catTotalEl,
          fallbackCategoryCount != null ? fallbackCategoryCount : "—"
        );
      }

      // Sub-Categories (preferred: dedicated stats route)
      try {
        const subRes = await api.lookupSubCategories.stats();
        const subData = subRes?.data ?? subRes;
        const subTotal =
          subData?.total ??
          subData?.count ??
          subData?.overview?.total ??
          fallbackSubCategoryCount;
        setValue(subCatTotalEl, subTotal != null ? subTotal : "—");
      } catch (e) {
        setValue(
          subCatTotalEl,
          fallbackSubCategoryCount != null ? fallbackSubCategoryCount : "—"
        );
      }
    } catch (err) {
      console.error("[Lookups] stats error", err);
      setValue(
        lookupsTotalEl,
        err?.status === 401 || err?.status === 403 ? "Unauthorized" : "Error"
      );
      setValue(catTotalEl, "—");
      setValue(subCatTotalEl, "—");
    }
  }

  function renderRows(items) {
    if (!tbody) return;
    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No lookups found</td></tr>';
      currentData = [];
      updateColorLegend();
      return;
    }

    // Store current data for table manager
    currentData = items;

    tbody.innerHTML = items
      .map((lookup) => {
        // Extract fields according to lookup.validation.js schema
        const id = lookup.id || lookup._id || "—";
        const category = lookup.category || "—";
        const subCategory = lookup.subCategory || "—";

        // Get or assign colors for category and subcategory
        const categoryColorIndex = getOrAssignCategoryColor(category);
        const subcategoryColorIndex = getOrAssignSubcategoryColor(
          subCategory,
          category
        );

        // Create colored badges for category and subcategory
        const categoryDisplay =
          category === "—"
            ? "—"
            : `<span class="category-badge category-color-${categoryColorIndex}">${category}</span>`;

        const subcategoryDisplay =
          subCategory === "—"
            ? "—"
            : `<span class="subcategory-badge subcategory-color-${subcategoryColorIndex}">${subCategory}</span>`;

        // Display items count - should be array of strings per schema
        let itemsDisplay = "—";
        if (Array.isArray(lookup.items)) {
          itemsDisplay = `${lookup.items.length} item${
            lookup.items.length !== 1 ? "s" : ""
          }`;
        } else if (lookup.items) {
          itemsDisplay = "1 item";
        }

        const description = lookup.description || "—";
        const status =
          lookup.active === false || lookup.status === "disabled"
            ? "Disabled"
            : "Active";
        const badge = status === "Active" ? "badge-success" : "badge-secondary";

        return `<tr>
        <td>${categoryDisplay}</td>
        <td>${subcategoryDisplay}</td>
        <td><span class="items-count" title="${
          Array.isArray(lookup.items) ? lookup.items.join(", ") : ""
        }">${itemsDisplay}</span></td>
        <td class="text-wrap">${description}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td class="no-wrap actions-col">
          <div class="actions-group">
            <button class="btn btn-link btn-view" data-action="view" data-id="${id}">View</button>
            <span class="sep">|</span>
            <button class="btn btn-link btn-edit" data-action="edit" data-id="${id}">Edit</button>
          </div>
        </td>
      </tr>`;
      })
      .join("");

    // Update the color legend after rendering
    updateColorLegend();

    // Wire action buttons using the same pattern as people page
    tbody.querySelectorAll("button[data-action]").forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", async (e) => {
        const action = btn.getAttribute("data-action");
        const lookupId = btn.getAttribute("data-id");
        if (action === "view") {
          try {
            if (typeof window.openLookupViewModal === "function") {
              return window.openLookupViewModal(lookupId);
            }
            console.warn("openLookupViewModal not found");
          } catch (e) {
            console.error("Failed to open Lookup View modal", e);
          }
        } else if (action === "edit") {
          try {
            if (!window.openLookupEditModal) {
              // TODO: Implement lookup edit modal
              console.log("Edit lookup:", lookupId);
              if (window.TANotification) {
                window.TANotification.show(
                  "Lookup edit functionality coming soon",
                  "info"
                );
              }
              return;
            }
            if (typeof window.openLookupEditModal === "function")
              return window.openLookupEditModal(lookupId);
          } catch (e) {
            console.error("Failed to open Lookup Edit modal", e);
          }
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

  async function loadLookups({
    page = state.page,
    limit = state.limit,
    q = state.q,
    sortBy = state.sortBy,
    order = state.order,
    clientSortField = null,
    clientSortDir = "asc",
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

      // Build request parameters
      const params = { page, limit };
      if (q) params.q = q;

      // Add sorting parameters if supported by backend
      if (sortBy && allowedSort.includes(sortBy)) {
        params.sortBy = sortBy;
        params.order = order;
      }

      const res = q
        ? await api.lookups.search(params)
        : await api.lookups.list(params);

      // Preserve the response envelope so we can read pagination metadata
      const envelope = res && typeof res === "object" ? res : { data: res };
      const items = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(res)
        ? res
        : [];
      const pagination = envelope.pagination || null;
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

      // Use client-side sorting if specified (fallback mechanism)
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
      console.error("[Lookups] list error", err?.status, err?.data || err);
      tbody.innerHTML = `<tr><td colspan="6">${
        err?.status === 401 || err?.status === 403
          ? "Unauthorized"
          : "Error loading lookups"
      }</td></tr>`;
      updatePager({
        page: state.page,
        pages: state.pages,
        total: state.total,
        limit: state.limit,
      });
    }
  }

  // ---------- Categories table ----------
  const catState = {
    page: 1,
    limit: 20,
    q: "",
    pages: 1,
    total: 0,
    sortBy: "category",
    order: "asc",
  };

  function getCatState() {
    return { ...catState };
  }
  function setCatState(s) {
    Object.assign(catState, s);
  }

  function restoreCatSort() {
    try {
      const s = JSON.parse(
        localStorage.getItem(CAT_SORT_STORAGE_KEY) || "null"
      );
      if (s?.sortBy) {
        catState.sortBy = s.sortBy;
        catState.order = s.order === "desc" ? "desc" : "asc";
      }
    } catch {}
  }

  function renderCategories(rows) {
    if (!cat.tbody) return;
    if (!rows?.length) {
      cat.tbody.innerHTML = '<tr><td colspan="4">No categories found</td></tr>';
      currentCategoryData = [];
      return;
    }

    // Store current data for table manager
    currentCategoryData = rows;
    cat.tbody.innerHTML = rows
      .map((r) => {
        const id = r.id || r._id || "—";
        const name = r.category || r.name || "—";
        const desc = r.description || "—";
        const status =
          r.active === false || r.status === "disabled" ? "Disabled" : "Active";
        const badge = status === "Active" ? "badge-success" : "badge-secondary";
        return `<tr>
        <td>${name}</td>
        <td class="text-wrap">${desc}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td class="no-wrap actions-col">
          <div class="actions-group">
            <button class="btn btn-link" data-action="view" data-id="${id}" data-type="category">View</button>
            <span class="sep">|</span>
            <button class="btn btn-link" data-action="edit" data-id="${id}" data-type="category">Edit</button>
          </div>
        </td>
      </tr>`;
      })
      .join("");

    cat.tbody.querySelectorAll("button[data-action]").forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        if (action === "view") {
          window.TANotification?.info?.("Category view coming soon");
        } else if (action === "edit") {
          window.TANotification?.info?.("Category edit coming soon");
        }
      });
    });
  }

  function updateCatPager() {
    if (cat.pageInfo)
      cat.pageInfo.textContent = `Page ${catState.page} of ${catState.pages} • ${catState.total} total`;
    if (cat.first) cat.first.disabled = catState.page <= 1;
    if (cat.prev) cat.prev.disabled = catState.page <= 1;
    if (cat.next) cat.next.disabled = catState.page >= catState.pages;
    if (cat.last) cat.last.disabled = catState.page >= catState.pages;
    if (cat.pageSize) cat.pageSize.value = String(catState.limit);
  }

  async function loadCategories({
    page = catState.page,
    limit = catState.limit,
    q = catState.q,
    sortBy = catState.sortBy,
    order = catState.order,
  } = {}) {
    if (!cat.tbody) return;
    cat.tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';

    // Update catState with current parameters
    catState.page = page;
    catState.limit = limit;
    catState.q = q;
    catState.sortBy = sortBy;
    catState.order = order;
    try {
      const api = await getApi();
      const params = { page, limit };
      if (q) params.q = q;
      if (sortBy) {
        params.sortBy = sortBy;
        params.order = order;
      }
      const res = q
        ? await api.lookupCategories.search(params)
        : await api.lookupCategories.list(params);
      const envelope = res && typeof res === "object" ? res : { data: res };
      const items = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(res)
        ? res
        : [];
      const pagination = envelope.pagination || null;
      if (pagination) {
        catState.page = Number(pagination.page) || page || 1;
        catState.limit = Number(pagination.limit) || limit || 20;
        catState.pages = Number(pagination.pages) || 1;
        catState.total = Number(pagination.total) || items.length || 0;
      } else {
        catState.page = page || 1;
        catState.limit = limit || 20;
        catState.pages = 1;
        catState.total = items.length || 0;
      }
      renderCategories(items);
      updateCatPager();
      updateSortHeaderIndicatorsScoped(
        cat.table,
        catState.sortBy,
        catState.order
      );
    } catch (err) {
      console.error("[LookupCategories] list error", err);
      cat.tbody.innerHTML = `<tr><td colspan="4">${
        err?.status === 401 || err?.status === 403
          ? "Unauthorized"
          : "Error loading categories"
      }</td></tr>`;
      updateCatPager();
    }
  }

  // ---------- Sub-Categories table ----------
  const subState = {
    page: 1,
    limit: 20,
    q: "",
    pages: 1,
    total: 0,
    sortBy: "subcategory",
    order: "asc",
  };
  function getSubState() {
    return { ...subState };
  }
  function setSubState(s) {
    Object.assign(subState, s);
  }
  function restoreSubSort() {
    try {
      const s = JSON.parse(
        localStorage.getItem(SUB_SORT_STORAGE_KEY) || "null"
      );
      if (s?.sortBy) {
        subState.sortBy = s.sortBy;
        subState.order = s.order === "desc" ? "desc" : "asc";
      }
    } catch {}
  }

  function renderSubCategories(rows) {
    if (!sub.tbody) return;
    if (!rows?.length) {
      sub.tbody.innerHTML =
        '<tr><td colspan="4">No sub-categories found</td></tr>';
      currentSubcategoryData = [];
      return;
    }

    // Store current data for table manager
    currentSubcategoryData = rows;
    sub.tbody.innerHTML = rows
      .map((r) => {
        const id = r.id || r._id || "—";
        const name = r.subcategory || r.name || "—";
        const desc = r.description || "—";
        const status =
          r.active === false || r.status === "disabled" ? "Disabled" : "Active";
        const badge = status === "Active" ? "badge-success" : "badge-secondary";
        return `<tr>
        <td>${name}</td>
        <td class="text-wrap">${desc}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td class="no-wrap actions-col">
          <div class="actions-group">
            <button class="btn btn-link" data-action="view" data-id="${id}" data-type="subcategory">View</button>
            <span class="sep">|</span>
            <button class="btn btn-link" data-action="edit" data-id="${id}" data-type="subcategory">Edit</button>
          </div>
        </td>
      </tr>`;
      })
      .join("");

    sub.tbody.querySelectorAll("button[data-action]").forEach((btn) => {
      if (btn.dataset._wired) return;
      btn.dataset._wired = "1";
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        if (action === "view") {
          window.TANotification?.info?.("Sub-Category view coming soon");
        } else if (action === "edit") {
          window.TANotification?.info?.("Sub-Category edit coming soon");
        }
      });
    });
  }

  function updateSubPager() {
    if (sub.pageInfo)
      sub.pageInfo.textContent = `Page ${subState.page} of ${subState.pages} • ${subState.total} total`;
    if (sub.first) sub.first.disabled = subState.page <= 1;
    if (sub.prev) sub.prev.disabled = subState.page <= 1;
    if (sub.next) sub.next.disabled = subState.page >= subState.pages;
    if (sub.last) sub.last.disabled = subState.page >= subState.pages;
    if (sub.pageSize) sub.pageSize.value = String(subState.limit);
  }

  async function loadSubCategories({
    page = subState.page,
    limit = subState.limit,
    q = subState.q,
    sortBy = subState.sortBy,
    order = subState.order,
  } = {}) {
    if (!sub.tbody) return;
    sub.tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';

    // Update subState with current parameters
    subState.page = page;
    subState.limit = limit;
    subState.q = q;
    subState.sortBy = sortBy;
    subState.order = order;

    try {
      const api = await getApi();
      const params = { page, limit };
      if (q) params.q = q;
      if (sortBy) {
        params.sortBy = sortBy;
        params.order = order;
      }
      const res = q
        ? await api.lookupSubCategories.search(params)
        : await api.lookupSubCategories.list(params);
      const envelope = res && typeof res === "object" ? res : { data: res };
      const items = Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(res)
        ? res
        : [];
      const pagination = envelope.pagination || null;
      if (pagination) {
        subState.page = Number(pagination.page) || page || 1;
        subState.limit = Number(pagination.limit) || limit || 20;
        subState.pages = Number(pagination.pages) || 1;
        subState.total = Number(pagination.total) || items.length || 0;
      } else {
        subState.page = page || 1;
        subState.limit = limit || 20;
        subState.pages = 1;
        subState.total = items.length || 0;
      }
      renderSubCategories(items);
      updateSubPager();
      updateSortHeaderIndicatorsScoped(
        sub.table,
        subState.sortBy,
        subState.order
      );
    } catch (err) {
      console.error("[LookupSubCategories] list error", err);
      sub.tbody.innerHTML = `<tr><td colspan=\"4\">${
        err?.status === 401 || err?.status === 403
          ? "Unauthorized"
          : "Error loading sub-categories"
      }</td></tr>`;
      updateSubPager();
    }
  }

  function init() {
    const initLimit = pageSizeSelect ? Number(pageSizeSelect.value) || 20 : 20;
    state.limit = initLimit;

    // Restore sort preferences
    restoreSortSpec();
    restoreCatSort();
    restoreSubSort();

    loadStats();
    loadLookups({
      page: 1,
      limit: initLimit,
      sortBy: state.sortBy,
      order: state.order,
    });

    // Initialize categories
    cat.pageSize && (catState.limit = Number(cat.pageSize.value) || 20);
    loadCategories({
      page: 1,
      limit: catState.limit,
      sortBy: catState.sortBy,
      order: catState.order,
    });

    // Initialize sub-categories
    sub.pageSize && (subState.limit = Number(sub.pageSize.value) || 20);
    loadSubCategories({
      page: 1,
      limit: subState.limit,
      sortBy: subState.sortBy,
      order: subState.order,
    });

    // Wire sorting after initial load
    setTimeout(() => {
      setupTableFeatures();
      setupCategoryTableFeatures();
      setupSubcategoryTableFeatures();
    }, 100);

    // Wire New Category button
    const newCatBtn = document.getElementById("btn-new-lookup-category");
    if (newCatBtn && !newCatBtn.dataset._wired) {
      newCatBtn.dataset._wired = "1";
      newCatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.openLookupCategoryCreateModal === "function") {
          window.openLookupCategoryCreateModal();
        } else {
          window.TANotification?.info?.("Create modal not loaded yet");
        }
      });
    }
    // Wire New Sub Category button
    const newSubBtn = document.getElementById("btn-new-lookup-subcategory");
    if (newSubBtn && !newSubBtn.dataset._wired) {
      newSubBtn.dataset._wired = "1";
      newSubBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.openLookupSubCategoryCreateModal === "function") {
          window.openLookupSubCategoryCreateModal();
        } else {
          window.TANotification?.info?.("Create modal not loaded yet");
        }
      });
    }
    // Wire inline New Category button in categories header
    const newCatInline = document.getElementById(
      "btn-new-lookup-category-inline"
    );
    if (newCatInline && !newCatInline.dataset._wired) {
      newCatInline.dataset._wired = "1";
      newCatInline.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.openLookupCategoryCreateModal === "function") {
          window.openLookupCategoryCreateModal();
        } else {
          window.TANotification?.info?.("Create modal not loaded yet");
        }
      });
    }
    // Wire inline New Sub Category button in sub-categories header
    const newSubInline = document.getElementById(
      "btn-new-lookup-subcategory-inline"
    );
    if (newSubInline && !newSubInline.dataset._wired) {
      newSubInline.dataset._wired = "1";
      newSubInline.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.openLookupSubCategoryCreateModal === "function") {
          window.openLookupSubCategoryCreateModal();
        } else {
          window.TANotification?.info?.("Create modal not loaded yet");
        }
      });
    }
    // Wire New Lookup button
    const newLookupBtn = document.getElementById("btn-new-lookup");
    if (newLookupBtn && !newLookupBtn.dataset._wired) {
      newLookupBtn.dataset._wired = "1";
      newLookupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof window.openLookupCreateModal === "function") {
          window.openLookupCreateModal();
        } else {
          window.TANotification?.info?.("Create modal not loaded yet");
        }
      });
    }
    // Provide global refresh for modals
    window.reloadLookupsList = () => {
      loadStats();
      loadLookups({
        page: 1,
        limit: state.limit,
        q: state.q,
        sortBy: state.sortBy,
        order: state.order,
      });
      loadCategories({
        page: 1,
        limit: catState.limit,
        q: catState.q,
        sortBy: catState.sortBy,
        order: catState.order,
      });
      loadSubCategories({
        page: 1,
        limit: subState.limit,
        q: subState.q,
        sortBy: subState.sortBy,
        order: subState.order,
      });
    };
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
        loadLookups({
          page: 1,
          limit: state.limit,
          q,
          sortBy: state.sortBy,
          order: state.order,
        });
      }, 300);
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.q = "";
      loadLookups({
        page: 1,
        limit: state.limit,
        sortBy: state.sortBy,
        order: state.order,
      });
    });
  }

  if (pageSizeSelect)
    pageSizeSelect.addEventListener("change", () => {
      const newLimit = Number(pageSizeSelect.value) || 20;
      state.limit = newLimit;
      loadLookups({
        page: 1,
        limit: newLimit,
        q: state.q,
        sortBy: state.sortBy,
        order: state.order,
      });
    });

  if (btnFirst)
    btnFirst.addEventListener("click", () => {
      if (state.page > 1)
        loadLookups({
          page: 1,
          limit: state.limit,
          q: state.q,
          sortBy: state.sortBy,
          order: state.order,
        });
    });
  if (btnPrev)
    btnPrev.addEventListener("click", () => {
      if (state.page > 1)
        loadLookups({
          page: state.page - 1,
          limit: state.limit,
          q: state.q,
          sortBy: state.sortBy,
          order: state.order,
        });
    });
  if (btnNext)
    btnNext.addEventListener("click", () => {
      if (state.page < state.pages)
        loadLookups({
          page: state.page + 1,
          limit: state.limit,
          q: state.q,
          sortBy: state.sortBy,
          order: state.order,
        });
    });
  if (btnLast)
    btnLast.addEventListener("click", () => {
      if (state.page < state.pages)
        loadLookups({
          page: state.pages,
          limit: state.limit,
          q: state.q,
          sortBy: state.sortBy,
          order: state.order,
        });
    });

  // Note: Action buttons are now handled by event delegation in renderRows()

  // ----- Wire categories controls -----
  if (cat.searchInput) {
    let t;
    cat.searchInput.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        catState.q = cat.searchInput.value.trim();
        loadCategories({
          page: 1,
          limit: catState.limit,
          q: catState.q,
          sortBy: catState.sortBy,
          order: catState.order,
        });
      }, 300);
    });
  }
  if (cat.clearBtn && cat.searchInput) {
    cat.clearBtn.addEventListener("click", () => {
      cat.searchInput.value = "";
      catState.q = "";
      loadCategories({
        page: 1,
        limit: catState.limit,
        sortBy: catState.sortBy,
        order: catState.order,
      });
    });
  }
  if (cat.pageSize)
    cat.pageSize.addEventListener("change", () => {
      catState.limit = Number(cat.pageSize.value) || 20;
      loadCategories({
        page: 1,
        limit: catState.limit,
        q: catState.q,
        sortBy: catState.sortBy,
        order: catState.order,
      });
    });
  if (cat.first)
    cat.first.addEventListener("click", () => {
      if (catState.page > 1)
        loadCategories({
          page: 1,
          limit: catState.limit,
          q: catState.q,
          sortBy: catState.sortBy,
          order: catState.order,
        });
    });
  if (cat.prev)
    cat.prev.addEventListener("click", () => {
      if (catState.page > 1)
        loadCategories({
          page: catState.page - 1,
          limit: catState.limit,
          q: catState.q,
          sortBy: catState.sortBy,
          order: catState.order,
        });
    });
  if (cat.next)
    cat.next.addEventListener("click", () => {
      if (catState.page < catState.pages)
        loadCategories({
          page: catState.page + 1,
          limit: catState.limit,
          q: catState.q,
          sortBy: catState.sortBy,
          order: catState.order,
        });
    });
  if (cat.last)
    cat.last.addEventListener("click", () => {
      if (catState.page < catState.pages)
        loadCategories({
          page: catState.pages,
          limit: catState.limit,
          q: catState.q,
          sortBy: catState.sortBy,
          order: catState.order,
        });
    });

  // ----- Wire sub-categories controls -----
  if (sub.searchInput) {
    let t2;
    sub.searchInput.addEventListener("input", () => {
      clearTimeout(t2);
      t2 = setTimeout(() => {
        subState.q = sub.searchInput.value.trim();
        loadSubCategories({
          page: 1,
          limit: subState.limit,
          q: subState.q,
          sortBy: subState.sortBy,
          order: subState.order,
        });
      }, 300);
    });
  }
  if (sub.clearBtn && sub.searchInput) {
    sub.clearBtn.addEventListener("click", () => {
      sub.searchInput.value = "";
      subState.q = "";
      loadSubCategories({
        page: 1,
        limit: subState.limit,
        sortBy: subState.sortBy,
        order: subState.order,
      });
    });
  }
  if (sub.pageSize)
    sub.pageSize.addEventListener("change", () => {
      subState.limit = Number(sub.pageSize.value) || 20;
      loadSubCategories({
        page: 1,
        limit: subState.limit,
        q: subState.q,
        sortBy: subState.sortBy,
        order: subState.order,
      });
    });
  if (sub.first)
    sub.first.addEventListener("click", () => {
      if (subState.page > 1)
        loadSubCategories({
          page: 1,
          limit: subState.limit,
          q: subState.q,
          sortBy: subState.sortBy,
          order: subState.order,
        });
    });
  if (sub.prev)
    sub.prev.addEventListener("click", () => {
      if (subState.page > 1)
        loadSubCategories({
          page: subState.page - 1,
          limit: subState.limit,
          q: subState.q,
          sortBy: subState.sortBy,
          order: subState.order,
        });
    });
  if (sub.next)
    sub.next.addEventListener("click", () => {
      if (subState.page < subState.pages)
        loadSubCategories({
          page: subState.page + 1,
          limit: subState.limit,
          q: subState.q,
          sortBy: subState.sortBy,
          order: subState.order,
        });
    });
  if (sub.last)
    sub.last.addEventListener("click", () => {
      if (subState.page < subState.pages)
        loadSubCategories({
          page: subState.pages,
          limit: subState.limit,
          q: subState.q,
          sortBy: subState.sortBy,
          order: subState.order,
        });
    });
})();
