(function () {
  const containerId = "personViewModal";
  // Build HTML path relative to this module for robustness
  const htmlPath = (() => {
    try {
      const u = new URL("./person.view.modal.html", import.meta.url);
      return u.href;
    } catch (_) {
      return "/frontend/dashboards/internal.admin/modals/person.view.modal/person.view.modal.html";
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
        if (!res.ok) throw new Error("Failed to load person view modal HTML");
        container.innerHTML = await res.text();
      } catch (e) {
        console.error("[ViewModal] HTML load failed from", htmlPath, e);
        // Minimal fallback UI so overlay is still visible
        container.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2 class="modal-title">View Person</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load modal content.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="close">Close</button></div></div></div></div>';
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

    const form = qs("#personViewForm", root);
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

  function fillForm(root, person, recordId) {
    console.log(
      "[PersonView] ★★★ FILLFORM STARTED - THIS IS THE NEW VERSION ★★★"
    );
    console.log("[PersonView] === FILLFORM FUNCTION CALLED ===");
    console.log("[PersonView] Root element:", root);
    console.log("[PersonView] Person data received:", person);
    console.log("[PersonView] Record ID:", recordId);

    const set = (id, val) => {
      const el = qs("#personView_" + id, root);
      if (el) {
        el.value = val == null ? "" : String(val);
        console.log(`[PersonView] Set ${id}:`, val);
      } else {
        console.warn(`[PersonView] Field not found: personView_${id}`);
      }
    };
    const setChecked = (id, val) => {
      const el = qs("#personView_" + id, root);
      if (el) {
        el.checked = !!val;
        console.log(`[PersonView] Checked ${id}:`, !!val);
      } else {
        console.warn(`[PersonView] Checkbox not found: personView_${id}`);
      }
    };
    const setSelect = (id, val) => {
      const el = qs("#personView_" + id, root);
      if (el && val) {
        // Find and select the option
        const options = Array.from(el.options);
        const option = options.find(
          (o) => o.value === val || o.textContent === val
        );
        if (option) {
          el.value = option.value;
          console.log(`[PersonView] Selected ${id}:`, val);
        } else {
          console.warn(`[PersonView] Option not found for ${id}:`, val);
        }
      } else if (!el) {
        console.warn(`[PersonView] Select not found: personView_${id}`);
      }
    };

    console.log(
      "[PersonView] Full person data:",
      JSON.stringify(person, null, 2)
    );

    // Basic personal information
    const first = person.firstName || "";
    const surname = person.surname || "";
    const middleNames = Array.isArray(person.middleNames)
      ? person.middleNames.join(" ")
      : person.middleNames || "";
    const preferredName = person.preferredName || "";

    // Fields moved to demographics
    const dob = person.demographics?.dateOfBirth || person.dateOfBirth || "";
    const gender = person.demographics?.gender || person.gender || "";
    const idNumber = person.demographics?.idNumber || person.idNumber || "";
    const citizenshipStatus =
      person.demographics?.citizenshipStatus || person.citizenshipStatus || "";

    set("firstName", first);
    set("surname", surname);
    set("middleNames", middleNames);
    set("preferredName", preferredName);
    set("demographics_birthDate", dob ? String(dob).slice(0, 10) : "");
    setSelect("demographics_gender", gender);
    setSelect("demographics_citizenshipStatus", citizenshipStatus);

    // Set ID Number with explicit style to prevent masking
    const idField = qs("#personView_demographics_idNumber", root);
    if (idField) {
      idField.value = idNumber || "";
      idField.style.webkitTextSecurity = "none";
      idField.setAttribute("autocomplete", "off");
      console.log("[PersonView] Setting ID Number:", idNumber);
    }

    // Contact information
    const contact = person.contact || {};
    set("email", contact.email || "");
    set("mobile", contact.mobile || "");
    set("home", contact.home || "");
    set("work", contact.work || "");

    // Address information
    const addresses = person.addresses || {};
    const residential = addresses.residential || {};
    const postal = addresses.postal || {};

    // Residential address
    set("addr_line1", residential.line1 || "");
    set("addr_line2", residential.line2 || "");
    set("addr_unit", residential.unit || "");
    set("addr_complex", residential.complex || "");
    set("addr_streetNumber", residential.streetNumber || "");
    set("addr_streetName", residential.streetName || "");
    set("addr_suburb", residential.suburb || "");
    set("addr_city", residential.city || "");
    set("addr_municipality", residential.municipality || "");
    setSelect("addr_province", residential.province);
    set("addr_postalCode", residential.postalCode || "");

    // Postal address
    set("postal_line1", postal.line1 || "");
    set("postal_line2", postal.line2 || "");
    set("postal_unit", postal.unit || "");
    set("postal_complex", postal.complex || "");
    set("postal_streetNumber", postal.streetNumber || "");
    set("postal_streetName", postal.streetName || "");
    set("postal_suburb", postal.suburb || "");
    set("postal_city", postal.city || "");
    set("postal_municipality", postal.municipality || "");
    setSelect("postal_province", postal.province);
    set("postal_postalCode", postal.postalCode || "");

    // Demographics
    const demographics = person.demographics || {};
    setSelect("demographics_race", demographics.race);
    setSelect("demographics_maritalStatus", demographics.maritalStatus);
    set("demographics_dependentsCount", demographics.dependentsCount || "");
    set("demographics_idNumber", demographics.idNumber || "");
    set("demographics_passportNumber", demographics.passportNumber || "");
    set("demographics_birthDate", demographics.birthDate || "");
    setSelect("demographics_gender", demographics.gender);
    set("demographics_nationality", demographics.nationality || "");
    set("demographics_homeLanguage", demographics.homeLanguage || "");

    // Employment
    const employment = demographics.employment || {};
    setSelect("employment_status", employment.status);
    set("employment_company", employment.company || "");
    set("employment_position", employment.position || "");
    set("employment_industry", employment.industry || "");
    set("employment_monthlyIncome", employment.monthlyIncome || "");

    // Education
    const education = demographics.education || {};
    setSelect("education_level", education.level);
    set("education_institution", education.institution || "");
    set("education_fieldOfStudy", education.fieldOfStudy || "");
    set("education_graduationYear", education.graduationYear || "");

    // Disability
    const disability = demographics.disability || {};
    setChecked("disability_hasDisability", disability.hasDisability);
    set("disability_type", disability.type || "");
    set("disability_assistanceRequired", disability.assistanceRequired || "");

    // Socio-economic information
    const socioEconomic = person.socioEconomic || {};
    set("taxNumber", socioEconomic.taxNumber || "");
    set("uifNumber", socioEconomic.uifNumber || "");
    set("medicalAidNumber", socioEconomic.medicalAidNumber || "");
    setSelect("employmentStatus", socioEconomic.employmentStatus);

    const employer = socioEconomic.employer || {};
    set("employer_name", employer.name || "");
    set("employer_employeeNumber", employer.employeeNumber || "");

    // Next of Kin
    const nextOfKin = person.nextOfKin || {};
    set("nextOfKin_name", nextOfKin.name || "");
    set("nextOfKin_relationship", nextOfKin.relationship || "");
    set("nextOfKin_phoneNumber", nextOfKin.phoneNumber || "");
    set("nextOfKin_email", nextOfKin.email || "");

    // POPIA data population
    const popia = person.popia || {};
    setChecked("popia_consent", popia.consent);
    setSelect("processingBasis", popia.processingBasis);
    setSelect("dataSubjectCategory", popia.dataSubjectCategory);

    console.log(
      "[PersonView] Address data:",
      JSON.stringify(addresses, null, 2)
    );
    console.log("[PersonView] POPIA data:", JSON.stringify(popia, null, 2));
    console.log(
      "[PersonView] Demographics data:",
      JSON.stringify(demographics, null, 2)
    );
    console.log(
      "[PersonView] Next of Kin data:",
      JSON.stringify(nextOfKin, null, 2)
    );

    const ridEl = qs("#personView_recordIdDisplay", root);
    if (ridEl) {
      const displayId = recordId || person.id || person.personId || "—";
      ridEl.textContent = displayId;
      // Ensure no masking attributes
      ridEl.style.webkitTextSecurity = "none";
      ridEl.style.fontFamily = "monospace";
      console.log("[PersonView] Setting record ID display:", displayId);
    }
  }

  async function open(id) {
    const container = await ensureContainer();
    container.classList.add("show");
    try {
      const api = await getApi();
      const res = await api.persons.get(id);
      const person = res?.data ?? res;
      fillForm(container, person || {}, id);
    } catch (e) {
      console.error("Failed to load person for viewing", e);
      const ridEl = qs("#personView_recordIdDisplay", container);
      if (ridEl) ridEl.textContent = id || "—";
    }
  }

  function close() {
    const container = qs("#" + containerId);
    if (!container) return;
    container.classList.remove("show");
    const form = qs("#personViewForm", container);
    if (form) form.reset();
  }

  window.openPersonViewModal = open;
})();
