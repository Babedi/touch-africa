(function () {
  const containerId = "tenantPersonViewModal";
  // Build HTML path relative to this module for robustness
  const htmlPath = (() => {
    try {
      const u = new URL("./person.view.modal.html", import.meta.url);
      return u.href;
    } catch (_) {
      return "/frontend/dashboards/tenant.admin/modals/person.view.modal/person.view.modal.html";
    }
  })();
  let apiClientInstance = null;

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
      el.className = "modal-overlay modal-lg modal-person-view";
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      try {
        const res = await fetch(htmlPath, { cache: "no-store" });
        if (!res.ok)
          throw new Error("Failed to load tenant person view modal HTML");
        container.innerHTML = await res.text();
      } catch (e) {
        console.error(
          "[TenantPersonViewModal] HTML load failed from",
          htmlPath,
          e
        );
        // Minimal fallback UI so overlay is still visible
        container.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2 class="modal-title">View Tenant Person</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load modal content.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="close">Close</button></div></div></div></div>';
      }
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
      timeout: 10000,
    });
    return apiClientInstance;
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", () => close());
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    const form = qs("#tenantPersonViewForm", root);
    if (form) {
      // Make all form elements readonly/disabled for view-only
      qsa("input, select, textarea, button[type='submit']", form).forEach(
        (el) => {
          if (el.tagName === "BUTTON") {
            if (el.getAttribute("data-action") !== "close") el.disabled = true;
          } else if (el.tagName === "SELECT") {
            el.disabled = true;
          } else {
            el.readOnly = true;
          }
        }
      );
      const closeBtn = qs('[data-action="close"]', form);
      if (closeBtn) closeBtn.addEventListener("click", () => close());
    }
  }

  function fillForm(root, person, recordId, tenantInfo) {
    console.log("[TenantPersonViewModal] Filling form with data:", person);

    const form = qs("#tenantPersonViewForm", root);
    if (!form) {
      console.error("[TenantPersonViewModal] Form not found");
      return;
    }

    // Set record ID display
    const recordIdDisplay = qs("#tenantPersonView_recordIdDisplay", root);
    if (recordIdDisplay) {
      recordIdDisplay.textContent = recordId || "—";
    }

    // Fill tenant information
    if (tenantInfo) {
      const tenantIdField = qs("#tenantPersonView_tenantId", form);
      if (tenantIdField) {
        tenantIdField.value = tenantInfo.name || tenantInfo.id || "";
      }
    }

    // Fill personal details
    const personalMapping = {
      firstName: "#tenantPersonView_firstName",
      surname: "#tenantPersonView_surname",
      middleNames: "#tenantPersonView_middleNames",
      preferredName: "#tenantPersonView_preferredName",
    };

    // Fill contact information
    const contactMapping = {
      email: "#tenantPersonView_email",
      mobile: "#tenantPersonView_mobile",
      home: "#tenantPersonView_home",
      work: "#tenantPersonView_work",
    };

    // Fill address information (residential)
    const addressMapping = {
      addr_line1: "#tenantPersonView_addr_line1",
      addr_line2: "#tenantPersonView_addr_line2",
      addr_unit: "#tenantPersonView_addr_unit",
      addr_complex: "#tenantPersonView_addr_complex",
      addr_streetNumber: "#tenantPersonView_addr_streetNumber",
      addr_streetName: "#tenantPersonView_addr_streetName",
      addr_suburb: "#tenantPersonView_addr_suburb",
      addr_city: "#tenantPersonView_addr_city",
      addr_municipality: "#tenantPersonView_addr_municipality",
      addr_province: "#tenantPersonView_addr_province",
      addr_postalCode: "#tenantPersonView_addr_postalCode",
    };

    // Fill postal address
    const postalMapping = {
      postal_line1: "#tenantPersonView_postal_line1",
      postal_line2: "#tenantPersonView_postal_line2",
      postal_unit: "#tenantPersonView_postal_unit",
      postal_complex: "#tenantPersonView_postal_complex",
      postal_streetNumber: "#tenantPersonView_postal_streetNumber",
      postal_streetName: "#tenantPersonView_postal_streetName",
      postal_suburb: "#tenantPersonView_postal_suburb",
      postal_city: "#tenantPersonView_postal_city",
      postal_municipality: "#tenantPersonView_postal_municipality",
      postal_province: "#tenantPersonView_postal_province",
      postal_postalCode: "#tenantPersonView_postal_postalCode",
    };

    // Fill demographics
    const demographicsMapping = {
      demographics_nationality: "#tenantPersonView_demographics_nationality",
      demographics_idNumber: "#tenantPersonView_demographics_idNumber",
      demographics_birthDate: "#tenantPersonView_demographics_birthDate",
      demographics_gender: "#tenantPersonView_demographics_gender",
      demographics_race: "#tenantPersonView_demographics_race",
      demographics_maritalStatus:
        "#tenantPersonView_demographics_maritalStatus",
      demographics_dependentsCount:
        "#tenantPersonView_demographics_dependentsCount",
      demographics_passportNumber:
        "#tenantPersonView_demographics_passportNumber",
      demographics_homeLanguage: "#tenantPersonView_demographics_homeLanguage",
    };

    // Fill employment information
    const employmentMapping = {
      employment_status: "#tenantPersonView_employment_status",
      employment_company: "#tenantPersonView_employment_company",
      employment_position: "#tenantPersonView_employment_position",
      employment_industry: "#tenantPersonView_employment_industry",
      employment_monthlyIncome: "#tenantPersonView_employment_monthlyIncome",
    };

    // Fill education information
    const educationMapping = {
      education_level: "#tenantPersonView_education_level",
      education_institution: "#tenantPersonView_education_institution",
      education_fieldOfStudy: "#tenantPersonView_education_fieldOfStudy",
      education_graduationYear: "#tenantPersonView_education_graduationYear",
    };

    // Fill disability information
    const disabilityMapping = {
      disability_hasDisability: "#tenantPersonView_disability_hasDisability",
      disability_type: "#tenantPersonView_disability_type",
      disability_assistanceRequired:
        "#tenantPersonView_disability_assistanceRequired",
    };

    // Fill next of kin information
    const nextOfKinMapping = {
      nextOfKin_name: "#tenantPersonView_nextOfKin_name",
      nextOfKin_relationship: "#tenantPersonView_nextOfKin_relationship",
      nextOfKin_phoneNumber: "#tenantPersonView_nextOfKin_phoneNumber",
      nextOfKin_email: "#tenantPersonView_nextOfKin_email",
    };

    // Fill POPIA information
    const popiaMapping = {
      popia_consent: "#tenantPersonView_popia_consent",
      processingBasis: "#tenantPersonView_processingBasis",
      dataSubjectCategory: "#tenantPersonView_dataSubjectCategory",
    };

    // Apply all mappings
    [
      personalMapping,
      contactMapping,
      addressMapping,
      postalMapping,
      demographicsMapping,
      employmentMapping,
      educationMapping,
      disabilityMapping,
      nextOfKinMapping,
      popiaMapping,
    ].forEach((mapping) => {
      Object.entries(mapping).forEach(([key, selector]) => {
        const field = qs(selector, form);
        if (field && person[key] !== undefined) {
          if (field.type === "checkbox") {
            field.checked = !!person[key];
          } else {
            field.value = person[key] || "";
          }
        }
      });
    });
  }

  function close() {
    const overlay = qs("#" + containerId);
    if (!overlay) return;
    overlay.classList.remove("show");
  }

  async function open(personId, tenantId) {
    if (!personId || !tenantId) {
      console.error(
        "[TenantPersonViewModal] Missing required parameters: personId, tenantId"
      );
      window.showToast?.("error", "Missing person or tenant information");
      return;
    }

    try {
      const container = await ensureContainer();
      const api = await getApi();

      // Load person data from tenant-specific endpoint
      const personData = await api.get(
        `/tenants/${tenantId}/people/${personId}`
      );
      const tenantData = await api.get(`/tenants/${tenantId}`);

      fillForm(container, personData, personId, tenantData);

      container.classList.add("show");
      console.log("[TenantPersonViewModal] Modal opened successfully");
    } catch (error) {
      console.error("[TenantPersonViewModal] Failed to open modal:", error);
      window.showToast?.("error", "Failed to load person information");
    }
  }

  // Expose global open hook
  window.openTenantPersonViewModal = open;
})();
