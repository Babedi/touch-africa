// Import centralized validation patterns
import {
  createValidationRules,
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const containerId = "personEditModal";
  const htmlPath = (() => {
    try {
      const u = new URL("./person.edit.modal.html", import.meta.url);
      return u.href;
    } catch (_) {
      return "/frontend/dashboards/internal.admin/modals/person.edit.modal/person.edit.modal.html";
    }
  })();
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
      el.className = "modal-overlay modal-lg modal-person-edit";
      document.body.appendChild(el);
    }
    return el;
  }

  async function ensureContainer() {
    const container = ensureOverlay();
    if (!container.dataset.loaded) {
      try {
        const res = await fetch(htmlPath, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load person edit modal HTML");
        container.innerHTML = await res.text();
      } catch (e) {
        console.error("[EditModal] HTML load failed from", htmlPath, e);
        container.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2 class="modal-title">Edit Person</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load modal content.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="cancel">Close</button></div></div></div></div>';
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
    try {
      window.apiClient = apiClientInstance;
    } catch {}
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

  // Enhanced validation for edit modal - comprehensive validation for editable fields with backend-aligned error messages
  // Note: idNumber and email excluded since they are readonly/immutable fields
  // Enhanced validation for edit modal using centralized patterns
  // Note: idNumber and email excluded since they are readonly/immutable fields
  const RULES = {
    // Personal Details - enhanced validation
    firstName: FIELD_VALIDATORS.firstName,
    surname: FIELD_VALIDATORS.surname,
    dateOfBirth: {
      required: true,
      validate: (v) => {
        if (!v || v.trim().length === 0) return "Date of birth is required";
        // Use centralized date validation logic
        const dateValidation = FIELD_VALIDATORS.dateOfBirth.validate(v);
        if (dateValidation !== true) return dateValidation;

        // Additional validation for edit modal
        const dob = new Date(v);
        const minDate = new Date(1900, 0, 1);
        if (dob < minDate) return "Date of birth cannot be before 1900";
        return true;
      },
    },
    gender: {
      validate: (v) => {
        if (!v) return true; // Optional field in edit
        return FIELD_VALIDATORS.gender.validate(v);
      },
    },

    // Contact validation using centralized patterns
    mobile: {
      validate: (v) => ValidationHelper.validatePhone(v, false),
    },
    home: {
      validate: (v) => ValidationHelper.validatePhone(v, false),
    },
    work: {
      validate: (v) => ValidationHelper.validatePhone(v, false),
    },

    // Address validation with conditional requirements
    addr_line1: {
      validate: (v) => {
        // Address is optional, but if any address field is filled, line1 becomes required
        const root = document.querySelector("#personEdit_personEditModal");
        const hasAddressData = [
          "addr_line2",
          "addr_city",
          "addr_province",
          "addr_postalCode",
        ].some((id) => {
          const field = root?.querySelector(`#${id}`);
          return field?.value?.trim();
        });

        if (hasAddressData && (!v || v.trim().length === 0)) {
          return "Address line 1 is required when other address fields are provided";
        }
        return true;
      },
    },
    addr_city: {
      validate: (v) => {
        const root = document.querySelector("#personEdit_personEditModal");
        const hasAddressData = [
          "addr_line1",
          "addr_line2",
          "addr_province",
          "addr_postalCode",
        ].some((id) => {
          const field = root?.querySelector(`#${id}`);
          return field?.value?.trim();
        });

        if (hasAddressData && (!v || v.trim().length === 0)) {
          return "City is required when other address fields are provided";
        }
        return true;
      },
    },
    addr_province: {
      validate: (v) => {
        const root = document.querySelector("#personEdit_personEditModal");
        const hasAddressData = [
          "addr_line1",
          "addr_line2",
          "addr_city",
          "addr_postalCode",
        ].some((id) => {
          const field = root?.querySelector(`#${id}`);
          return field?.value?.trim();
        });

        if (hasAddressData && (!v || v.trim().length === 0)) {
          return "Province must be one of the 9 SA provinces (e.g., Gauteng, Western Cape)";
        }

        // Use centralized province validation if value is provided
        if (v) {
          return FIELD_VALIDATORS.province.validate(v);
        }
        return true;
      },
    },
    addr_postalCode: {
      validate: (v) => {
        if (!v || v.trim().length === 0) return true; // Optional unless other address fields are present

        // Use centralized postal code validation
        const postalValidation = FIELD_VALIDATORS.postalCode.validate(v);
        if (postalValidation !== true) return postalValidation;

        const root = document.querySelector("#personEdit_personEditModal");
        const hasAddressData = [
          "addr_line1",
          "addr_line2",
          "addr_city",
          "addr_province",
        ].some((id) => {
          const field = root?.querySelector(`#${id}`);
          return field?.value?.trim();
        });

        if (hasAddressData && (!v || v.trim().length === 0)) {
          return "Postal code is required when other address fields are provided";
        }
        return true;
      },
    },
  };

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
  function validateField(field, root) {
    if (!field) return true;
    // Skip validation for readonly fields completely
    if (
      field.readOnly ||
      field.hasAttribute("readonly") ||
      field.id === "idNumber" ||
      field.id === "email"
    ) {
      clearFieldError(field, root);
      return true;
    }

    const name = field.name || field.id;
    const v = (field.value || "").trim();
    clearFieldError(field, root);
    const rule = RULES[name];
    if (rule) {
      if (rule.required && !v) {
        setFieldError(field, "This field is required", root);
        return false;
      }
      if (rule.validate) {
        const res = rule.validate(v);
        if (res !== true) {
          setFieldError(field, typeof res === "string" ? res : "Invalid", root);
          return false;
        }
      }
    }
    return true;
  }

  function toPayload(form, root) {
    console.log("[PersonEdit] Starting toPayload serialization");

    const get = (id) => {
      const el = qs("#" + id, root);
      const value = (el?.value || "").trim();
      console.log(
        `[PersonEdit] Get field ${id} = "${value}" (element ${
          el ? "found" : "NOT FOUND"
        })`
      );
      return value;
    };

    const getChecked = (id) => {
      const el = qs("#" + id, root);
      const checked = el?.checked || false;
      console.log(
        `[PersonEdit] Get checkbox ${id} = ${checked} (element ${
          el ? "found" : "NOT FOUND"
        })`
      );
      return checked;
    };

    const consentEl = form.querySelector("#personEdit_popia_consent");
    const consent = !!(consentEl && consentEl.checked);

    // Get original email to preserve it (readonly field)
    const originalEmail = qs("#personEdit_email", root)?.value?.trim() || "";

    const payload = {
      firstName: get("personEdit_firstName"),
      surname: get("personEdit_surname"),
      // Fields moved to demographics: dateOfBirth, gender, idNumber
      contact: {
        email: originalEmail || undefined, // PRESERVE email from readonly field
        mobile: get("personEdit_mobile") || undefined,
        workPhone: get("personEdit_work") || undefined,
        homePhone: get("personEdit_home") || undefined,
        alternativeContact: get("personEdit_alternativeContact") || undefined,
      },
      addresses: {},
      popia: {
        consent,
        processingBasis: get("personEdit_processingBasis") || undefined,
        dataProcessingPurpose:
          get("personEdit_dataProcessingPurpose") || undefined,
        dataRetentionPeriod: get("personEdit_dataRetentionPeriod") || undefined,
        consentDate: get("personEdit_consentDate") || undefined,
        consentSource: get("personEdit_consentSource") || undefined,
        marketingConsent: getChecked("personEdit_marketingConsent"),
        thirdPartySharing: getChecked("personEdit_thirdPartySharing"),
      },
      demographics: {
        // Core demographic fields from main form
        birthDate: get("personEdit_demographics_birthDate"),
        gender: get("personEdit_demographics_gender") || undefined,
        // idNumber: intentionally omitted (immutable field)

        // Extended demographic fields
        race: get("personEdit_demographics_race") || undefined,
        maritalStatus:
          get("personEdit_demographics_maritalStatus") || undefined,
        dependentsCount:
          get("personEdit_demographics_dependentsCount") || undefined,
        passportNumber:
          get("personEdit_demographics_passportNumber") || undefined,
        nationality: get("personEdit_demographics_nationality") || undefined,
        homeLanguage: get("personEdit_demographics_homeLanguage") || undefined,
        employment: {
          status: get("personEdit_employment_status") || undefined,
          company: get("personEdit_employment_company") || undefined,
          position: get("personEdit_employment_position") || undefined,
          industry: get("personEdit_employment_industry") || undefined,
          workAddress: get("personEdit_employment_workAddress") || undefined,
          monthlyIncome:
            get("personEdit_employment_monthlyIncome") || undefined,
          employmentDuration:
            get("personEdit_employment_duration") || undefined,
        },
        education: {
          level: get("personEdit_education_level") || undefined,
          institution: get("personEdit_education_institution") || undefined,
          fieldOfStudy: get("personEdit_education_fieldOfStudy") || undefined,
          completionYear:
            get("personEdit_education_completionYear") || undefined,
        },
        medical: {
          conditions: get("medical_conditions") || undefined,
          allergies: get("medical_allergies") || undefined,
          medications: get("medical_medications") || undefined,
          emergencyMedicalInfo: get("medical_emergencyInfo") || undefined,
        },
        disability: {
          hasDisability: getChecked("personEdit_disability_hasDisability"),
          type: get("personEdit_disability_type") || undefined,
          assistanceRequired:
            get("personEdit_disability_assistanceRequired") || undefined,
        },
      },
      socioEconomic: {
        // Note: These fields don't exist in the current HTML form
        // householdSize: get("personEdit_householdSize") || undefined,
        // householdIncome: get("personEdit_householdIncome") || undefined,
        // dwellingType: get("personEdit_dwellingType") || undefined,
        // accessToWater: get("personEdit_accessToWater") || undefined,
        // accessToElectricity: get("personEdit_accessToElectricity") || undefined,
        // transportMode: get("personEdit_transportMode") || undefined,
        // internetAccess: getChecked("personEdit_internetAccess"),
        // bankAccount: getChecked("personEdit_bankAccount"),
        // socialGrants: getChecked("personEdit_socialGrants"),
        // grantTypes: get("personEdit_grantTypes") || undefined,
        // householdExpenses: get("personEdit_householdExpenses") || undefined,
        // savingsAmount: get("personEdit_savingsAmount") || undefined,
        // debtAmount: get("personEdit_debtAmount") || undefined,
        // financialDependents: get("personEdit_financialDependents") || undefined,
      },
      nextOfKin: {
        fullName: get("personEdit_nextOfKin_name") || undefined,
        relationship: get("personEdit_nextOfKin_relationship") || undefined,
        contactNumber: get("personEdit_nextOfKin_phoneNumber") || undefined,
        email: get("personEdit_nextOfKin_email") || undefined,
        address: get("personEdit_nextOfKin_address") || undefined,
        isEmergencyContact: getChecked(
          "personEdit_nextOfKin_isEmergencyContact"
        ),
      },
      // Note: Emergency contact fields don't exist in current HTML form
      // emergencyContact: {
      //   name: get("personEdit_emergencyContact_name") || undefined,
      //   relationship: get("personEdit_emergencyContact_relationship") || undefined,
      //   phone: get("personEdit_emergencyContact_phone") || undefined,
      //   alternativePhone: get("personEdit_emergencyContact_alternativePhone") || undefined,
      //   address: get("personEdit_emergencyContact_address") || undefined,
      // },
    };

    // Address handling - comprehensive with multiple address types
    const addressTypes = ["residential", "postal"];
    addressTypes.forEach((type) => {
      const prefix =
        type === "residential" ? "personEdit_addr_" : `personEdit_${type}_`;
      const addressFields = {
        line1: get(`${prefix}line1`),
        line2: get(`${prefix}line2`),
        city: get(`${prefix}city`),
        province: get(`${prefix}province`),
        postalCode: get(`${prefix}postalCode`),
        countryCode: "ZA",
      };

      // Check if we have the minimum required fields for a valid address
      const requiredAddressFields = ["line1", "city", "province", "postalCode"];
      const hasRequiredFields = requiredAddressFields.every(
        (field) =>
          addressFields[field] && addressFields[field].trim().length > 0
      );

      // Check if any address field has data
      const hasAnyAddressData = Object.values(addressFields).some(
        (value) => value && value.trim().length > 0
      );

      if (hasRequiredFields) {
        // Include complete address
        payload.addresses[type] = {
          line1: addressFields.line1,
          line2: addressFields.line2 || undefined,
          city: addressFields.city,
          province: addressFields.province,
          postalCode: addressFields.postalCode,
          countryCode: "ZA",
        };
      } else if (hasAnyAddressData) {
        // Partial address detected - don't include this address type
        console.warn(
          `[PersonEdit] Partial ${type} address detected - not saving incomplete address data`
        );
      }
    });

    // Clean up empty nested objects
    Object.keys(payload).forEach((key) => {
      if (
        typeof payload[key] === "object" &&
        payload[key] !== null &&
        !Array.isArray(payload[key])
      ) {
        // Remove empty string values and undefined values from nested objects
        Object.keys(payload[key]).forEach((nestedKey) => {
          if (
            payload[key][nestedKey] === "" ||
            payload[key][nestedKey] === undefined
          ) {
            delete payload[key][nestedKey];
          }
          // Handle nested objects (like employment, education, medical)
          if (
            typeof payload[key][nestedKey] === "object" &&
            payload[key][nestedKey] !== null
          ) {
            Object.keys(payload[key][nestedKey]).forEach((deepKey) => {
              if (
                payload[key][nestedKey][deepKey] === "" ||
                payload[key][nestedKey][deepKey] === undefined
              ) {
                delete payload[key][nestedKey][deepKey];
              }
            });
            // Remove empty nested objects
            if (Object.keys(payload[key][nestedKey]).length === 0) {
              delete payload[key][nestedKey];
            }
          }
        });
        // Remove empty parent objects
        if (Object.keys(payload[key]).length === 0) {
          delete payload[key];
        }
      }
    });

    // Only remove contact if all contact fields are empty
    if (
      payload.contact &&
      !payload.contact.email &&
      !payload.contact.mobile &&
      !payload.contact.workPhone &&
      !payload.contact.homePhone &&
      !payload.contact.alternativeContact
    ) {
      delete payload.contact;
    }

    // Ensure addresses object exists even if empty
    if (!payload.addresses) {
      payload.addresses = {};
    }

    console.log("[PersonEdit] Complete payload:", payload);
    return payload;
  }

  function pruneEmpty(obj) {
    if (!obj || typeof obj !== "object") return obj;
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v && typeof v === "object") pruneEmpty(v);
      if (v === undefined || v === null || v === "") delete obj[k];
      else if (
        typeof obj[k] === "object" &&
        !Array.isArray(obj[k]) &&
        Object.keys(obj[k]).length === 0
      )
        delete obj[k];
    });
    return obj;
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

    const form = qs("#personEditForm", root);
    if (!form) return;
    const statusEl = qs("#personEdit_personEditStatus", form);

    function setStatus(msg, type = "info") {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.dataset.type = type;
      statusEl.className = `form-status status-${type}`; // simple hook for optional styling
    }

    // ID Number and Email are not editable
    const idField = qs("#personEdit_demographics_idNumber", form);
    if (idField) {
      idField.readOnly = true;
      idField.setAttribute("aria-readonly", "true");
      idField.setAttribute("readonly", "readonly");
      // Clear any existing validation errors
      clearFieldError(idField, root);
    }
    const emailField = qs("#personEdit_email", form);
    if (emailField) {
      emailField.readOnly = true;
      emailField.setAttribute("aria-readonly", "true");
      emailField.setAttribute("readonly", "readonly");
      // Clear any existing validation errors
      clearFieldError(emailField, root);
    }

    const inputs = qsa("input, select, textarea", form);

    // Clear all validation errors when form loads
    inputs.forEach((field) => {
      if (field.id === "idNumber" || field.id === "email") {
        clearFieldError(field, root);
      }
    });

    inputs.forEach((field) => {
      // Skip readonly fields from event listeners entirely
      if (
        field.readOnly ||
        field.hasAttribute("readonly") ||
        field.id === "idNumber" ||
        field.id === "email"
      ) {
        return;
      }

      field.addEventListener("focus", () => clearFieldError(field, root));
      field.addEventListener("blur", () => validateField(field, root));
      field.addEventListener("input", () => validateField(field, root));
      if (field.tagName === "SELECT")
        field.addEventListener("change", () => validateField(field, root));
    });

    const btnCancel = qs('[data-action="cancel"]', form);
    if (btnCancel) btnCancel.addEventListener("click", () => close());

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      inputs.forEach((f) => {
        // Skip validation for readonly fields during form submission
        if (
          f.readOnly ||
          f.hasAttribute("readonly") ||
          f.id === "idNumber" ||
          f.id === "email"
        ) {
          return;
        }
        if (!validateField(f, root)) ok = false;
      });
      if (!ok) {
        console.log("[PersonEdit] Form validation failed, cannot submit");
        return;
      }
      console.log(
        "[PersonEdit] Form validation passed, proceeding with submission"
      );
      const btn = qs('button[type="submit"]', form);
      const orig = btn?.textContent;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Saving...";
      }
      setStatus("Saving changes...", "info");
      try {
        const api = await getApi();
        const id =
          root.dataset.recordId ||
          qs("#personEdit_recordIdDisplay", root)?.textContent?.trim();
        if (!id) {
          console.error("[PersonEdit] No record ID resolved – aborting update");
          setStatus(
            "No person ID loaded. Close and reopen the modal.",
            "error"
          );
          return;
        }
        let payload = pruneEmpty(toPayload(form, root));
        if (DEBUG)
          console.log(
            "[PersonEdit] Attempt PUT",
            id,
            JSON.stringify(payload, null, 2)
          );
        // Initialize notifications (parity with create modal)
        try {
          if (window.ensureNotifications) await window.ensureNotifications();
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
        let res;
        try {
          // Full update first
          res = await api.persons.update(id, payload);
        } catch (putErr) {
          if (DEBUG)
            console.warn("[PersonEdit] PUT failed, fallback to PATCH", putErr);
          res = await api.persons.patch(id, payload); // partial attempt
        }
        if (DEBUG) console.log("[PersonEdit] Update response", res);
        // toast
        await showToast("success", "Person updated successfully");
        setStatus("Saved successfully", "success");
        // close and refresh list
        setTimeout(() => close(), 50);
        if (window.reloadPeopleList) window.reloadPeopleList();
      } catch (err) {
        console.error("Update person failed", err?.status, err?.message || err);
        let msg = "Failed to update person";
        if (err?.status === 403) msg = "Not permitted";
        else if (err?.data?.message) msg = err.data.message;
        else if (err?.message) msg = err.message;
        await showToast("error", msg);
        setStatus(msg, "error");
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = orig || "Save Changes";
        }
        // If saving failed and we didn't close, keep status visible.
      }
    });
  }

  function fillForm(root, person, recordId) {
    console.log("[PersonEdit] Starting fillForm with person data:", person);

    const set = (id, val) => {
      const el = qs("#" + id, root);
      if (el) {
        el.value = val == null ? "" : String(val);
        console.log(
          `[PersonEdit] Set field ${id} = "${el.value}" (element found)`
        );
      } else {
        console.warn(`[PersonEdit] Field element not found: ${id}`);
      }
    };

    const setChecked = (id, val) => {
      const el = qs("#" + id, root);
      if (el) {
        el.checked = !!val;
        console.log(
          `[PersonEdit] Set checkbox ${id} = ${el.checked} (element found)`
        );
      } else {
        console.warn(`[PersonEdit] Checkbox element not found: ${id}`);
      }
    };

    const setSelect = (id, val) => {
      const el = qs("#" + id, root);
      if (el && val) {
        // Find and select the option
        const options = Array.from(el.options);
        const option = options.find(
          (o) => o.value === val || o.textContent === val
        );
        if (option) {
          el.value = option.value;
          console.log(
            `[PersonEdit] Set select ${id} = "${el.value}" (option found)`
          );
        } else {
          console.warn(
            `[PersonEdit] Option not found for ${id} with value: ${val}`
          );
        }
      } else if (!el) {
        console.warn(`[PersonEdit] Select element not found: ${id}`);
      } else {
        console.log(`[PersonEdit] No value provided for select ${id}`);
      }
    };

    console.log(
      "[PersonEdit] Full person data:",
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

    set("personEdit_firstName", first);
    set("personEdit_surname", surname);
    set("personEdit_middleNames", middleNames);
    set("personEdit_preferredName", preferredName);
    set("personEdit_dateOfBirth", dob ? String(dob).slice(0, 10) : "");
    setSelect("personEdit_gender", gender);

    // Set ID Number with explicit style to prevent masking
    const idField = qs("#personEdit_demographics_idNumber", root);
    if (idField) {
      idField.value = idNumber || "";
      // Apply comprehensive anti-masking properties
      idField.style.webkitTextSecurity = "none";
      idField.style.textSecurity = "none";
      idField.style.fontFamily = "monospace";
      idField.setAttribute("autocomplete", "off");
      idField.setAttribute("data-lpignore", "true");
      idField.setAttribute("data-form-type", "other");
      idField.removeAttribute("password");
      idField.type = "text"; // Explicitly ensure it's a text field
      idField.readOnly = true;
      idField.setAttribute("readonly", "readonly");
      // Clear any validation errors on the readonly ID field
      clearFieldError(idField, root);
      console.log("[PersonEdit] Setting ID Number:", idNumber);
    }

    // Contact information
    const contact = person.contact || {};
    set("personEdit_email", contact.email || "");
    set("personEdit_mobile", contact.mobile || "");
    set("personEdit_home", contact.home || "");
    set("personEdit_work", contact.work || "");

    const emailFieldSet = qs("#personEdit_email", root);
    if (emailFieldSet) {
      emailFieldSet.readOnly = true;
      emailFieldSet.setAttribute("readonly", "readonly");
      // Clear any validation errors on the readonly email field
      clearFieldError(emailFieldSet, root);
    }

    // Address information
    const addresses = person.addresses || {};
    const residential = addresses.residential || {};
    const postal = addresses.postal || {};

    // Residential address
    set("personEdit_addr_line1", residential.line1 || "");
    set("personEdit_addr_line2", residential.line2 || "");
    set("personEdit_addr_unit", residential.unit || "");
    set("personEdit_addr_complex", residential.complex || "");
    set("personEdit_addr_streetNumber", residential.streetNumber || "");
    set("personEdit_addr_streetName", residential.streetName || "");
    set("personEdit_addr_suburb", residential.suburb || "");
    set("personEdit_addr_city", residential.city || "");
    set("personEdit_addr_municipality", residential.municipality || "");
    setSelect("personEdit_addr_province", residential.province);
    set("personEdit_addr_postalCode", residential.postalCode || "");

    // Postal address
    set("personEdit_postal_line1", postal.line1 || "");
    set("personEdit_postal_line2", postal.line2 || "");
    set("personEdit_postal_unit", postal.unit || "");
    set("personEdit_postal_complex", postal.complex || "");
    set("personEdit_postal_streetNumber", postal.streetNumber || "");
    set("personEdit_postal_streetName", postal.streetName || "");
    set("personEdit_postal_suburb", postal.suburb || "");
    set("personEdit_postal_city", postal.city || "");
    set("personEdit_postal_municipality", postal.municipality || "");
    setSelect("personEdit_postal_province", postal.province);
    set("personEdit_postal_postalCode", postal.postalCode || "");

    // Demographics
    const demographics = person.demographics || {};
    setSelect("personEdit_demographics_race", demographics.race);
    setSelect(
      "personEdit_demographics_maritalStatus",
      demographics.maritalStatus
    );
    set(
      "personEdit_demographics_dependentsCount",
      demographics.dependentsCount || ""
    );
    set("personEdit_demographics_idNumber", demographics.idNumber || "");
    set(
      "personEdit_demographics_passportNumber",
      demographics.passportNumber || ""
    );
    set("personEdit_demographics_birthDate", demographics.birthDate || "");
    setSelect("personEdit_demographics_gender", demographics.gender);
    set("personEdit_demographics_nationality", demographics.nationality || "");
    set(
      "personEdit_demographics_homeLanguage",
      demographics.homeLanguage || ""
    );

    // Employment
    const employment = demographics.employment || {};
    setSelect("personEdit_employment_status", employment.status);
    set("personEdit_employment_company", employment.company || "");
    set("personEdit_employment_position", employment.position || "");
    set("personEdit_employment_industry", employment.industry || "");
    set("personEdit_employment_monthlyIncome", employment.monthlyIncome || "");

    // Education
    const education = demographics.education || {};
    setSelect("personEdit_education_level", education.level);
    set("personEdit_education_institution", education.institution || "");
    set("personEdit_education_fieldOfStudy", education.fieldOfStudy || "");
    set("personEdit_education_graduationYear", education.graduationYear || "");

    // Disability
    const disability = demographics.disability || {};
    setChecked("personEdit_disability_hasDisability", disability.hasDisability);
    set("personEdit_disability_type", disability.type || "");
    set(
      "personEdit_disability_assistanceRequired",
      disability.assistanceRequired || ""
    );

    // Socio-economic information
    const socioEconomic = person.socioEconomic || {};
    set("personEdit_taxNumber", socioEconomic.taxNumber || "");
    set("personEdit_uifNumber", socioEconomic.uifNumber || "");
    set("personEdit_medicalAidNumber", socioEconomic.medicalAidNumber || "");
    setSelect("personEdit_employmentStatus", socioEconomic.employmentStatus);

    const employer = socioEconomic.employer || {};
    set("personEdit_employer_name", employer.name || "");
    set("personEdit_employer_employeeNumber", employer.employeeNumber || "");

    // Next of Kin
    const nextOfKin = person.nextOfKin || {};
    set("personEdit_nextOfKin_name", nextOfKin.name || "");
    set("personEdit_nextOfKin_relationship", nextOfKin.relationship || "");
    set("personEdit_nextOfKin_phoneNumber", nextOfKin.phoneNumber || "");
    set("personEdit_nextOfKin_email", nextOfKin.email || "");

    // POPIA data population
    const popia = person.popia || {};
    setChecked("personEdit_popia_consent", popia.consent);
    setSelect("personEdit_processingBasis", popia.processingBasis);
    setSelect("personEdit_dataSubjectCategory", popia.dataSubjectCategory);

    console.log(
      "[PersonEdit] Address data:",
      JSON.stringify(addresses, null, 2)
    );
    console.log("[PersonEdit] POPIA data:", JSON.stringify(popia, null, 2));
    console.log(
      "[PersonEdit] Demographics data:",
      JSON.stringify(demographics, null, 2)
    );
    console.log(
      "[PersonEdit] Next of Kin data:",
      JSON.stringify(nextOfKin, null, 2)
    );

    const ridEl = qs("#personEdit_recordIdDisplay", root);
    if (ridEl) {
      const displayId =
        recordId || person.id || person.personId || person._id || "—";
      ridEl.textContent = displayId;
      // Ensure no masking attributes
      ridEl.style.webkitTextSecurity = "none";
      ridEl.style.textSecurity = "none";
      ridEl.style.fontFamily = "monospace";
      ridEl.setAttribute("data-no-mask", "true");
      ridEl.style.fontFamily = "monospace";
      console.log("[PersonEdit] Setting record ID display:", displayId);
    }
    root.dataset.recordId = ridEl?.textContent || "";

    console.log(
      "[PersonEdit] fillForm completed successfully - all form fields populated"
    );
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
      console.error("Failed to load person for editing", e);
      const ridEl = qs("#personEdit_recordIdDisplay", container);
      if (ridEl) ridEl.textContent = id || "—";
      container.dataset.recordId = id || "";
    }
  }

  function close() {
    const container = qs("#" + containerId);
    if (!container) return;
    container.classList.remove("show");
    const form = qs("#personEditForm", container);
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
    delete container.dataset.recordId;
  }

  window.openPersonEditModal = open;
})();
