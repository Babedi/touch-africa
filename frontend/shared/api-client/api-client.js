// TouchAfrica Backend API Client (ESM)
// Lightweight, dependency-free client using fetch. Works in Node 18+ and browsers.

export class TouchAfricaApiClient {
  constructor({ baseUrl, token, headers = {}, timeout = 30000 } = {}) {
    if (!baseUrl) throw new Error("baseUrl is required");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token || null;
    this.defaultHeaders = { Accept: "application/json", ...headers };
    this.timeout = timeout;
  }

  setToken(token) {
    this.token = token;
  }

  // Internal fetch wrapper with timeout and JSON handling
  async _request(
    method,
    path,
    { params, body, headers = {}, responseType = "json" } = {}
  ) {
    const url = new URL(this.baseUrl + path);
    if (params && typeof params === "object") {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v))
          v.forEach((val) => url.searchParams.append(k, val));
        else url.searchParams.set(k, String(v));
      }
    }

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort("timeout"), this.timeout);

    const hdrs = { ...this.defaultHeaders, ...headers };
    if (this.token) hdrs["Authorization"] = `Bearer ${this.token}`;
    let payload;
    if (body !== undefined && body !== null) {
      if (body instanceof Blob || body instanceof ArrayBuffer) {
        payload = body;
      } else if (typeof body === "string") {
        payload = body;
        hdrs["Content-Type"] = hdrs["Content-Type"] || "text/plain";
      } else {
        payload = JSON.stringify(body);
        hdrs["Content-Type"] = hdrs["Content-Type"] || "application/json";
      }
    }

    const res = await fetch(url, {
      method,
      headers: hdrs,
      body: payload,
      signal: controller.signal,
    });
    clearTimeout(to);

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    let data = null;
    if (responseType === "blob") data = await res.blob();
    else if (responseType === "text") data = await res.text();
    else data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // Generic helpers
  get(path, opts) {
    return this._request("GET", path, opts);
  }
  post(path, opts) {
    return this._request("POST", path, opts);
  }
  put(path, opts) {
    return this._request("PUT", path, opts);
  }
  patch(path, opts) {
    return this._request("PATCH", path, opts);
  }
  delete(path, opts) {
    return this._request("DELETE", path, opts);
  }

  // ========================= Modules =========================
  // General: Service Info
  serviceInfo = {
    get: (params) => this.get("/api/v1/general/service-info", { params }),
    update: (body) => this.put("/api/v1/general/service-info", { body }),
    patch: (body) => this.patch("/api/v1/general/service-info", { body }),
    search: (params) =>
      this.get("/api/v1/general/service-info/search", { params }),
    bulk: (body) => this.post("/api/v1/general/service-info/bulk", { body }),
    export: (params) =>
      this.get("/api/v1/general/service-info/export", { params }),
    stats: (params) =>
      this.get("/api/v1/general/service-info/stats", { params }),
    ping: () => this.get("/api/v1/general/service-info/ping"),
    news: () => this.get("/api/v1/general/service-info/news"),
    tenants: () => this.get("/api/v1/general/tenants"),
    features: () => this.get("/api/v1/general/service-info/features"),
  };

  // Internal: Admins
  admins = {
    login: (body) => this.post("/api/v1/internal/admins/login", { body }),
    logout: () => this.post("/api/v1/internal/admins/logout"),
    create: (body) => this.post("/api/v1/internal/admins", { body }),
    me: () => this.get("/api/v1/internal/admins/me"),
    list: (params) => this.get("/api/v1/internal/admins", { params }),
    search: (params) => this.get("/api/v1/internal/admins/search", { params }),
    bulk: (body) => this.post("/api/v1/internal/admins/bulk", { body }),
    export: (params) => this.get("/api/v1/internal/admins/export", { params }),
    stats: (params) => this.get("/api/v1/internal/admins/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/admins/${id}`),
    update: (id, body) => this.put(`/api/v1/internal/admins/${id}`, { body }),
    patch: (id, body) => this.patch(`/api/v1/internal/admins/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/internal/admins/${id}`),
    activate: (id) => this.put(`/api/v1/internal/admins/${id}/activate`),
    deactivate: (id) => this.put(`/api/v1/internal/admins/${id}/deactivate`),
  };

  // Internal: Permissions
  permissions = {
    create: (body) => this.post("/api/v1/internal/permissions", { body }),
    list: (params) => this.get("/api/v1/internal/permissions", { params }),
    search: (params) =>
      this.get("/api/v1/internal/permissions/search", { params }),
    bulk: (body) => this.post("/api/v1/internal/permissions/bulk", { body }),
    export: (params) =>
      this.get("/api/v1/internal/permissions/export", { params }),
    stats: (params) =>
      this.get("/api/v1/internal/permissions/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/permissions/${id}`),
    update: (id, body) =>
      this.put(`/api/v1/internal/permissions/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/api/v1/internal/permissions/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/internal/permissions/${id}`),
  };

  // Internal: Roles
  roles = {
    create: (body) => this.post("/api/v1/internal/roles", { body }),
    list: (params) => this.get("/api/v1/internal/roles", { params }),
    search: (params) => this.get("/api/v1/internal/roles/search", { params }),
    export: (params) => this.get("/api/v1/internal/roles/export", { params }),
    stats: (params) => this.get("/api/v1/internal/roles/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/roles/${id}`),
    bulk: (body) => this.post("/api/v1/internal/roles/bulk", { body }),
    update: (id, body) => this.put(`/api/v1/internal/roles/${id}`, { body }),
    patch: (id, body) => this.patch(`/api/v1/internal/roles/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/internal/roles/${id}`),
  };

  // Standard Permissions (tenant-agnostic)
  standardPermissions = {
    create: (body) => this.post("/api/v1/standard-permissions", { body }),
    list: (params) => this.get("/api/v1/standard-permissions", { params }),
    search: (params) =>
      this.get("/api/v1/standard-permissions/search", { params }),
    bulk: (body) => this.post("/api/v1/standard-permissions/bulk", { body }),
    export: (params) =>
      this.get("/api/v1/standard-permissions/export", { params }),
    stats: (params) =>
      this.get("/api/v1/standard-permissions/stats", { params }),
    get: (id) => this.get(`/api/v1/standard-permissions/${id}`),
    update: (id, body) =>
      this.put(`/api/v1/standard-permissions/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/api/v1/standard-permissions/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/standard-permissions/${id}`),
  };

  // Standard Roles (tenant-agnostic)
  standardRoles = {
    create: (body) => this.post("/api/v1/standard-roles", { body }),
    list: (params) => this.get("/api/v1/standard-roles", { params }),
    search: (params) => this.get("/api/v1/standard-roles/search", { params }),
    bulk: (body) => this.post("/api/v1/standard-roles/bulk", { body }),
    export: (params) => this.get("/api/v1/standard-roles/export", { params }),
    stats: (params) => this.get("/api/v1/standard-roles/stats", { params }),
    get: (id) => this.get(`/api/v1/standard-roles/${id}`),
    update: (id, body) => this.put(`/api/v1/standard-roles/${id}`, { body }),
    patch: (id, body) => this.patch(`/api/v1/standard-roles/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/standard-roles/${id}`),
  };

  // Standard Role Mappings (tenant-agnostic)
  standardRoleMappings = {
    list: (params) => this.get("/api/v1/standard-role-mappings", { params }),
    search: (params) =>
      this.get("/api/v1/standard-role-mappings/search", { params }),
    bulk: (body) => this.post("/api/v1/standard-role-mappings/bulk", { body }),
    export: (params) =>
      this.get("/api/v1/standard-role-mappings/export", { params }),
    stats: (params) =>
      this.get("/api/v1/standard-role-mappings/stats", { params }),
    update: (body) =>
      this.put("/api/v1/standard-role-mappings/update", { body }),
    reload: () => this.post("/api/v1/standard-role-mappings/reload", {}),
    createSingle: (body) =>
      this.post("/api/v1/standard-role-mappings/single", { body }),
    get: (id) => this.get(`/api/v1/standard-role-mappings/${id}`),
    updateById: (id, body) =>
      this.put(`/api/v1/standard-role-mappings/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/api/v1/standard-role-mappings/${id}`, { body }),
    removeByRole: (roleName) =>
      this.delete(`/api/v1/standard-role-mappings/by-role/${roleName}`),
  };

  // External (Tenant-scoped): Permissions
  externalPermissions = {
    create: (tenantId, body) =>
      this.post(`/api/v1/${tenantId}/permissions`, { body }),
    list: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions`, { params }),
    search: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions/search`, { params }),
    bulk: (tenantId, body) =>
      this.post(`/api/v1/${tenantId}/permissions/bulk`, { body }),
    export: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions/export`, { params }),
    stats: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions/stats`, { params }),
    get: (tenantId, id) => this.get(`/api/v1/${tenantId}/permissions/${id}`),
    update: (tenantId, id, body) =>
      this.put(`/api/v1/${tenantId}/permissions/${id}`, { body }),
    patch: (tenantId, id, body) =>
      this.patch(`/api/v1/${tenantId}/permissions/${id}`, { body }),
    remove: (tenantId, id) =>
      this.delete(`/api/v1/${tenantId}/permissions/${id}`),
  };

  // External: Tenants (backend exposes under /external)
  tenants = {
    create: (body) => this.post("/api/v1/external/tenants", { body }),
    list: (params) => this.get("/api/v1/external/tenants", { params }),
    search: (params) => this.get("/api/v1/external/tenants/search", { params }),
    bulk: (body) => this.post("/api/v1/external/tenants/bulk", { body }),
    export: (params) => this.get("/api/v1/external/tenants/export", { params }),
    stats: (params) => this.get("/api/v1/external/tenants/stats", { params }),
    get: (id) => this.get(`/api/v1/external/tenants/${id}`),
    update: (id, body) => this.put(`/api/v1/external/tenants/${id}`, { body }),
    patch: (id, body) => this.patch(`/api/v1/external/tenants/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/external/tenants/${id}`),
  };

  // Internal: Persons
  persons = {
    create: (body) => this.post("/api/v1/internal/persons", { body }),
    list: (params) => this.get("/api/v1/internal/persons", { params }),
    search: (params) => this.get("/api/v1/internal/persons/search", { params }),
    bulk: (body) => this.post("/api/v1/internal/persons/bulk", { body }),
    export: (params) => this.get("/api/v1/internal/persons/export", { params }),
    stats: (params) => this.get("/api/v1/internal/persons/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/persons/${id}`),
    update: (id, body) => this.put(`/api/v1/internal/persons/${id}`, { body }),
    patch: (id, body) => this.patch(`/api/v1/internal/persons/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/internal/persons/${id}`),
  };

  // Internal: Lookups
  lookups = {
    create: (body) => this.post("/api/v1/internal/lookups", { body }),
    list: (params) => this.get("/api/v1/internal/lookups", { params }),
    search: (params) => this.get("/api/v1/internal/lookups/search", { params }),
    bulk: (body) => this.post("/api/v1/internal/lookups/bulk", { body }),
    export: (params) => this.get("/api/v1/internal/lookups/export", { params }),
    stats: (params) => this.get("/api/v1/internal/lookups/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/lookups/${id}`),
    update: (id, body) => this.put(`/api/v1/internal/lookups/${id}`, { body }),
    patch: (id, body) => this.patch(`/api/v1/internal/lookups/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/internal/lookups/${id}`),
  };

  // Internal: Lookup Categories
  lookupCategories = {
    create: (body) => this.post("/api/v1/internal/lookup-categories", { body }),
    list: (params) =>
      this.get("/api/v1/internal/lookup-categories", { params }),
    search: (params) =>
      this.get("/api/v1/internal/lookup-categories/search", { params }),
    query: (params) =>
      this.get("/api/v1/internal/lookup-categories/query", { params }),
    export: (params) =>
      this.get("/api/v1/internal/lookup-categories/export", { params }),
    stats: (params) =>
      this.get("/api/v1/internal/lookup-categories/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/lookup-categories/${id}`),
    exists: (id) => this.get(`/api/v1/internal/lookup-categories/${id}/exists`),
    update: (id, body) =>
      this.put(`/api/v1/internal/lookup-categories/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/api/v1/internal/lookup-categories/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/internal/lookup-categories/${id}`),
    bulk: (body) =>
      this.post("/api/v1/internal/lookup-categories/bulk", { body }),
  };

  // Internal: Lookup Sub-Categories
  lookupSubCategories = {
    create: (body) =>
      this.post("/api/v1/internal/lookup-sub-categories", { body }),
    list: (params) =>
      this.get("/api/v1/internal/lookup-sub-categories", { params }),
    search: (params) =>
      this.get("/api/v1/internal/lookup-sub-categories/search", { params }),
    query: (params) =>
      this.get("/api/v1/internal/lookup-sub-categories/query", { params }),
    export: (params) =>
      this.get("/api/v1/internal/lookup-sub-categories/export", { params }),
    stats: (params) =>
      this.get("/api/v1/internal/lookup-sub-categories/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/lookup-sub-categories/${id}`),
    exists: (id) =>
      this.get(`/api/v1/internal/lookup-sub-categories/${id}/exists`),
    update: (id, body) =>
      this.put(`/api/v1/internal/lookup-sub-categories/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/api/v1/internal/lookup-sub-categories/${id}`, { body }),
    remove: (id) => this.delete(`/api/v1/internal/lookup-sub-categories/${id}`),
    bulk: (body) =>
      this.post("/api/v1/internal/lookup-sub-categories/bulk", { body }),
  };

  // Internal: Service Requests
  serviceRequests = {
    create: (body) => this.post("/api/v1/internal/service-requests", { body }),
    list: (params) => this.get("/api/v1/internal/service-requests", { params }),
    search: (params) =>
      this.get("/api/v1/internal/service-requests/search", { params }),
    bulk: (body) =>
      this.post("/api/v1/internal/service-requests/bulk", { body }),
    export: (params) =>
      this.get("/api/v1/internal/service-requests/export", { params }),
    stats: (params) =>
      this.get("/api/v1/internal/service-requests/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/service-requests/${id}`),
  };

  // Internal: Cultivar Templates
  cultivarTemplates = {
    create: (body) =>
      this.post("/api/v1/internal/cultivar-templates", { body }),
    list: (params) =>
      this.get("/api/v1/internal/cultivar-templates", { params }),
    search: (params) =>
      this.get("/api/v1/internal/cultivar-templates/search", { params }),
    bulk: (body) =>
      this.post("/api/v1/internal/cultivar-templates/bulk", { body }),
    export: (params) =>
      this.get("/api/v1/internal/cultivar-templates/export", { params }),
    stats: (params) =>
      this.get("/api/v1/internal/cultivar-templates/stats", { params }),
    get: (id) => this.get(`/api/v1/internal/cultivar-templates/${id}`),
  };

  // External: Tenant Admins
  tenantAdmins = {
    login: (body) =>
      this.post("/api/v1/external/tenant-admins/login", { body }),
    logout: () => this.post("/api/v1/external/tenant-admins/logout"),
    create: (tenantId, body) =>
      this.post(`/api/v1/external/tenant-admins/${tenantId}`, { body }),
    me: () => this.get("/api/v1/external/tenant-admins/me"),
    list: (tenantId, params) =>
      this.get(`/api/v1/external/tenant-admins/${tenantId}`, { params }),
    search: (tenantId, params) =>
      this.get(`/api/v1/external/tenant-admins/${tenantId}/search`, { params }),
    bulk: (tenantId, body) =>
      this.post(`/api/v1/external/tenant-admins/${tenantId}/bulk`, { body }),
    export: (tenantId, params) =>
      this.get(`/api/v1/external/tenant-admins/${tenantId}/export`, { params }),
    stats: (tenantId, params) =>
      this.get(`/api/v1/external/tenant-admins/${tenantId}/stats`, { params }),
    get: (tenantId, id) =>
      this.get(`/api/v1/external/tenant-admins/${tenantId}/${id}`),
    update: (tenantId, id, body) =>
      this.put(`/api/v1/external/tenant-admins/${tenantId}/${id}`, { body }),
    patch: (tenantId, id, body) =>
      this.patch(`/api/v1/external/tenant-admins/${tenantId}/${id}`, { body }),
    remove: (tenantId, id) =>
      this.delete(`/api/v1/external/tenant-admins/${tenantId}/${id}`),
  };

  // External: Tenant Users
  tenantUsers = {
    login: (body) => this.post("/api/v1/external/tenant-users/login", { body }),
    logout: () => this.post("/api/v1/external/tenant-users/logout"),
    create: (body) => this.post("/api/v1/external/tenant-users", { body }),
    list: (params) => this.get("/api/v1/external/tenant-users", { params }),
    search: (params) =>
      this.get("/api/v1/external/tenant-users/search", { params }),
    bulk: (body) => this.post("/api/v1/external/tenant-users/bulk", { body }),
    export: (params) =>
      this.get("/api/v1/external/tenant-users/export", { params }),
    stats: (params) =>
      this.get("/api/v1/external/tenant-users/stats", { params }),
    get: (id) => this.get(`/api/v1/external/tenant-users/${id}`),
    update: (id, body) =>
      this.put(`/api/v1/external/tenant-users/${id}`, { body }),
    patch: (id, body) =>
      this.patch(`/api/v1/external/tenant-users/${id}`, { body }),
    activate: (id) => this.put(`/api/v1/external/tenant-users/${id}/activate`),
    deactivate: (id) =>
      this.put(`/api/v1/external/tenant-users/${id}/deactivate`),
    remove: (id) => this.delete(`/api/v1/external/tenant-users/${id}`),
  };

  // External: Tenant-Specific Roles
  tenantRoles = {
    create: (tenantId, body) =>
      this.post(`/api/v1/${tenantId}/roles`, { body }),
    list: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/roles`, { params }),
    search: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/roles/search`, { params }),
    bulk: (tenantId, body) =>
      this.post(`/api/v1/${tenantId}/roles/bulk`, { body }),
    export: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/roles/export`, { params }),
    stats: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/roles/stats`, { params }),
    get: (tenantId, id) => this.get(`/api/v1/${tenantId}/roles/${id}`),
    update: (tenantId, id, body) =>
      this.put(`/api/v1/${tenantId}/roles/${id}`, { body }),
    patch: (tenantId, id, body) =>
      this.patch(`/api/v1/${tenantId}/roles/${id}`, { body }),
    remove: (tenantId, id) => this.delete(`/api/v1/${tenantId}/roles/${id}`),
  };

  // External: Tenant-Specific Permissions
  tenantPermissions = {
    create: (tenantId, body) =>
      this.post(`/api/v1/${tenantId}/permissions`, { body }),
    list: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions`, { params }),
    search: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions/search`, { params }),
    bulk: (tenantId, body) =>
      this.post(`/api/v1/${tenantId}/permissions/bulk`, { body }),
    export: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions/export`, { params }),
    stats: (tenantId, params) =>
      this.get(`/api/v1/${tenantId}/permissions/stats`, { params }),
    get: (tenantId, id) => this.get(`/api/v1/${tenantId}/permissions/${id}`),
    update: (tenantId, id, body) =>
      this.put(`/api/v1/${tenantId}/permissions/${id}`, { body }),
    patch: (tenantId, id, body) =>
      this.patch(`/api/v1/${tenantId}/permissions/${id}`, { body }),
    remove: (tenantId, id) =>
      this.delete(`/api/v1/${tenantId}/permissions/${id}`),
  };
}

export default TouchAfricaApiClient;
