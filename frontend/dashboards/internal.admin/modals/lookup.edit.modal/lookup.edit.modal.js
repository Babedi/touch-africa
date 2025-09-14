// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "lookupEditModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/lookup.edit.modal/lookup.edit.modal.html";
  let apiInstance = null;
  let submitting = false;
  let currentItems = [];
  let currentId = null;

  function qs(s, r = document) {
    return r.querySelector(s);
  }
  function qsa(s, r = document) {
    return Array.from(r.querySelectorAll(s));
  }

  function notify(type, message) {
    try {
      const tn = window.TANotification;
      if (tn && typeof tn[type] === "function") return tn[type](message);
      if (tn && typeof tn.show === "function") return tn.show(message, type);
    } catch (_) {}
    if (type === "error") console.error(message);
    else console.log(message);
  }

  // Validation rules aligned with backend LookupSchema
  const RULES = {
    description: {
      required: true,
      validate: (v) => {
        if (v.length < 3) return "Description must be at least 3 characters";
        if (v.length > 200) return "Description cannot exceed 200 characters";
        return true;
      },
    },
    items: {
      required: true,
      validate: (items) => {
        const list = Array.isArray(items) ? items : [];
        if (list.length < 1) return "At least one item is required";
        if (list.length > 25) return "No more than 25 items allowed";
        const unique = new Set(list.map((s) => s.toLowerCase().trim()));
        if (unique.size !== list.length)
          return "Duplicate items are not allowed";
        const invalid = list.find((s) => !s.trim() || s.trim().length > 100);
        if (invalid) return "Each item must be 1-100 characters long";
        return true;
      },
    },
  };

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
    return qs(`.invalid-feedback[data-for="${name}"]`, root);
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
  function validateItems(root) {
    const rule = RULES.items;
    if (!rule) return true;
    clearItemsValidation(root);
    const res = rule.validate(currentItems);
    if (res !== true) {
      setItemsError(typeof res === "string" ? res : "Invalid items", root);
      return false;
    }
    return true;
  }
  function validateAll(form, root) {
    let ok = true;
    const desc = qs("#edit_description", form);
    if (!validateField(desc, root)) ok = false;
    if (!validateItems(root)) ok = false;
    return ok;
  }

  function updateItemsCounter(root) {
    const el = qs("#edit_itemsCounter", root);
    if (el) el.textContent = `${currentItems.length}/25 items`;
  }
  function renderItems(root) {
    const list = qs("#edit_itemsList", root);
    if (!list) return;
    list.innerHTML = currentItems
      .map(
        (item, index) => `
      <span class="item-tag">
        <span class="item-tag-text" title="${item}">${item}</span>
        <button type="button" class="item-tag-remove" data-index="${index}" title="Remove item"><i class="fas fa-times"></i></button>
      </span>
    `
      )
      .join("");
    qsa(".item-tag-remove", list).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const i = parseInt(btn.dataset.index);
        if (!Number.isNaN(i)) {
          currentItems.splice(i, 1);
          renderItems(root);
          updateItemsCounter(root);
          clearItemsValidation(root);
        }
      });
    });
  }
  function wireItemsUI(root) {
    const input = qs("#edit_newItemInput", root);
    const addBtn = qs("#edit_addItemBtn", root);
    if (!input || !addBtn) return;
    const handleAdd = () => {
      const text = (input.value || "").trim();
      if (!text) return;
      const v = RULES.items.validate([...currentItems, text]);
      if (v !== true) {
        setItemsError(typeof v === "string" ? v : "Invalid item", root);
        return;
      }
      currentItems.push(text);
      input.value = "";
      renderItems(root);
      updateItemsCounter(root);
      clearItemsValidation(root);
      input.focus();
    };
    addBtn.addEventListener("click", handleAdd);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    });
    input.addEventListener("input", () => clearItemsValidation(root));
  }

  function ensureOverlay() {
    let el = qs("#" + containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "modal-overlay modal-lg modal-lookup modal-lookup-edit";
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
        console.error("[LookupEdit] html load failed", e);
        c.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2>Edit Lookup</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load edit modal.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="cancel">Close</button></div></div></div></div>';
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

  async function populateCategoryReadonly(root, category, subCategory) {
    const cat = qs("#edit_category", root);
    const sub = qs("#edit_subCategory", root);
    if (cat) {
      cat.innerHTML = `<option value="${escapeHtml(
        category || ""
      )}">${escapeHtml(category || "—")}</option>`;
      cat.value = category || "";
    }
    if (sub) {
      sub.innerHTML = `<option value="${escapeHtml(
        subCategory || ""
      )}">${escapeHtml(subCategory || "—")}</option>`;
      sub.value = subCategory || "";
    }
  }
  function escapeHtml(str) {
    return String(str || "")
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
    const form = qs("#lookupEditForm", root);
    if (form) form.addEventListener("submit", submitHandler);
    wireItemsUI(root);
    // realtime validation
    if (form && !form.dataset._realtime) {
      form.dataset._realtime = "1";
      form.addEventListener(
        "input",
        (e) => {
          if (!(e.target instanceof HTMLElement)) return;
          if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
            clearFieldError(e.target, root);
            if (e.target.id === "edit_description")
              validateField(e.target, root);
          }
        },
        true
      );
      form.addEventListener(
        "blur",
        (e) => {
          if (!(e.target instanceof HTMLElement)) return;
          if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
            if (e.target.id === "edit_description")
              validateField(e.target, root);
          }
        },
        true
      );
    }
  }

  function collect(form) {
    const o = {};
    qsa("input,textarea,select", form).forEach((el) => {
      if (!el.name) return;
      o[el.name] = (el.value || "").trim();
    });
    return { description: o.description || "", items: [...currentItems] };
  }

  async function submitHandler(e) {
    e.preventDefault();
    if (submitting) return;
    const form = e.target;
    const root = form.closest(".modal-overlay") || document;
    if (!validateAll(form, root)) return;
    const payload = collect(form);
    try {
      submitting = true;
      const btn = qs('button[type="submit"]', form);
      if (btn) btn.disabled = true;
      const api = await getApi();
      await api.lookups.patch(currentId, payload);
      notify("success", "Lookup updated");
      const status = qs("#lookupEdit_lookupEditStatus", root);
      if (status) {
        status.textContent = "Saved";
        status.className = "form-status text-success";
      }
      close();
      window.reloadLookupsList?.();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Save failed";
      notify("error", msg);
      const status = qs("#lookupEdit_lookupEditStatus", root);
      if (status) {
        status.textContent = msg;
        status.className = "form-status text-danger";
      }
      if (err?.data?.errors && typeof err.data.errors === "object") {
        Object.entries(err.data.errors).forEach(([k, v]) => {
          const field = form.querySelector(`[name="${k}"]`);
          if (field) setFieldError(field, v, root);
        });
      }
    } finally {
      submitting = false;
      const btn = qs('button[type="submit"]', form);
      if (btn) btn.disabled = false;
    }
  }

  async function open(id) {
    currentId = id;
    const c = await ensureContainer();
    c.classList.add("show");
    const form = qs("#lookupEditForm", c);
    if (form) form.reset();
    currentItems = [];
    renderItems(c);
    updateItemsCounter(c);
    clearItemsValidation(c);
    qs("#lookupEdit_recordIdDisplay", c).textContent = id || "—";
    try {
      const api = await getApi();
      const res = await api.lookups.get(id);
      const data = res?.data ?? res;
      // fill readonly category/subCategory
      await populateCategoryReadonly(c, data?.category, data?.subCategory);
      // fill items and description
      currentItems = Array.isArray(data?.items)
        ? data.items.map((s) => String(s))
        : [];
      renderItems(c);
      updateItemsCounter(c);
      const desc = qs("#edit_description", c);
      if (desc) desc.value = data?.description || "";
    } catch (e) {
      console.error("[LookupEdit] load failed", e);
      notify("error", e?.message || "Failed to load lookup");
    }
  }

  function close() {
    const c = qs("#" + containerId);
    if (!c) return;
    c.classList.remove("show");

    // Clear any errors and reset form
    const form = qs("#lookupEditForm", c);
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
  }

  window.openLookupEditModal = open;
})();
