/**
 * NeighbourGuard™ Validation System
 * Client-side validation using Zod-compatible schemas
 */

// Simple validation library (Zod-compatible)
const z = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  array: (schema) => new ArraySchema(schema),
  object: (shape) => new ObjectSchema(shape),
  enum: (values) => new EnumSchema(values),
  optional: (schema) => new OptionalSchema(schema),
  literal: (value) => new LiteralSchema(value),
};

class ValidationError extends Error {
  constructor(message, path, code) {
    super(message);
    this.name = "ValidationError";
    this.path = path;
    this.code = code;
  }
}

class BaseSchema {
  constructor() {
    this.checks = [];
    this.isOptional = false;
  }

  optional() {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.isOptional = true;
    return schema;
  }

  parse(value, path = "") {
    if (value === undefined || value === null) {
      if (this.isOptional) {
        return undefined;
      }
      throw new ValidationError(`Required field`, path, "required");
    }

    return this._parse(value, path);
  }

  safeParse(value, path = "") {
    try {
      return { success: true, data: this.parse(value, path) };
    } catch (error) {
      return { success: false, error };
    }
  }
}

class StringSchema extends BaseSchema {
  constructor() {
    super();
    this.minLength = null;
    this.maxLength = null;
    this.pattern = null;
    this.emailCheck = false;
    this.phoneCheck = false;
  }

  min(length) {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.minLength = length;
    return schema;
  }

  max(length) {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.maxLength = length;
    return schema;
  }

  email() {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.emailCheck = true;
    return schema;
  }

  regex(pattern) {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.pattern = pattern;
    return schema;
  }

  phone() {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.phoneCheck = true;
    return schema;
  }

  _parse(value, path) {
    if (typeof value !== "string") {
      throw new ValidationError(
        `Expected string, got ${typeof value}`,
        path,
        "invalid_type"
      );
    }

    if (this.minLength !== null && value.length < this.minLength) {
      throw new ValidationError(
        `Minimum length is ${this.minLength}`,
        path,
        "too_small"
      );
    }

    if (this.maxLength !== null && value.length > this.maxLength) {
      throw new ValidationError(
        `Maximum length is ${this.maxLength}`,
        path,
        "too_big"
      );
    }

    if (this.emailCheck) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new ValidationError(
          "Invalid email format",
          path,
          "invalid_email"
        );
      }
    }

    if (this.phoneCheck) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
        throw new ValidationError(
          "Invalid phone number format",
          path,
          "invalid_phone"
        );
      }
    }

    if (this.pattern && !this.pattern.test(value)) {
      throw new ValidationError("Invalid format", path, "invalid_pattern");
    }

    return value;
  }
}

class NumberSchema extends BaseSchema {
  constructor() {
    super();
    this.minValue = null;
    this.maxValue = null;
    this.integerCheck = false;
  }

  min(value) {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.minValue = value;
    return schema;
  }

  max(value) {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.maxValue = value;
    return schema;
  }

  int() {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.integerCheck = true;
    return schema;
  }

  _parse(value, path) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError("Invalid number", path, "invalid_number");
    }

    if (this.integerCheck && !Number.isInteger(num)) {
      throw new ValidationError("Must be an integer", path, "invalid_integer");
    }

    if (this.minValue !== null && num < this.minValue) {
      throw new ValidationError(
        `Minimum value is ${this.minValue}`,
        path,
        "too_small"
      );
    }

    if (this.maxValue !== null && num > this.maxValue) {
      throw new ValidationError(
        `Maximum value is ${this.maxValue}`,
        path,
        "too_big"
      );
    }

    return num;
  }
}

class BooleanSchema extends BaseSchema {
  _parse(value, path) {
    if (typeof value === "boolean") {
      return value;
    }
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === 1) return true;
    if (value === 0) return false;

    throw new ValidationError("Invalid boolean value", path, "invalid_boolean");
  }
}

class ArraySchema extends BaseSchema {
  constructor(itemSchema) {
    super();
    this.itemSchema = itemSchema;
    this.minItems = null;
    this.maxItems = null;
  }

  min(length) {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.minItems = length;
    return schema;
  }

  max(length) {
    const schema = Object.create(Object.getPrototypeOf(this));
    Object.assign(schema, this);
    schema.maxItems = length;
    return schema;
  }

  _parse(value, path) {
    if (!Array.isArray(value)) {
      throw new ValidationError("Expected array", path, "invalid_type");
    }

    if (this.minItems !== null && value.length < this.minItems) {
      throw new ValidationError(
        `Minimum ${this.minItems} items required`,
        path,
        "too_small"
      );
    }

    if (this.maxItems !== null && value.length > this.maxItems) {
      throw new ValidationError(
        `Maximum ${this.maxItems} items allowed`,
        path,
        "too_big"
      );
    }

    return value.map((item, index) =>
      this.itemSchema.parse(item, `${path}[${index}]`)
    );
  }
}

class ObjectSchema extends BaseSchema {
  constructor(shape) {
    super();
    this.shape = shape;
  }

  _parse(value, path) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ValidationError("Expected object", path, "invalid_type");
    }

    const result = {};

    for (const [key, schema] of Object.entries(this.shape)) {
      const fieldPath = path ? `${path}.${key}` : key;
      result[key] = schema.parse(value[key], fieldPath);
    }

    return result;
  }
}

class EnumSchema extends BaseSchema {
  constructor(values) {
    super();
    this.values = values;
  }

  _parse(value, path) {
    if (!this.values.includes(value)) {
      throw new ValidationError(
        `Must be one of: ${this.values.join(", ")}`,
        path,
        "invalid_enum"
      );
    }
    return value;
  }
}

class LiteralSchema extends BaseSchema {
  constructor(value) {
    super();
    this.value = value;
  }

  _parse(value, path) {
    if (value !== this.value) {
      throw new ValidationError(
        `Must be ${this.value}`,
        path,
        "invalid_literal"
      );
    }
    return value;
  }
}

class OptionalSchema extends BaseSchema {
  constructor(schema) {
    super();
    this.schema = schema;
    this.isOptional = true;
  }

  _parse(value, path) {
    if (value === undefined || value === null) {
      return undefined;
    }
    return this.schema.parse(value, path);
  }
}

// Common validation schemas for NeighbourGuard™
const schemas = {
  // Authentication schemas
  internalAdminLogin: z.object({
    email: z
      .string()
      .email()
      .regex(
        /@neighbourguard\.co\.za$/,
        "Must use @neighbourguard.co.za domain"
      ),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),

  tenantAdminLogin: z.object({
    tenantName: z.string().min(1, "Tenant name is required"),
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),

  tenantUserLogin: z.object({
    tenantName: z.string().min(1, "Tenant name is required"),
    phoneNumber: z.string().phone(),
    pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
  }),

  // Admin management
  createAdmin: z.object({
    roles: z.array(z.enum(["internalRootAdmin", "internalSuperAdmin"])).min(1),
    title: z.enum(["Mr", "Mrs", "Ms", "Dr", "Prof"]),
    names: z.string().min(1, "Names are required"),
    surname: z.string().min(1, "Surname is required"),
    accessDetails: z.object({
      email: z
        .string()
        .email()
        .regex(
          /@neighbourguard\.co\.za$/,
          "Must use @neighbourguard.co.za domain"
        ),
      password: z.string().min(8, "Password must be at least 8 characters"),
    }),
    account: z.object({
      isActive: z.object({
        value: z.boolean(),
        changes: z.array(z.string()),
      }),
    }),
  }),

  // Tenant management
  createTenant: z.object({
    activationResponseBlockName: z
      .string()
      .min(1, "Response block name is required"),
    address: z.object({
      locality: z.string().min(1, "Locality is required"),
      province: z.string().min(1, "Province is required"),
      country: z.literal("South Africa"),
      postalCode: z.string().regex(/^\d{4}$/, "Postal code must be 4 digits"),
    }),
    activationContextMenu: z.object({
      english: z.object({
        menuItem1: z.string().optional(),
        menuItem2: z.string().optional(),
        menuItem3: z.string().optional(),
        menuItem4: z.string().optional(),
        menuItem5: z.string().optional(),
      }),
    }),
    ussdRefId: z.number().int().min(1),
  }),

  // Tenant user management
  createTenantUser: z.object({
    title: z.enum(["Mr", "Mrs", "Ms", "Dr", "Prof"]),
    names: z.string().min(1, "Names are required"),
    surname: z.string().min(1, "Surname is required"),
    subAddress: z.object({
      streetOrFloor: z.string().min(1, "Street/Floor is required"),
      unit: z.string().optional(),
    }),
    activationDetails: z.object({
      phoneNumber: z.string().phone(),
      pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
      preferredMenuLanguage: z.enum(["English", "Afrikaans", "Zulu"]),
      isATester: z.boolean(),
    }),
  }),

  // Alarm system management
  createInternalAlarm: z.object({
    serialNumber: z.string().min(1, "Serial number is required"),
    sgmModuleType: z.string().min(1, "Module type is required"),
    modelDescription: z.string().min(1, "Model description is required"),
    accessDetails: z.object({
      phoneNumber: z.string().phone(),
      pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
    }),
  }),

  createExternalAlarm: z.object({
    serialNumber: z.string().min(1, "Serial number is required"),
    sgmModuleType: z.string().min(1, "Module type is required"),
    modelDescription: z.string().min(1, "Model description is required"),
    accessDetails: z.object({
      phoneNumber: z.string().phone(),
      pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
    }),
    account: z.object({
      isActive: z.object({
        value: z.boolean(),
        changes: z.array(z.string()),
      }),
    }),
  }),
};

/**
 * Form validation utility
 */
class FormValidator {
  constructor(schema) {
    this.schema = schema;
    this.errors = {};
  }

  /**
   * Validate entire form
   */
  validate(data) {
    this.errors = {};

    try {
      const result = this.schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      this.errors[error.path || "root"] = error.message;
      return { success: false, errors: this.errors };
    }
  }

  /**
   * Validate single field
   */
  validateField(fieldPath, value) {
    try {
      // Navigate to the field schema
      const fieldSchema = this.getFieldSchema(fieldPath);
      if (fieldSchema) {
        fieldSchema.parse(value);
        delete this.errors[fieldPath];
        return { success: true };
      }
    } catch (error) {
      this.errors[fieldPath] = error.message;
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get schema for specific field
   */
  getFieldSchema(fieldPath) {
    const parts = fieldPath.split(".");
    let current = this.schema.shape;

    for (const part of parts) {
      if (current && current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = {};
  }

  /**
   * Get error for field
   */
  getFieldError(fieldPath) {
    return this.errors[fieldPath];
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldPath) {
    return !!this.errors[fieldPath];
  }

  /**
   * Get all errors
   */
  getAllErrors() {
    return { ...this.errors };
  }
}

/**
 * Real-time form validation helper
 */
function setupFormValidation(formElement, schema) {
  const validator = new FormValidator(schema);
  const inputs = formElement.querySelectorAll("input, select, textarea");

  inputs.forEach((input) => {
    const fieldPath = input.name || input.id;
    if (!fieldPath) return;

    // Validate on blur
    input.addEventListener("blur", () => {
      const value = input.type === "checkbox" ? input.checked : input.value;
      const result = validator.validateField(fieldPath, value);

      updateFieldUI(input, result);
    });

    // Clear errors on focus
    input.addEventListener("focus", () => {
      clearFieldError(input);
    });
  });

  // Validate entire form on submit
  formElement.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    // Convert checkbox values
    inputs.forEach((input) => {
      if (input.type === "checkbox") {
        data[input.name || input.id] = input.checked;
      }
    });

    const result = validator.validate(data);

    if (result.success) {
      // Form is valid, dispatch custom event
      formElement.dispatchEvent(
        new CustomEvent("validSubmit", {
          detail: { data: result.data },
        })
      );
    } else {
      // Update UI for all field errors
      Object.entries(result.errors).forEach(([fieldPath, error]) => {
        const input = formElement.querySelector(
          `[name="${fieldPath}"], [id="${fieldPath}"]`
        );
        if (input) {
          updateFieldUI(input, { success: false, error });
        }
      });
    }
  });

  return validator;
}

/**
 * Update field UI based on validation result
 */
function updateFieldUI(input, result) {
  const fieldGroup = input.closest(".field-group") || input.parentElement;
  const errorElement = fieldGroup.querySelector(".field-error");

  if (result.success) {
    input.classList.remove("field--error");
    input.classList.add("field--valid");
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    }
  } else {
    input.classList.remove("field--valid");
    input.classList.add("field--error");

    if (errorElement) {
      errorElement.textContent = result.error;
      errorElement.style.display = "block";
    } else {
      // Create error element if it doesn't exist
      const error = document.createElement("div");
      error.className = "field-error";
      error.textContent = result.error;
      fieldGroup.appendChild(error);
    }
  }
}

/**
 * Clear field error UI
 */
function clearFieldError(input) {
  const fieldGroup = input.closest(".field-group") || input.parentElement;
  const errorElement = fieldGroup.querySelector(".field-error");

  input.classList.remove("field--error", "field--valid");

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.style.display = "none";
  }
}

// Export for global use
window.z = z;
window.schemas = schemas;
window.FormValidator = FormValidator;
window.setupFormValidation = setupFormValidation;

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    z,
    schemas,
    FormValidator,
    setupFormValidation,
    ValidationError,
  };
}
