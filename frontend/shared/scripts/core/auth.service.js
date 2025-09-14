// Authentication Service for TouchAfrica
class AuthService {
  constructor() {
    this.token = localStorage.getItem("token");
    this.userRole = localStorage.getItem("userRole");
    this.user = null;
    this.onAuthStateChange = [];
  }

  // Event listeners
  onAuthenticationChange(callback) {
    this.onAuthStateChange.push(callback);
  }

  triggerAuthStateChange() {
    this.onAuthStateChange.forEach((callback) =>
      callback(this.isAuthenticated(), this.user)
    );
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await apiClient.login(credentials);

      if (response.token) {
        this.setAuthData(response.token, response.user, response.role);
        this.triggerAuthStateChange();
        return response;
      }

      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.register(userData);
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  async logout() {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearAuthData();
      this.triggerAuthStateChange();
      this.redirectToLogin();
    }
  }

  async forgotPassword(email) {
    try {
      return await apiClient.forgotPassword(email);
    } catch (error) {
      console.error("Forgot password failed:", error);
      throw error;
    }
  }

  async resetPassword(token, password) {
    try {
      return await apiClient.resetPassword(token, password);
    } catch (error) {
      console.error("Reset password failed:", error);
      throw error;
    }
  }

  // Token management
  setAuthData(token, user, role) {
    this.token = token;
    this.user = user;
    this.userRole = role;

    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role);
    localStorage.setItem("user", JSON.stringify(user));

    apiClient.setToken(token);
  }

  clearAuthData() {
    this.token = null;
    this.user = null;
    this.userRole = null;

    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");

    apiClient.removeToken();
  }

  // User data management
  async getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      if (!this.user) {
        this.user = await apiClient.getCurrentUser();
        localStorage.setItem("user", JSON.stringify(this.user));
      }
      return this.user;
    } catch (error) {
      console.error("Failed to get current user:", error);
      if (error.status === 401) {
        this.logout();
      }
      return null;
    }
  }

  async updateProfile(userData) {
    try {
      const updatedUser = await apiClient.updateProfile(userData);
      this.user = updatedUser;
      localStorage.setItem("user", JSON.stringify(this.user));
      return updatedUser;
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      return await apiClient.changePassword({
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error("Password change failed:", error);
      throw error;
    }
  }

  // Authentication state
  isAuthenticated() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  getUser() {
    if (!this.user && localStorage.getItem("user")) {
      try {
        this.user = JSON.parse(localStorage.getItem("user"));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
    return this.user;
  }

  getUserRole() {
    return this.userRole;
  }

  hasRole(role) {
    return this.userRole === role;
  }

  hasAnyRole(roles) {
    return roles.includes(this.userRole);
  }

  // Authorization checks
  canAccessInternalAdmin() {
    return this.hasRole("internal_admin");
  }

  canAccessTenantAdmin() {
    return this.hasAnyRole(["internal_admin", "tenant_admin"]);
  }

  canAccessTenantUser() {
    return this.hasAnyRole(["internal_admin", "tenant_admin", "tenant_user"]);
  }

  // Navigation helpers
  getDefaultDashboard() {
    switch (this.userRole) {
      case "internal_admin":
        return "/internal.admin/dashboard.html";
      case "tenant_admin":
        return "/tenant.admin/dashboard.html";
      case "tenant_user":
        return "/tenant.user/dashboard.html";
      default:
        return "/public/index.html";
    }
  }

  redirectToLogin() {
    window.location.href = "/public/index.html";
  }

  redirectToDashboard() {
    window.location.href = this.getDefaultDashboard();
  }

  // Route protection
  requireAuthentication() {
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
      return false;
    }
    return true;
  }

  requireRole(requiredRole) {
    if (!this.requireAuthentication()) {
      return false;
    }

    if (!this.hasRole(requiredRole)) {
      this.redirectToDashboard();
      return false;
    }

    return true;
  }

  requireAnyRole(requiredRoles) {
    if (!this.requireAuthentication()) {
      return false;
    }

    if (!this.hasAnyRole(requiredRoles)) {
      this.redirectToDashboard();
      return false;
    }

    return true;
  }

  // Initialize authentication state
  async initialize() {
    if (this.isAuthenticated()) {
      try {
        await this.getCurrentUser();
        this.triggerAuthStateChange();
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        this.clearAuthData();
      }
    }
  }
}

// Create global instance
window.authService = new AuthService();

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  authService.initialize();
});
