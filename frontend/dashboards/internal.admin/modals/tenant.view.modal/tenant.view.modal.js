// View Tenant Modal
(function () {
  const containerId = "tenantViewModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/tenant.view.modal/tenant.view.modal.html";
  let apiClientInstance = null;
  const DEBUG = !!window.__DEBUG__;

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }
  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "modal-overlay modal-tenant-view";
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      const res = await fetch(htmlPath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load tenant view modal HTML");
      container.innerHTML = await res.text();
      container.dataset.loaded = "1";
      wire(container);
    }
    return container;
  }

  async function getApi() {
    if (apiClientInstance) return apiClientInstance;
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;
    apiClientInstance = new TouchAfricaApiClient({
      baseUrl,
      token,
      timeout: 15000,
    });
    return apiClientInstance;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  function populate(data, root) {
    if (!data) return;
    qs("#tenantView_tenantRecordId", root).textContent = data.id || data._id || "—";
    const set = (id, val) => {
      const el = qs("#" + id, root);
      if (el) el.value = val ?? "—";
    };
    set("tenant_name", data.name || "—");
    set("tenant_email", data.contact?.email || data.email || "—");
    set("tenant_phone", data.contact?.phoneNumber || data.phone || "—");
    const active = data.account?.isActive?.value !== false ? "Yes" : "No";
    set("tenant_active", active);
    set(
      "tenant_created",
      formatDate(data.audit?.createdAt || data.createdAt || data.created?.when)
    );
    set(
      "tenant_updated",
      formatDate(data.audit?.updatedAt || data.updatedAt || data.updated?.when)
    );
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", () => close());
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    const form = qs("#tenantViewForm", root);
    const closeAction = qs('[data-action="close"]', form);
    if (closeAction) closeAction.addEventListener("click", () => close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  async function open(tenantId) {
    if (!tenantId) return;
    const container = await ensureContainer();
    container.classList.add("show");
    // loading state
    const nameInput = qs("#tenant_name", container);
    if (nameInput) nameInput.value = "Loading...";
    try {
      const api = await getApi();
      const res = await api.tenants.get(tenantId);
      const data = res?.data ?? res;
      populate(data, container);
    } catch (err) {
      if (DEBUG) console.error("Failed to load tenant", err);
      populate({ name: "Error loading tenant" }, container);
    }
  }

  function close() {
    const container = qs("#" + containerId);
    if (!container) return;
    container.classList.remove("show");
    // Optional: clear values
    qsa("input", container).forEach((i) => {
      if (i.type === "text" || i.type === "email" || i.type === "tel")
        i.value = "";
    });
  }

  window.openTenantViewModal = open;
})();
