// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "lookupCreateModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/lookup.create.modal/lookup.create.modal.html";

  function qs(s, r = document) {
    return r.querySelector(s);
  }
  function qsa(s, r = document) {
    return Array.from(r.querySelectorAll(s));
  }

  let apiInstance = null;
  let submitting = false;

  // Toast helper with graceful fallbacks - uses toast notifications only
  async function notify(type, message) {
    try {
      // Ensure notification system is loaded
      await ensureNotificationSystem();

      const tn = window.TANotification;
      if (tn && typeof tn[type] === "function") return tn[type](message);
      if (tn && typeof tn.show === "function") return tn.show(message, type);
    } catch (e) {
      console.error("Failed to show notification:", e);
    }

    // Log to console as fallback (no more alerts)
    if (type === "error") console.error(message);
    else console.log(message);
  }

  // Ensure notification system is available
  async function ensureNotificationSystem() {
    if (window.TANotification) return;

    // Load notification system if not already loaded
    if (!document.querySelector('script[src*="notification.js"]')) {
      const script = document.createElement("script");
      script.src = "/frontend/shared/scripts/components/notification.js";
      document.head.appendChild(script);

      // Wait for script to load
      await new Promise((resolve) => {
        script.onload = resolve;
        script.onerror = resolve; // Continue even if fails
      });
    }

    // Initialize if available
    if (
      window.TANotification &&
      typeof window.TANotification.init === "function"
    ) {
      window.TANotification.init({
        position: "top-right",
        maxNotifications: 5,
      });
    }
  }

  // Validation rules from backend lookup.validation.js
  const RULES = {
    category: {
      required: true,
      validate: (v) => {
        if (v.length < 3) return "Category must be at least 3 characters";
        if (v.length > 50) return "Category cannot exceed 50 characters";
        return true;
      },
    },
    subCategory: {
      required: true,
      validate: (v) => {
        if (v.length < 3) return "Sub-category must be at least 3 characters";
        if (v.length > 50) return "Sub-category cannot exceed 50 characters";
        return true;
      },
    },
    items: {
      required: true,
      validate: (items) => {
        // items is now an array directly
        const list = Array.isArray(items) ? items : [];
        if (list.length < 1) return "At least one item is required";
        if (list.length > 25) return "No more than 25 items allowed";
        // Check for duplicates
        const unique = new Set(list.map((item) => item.toLowerCase().trim()));
        if (unique.size !== list.length)
          return "Duplicate items are not allowed";
        // Check individual item length
        const invalidItem = list.find(
          (item) =>
            !item.trim() || item.trim().length < 1 || item.trim().length > 100
        );
        if (invalidItem) return "Each item must be 1-100 characters long";
        return true;
      },
    },
    description: {
      required: true,
      validate: (v) => {
        if (v.length < 3) return "Description must be at least 3 characters";
        if (v.length > 200) return "Description cannot exceed 200 characters";
        return true;
      },
    },
  };

  // Items management
  let currentItems = [];

  function updateItemsCounter() {
    const root = qs(`#${containerId}`);
    if (!root) return;

    let counterEl = qs(".items-counter", root);
    if (!counterEl) {
      counterEl = document.createElement("div");
      counterEl.className = "items-counter";
      const container = qs(".items-container", root);
      if (container) container.appendChild(counterEl);
    }

    const count = currentItems.length;
    counterEl.textContent = `${count}/25 items`;
    counterEl.className = "items-counter";

    if (count >= 20) counterEl.classList.add("warning");
    if (count >= 25) counterEl.classList.add("error");
  }

  function addItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (trimmed.length > 100) return false;
    if (currentItems.includes(trimmed)) return false;
    if (currentItems.length >= 25) return false;

    currentItems.push(trimmed);
    renderItems();
    updateItemsCounter();
    return true;
  }

  function removeItem(index) {
    if (index >= 0 && index < currentItems.length) {
      currentItems.splice(index, 1);
      renderItems();
      updateItemsCounter();
    }
  }

  function renderItems() {
    const root = qs(`#${containerId}`);
    if (!root) return;

    const itemsList = qs("#lookupCreate_itemsList", root);
    if (!itemsList) return;

    if (currentItems.length === 0) {
      itemsList.innerHTML = "";
      return;
    }

    itemsList.innerHTML = currentItems
      .map(
        (item, index) => `
        <span class="item-tag">
          <span class="item-tag-text" title="${item}">${item}</span>
          <button type="button" class="item-tag-remove" data-index="${index}" title="Remove item">
            <i class="fas fa-times"></i>
          </button>
        </span>
      `
      )
      .join("");

    // Wire remove buttons
    qsa(".item-tag-remove", itemsList).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const index = parseInt(btn.dataset.index);
        removeItem(index);
      });
    });
  }

  function wireItemsUI(root) {
    const newItemInput = qs("#lookupCreate_newItemInput", root);
    const addItemBtn = qs("#lookupCreate_addItemBtn", root);

    if (!newItemInput || !addItemBtn) return;

    const handleAddItem = () => {
      const text = newItemInput.value.trim();
      if (!text) return;

      if (addItem(text)) {
        newItemInput.value = "";
        newItemInput.focus();
        // Clear any validation errors
        clearItemsValidation(root);
      } else {
        // Show error
        if (currentItems.includes(text)) {
          setItemsError("This item already exists", root);
        } else if (text.length > 100) {
          setItemsError("Item is too long (max 100 characters)", root);
        } else if (currentItems.length >= 25) {
          setItemsError("Maximum 25 items allowed", root);
        }
      }
    };

    addItemBtn.addEventListener("click", handleAddItem);

    newItemInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddItem();
      }
    });

    newItemInput.addEventListener("input", () => {
      clearItemsValidation(root);
      addItemBtn.disabled =
        !newItemInput.value.trim() || currentItems.length >= 25;
    });

    // Initialize
    addItemBtn.disabled = true;
    updateItemsCounter();
  }

  function setItemsError(message, root) {
    const container = qs(".items-container", root);
    const feedback = qs('.invalid-feedback[data-for="items"]', root);

    if (container) container.classList.add("is-invalid");
    if (feedback) {
      feedback.textContent = message;
      feedback.style.display = "block";
    }
  }

  function clearItemsValidation(root) {
    const container = qs(".items-container", root);
    const feedback = qs('.invalid-feedback[data-for="items"]', root);

    if (container) container.classList.remove("is-invalid");
    if (feedback) {
      feedback.textContent = "";
      feedback.style.display = "";
    }
  }

  function findErrorEl(field, root) {
    if (!field) return null;
    const name = field.name || field.id;
    return (
      qs(`.invalid-feedback[data-for="${name}"]`, root) ||
      qs(`.invalid-feedback[data-for="${field.id}"]`, root)
    );
  }
  function setFieldError(field, message, root) {
    if (!field) return;
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    const el = findErrorEl(field, root);
    if (el) {
      el.textContent = message || "";
      el.style.display = message ? "block" : "";
    }
  }
  function clearFieldError(field, root) {
    if (!field) return;
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    const el = findErrorEl(field, root);
    if (el) {
      el.textContent = "";
      el.style.display = "";
    }
  }
  function validateField(field, root) {
    if (!field) return true;
    const name = field.name || field.id;
    const rule = RULES[name];
    if (!rule) return true;
    const value = (field.value || "").trim();
    clearFieldError(field, root);
    if (rule.required && !value) {
      setFieldError(field, "This field is required", root);
      return false;
    }
    if (value && rule.validate) {
      const res = rule.validate(value);
      if (res !== true) {
        setFieldError(field, typeof res === "string" ? res : "Invalid", root);
        return false;
      }
    }
    return true;
  }
  function validateAll(form, root) {
    let ok = true;

    // Validate regular form fields
    ["category", "subCategory", "description"].forEach((n) => {
      const f = form.querySelector(`[name="${n}"]`);
      if (!validateField(f, root)) ok = false;
    });

    // Validate items separately
    if (!validateItems(root)) ok = false;

    return ok;
  }

  function validateItems(root) {
    const rule = RULES.items;
    if (!rule) return true;

    clearItemsValidation(root);

    if (rule.required && currentItems.length === 0) {
      setItemsError("At least one item is required", root);
      return false;
    }

    if (rule.validate) {
      const res = rule.validate(currentItems);
      if (res !== true) {
        setItemsError(typeof res === "string" ? res : "Invalid items", root);
        return false;
      }
    }

    return true;
  }
  function focusFirstInvalid(root) {
    const first = qs(".is-invalid", root);
    if (first && typeof first.focus === "function") first.focus();
  }

  function attachRealtimeValidation(root) {
    const form = qs("#lookupCreateForm", root);
    if (!form || form.dataset._realtime) return;
    form.dataset._realtime = "1";
    ["input", "blur"].forEach((evt) => {
      form.addEventListener(
        evt,
        (e) => {
          if (!(e.target instanceof HTMLElement)) return;
          if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
            validateField(e.target, root);
          }
        },
        true
      );
    });
  }

  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "modal-overlay modal-lg modal-lookup modal-lookup-create";
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
        console.error("[LookupCreate] html load failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Create Lookup</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load create modal.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="cancel">Close</button></div></div></div></div>';
      }
      const dlg = qs(".modal-dialog", c);
      if (dlg) {
        dlg.classList.remove("modal-sm");
        if (!dlg.classList.contains("modal-lg")) dlg.classList.add("modal-lg");
      }
      wire(c);
      c.dataset.loaded = "1";
    }
    return c;
  }

  async function getApi() {
    if (apiInstance) return apiInstance;
    if (window.apiClientInstance)
      return (apiInstance = window.apiClientInstance);
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      (window.__DISABLE_CACHE__ ? `?t=${Date.now()}` : "");
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;
    window.apiClientInstance = new TouchAfricaApiClient({
      baseUrl,
      token,
      timeout: 10000,
    });
    apiInstance = window.apiClientInstance;
    return apiInstance;
  }

  // ===== Options Loading (Categories & Sub-Categories) =====
  let _categoriesCache = null;
  let _subCategoriesCache = null;

  async function loadCategories() {
    if (_categoriesCache) return _categoriesCache;
    const api = await getApi();
    try {
      console.log("[LookupCreate] Loading categories...");
      const res = await api.lookupCategories.list({ limit: 1000 });
      console.log("[LookupCreate] Categories response:", res);

      // Handle different response formats
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];

      console.log("[LookupCreate] Categories items:", items);

      _categoriesCache = items
        .map((it) => it?.category || it?.name || it?.id || "")
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b)));

      console.log("[LookupCreate] Processed categories:", _categoriesCache);
      return _categoriesCache;
    } catch (error) {
      console.error("[LookupCreate] Categories load error:", error);
      throw error;
    }
  }

  async function loadSubCategories() {
    if (_subCategoriesCache) return _subCategoriesCache;
    const api = await getApi();
    try {
      console.log("[LookupCreate] Loading sub-categories...");
      const res = await api.lookupSubCategories.list({ limit: 1000 });
      console.log("[LookupCreate] Sub-categories response:", res);

      // Handle different response formats
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];

      console.log("[LookupCreate] Sub-categories items:", items);

      _subCategoriesCache = items
        .map(
          (it) => it?.subcategory || it?.subCategory || it?.name || it?.id || ""
        )
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b)));

      console.log(
        "[LookupCreate] Processed sub-categories:",
        _subCategoriesCache
      );
      return _subCategoriesCache;
    } catch (error) {
      console.error("[LookupCreate] Sub-categories load error:", error);
      throw error;
    }
  }

  async function populateOptions(root) {
    console.log("[LookupCreate] Populating options...");
    const catSel = qs("#lookupCreate_category", root);
    const subSel = qs("#lookupCreate_subCategory", root);

    if (catSel) {
      try {
        console.log("[LookupCreate] Loading categories for select...");
        const cats = await loadCategories();
        console.log("[LookupCreate] Categories loaded:", cats);

        // Clear and add placeholder
        catSel.innerHTML =
          '<option value="">Select a category…</option>' +
          cats
            .map(
              (c) =>
                `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
            )
            .join("");
        console.log(
          "[LookupCreate] Category select populated with",
          cats.length,
          "options"
        );
      } catch (err) {
        console.error("[LookupCreate] categories load error", err);
      }
    } else {
      console.warn("[LookupCreate] Category select not found");
    }

    if (subSel) {
      try {
        console.log("[LookupCreate] Loading sub-categories for select...");
        const subs = await loadSubCategories();
        console.log("[LookupCreate] Sub-categories loaded:", subs);

        subSel.innerHTML =
          '<option value="">Select a sub-category…</option>' +
          subs
            .map(
              (s) =>
                `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
            )
            .join("");
        console.log(
          "[LookupCreate] Sub-category select populated with",
          subs.length,
          "options"
        );
      } catch (err) {
        console.error("[LookupCreate] sub-categories load error", err);
      }
    } else {
      console.warn("[LookupCreate] Sub-category select not found");
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";
    // Removed overlay click to close - only explicit close buttons should close modal
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    const cancel = qs('[data-action="cancel"]', root);
    if (cancel) cancel.addEventListener("click", close);
    const form = qs("#lookupCreateForm", root);
    if (form) form.addEventListener("submit", submitHandler);
    attachRealtimeValidation(root);
    wireItemsUI(root);
    // When category changes, we can optionally filter/refresh sub-categories list later.
    const catSel = qs("#lookupCreate_category", root);
    if (catSel) {
      catSel.addEventListener("change", () => {
        // placeholder for future dependent filtering logic
      });
    }
  }

  function collect(form) {
    const o = {};
    qsa("input,textarea,select", form).forEach((el) => {
      if (!el.name) return;
      if (el.type === "checkbox") o[el.name] = el.checked;
      else o[el.name] = (el.value || "").trim();
    });

    return {
      category: o.category || "",
      subCategory: o.subCategory || "",
      items: [...currentItems], // Use the currentItems array directly
      description: o.description || "",
    };
  }

  async function submitHandler(e) {
    e.preventDefault();
    if (submitting) return;
    const form = e.target;
    const root = form.closest(".modal-overlay") || document;
    if (!validateAll(form, root)) {
      focusFirstInvalid(root);
      return;
    }
    const payload = collect(form);
    try {
      submitting = true;
      const submitBtn = qs('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = true;
      const api = await getApi();
      await api.lookups.create(payload);
      notify("success", "Lookup created");
      close();
      window.reloadLookupsList?.();
    } catch (err) {
      console.error("[LookupCreate] create failed", err);
      const msg = err?.data?.message || err?.message || "Create failed";
      notify("error", msg);
      if (err?.data?.errors && typeof err.data.errors === "object") {
        const errors = err.data.errors;
        Object.keys(errors).forEach((k) => {
          const field = form.querySelector(`[name="${k}"]`);
          if (field) setFieldError(field, errors[k], root);
        });
      }
    } finally {
      submitting = false;
      const submitBtn = qs('button[type="submit"]', form);
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function open() {
    const c = await ensureContainer();
    c.classList.add("show");
    const form = qs("#lookupCreateForm", c);
    if (form) form.reset();

    // Reset items
    currentItems = [];
    renderItems();
    updateItemsCounter();
    clearItemsValidation(c);

    // Populate selects
    try {
      await populateOptions(c);
    } catch (err) {
      console.error("[LookupCreate] populate options failed", err);
    }
  }
  function close() {
    const c = qs("#" + containerId);
    if (!c) return;
    c.classList.remove("show");
    const form = qs("#lookupCreateForm", c);
    if (form) {
      form.reset();
      // Clear all error messages
      qsa(".invalid-feedback", form).forEach((el) => {
        el.textContent = "";
        el.style.display = "";
      });
      // Remove validation error classes
      qsa(".is-invalid", form).forEach((el) =>
        el.classList.remove("is-invalid")
      );
    }

    // Reset items
    currentItems = [];
    renderItems();
    updateItemsCounter();
    clearItemsValidation(c);
  }

  window.openLookupCreateModal = open;
})();
