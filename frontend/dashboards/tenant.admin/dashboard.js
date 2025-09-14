document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const mql = window.matchMedia("(max-width: 992px)");
  const themeToggle = document.getElementById("themeToggle");
  const themeToggleIcon = document.getElementById("themeToggleIcon");

  function setSidebarOpenMobile(open) {
    if (open) {
      sidebar.classList.add("collapsed"); // mobile uses collapsed as visible
      sidebarOverlay.classList.add("show");
      document.body.classList.add("noscroll");
    } else {
      sidebar.classList.remove("collapsed");
      sidebarOverlay.classList.remove("show");
      document.body.classList.remove("noscroll");
    }
  }

  document.getElementById("sidebarToggle")?.addEventListener("click", () => {
    if (mql.matches) {
      const isOpen = sidebar.classList.contains("collapsed");
      setSidebarOpenMobile(!isOpen);
    } else {
      // desktop: preserve mini-collapse behavior
      sidebar.classList.toggle("collapsed");
    }
  });

  sidebarOverlay?.addEventListener("click", () => setSidebarOpenMobile(false));

  // Keep state sane when crossing the 992px breakpoint
  mql.addEventListener("change", (e) => {
    if (e.matches) {
      // Entering mobile: close drawer and cleanup
      setSidebarOpenMobile(false);
    } else {
      // Entering desktop: ensure overlay/scroll lock are cleared
      document.body.classList.remove("noscroll");
      sidebarOverlay?.classList.remove("show");
    }
  });

  // Lightweight router to load page fragments into #pageRoot
  const pageRoot = document.getElementById("pageRoot");
  const routes = {
    dashboard: "./pages/dashboard.html",
    roles: "./pages/roles.html",
    settings: "./pages/settings.html",
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
      // Auto-close the drawer on mobile after navigating
      if (mql.matches) setSidebarOpenMobile(false);
      // Scroll to top for new page
      pageRoot.scrollTop = 0;
    } catch (err) {
      pageRoot.innerHTML = `<div class="card"><div class="card-body"><h3>Failed to load page</h3><div class="text-muted">${url}</div></div></div>`;
      console.error("Failed to load", url, err);
    }
  }

  function setActiveNav(key) {
    document.querySelectorAll(".nav-link").forEach((l) => {
      const k = l.getAttribute("data-section");
      l.classList.toggle("active", k === key);
    });
  }

  function navigate(key) {
    setActiveNav(key);
    loadPage(key);
  }

  // Handle clicks on nav
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (link && link.getAttribute("data-section")) {
      e.preventDefault();
      const key = link.getAttribute("data-section");
      history.pushState({ key }, "", `#${key}`);
      navigate(key);
    }
  });

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
});
