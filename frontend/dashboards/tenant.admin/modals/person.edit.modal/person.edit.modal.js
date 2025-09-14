// Import centralized validation patterns
import {
  createValidationRules,
  ValidationHelper,
  FIELD_VALIDATORS,
} from "/frontend/shared/js/modal-validation-helper.js";

(function () {
  const { showToast } = window.ToastUtils || {};
  const {
    validateField,
    validateForm,
    clearAllErrors,
    setupRealtimeValidation,
  } = window.ValidationUtils || {};
  const { resetModalForm, setModalLoading, handleFormSubmission } =
    window.ModalUtils || {};

  // Custom validation rules for tenant person edit modal to match backend PersonSchema
  // Custom validation rules using centralized patterns for tenant person edit modal
  const CUSTOM_VALIDATION_RULES = {
    // Name fields - using centralized validators with character validation
    tenantPersonEdit_firstName: [
      {
        validate: FIELD_VALIDATORS.firstName.validate,
      },
    ],
    tenantPersonEdit_surname: [
      {
        validate: FIELD_VALIDATORS.surname.validate,
      },
    ],
    tenantPersonEdit_middleNames: [
      {
        validate: FIELD_VALIDATORS.middleNames.validate,
      },
    ],

    // Contact fields - using centralized validation patterns
    tenantPersonEdit_mobile: [
      {
        validate: (v) => {
          if (!v || v.trim().length === 0) return "Mobile number is required";
          return ValidationHelper.validateMobile(v, true);
        },
      },
    ],
    tenantPersonEdit_home: [
      {
        validate: (v) => ValidationHelper.validatePhone(v, false),
      },
    ],
    tenantPersonEdit_work: [
      {
        validate: (v) => ValidationHelper.validatePhone(v, false),
      },
    ],
    tenantPersonEdit_email: [
      {
        validate: (v) => {
          if (!v || v.trim().length === 0) return "Email address is required";
          return ValidationHelper.validateEmail(v, true);
        },
      },
    ],

    // Demographics - using centralized validators
    tenantPersonEdit_demographics_birthDate: [
      {
        validate: (v) => {
          if (!v || v.trim().length === 0) return "Date of birth is required";
          // Use centralized date validation with additional checks
          const dateValidation = FIELD_VALIDATORS.dateOfBirth.validate(v);
          if (dateValidation !== true) return dateValidation;

          const dob = new Date(v);
          const minDate = new Date(1900, 0, 1);
          if (dob < minDate) return "Date of birth cannot be before 1900";
          return true;
        },
      },
    ],
    tenantPersonEdit_demographics_gender: [
      {
        validate: (v) => {
          if (!v || v.trim().length === 0)
            return "Gender selection is required";
          return FIELD_VALIDATORS.gender.validate(v);
        },
      },
    ],

    // Address validation - conditional requirements using centralized patterns
    tenantPersonEdit_addr_line1: [
      {
        validate: (v) => {
          const form = document.querySelector("#tenantPersonEditForm");
          const hasAddressData = [
            "#tenantPersonEdit_addr_line2",
            "#tenantPersonEdit_addr_city",
            "#tenantPersonEdit_addr_province",
            "#tenantPersonEdit_addr_postalCode",
          ].some((sel) => {
            const field = form?.querySelector(sel);
            return field?.value?.trim();
          });

          if (hasAddressData && (!v || v.trim().length === 0)) {
            return "Address line 1 is required when other address fields are provided";
          }
          return true;
        },
      },
    ],
    tenantPersonEdit_addr_city: [
      {
        validate: (v) => {
          const form = document.querySelector("#tenantPersonEditForm");
          const hasAddressData = [
            "#tenantPersonEdit_addr_line1",
            "#tenantPersonEdit_addr_line2",
            "#tenantPersonEdit_addr_province",
            "#tenantPersonEdit_addr_postalCode",
          ].some((sel) => {
            const field = form?.querySelector(sel);
            return field?.value?.trim();
          });

          if (hasAddressData && (!v || v.trim().length === 0)) {
            return "City is required when other address fields are provided";
          }
          return true;
        },
      },
    ],
    tenantPersonEdit_addr_province: [
      {
        validate: (v) => {
          const form = document.querySelector("#tenantPersonEditForm");
          const hasAddressData = [
            "#tenantPersonEdit_addr_line1",
            "#tenantPersonEdit_addr_line2",
            "#tenantPersonEdit_addr_city",
            "#tenantPersonEdit_addr_postalCode",
          ].some((sel) => {
            const field = form?.querySelector(sel);
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
    ],
    tenantPersonEdit_addr_postalCode: [
      {
        validate: (v) => {
          if (!v || v.trim().length === 0) return true; // Optional unless other address fields present

          // Use centralized postal code validation
          const postalValidation = FIELD_VALIDATORS.postalCode.validate(v);
          if (postalValidation !== true) return postalValidation;

          const form = document.querySelector("#tenantPersonEditForm");
          const hasAddressData = [
            "#tenantPersonEdit_addr_line1",
            "#tenantPersonEdit_addr_line2",
            "#tenantPersonEdit_addr_city",
            "#tenantPersonEdit_addr_province",
          ].some((sel) => {
            const field = form?.querySelector(sel);
            return field?.value?.trim();
          });

          if (hasAddressData && (!v || v.trim().length === 0)) {
            return "Postal code is required when other address fields are provided";
          }
          return true;
        },
      },
    ],
  };

  const containerId = "tenantPersonEditModal";
  const htmlPath =
    "/frontend/dashboards/tenant.admin/modals/person.edit.modal/person.edit.modal.html";
  let apiClientInstance = null;
  const DEBUG = !!window.__DEBUG__;

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }
  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
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
        if (!res.ok)
          throw new Error("Failed to load tenant person edit modal HTML");
        container.innerHTML = await res.text();
      } catch (e) {
        console.error(
          "[TenantPersonEditModal] HTML load failed from",
          htmlPath,
          e
        );
        container.innerHTML =
          '<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2 class="modal-title">Edit Tenant Person</h2><button class="modal-close" aria-label="Close">&times;</button></div><div class="modal-body"><p>Unable to load modal content.</p><div class="form-actions"><button type="button" class="btn btn-secondary" data-action="cancel">Close</button></div></div></div></div>';
      }
      container.dataset.loaded = "1";
      wire(container);
    }
    return container;
  }

  function wire(root) {
    if (root.dataset._wired) return;
    root.dataset._wired = "1";

    const form = qs("#tenantPersonEditForm", root);
    if (!form) {
      console.error("[TenantPersonEditModal] Form not found");
      return;
    }

    // Handle form submission
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleSubmit(form, root);
    });

    // Handle cancel button
    const btnCancel = qs('[data-action="cancel"], .btn-secondary', form);
    if (btnCancel) {
      btnCancel.addEventListener("click", () => closeModal());
    }

    // Handle close button and overlay click
    const closeBtn = qs(".modal-close", root);
    if (closeBtn) closeBtn.addEventListener("click", () => closeModal());

    root.addEventListener("click", (e) => {
      if (e.target === root) closeModal();
    });

    // Handle escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Handle "same as residential" checkbox
    const sameAsResidentialCheckbox = qs(
      "#tenantPersonEdit_sameAsResidential",
      form
    );
    const postalAddressFields = qs(
      "#tenantPersonEdit_postalAddressFields",
      form
    );

    if (sameAsResidentialCheckbox && postalAddressFields) {
      sameAsResidentialCheckbox.addEventListener("change", () => {
        const isChecked = sameAsResidentialCheckbox.checked;
        postalAddressFields.style.display = isChecked ? "none" : "block";

        if (isChecked) {
          copyResidentialToPostal(form);
        }
      });
    }

    // Setup real-time validation with custom rules aligned to backend PersonSchema
    if (setupRealtimeValidation) {
      setupRealtimeValidation(form, CUSTOM_VALIDATION_RULES);
    }
  }

  function copyResidentialToPostal(form) {
    const residentialFields = [
      "addr_line1",
      "addr_line2",
      "addr_unit",
      "addr_complex",
      "addr_streetNumber",
      "addr_streetName",
      "addr_suburb",
      "addr_city",
      "addr_municipality",
      "addr_province",
      "addr_postalCode",
    ];

    residentialFields.forEach((field) => {
      const residentialField = qs(`#tenantPersonEdit_${field}`, form);
      const postalField = qs(
        `#tenantPersonEdit_postal_${field.replace("addr_", "")}`,
        form
      );

      if (residentialField && postalField) {
        postalField.value = residentialField.value;
      }
    });
  }

  function fillForm(root, person, recordId, tenantInfo) {
    console.log("[TenantPersonEditModal] Filling form with data:", person);

    const form = qs("#tenantPersonEditForm", root);
    if (!form) {
      console.error("[TenantPersonEditModal] Form not found");
      return;
    }

    // Set record ID display
    const recordIdDisplay = qs("#tenantPersonEdit_recordIdDisplay", root);
    if (recordIdDisplay) {
      recordIdDisplay.textContent = recordId || "—";
    }

    // Fill tenant information
    if (tenantInfo) {
      const tenantIdField = qs("#tenantPersonEdit_tenantId", form);
      if (tenantIdField) {
        tenantIdField.value = tenantInfo.name || tenantInfo.id || "";
      }
    }

    // Store tenant and person IDs for submission
    form.dataset.tenantId = tenantInfo?.id || "";
    form.dataset.personId = recordId || "";

    // Define field mappings (same as view modal)
    const fieldMappings = {
      // Personal details
      firstName: "#tenantPersonEdit_firstName",
      surname: "#tenantPersonEdit_surname",
      middleNames: "#tenantPersonEdit_middleNames",
      preferredName: "#tenantPersonEdit_preferredName",

      // Contact information
      email: "#tenantPersonEdit_email",
      mobile: "#tenantPersonEdit_mobile",
      home: "#tenantPersonEdit_home",
      work: "#tenantPersonEdit_work",

      // Residential address
      addr_line1: "#tenantPersonEdit_addr_line1",
      addr_line2: "#tenantPersonEdit_addr_line2",
      addr_unit: "#tenantPersonEdit_addr_unit",
      addr_complex: "#tenantPersonEdit_addr_complex",
      addr_streetNumber: "#tenantPersonEdit_addr_streetNumber",
      addr_streetName: "#tenantPersonEdit_addr_streetName",
      addr_suburb: "#tenantPersonEdit_addr_suburb",
      addr_city: "#tenantPersonEdit_addr_city",
      addr_municipality: "#tenantPersonEdit_addr_municipality",
      addr_province: "#tenantPersonEdit_addr_province",
      addr_postalCode: "#tenantPersonEdit_addr_postalCode",

      // Postal address
      postal_line1: "#tenantPersonEdit_postal_line1",
      postal_line2: "#tenantPersonEdit_postal_line2",
      postal_unit: "#tenantPersonEdit_postal_unit",
      postal_complex: "#tenantPersonEdit_postal_complex",
      postal_streetNumber: "#tenantPersonEdit_postal_streetNumber",
      postal_streetName: "#tenantPersonEdit_postal_streetName",
      postal_suburb: "#tenantPersonEdit_postal_suburb",
      postal_city: "#tenantPersonEdit_postal_city",
      postal_municipality: "#tenantPersonEdit_postal_municipality",
      postal_province: "#tenantPersonEdit_postal_province",
      postal_postalCode: "#tenantPersonEdit_postal_postalCode",

      // Demographics
      demographics_nationality: "#tenantPersonEdit_demographics_nationality",
      demographics_idNumber: "#tenantPersonEdit_demographics_idNumber",
      demographics_birthDate: "#tenantPersonEdit_demographics_birthDate",
      demographics_gender: "#tenantPersonEdit_demographics_gender",
      demographics_race: "#tenantPersonEdit_demographics_race",
      demographics_maritalStatus:
        "#tenantPersonEdit_demographics_maritalStatus",
      demographics_dependentsCount:
        "#tenantPersonEdit_demographics_dependentsCount",
      demographics_passportNumber:
        "#tenantPersonEdit_demographics_passportNumber",
      demographics_homeLanguage: "#tenantPersonEdit_demographics_homeLanguage",

      // Employment
      employment_status: "#tenantPersonEdit_employment_status",
      employment_company: "#tenantPersonEdit_employment_company",
      employment_position: "#tenantPersonEdit_employment_position",
      employment_industry: "#tenantPersonEdit_employment_industry",
      employment_monthlyIncome: "#tenantPersonEdit_employment_monthlyIncome",

      // Education
      education_level: "#tenantPersonEdit_education_level",
      education_institution: "#tenantPersonEdit_education_institution",
      education_fieldOfStudy: "#tenantPersonEdit_education_fieldOfStudy",
      education_graduationYear: "#tenantPersonEdit_education_graduationYear",

      // Disability
      disability_hasDisability: "#tenantPersonEdit_disability_hasDisability",
      disability_type: "#tenantPersonEdit_disability_type",
      disability_assistanceRequired:
        "#tenantPersonEdit_disability_assistanceRequired",

      // Next of kin
      nextOfKin_name: "#tenantPersonEdit_nextOfKin_name",
      nextOfKin_relationship: "#tenantPersonEdit_nextOfKin_relationship",
      nextOfKin_phoneNumber: "#tenantPersonEdit_nextOfKin_phoneNumber",
      nextOfKin_email: "#tenantPersonEdit_nextOfKin_email",

      // POPIA
      popia_consent: "#tenantPersonEdit_popia_consent",
      processingBasis: "#tenantPersonEdit_processingBasis",
      dataSubjectCategory: "#tenantPersonEdit_dataSubjectCategory",
    };

    // Fill all form fields
    Object.entries(fieldMappings).forEach(([key, selector]) => {
      const field = qs(selector, form);
      if (field && person[key] !== undefined) {
        if (field.type === "checkbox") {
          field.checked = !!person[key];
        } else if (field.type === "date" && person[key]) {
          // Handle date formatting
          const date = new Date(person[key]);
          if (!isNaN(date.getTime())) {
            field.value = date.toISOString().split("T")[0];
          }
        } else {
          field.value = person[key] || "";
        }
      }
    });
  }

  async function handleSubmit(form, root) {
    if (!form || !root) return;

    try {
      // Clear previous errors
      if (clearAllErrors) clearAllErrors(form);

      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Get tenant and person IDs
      const tenantId = form.dataset.tenantId;
      const personId = form.dataset.personId;

      if (!tenantId || !personId) {
        throw new Error("Missing tenant or person ID");
      }

      // Validate form if validator is available
      if (validateForm) {
        const isValid = await validateForm(form, CUSTOM_VALIDATION_RULES);
        if (!isValid) return;
      }

      // Set loading state
      if (setModalLoading) setModalLoading(form, true);

      // Submit to API
      const api = await getApi();
      const result = await api.put(
        `/tenants/${tenantId}/people/${personId}`,
        data
      );

      // Handle success
      if (setModalLoading) setModalLoading(form, false);
      showToast("success", "Person updated successfully");
      closeModal(true);
    } catch (error) {
      console.error("[TenantPersonEditModal] Submit error:", error);
      if (setModalLoading) setModalLoading(form, false);

      // Handle validation errors
      if (
        error.validationErrors &&
        typeof error.validationErrors === "object"
      ) {
        Object.entries(error.validationErrors).forEach(([field, message]) => {
          const fieldElement = qs(`[name="${field}"]`, form);
          if (fieldElement && validateField) {
            validateField(fieldElement, message, false);
          }
        });
      } else {
        showToast("error", error.message || "Failed to update person");
      }
    }
  }

  function closeModal(success) {
    const overlay = qs("#" + containerId);
    if (!overlay) return;

    overlay.classList.remove("show");

    // Use standardized modal reset function
    const form = qs("#tenantPersonEditForm", overlay);
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

    // Dispatch success event if needed
    if (success) {
      document.dispatchEvent(
        new CustomEvent("tenantPersonUpdated", {
          detail: { success: true },
        })
      );
    }
  }

  async function openModal(personId, tenantId) {
    if (!personId || !tenantId) {
      console.error(
        "[TenantPersonEditModal] Missing required parameters: personId, tenantId"
      );
      showToast("error", "Missing person or tenant information");
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
      console.log("[TenantPersonEditModal] Modal opened successfully");
    } catch (error) {
      console.error("[TenantPersonEditModal] Failed to open modal:", error);
      showToast("error", "Failed to load person information for editing");
    }
  }

  // Expose global open hook
  window.openTenantPersonEditModal = openModal;
})();
