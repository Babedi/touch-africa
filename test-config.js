// Test configuration for dynamic base URL
// This allows tests to work with any server URL (localhost, production, etc.)

export const TEST_CONFIG = {
  // Default to localhost:5000 for backward compatibility
  // Can be overridden by environment variable
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:5000",

  // Helper function to build full URLs
  getUrl(path) {
    return `${this.baseUrl}${path.startsWith("/") ? path : "/" + path}`;
  },

  // Common paths
  paths: {
    login: "/dashboards/internal.admin/login.html",
    dashboard: "/frontend/dashboards/internal.admin/dashboard.html",
    todoModal: "/frontend/temp/todo-modal.html",
    people: "/dashboards/internal.admin/pages/people/people.html",
    admins: "/dashboards/internal.admin/pages/admins/admins.html",
    roles: "/dashboards/internal.admin/pages/roles/roles.html",
    tenants: "/dashboards/internal.admin/pages/tenants/tenants.html",
    lookups: "/dashboards/internal.admin/pages/lookups/lookups.html",
  },
};
