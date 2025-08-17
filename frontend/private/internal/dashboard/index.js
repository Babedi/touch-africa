/**
 * Internal Admin Dashboard Logic
 */

class AdminDashboard {
  constructor() {
    this.currentUser = null;
    this.lookupsData = [];
    this.filteredLookups = [];
    this.currentSort = null;
    this.sortDirection = "asc";
    this.init();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeDashboard();
      });
    } else {
      // DOM is already ready
      this.initializeDashboard();
    }
  }

  async initializeDashboard() {
    try {
      console.log("🔧 Initializing dashboard...");

      // Set auth token for testing (remove this in production)
      const testToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkFETUlOX0xPQ0FMX1RFU1QiLCJ0eXBlIjoiYWRtaW4iLCJyb2xlcyI6WyJleHRlcm5hbFN1cGVyQWRtaW4iLCJpbnRlcm5hbFN1cGVyQWRtaW4iXSwiaWF0IjoxNzU1MzMwOTYxLCJleHAiOjE3NTU5MzU3NjF9.opP3UomRLw7umJGKetrMQ5pxSIYRf4kIIE3BynGpF1M";

      if (!localStorage.getItem("authToken")) {
        localStorage.setItem("authToken", testToken);
        document.cookie = `authToken=${testToken}; path=/`;
        console.log("🔑 Test auth token set for debugging");
      }

      // Force sidebar visibility FIRST - REMOVED FOR PROPER TOGGLE
      // this.forceSidebarVisibility();

      // Initialize sidebar navigation SECOND
      this.initializeSidebar();

      // Initialize modal event listeners
      this.initializeModalHandlers();

      // Initialize button handlers
      this.initializeButtonHandlers();

      // Initialize table controls
      this.initializeTableControls();

      // Small delay to ensure sidebar is rendered
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Then check authentication
      const token =
        localStorage.getItem("authToken") || this.getCookieValue("authToken");
      if (!token) {
        console.log("No auth token found, redirecting to home...");
        // Add delay before redirect to see sidebar
        setTimeout(() => {
          window.location.href = "/";
        }, 3000); // 3 second delay to see sidebar
        return;
      }

      // Load user info
      await this.loadUserInfo();

      // Load dashboard data
      await this.loadDashboardData();
    } catch (error) {
      console.error("Dashboard initialization failed:", error);
      this.showError("Failed to initialize dashboard", error);
    }
  }

  initializeSidebar() {
    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");

    console.log("Initializing sidebar...", { sidebarToggle, sidebar });

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        // Save sidebar state
        localStorage.setItem(
          "sidebarCollapsed",
          sidebar.classList.contains("collapsed")
        );
        console.log(
          "Sidebar toggled. Collapsed:",
          sidebar.classList.contains("collapsed")
        );
      });

      // Initialize sidebar state based on screen size
      if (window.innerWidth > 768) {
        // On desktop, restore saved state or default to expanded
        const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
        if (isCollapsed) {
          sidebar.classList.add("collapsed");
        } else {
          sidebar.classList.remove("collapsed");
        }
        console.log("Desktop mode - Sidebar collapsed:", isCollapsed);
      } else {
        // On mobile, start collapsed
        sidebar.classList.add("collapsed");
        console.log("Mobile mode - Sidebar collapsed");
      }
    } else {
      console.error("Sidebar elements not found:", { sidebarToggle, sidebar });
    }

    // Navigation link handling
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        this.showSection(section);

        // Update active navigation
        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");

        // Update URL hash
        window.location.hash = section;
      });
    });

    // Handle browser back/forward
    window.addEventListener("popstate", () => {
      const hash = window.location.hash.slice(1) || "dashboard";
      this.showSection(hash);
      this.updateActiveNav(hash);
    });

    // Initialize based on current hash
    const currentHash = window.location.hash.slice(1) || "dashboard";
    this.showSection(currentHash);
    this.updateActiveNav(currentHash);

    // Mobile sidebar handling
    if (window.innerWidth <= 768) {
      // Close sidebar when clicking outside on mobile
      document.addEventListener("click", (e) => {
        if (
          !sidebar.contains(e.target) &&
          !sidebarToggle.contains(e.target) &&
          !sidebar.classList.contains("collapsed")
        ) {
          sidebar.classList.add("collapsed");
        }
      });

      // Close sidebar when navigating on mobile
      navLinks.forEach((link) => {
        link.addEventListener("click", () => {
          if (window.innerWidth <= 768) {
            sidebar.classList.add("collapsed");
          }
        });
      });
    }

    // Handle window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        // On larger screens, respect the saved collapsed state
        const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
        if (isCollapsed) {
          sidebar.classList.add("collapsed");
        } else {
          sidebar.classList.remove("collapsed");
        }
      } else {
        // On mobile, start collapsed
        sidebar.classList.add("collapsed");
      }
    });
  }

  initializeModalHandlers() {
    // Close modals when clicking outside
    const userModal = document.getElementById("userInfoModal");
    const notificationsModal = document.getElementById("notificationsModal");

    if (userModal) {
      userModal.addEventListener("click", (e) => {
        if (e.target === userModal) {
          this.closeUserInfoModal();
        }
      });
    }

    if (notificationsModal) {
      notificationsModal.addEventListener("click", (e) => {
        if (e.target === notificationsModal) {
          this.closeNotificationsModal();
        }
      });
    }

    // Close modals with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const userModal = document.getElementById("userInfoModal");
        const notificationsModal =
          document.getElementById("notificationsModal");

        if (userModal && userModal.classList.contains("show")) {
          this.closeUserInfoModal();
        } else if (
          notificationsModal &&
          notificationsModal.classList.contains("show")
        ) {
          this.closeNotificationsModal();
        }
      }
    });
  }

  initializeButtonHandlers() {
    // Add Admin button handler
    const addAdminBtn = document.getElementById("addAdminBtn");
    if (addAdminBtn) {
      addAdminBtn.addEventListener("click", async () => {
        try {
          // Load the modal script if not already loaded
          if (typeof openAddAdminModal === "undefined") {
            await this.loadAddAdminModal();
          }

          // Open the modal
          openAddAdminModal();
        } catch (error) {
          console.error("Failed to open add admin modal:", error);
          this.showError("Failed to open add admin modal", error);
        }
      });
      console.log("✅ Add Admin button handler initialized");
    } else {
      console.warn("⚠️ Add Admin button not found");
    }
  }

  async loadAddAdminModal() {
    try {
      console.log("🔧 Loading Add Admin modal script...");

      // Check if script is already loaded
      if (document.getElementById("addAdminModalScript")) {
        console.log("✅ Add Admin modal script already loaded");
        return;
      }

      // Load the modal script
      const script = document.createElement("script");
      script.id = "addAdminModalScript";
      script.src = "/modals/add.admin.modal/index.js";
      script.async = true;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Add Admin modal script loaded successfully");
          resolve();
        };
        script.onerror = () => {
          console.error("❌ Failed to load Add Admin modal script");
          reject(new Error("Failed to load modal script"));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("❌ Error loading Add Admin modal:", error);
      throw error;
    }
  }

  showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll(".content-section");
    sections.forEach((section) => section.classList.remove("active"));

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add("active");
    }

    // Load section-specific data
    switch (sectionName) {
      case "manage-admins":
        this.loadAdminManagement();
        break;
      case "manage-lookups":
        this.loadLookupManagement();
        break;
      case "manage-service-info":
        this.loadServiceInfoManagement();
        break;
      case "dashboard":
      default:
        // Dashboard data is already loaded in initializeDashboard
        break;
    }
  }

  updateActiveNav(sectionName) {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-section") === sectionName) {
        link.classList.add("active");
      }
    });
  }

  async loadAdminManagement() {
    try {
      // Load admin list
      const response = await fetch("/internal/admin/list", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("authToken") ||
            this.getCookieValue("authToken")
          }`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.populateAdminTable(data.data || []);
      } else {
        console.warn("Failed to load admin list");
        this.showAdminTableError();
      }
    } catch (error) {
      console.error("Error loading admin management:", error);
      this.showAdminTableError();
    }
  }

  // Global function to refresh admin list (called from modal)
  async refreshAdminList() {
    console.log("🔄 Refreshing admin list...");
    await this.loadAdminManagement();
  }

  populateAdminTable(admins) {
    // Store original data and initialize filtering system
    this.originalAdminData = admins || [];
    this.filteredAdminData = [...this.originalAdminData];

    // Update admin statistics
    this.updateAdminStatistics();

    // Apply current filters and sorting
    this.filterAndSortTable();
  }

  showAdminTableError() {
    const tableBody = document.getElementById("adminTableBody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="6" class="loading-text">Failed to load administrators</td></tr>';
    }

    // Reset statistics on error
    const totalAdminsElement = document.getElementById("totalAdminsCount");
    const activeAdminsElement = document.getElementById("activeAdminsCount");

    if (totalAdminsElement) {
      totalAdminsElement.textContent = "0";
    }

    if (activeAdminsElement) {
      activeAdminsElement.textContent = "0";
    }
  }

  updateAdminStatistics() {
    const admins = this.originalAdminData || [];

    // Calculate total admins
    const totalAdmins = admins.length;

    // Calculate active admins (account.isActive.value = true)
    const activeAdmins = admins.filter(
      (admin) =>
        admin.account &&
        admin.account.isActive &&
        admin.account.isActive.value === true
    ).length;

    // Update the display
    const totalAdminsElement = document.getElementById("totalAdminsCount");
    const activeAdminsElement = document.getElementById("activeAdminsCount");

    if (totalAdminsElement) {
      totalAdminsElement.textContent = totalAdmins.toLocaleString();
    }

    if (activeAdminsElement) {
      activeAdminsElement.textContent = activeAdmins.toLocaleString();
    }

    console.log(
      `📊 Admin Statistics Updated: Total: ${totalAdmins}, Active: ${activeAdmins}`
    );
  }

  // Admin Table Search, Filter, and Sort Functionality
  initializeTableControls() {
    console.log("🔧 Initializing table controls...");

    // Store original admin data for filtering
    this.originalAdminData = [];
    this.filteredAdminData = [];
    this.currentSort = { field: null, direction: "asc" };

    // Setup search input
    const searchInput = document.getElementById("adminSearchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        this.debounce(() => {
          this.filterAndSortTable();
        }, 300)
      );
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        this.filterAndSortTable();
      });
    }

    // Setup filter dropdowns
    const statusFilter = document.getElementById("statusFilter");
    const roleFilter = document.getElementById("roleFilter");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");

    if (statusFilter) {
      statusFilter.addEventListener("change", () => {
        this.filterAndSortTable();
      });
    }

    if (roleFilter) {
      roleFilter.addEventListener("change", () => {
        this.filterAndSortTable();
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => {
        this.resetFilters();
      });
    }

    // Setup sortable headers
    const sortableHeaders = document.querySelectorAll(".sortable");
    sortableHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const sortField = header.getAttribute("data-sort");
        this.sortTable(sortField);
      });
    });

    console.log("✅ Table controls initialized");
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  renderAdminTable(admins) {
    const tableBody = document.getElementById("adminTableBody");
    if (!tableBody) return;

    if (admins.length === 0) {
      const searchTerm =
        document.getElementById("adminSearchInput")?.value || "";
      const hasFilters =
        document.getElementById("statusFilter")?.value ||
        document.getElementById("roleFilter")?.value;

      if (searchTerm || hasFilters) {
        tableBody.innerHTML =
          '<tr><td colspan="6" class="loading-text">No administrators match your search criteria</td></tr>';
      } else {
        tableBody.innerHTML =
          '<tr><td colspan="6" class="loading-text">No administrators found</td></tr>';
      }
      this.updateTableInfo(0, this.originalAdminData.length);
      return;
    }

    const searchTerm =
      document.getElementById("adminSearchInput")?.value?.toLowerCase() || "";

    tableBody.innerHTML = admins
      .map((admin) => {
        let nameHtml = `${this.escapeHtml(admin.title || "")} ${this.escapeHtml(
          admin.names || ""
        )} ${this.escapeHtml(admin.surname || "")}`;
        let emailHtml = this.escapeHtml(
          admin.accessDetails?.email || admin.email || ""
        );
        let roleHtml = this.escapeHtml(
          this.getRoleDisplayName(admin.roles?.[0] || admin.role || "Admin")
        );

        // Highlight search terms
        if (searchTerm) {
          nameHtml = this.highlightSearchTerm(nameHtml, searchTerm);
          emailHtml = this.highlightSearchTerm(emailHtml, searchTerm);
          roleHtml = this.highlightSearchTerm(roleHtml, searchTerm);
        }

        const isActive = admin.account?.isActive?.value ?? admin.active ?? true;
        const lastLogin =
          admin.accessDetails?.lastLogin?.length > 0
            ? new Date(
                admin.accessDetails.lastLogin[
                  admin.accessDetails.lastLogin.length - 1
                ]
              ).toLocaleDateString()
            : admin.lastLogin
            ? new Date(admin.lastLogin).toLocaleDateString()
            : "Never";

        return `
        <tr>
          <td>${nameHtml}</td>
          <td>${emailHtml}</td>
          <td><span class="role-badge">${roleHtml}</span></td>
          <td><span class="status-badge ${isActive ? "active" : "inactive"}">${
          isActive ? "Active" : "Inactive"
        }</span></td>
          <td>${lastLogin}</td>
          <td>
            <button class="btn-icon" onclick="adminDashboard.editAdmin('${
              admin.id || ""
            }')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon" onclick="adminDashboard.toggleAdminStatus('${
              admin.id || ""
            }', ${isActive})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${
                  isActive
                    ? '<path d="M18 6L6 18M6 6l12 12"></path>'
                    : '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                }
              </svg>
            </button>
          </td>
        </tr>
        `;
      })
      .join("");

    this.updateTableInfo(admins.length, this.originalAdminData.length);
  }

  highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  getRoleDisplayName(role) {
    const roleMap = {
      internalRootAdmin: "Root Admin",
      internalSuperAdmin: "Super Admin",
      internalAdmin: "Admin",
      internalTenantManager: "Tenant Manager",
      internalRespondersManager: "Responders Manager",
      internalAlarmsManager: "Alarms Manager",
    };
    return roleMap[role] || role || "Admin";
  }

  filterAndSortTable() {
    let filtered = [...this.originalAdminData];

    // Apply search filter
    const searchTerm =
      document.getElementById("adminSearchInput")?.value?.toLowerCase() || "";
    if (searchTerm) {
      filtered = filtered.filter((admin) => {
        const name = `${admin.title || ""} ${admin.names || ""} ${
          admin.surname || ""
        }`.toLowerCase();
        const email = (
          admin.accessDetails?.email ||
          admin.email ||
          ""
        ).toLowerCase();
        const role = this.getRoleDisplayName(
          admin.roles?.[0] || admin.role || ""
        ).toLowerCase();

        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          role.includes(searchTerm)
        );
      });
    }

    // Apply status filter
    const statusFilter = document.getElementById("statusFilter")?.value || "";
    if (statusFilter) {
      filtered = filtered.filter((admin) => {
        const isActive = admin.account?.isActive?.value ?? admin.active ?? true;
        return statusFilter === "active" ? isActive : !isActive;
      });
    }

    // Apply role filter
    const roleFilter = document.getElementById("roleFilter")?.value || "";
    if (roleFilter) {
      filtered = filtered.filter((admin) => {
        const adminRole = admin.roles?.[0] || admin.role || "";
        return adminRole === roleFilter;
      });
    }

    // Apply sorting
    if (this.currentSort.field) {
      filtered.sort((a, b) => {
        let aValue = this.getSortValue(a, this.currentSort.field);
        let bValue = this.getSortValue(b, this.currentSort.field);

        if (aValue < bValue)
          return this.currentSort.direction === "asc" ? -1 : 1;
        if (aValue > bValue)
          return this.currentSort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    this.filteredAdminData = filtered;
    this.renderAdminTable(filtered);
  }

  getSortValue(admin, field) {
    switch (field) {
      case "name":
        return `${admin.title || ""} ${admin.names || ""} ${
          admin.surname || ""
        }`.toLowerCase();
      case "email":
        return (admin.accessDetails?.email || admin.email || "").toLowerCase();
      case "role":
        return this.getRoleDisplayName(
          admin.roles?.[0] || admin.role || ""
        ).toLowerCase();
      case "status":
        return admin.account?.isActive?.value ?? admin.active ?? true
          ? "active"
          : "inactive";
      case "lastLogin":
        const lastLogin =
          admin.accessDetails?.lastLogin?.length > 0
            ? admin.accessDetails.lastLogin[
                admin.accessDetails.lastLogin.length - 1
              ]
            : admin.lastLogin;
        return lastLogin ? new Date(lastLogin).getTime() : 0;
      default:
        return "";
    }
  }

  sortTable(field) {
    if (this.currentSort.field === field) {
      // Toggle direction if same field
      this.currentSort.direction =
        this.currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      // New field, default to ascending
      this.currentSort.field = field;
      this.currentSort.direction = "asc";
    }

    // Update UI
    this.updateSortIndicators();

    // Apply sorting
    this.filterAndSortTable();
  }

  updateSortIndicators() {
    // Remove all sort classes
    document.querySelectorAll(".sortable").forEach((header) => {
      header.classList.remove("sort-asc", "sort-desc");
    });

    // Add class to current sort header
    if (this.currentSort.field) {
      const currentHeader = document.querySelector(
        `[data-sort="${this.currentSort.field}"]`
      );
      if (currentHeader) {
        currentHeader.classList.add(`sort-${this.currentSort.direction}`);
      }
    }
  }

  resetFilters() {
    // Clear search
    const searchInput = document.getElementById("adminSearchInput");
    if (searchInput) searchInput.value = "";

    // Reset filter dropdowns
    const statusFilter = document.getElementById("statusFilter");
    const roleFilter = document.getElementById("roleFilter");

    if (statusFilter) statusFilter.value = "";
    if (roleFilter) roleFilter.value = "";

    // Clear sorting
    this.currentSort = { field: null, direction: "asc" };
    this.updateSortIndicators();

    // Refresh table
    this.filterAndSortTable();
  }

  updateTableInfo(showing, total) {
    const infoElement = document.getElementById("tableResultsInfo");
    if (infoElement) {
      if (showing === total) {
        infoElement.textContent = `Showing ${total} administrator${
          total !== 1 ? "s" : ""
        }`;
      } else {
        infoElement.textContent = `Showing ${showing} of ${total} administrator${
          total !== 1 ? "s" : ""
        }`;
      }
    }
  }

  async loadLookupManagement() {
    // Load lookups data and setup functionality
    await this.loadLookups();
    this.setupLookupControls();
    this.updateLookupStats();
  }

  async loadLookups() {
    try {
      console.log("🔄 Loading lookups data from API...");
      const token =
        localStorage.getItem("authToken") || this.getCookieValue("authToken");
      const response = await fetch("/internal/lookup/list", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        console.log(`✅ Loaded ${data.data?.length || 0} lookup records`);
        this.lookupsData = data.data || [];
        this.filteredLookups = [...this.lookupsData];
        this.renderLookupsTable();
        this.updateLookupStats();
      } else {
        throw new Error(data.error || "Failed to load lookups");
      }
    } catch (error) {
      console.error("Error loading lookups:", error);
      this.showError("Failed to load lookups data");
      this.lookupsData = [];
      this.filteredLookups = [];
      this.renderLookupsTable();
    }
  }

  // Refresh lookups data (called by modals after successful creation)
  async refreshLookupsData() {
    console.log("🔄 Refreshing lookups data...");

    // Get the refresh button and show loading state
    const refreshBtn = document.getElementById("refreshLookupsBtn");
    if (refreshBtn) {
      // Store original content
      const originalContent = refreshBtn.innerHTML;

      // Show loading state
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Refreshing...
      `;

      try {
        await this.loadLookups();

        // Show success feedback
        if (window.notifications) {
          window.notifications.success(
            "Success",
            "Lookups data refreshed successfully!"
          );
        } else if (typeof showSuccessSnackbar === "function") {
          showSuccessSnackbar("Lookups data refreshed successfully!");
        }
      } catch (error) {
        console.error("❌ Failed to refresh lookups:", error);

        // Show error feedback
        if (window.notifications) {
          window.notifications.error(
            "Error",
            "Failed to refresh lookups data. Please try again."
          );
        } else if (typeof showErrorSnackbar === "function") {
          showErrorSnackbar(
            "Failed to refresh lookups data. Please try again."
          );
        }
      } finally {
        // Restore button state
        if (refreshBtn) {
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = originalContent;
        }
      }
    } else {
      // Fallback if button not found
      await this.loadLookups();
    }
  }

  setupLookupControls() {
    // Add New Category button
    const addCategoryBtn = document.getElementById("addCategoryBtn");
    if (addCategoryBtn) {
      addCategoryBtn.onclick = () => this.showAddCategoryModal();
    }

    // Add New Sub Category button
    const addSubCategoryBtn = document.getElementById("addSubCategoryBtn");
    if (addSubCategoryBtn) {
      addSubCategoryBtn.onclick = () => this.showAddSubCategoryModal();
    }

    // Add New Lookup button
    const addLookupBtn = document.getElementById("addLookupBtn");
    if (addLookupBtn) {
      addLookupBtn.onclick = () => this.showAddLookupModal();
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshLookupsBtn");
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refreshLookupsData();
    }

    // Search input
    const searchInput = document.getElementById("lookupSearchInput");
    if (searchInput) {
      searchInput.oninput = (e) => this.filterLookups();

      // Clear search button
      const clearSearchBtn = document.getElementById("clearLookupSearchBtn");
      if (clearSearchBtn) {
        clearSearchBtn.onclick = () => {
          searchInput.value = "";
          this.filterLookups();
        };
      }
    }

    // Filter selects
    const categoryFilter = document.getElementById("categoryFilter");
    const statusFilter = document.getElementById("statusFilter");

    if (categoryFilter) {
      categoryFilter.onchange = () => this.filterLookups();
    }

    if (statusFilter) {
      statusFilter.onchange = () => this.filterLookups();
    }

    // Reset filters button
    const resetBtn = document.getElementById("resetLookupFiltersBtn");
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "";
        if (statusFilter) statusFilter.value = "";
        this.filterLookups();
      };
    }

    // Table sorting
    const sortableHeaders = document.querySelectorAll(
      ".lookup-table .sortable"
    );
    sortableHeaders.forEach((header) => {
      header.onclick = () => {
        const sortKey = header.getAttribute("data-sort");
        this.sortLookups(sortKey);
      };
    });
  }

  filterLookups() {
    const searchTerm =
      document.getElementById("lookupSearchInput")?.value.toLowerCase() || "";
    const categoryFilter =
      document.getElementById("categoryFilter")?.value || "";
    const statusFilter = document.getElementById("statusFilter")?.value || "";

    this.filteredLookups = this.lookupsData.filter((lookup) => {
      const matchesSearch =
        !searchTerm ||
        lookup.category.toLowerCase().includes(searchTerm) ||
        lookup.subCategory.toLowerCase().includes(searchTerm) ||
        lookup.description.toLowerCase().includes(searchTerm) ||
        lookup.items.some((item) => item.toLowerCase().includes(searchTerm));

      const matchesCategory =
        !categoryFilter || lookup.category === categoryFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && lookup.active) ||
        (statusFilter === "inactive" && !lookup.active);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.renderLookupsTable();
    this.updateTableInfo();
  }

  sortLookups(sortKey) {
    const isCurrentSort = this.currentSort === sortKey;
    this.sortDirection = isCurrentSort
      ? this.sortDirection === "asc"
        ? "desc"
        : "asc"
      : "asc";
    this.currentSort = sortKey;

    this.filteredLookups.sort((a, b) => {
      let aVal, bVal;

      switch (sortKey) {
        case "category":
          aVal = a.category;
          bVal = b.category;
          break;
        case "subCategory":
          aVal = a.subCategory;
          bVal = b.subCategory;
          break;
        case "itemsCount":
          aVal = a.items.length;
          bVal = b.items.length;
          break;
        case "description":
          aVal = a.description;
          bVal = b.description;
          break;
        case "status":
          aVal = a.active ? "Active" : "Inactive";
          bVal = b.active ? "Active" : "Inactive";
          break;
        case "created":
          aVal = new Date(a.created?.when || 0);
          bVal = new Date(b.created?.when || 0);
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return this.sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    this.renderLookupsTable();
    this.updateSortIcons();
  }

  updateSortIcons() {
    // Reset all sort icons
    document
      .querySelectorAll(".lookup-table .sort-icon svg")
      .forEach((icon) => {
        icon.style.transform = "rotate(0deg)";
        icon.style.opacity = "0.5";
      });

    // Update current sort icon
    const currentHeader = document.querySelector(
      `.lookup-table .sortable[data-sort="${this.currentSort}"]`
    );
    if (currentHeader) {
      const icon = currentHeader.querySelector(".sort-icon svg");
      if (icon) {
        icon.style.opacity = "1";
        icon.style.transform =
          this.sortDirection === "desc" ? "rotate(180deg)" : "rotate(0deg)";
      }
    }
  }

  renderLookupsTable() {
    const tbody = document.getElementById("lookupTableBody");
    if (!tbody) return;

    if (this.filteredLookups.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="color: #94a3b8; margin-bottom: 1rem;">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <p style="color: #64748b; margin: 0;">No lookups found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.filteredLookups
      .map(
        (lookup) => `
      <tr>
        <td>
          <div class="category-badge" style="background: ${this.getCategoryColor(
            lookup.category
          )}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; display: inline-block;">
            ${this.escapeHtml(lookup.category)}
          </div>
        </td>
        <td>
          <strong>${this.escapeHtml(lookup.subCategory)}</strong>
        </td>
        <td class="lookup-items-count">
          ${lookup.items.length}
        </td>
        <td>
          <div class="lookup-description" title="${this.escapeHtml(
            lookup.description
          )}">
            ${this.escapeHtml(lookup.description)}
          </div>
        </td>
        <td>
          <span class="status-badge ${
            lookup.active ? "status-active" : "status-inactive"
          }">
            ${lookup.active ? "Active" : "Inactive"}
          </span>
        </td>
        <td>
          <div class="created-info">
            <div>${this.formatDate(lookup.created?.when)}</div>
            <small style="color: #64748b;">by ${this.escapeHtml(
              lookup.created?.by || "System"
            )}</small>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="window.adminDashboard.viewLookupItems('${
              lookup.id
            }')" title="View Items">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn-icon" onclick="window.adminDashboard.editLookup('${
              lookup.id
            }')" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-danger" onclick="window.adminDashboard.deleteLookup('${
              lookup.id
            }')" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  getCategoryColor(category) {
    const colors = {
      Geography: "#10b981",
      Finance: "#3b82f6",
      Culture: "#8b5cf6",
      System: "#6366f1",
      "User Management": "#f59e0b",
      "User Profile": "#ec4899",
      Business: "#ef4444",
      Healthcare: "#06b6d4",
      Education: "#84cc16",
      Agriculture: "#22c55e",
      "Emergency Response": "#dc2626",
    };
    return colors[category] || "#64748b";
  }

  updateLookupStats() {
    if (!this.lookupsData) return;

    const totalLookups = this.lookupsData.length;
    const categories = new Set(this.lookupsData.map((l) => l.category));
    const subcategories = new Set(
      this.lookupsData.map((l) => `${l.category}-${l.subCategory}`)
    );

    document.getElementById("totalLookups").textContent = totalLookups;
    document.getElementById("totalCategories").textContent = categories.size;
    document.getElementById("totalSubcategories").textContent =
      subcategories.size;
  }

  updateTableInfo() {
    const info = document.getElementById("lookupTableResultsInfo");
    if (info) {
      const total = this.lookupsData.length;
      const showing = this.filteredLookups.length;
      info.textContent = `Showing ${showing} of ${total} lookup${
        total !== 1 ? "s" : ""
      }`;
    }
  }

  formatDate(dateString) {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Action methods for lookup management
  async showAddLookupModal() {
    try {
      console.log("🔧 AdminDashboard: Opening add lookup modal...");

      // Load modal if not already loaded
      await this.loadAddLookupModal();

      // Open the modal
      if (typeof window.openAddLookupModal === "function") {
        await window.openAddLookupModal();
      } else {
        throw new Error("Add lookup modal function not available");
      }
    } catch (error) {
      console.error(
        "❌ AdminDashboard: Failed to show add lookup modal:",
        error
      );

      if (window.notifications) {
        window.notifications.error(
          "Error",
          "Failed to open add lookup modal. Please try again."
        );
      } else if (typeof showErrorSnackbar === "function") {
        showErrorSnackbar("Failed to open add lookup modal. Please try again.");
      } else {
        alert("Failed to open add lookup modal. Please try again.");
      }
    }
  }

  async loadAddLookupModal() {
    try {
      console.log("🔧 Loading Add Lookup modal script...");

      // Check if script is already loaded
      if (document.getElementById("addLookupModalScript")) {
        console.log("✅ Add Lookup modal script already loaded");
        return;
      }

      // Load the modal script
      const script = document.createElement("script");
      script.id = "addLookupModalScript";
      script.src = "/modals/add.lookup.modal/index.js";
      script.async = true;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Add Lookup modal script loaded successfully");
          resolve();
        };
        script.onerror = () => {
          console.error("❌ Failed to load Add Lookup modal script");
          reject(new Error("Failed to load modal script"));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("❌ Error loading Add Lookup modal:", error);
      throw error;
    }
  }

  // Action methods for category management
  async showAddCategoryModal() {
    try {
      console.log("🔧 AdminDashboard: Opening add category modal...");

      // Load modal if not already loaded
      await this.loadAddCategoryModal();

      // Open the modal
      if (typeof window.openAddCategoryModal === "function") {
        await window.openAddCategoryModal();
      } else {
        throw new Error("Add category modal function not available");
      }
    } catch (error) {
      console.error(
        "❌ AdminDashboard: Failed to show add category modal:",
        error
      );

      if (window.notifications) {
        window.notifications.error(
          "Error",
          "Failed to open add category modal. Please try again."
        );
      } else if (typeof showErrorSnackbar === "function") {
        showErrorSnackbar(
          "Failed to open add category modal. Please try again."
        );
      } else {
        alert("Failed to open add category modal. Please try again.");
      }
    }
  }

  async loadAddCategoryModal() {
    try {
      console.log("🔧 Loading Add Category modal script...");

      // Check if script is already loaded
      if (document.getElementById("addCategoryModalScript")) {
        console.log("✅ Add Category modal script already loaded");
        return;
      }

      // Load the modal script
      const script = document.createElement("script");
      script.id = "addCategoryModalScript";
      script.src = "/modals/add.category.modal/index.js";
      script.async = true;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Add Category modal script loaded successfully");
          resolve();
        };
        script.onerror = () => {
          console.error("❌ Failed to load Add Category modal script");
          reject(new Error("Failed to load modal script"));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("❌ Error loading Add Category modal:", error);
      throw error;
    }
  }

  // Action methods for subcategory management
  async showAddSubCategoryModal() {
    try {
      console.log("🔧 AdminDashboard: Opening add subcategory modal...");

      // Load modal if not already loaded
      await this.loadAddSubCategoryModal();

      // Open the modal
      if (typeof window.openAddSubCategoryModal === "function") {
        await window.openAddSubCategoryModal();
      } else {
        throw new Error("Add subcategory modal function not available");
      }
    } catch (error) {
      console.error(
        "❌ AdminDashboard: Failed to show add subcategory modal:",
        error
      );

      if (window.notifications) {
        window.notifications.error(
          "Error",
          "Failed to open add subcategory modal. Please try again."
        );
      } else if (typeof showErrorSnackbar === "function") {
        showErrorSnackbar(
          "Failed to open add subcategory modal. Please try again."
        );
      } else {
        alert("Failed to open add subcategory modal. Please try again.");
      }
    }
  }

  async loadAddSubCategoryModal() {
    try {
      console.log("🔧 Loading Add Sub Category modal script...");

      // Check if script is already loaded
      if (document.getElementById("addSubCategoryModalScript")) {
        console.log("✅ Add Sub Category modal script already loaded");
        return;
      }

      // Load the modal script
      const script = document.createElement("script");
      script.id = "addSubCategoryModalScript";
      script.src = "/modals/add.subcategory.modal/index.js";
      script.async = true;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Add Sub Category modal script loaded successfully");
          resolve();
        };
        script.onerror = () => {
          console.error("❌ Failed to load Add Sub Category modal script");
          reject(new Error("Failed to load modal script"));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("❌ Error loading Add Sub Category modal:", error);
      throw error;
    }
  }

  viewLookupItems(lookupId) {
    const lookup = this.lookupsData.find((l) => l.id === lookupId);
    if (lookup) {
      alert(
        `Items in ${lookup.category} > ${
          lookup.subCategory
        }:\n\n${lookup.items.join("\n")}`
      );
    }
  }

  editLookup(lookupId) {
    alert(`Edit lookup ${lookupId} - Feature coming soon!`);
  }

  async deleteLookup(lookupId) {
    if (
      confirm(
        "Are you sure you want to delete this lookup? This action cannot be undone."
      )
    ) {
      try {
        const token =
          localStorage.getItem("authToken") || this.getCookieValue("authToken");
        const response = await fetch(`/internal/lookup/${lookupId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (data.success) {
          if (window.notifications) {
            window.notifications.success(
              "Success",
              "Lookup deleted successfully"
            );
          } else {
            this.showSuccess("Lookup deleted successfully");
          }
          await this.loadLookups();
        } else {
          throw new Error(data.error || "Failed to delete lookup");
        }
      } catch (error) {
        console.error("Error deleting lookup:", error);
        this.showError("Failed to delete lookup");
      }
    }
  }

  openLookupEditor(lookupType) {
    // Legacy method - replaced by new functionality
    alert(
      `Opening ${lookupType} lookup editor - Feature updated! Use the table actions instead.`
    );
  }

  editAdmin(adminId) {
    // Placeholder for admin editing functionality
    alert(`Editing admin ${adminId} - Feature coming soon!`);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async loadUserInfo() {
    try {
      const response = await fetch("/internal/admin/me", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("authToken") ||
            this.getCookieValue("authToken")
          }`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.currentUser = data.data;

        document.getElementById("userInfo").innerHTML = `
                    <div class="user-name">${this.currentUser.names} ${
          this.currentUser.surname
        }</div>
                    <div class="user-role">${this.currentUser.roles.join(
                      ", "
                    )}</div>
                `;
        console.log("✅ User info loaded successfully");
      } else {
        console.warn(
          `⚠️ User info API returned ${response.status}, using fallback`
        );
        this.setFallbackUserInfo();
      }
    } catch (error) {
      console.warn(
        "⚠️ Error loading user info, using fallback:",
        error.message
      );
      this.setFallbackUserInfo();
    }
  }

  setFallbackUserInfo() {
    document.getElementById("userInfo").innerHTML = `
                <div class="user-name">Test Admin</div>
                <div class="user-role">Internal Admin</div>
            `;
    console.log("ℹ️ Using fallback user info for testing");
  }

  async loadDashboardData() {
    try {
      const token =
        localStorage.getItem("authToken") || this.getCookieValue("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Load admin count
      try {
        const adminResponse = await fetch("/internal/admin/list", { headers });
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          document.getElementById("totalAdmins").textContent =
            adminData.data.length;
        }
      } catch (error) {
        document.getElementById("totalAdmins").textContent = "N/A";
      }

      // Load tenant count
      try {
        const tenantResponse = await fetch("/external/tenant/list", {
          headers,
        });
        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          document.getElementById("totalTenants").textContent =
            tenantData.data.length;
        }
      } catch (error) {
        document.getElementById("totalTenants").textContent = "N/A";
      }

      // Update service requests placeholder
      document.getElementById("serviceRequests").textContent = "0";

      // Add activity entry
      this.addActivityEntry("Dashboard data loaded", "Just now");
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.showError("Failed to load dashboard data");
    }
  }

  addActivityEntry(description, time) {
    const activityList = document.getElementById("activityList");
    const listItem = document.createElement("li");
    listItem.className = "activity-item";
    listItem.innerHTML = `
            <span class="activity-description">${description}</span>
            <span class="activity-time">${time}</span>
        `;
    activityList.appendChild(listItem);
  }

  getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  showError(message, error = null) {
    // Use notification system if available
    if (window.notifications) {
      window.notifications.error("Error", message, { duration: 6000 });
    } else {
      // Fallback to DOM error display
      const main = document.querySelector(".main-content");
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = message;
      main.insertBefore(errorDiv, main.firstChild);
    }

    // Handle authentication errors specifically
    if (error instanceof APIError && error.isAuthError()) {
      error.handleAuthError();
    }
  }

  logout() {
    // Clear all authentication data completely
    localStorage.removeItem("authToken");
    localStorage.removeItem("internalAdminToken");
    localStorage.removeItem("tenantAdminToken");
    localStorage.removeItem("tenantUserToken");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");

    // Clear all cookies
    document.cookie =
      "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie =
      "internalAdminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie =
      "tenantAdminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie =
      "tenantUserToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

    console.log("User logged out - all authentication data cleared");

    // Redirect to home
    window.location.href = "/";
  }

  // Service Info Management Methods
  async loadServiceInfoManagement() {
    try {
      console.log("Loading service info management...");

      // Load service health status
      await this.checkHealth();

      // Update system information
      this.updateSystemInfo();

      // Update last updated timestamp
      this.updateLastUpdated();
    } catch (error) {
      console.error("Error loading service info management:", error);
      this.showError("Failed to load service information");
    }
  }

  async checkHealth() {
    try {
      const response = await fetch("/internal/health");
      const healthStatus = document.getElementById("healthStatus");
      const uptime = document.getElementById("uptime");

      if (response.ok) {
        const data = await response.json();
        healthStatus.textContent = "✅ Healthy";
        healthStatus.className = "info-value status-badge active";

        // Calculate uptime (mock data for now)
        const uptimeHours = Math.floor(Math.random() * 72) + 1;
        uptime.textContent = `${uptimeHours} hours`;
      } else {
        healthStatus.textContent = "❌ Unhealthy";
        healthStatus.className = "info-value status-badge inactive";
        uptime.textContent = "Unknown";
      }
    } catch (error) {
      console.error("Health check failed:", error);
      const healthStatus = document.getElementById("healthStatus");
      healthStatus.textContent = "⚠️ Error";
      healthStatus.className = "info-value status-badge warning";
    }
  }

  updateSystemInfo() {
    // Update service information with current data
    const serviceVersion = document.getElementById("serviceVersion");
    const serviceStatus = document.getElementById("serviceStatus");
    const baseUrl = document.getElementById("baseUrl");

    // These could be loaded from an API in a real implementation
    serviceVersion.textContent = "1.0.0";
    serviceStatus.textContent = "Active";
    serviceStatus.className = "info-value status-badge active";
    baseUrl.textContent = window.location.origin;
  }

  updateLastUpdated() {
    const lastUpdated = document.getElementById("lastUpdated");
    lastUpdated.textContent = new Date().toLocaleString();
  }

  addServiceInfo() {
    console.log("Add service info clicked");
    // This would open a modal to add new service information
    if (window.notifications) {
      window.notifications.info(
        "Feature Coming Soon",
        "Add service info functionality will be available soon."
      );
    } else {
      alert("Add service info functionality coming soon!");
    }
  }

  refreshServiceInfo() {
    console.log("Refresh service info clicked");
    this.loadServiceInfoManagement();
    if (window.notifications) {
      window.notifications.success(
        "Refreshed",
        "Service information has been refreshed."
      );
    }
  }

  editSystemInfo() {
    console.log("Edit system info clicked");
    if (window.notifications) {
      window.notifications.info(
        "Feature Coming Soon",
        "Edit system info functionality will be available soon."
      );
    } else {
      alert("Edit system info functionality coming soon!");
    }
  }

  manageAnnouncements() {
    console.log("Manage announcements clicked");
    if (window.notifications) {
      window.notifications.info(
        "Feature Coming Soon",
        "Manage announcements functionality will be available soon."
      );
    } else {
      alert("Manage announcements functionality coming soon!");
    }
  }

  // User Info Modal Methods
  showUserInfoModal() {
    console.log("Opening user info modal");
    const modal = document.getElementById("userInfoModal");
    if (modal) {
      // Load current user data into modal
      this.populateUserInfoModal();

      // Show modal with animation
      modal.style.display = "flex";
      setTimeout(() => {
        modal.classList.add("show");
      }, 10);

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }
  }

  closeUserInfoModal() {
    console.log("Closing user info modal");
    const modal = document.getElementById("userInfoModal");
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }, 300);
    }
  }

  populateUserInfoModal() {
    // Get current user data (this would typically come from an API)
    const userName = document.querySelector(".user-name").textContent;
    const userRole = document.querySelector(".user-role").textContent;

    // Populate modal fields
    document.getElementById("modalUserName").textContent =
      userName !== "Loading..." ? userName : "Admin User";
    document.getElementById("modalUserEmail").textContent =
      "admin@neighbourguard.co.za";
    document.getElementById("modalUserRole").textContent = userRole;
    document.getElementById("modalUserId").textContent = "ADMIN_LOCAL_TEST";
    document.getElementById("modalAccountType").textContent =
      "Internal Administrator";
    document.getElementById("modalUserStatus").textContent = "Active";
    document.getElementById("modalAccountCreated").textContent =
      new Date().toLocaleDateString();
    document.getElementById("modalLastLogin").textContent =
      new Date().toLocaleString();
    document.getElementById("modalLoginCount").textContent = "1";

    // Calculate session duration
    const sessionStart = Date.now() - Math.random() * 3600000; // Random time up to 1 hour ago
    const duration = Math.floor((Date.now() - sessionStart) / 60000);
    document.getElementById(
      "modalSessionDuration"
    ).textContent = `${duration} minutes`;
    document.getElementById("modalIpAddress").textContent = "127.0.0.1";
  }

  editUserProfile() {
    console.log("Edit user profile clicked");
    if (window.notifications) {
      window.notifications.info(
        "Feature Coming Soon",
        "Edit user profile functionality will be available soon."
      );
    } else {
      alert("Edit user profile functionality coming soon!");
    }
  }

  changePassword() {
    console.log("Change password clicked");
    if (window.notifications) {
      window.notifications.info(
        "Feature Coming Soon",
        "Change password functionality will be available soon."
      );
    } else {
      alert("Change password functionality coming soon!");
    }
  }

  // Notifications Modal Methods
  showNotificationsModal() {
    console.log("Opening notifications modal");
    const modal = document.getElementById("notificationsModal");
    if (modal) {
      // Load notifications data
      this.loadNotifications();

      // Show modal with animation
      modal.style.display = "flex";
      setTimeout(() => {
        modal.classList.add("show");
      }, 10);

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }
  }

  closeNotificationsModal() {
    console.log("Closing notifications modal");
    const modal = document.getElementById("notificationsModal");
    if (modal) {
      modal.classList.remove("show");
      setTimeout(() => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }, 300);
    }
  }

  loadNotifications() {
    // This would typically load from an API
    console.log("Loading notifications...");

    // Initialize filter functionality
    this.initializeNotificationFilters();

    // Update notification count
    this.updateNotificationCount();
  }

  initializeNotificationFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const notificationItems = document.querySelectorAll(".notification-item");

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove active class from all buttons
        filterBtns.forEach((b) => b.classList.remove("active"));
        // Add active class to clicked button
        btn.classList.add("active");

        const filter = btn.getAttribute("data-filter");

        // Show/hide notifications based on filter
        notificationItems.forEach((item) => {
          if (filter === "all") {
            item.style.display = "flex";
          } else if (filter === "unread") {
            item.style.display = item.classList.contains("unread")
              ? "flex"
              : "none";
          } else {
            item.style.display =
              item.getAttribute("data-type") === filter ? "flex" : "none";
          }
        });
      });
    });
  }

  updateNotificationCount() {
    const unreadCount = document.querySelectorAll(
      ".notification-item.unread"
    ).length;
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? "flex" : "none";
    }
  }

  markAsRead(button) {
    const notificationItem = button.closest(".notification-item");
    if (notificationItem) {
      notificationItem.classList.remove("unread");
      this.updateNotificationCount();

      if (window.notifications) {
        window.notifications.success(
          "Marked as Read",
          "Notification marked as read."
        );
      }
    }
  }

  markAllAsRead() {
    const unreadItems = document.querySelectorAll(".notification-item.unread");
    unreadItems.forEach((item) => {
      item.classList.remove("unread");
    });
    this.updateNotificationCount();

    if (window.notifications) {
      window.notifications.success(
        "All Read",
        "All notifications marked as read."
      );
    }
  }

  clearAllNotifications() {
    if (confirm("Are you sure you want to clear all notifications?")) {
      const notificationsList = document.getElementById("notificationsList");
      const emptyState = document.getElementById("notificationsEmpty");

      if (notificationsList && emptyState) {
        notificationsList.style.display = "none";
        emptyState.style.display = "block";
        this.updateNotificationCount();

        if (window.notifications) {
          window.notifications.success(
            "Cleared",
            "All notifications have been cleared."
          );
        }
      }
    }
  }

  viewDetails(button) {
    console.log("View notification details clicked");
    if (window.notifications) {
      window.notifications.info(
        "Feature Coming Soon",
        "Notification details view will be available soon."
      );
    }
  }

  handleEmergency(button) {
    console.log("Handle emergency clicked");
    if (window.notifications) {
      window.notifications.warning(
        "Emergency Alert",
        "Emergency handling functionality will be available soon."
      );
    }
  }

  notificationSettings() {
    console.log("Notification settings clicked");
    if (window.notifications) {
      window.notifications.info(
        "Feature Coming Soon",
        "Notification settings will be available soon."
      );
    }
  }
}

// Global function for inline event handlers
function logout() {
  window.adminDashboard.logout();
}

// Debug function to check sidebar state
function debugSidebar() {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const dashboardLayout = document.querySelector(".dashboard-layout");

  console.log("=== SIDEBAR DEBUG ===");
  console.log("Sidebar element:", sidebar);
  console.log("Sidebar classes:", sidebar ? sidebar.className : "NOT FOUND");
  console.log(
    "Sidebar computed style display:",
    sidebar ? getComputedStyle(sidebar).display : "N/A"
  );
  console.log(
    "Sidebar computed style transform:",
    sidebar ? getComputedStyle(sidebar).transform : "N/A"
  );
  console.log("Sidebar toggle button:", sidebarToggle);
  console.log("Dashboard layout:", dashboardLayout);
  console.log("Window width:", window.innerWidth);
  console.log(
    "LocalStorage sidebarCollapsed:",
    localStorage.getItem("sidebarCollapsed")
  );
  console.log("=====================");
}

// Make debug function available globally
window.debugSidebar = debugSidebar;

// Global function to refresh admin list (for modal use)
window.refreshAdminList = function () {
  if (
    window.adminDashboard &&
    typeof window.adminDashboard.refreshAdminList === "function"
  ) {
    return window.adminDashboard.refreshAdminList();
  } else {
    console.warn("Admin dashboard not available for refresh");
  }
};

// Global function to refresh lookup list (for modal use)
window.refreshLookupList = function () {
  if (
    window.adminDashboard &&
    typeof window.adminDashboard.loadLookups === "function"
  ) {
    return window.adminDashboard.loadLookups();
  } else {
    console.warn("Admin dashboard not available for lookup refresh");
  }
};

// Initialize dashboard
window.adminDashboard = new AdminDashboard();
