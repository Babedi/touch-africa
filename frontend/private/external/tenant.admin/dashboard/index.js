// Tenant Admin Dashboard functionality
class TenantAdminDashboard {
  constructor() {
    this.admin = null;
    this.init();
  }

  async init() {
    try {
      await this.loadAdmin();
      this.setupEventListeners();
      this.loadDashboardData();
    } catch (error) {
      console.error("Failed to initialize admin dashboard:", error);
      this.handleError(error);
    }
  }

  async loadAdmin() {
    const apiClient = new APIClient();
    try {
      console.log("Loading admin data from backend...");

      // Check for authentication token
      const token = apiClient.getAuthToken();
      if (!token) {
        console.error("No authentication token found");
        if (window.notifications) {
          window.notifications.error("Session Expired", "Please login again.", {
            duration: 5000,
          });
        }
        window.location.href = "/";
        return;
      }

      // Fetch fresh admin data from backend (not localStorage)
      const adminData = await apiClient.fetchCurrentUser();
      console.log("Admin data from backend:", adminData);

      // Validate that we have proper admin data with required fields
      if (adminData && (adminData.id || adminData.email)) {
        // Check for name fields (title, names, surname)
        const hasTitle = adminData.title && adminData.title.trim();
        const hasNames = adminData.names && adminData.names.trim();
        const hasSurname = adminData.surname && adminData.surname.trim();

        console.log("📋 Name field check:", {
          title: hasTitle ? adminData.title : "Missing",
          names: hasNames ? adminData.names : "Missing",
          surname: hasSurname ? adminData.surname : "Missing",
        });

        if (!hasTitle && !hasNames && !hasSurname) {
          console.warn("⚠️ Admin profile missing name information");
          if (window.notifications) {
            window.notifications.warning(
              "Profile Incomplete",
              "Your profile is missing name information. Please contact your administrator to complete your profile.",
              { duration: 10000 }
            );
          }
        }

        this.admin = adminData;
        this.updateAdminDisplay();
        console.log(
          "✅ Admin loaded successfully:",
          adminData.id || adminData.email
        );
      } else {
        console.error("No valid admin data returned from backend");
        if (window.notifications) {
          window.notifications.error(
            "Profile Error",
            "Failed to load profile data. Please login again.",
            { duration: 5000 }
          );
        }
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error loading admin:", error);

      // Handle authentication errors with proper user feedback
      if (
        error.status === 401 ||
        error.status === 403 ||
        error.message?.includes("Authentication") ||
        error.message?.includes("authentication") ||
        error.message?.includes("token") ||
        error.data?.error?.includes("Authentication") ||
        error.data?.message?.includes("authentication")
      ) {
        // Show authentication error via snackbar
        if (window.notifications) {
          window.notifications.error(
            "Authentication Required",
            "Please log in to access your admin dashboard",
            { duration: 4000 }
          );
        }

        // Clear any stale auth data
        if (window.apiClient) {
          window.apiClient.clearAuthData();
        }
      } else {
        // Handle other errors
        if (window.notifications) {
          window.notifications.error(
            "Error Loading Dashboard",
            "Failed to load admin data. Please try again.",
            { duration: 5000 }
          );
        }
      }

      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  }

  updateAdminDisplay() {
    // Update top bar admin info
    const userNameEl = document.getElementById("userName");
    if (userNameEl && this.admin) {
      // Build full name from title, names, and surname
      const nameParts = [];
      if (this.admin.title) nameParts.push(this.admin.title);
      if (this.admin.names) nameParts.push(this.admin.names);
      if (this.admin.surname) nameParts.push(this.admin.surname);

      const fullName = nameParts.join(" ").trim();

      // Only use the full name if we have actual name data
      // Never show email in the display name
      const displayName = fullName || "Administrator";
      userNameEl.textContent = displayName;

      console.log("📋 Admin display updated:", {
        title: this.admin.title,
        names: this.admin.names,
        surname: this.admin.surname,
        displayName: displayName,
      });
    }

    // Update sidebar admin info (legacy support) - can show email for debugging
    const adminNameEl = document.getElementById("adminName");
    if (adminNameEl && this.admin) {
      adminNameEl.textContent = this.admin.email || "Admin";
    }

    // Update header admin info (legacy support) - can show email for debugging
    const headerAdminNameEl = document.getElementById("headerAdminName");
    if (headerAdminNameEl && this.admin) {
      headerAdminNameEl.textContent = this.admin.email || "Admin";
    }
  }

  loadDashboardData() {
    // Load real-time dashboard statistics
    console.log("Loading dashboard data...");
  }

  setupEventListeners() {
    const logoutBtn = document.getElementById("logoutBtn");
    const headerLogoutBtn = document.getElementById("headerLogoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", this.logout.bind(this));
    }

    if (headerLogoutBtn) {
      headerLogoutBtn.addEventListener("click", this.logout.bind(this));
    }
  }

  logout() {
    const apiClient = new APIClient();
    apiClient.clearAuthData();
    window.location.href = "/";
  }

  handleError(error) {
    console.error("Dashboard error:", error);

    // Handle API errors with notifications
    if (error instanceof APIError) {
      if (error.isAuthError()) {
        error.handleAuthError();
      } else {
        // Show general error notification
        if (window.notifications) {
          window.notifications.error(
            "Error",
            error.message || "An unexpected error occurred",
            { duration: 5000 }
          );
        }
      }
    } else {
      // Handle non-API errors
      if (window.notifications) {
        window.notifications.error(
          "Error",
          error.message || "An unexpected error occurred",
          { duration: 5000 }
        );
      }
    }
  }
}

// Sidebar functionality for tenant admin
class AdminSidebarManager {
  constructor() {
    this.sidebar = document.getElementById("sidebar");
    this.sidebarToggle = document.getElementById("sidebarToggle");
    this.mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
    this.navLinks = document.querySelectorAll(".nav-link");
    this.mobileTitle = document.querySelector(".mobile-title");

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeSidebarState();
    this.handleRouting();
    this.setActiveNavItem();
  }

  initializeSidebarState() {
    // Restore sidebar state from localStorage
    const isCollapsed =
      localStorage.getItem("adminSidebarCollapsed") === "true";
    const topbar = document.querySelector(".dashboard-topbar");

    if (isCollapsed) {
      this.sidebar.classList.add("collapsed");
      if (topbar) {
        topbar.classList.add("collapsed");
      }
    }
  }

  setupEventListeners() {
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    if (this.mobileSidebarToggle) {
      this.mobileSidebarToggle.addEventListener("click", () => {
        this.toggleMobileSidebar();
      });
    }

    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        this.navigateToSection(section);
        this.setActiveNavItem(link);

        if (window.innerWidth <= 768) {
          this.closeMobileSidebar();
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 768 &&
        !this.sidebar.contains(e.target) &&
        !this.mobileSidebarToggle.contains(e.target) &&
        this.sidebar.classList.contains("mobile-open")
      ) {
        this.closeMobileSidebar();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        this.sidebar.classList.remove("mobile-open");
      }
    });
  }

  toggleSidebar() {
    this.sidebar.classList.toggle("collapsed");
    const isCollapsed = this.sidebar.classList.contains("collapsed");

    // Also toggle the topbar position
    const topbar = document.querySelector(".dashboard-topbar");
    if (topbar) {
      topbar.classList.toggle("collapsed", isCollapsed);
    }

    localStorage.setItem("adminSidebarCollapsed", isCollapsed);
  }

  toggleMobileSidebar() {
    this.sidebar.classList.toggle("mobile-open");
  }

  closeMobileSidebar() {
    this.sidebar.classList.remove("mobile-open");
  }

  navigateToSection(section) {
    const sectionTitles = {
      dashboard: "Admin Dashboard",
      users: "User Management",
      alarms: "Alarm Systems",
      responders: "Responders",
      reports: "Reports",
      notifications: "Notifications",
      settings: "Settings",
    };

    const title = sectionTitles[section] || "Admin Dashboard";
    if (this.mobileTitle) {
      this.mobileTitle.textContent = title;
    }

    history.pushState(null, null, `#${section}`);
    this.showSection(section);
  }

  showSection(section) {
    const sections = document.querySelectorAll('[id$="Section"]');
    sections.forEach((s) => (s.style.display = "none"));

    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
      targetSection.style.display = "block";
    } else {
      const dashboardSection = document.getElementById("dashboardSection");
      if (dashboardSection) {
        dashboardSection.style.display = "block";
      }
    }
  }

  setActiveNavItem(activeLink = null) {
    this.navLinks.forEach((link) => link.classList.remove("active"));

    if (activeLink) {
      activeLink.classList.add("active");
    } else {
      const currentHash = window.location.hash.substring(1) || "dashboard";
      const currentLink = document.querySelector(
        `[data-section="${currentHash}"]`
      );
      if (currentLink) {
        currentLink.classList.add("active");
      } else {
        const dashboardLink = document.querySelector(
          '[data-section="dashboard"]'
        );
        if (dashboardLink) {
          dashboardLink.classList.add("active");
        }
      }
    }
  }

  handleRouting() {
    const currentHash = window.location.hash.substring(1) || "dashboard";
    this.navigateToSection(currentHash);

    window.addEventListener("popstate", () => {
      const section = window.location.hash.substring(1) || "dashboard";
      this.navigateToSection(section);
      this.setActiveNavItem();
    });
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new TenantAdminDashboard();
  new AdminSidebarManager();
});
