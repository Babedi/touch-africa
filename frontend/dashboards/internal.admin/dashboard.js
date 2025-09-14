document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const mql = window.matchMedia("(max-width: 992px)");
  const themeToggle = document.getElementById("themeToggle");
  const themeToggleIcon = document.getElementById("themeToggleIcon");

  function setSidebarOpenMobile(open) {
    if (!mql.matches) return; // only for mobile viewport
    if (open) {
      sidebar?.classList.add("open");
      sidebarOverlay?.classList.add("show");
      document.body.classList.add("noscroll");
    } else {
      sidebar?.classList.remove("open");
      sidebarOverlay?.classList.remove("show");
      document.body.classList.remove("noscroll");
    }
  }

  // Sidebar toggle and overlay click handling
  sidebarToggle?.addEventListener("click", () => {
    if (mql.matches) {
      // Mobile / tablet: open/close overlay drawer
      const isOpen = sidebar?.classList.contains("open");
      setSidebarOpenMobile(!isOpen);
    } else {
      // Desktop: toggle mini collapsed state
      sidebar?.classList.toggle("collapsed");
      try {
        localStorage.setItem(
          "ia_sidebar_collapsed",
          sidebar?.classList.contains("collapsed") ? "1" : "0"
        );
      } catch {}
    }
  });

  sidebarOverlay?.addEventListener("click", () => {
    setSidebarOpenMobile(false);
  });

  // Inject CoreUtils-based table helpers (non-destructive) if present
  (function () {
    const state =
      window.__ROLE_DASH_STATE__ ||
      (window.__ROLE_DASH_STATE__ = {
        rows: [],
        filtered: [],
        sortField: null,
        sortDir: "asc",
      });
    function applyFilter(term) {
      term = (term || "").trim();
      if (window.CoreUtils && window.CoreUtils.table) {
        state.filtered = CoreUtils.table.filter(state.rows, term);
      } else {
        if (!term) {
          state.filtered = state.rows.slice();
          return;
        }
        const lc = term.toLowerCase();
        state.filtered = state.rows.filter((r) =>
          Object.values(r).some(
            (v) => v && String(v).toLowerCase().includes(lc)
          )
        );
      }
    }
    function applySort(field) {
      if (!field) return;
      if (state.sortField === field)
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      else {
        state.sortField = field;
        state.sortDir = "asc";
      }
      if (window.CoreUtils && window.CoreUtils.table) {
        state.filtered = CoreUtils.table.sort(
          state.filtered,
          field,
          state.sortDir
        );
      } else {
        const dir = state.sortDir === "asc" ? 1 : -1;
        state.filtered.sort((a, b) => {
          let av = a[field],
            bv = b[field];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === "number" && typeof bv === "number")
            return (av - bv) * dir;
          av = String(av).toLowerCase();
          bv = String(bv).toLowerCase();
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }
    }
    window.__ROLE_DASH_ENHANCE__ = function (rows) {
      state.rows = (rows || []).slice();
      applyFilter(document.querySelector("#role-search")?.value);
      if (state.sortField) applySort(state.sortField);
      render();
    };
    function render() {
      /* existing render logic retained elsewhere */
    }
  })();

  // Lightweight router to load page fragments into #pageRoot
  const pageRoot = document.getElementById("pageRoot");
  const routes = {
    // Use absolute paths to avoid base URL differences when served from /dashboards or /frontend
    dashboard: "/dashboards/internal.admin/pages/dashboard/dashboard.html",
    people: "/dashboards/internal.admin/pages/people/people.html",
    roles: "/dashboards/internal.admin/pages/roles/roles.html",
    admins: "/dashboards/internal.admin/pages/admins/admins.html",
    templates: "/dashboards/internal.admin/pages/templates/templates.html",
    tenants: "/dashboards/internal.admin/pages/tenants/tenants.html",
    lookups: "/dashboards/internal.admin/pages/lookups/lookups.html",
    settings: "/dashboards/internal.admin/pages/settings/settings.html",
  };

  async function loadPage(key) {
    const url = routes[key] || routes["dashboard"];
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const html = await res.text();
      // Inject and normalize visibility
      pageRoot.innerHTML = html;
      let firstSection = pageRoot.querySelector(".content-section");
      if (!firstSection) {
        // If the fragment has no .content-section wrapper, add one
        pageRoot.innerHTML = `<section class="content-section active">${html}</section>`;
        firstSection = pageRoot.querySelector(".content-section");
      }
      if (firstSection && !firstSection.classList.contains("active"))
        firstSection.classList.add("active");

      // Execute any <script> tags from the fragment and fix their relative paths
      // Resolve relative script src against the fragment directory
      const baseDir = url.slice(0, url.lastIndexOf("/"));
      const scripts = Array.from(pageRoot.querySelectorAll("script"));
      for (const old of scripts) {
        const newScript = document.createElement("script");
        // Copy attributes except src which we may rewrite
        for (const attr of old.attributes) {
          if (attr.name.toLowerCase() === "src") continue;
          newScript.setAttribute(attr.name, attr.value);
        }
        const src = old.getAttribute("src");
        if (src) {
          const isAbs = /^(?:[a-z]+:)?\//i.test(src); // starts with '/' or protocol
          // Compute absolute path relative to fragment's folder when src is relative
          const resolved = isAbs
            ? src
            : new URL(src, window.location.origin + baseDir + "/").pathname;
          newScript.src = resolved + (old.noModule ? "" : "");
        } else {
          newScript.textContent = old.textContent || "";
        }
        // Replace old script to trigger execution
        old.parentNode.replaceChild(newScript, old);
      }

      // Scroll to top for new page
      pageRoot.scrollTop = 0;
    } catch (err) {
      pageRoot.innerHTML = `<div class="card"><div class="card-body"><h3>Failed to load page</h3><div class="text-muted">${url}</div></div></div>`;
    }
  }

  function setActiveNav(key) {
    document.querySelectorAll(".nav-link").forEach((l) => {
      const k = l.getAttribute("data-section");
      l.classList.toggle("active", k === key);
    });
  }

  function navigate(key) {
    if (mql.matches) setSidebarOpenMobile(false);
    history.pushState({ key }, "", `#${key}`);
    setActiveNav(key);
    loadPage(key);
  }

  // Handle clicks on nav
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const key = link.getAttribute("data-section");
      if (!key) return;
      navigate(key);
    });
  });

  // Also close if location hash changes externally (e.g., via anchor) while on mobile
  window.addEventListener("hashchange", () => {
    if (mql.matches) setSidebarOpenMobile(false);
  });

  // Handle back/forward
  window.addEventListener("popstate", (e) => {
    const key =
      (e.state && e.state.key) || location.hash.replace("#", "") || "dashboard";
    setActiveNav(key);
    loadPage(key);
  });

  // Initial load
  const initialKey = location.hash.replace("#", "") || "dashboard";
  setActiveNav(initialKey);
  loadPage(initialKey);

  // Restore desktop collapsed state
  try {
    const saved = localStorage.getItem("ia_sidebar_collapsed");
    if (saved === "1" && !mql.matches) {
      sidebar?.classList.add("collapsed");
    }
  } catch {}

  // Keep class hygiene when crossing breakpoint
  mql.addEventListener("change", (e) => {
    if (e.matches) {
      // Entering mobile: remove desktop collapsed (we use overlay instead)
      sidebar?.classList.remove("collapsed");
    } else {
      // Leaving mobile: ensure overlay state cleared
      sidebar?.classList.remove("open");
      sidebarOverlay?.classList.remove("show");
      document.body.classList.remove("noscroll");
      // Reapply persisted collapsed state
      try {
        const saved = localStorage.getItem("ia_sidebar_collapsed");
        if (saved === "1") sidebar?.classList.add("collapsed");
      } catch {}
    }
  });

  // Theme toggle
  const savedTheme = localStorage.getItem("theme");
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  function applyTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("theme-light", isLight);
    if (themeToggle) themeToggle.setAttribute("aria-pressed", String(isLight));
    if (themeToggleIcon) {
      themeToggleIcon.classList.remove("fa-sun", "fa-moon");
      themeToggleIcon.classList.add(isLight ? "fa-moon" : "fa-sun");
    }
  }
  applyTheme(savedTheme ? savedTheme : prefersLight ? "light" : "dark");
  themeToggle?.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-light")
      ? "dark"
      : "light";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });

  // Account modal
  const accountModal = document.getElementById("accountModal");
  document.getElementById("userButton")?.addEventListener("click", () => {
    accountModal?.classList.add("show");
  });
  document.querySelectorAll("[data-close-modal]")?.forEach((btn) =>
    btn.addEventListener("click", () => {
      accountModal?.classList.remove("show");
    })
  );
  accountModal?.addEventListener("click", (e) => {
    if (e.target === accountModal) accountModal.classList.remove("show");
  });

  // Load current admin and update UI with their name (and email/role where available)
  (async function loadCurrentUser() {
    const token = (() => {
      try {
        return localStorage.getItem("token");
      } catch {
        return null;
      }
    })();

    /**
     * Convert role code to human-readable role name
     * Uses shared utility if available, otherwise uses local fallback
     */
    function formatRoleName(roles) {
      if (window.TouchAfrica?.utils?.formatRoleName) {
        return window.TouchAfrica.utils.formatRoleName(roles, {
          compact: true,
        });
      }

      // Local fallback mapping
      const ROLE_DISPLAY_MAPPINGS = {
        // Modern role codes
        INTERNAL_ROOT_ADMIN: "Internal Root Admin",
        INTERNAL_SUPER_ADMIN: "Internal Super Admin",
        INTERNAL_STANDARD_ADMIN: "Internal Standard Admin",
        EXTERNAL_SUPER_ADMIN: "External Super Admin",
        EXTERNAL_STANDARD_ADMIN: "External Standard Admin",
        LOOKUP_MANAGER: "Lookup Manager",
        TENANT_ADMIN: "Tenant Admin",
        TENANT_USER: "Tenant User",
        SERVICE_ADMIN: "Service Admin",
        SERVICE_USER: "Service User",

        // Legacy/simple role codes
        admin: "Administrator",
        superadmin: "Super Administrator",
        "internal.admin": "Service Administrator",
        "internal.root": "Internal Root Administrator",
        "external.admin": "External Administrator",
        user: "User",
        manager: "Manager",
      };

      if (!roles) return "—";

      if (typeof roles === "string") {
        return ROLE_DISPLAY_MAPPINGS[roles] || roles;
      }

      if (Array.isArray(roles)) {
        if (roles.length === 0) return "—";

        const roleNames = roles.map(
          (role) => ROLE_DISPLAY_MAPPINGS[role] || role
        );

        // For dashboard display, show first role + count if more
        if (roleNames.length > 1) {
          return `${roleNames[0]} (+${roleNames.length - 1})`;
        }
        return roleNames[0];
      }

      return String(roles);
    }

    function setUserUI({ name, email, role }) {
      // Name must come from linked person (firstName + surname); no email/token fallback
      const nameText = name || "";
      document.querySelectorAll(".user-name").forEach((el) => {
        el.textContent = (nameText || "User").trim();
      });
      document.querySelectorAll(".user-role").forEach((el) => {
        el.textContent = formatRoleName(role);
      });
      // Update the email shown in the account modal if present
      const modal = document.getElementById("accountModal");
      if (modal && email) {
        const emailEl = modal.querySelector(".text-muted");
        if (emailEl) emailEl.textContent = email;
      }
    }

    // Fallback that derives a display name from the JWT email, if present
    function fallbackFromToken() {
      // Only allow role fallback from token; do not derive name from email
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        const firstRole =
          Array.isArray(payload?.roles) && payload.roles.length
            ? payload.roles[0]
            : null;
        return { role: firstRole };
      } catch {
        return null;
      }
    }

    try {
      // 1) Use the service admin endpoint to get the current admin
      const meResp = await CoreUtils.api.request("GET", "/internal/admins/me");
      const me = meResp?.data || meResp || {};

      // 2) Try to fetch linked person for a proper name
      let name = me?.personFullName || null;
      let email = me?.accessDetails?.email || null;
      const role =
        Array.isArray(me?.roles) && me.roles.length ? me.roles[0] : null;
      if (!name && me?.personId) {
        try {
          // Use the database ID format (PERSON123...) for the API call
          const personResp = await CoreUtils.api.request(
            "GET",
            `/internal/persons/${encodeURIComponent(me.personId)}`
          );
          const person = personResp?.data || personResp || {};
          // Use strictly firstName + surname per requirement
          const fn = (person?.firstName || "").trim();
          const sn = (person?.surname || "").trim();
          const full = [fn, sn].filter(Boolean).join(" ").trim();
          name = full || null;
        } catch {
          // ignore person fetch errors; do not use admin email for name
        }
      }

      setUserUI({ name, email, role });
    } catch (err) {
      // If /me fails (e.g., 401/404), fall back to token-derived info if available
      const fb = fallbackFromToken();
      if (fb) setUserUI({ name: null, email: null, role: fb.role });
    }
  })();
});
