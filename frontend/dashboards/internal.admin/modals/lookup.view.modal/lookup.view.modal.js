(function () {
  const containerId = "lookupViewModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/lookup.view.modal/lookup.view.modal.html";
  let apiInstance = null;
  function qs(s, r = document) {
    return r.querySelector(s);
  }
  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "modal-overlay modal-lg modal-lookup-view";
      document.body.appendChild(el);
    }
    return el;
  }
  async function ensureContainer() {
    const c = ensureOverlay();
    if (!c.dataset.loaded) {
      try {
        const res = await fetch(htmlPath, { cache: "no-store" });
        c.innerHTML = await res.text();
      } catch (e) {
        console.error("[LookupView] load html failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Lookup</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Failed to load lookup view.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="close">Close</button></div></div></div></div>';
      }
      wire(c);
      c.dataset.loaded = "1";
    }
    return c;
  }
  async function getApi() {
    if (apiInstance) return apiInstance;
    // Use TouchAfricaApiClient for consistency
    if (window.apiClientInstance) {
      apiInstance = window.apiClientInstance;
      return apiInstance;
    }

    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;

    window.apiClientInstance = new TouchAfricaApiClient({
      baseUrl: baseUrl,
      token: token,
      timeout: 10000,
    });
    apiInstance = window.apiClientInstance;
    return apiInstance;
  }
  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    const btn = qs('[data-action="close"]', root);
    if (btn) btn.addEventListener("click", close);
  }
  function sanitizeText(v) {
    return (v ?? "").toString().trim() || "—";
  }
  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function renderItems(container, items) {
    const list = qs("#view_itemsList", container);
    const counter = qs("#view_itemsCounter", container);
    if (!list) return;

    const itemsArray = Array.isArray(items) ? items : [];
    if (itemsArray.length === 0) {
      list.innerHTML = '<span class="text-muted">No items</span>';
    } else {
      list.innerHTML = itemsArray
        .map(
          (item) => `
        <span class="item-tag">
          <span class="item-tag-text" title="${escapeHtml(item)}">${escapeHtml(
            item
          )}</span>
        </span>
      `
        )
        .join("");
    }

    if (counter) {
      counter.textContent = `${itemsArray.length} item${
        itemsArray.length !== 1 ? "s" : ""
      }`;
    }
  }
  function fill(container, lookup) {
    // Set record ID in header
    const recordIdEl = qs("#lookupView_recordIdDisplay", container);
    if (recordIdEl) {
      recordIdEl.textContent = sanitizeText(lookup.id || lookup._id);
    }

    // Fill form controls with readonly data
    const categoryEl = qs("#view_category", container);
    if (categoryEl) {
      const category = sanitizeText(lookup.category);
      categoryEl.innerHTML = `<option value="${escapeHtml(
        category
      )}">${escapeHtml(category)}</option>`;
      categoryEl.value = category;
    }

    const subCategoryEl = qs("#view_subCategory", container);
    if (subCategoryEl) {
      const subCategory = sanitizeText(lookup.subCategory);
      subCategoryEl.innerHTML = `<option value="${escapeHtml(
        subCategory
      )}">${escapeHtml(subCategory)}</option>`;
      subCategoryEl.value = subCategory;
    }

    const descriptionEl = qs("#view_description", container);
    if (descriptionEl) {
      descriptionEl.value = sanitizeText(lookup.description);
    }

    const activeEl = qs("#view_active", container);
    if (activeEl) {
      activeEl.value = lookup.active ?? true ? "Active" : "Inactive";
    }

    const createdByEl = qs("#view_createdBy", container);
    if (createdByEl) {
      createdByEl.value = sanitizeText(lookup?.created?.by);
    }

    const createdAtEl = qs("#view_createdAt", container);
    if (createdAtEl) {
      createdAtEl.value = sanitizeText(lookup?.created?.when);
    }

    const updatedByEl = qs("#view_updatedBy", container);
    if (updatedByEl) {
      updatedByEl.value = sanitizeText(lookup?.updated?.by);
    }

    const updatedAtEl = qs("#view_updatedAt", container);
    if (updatedAtEl) {
      updatedAtEl.value = sanitizeText(lookup?.updated?.when);
    }

    // Render items
    renderItems(container, lookup.items);
  }
  async function open(id) {
    const container = await ensureContainer();
    container.classList.add("show");
    try {
      console.log("[LookupView] Fetching lookup with ID:", id);
      const api = await getApi();
      const res = await api.lookups.get(id);
      const data = res?.data ?? res;
      fill(container, data || {});
    } catch (e) {
      console.error("[LookupView] fetch failed", e);
      const descriptionEl = qs("#view_description", container);
      if (descriptionEl) {
        descriptionEl.value = `Failed to load lookup: ${
          e.message || "Unknown error"
        }`;
      }
    }
  }
  function close() {
    const c = qs("#" + containerId);
    if (!c) return;
    c.classList.remove("show");
  }
  window.openLookupViewModal = open;
})();
