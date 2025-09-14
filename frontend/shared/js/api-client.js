/**
 * TouchAfrica Unified API Client
 * Comprehensive HTTP client combining browser compatibility with full API coverage
 * Features: timeout handling, multiple response types, complete endpoint coverage
 */

window.TouchAfrica = window.TouchAfrica || {};

window.TouchAfrica.ApiClient = class ApiClient {
  constructor({
    baseUrl = "/api/v1",
    token = null,
    headers = {},
    timeout = 30000,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token || this.getAuthToken();
    this.defaultHeaders = {
      Accept: "application/json",
      ...headers,
    };
    this.timeout = timeout;
  }

  // Authentication token management
  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  getAuthToken() {
    return localStorage.getItem("authToken");
  }

  // Internal fetch wrapper with timeout and comprehensive handling
  async _request(
    method,
    path,
    { params, body, headers = {}, responseType = "json" } = {}
  ) {
    // Build URL with query parameters
    const url = new URL(this.baseUrl + path, window.location.origin);
    if (params && typeof params === "object") {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((val) => url.searchParams.append(key, String(val)));
        } else {
          url.searchParams.set(key, String(value));
        }
      });
    }

    // Setup timeout control
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort("timeout"),
      this.timeout
    );

    // Prepare headers
    const requestHeaders = { ...this.defaultHeaders, ...headers };
    if (this.token) {
      requestHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    // Prepare body
    let requestBody;
    if (body !== undefined && body !== null) {
      if (
        body instanceof FormData ||
        body instanceof Blob ||
        body instanceof ArrayBuffer
      ) {
        requestBody = body;
        // Don't set Content-Type for FormData, let browser set it with boundary
        if (!(body instanceof FormData) && !requestHeaders["Content-Type"]) {
          requestHeaders["Content-Type"] = "application/octet-stream";
        }
      } else if (typeof body === "string") {
        requestBody = body;
        if (!requestHeaders["Content-Type"]) {
          requestHeaders["Content-Type"] = "text/plain";
        }
      } else {
        requestBody = JSON.stringify(body);
        requestHeaders["Content-Type"] = "application/json";
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response based on type
      const contentType = response.headers.get("content-type") || "";
      let responseData = null;

      if (responseType === "blob") {
        responseData = await response.blob();
      } else if (responseType === "text") {
        responseData = await response.text();
      } else if (responseType === "stream") {
        responseData = response.body;
      } else {
        // Default to JSON with fallback to text
        if (contentType.includes("application/json")) {
          try {
            responseData = await response.json();
          } catch {
            responseData = await response.text();
          }
        } else {
          responseData = await response.text();
        }
      }

      if (!response.ok) {
        const error = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = responseData;
        error.response = response;
        throw error;
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || error.message === "timeout") {
        const timeoutError = new Error(
          `Request timeout after ${this.timeout}ms`
        );
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }
      throw error;
    }
  }

  // Generic HTTP methods
  get(path, options = {}) {
    return this._request("GET", path, options);
  }

  post(path, options = {}) {
    return this._request("POST", path, options);
  }

  put(path, options = {}) {
    return this._request("PUT", path, options);
  }

  patch(path, options = {}) {
    return this._request("PATCH", path, options);
  }

  delete(path, options = {}) {
    return this._request("DELETE", path, options);
  }

  // File upload helper
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append("file", file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    return this._request("POST", endpoint, { body: formData });
  }

  // ========================= API ENDPOINTS =========================

  // General: Service Info
  serviceInfo = {
    get: (params) => this.get("/general/service-info", { params }),
    update: (body) => this.put("/general/service-info", { body }),
    patch: (body) => this.patch("/general/service-info", { body }),
    search: (params) => this.get("/general/service-info/search", { params }),
    bulk: (body) => this.post("/general/service-info/bulk", { body }),
    export: (params) => this.get("/general/service-info/export", { params }),
    stats: (params) => this.get("/general/service-info/stats", { params }),
    ping: () => this.get("/general/service-info/ping"),
    news: () => this.get("/general/service-info/news"),
    tenants: () => this.get("/general/tenants"),
    tenantsMinimal: () => this.get("/api/v1/tenants/minimal"),
    features: () => this.get("/general/service-info/features"),
  };

  // Internal: Admins
  admins = {
    login: (body) => this.post("/internal/admins/login", { body }),
    logout: () => this.post("/internal/admins/logout"),
    create: (body) => this.post("/internal/admins", { body }),
    me: () => this.get("/internal/admins/me"),
    list: (params) => this.get("/internal/admins", { params }),
    search: (params) => this.get("/internal/admins/search", { params }),
    bulk: (body) => this.post("/internal/admins/bulk", { body }),
    export: (params) => this.get("/internal/admins/export", { params }),
    stats: (params) => this.get("/internal/admins/stats", { params }),
    get: (id) => this.get(`/internal/admins/${id}`),
    update: (id, body) => this.put(`/internal/admins/${id}`, { body }),
    patch: (id, body) => this.patch(`/internal/admins/${id}`, { body }),
    remove: (id) => this.delete(`/internal/admins/${id}`),
    activate: (id) => this.put(`/internal/admins/${id}/activate`),
    deactivate: (id) => this.put(`/internal/admins/${id}/deactivate`),
  };

  // Internal: Permissions
  permissions = {
    create: (body) => this.post("/internal/permissions", { body }),
    list: (params) => this.get("/internal/permissions", { params }),
    search: (params) => this.get("/internal/permissions/search", { params }),
    bulk: (body) => this.post("/internal/permissions/bulk", { body }),
    export: (params) => this.get("/internal/permissions/export", { params }),
    stats: (params) => this.get("/internal/permissions/stats", { params }),
    get: (id) => this.get(`/internal/permissions/${id}`),
    update: (id, body) => this.put(`/internal/permissions/${id}`, { body }),
    patch: (id, body) => this.patch(`/internal/permissions/${id}`, { body }),
    remove: (id) => this.delete(`/internal/permissions/${id}`),
  };

  // Internal: Roles
  roles = {
    create: (body) => this.post("/internal/roles", { body }),
    list: (params) => this.get("/internal/roles", { params }),
    search: (params) => this.get("/internal/roles/search", { params }),
    export: (params) => this.get("/internal/roles/export", { params }),
    stats: (params) => this.get("/internal/roles/stats", { params }),
    get: (id) => this.get(`/internal/roles/${id}`),
    bulk: (body) => this.post("/internal/roles/bulk", { body }),
    update: (id, body) => this.put(`/internal/roles/${id}`, { body }),
    patch: (id, body) => this.patch(`/internal/roles/${id}`, { body }),
    remove: (id) => this.delete(`/internal/roles/${id}`),
  };

  // Internal: Persons
  persons = {
    create: (body) => this.post("/internal/persons", { body }),
    list: (params) => this.get("/internal/persons", { params }),
    search: (params) => this.get("/internal/persons/search", { params }),
    bulk: (body) => this.post("/internal/persons/bulk", { body }),
    export: (params) => this.get("/internal/persons/export", { params }),
    stats: (params) => this.get("/internal/persons/stats", { params }),
    get: (id) => this.get(`/internal/persons/${id}`),
    update: (id, body) => this.put(`/internal/persons/${id}`, { body }),
    patch: (id, body) => this.patch(`/internal/persons/${id}`, { body }),
    remove: (id) => this.delete(`/internal/persons/${id}`),
  };

  // Internal: Lookups
  lookups = {
    create: (body) => this.post("/internal/lookups", { body }),
    list: (params) => this.get("/internal/lookups", { params }),
    search: (params) => this.get("/internal/lookups/search", { params }),
    bulk: (body) => this.post("/internal/lookups/bulk", { body }),
    export: (params) => this.get("/internal/lookups/export", { params }),
    stats: (params) => this.get("/internal/lookups/stats", { params }),
    get: (id) => this.get(`/internal/lookups/${id}`),
    update: (id, body) => this.put(`/internal/lookups/${id}`, { body }),
    patch: (id, body) => this.patch(`/internal/lookups/${id}`, { body }),
    remove: (id) => this.delete(`/internal/lookups/${id}`),
  };

  // Internal: Lookup Categories
  lookupCategories = {
    create: (body) => this.post("/internal/lookup-categories", { body }),
    list: (params) => this.get("/internal/lookup-categories", { params }),
    search: (params) =>
      this.get("/internal/lookup-categories/search", { params }),
    query: (params) =>
      this.get("/internal/lookup-categories/query", { params }),
    export: (params) =>
      this.get("/internal/lookup-categories/export", { params }),
    stats: (params) =>
      this.get("/internal/lookup-categories/stats", { params }),
    get: (id) => this.get(`/internal/lookup-categories/${id}`),
    exists: (id) => this.get(`/internal/lookup-categories/${id}/exists`),
    update: (id, body) =>
      this.put(`/internal/lookup-categories/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/internal/lookup-categories/${id}`, { body }),
    remove: (id) => this.delete(`/internal/lookup-categories/${id}`),
    bulk: (body) => this.post("/internal/lookup-categories/bulk", { body }),
  };

  // Internal: Lookup Sub-Categories
  lookupSubCategories = {
    create: (body) => this.post("/internal/lookup-sub-categories", { body }),
    list: (params) => this.get("/internal/lookup-sub-categories", { params }),
    search: (params) =>
      this.get("/internal/lookup-sub-categories/search", { params }),
    query: (params) =>
      this.get("/internal/lookup-sub-categories/query", { params }),
    export: (params) =>
      this.get("/internal/lookup-sub-categories/export", { params }),
    stats: (params) =>
      this.get("/internal/lookup-sub-categories/stats", { params }),
    get: (id) => this.get(`/internal/lookup-sub-categories/${id}`),
    exists: (id) => this.get(`/internal/lookup-sub-categories/${id}/exists`),
    update: (id, body) =>
      this.put(`/internal/lookup-sub-categories/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/internal/lookup-sub-categories/${id}`, { body }),
    remove: (id) => this.delete(`/internal/lookup-sub-categories/${id}`),
    bulk: (body) => this.post("/internal/lookup-sub-categories/bulk", { body }),
  };

  // Internal: Service Requests
  serviceRequests = {
    create: (body) => this.post("/internal/service-requests", { body }),
    list: (params) => this.get("/internal/service-requests", { params }),
    search: (params) =>
      this.get("/internal/service-requests/search", { params }),
    bulk: (body) => this.post("/internal/service-requests/bulk", { body }),
    export: (params) =>
      this.get("/internal/service-requests/export", { params }),
    stats: (params) => this.get("/internal/service-requests/stats", { params }),
    get: (id) => this.get(`/internal/service-requests/${id}`),
  };

  // External: Tenants
  tenants = {
    create: (body) => this.post("/external/tenants", { body }),
    list: (params) => this.get("/external/tenants", { params }),
    search: (params) => this.get("/external/tenants/search", { params }),
    bulk: (body) => this.post("/external/tenants/bulk", { body }),
    export: (params) => this.get("/external/tenants/export", { params }),
    stats: (params) => this.get("/external/tenants/stats", { params }),
    get: (id) => this.get(`/external/tenants/${id}`),
    update: (id, body) => this.put(`/external/tenants/${id}`, { body }),
    patch: (id, body) => this.patch(`/external/tenants/${id}`, { body }),
    remove: (id) => this.delete(`/external/tenants/${id}`),
  };
};

// Create global instance
window.TouchAfrica.api = new window.TouchAfrica.ApiClient();

// Authentication helpers
window.TouchAfrica.auth = {
  login: async (credentials) => {
    try {
      const response = await window.TouchAfrica.api.admins.login(credentials);

      if (response.token) {
        window.TouchAfrica.api.setAuthToken(response.token);
      }

      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  logout: () => {
    window.TouchAfrica.api.setAuthToken(null);
    window.location.href = "/";
  },

  isAuthenticated: () => {
    return !!window.TouchAfrica.api.getAuthToken();
  },

  getCurrentUser: async () => {
    try {
      return await window.TouchAfrica.api.admins.me();
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  },
};

console.log("Unified TouchAfrica API Client initialized");
