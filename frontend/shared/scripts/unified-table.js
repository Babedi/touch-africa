/**
 * Unified Table Management System
 * Provides consistent search, sort, pagination, and state management for all tables
 */
window.UnifiedTable = (function () {
  "use strict";

  /**
   * Create a unified table state manager
   * @param {Object} options - Configuration options
   * @returns {Object} Table state manager
   */
  function createState(options) {
    const defaults = {
      page: 1,
      limit: 20,
      q: "",
      pages: 1,
      total: 0,
      sortBy: null,
      order: "asc",
      storageKey: null, // localStorage key for sort persistence
    };
    return Object.assign({}, defaults, options);
  }

  /**
   * Filter data based on search query
   * @param {Array} data - Array of objects to filter
   * @param {string} query - Search query
   * @param {Array} fields - Fields to search in
   * @returns {Array} Filtered data
   */
  function filter(data, query, fields) {
    if (!query || !query.trim()) return data;
    const searchTerm = query.toLowerCase().trim();

    return data.filter(function (item) {
      return fields.some(function (field) {
        const value = getNestedProperty(item, field);
        return value && String(value).toLowerCase().includes(searchTerm);
      });
    });
  }

  /**
   * Sort data by field and direction
   * @param {Array} data - Array of objects to sort
   * @param {string} field - Field name to sort by
   * @param {string} direction - "asc" or "desc"
   * @returns {Array} Sorted data
   */
  function sort(data, field, direction) {
    if (!field) return data;

    return [...data].sort(function (a, b) {
      let aVal = getNestedProperty(a, field) || "";
      let bVal = getNestedProperty(b, field) || "";

      // Handle different data types
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (direction === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });
  }

  /**
   * Paginate data
   * @param {Array} data - Array of data to paginate
   * @param {number} page - Current page (1-based)
   * @param {number} limit - Items per page
   * @returns {Object} Paginated result with data and meta info
   */
  function paginate(data, page, limit) {
    const total = data.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      meta: {
        page: page,
        pages: pages,
        total: total,
        limit: limit,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get nested property from object using dot notation
   * @param {Object} obj - Object to get property from
   * @param {string} path - Dot notation path (e.g., "user.profile.name")
   * @returns {*} Property value
   */
  function getNestedProperty(obj, path) {
    return path.split(".").reduce(function (current, prop) {
      return current && current[prop];
    }, obj);
  }

  /**
   * Save sort specification to localStorage
   * @param {string} key - Storage key
   * @param {Object} sortSpec - Sort specification {field, order}
   */
  function saveSortSpec(key, sortSpec) {
    if (!key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          primary: sortSpec.field || sortSpec.sortBy,
          order: sortSpec.order || "asc",
        })
      );
    } catch (e) {
      console.warn("Failed to save sort spec:", e);
    }
  }

  /**
   * Restore sort specification from localStorage
   * @param {string} key - Storage key
   * @returns {Object|null} Sort specification or null
   */
  function restoreSortSpec(key) {
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const spec = JSON.parse(raw);
      if (spec && spec.primary) {
        return {
          field: spec.primary,
          order: spec.order || "asc",
        };
      }
    } catch (e) {
      console.warn("Failed to restore sort spec:", e);
    }
    return null;
  }

  /**
   * Update pagination UI elements
   * @param {Object} meta - Pagination meta information
   * @param {Object} elements - DOM elements {pageInfo, btnFirst, btnPrev, btnNext, btnLast, pageSizeSelect}
   */
  function updatePagination(meta, elements) {
    const { page, pages, total, limit } = meta;

    if (elements.pageInfo) {
      elements.pageInfo.textContent = `Page ${page} of ${pages} • ${total.toLocaleString()} total`;
    }

    if (elements.btnFirst) elements.btnFirst.disabled = page <= 1;
    if (elements.btnPrev) elements.btnPrev.disabled = page <= 1;
    if (elements.btnNext) elements.btnNext.disabled = page >= pages;
    if (elements.btnLast) elements.btnLast.disabled = page >= pages;

    if (elements.pageSizeSelect) {
      const val = String(limit);
      if (elements.pageSizeSelect.value !== val) {
        elements.pageSizeSelect.value = val;
      }
    }
  }

  /**
   * Setup table sorting for clickable headers
   * @param {HTMLElement} table - Table element
   * @param {Function} onSort - Sort callback function (field, direction)
   * @param {Object} currentSort - Current sort state {field, order}
   */
  function setupSorting(table, onSort, currentSort) {
    if (!table || !onSort) return;

    // Create a mutable copy of currentSort to track state changes
    const sortState = {
      field: currentSort.field || null,
      order: currentSort.order || "asc",
    };

    // Find sortable headers
    const headers = table.querySelectorAll("thead th[data-sort]");
    console.log(
      "[UnifiedTable] Setting up sorting for",
      headers.length,
      "headers"
    );

    headers.forEach(function (header) {
      header.style.cursor = "pointer";

      // Remove any existing click listeners to prevent duplicates
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);

      newHeader.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const field = newHeader.getAttribute("data-sort");
        console.log("[UnifiedTable] Header clicked:", field);

        let newDirection = "asc";

        // Toggle direction if clicking same column
        if (sortState.field === field) {
          newDirection = sortState.order === "asc" ? "desc" : "asc";
        }

        console.log("[UnifiedTable] Sorting:", field, newDirection);

        // Update internal sort state
        sortState.field = field;
        sortState.order = newDirection;

        // Update sort indicators
        updateSortIndicators(table, field, newDirection);

        // Call sort callback
        onSort(field, newDirection);
      });
    });

    // Set initial sort indicators
    if (sortState.field) {
      updateSortIndicators(table, sortState.field, sortState.order);
    }
  }

  /**
   * Update sort indicators in table headers
   * @param {HTMLElement} table - Table element
   * @param {string} field - Current sort field
   * @param {string} direction - Current sort direction
   */
  function updateSortIndicators(table, field, direction) {
    const headers = table.querySelectorAll("thead th[data-sort]");

    headers.forEach(function (header) {
      // Remove existing sort attributes and classes
      header.removeAttribute("aria-sort");
      header.classList.remove("sort-asc", "sort-desc");
      const icon = header.querySelector(".sort-icon");
      if (icon) icon.remove();

      if (header.getAttribute("data-sort") === field) {
        // Set aria-sort for accessibility
        header.setAttribute(
          "aria-sort",
          direction === "asc" ? "ascending" : "descending"
        );

        // Add CSS class for styling
        header.classList.add(direction === "asc" ? "sort-asc" : "sort-desc");

        // Add Font Awesome icon
        const iconClass = direction === "asc" ? "fa-sort-up" : "fa-sort-down";
        header.insertAdjacentHTML(
          "beforeend",
          ` <i class="fas ${iconClass} sort-icon"></i>`
        );
      }
    });
  }

  /**
   * Setup search functionality with debouncing
   * @param {HTMLElement} searchInput - Search input element
   * @param {Function} onSearch - Search callback function
   * @param {number} delay - Debounce delay in ms (default: 300)
   */
  function setupSearch(searchInput, onSearch, delay) {
    if (!searchInput || !onSearch) return;

    delay = delay || 300;
    let timeout;

    searchInput.addEventListener("input", function () {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        const query = searchInput.value.trim();
        onSearch(query);
      }, delay);
    });
  }

  /**
   * Process data with search, sort, and pagination
   * @param {Array} data - Raw data array
   * @param {Object} options - Processing options {query, searchFields, sortField, sortOrder, page, limit}
   * @returns {Object} Processed result {data, meta}
   */
  function processData(data, options) {
    const {
      query = "",
      searchFields = [],
      sortField = null,
      sortOrder = "asc",
      page = 1,
      limit = 20,
    } = options;

    // Filter by search query
    let processedData = filter(data, query, searchFields);

    // Sort data
    if (sortField) {
      processedData = sort(processedData, sortField, sortOrder);
    }

    // Paginate data
    return paginate(processedData, page, limit);
  }

  /**
   * Create a complete table manager with all functionality
   * @param {Object} config - Configuration object
   * @returns {Object} Table manager instance
   */
  function createManager(config) {
    const {
      data = [],
      searchFields = [],
      storageKey = null,
      onDataUpdate = null,
      onSort = null,
      onSearch = null,
      onPageChange = null,
    } = config;

    const state = createState({ storageKey });

    // Restore saved sort if available
    if (storageKey) {
      const savedSort = restoreSortSpec(storageKey);
      if (savedSort) {
        state.sortBy = savedSort.field;
        state.order = savedSort.order;
      }
    }

    function updateData() {
      const result = processData(data, {
        query: state.q,
        searchFields: searchFields,
        sortField: state.sortBy,
        sortOrder: state.order,
        page: state.page,
        limit: state.limit,
      });

      // Update state
      Object.assign(state, result.meta);

      // Trigger callback
      if (onDataUpdate) {
        onDataUpdate(result.data, result.meta);
      }

      return result;
    }

    return {
      state: state,

      search: function (query) {
        state.q = query;
        state.page = 1; // Reset to first page on search
        updateData();
        if (onSearch) onSearch(query);
      },

      sort: function (field, order) {
        state.sortBy = field;
        state.order = order;
        state.page = 1; // Reset to first page on sort

        // Save sort preference
        if (storageKey) {
          saveSortSpec(storageKey, { field, order });
        }

        updateData();
        if (onSort) onSort(field, order);
      },

      goToPage: function (page) {
        if (page >= 1 && page <= state.pages) {
          state.page = page;
          updateData();
          if (onPageChange) onPageChange(page);
        }
      },

      setPageSize: function (size) {
        state.limit = size;
        state.page = 1; // Reset to first page
        updateData();
      },

      refresh: function () {
        updateData();
      },

      setData: function (newData) {
        data.splice(0, data.length, ...newData);
        state.page = 1; // Reset to first page
        updateData();
      },
    };
  }

  // Public API
  return {
    createState: createState,
    filter: filter,
    sort: sort,
    paginate: paginate,
    processData: processData,
    saveSortSpec: saveSortSpec,
    restoreSortSpec: restoreSortSpec,
    updatePagination: updatePagination,
    setupSorting: setupSorting,
    setupSearch: setupSearch,
    createManager: createManager,
  };
})();
