// Add New Person Modal (Service Admin)
// Import centralized validation patterns
import {
  createValidationRules,
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "personCreateModal";
  const htmlPath =
    "/frontend/dashboards/internal.admin/modals/person.create.modal/person.create.modal.html";
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
      // Reuse global modal overlay styles used by other modals
      el.className = "modal-overlay modal-lg modal-person-create";
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      const res = await fetch(htmlPath, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load person create modal HTML");
      container.innerHTML = await res.text();
      container.dataset.loaded = "1";
    }
    // Preload notifications to avoid race on first toast
    try {
      if (window.ensureNotifications) {
        await window.ensureNotifications();
      } else if (!window.TANotification) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "/frontend/shared/scripts/components/notification.js";
          s.onload = () => resolve();
          s.onerror = reject;
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
      if (DEBUG) console.warn("Notification preload failed", e);
    }
    wire(container);
    return container;
  }

  async function getApi() {
    if (apiClientInstance) return apiClientInstance;
    const clientPath =
      (window.__API_CLIENT_PATH__ || "/integration/api-client.js") +
      `?t=${Date.now()}`; // Force cache bust for testing
    const mod = await import(clientPath);
    const { TouchAfricaApiClient } = mod;
    const baseUrl = window.__API_BASE_URL__ || window.location.origin;
    const token = (localStorage.getItem("token") || "").trim() || null;
    apiClientInstance = new TouchAfricaApiClient({
      baseUrl,
      token,
      timeout: 10000, // Reduce timeout to 10 seconds for faster feedback
    });
    return apiClientInstance;
  }

  // Simple toast helper using single source of truth: TANotification
  async function showToast(type, message, opts = {}) {
    try {
      if (window.ensureNotifications) {
        await window.ensureNotifications();
      } else if (!window.TANotification) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "/frontend/shared/scripts/components/notification.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (window.TANotification) {
        const fn = type === "success" ? "success" : "error";
        window.TANotification[fn](
          message,
          Object.assign({ duration: 3500 }, opts)
        );
      }
    } catch (e) {
      // Silent if notifications cannot load; avoid alerts to keep UX consistent
      if (DEBUG) console.warn("Toast failed", e);
    }
  }

  // Validation using centralized patterns - aligned with backend validation
  const RULES = {
    // Personal Details - using centralized validators
    firstName: { ...FIELD_VALIDATORS.firstName },
    surname: { ...FIELD_VALIDATORS.surname },
    dateOfBirth: { ...FIELD_VALIDATORS.dateOfBirth },
    idNumber: { ...FIELD_VALIDATORS.saIdNumber },
    gender: { ...FIELD_VALIDATORS.gender },
    nationality: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) =>
        v.trim().length > 0 || "Nationality is required and cannot be empty",
    },
    homeLanguage: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) =>
        v.trim().length > 0 || "Home language is required and cannot be empty",
    },
    preferredName: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) =>
        v.trim().length > 0 || "Preferred name is required and cannot be empty",
    },

    // Contact Information - using centralized validators
    contact_email: { ...FIELD_VALIDATORS.email },
    contact_mobile: { ...FIELD_VALIDATORS.mobile },
    contact_home: { ...FIELD_VALIDATORS.phoneOptional },
    contact_work: { ...FIELD_VALIDATORS.phoneOptional },

    // Residential Address - using centralized validators
    res_line1: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) =>
        v.trim().length > 0 || "Residential address line 1 is required",
    },
    res_line2: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) =>
        v.trim().length > 0 || "Residential address line 2 is required",
    },
    res_streetName: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) =>
        v.trim().length > 0 || "Residential street name is required",
    },
    res_suburb: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) => v.trim().length > 0 || "Residential suburb is required",
    },
    res_city: { ...FIELD_VALIDATORS.city },
    res_province: { ...FIELD_VALIDATORS.province },
    res_postalCode: { ...FIELD_VALIDATORS.postalCode },

    // Postal Address - using centralized validators
    postal_line1: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) =>
        v.trim().length > 0 || "Postal address line 1 is required",
    },
    postal_line2: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) =>
        v.trim().length > 0 || "Postal address line 2 is required",
    },
    postal_streetName: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) => v.trim().length > 0 || "Postal street name is required",
    },
    postal_suburb: {
      ...FIELD_VALIDATORS.addressLine,
      validate: (v) => v.trim().length > 0 || "Postal suburb is required",
    },
    postal_city: { ...FIELD_VALIDATORS.city },
    postal_province: { ...FIELD_VALIDATORS.province },
    postal_postalCode: { ...FIELD_VALIDATORS.postalCode },

    // Demographics - using centralized validators
    demo_race: { ...FIELD_VALIDATORS.race },
    demo_maritalStatus: { ...FIELD_VALIDATORS.maritalStatus },
    demo_employmentStatus: { ...FIELD_VALIDATORS.employmentStatus },
    demo_educationLevel: { ...FIELD_VALIDATORS.educationLevel },

    // Employment Details - using centralized validators
    demo_company: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) => v.trim().length > 0 || "Company name is required",
    },
    demo_position: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) => v.trim().length > 0 || "Position is required",
    },
    demo_industry: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) => v.trim().length > 0 || "Industry is required",
    },
    demo_monthlyIncome: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) => v.trim().length > 0 || "Monthly income is required",
    },

    // Education Details - using centralized validators
    demo_institution: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) => v.trim().length > 0 || "Institution is required",
    },
    demo_fieldOfStudy: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) => v.trim().length > 0 || "Field of study is required",
    },
    demo_graduationYear: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) => v.trim().length > 0 || "Graduation year is required",
    },

    // Next of Kin - using centralized validators
    kin_name: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) =>
        v.trim().length > 0 ||
        "Next of kin name is required and cannot be empty",
    },
    kin_relationship: {
      ...FIELD_VALIDATORS.requiredText,
      validate: (v) =>
        v.trim().length > 0 ||
        "Relationship to next of kin is required and cannot be empty",
    },
    kin_phoneNumber: {
      ...FIELD_VALIDATORS.phone,
      validate: (v) => {
        if (!v) return "Next of kin phone number is required";
        return ValidationHelper.validatePhone(v, true);
      },
    },
    kin_email: { ...FIELD_VALIDATORS.emailOptional },

    // POPIA Compliance - using centralized validators
    popia_consent: { ...FIELD_VALIDATORS.popiaConsent },
    popia_processingBasis: { ...FIELD_VALIDATORS.processingBasis },
  };

  // --- Helpers for SA ID and DOB consistency ---
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function extractDobFromSAId(id) {
    if (!FIELD_VALIDATORS.saIdNumber.validate(id)) return null;
    const yy = Number(id.slice(0, 2));
    const mm = Number(id.slice(2, 4));
    const dd = Number(id.slice(4, 6));
    const currentYear = new Date().getFullYear();
    const century = Math.floor(currentYear / 100) * 100;
    const fullYear =
      yy <= currentYear % 100 ? century + yy : century - 100 + yy;
    const d = new Date(fullYear, mm - 1, dd);
    if (
      d.getFullYear() !== fullYear ||
      d.getMonth() !== mm - 1 ||
      d.getDate() !== dd
    ) {
      return null;
    }
    return `${d.getFullYear()}-${pad2(mm)}-${pad2(dd)}`;
  }

  function isValidSAId(id) {
    // Simplified SA ID validation - only check format (13 digits)
    // Checkdigit validation removed per user requirements
    return FIELD_VALIDATORS.saIdNumber.validate(id) === true;
  }

  function findErrorEl(field, root) {
    return (
      qs(`.invalid-feedback[data-for="${field.id}"]`, root) ||
      qs(`.invalid-feedback[data-for="${field.name}"]`, root)
    );
  }
  function setFieldError(field, message, root) {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    const el = findErrorEl(field, root);
    if (el) {
      el.textContent = message || "";
      el.style.display = message ? "block" : "";
    }
  }
  function clearFieldError(field, root) {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    const el = findErrorEl(field, root);
    if (el) {
      el.textContent = "";
      el.style.display = "";
    }
  }

  function focusFirstInvalid(form) {
    const candidates = Array.from(
      form.querySelectorAll("input, select, textarea")
    );
    // Prefer elements currently marked invalid
    const invalids = candidates.filter((el) =>
      el.classList.contains("is-invalid")
    );
    const isFocusable = (el) =>
      !el.disabled &&
      el.tabIndex !== -1 &&
      el.type !== "hidden" &&
      el.offsetParent !== null; // visible
    const target = (invalids.length ? invalids : candidates).find(isFocusable);
    if (target && typeof target.focus === "function") {
      target.focus({ preventScroll: false });
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    return target || null;
  }

  function validateField(field, root) {
    const name = field.name || field.id;
    const v = (field.value || "").trim();
    clearFieldError(field, root);
    const rule = RULES[name];
    if (rule) {
      // For checkboxes, use the checked property instead of value
      const fieldValue = field.type === "checkbox" ? field.checked : v;

      if (rule.required && (field.type === "checkbox" ? !field.checked : !v)) {
        setFieldError(field, "This field is required", root);
        return false;
      }
      if (rule.validate) {
        const res = rule.validate(fieldValue);
        if (res !== true) {
          setFieldError(field, typeof res === "string" ? res : "Invalid", root);
          return false;
        }
      }
    }
    return true;
  }

  function validateLegalIdentifierGroup(root) {
    // Enforce backend rule: DOB must match SA ID encoded DOB
    const id = (qs("#demo_idNumber", root)?.value || "").trim();
    const dob = (qs("#demo_birthDate", root)?.value || "").trim();
    if (!id || !dob) return true; // per-field rules will handle required
    if (!isValidSAId(id)) return true; // per-field rule will flag
    const extracted = extractDobFromSAId(id);
    if (extracted && extracted !== dob) {
      const f = qs("#demo_birthDate", root);
      if (f)
        setFieldError(f, "Date of birth does not match SA ID number", root);
      return false;
    }
    return true;
  }

  function validatePostalSameAsResidential(root) {
    // Handle postal same as residential checkbox
    const checkbox = qs("#postal_same_as_residential", root);
    const postalFields = qs("#personCreate_postal-address-fields", root);

    if (checkbox && checkbox.checked && postalFields) {
      // Copy residential values to postal fields
      const resPrefix = "res_";
      const postalPrefix = "personCreate_postal_";
      const fieldsMap = [
        "line1",
        "line2",
        "streetName",
        "suburb",
        "city",
        "province",
        "postalCode",
      ];

      fieldsMap.forEach((field) => {
        const resField = qs(`#${resPrefix}${field}`, root);
        const postalField = qs(`#${postalPrefix}${field}`, root);
        if (resField && postalField) {
          postalField.value = resField.value;
          // Clear any validation errors since we're copying valid data
          clearFieldError(postalField, root);
        }
      });

      // Disable postal fields when same as residential
      const postalInputs = qsa("input, select", postalFields);
      postalInputs.forEach((input) => {
        input.disabled = true;
      });
    } else if (postalFields) {
      // Re-enable postal fields when not same as residential
      const postalInputs = qsa("input, select", postalFields);
      postalInputs.forEach((input) => {
        input.disabled = false;
      });
    }

    return true;
  }

  function toPayload(form, root) {
    // Map comprehensive form fields to backend expected structure
    const get = (id) => (qs("#" + id, root)?.value || "").trim();

    // Read consent directly from the form checkbox
    const consentEl = form.querySelector("#personCreate_popia_consent");
    let consent = false;
    if (consentEl && typeof consentEl.checked === "boolean") {
      consent = !!consentEl.checked;
    }

    // Handle middle names as array
    const middleNamesStr = get("personCreate_middleNames");
    const middleNames = middleNamesStr
      ? middleNamesStr
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
      : [];

    const payload = {
      // Personal Details
      firstName: get("personCreate_firstName"),
      surname: get("personCreate_surname"),
      middleNames: middleNames.length > 0 ? middleNames : undefined,
      preferredName: get("personCreate_preferredName") || undefined,

      // Contact Information
      contact: {
        email: get("contact_email"),
        mobile: get("contact_mobile"),
        home: get("contact_home") || undefined,
        work: get("contact_work") || undefined,
      },

      // Addresses (both residential and postal)
      addresses: {
        residential: {
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
        },
        postal: {
          line1: get("personCreate_postal_line1"),
          line2: get("personCreate_postal_line2"),
          streetName: get("personCreate_postal_streetName"),
          suburb: get("personCreate_postal_suburb"),
          city: get("personCreate_postal_city"),
          province: get("personCreate_postal_province"),
          postalCode: get("personCreate_postal_postalCode"),
          countryCode: "ZA",
        },
      },

      // Demographics
      demographics: {
        idNumber: get("demo_idNumber"), // Required for demographics
        dateOfBirth: get("demo_birthDate"), // Fixed: API expects dateOfBirth, not birthDate
        gender: get("demo_gender"),
        nationality: get("demo_nationality"),
        homeLanguage: get("demo_homeLanguage"),
        race: get("demo_race"),
        maritalStatus: get("demo_maritalStatus"),
        dependentsCount: parseInt(get("demo_dependentsCount")) || 0,
        employment: {
          status: get("personCreate_employment_status"),
        },
        education: {
          level: get("personCreate_education_level"),
        },
        // Fixed: Move disability inside demographics as required by API
        disability: {
          hasDisability: !!qs("#personCreate_disability_hasDisability", root)
            ?.checked,
          type: get("personCreate_disability_type"),
          assistanceRequired: get("personCreate_disability_assistanceRequired"),
        },
      },

      // Next of Kin
      nextOfKin: {
        name: get("kin_name"),
        relationship: get("kin_relationship"),
        phoneNumber: get("kin_phoneNumber"),
        email: get("kin_email") || undefined,
      },

      // POPIA Compliance
      popia: {
        consent,
        processingBasis: get("popia_processingBasis"),
      },
    };

    // Clean up undefined values from contact
    if (!payload.contact.home && !payload.contact.work) {
      payload.contact = {
        email: payload.contact.email,
        mobile: payload.contact.mobile,
      };
    }

    // Clean up undefined values from nextOfKin
    if (!payload.nextOfKin.email) {
      delete payload.nextOfKin.email;
    }

    return payload;
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";

    // Style asterisks in required field labels
    function styleRequiredAsterisks() {
      const labels = root.querySelectorAll("label, .form-label");
      labels.forEach((label) => {
        if (
          label.innerHTML &&
          label.innerHTML.includes("*") &&
          !label.innerHTML.includes("asterisk-highlight")
        ) {
          label.innerHTML = label.innerHTML.replace(
            /\*/g,
            '<span class="asterisk-highlight">*</span>'
          );
        }
      });
    }

    // Apply asterisk styling when modal is wired
    styleRequiredAsterisks();

    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", () => close());
    // Removed overlay click to close - only explicit close buttons should close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // realtime validation
    const form = qs("#personCreateForm", root);
    if (!form) return;

    const inputs = qsa("input, select, textarea", form);
    inputs.forEach((field) => {
      field.addEventListener("focus", () => clearFieldError(field, root));
      field.addEventListener("blur", () => validateField(field, root));
      field.addEventListener("input", () => validateField(field, root));
      if (field.tagName === "SELECT")
        field.addEventListener("change", () => validateField(field, root));
    });

    const btnCancel = qs('[data-action="cancel"]', form);
    if (btnCancel) btnCancel.addEventListener("click", () => close());

    // Handle postal same as residential checkbox
    const postalSameCheckbox = qs("#postal_same_as_residential", root);
    if (postalSameCheckbox) {
      postalSameCheckbox.addEventListener("change", () => {
        validatePostalSameAsResidential(root);
      });
    }

    // Auto-fill DOB from SA ID when possible (if DOB is empty)
    const idField = qs("#demo_idNumber", root);
    const dobField = qs("#demo_birthDate", root);
    const maybeSyncDob = () => {
      const id = (idField?.value || "").trim();
      if (!idField || !dobField || !isValidSAId(id)) return;
      const extracted = extractDobFromSAId(id);
      if (extracted && !(dobField.value || "").trim()) {
        dobField.value = extracted;
        // Re-validate DOB after auto-fill
        validateField(dobField, root);
      }
    };
    if (idField) {
      idField.addEventListener("blur", maybeSyncDob);
      idField.addEventListener("change", maybeSyncDob);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      if (DEBUG) console.log("Validating comprehensive form...");

      // Validate all fields
      inputs.forEach((f) => {
        const valid = validateField(f, root);
        if (DEBUG)
          console.log(`Field ${f.name || f.id}: ${f.value} -> ${valid}`);
        if (!valid) ok = false;
      });

      // Cross-field validations
      if (!validateLegalIdentifierGroup(root)) ok = false;
      if (!validatePostalSameAsResidential(root)) ok = false;

      if (DEBUG) console.log("Comprehensive form validation result:", ok);
      if (!ok) {
        focusFirstInvalid(form);
        return;
      }

      const btn = qs('button[type="submit"]', form);
      const orig = btn?.textContent;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Creating...";
      }

      try {
        const api = await getApi();
        const payload = toPayload(form, root);
        if (DEBUG) {
          console.log(
            "Creating person with comprehensive payload:",
            JSON.stringify(payload, null, 2)
          );
        }

        // Retry logic for timeout errors
        let lastError;
        let attempt = 1;
        const maxAttempts = 3;

        while (attempt <= maxAttempts) {
          try {
            if (DEBUG)
              console.log(
                `Attempt ${attempt} of ${maxAttempts} to create person`
              );
            const res = await api.persons.create(payload);
            // Success! Accept standardized or raw response
            const data = res?.data ?? res;
            // Ensure notifications are ready and show toast before closing
            try {
              if (window.ensureNotifications) {
                await window.ensureNotifications();
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
            } catch {}
            await showToast("success", "Person created successfully", {
              title: "Success",
            });
            // Slight delay to prevent any layout race
            setTimeout(() => close(), 50);
            // trigger a page refresh hook if available
            if (window.reloadPeopleList) window.reloadPeopleList();
            return; // Exit the function on success
          } catch (err) {
            lastError = err;
            const isTimeout =
              err?.message === "timeout" || err?.toString().includes("timeout");

            if (isTimeout && attempt < maxAttempts) {
              if (DEBUG)
                console.log(`Timeout on attempt ${attempt}, retrying...`);
              if (btn) {
                btn.textContent = `Retrying... (${attempt + 1}/${maxAttempts})`;
              }
              attempt++;
              continue; // Try again
            } else {
              // Not a timeout or max attempts reached, throw the error
              throw err;
            }
          }
        }

        // If we get here, all attempts failed
        throw lastError;
      } catch (err) {
        console.error("Create person failed", err?.status, err?.message);
        if (DEBUG) {
          console.error("Error details:", {
            status: err?.status,
            message: err?.message,
            data: err?.data,
            response: err?.response,
            toString: err?.toString(),
          });
        }

        // Try to get more specific error details
        if (DEBUG && err?.data) {
          console.error(
            "Backend error data:",
            JSON.stringify(err.data, null, 2)
          );
        }
        if (DEBUG && err?.response) {
          console.error("HTTP response:", err.response);
        }

        // Handle different error types with specific messages
        let msg = "Failed to create person";
        if (err?.message === "timeout" || err?.toString().includes("timeout")) {
          msg = "Request timed out. The server may be slow. Please try again.";
        } else if (err?.status === 403) {
          msg = "Not permitted";
        } else if (err?.status === 409) {
          // Conflict – likely duplicate SA ID
          const backendMsg = err?.data?.error?.message || err?.data?.message;
          msg = backendMsg || "A person with this SA ID number already exists.";
        } else if (err?.data?.message) {
          msg = err.data.message;
        } else if (err?.data?.error?.message) {
          msg = err.data.error.message;
        } else if (err?.message && err.message !== "timeout") {
          msg = err.message;
        }
        await showToast("error", msg, { title: "Error" });

        // Focus relevant field for known errors (e.g., duplicate ID)
        if (err?.status === 409) {
          const detailField = err?.data?.error?.details?.field;
          const selector = detailField ? `#${detailField}` : "#idNumber";
          const el =
            form.querySelector(selector) ||
            form.querySelector("#demo_idNumber");
          if (el) {
            setFieldError(
              el,
              "A person with this SA ID number already exists",
              root
            );
            el.focus({ preventScroll: false });
            if (el.scrollIntoView)
              el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return; // handled
        }

        // Handle backend validation errors (400) by mapping details to fields
        if (err?.status === 400) {
          const details =
            err?.data?.error?.details ||
            err?.data?.details ||
            err?.data?.errors;
          const mapStringToField = (s) => {
            if (typeof s !== "string") return null;
            // Try match known fields for comprehensive form
            const names = [
              "firstName",
              "surname",
              "middleNames",
              "preferredName",
              "dateOfBirth",
              "idNumber",
              "gender",
              "nationality",
              "homeLanguage",
              "contact_email",
              "contact_mobile",
              "contact_home",
              "contact_work",
              "res_line1",
              "res_line2",
              "res_unit",
              "res_complex",
              "res_streetNumber",
              "res_streetName",
              "res_suburb",
              "res_city",
              "res_municipality",
              "res_province",
              "res_postalCode",
              "postal_line1",
              "postal_line2",
              "postal_streetName",
              "postal_suburb",
              "postal_city",
              "postal_province",
              "postal_postalCode",
              "demo_race",
              "demo_maritalStatus",
              "demo_employmentStatus",
              "demo_educationLevel",
              "kin_name",
              "kin_relationship",
              "kin_phoneNumber",
              "kin_email",
              "popia_consent",
              "popia_processingBasis",
            ];
            return names.find((n) => s.includes(n)) || null;
          };
          if (Array.isArray(details)) {
            for (const d of details) {
              let fieldName = null;
              let message = "Invalid";
              if (d && typeof d === "object") {
                fieldName =
                  d.field || mapStringToField(d.message || d.toString());
                message = d.message || message;
              } else {
                fieldName = mapStringToField(String(d));
                message = String(d);
              }
              if (fieldName) {
                const el = form.querySelector(`#${fieldName}`);
                if (el) setFieldError(el, message, root);
              }
            }
            // After marking, focus the first invalid
            focusFirstInvalid(form);
          } else {
            // No structured details, just focus first required invalid by re-validating
            const fields = Array.from(
              form.querySelectorAll("input,select,textarea")
            );
            let any = false;
            for (const f of fields) any = validateField(f, root) ? any : true;
            if (any) focusFirstInvalid(form);
          }
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = orig || "Create Person";
        }
      }
    });
  }

  async function open() {
    const container = await ensureContainer();
    container.classList.add("show");
  }
  function close() {
    const container = qs("#" + containerId);
    if (!container) return;
    container.classList.remove("show");
    // clear any errors and reset form
    const form = qs("#personCreateForm", container);
    if (form) {
      form.reset();
      qsa(".invalid-feedback", form).forEach((el) => {
        el.textContent = "";
        el.style.display = "";
      });
      qsa(".is-invalid", form).forEach((el) =>
        el.classList.remove("is-invalid")
      );
    }
  }

  window.openPersonCreateModal = open;
})();
