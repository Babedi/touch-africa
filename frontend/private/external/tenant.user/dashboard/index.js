// Dashboard functionality
class TenantUserDashboard {
  constructor() {
    this.user = null;
    this.init();
  }

  async init() {
    try {
      await this.loadUser();
      this.setupEventListeners();
      this.hideLoading();
    } catch (error) {
      console.error("Failed to initialize dashboard:", error);
      this.handleError(error);
    }
  }

  async loadUser() {
    const apiClient = new APIClient();

    try {
      console.log("Loading user data from backend...");

      // Check for authentication token
      const token = apiClient.getAuthToken();
      if (!token) {
        console.error("No authentication token found");
        throw new Error("No authentication token found");
      }

      // Fetch fresh user data from backend (not localStorage)
      const userData = await apiClient.fetchCurrentUser();
      console.log("User data from backend:", userData);

      // Validate that we have proper user data
      if (userData && (userData.id || userData.phoneNumber)) {
        // Ensure we have name fields, if not show warning
        if (!userData.title && !userData.names && !userData.surname) {
          console.warn("⚠️ User profile missing name information");
          // Don't redirect, but show warning - user can still use dashboard
        }

        this.user = userData;
        this.updateUserDisplay();
        console.log(
          "✅ User loaded successfully:",
          userData.id || userData.phoneNumber
        );
      } else {
        console.warn("⚠️ No valid user data returned from backend");
        throw new Error("No valid user data found");
      }
    } catch (error) {
      console.error("Error loading user:", error);

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
            "Please log in to access your dashboard",
            { duration: 4000 }
          );
        }

        // Clear any stale auth data
        if (window.apiClient) {
          window.apiClient.clearAuthData();
        }

        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        // Handle other errors
        if (window.notifications) {
          window.notifications.error(
            "Error Loading Dashboard",
            "Unable to load your dashboard. Please try again.",
            { duration: 4000 }
          );
        }

        // Still redirect to home for safety
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    }
  }

  updateUserDisplay() {
    const userNameEl = document.getElementById("userName");
    const userPhoneEl = document.getElementById("userPhone");
    const userCommunityEl = document.getElementById("userCommunity");
    const headerUserNameEl = document.getElementById("headerUserName");

    if (this.user) {
      // Build full name from title, names, and surname
      const nameParts = [];
      if (this.user.title) nameParts.push(this.user.title);
      if (this.user.names) nameParts.push(this.user.names);
      if (this.user.surname) nameParts.push(this.user.surname);

      const fullName = nameParts.join(" ").trim();

      // Only use the full name if we have actual name data
      // Never show phone number in the main display name
      const displayName = fullName || "Community Member";

      if (userNameEl) {
        userNameEl.textContent = displayName;
      }

      console.log("📋 User display updated:", {
        title: this.user.title,
        names: this.user.names,
        surname: this.user.surname,
        displayName: displayName,
      });

      // Update header user name (can show phone for debugging)
      if (headerUserNameEl) {
        headerUserNameEl.textContent = this.user.phoneNumber || "Resident";
      }

      if (userPhoneEl) {
        userPhoneEl.textContent = this.user.phoneNumber || "Not set";
      }

      if (userCommunityEl) {
        userCommunityEl.textContent = this.user.tenantName || "Unknown";
      }
    }
  }

  setupEventListeners() {
    // Logout buttons (sidebar and header)
    const logoutBtn = document.getElementById("logoutBtn");
    const headerLogoutBtn = document.getElementById("headerLogoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.logout());
    }

    if (headerLogoutBtn) {
      headerLogoutBtn.addEventListener("click", () => this.logout());
    }

    // Emergency button
    const emergencyBtn = document.getElementById("emergencyBtn");
    if (emergencyBtn) {
      emergencyBtn.addEventListener("click", () => this.showEmergencyModal());
    }
  }

  showEmergencyModal() {
    const modal = document.getElementById("emergencyModal");
    if (modal) {
      modal.style.display = "flex";
    }
  }

  hideLoading() {
    const loading = document.getElementById("loadingOverlay");
    if (loading) {
      loading.style.display = "none";
    }
  }

  async logout() {
    try {
      const apiClient = new APIClient();
      await apiClient.logout();

      // Clear all authentication data
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies
      document.cookie =
        "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout request fails
      window.location.href = "/";
    }
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
      // For critical errors, still redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    }
  }
}

// Emergency functions
function closeEmergencyModal() {
  const modal = document.getElementById("emergencyModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function triggerEmergency(type) {
  console.log("Emergency triggered:", type);
  // This would integrate with the actual emergency system
  alert(`Emergency alert sent: ${type.toUpperCase()} at risk`);
  closeEmergencyModal();
}

// Sidebar functionality
class SidebarManager {
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
    const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    const topbar = document.querySelector(".dashboard-topbar");

    if (isCollapsed) {
      this.sidebar.classList.add("collapsed");
      if (topbar) {
        topbar.classList.add("collapsed");
      }
    }
  }

  setupEventListeners() {
    // Desktop sidebar toggle
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener("click", () => {
        this.toggleSidebar();
      });
    }

    // Mobile sidebar toggle
    if (this.mobileSidebarToggle) {
      this.mobileSidebarToggle.addEventListener("click", () => {
        this.toggleMobileSidebar();
      });
    }

    // Navigation links
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        this.navigateToSection(section);
        this.setActiveNavItem(link);

        // Close mobile sidebar after navigation
        if (window.innerWidth <= 768) {
          this.closeMobileSidebar();
        }
      });
    });

    // Close mobile sidebar on overlay click
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

    // Handle window resize
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

    // Save preference
    localStorage.setItem("sidebarCollapsed", isCollapsed);
  }

  toggleMobileSidebar() {
    this.sidebar.classList.toggle("mobile-open");
  }

  closeMobileSidebar() {
    this.sidebar.classList.remove("mobile-open");
  }

  navigateToSection(section) {
    // Update page title
    const sectionTitles = {
      dashboard: "Dashboard",
      profile: "My Profile",
      contacts: "Emergency Contacts",
      alerts: "Safety Alerts",
      community: "Community",
      alarms: "Alarm Systems",
      settings: "Settings",
    };

    const title = sectionTitles[section] || "Dashboard";
    if (this.mobileTitle) {
      this.mobileTitle.textContent = title;
    }

    // Update URL hash without scrolling
    history.pushState(null, null, `#${section}`);

    // Show/hide content sections
    this.showSection(section);
  }

  showSection(section) {
    // Hide all sections first
    const sections = document.querySelectorAll('[id$="Section"]');
    sections.forEach((s) => (s.style.display = "none"));

    // Show the selected section
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
      targetSection.style.display = "block";
    } else {
      // If section doesn't exist, show dashboard
      const dashboardSection = document.getElementById("dashboardSection");
      if (dashboardSection) {
        dashboardSection.style.display = "block";
      }
    }
  }

  setActiveNavItem(activeLink = null) {
    // Remove active class from all nav links
    this.navLinks.forEach((link) => link.classList.remove("active"));

    if (activeLink) {
      // Set the clicked link as active
      activeLink.classList.add("active");
    } else {
      // Set active based on current hash or default to dashboard
      const currentHash = window.location.hash.substring(1) || "dashboard";
      const currentLink = document.querySelector(
        `[data-section="${currentHash}"]`
      );
      if (currentLink) {
        currentLink.classList.add("active");
      } else {
        // Default to dashboard
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
    // Handle initial page load
    const currentHash = window.location.hash.substring(1) || "dashboard";
    this.navigateToSection(currentHash);

    // Handle browser back/forward
    window.addEventListener("popstate", () => {
      const section = window.location.hash.substring(1) || "dashboard";
      this.navigateToSection(section);
      this.setActiveNavItem();
    });
  }

  // Load sidebar state from localStorage
  loadSidebarState() {
    const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (isCollapsed && window.innerWidth > 768) {
      this.sidebar.classList.add("collapsed");
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new TenantUserDashboard();
  new SidebarManager();
});

// Handle escape key for emergency modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeEmergencyModal();
  }
});
