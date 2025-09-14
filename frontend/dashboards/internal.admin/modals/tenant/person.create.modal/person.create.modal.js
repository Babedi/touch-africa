// Tenant Admin - Add New Person Modal
// Lightweight version tailored for tenant context, using externalPersons API (/:tenantId/persons)

// Import centralized validation patterns
import {
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  // Import utility functions
  const {
    escapeHtml,
    secureSetHTML,
    trustedSetHTML,
    buildSecureSelectOptions,
  } = window.SecurityUtils || {};
  const {
    validateField,
    validateForm,
    clearAllErrors,
    setupRealtimeValidation,
  } = window.ValidationUtils || {};
  const { resetModalForm, setModalLoading, handleFormSubmission } =
    window.ModalUtils || {};

  const containerId = "tenantPersonCreateModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/tenant/person.create.modal/person.create.modal.html";
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
      el.className = "modal-overlay modal-lg modal-tenant-person-create";
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureNotifications() {
    try {
      if (window.ensureNotifications) return window.ensureNotifications();
      if (!window.TANotification) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "/frontend/shared/scripts/components/notification.js";
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      if (
        window.TANotification &&
        typeof window.TANotification.init === "function"
      ) {
        window.TANotification.init({
          position: "top-right",
          maxNotifications: 6,
          zIndex: 2147483647,
        });
      }
    } catch (e) {
      if (DEBUG) console.warn("Notifications load failed", e);
    }
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

  async function showToast(type, message, opts = {}) {
    try {
      await ensureNotifications();
      if (window.TANotification) {
        const fn = type === "success" ? "success" : "error";
        window.TANotification[fn](
          message,
          Object.assign({ duration: 3500 }, opts)
        );
      }
    } catch (e) {
      if (DEBUG) console.warn("toast failed", e);
    }
  }

  // Validation rules matching backend PersonSchema requirements with user-friendly error messages
  const RULES = {
    // Tenant selection (required for tenant person context)
    tenantId: {
      required: true,
      validate: (v) => (v ? true : "Please select a tenant"),
    },

    // Personal details (required)
    firstName: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "First name is required and cannot be empty",
    },
    surname: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Surname is required and cannot be empty",
    },
    preferredName: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Preferred name is required and cannot be empty",
    },

    // Contact Information (required)
    contact_mobile: ValidationHelper.createPhoneValidator(),
    contact_email: ValidationHelper.createEmailValidator(),
    contact_home: {
      required: false,
      validate: ValidationHelper.createPhoneValidator(false),
    },
    contact_work: {
      required: false,
      validate: ValidationHelper.createPhoneValidator(false),
    },

    // Residential Address (required)
    res_line1: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Residential address line 1 is required",
    },
    res_line2: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Residential address line 2 is required",
    },
    res_streetName: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Residential street name is required",
    },
    res_suburb: {
      required: true,
      validate: (v) => (v.trim() ? true : "Residential suburb is required"),
    },
    res_city: {
      required: true,
      validate: (v) => (v.trim() ? true : "Residential city is required"),
    },
    res_province: {
      required: true,
      validate: (v) =>
        v
          ? true
          : "Province must be one of the 9 SA provinces (e.g., Gauteng, Western Cape)",
    },
    res_postalCode: FIELD_VALIDATORS.postalCode,

    // Postal Address (required unless same as residential)
    postal_line1: {
      required: true,
      validate: (v) => (v.trim() ? true : "Postal address line 1 is required"),
    },
    postal_line2: {
      required: true,
      validate: (v) => (v.trim() ? true : "Postal address line 2 is required"),
    },
    postal_streetName: {
      required: true,
      validate: (v) => (v.trim() ? true : "Postal street name is required"),
    },
    postal_suburb: {
      required: true,
      validate: (v) => (v.trim() ? true : "Postal suburb is required"),
    },
    postal_city: {
      required: true,
      validate: (v) => (v.trim() ? true : "Postal city is required"),
    },
    postal_province: {
      required: true,
      validate: (v) =>
        v.trim()
          ? true
          : "Province must be one of the 9 SA provinces (e.g., Gauteng, Western Cape)",
    },
    postal_postalCode: {
      required: true,
      validate: (v) => {
        if (!v.trim()) return "Postal code is required";
        return FIELD_VALIDATORS.postalCode.validate(v);
      },
    },

    // Demographics (required)
    demo_idNumber: FIELD_VALIDATORS.idNumber,
    demo_birthDate: FIELD_VALIDATORS.dateOfBirth,
    demo_gender: {
      required: true,
      validate: (v) =>
        v
          ? true
          : "Gender must be one of: Male, Female, Other, Prefer not to say",
    },
    demo_nationality: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Nationality is required and cannot be empty",
    },
    demo_homeLanguage: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Home language is required and cannot be empty",
    },
    demo_race: {
      required: true,
      validate: (v) =>
        v
          ? true
          : "Race must be one of: Black African, Coloured, Indian/Asian, White, Other, Prefer not to say",
    },
    demo_maritalStatus: {
      required: true,
      validate: (v) =>
        v
          ? true
          : "Marital status must be one of: Single, Married, Divorced, Widowed, Separated, Customary Union, Life Partner, Unknown",
    },

    // Employment Information (required nested object)
    employment_status: {
      required: true,
      validate: (v) =>
        v
          ? true
          : "Employment status must be one of: Employed, Self-employed, Unemployed, Student, Retired, Other",
    },
    employment_company: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Company name is required and cannot be empty",
    },
    employment_position: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Position is required and cannot be empty",
    },
    employment_industry: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Industry is required and cannot be empty",
    },
    employment_monthlyIncome: FIELD_VALIDATORS.monthlyIncome,

    // Education Information (required nested object)
    education_level: {
      required: true,
      validate: (v) =>
        v ? true : "Education level is required and cannot be empty",
    },
    education_institution: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Institution name is required and cannot be empty",
    },
    education_fieldOfStudy: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Field of study is required and cannot be empty",
    },
    education_graduationYear: FIELD_VALIDATORS.graduationYear,

    // Disability Information (required nested object)
    disability_hasDisability: {
      required: true,
      validate: (checked) =>
        typeof checked === "boolean"
          ? true
          : "Disability status is required (Yes or No)",
    },
    disability_type: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Disability type is required and cannot be empty",
    },
    disability_assistanceRequired: {
      required: true,
      validate: (v) =>
        v.trim()
          ? true
          : "Assistance required information is required and cannot be empty",
    },

    // Next of Kin (required)
    kin_name: {
      required: true,
      validate: (v) =>
        v.trim() ? true : "Next of kin name is required and cannot be empty",
    },
    kin_relationship: {
      required: true,
      validate: (v) =>
        v.trim()
          ? true
          : "Relationship to next of kin is required and cannot be empty",
    },
    kin_phoneNumber: {
      required: true,
      validate: (v) => {
        if (!v.trim()) return "Next of kin phone number is required";
        return ValidationHelper.createPhoneValidator(true)(v);
      },
    },
    kin_email: {
      required: false,
      validate: (v) => {
        if (!v.trim()) return true; // Optional field
        return ValidationHelper.createEmailValidator(false)(v);
      },
    },

    // POPIA Compliance (required)
    popia_consent: {
      required: true,
      validate: (checked) =>
        checked ? true : "Consent to process personal information is required",
    },
    popia_processingBasis: {
      required: true,
      validate: (v) =>
        v
          ? true
          : "Processing basis must be one of: consent, contract, legal_obligation, legitimate_interest, vital_interest, public_task, other",
    },

    // Optional fields
    demo_dependentsCount: {
      required: true,
      validate: (v) => {
        if (!v.trim()) return "Number of dependents is required";
        const num = Number(v);
        if (isNaN(num) || num < 0)
          return "Number of dependents must be a non-negative number";
        return true;
      },
    },
    demo_passportNumber: {
      required: false,
      validate: (v) => {
        if (!v.trim()) return true; // Optional field
        return v.trim().length >= 6
          ? true
          : "Passport number must be at least 6 characters";
      },
    },
    socio_taxNumber: FIELD_VALIDATORS.taxNumber,
    socio_uifNumber: FIELD_VALIDATORS.uifNumber,
    socio_medicalAidNumber: FIELD_VALIDATORS.medicalAidNumber,
  };

  function validateTenantPersonField(input) {
    const name = input.name;
    if (!name || !RULES[name]) return true;
    const rule = RULES[name];
    const value = input.type === "checkbox" ? input.checked : input.value;
    let valid = true;
    let msg = "";

    // Check required fields
    if (
      rule.required &&
      (value === "" || value === undefined || value === false)
    ) {
      valid = false;
      msg = "Required";
    }

    // Run validation function if field has value or is required
    if (valid && rule.validate && (value !== "" || rule.required)) {
      const r = rule.validate(value);
      if (r !== true) {
        valid = false;
        msg = r;
      }
    }

    // Find feedback element - check multiple possible data-for values
    let fb = input.form.querySelector(`.invalid-feedback[data-for="${name}"]`);
    if (!fb && input.id) {
      fb = input.form.querySelector(
        `.invalid-feedback[data-for="${input.id}"]`
      );
    }

    if (!valid) {
      input.classList.add("is-invalid");
      if (fb) fb.textContent = msg || "Invalid";
    } else {
      input.classList.remove("is-invalid");
      if (fb) fb.textContent = "";
    }
    return valid;
  }

  function validateTenantPersonForm(form) {
    let ok = true;
    qsa("[name]", form).forEach((el) => {
      if (!validateTenantPersonField(el)) ok = false;
    });
    return ok;
  }

  function wirePostalSame(form) {
    const cb = qs("#postal_same_as_residential", form);
    if (!cb) return;
    cb.addEventListener("change", () => {
      const map = [
        "line1",
        "line2",
        "streetName",
        "suburb",
        "city",
        "province",
        "postalCode",
      ];
      if (cb.checked) {
        map.forEach((f) => {
          const src = qs(`#res_${f}`, form);
          const dest = qs(`#personCreate_postal_${f}`, form);
          if (src && dest) {
            dest.value = src.value;
            // Trigger validation after copying values
            validateTenantPersonField(dest);
          }
        });
      } else {
        // Clear postal fields when unchecked so user must fill them manually
        map.forEach((f) => {
          const dest = qs(`#personCreate_postal_${f}`, form);
          if (dest) {
            dest.value = "";
            // Trigger validation to show required field errors
            validateTenantPersonField(dest);
          }
        });
      }
    });

    // Also listen for changes to residential fields to auto-update postal if checkbox is checked
    const resMap = ["line1", "line2", "city", "province", "postalCode"];
    resMap.forEach((f) => {
      const src = qs(`#res_${f}`, form);
      if (src) {
        src.addEventListener("input", () => {
          if (cb.checked) {
            const dest = qs(`#personCreate_postal_${f}`, form);
            if (dest) {
              dest.value = src.value;
              validateTenantPersonField(dest);
            }
          }
        });
      }
    });
  }

  function buildPayload(form) {
    // Transform flat form fields into backend schema structure
    console.log("🔧 BUILD PAYLOAD VERSION 5.0 - CORRECTED FIELD MAPPING");

    // Helper to get field value with proper name mapping
    const get = (fieldName) => {
      const element = form.elements[fieldName];
      return element?.value?.trim() || "";
    };

    // Helper for checkbox values
    const checked = (fieldName) => {
      const element = form.elements[fieldName];
      return element?.checked || false;
    };

    // Personal details (required)
    const firstName = get("firstName");
    const surname = get("surname");
    const preferredName = get("preferredName");

    // Middle names (optional array)
    const middleNamesRaw = get("middleNames");
    const middleNames = middleNamesRaw
      ? middleNamesRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    // Contact information (required object)
    const contact = {
      email: get("contact_email"),
      mobile: get("contact_mobile"),
      home: get("contact_home") || undefined,
      work: get("contact_work") || undefined,
    };

    // Residential address (required)
    const residential = {
      line1: get("res_line1"),
      line2: get("res_line2"),
      unit: get("res_unit") || undefined,
      complex: get("res_complex") || undefined,
      streetNumber: get("res_streetNumber") || undefined,
      streetName: get("res_streetName"),
      suburb: get("res_suburb"),
      city: get("res_city"),
      municipality: get("res_municipality") || undefined,
      province: get("res_province"),
      postalCode: get("res_postalCode"),
      countryCode: "ZA",
    };

    // Postal address (required) - either copy of residential or separate
    let postal;
    const postalSameAsRes = checked("postal_same_as_residential");
    if (postalSameAsRes) {
      postal = { ...residential };
    } else {
      postal = {
        line1: get("postal_line1"),
        line2: get("postal_line2"),
        unit: get("postal_unit") || undefined,
        complex: get("postal_complex") || undefined,
        streetNumber: get("postal_streetNumber") || undefined,
        streetName: get("postal_streetName"),
        suburb: get("postal_suburb"),
        city: get("postal_city"),
        municipality: get("postal_municipality") || undefined,
        province: get("postal_province"),
        postalCode: get("postal_postalCode"),
        countryCode: "ZA",
      };
    }

    // Employment information (required nested object in demographics)
    const employment = {
      status: get("employment_status"),
      company: get("employment_company"),
      position: get("employment_position"),
      industry: get("employment_industry"),
      monthlyIncome: get("employment_monthlyIncome")
        ? Number(get("employment_monthlyIncome"))
        : undefined,
    };

    // Education information (required nested object in demographics)
    const education = {
      level: get("education_level"),
      institution: get("education_institution"),
      fieldOfStudy: get("education_fieldOfStudy"),
      graduationYear: get("education_graduationYear")
        ? Number(get("education_graduationYear"))
        : undefined,
    };

    // Disability information (required nested object in demographics)
    const disability = {
      hasDisability: checked("disability_hasDisability"),
      type: get("disability_type"),
      assistanceRequired: get("disability_assistanceRequired"),
    };

    // Demographics object (required with all nested required objects)
    const demographics = {
      idNumber: get("demo_idNumber"),
      dateOfBirth: get("demo_birthDate"),
      gender: get("demo_gender"),
      nationality: get("demo_nationality"),
      homeLanguage: get("demo_homeLanguage"),
      citizenshipStatus: get("citizenshipStatus") || undefined,
      race: get("demo_race"),
      maritalStatus: get("demo_maritalStatus"),
      dependentsCount: get("demo_dependentsCount")
        ? Number(get("demo_dependentsCount"))
        : undefined,
      employment, // Required nested object
      education, // Required nested object
      disability, // Required nested object
    };

    // Optional demographic fields
    const passportNumber = get("demo_passportNumber");
    if (passportNumber) {
      demographics.passportNumber = passportNumber;
    }

    // Next of kin (required object)
    const nextOfKin = {
      name: get("kin_name"),
      relationship: get("kin_relationship"),
      phoneNumber: get("kin_phoneNumber"),
      email: get("kin_email") || undefined,
    };

    // Optional next of kin address
    if (get("kin_addressLine1") || get("kin_city")) {
      nextOfKin.address = {
        line1: get("kin_addressLine1"),
        line2: get("kin_addressLine2") || undefined,
        streetName: get("kin_streetName") || undefined,
        suburb: get("kin_suburb") || undefined,
        city: get("kin_city"),
        province: get("kin_province") || undefined,
        postalCode: get("kin_postalCode") || undefined,
        countryCode: "ZA",
      };
    }

    // POPIA compliance (required object)
    const popia = {
      consent: checked("popia_consent"),
      processingBasis: get("popia_processingBasis"),
      dataSubjectCategory: get("popia_dataSubjectCategory") || undefined,
    };

    // Add consent timestamp if consent is given
    if (popia.consent) {
      popia.consentTimestamp = new Date().toISOString();
    }

    // SocioEconomic information (optional object)
    let socioEconomic;
    const hasSocioEconomicData =
      get("socio_taxNumber") ||
      get("socio_uifNumber") ||
      get("socio_medicalAidNumber") ||
      get("socio_employmentStatus") ||
      get("employer_name") ||
      get("employer_employeeNumber");

    if (hasSocioEconomicData) {
      socioEconomic = {
        taxNumber: get("socio_taxNumber") || undefined,
        uifNumber: get("socio_uifNumber") || undefined,
        medicalAidNumber: get("socio_medicalAidNumber") || undefined,
        employmentStatus: get("socio_employmentStatus") || undefined,
      };

      // Employer information (nested in socioEconomic)
      if (get("employer_name") || get("employer_employeeNumber")) {
        socioEconomic.employer = {
          name: get("employer_name") || undefined,
          employeeNumber: get("employer_employeeNumber") || undefined,
        };
      }
    }

    // Build final payload matching backend PersonSchema
    const payload = {
      firstName,
      middleNames,
      surname,
      preferredName,
      contact,
      addresses: {
        residential,
        postal,
      },
      demographics,
      nextOfKin,
      popia,
    };

    // Add optional socioEconomic if present
    if (socioEconomic) {
      payload.socioEconomic = socioEconomic;
    }

    // Derive dateOfBirth from ID if absent (optional enhancement)
    if (
      !payload.demographics.dateOfBirth &&
      payload.demographics.idNumber &&
      FIELD_VALIDATORS.saIdNumber.validate(payload.demographics.idNumber) ===
        true
    ) {
      const yy = payload.demographics.idNumber.substring(0, 2);
      const mm = payload.demographics.idNumber.substring(2, 4);
      const dd = payload.demographics.idNumber.substring(4, 6);
      const year = parseInt(yy, 10) <= 30 ? "20" + yy : "19" + yy;
      payload.demographics.dateOfBirth = `${year}-${mm}-${dd}`;
    }

    console.log(
      "[PAYLOAD DEBUG] Final payload structure:",
      JSON.stringify(payload, null, 2)
    );
    return payload;
  }

  async function populateTenants(root) {
    const select = qs("#personCreate_personTenantId", root);
    if (!select) return;
    try {
      const api = await getApi();
      const res = await api.tenants.list({
        page: 1,
        limit: 500,
        order: "asc",
        sortBy: "name",
      });
      const arr = res?.data?.data || res?.data || res;
      const items = Array.isArray(arr) ? arr : [];

      // Use secure function to build select options
      const selectOptions = buildSecureSelectOptions
        ? buildSecureSelectOptions(
            items.map((t) => ({
              value: t.tenantId || t.id,
              text: `${t.name || t.tenantId || t.id} (${t.tenantId || t.id})`,
            })),
            "",
            "Select a tenant..."
          )
        : '<option value="">Select a tenant...</option>' +
          items
            .map((t) => {
              const id = escapeHtml
                ? escapeHtml(t.tenantId || t.id)
                : t.tenantId || t.id;
              const name = escapeHtml ? escapeHtml(t.name || id) : t.name || id;
              return `<option value="${id}">${name} (${id})</option>`;
            })
            .join("");

      if (trustedSetHTML) {
        trustedSetHTML(select, selectOptions);
      } else {
        select.innerHTML = selectOptions;
      }
    } catch (e) {
      if (DEBUG) console.warn("tenants load failed", e);
    }
  }

  function wire(container) {
    const form = qs("#tenantPersonCreateForm", container);
    if (!form) return;

    // Style asterisks in required field labels
    function styleRequiredAsterisks() {
      const labels = container.querySelectorAll("label, .form-label");
      labels.forEach((label) => {
        if (
          label.innerHTML &&
          label.innerHTML.includes("*") &&
          !label.innerHTML.includes("asterisk-highlight")
        ) {
          // Safe way to replace asterisks - this is styling only, no user input
          const styledContent = label.innerHTML.replace(
            /\*/g,
            '<span class="asterisk-highlight">*</span>'
          );
          if (trustedSetHTML) {
            trustedSetHTML(label, styledContent);
          } else {
            label.innerHTML = styledContent;
          }
        }
      });
    }

    // Apply asterisk styling when modal is wired
    styleRequiredAsterisks();

    // Cancel button
    const btnCancel = qsa('[data-action="cancel"]', form)[0];
    if (btnCancel) {
      btnCancel.addEventListener("click", () => closeModal());
    }

    // Real-time validation
    form.addEventListener("input", (e) => {
      if (e.target && e.target.name) validateTenantPersonField(e.target);
    });
    form.addEventListener(
      "blur",
      (e) => {
        if (e.target && e.target.name) validateTenantPersonField(e.target);
      },
      true
    );

    wirePostalSame(form);
    populateTenants(container);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      console.log("🔍 Form submission started - validating form...");

      if (!validateTenantPersonForm(form)) {
        console.log("❌ Form validation failed");
        return;
      }

      console.log("✅ Form validation passed, building payload...");
      const payload = buildPayload(form);

      // Debug monthly income specifically
      const monthlyIncomeRaw = form.elements["employment_monthlyIncome"]?.value;
      console.log(
        "[MONTHLY INCOME DEBUG] Form element value:",
        monthlyIncomeRaw
      );
      console.log(
        "[MONTHLY INCOME DEBUG] Form element type:",
        typeof monthlyIncomeRaw
      );
      console.log(
        "[MONTHLY INCOME DEBUG] Payload employment:",
        payload.demographics?.employment
      );
      console.log(
        "[MONTHLY INCOME DEBUG] Payload monthlyIncome:",
        payload.demographics?.employment?.monthlyIncome
      );
      console.log(
        "[MONTHLY INCOME DEBUG] Type of payload monthlyIncome:",
        typeof payload.demographics?.employment?.monthlyIncome
      );

      try {
        form.classList.add("is-loading");
        const tenantId = form.elements["tenantId"]?.value?.trim();
        if (!tenantId) {
          await showToast("error", "Please select a tenant");
          return;
        }
        const api = await getApi();

        // Debug logging to see what we're sending
        console.log(
          "[PERSON CREATE DEBUG] Sending payload:",
          JSON.stringify(payload, null, 2)
        );
        console.log("[PERSON CREATE DEBUG] Tenant ID:", tenantId);

        await api.externalPersons.create(tenantId, payload);
        await showToast("success", "Person created successfully");
        closeModal(true);
        if (window.reloadTenantPersonsList) window.reloadTenantPersonsList();
      } catch (err) {
        // Enhanced debug logging to understand the error
        console.error("[PERSON CREATE DEBUG] Full error object:", err);
        console.error("[PERSON CREATE DEBUG] Error data:", err?.data);
        console.error("[PERSON CREATE DEBUG] Error response:", err?.response);
        console.error("[PERSON CREATE DEBUG] Error message:", err?.message);

        // Additional detailed error logging
        if (err?.response) {
          console.error(
            "[PERSON CREATE DEBUG] Response status:",
            err.response.status
          );
          console.error(
            "[PERSON CREATE DEBUG] Response statusText:",
            err.response.statusText
          );
          console.error(
            "[PERSON CREATE DEBUG] Response headers:",
            err.response.headers
          );
          console.error(
            "[PERSON CREATE DEBUG] Response data:",
            err.response.data
          );
        }

        // Try to extract detailed error from different possible structures
        if (err?.data?.error) {
          console.error(
            "[PERSON CREATE DEBUG] Detailed error:",
            err.data.error
          );
          if (err.data.error.details) {
            console.error(
              "[PERSON CREATE DEBUG] Error details:",
              err.data.error.details
            );
          }
          if (err.data.error.validation) {
            console.error(
              "[PERSON CREATE DEBUG] Validation errors:",
              err.data.error.validation
            );
          }
        }

        let msg = "Could not create person";
        if (err?.data?.errors) {
          // Field level errors from backend
          Object.entries(err.data.errors).forEach(([field, errorMsg]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
              input.classList.add("is-invalid");
              const fb = form.querySelector(
                `.invalid-feedback[data-for="${field}"]`
              );
              if (fb)
                fb.textContent = Array.isArray(errorMsg)
                  ? errorMsg.join(", ")
                  : String(errorMsg);
            }
          });
          msg = "Please fix the highlighted errors";
        } else if (err?.data?.message) {
          msg = err.data.message;
        }
        await showToast("error", msg, { title: "Error" });
      } finally {
        form.classList.remove("is-loading");
      }
    });
  }

  function openModal() {
    (async () => {
      try {
        await ensureNotifications();
        const overlay = ensureOverlay();
        if (!overlay.dataset.loaded) {
          const res = await fetch(htmlPath, { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to load modal HTML");

          // Safely set HTML content from trusted source (our own HTML files)
          const htmlContent = await res.text();
          if (trustedSetHTML) {
            trustedSetHTML(overlay, htmlContent);
          } else {
            overlay.innerHTML = htmlContent;
          }

          overlay.dataset.loaded = "1";
          wire(overlay);
        }

        // Refresh tenant dropdown data on every open
        await populateTenants(overlay);

        overlay.classList.add("show");
        // Escape key to close
        function esc(e) {
          if (e.key === "Escape") closeModal();
        }
        // Removed overlay click to close - only explicit close buttons should close modal
        document.addEventListener("keydown", esc, { once: true });
        const closeBtn = qs(".modal-close", overlay);
        if (closeBtn) closeBtn.addEventListener("click", () => closeModal());
      } catch (e) {
        console.error("Open tenant person modal failed", e);
        showToast("error", "Could not open modal");
      }
    })();
  }

  function closeModal(success) {
    const overlay = qs("#" + containerId);
    if (!overlay) return;

    overlay.classList.remove("show");

    // Use standardized modal reset function
    const form = qs("#tenantPersonCreateForm", overlay);
    if (form) {
      if (resetModalForm) {
        resetModalForm(form);
      } else {
        // Fallback to manual reset
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
  }

  // Expose global open hook
  window.openTenantPersonCreateModal = openModal;
})();
