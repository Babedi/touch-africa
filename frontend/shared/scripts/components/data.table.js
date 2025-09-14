/**
 * DataTable Component
 * Provides interactive table functionality with sorting, pagination, filtering, and search
 */
class DataTable {
  constructor(element, options = {}) {
    this.element =
      typeof element === "string" ? document.querySelector(element) : element;
    this.options = {
      data: [],
      columns: [],
      pageSize: 10,
      currentPage: 1,
      sortable: true,
      filterable: true,
      searchable: true,
      pagination: true,
      selectable: false,
      multiSelect: false,
      responsive: true,
      striped: true,
      bordered: false,
      hover: true,
      emptyMessage: "No data available",
      loadingMessage: "Loading...",
      ...options,
    };

    this.originalData = [...this.options.data];
    this.filteredData = [...this.options.data];
    this.currentSort = { column: null, direction: "asc" };
    this.filters = {};
    this.searchTerm = "";
    this.selectedRows = new Set();

    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.element.innerHTML = this.generateHTML();
    this.updateTable();
  }

  generateHTML() {
    return `
            <div class="data-table">
                ${
                  this.options.searchable || this.options.filterable
                    ? this.generateControls()
                    : ""
                }
                <div class="table-responsive">
                    <table class="table ${this.getTableClasses()}">
                        <thead>
                            ${this.generateHeader()}
                        </thead>
                        <tbody>
                            ${this.generateBody()}
                        </tbody>
                    </table>
                </div>
                ${this.options.pagination ? this.generatePagination() : ""}
            </div>
        `;
  }

  generateControls() {
    return `
            <div class="table-header">
                <div class="table-controls">
                    ${
                      this.options.searchable
                        ? `
                        <div class="table-search">
                            <input type="text" 
                                   class="form-control" 
                                   placeholder="Search..." 
                                   data-search>
                        </div>
                    `
                        : ""
                    }
                    ${
                      this.options.filterable
                        ? `
                        <div class="table-filters">
                            ${this.generateFilters()}
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  }

  generateFilters() {
    return this.options.columns
      .filter((col) => col.filterable)
      .map(
        (col) => `
                <select class="form-control form-control-sm" data-filter="${
                  col.key
                }">
                    <option value="">All ${col.title}</option>
                    ${this.getUniqueValues(col.key)
                      .map(
                        (value) => `<option value="${value}">${value}</option>`
                      )
                      .join("")}
                </select>
            `
      )
      .join("");
  }

  generateHeader() {
    const selectAllHeader =
      this.options.selectable && this.options.multiSelect
        ? `<th class="actions-cell">
                <input type="checkbox" data-select-all>
            </th>`
        : "";

    const columnHeaders = this.options.columns
      .map((col) => {
        const sortable = this.options.sortable && col.sortable !== false;
        const sortClass =
          this.currentSort.column === col.key
            ? `sort-${this.currentSort.direction}`
            : "";

        return `
                <th class="${sortable ? "sortable" : ""} ${sortClass}" 
                    ${sortable ? `data-sort="${col.key}"` : ""}>
                    ${col.title}
                </th>
            `;
      })
      .join("");

    return `<tr>${selectAllHeader}${columnHeaders}</tr>`;
  }

  generateBody() {
    if (this.filteredData.length === 0) {
      return `
                <tr>
                    <td colspan="${this.getColumnCount()}" class="table-empty">
                        <h3>No Results Found</h3>
                        <p>${this.options.emptyMessage}</p>
                    </td>
                </tr>
            `;
    }

    const startIndex = (this.options.currentPage - 1) * this.options.pageSize;
    const endIndex = startIndex + this.options.pageSize;
    const pageData = this.filteredData.slice(startIndex, endIndex);

    return pageData
      .map((row, index) => {
        const rowId = this.getRowId(row, startIndex + index);
        const isSelected = this.selectedRows.has(rowId);

        const selectCell = this.options.selectable
          ? `<td class="actions-cell">
                    <input type="checkbox" 
                           data-select-row="${rowId}" 
                           ${isSelected ? "checked" : ""}>
                </td>`
          : "";

        const dataCells = this.options.columns
          .map((col) => {
            const value = this.getCellValue(row, col);
            return `<td class="${col.className || ""}">${value}</td>`;
          })
          .join("");

        return `<tr data-row-id="${rowId}" ${
          isSelected ? 'class="selected"' : ""
        }>${selectCell}${dataCells}</tr>`;
      })
      .join("");
  }

  generatePagination() {
    const totalPages = Math.ceil(
      this.filteredData.length / this.options.pageSize
    );

    if (totalPages <= 1) return "";

    const currentPage = this.options.currentPage;
    const startItem = (currentPage - 1) * this.options.pageSize + 1;
    const endItem = Math.min(
      currentPage * this.options.pageSize,
      this.filteredData.length
    );

    return `
            <div class="table-pagination">
                <div class="pagination-info">
                    Showing ${startItem} to ${endItem} of ${
      this.filteredData.length
    } entries
                </div>
                <div class="pagination-controls">
                    <ul class="pagination">
                        <li class="page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }">
                            <a class="page-link" href="#" data-page="prev">&laquo;</a>
                        </li>
                        ${this.generatePageNumbers(currentPage, totalPages)}
                        <li class="page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }">
                            <a class="page-link" href="#" data-page="next">&raquo;</a>
                        </li>
                    </ul>
                </div>
            </div>
        `;
  }

  generatePageNumbers(currentPage, totalPages) {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(`
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
    }

    return pages.join("");
  }

  attachEvents() {
    const element = this.element;

    // Search
    const searchInput = element.querySelector("[data-search]");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.search(e.target.value);
      });
    }

    // Filters
    element.querySelectorAll("[data-filter]").forEach((filter) => {
      filter.addEventListener("change", (e) => {
        this.setFilter(e.target.dataset.filter, e.target.value);
      });
    });

    // Sorting
    element.querySelectorAll("[data-sort]").forEach((header) => {
      header.addEventListener("click", (e) => {
        this.sort(e.target.dataset.sort);
      });
    });

    // Pagination
    element.addEventListener("click", (e) => {
      if (e.target.dataset.page) {
        e.preventDefault();
        this.goToPage(e.target.dataset.page);
      }
    });

    // Row selection
    if (this.options.selectable) {
      // Select all
      const selectAllCheckbox = element.querySelector("[data-select-all]");
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", (e) => {
          this.selectAll(e.target.checked);
        });
      }

      // Individual row selection
      element.addEventListener("change", (e) => {
        if (e.target.dataset.selectRow) {
          this.selectRow(e.target.dataset.selectRow, e.target.checked);
        }
      });
    }
  }

  // Data management methods
  setData(data) {
    this.originalData = [...data];
    this.applyFiltersAndSearch();
    this.updateTable();
  }

  getData() {
    return this.originalData;
  }

  getFilteredData() {
    return this.filteredData;
  }

  // Search functionality
  search(term) {
    this.searchTerm = term.toLowerCase();
    this.applyFiltersAndSearch();
    this.updateTable();
  }

  // Filter functionality
  setFilter(column, value) {
    if (value) {
      this.filters[column] = value;
    } else {
      delete this.filters[column];
    }
    this.applyFiltersAndSearch();
    this.updateTable();
  }

  clearFilters() {
    this.filters = {};
    this.searchTerm = "";
    this.applyFiltersAndSearch();
    this.updateTable();
  }

  applyFiltersAndSearch() {
    this.filteredData = this.originalData.filter((row) => {
      // Apply search
      if (this.searchTerm) {
        const searchMatch = this.options.columns.some((col) => {
          const value = this.getCellValue(row, col).toString().toLowerCase();
          return value.includes(this.searchTerm);
        });
        if (!searchMatch) return false;
      }

      // Apply filters
      for (const [column, filterValue] of Object.entries(this.filters)) {
        const cellValue = this.getCellValue(row, { key: column });
        if (cellValue.toString() !== filterValue) return false;
      }

      return true;
    });

    // Reset to first page when filtering
    this.options.currentPage = 1;
  }

  // Sorting functionality
  sort(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction =
        this.currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = "asc";
    }

    this.filteredData.sort((a, b) => {
      const aVal = this.getCellValue(a, { key: column });
      const bVal = this.getCellValue(b, { key: column });

      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;

      return this.currentSort.direction === "desc" ? -comparison : comparison;
    });

    this.updateTable();
  }

  // Pagination functionality
  goToPage(page) {
    const totalPages = Math.ceil(
      this.filteredData.length / this.options.pageSize
    );

    if (page === "prev") {
      this.options.currentPage = Math.max(1, this.options.currentPage - 1);
    } else if (page === "next") {
      this.options.currentPage = Math.min(
        totalPages,
        this.options.currentPage + 1
      );
    } else {
      this.options.currentPage = Math.max(
        1,
        Math.min(totalPages, parseInt(page))
      );
    }

    this.updateTable();
  }

  // Selection functionality
  selectRow(rowId, selected) {
    if (selected) {
      if (!this.options.multiSelect) {
        this.selectedRows.clear();
      }
      this.selectedRows.add(rowId);
    } else {
      this.selectedRows.delete(rowId);
    }

    this.updateSelectAllState();
    this.emit("selectionChange", {
      selectedRows: Array.from(this.selectedRows),
      selectedData: this.getSelectedData(),
    });
  }

  selectAll(selected) {
    if (selected) {
      const startIndex = (this.options.currentPage - 1) * this.options.pageSize;
      const endIndex = startIndex + this.options.pageSize;
      const pageData = this.filteredData.slice(startIndex, endIndex);

      pageData.forEach((row, index) => {
        this.selectedRows.add(this.getRowId(row, startIndex + index));
      });
    } else {
      this.selectedRows.clear();
    }

    this.updateTable();
    this.emit("selectionChange", {
      selectedRows: Array.from(this.selectedRows),
      selectedData: this.getSelectedData(),
    });
  }

  getSelectedData() {
    return this.originalData.filter((row, index) =>
      this.selectedRows.has(this.getRowId(row, index))
    );
  }

  // Helper methods
  getCellValue(row, column) {
    if (column.render && typeof column.render === "function") {
      return column.render(row[column.key], row);
    }
    return row[column.key] || "";
  }

  getRowId(row, index) {
    return row.id || index;
  }

  getColumnCount() {
    let count = this.options.columns.length;
    if (this.options.selectable) count++;
    return count;
  }

  getTableClasses() {
    const classes = [];
    if (this.options.striped) classes.push("table-striped");
    if (this.options.bordered) classes.push("table-bordered");
    if (this.options.hover) classes.push("table-hover");
    return classes.join(" ");
  }

  getUniqueValues(columnKey) {
    const values = this.originalData.map((row) => row[columnKey]);
    return [...new Set(values)].filter(Boolean).sort();
  }

  updateSelectAllState() {
    const selectAllCheckbox = this.element.querySelector("[data-select-all]");
    if (selectAllCheckbox) {
      const startIndex = (this.options.currentPage - 1) * this.options.pageSize;
      const endIndex = startIndex + this.options.pageSize;
      const pageData = this.filteredData.slice(startIndex, endIndex);

      const selectedCount = pageData.filter((row, index) =>
        this.selectedRows.has(this.getRowId(row, startIndex + index))
      ).length;

      selectAllCheckbox.checked =
        selectedCount === pageData.length && pageData.length > 0;
      selectAllCheckbox.indeterminate =
        selectedCount > 0 && selectedCount < pageData.length;
    }
  }

  updateTable() {
    const tbody = this.element.querySelector("tbody");
    const pagination = this.element.querySelector(".table-pagination");
    const headers = this.element.querySelector("thead");

    if (tbody) tbody.innerHTML = this.generateBody();
    if (pagination)
      pagination.outerHTML = this.options.pagination
        ? this.generatePagination()
        : "";
    if (headers) headers.innerHTML = this.generateHeader();

    this.updateSelectAllState();
  }

  // Event system
  emit(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    this.element.dispatchEvent(event);
  }

  on(eventName, handler) {
    this.element.addEventListener(eventName, handler);
  }

  // Public API methods
  refresh() {
    this.updateTable();
  }

  destroy() {
    this.element.innerHTML = "";
    this.selectedRows.clear();
    this.filters = {};
    this.searchTerm = "";
  }

  // Configuration methods
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.render();
  }

  addColumn(column) {
    this.options.columns.push(column);
    this.render();
  }

  removeColumn(columnKey) {
    this.options.columns = this.options.columns.filter(
      (col) => col.key !== columnKey
    );
    this.render();
  }
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = DataTable;
}
