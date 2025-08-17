/**
 * NeighbourGuard™ API Client
 * Centralized API communication with authentication and error handling
 */
class APIClient {
  constructor() {
    this.baseURL = window.location.origin;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Get authentication token for the current user type
   */
  getAuthToken() {
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("internalAdminToken") ||
      localStorage.getItem("tenantAdminToken") ||
      localStorage.getItem("tenantUserToken")
    );
  }

  /**
   * Set authentication token
   */
  setAuthToken(token, userType) {
    if (userType === "internal.admin") {
      localStorage.setItem("internalAdminToken", token);
    } else if (userType === "tenant.admin") {
      localStorage.setItem("tenantAdminToken", token);
    } else if (userType === "tenant.user") {
      localStorage.setItem("tenantUserToken", token);
    } else {
      localStorage.setItem("authToken", token);
    }
    localStorage.setItem("userType", userType);
  }

  /**
   * Get tenant ID from storage
   */
  getTenantId() {
    return localStorage.getItem("tenantId");
  }

  /**
   * Set tenant ID
   */
  setTenantId(tenantId) {
    if (tenantId) {
      localStorage.setItem("tenantId", tenantId);
    } else {
      localStorage.removeItem("tenantId");
    }
  }

  /**
   * Build request headers with authentication
   */
  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = this.getTenantId();
    if (tenantId) {
      headers["x-tenant-id"] = tenantId;
    }

    return headers;
  }

  /**
   * Make HTTP request with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options.headers);

    const config = {
      method: "GET",
      headers,
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    // Enhanced debugging: log the complete request details
    console.log("🔍 DEBUG: Making API request:", {
      url,
      method: config.method,
      headers: config.headers,
      bodyType: typeof config.body,
      bodyContent: config.body || "none",
    });

    try {
      const response = await fetch(url, config);

      // Enhanced debugging: log the response details
      console.log("📡 DEBUG: Response received:", {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
      });

      // Handle different response types
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Log detailed error information for debugging
        console.error("API Request failed:", {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: data,
        });

        const apiError = new APIError(
          data.message ||
            data.error ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );

        // Handle authentication errors automatically
        if (apiError.isAuthError()) {
          // Check for any authentication-related error messages
          const isAuthenticationError =
            data.message === "Insufficient role" ||
            data.error === "Forbidden" ||
            data.error === "Authentication required" ||
            data.message === "No authentication token provided" ||
            (data.message &&
              (data.message.toLowerCase().includes("insufficient") ||
                data.message.toLowerCase().includes("authentication") ||
                data.message.toLowerCase().includes("token"))) ||
            (data.error &&
              (data.error.toLowerCase().includes("forbidden") ||
                data.error.toLowerCase().includes("authentication") ||
                data.error.toLowerCase().includes("token")));

          if (isAuthenticationError) {
            apiError.handleAuthError();
          }
        }

        throw apiError;
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Network or other errors
      throw new APIError("Network error or server unavailable", 0, {
        originalError: error.message,
      });
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, { method: "GET" });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: data,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: data,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  /**
   * Authentication methods
   */
  async loginInternalAdmin(credentials) {
    // Only send fields expected by the backend
    const loginData = {
      email: credentials.email,
      password: credentials.password,
    };

    console.log("Sending login request:", {
      endpoint: "/internal/admin/login",
      email: loginData.email,
      passwordLength: loginData.password?.length || 0,
    });

    const response = await this.post("/internal/admin/login", loginData);
    if (response.success && response.data.token) {
      localStorage.setItem("internalAdminToken", response.data.token);
      localStorage.setItem("userType", "internal.admin");
      localStorage.setItem("user", JSON.stringify(response.data.admin));
    }
    return response;
  }

  async loginTenantAdmin(credentials) {
    console.log("🔍 DEBUG: TenantAdmin login payload:", {
      endpoint: "/external/tenantAdmin/login",
      tenantName: credentials.tenantName,
      email: credentials.email,
      passwordLength: credentials.password ? credentials.password.length : 0,
      hasRememberMe: credentials.hasOwnProperty("rememberMe"),
    });

    // Clean the credentials object - only send what the backend expects
    const cleanCredentials = {
      tenantName: credentials.tenantName,
      email: credentials.email,
      password: credentials.password,
    };

    const response = await this.post(
      "/external/tenantAdmin/login",
      cleanCredentials
    );
    if (response.success && response.data.token) {
      localStorage.setItem("tenantAdminToken", response.data.token);
      localStorage.setItem("userType", "tenant.admin");
      localStorage.setItem("user", JSON.stringify(response.data.user)); // Changed from admin to user
      if (response.data.tenantId) {
        localStorage.setItem("tenantId", response.data.tenantId);
      }
    }
    return response;
  }

  async loginTenantUser(credentials) {
    const response = await this.post("/external/tenantUser/login", credentials);
    if (response.success && response.data.token) {
      localStorage.setItem("tenantUserToken", response.data.token);
      localStorage.setItem("userType", "tenant.user");
      localStorage.setItem("user", JSON.stringify(response.data.user));
      if (response.data.tenantId) {
        localStorage.setItem("tenantId", response.data.tenantId);
      }
    }
    return response;
  }

  // Alias methods for modal compatibility
  async authenticateInternalAdmin(credentials) {
    return this.loginInternalAdmin(credentials);
  }

  async authenticateTenantAdmin(credentials) {
    return this.loginTenantAdmin(credentials);
  }

  async authenticateTenantUser(credentials) {
    return this.loginTenantUser(credentials);
  }

  /**
   * Get tenants by phone number (for multi-tenant users)
   * Note: This is a simplified implementation - in production you'd have a dedicated endpoint
   */
  async getTenantsByPhoneNumber(phoneNumber) {
    try {
      // For now, return empty array since this feature isn't implemented yet
      // In production, you'd call a proper endpoint to find tenants by phone number
      console.log("📞 Mock: Getting tenants for phone number:", phoneNumber);
      return {
        success: true,
        data: [], // Return empty to skip tenant selection
      };
    } catch (error) {
      console.error("Error fetching tenants by phone:", error);
      return {
        success: false,
        data: [],
        message: error.message || "Failed to fetch tenant information",
      };
    }
  }

  /**
   * Logout and clear authentication
   */
  logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("internalAdminToken");
    localStorage.removeItem("tenantAdminToken");
    localStorage.removeItem("tenantUserToken");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  /**
   * Get current user type
   */
  getUserType() {
    return localStorage.getItem("userType");
  }

  /**
   * Get current user data
   */
  getCurrentUser() {
    const userStr = localStorage.getItem("user");

    // Safety checks for malformed data
    if (!userStr || userStr === "undefined" || userStr === "null") {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.warn("⚠️ Failed to parse user data from localStorage:", error);
      // Clear invalid data
      localStorage.removeItem("user");
      return null;
    }
  }

  /**
   * Fetch current user data from backend
   * This ensures we get fresh user data including title, names, surname
   */
  async fetchCurrentUser() {
    try {
      // First get basic authentication info
      const authResponse = await this.get("/internal/whoami");

      if (!authResponse.success || !authResponse.principal) {
        console.warn("⚠️ No authentication data returned from backend");
        return null;
      }

      const basicData = authResponse.principal;
      console.log("🔍 Basic auth data:", basicData);

      // Ensure tenant ID is set in localStorage for header inclusion
      if (basicData.tenantId) {
        this.setTenantId(basicData.tenantId);
        console.log("🔑 Tenant ID set in localStorage:", basicData.tenantId);
      }

      // For tenant admins, fetch full profile data
      if (
        basicData.type === "tenantAdmin" &&
        basicData.id &&
        basicData.tenantId
      ) {
        try {
          const profileUrl = `/external/tenantAdmin/${basicData.tenantId}/${basicData.id}`;
          console.log(
            "🔍 Fetching full tenant admin profile from:",
            profileUrl
          );

          const profileResponse = await this.get(profileUrl);

          if (profileResponse.success && profileResponse.data) {
            // Merge authentication data with profile data
            const fullUserData = {
              ...basicData,
              ...profileResponse.data,
              // Ensure authentication fields are preserved
              id: basicData.id,
              email: basicData.email,
              tenantId: basicData.tenantId,
              roles: basicData.roles,
              type: basicData.type,
            };

            console.log("✅ Full tenant admin profile loaded:", fullUserData);
            localStorage.setItem("user", JSON.stringify(fullUserData));
            return fullUserData;
          } else {
            console.warn(
              "⚠️ Failed to load full tenant admin profile, using basic data"
            );
          }
        } catch (profileError) {
          console.warn(
            "⚠️ Error fetching tenant admin profile:",
            profileError.message
          );
        }
      }

      // For tenant users, fetch full profile data
      if (
        basicData.type === "tenantUser" &&
        basicData.id &&
        basicData.tenantId
      ) {
        try {
          const profileUrl = `/external/tenantUser/${basicData.id}`;
          console.log("🔍 Fetching full tenant user profile from:", profileUrl);

          const profileResponse = await this.get(profileUrl);

          if (profileResponse.success && profileResponse.data) {
            // Merge authentication data with profile data
            const fullUserData = {
              ...basicData,
              ...profileResponse.data,
              // Ensure authentication fields are preserved
              id: basicData.id,
              email: basicData.email,
              tenantId: basicData.tenantId,
              roles: basicData.roles,
              type: basicData.type,
            };

            console.log("✅ Full tenant user profile loaded:", fullUserData);
            localStorage.setItem("user", JSON.stringify(fullUserData));
            return fullUserData;
          } else {
            console.warn(
              "⚠️ Failed to load full tenant user profile, using basic data"
            );
          }
        } catch (profileError) {
          console.warn(
            "⚠️ Error fetching tenant user profile:",
            profileError.message
          );
          console.warn(
            "💡 This usually means the user authenticated but doesn't have a tenant user record."
          );
          console.warn(
            "🔄 Using basic auth data with enhanced fallback profile structure."
          );

          // Enhanced fallback: create a basic profile structure
          const enhancedBasicData = {
            ...basicData,
            // Add missing profile fields with intelligent defaults
            title: null, // Keep null for proper fallback handling
            names: null, // Keep null for proper fallback handling
            surname: null, // Keep null for proper fallback handling
            // Keep existing auth fields
            id: basicData.id,
            email: basicData.email,
            phoneNumber: basicData.phoneNumber,
            tenantId: basicData.tenantId,
            roles: basicData.roles,
            type: basicData.type,
            // Add profile metadata for debugging
            profileSource: "auth-fallback",
            profileComplete: false,
            profileNote: "User authenticated but no tenant user record found",
            fallbackReason: "Missing profile data in Firestore collection",
          };

          console.log(
            "🔄 Enhanced fallback profile created:",
            enhancedBasicData
          );
          localStorage.setItem("user", JSON.stringify(enhancedBasicData));
          return enhancedBasicData;
        }
      }

      // For other user types or if profile fetch failed, use basic auth data
      localStorage.setItem("user", JSON.stringify(basicData));
      return basicData;
    } catch (error) {
      console.error("❌ Failed to fetch current user from backend:", error);
      // If backend fetch fails, fallback to localStorage as last resort
      return this.getCurrentUser();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    const userType = this.getUserType();
    if (!userType) return false;

    try {
      const response = await this.post("/auth/refresh", {
        userType,
        refreshToken: localStorage.getItem("refreshToken"),
      });

      if (response.success && response.data.token) {
        const tokenKey = `${userType.replace(".", "")}Token`;
        localStorage.setItem(tokenKey, response.data.token);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.logout();
    }

    return false;
  }

  /**
   * Clear all authentication data
   */
  clearAuthData() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("internalAdminToken");
    localStorage.removeItem("tenantAdminToken");
    localStorage.removeItem("tenantUserToken");
    localStorage.removeItem("userType");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("userData");
  }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.data = data;
  }

  /**
   * Check if error is due to authentication failure
   */
  isAuthError() {
    // Check status codes and error content
    const isAuthStatus = this.status === 401 || this.status === 403;
    const hasAuthMessage =
      (this.data?.error &&
        (this.data.error.toLowerCase().includes("authentication") ||
          this.data.error.toLowerCase().includes("token") ||
          this.data.error === "Forbidden")) ||
      (this.data?.message &&
        (this.data.message.toLowerCase().includes("authentication") ||
          this.data.message.toLowerCase().includes("token") ||
          this.data.message.toLowerCase().includes("unauthorized"))) ||
      (this.message &&
        (this.message.toLowerCase().includes("authentication") ||
          this.message.toLowerCase().includes("token")));

    return isAuthStatus || hasAuthMessage;
  }

  /**
   * Check if error is due to validation failure
   */
  isValidationError() {
    return this.status === 400 && this.data?.validation;
  }

  /**
   * Get validation errors for form fields
   */
  getValidationErrors() {
    if (this.isValidationError()) {
      return this.data.validation || {};
    }
    return {};
  }

  /**
   * Handle authentication error with notification and redirect
   */
  handleAuthError() {
    // Determine appropriate message based on error type
    let title = "Authentication Required";
    let message = "Please log in to continue";

    if (
      this.data?.error === "Authentication required" ||
      this.data?.message === "No authentication token provided"
    ) {
      title = "Login Required";
      message = "You need to be logged in to access this page";
    } else if (this.data?.error === "Forbidden" || this.status === 403) {
      title = "Access Denied";
      message = "You don't have permission to access this resource";
    }

    // Show notification if notification system is available
    if (window.notifications) {
      window.notifications.error(title, message, { duration: 4000 });
    } else {
      // Fallback to console if notification system not available
      console.warn(`${title}: ${message}`);
    }

    // Clear auth data
    this.clearAuthData();

    // Redirect to home page after a short delay
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }
}

// Create global API client instance
window.apiClient = new APIClient();

// Create global notification system if not already created
if (!window.notifications && typeof NotificationSystem !== "undefined") {
  window.notifications = new NotificationSystem();
}

// Add global error handler for unhandled API errors
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason instanceof APIError && event.reason.isAuthError()) {
    event.preventDefault(); // Prevent default unhandled promise rejection

    // Show notification
    if (window.notifications) {
      window.notifications.error(
        "Access Denied",
        event.reason.message ||
          "You don't have permission to access this resource.",
        { duration: 4000 }
      );
    }

    // Redirect after showing notification
    setTimeout(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== "/") {
        window.location.href = "/";
      }
    }, 1500);
  }
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { APIClient, APIError };
}
