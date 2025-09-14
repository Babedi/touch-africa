// Simple Router for TouchAfrica SPA
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.defaultRoute = "/";
    this.notFoundHandler = null;
  }

  // Add a route
  addRoute(path, handler, options = {}) {
    this.routes[path] = {
      handler,
      requiresAuth: options.requiresAuth || false,
      roles: options.roles || [],
      title: options.title || "",
      beforeEnter: options.beforeEnter || null,
      afterEnter: options.afterEnter || null,
    };
    return this;
  }

  // Set default route
  setDefault(path) {
    this.defaultRoute = path;
    return this;
  }

  // Set 404 handler
  setNotFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  // Navigate to a route
  navigate(path, pushState = true) {
    const route = this.routes[path];

    if (!route) {
      if (this.notFoundHandler) {
        this.notFoundHandler(path);
      } else {
        console.warn(`Route not found: ${path}`);
        this.navigate(this.defaultRoute, false);
      }
      return;
    }

    // Check authentication
    if (route.requiresAuth && !this.isAuthenticated()) {
      this.navigate("/login", pushState);
      return;
    }

    // Check roles
    if (route.roles.length > 0 && !this.hasRequiredRole(route.roles)) {
      this.navigate("/unauthorized", pushState);
      return;
    }

    // Execute beforeEnter hook
    if (route.beforeEnter) {
      const result = route.beforeEnter(path);
      if (result === false) {
        return; // Prevent navigation
      }
    }

    // Update browser history
    if (pushState && path !== window.location.pathname) {
      history.pushState({ path }, route.title, path);
    }

    // Update page title
    if (route.title) {
      document.title = route.title;
    }

    // Execute route handler
    this.currentRoute = path;
    route.handler(path);

    // Execute afterEnter hook
    if (route.afterEnter) {
      route.afterEnter(path);
    }
  }

  // Go back
  back() {
    history.back();
  }

  // Go forward
  forward() {
    history.forward();
  }

  // Reload current route
  reload() {
    if (this.currentRoute) {
      this.navigate(this.currentRoute, false);
    }
  }

  // Get current route
  getCurrentRoute() {
    return this.currentRoute;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return window.authService ? window.authService.isAuthenticated() : false;
  }

  // Check if user has required role
  hasRequiredRole(requiredRoles) {
    if (!window.authService) return false;
    const userRole = window.authService.getUserRole();
    return requiredRoles.includes(userRole);
  }

  // Initialize router
  init() {
    // Handle browser back/forward buttons
    window.addEventListener("popstate", (event) => {
      const path = event.state?.path || window.location.pathname;
      this.navigate(path, false);
    });

    // Handle initial route
    const initialPath = window.location.pathname;
    this.navigate(initialPath, false);

    return this;
  }

  // Utility method to extract route parameters
  extractParams(pattern, path) {
    const params = {};
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(":")) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        return null;
      }
    }

    return params;
  }

  // Add route with parameters
  addParamRoute(pattern, handler, options = {}) {
    const paramRoute = {
      pattern,
      handler,
      requiresAuth: options.requiresAuth || false,
      roles: options.roles || [],
      title: options.title || "",
      beforeEnter: options.beforeEnter || null,
      afterEnter: options.afterEnter || null,
    };

    // Store as special param route
    if (!this.paramRoutes) {
      this.paramRoutes = [];
    }
    this.paramRoutes.push(paramRoute);
    return this;
  }

  // Enhanced navigate method to handle param routes
  navigateEnhanced(path, pushState = true) {
    // First try exact match
    if (this.routes[path]) {
      return this.navigate(path, pushState);
    }

    // Try parameter routes
    if (this.paramRoutes) {
      for (const route of this.paramRoutes) {
        const params = this.extractParams(route.pattern, path);
        if (params !== null) {
          // Check authentication and roles
          if (route.requiresAuth && !this.isAuthenticated()) {
            this.navigate("/login", pushState);
            return;
          }

          if (route.roles.length > 0 && !this.hasRequiredRole(route.roles)) {
            this.navigate("/unauthorized", pushState);
            return;
          }

          // Execute beforeEnter hook
          if (route.beforeEnter) {
            const result = route.beforeEnter(path, params);
            if (result === false) {
              return;
            }
          }

          // Update browser history
          if (pushState && path !== window.location.pathname) {
            history.pushState({ path }, route.title, path);
          }

          // Update page title
          if (route.title) {
            document.title = route.title;
          }

          // Execute route handler with params
          this.currentRoute = path;
          route.handler(path, params);

          // Execute afterEnter hook
          if (route.afterEnter) {
            route.afterEnter(path, params);
          }

          return;
        }
      }
    }

    // No route found
    if (this.notFoundHandler) {
      this.notFoundHandler(path);
    } else {
      console.warn(`Route not found: ${path}`);
      this.navigate(this.defaultRoute, false);
    }
  }
}

// Create global router instance
window.router = new Router();

// Helper function to navigate (can be used globally)
window.navigateTo = (path) => {
  window.router.navigateEnhanced(path);
};

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = Router;
}
