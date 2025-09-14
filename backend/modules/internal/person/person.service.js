import crypto from "crypto";
import {
  newPersonId,
  // validateSAIdCheckDigit, // Commented out due to simplified SA ID validation
  extractDateFromSAId,
  sanitizePersonResponse,
} from "./person.validation.js";
import {
  createPerson,
  getPersonById,
  updatePersonById,
  deletePersonById,
  getAllPersons,
  searchPersons,
} from "./person.firestore.js";
import { db } from "../../../services/firestore.client.js";
import {
  buildFirestoreQuery,
  applySearch,
  applySorting,
  formatPaginatedResponse,
  createExportResponse,
  createPaginationMeta,
} from "../../../utilities/query.util.js";

/**
 * Enhanced validation for editable fields in person updates
 * @param {Object} data - Person update data
 * @returns {Array} Array of validation errors
 */
function validateEditableFields(data) {
  const errors = [];

  // Validate first name
  if (data.firstName !== undefined) {
    if (typeof data.firstName !== "string") {
      errors.push({
        field: "firstName",
        message: "First name must be a string",
      });
    } else if (data.firstName.trim().length < 1) {
      errors.push({ field: "firstName", message: "First name is required" });
    } else if (data.firstName.length > 50) {
      errors.push({
        field: "firstName",
        message: "First name must not exceed 50 characters",
      });
    } else if (!/^[A-Za-z\s\-'\.]+$/.test(data.firstName)) {
      errors.push({
        field: "firstName",
        message: "First name contains invalid characters",
      });
    }
  }

  // Validate surname
  if (data.surname !== undefined) {
    if (typeof data.surname !== "string") {
      errors.push({ field: "surname", message: "Surname must be a string" });
    } else if (data.surname.trim().length < 1) {
      errors.push({ field: "surname", message: "Surname is required" });
    } else if (data.surname.length > 50) {
      errors.push({
        field: "surname",
        message: "Surname must not exceed 50 characters",
      });
    } else if (!/^[A-Za-z\s\-'\.]+$/.test(data.surname)) {
      errors.push({
        field: "surname",
        message: "Surname contains invalid characters",
      });
    }
  }

  // Validate date of birth (now in demographics)
  if (data.demographics?.dateOfBirth !== undefined) {
    if (typeof data.demographics.dateOfBirth !== "string") {
      errors.push({
        field: "demographics.dateOfBirth",
        message: "Date of birth must be a string",
      });
    } else {
      const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobRegex.test(data.demographics.dateOfBirth)) {
        errors.push({
          field: "demographics.dateOfBirth",
          message: "Date of birth must be in YYYY-MM-DD format",
        });
      } else {
        const dob = new Date(data.demographics.dateOfBirth);
        const today = new Date();
        const minDate = new Date(1900, 0, 1);

        if (isNaN(dob.getTime())) {
          errors.push({
            field: "demographics.dateOfBirth",
            message: "Invalid date of birth",
          });
        } else if (dob > today) {
          errors.push({
            field: "demographics.dateOfBirth",
            message: "Date of birth cannot be in the future",
          });
        } else if (dob < minDate) {
          errors.push({
            field: "demographics.dateOfBirth",
            message: "Date of birth cannot be before 1900",
          });
        }
      }
    }
  }

  // Validate gender (now in demographics)
  if (data.demographics?.gender !== undefined) {
    const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
    if (!validGenders.includes(data.demographics.gender)) {
      errors.push({
        field: "demographics.gender",
        message: "Invalid gender value",
      });
    }
  }

  // Validate contact information
  if (data.contact !== undefined) {
    if (typeof data.contact !== "object" || data.contact === null) {
      errors.push({ field: "contact", message: "Contact must be an object" });
    } else {
      // Validate mobile phone
      if (data.contact.mobile !== undefined) {
        if (data.contact.mobile !== null && data.contact.mobile !== "") {
          const phoneRegex = /^(\+27|0)\d{9}$/;
          if (!phoneRegex.test(data.contact.mobile)) {
            errors.push({
              field: "contact.mobile",
              message:
                "Mobile number must be in format +27xxxxxxxxx or 0xxxxxxxxx",
            });
          }
        }
      }

      // Validate home phone
      if (data.contact.home !== undefined) {
        if (data.contact.home !== null && data.contact.home !== "") {
          const phoneRegex = /^(\+27|0)\d{9}$/;
          if (!phoneRegex.test(data.contact.home)) {
            errors.push({
              field: "contact.home",
              message:
                "Home number must be in format +27xxxxxxxxx or 0xxxxxxxxx",
            });
          }
        }
      }

      // Validate work phone
      if (data.contact.work !== undefined) {
        if (data.contact.work !== null && data.contact.work !== "") {
          const phoneRegex = /^(\+27|0)\d{9}$/;
          if (!phoneRegex.test(data.contact.work)) {
            errors.push({
              field: "contact.work",
              message:
                "Work number must be in format +27xxxxxxxxx or 0xxxxxxxxx",
            });
          }
        }
      }
    }
  }

  // Validate addresses
  if (data.addresses !== undefined) {
    if (typeof data.addresses !== "object" || data.addresses === null) {
      errors.push({
        field: "addresses",
        message: "Addresses must be an object",
      });
    } else {
      // Validate residential address
      if (data.addresses.residential !== undefined) {
        const addr = data.addresses.residential;
        if (typeof addr !== "object" || addr === null) {
          errors.push({
            field: "addresses.residential",
            message: "Residential address must be an object",
          });
        } else {
          if (
            addr.line1 &&
            (typeof addr.line1 !== "string" || addr.line1.trim().length < 1)
          ) {
            errors.push({
              field: "addresses.residential.line1",
              message: "Address line 1 is required",
            });
          }
          if (
            addr.city &&
            (typeof addr.city !== "string" || addr.city.trim().length < 1)
          ) {
            errors.push({
              field: "addresses.residential.city",
              message: "City is required",
            });
          }
          if (
            addr.province &&
            ![
              "Eastern Cape",
              "Free State",
              "Gauteng",
              "KwaZulu-Natal",
              "Limpopo",
              "Mpumalanga",
              "Northern Cape",
              "North West",
              "Western Cape",
            ].includes(addr.province)
          ) {
            errors.push({
              field: "addresses.residential.province",
              message: "Invalid South African province",
            });
          }
          if (addr.postalCode && !/^\d{4}$/.test(addr.postalCode)) {
            errors.push({
              field: "addresses.residential.postalCode",
              message: "Postal code must be 4 digits",
            });
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Person Service Layer
 * Handles business logic and data transformation for person management
 */

/**
 * Create a new person record
 * @param {Object} data - Person data
 * @param {string} actor - ID of user creating the person
 * @returns {Promise<Object>} Created person record
 */
export async function createPersonRecord(data, actor) {
  try {
    // Generate server-side ID
    const personId = newPersonId();

    // SA ID validation simplified to format-only - check digit validation removed
    // if (data.demographics?.idNumber && !validateSAIdCheckDigit(data.demographics.idNumber)) {
    //   throw new Error("Invalid SA ID number check digit");
    // }

    // Auto-extract date of birth from SA ID if not provided (now in demographics)
    if (data.demographics?.idNumber && !data.demographics?.dateOfBirth) {
      const extractedDate = extractDateFromSAId(data.demographics.idNumber);
      if (extractedDate) {
        if (!data.demographics) data.demographics = {};
        data.demographics.dateOfBirth = extractedDate;
        console.log(`📅 Auto-extracted DOB from SA ID: ${extractedDate}`);
      }
    }

    // Validate date consistency (now in demographics)
    if (data.demographics?.idNumber && data.demographics?.dateOfBirth) {
      const extractedDate = extractDateFromSAId(data.demographics.idNumber);
      if (extractedDate && extractedDate !== data.demographics.dateOfBirth) {
        throw new Error("Date of birth does not match SA ID number");
      }
    }

    // Set audit metadata
    const now = new Date().toISOString();
    const auditData = {
      createdAt: now,
      updatedAt: now,
      sourceSystem: "touchafrica-api",
      recordVersion: 1,
    };

    // Build complete person model
    const personModel = {
      id: personId,
      ...data,
      audit: {
        ...data.audit,
        ...auditData,
      },
    };

    console.log(`🏗️ Creating person: ${personId} by ${actor}`);
    const created = await createPerson(personModel);

    return sanitizePersonResponse(created);
  } catch (error) {
    console.error(`❌ Service error creating person:`, error);
    throw error;
  }
}

/**
 * Get person by ID with business logic
 * @param {string} id - Person ID
 * @param {string} actor - ID of user requesting the person
 * @returns {Promise<Object|null>} Person record or null if not found
 */
export async function getPersonRecord(id, actor) {
  try {
    console.log(`🔍 Getting person: ${id} for ${actor}`);
    const person = await getPersonById(id);

    if (!person) {
      return null;
    }

    return sanitizePersonResponse(person);
  } catch (error) {
    console.error(`❌ Service error getting person ${id}:`, error);
    throw error;
  }
}

/**
 * Update person record with business logic
 * @param {string} id - Person ID
 * @param {Object} data - Updated person data
 * @param {string} actor - ID of user updating the person
 * @returns {Promise<Object>} Updated person record
 */
export async function updatePersonRecord(id, data, actor) {
  try {
    // Get existing person to check current data FIRST
    const existing = await getPersonById(id);
    if (!existing) {
      throw new Error(`Person with ID ${id} not found`);
    }

    // ENFORCE IMMUTABILITY: Remove SA ID and email from update data regardless of what frontend sends
    const sanitizedData = { ...data };

    // SA ID is completely immutable - remove any attempt to change it (now in demographics)
    if (sanitizedData.demographics?.idNumber !== undefined) {
      console.warn(
        `⚠️ Attempt to change SA ID for person ${id} blocked by backend protection`
      );
      delete sanitizedData.demographics.idNumber;
    }

    // Email is immutable - preserve existing email and remove any attempt to change it
    if (sanitizedData.contact?.email !== undefined) {
      console.warn(
        `⚠️ Attempt to change email for person ${id} blocked by backend protection`
      );

      // Preserve existing email in contact object if it exists
      if (existing.contact?.email) {
        if (!sanitizedData.contact) sanitizedData.contact = {};
        sanitizedData.contact.email = existing.contact.email;
      } else {
        // Remove email from update if no existing email
        if (sanitizedData.contact) {
          delete sanitizedData.contact.email;
        }
      }
    } else {
      // If no email in update data, preserve existing email
      if (existing.contact?.email) {
        if (!sanitizedData.contact) sanitizedData.contact = {};
        sanitizedData.contact.email = existing.contact.email;
      }
    }

    // SA ID validation simplified to format-only - check digit validation removed
    // if (
    //   sanitizedData.idNumber &&
    //   !validateSAIdCheckDigit(sanitizedData.idNumber)
    // ) {
    //   throw new Error("Invalid SA ID number check digit");
    // }

    // Validate date consistency if both ID and DOB are being updated
    if (sanitizedData.idNumber && sanitizedData.dateOfBirth) {
      const extractedDate = extractDateFromSAId(sanitizedData.idNumber);
      if (extractedDate && extractedDate !== sanitizedData.dateOfBirth) {
        throw new Error("Date of birth does not match SA ID number");
      }
    }

    // Legacy validation logic (should not be needed after sanitization but kept for safety)
    if (
      sanitizedData.idNumber &&
      existing.dateOfBirth &&
      !sanitizedData.dateOfBirth
    ) {
      const extractedDate = extractDateFromSAId(sanitizedData.idNumber);
      if (extractedDate && extractedDate !== existing.dateOfBirth) {
        throw new Error(
          "New SA ID number does not match existing date of birth"
        );
      }
    }

    // Auto-extract DOB if new SA ID provided and no DOB exists (should not happen after sanitization)
    if (
      sanitizedData.idNumber &&
      !existing.dateOfBirth &&
      !sanitizedData.dateOfBirth
    ) {
      const extractedDate = extractDateFromSAId(sanitizedData.idNumber);
      if (extractedDate) {
        sanitizedData.dateOfBirth = extractedDate;
        console.log(`📅 Auto-extracted DOB from new SA ID: ${extractedDate}`);
      }
    }

    console.log(
      `✏️ Updating person: ${id} by ${actor} with backend-protected data`
    );

    // Enhanced validation for editable fields
    const validationErrors = validateEditableFields(sanitizedData);
    if (validationErrors.length > 0) {
      const error = new Error("Validation failed for editable fields");
      error.details = validationErrors;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    const updated = await updatePersonById(id, sanitizedData);

    return sanitizePersonResponse(updated);
  } catch (error) {
    console.error(`❌ Service error updating person ${id}:`, error);
    throw error;
  }
}

/**
 * Delete person record
 * @param {string} id - Person ID
 * @param {string} actor - ID of user deleting the person
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deletePersonRecord(id, actor) {
  try {
    console.log(`🗑️ Deleting person: ${id} by ${actor}`);
    return await deletePersonById(id);
  } catch (error) {
    console.error(`❌ Service error deleting person ${id}:`, error);
    throw error;
  }
}

/**
 * Get all person records with comprehensive query support
 * @param {Object} queryParams - Query parameters from request
 * @param {string} actor - ID of user requesting the list
 * @returns {Promise<Object>} Object with persons array and pagination info
 */
export async function getAllPersonRecords(queryParams = {}, actor) {
  try {
    console.log(`📋 Getting all persons for ${actor} with query:`, queryParams);
    console.log(`🔍 Sort parameters:`, {
      sort: queryParams.sort,
      sortBy: queryParams.sortBy,
      order: queryParams.order,
    });

    // Build Firestore query against correct Firestore path
    const firestoreQuery = buildFirestoreQuery(
      "touchAfrica/southAfrica/people",
      queryParams
    );

    // Execute query
    const snapshot = await firestoreQuery.get();
    let persons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Apply search if specified
    if (queryParams.search || queryParams.q) {
      const searchObj = queryParams.search || {
        query: String(queryParams.q || ""),
        fields: [
          // nested
          "personalInfo.firstName",
          "personalInfo.lastName",
          "personalInfo.fullName",
          "contactInfo.email",
          "contactInfo.mobile",
          "address.province",
          "address.city",
          // flat
          "firstName",
          "surname",
          "email",
          "contact.email",
          "contact.mobile",
          "addresses.residential.city",
          "addresses.residential.province",
          // identifiers
          "idNumber",
        ],
      };
      persons = applySearch(persons, searchObj);
    }

    // Apply field selection when provided (parsed as { include, exclude })
    if (queryParams.fields) {
      persons = applyFieldSelection(persons, queryParams.fields);
    }

    // Sanitize all person records
    let sanitizedPersons = persons.map((person) =>
      sanitizePersonResponse(person)
    );

    // Apply sorting (supports nested fields). parseQueryParams provides `sort`.
    if (queryParams.sort) {
      console.log(
        `🔄 Applying sorting with parsed sort object:`,
        queryParams.sort
      );
      sanitizedPersons = applySorting(sanitizedPersons, queryParams.sort);
    } else if (queryParams.sortBy) {
      console.log(
        `🔄 Applying client-side sorting with sortBy:`,
        queryParams.sortBy,
        "order:",
        queryParams.order
      );
      // Fallback: create sort object from sortBy/order
      const sortObj = {
        field: queryParams.sortBy,
        order: queryParams.order || "asc",
      };
      sanitizedPersons = applySorting(sanitizedPersons, sortObj);
    }

    // Create pagination metadata using parsed query (expects { pagination: { page, limit } })
    const pagination = createPaginationMeta(
      sanitizedPersons.length,
      queryParams
    );

    // Apply pagination to results
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedPersons = sanitizedPersons.slice(startIndex, endIndex);

    return {
      data: paginatedPersons,
      pagination,
    };
  } catch (error) {
    console.error(`❌ Service error getting all persons:`, error);
    throw error;
  }
}

/**
 * Search for persons by various criteria with comprehensive query support
 * @param {Object} queryParams - Query parameters including search criteria
 * @param {string} actor - ID of user performing the search
 * @returns {Promise<Object>} Object with search results and pagination
 */
export async function searchPersonRecords(queryParams = {}, actor) {
  try {
    console.log(`🔍 Searching persons for ${actor} with params:`, queryParams);

    // Ensure a proper search object exists for downstream processing
    const q = queryParams.q || queryParams.search?.query || "";
    const fields = queryParams.search?.fields ||
      queryParams.searchFields || [
        // nested
        "personalInfo.firstName",
        "personalInfo.lastName",
        "personalInfo.fullName",
        "contactInfo.email",
        "contactInfo.mobile",
        "address.province",
        "address.city",
        // flat
        "firstName",
        "surname",
        "email",
        "contact.email",
        "contact.mobile",
        "addresses.residential.city",
        "addresses.residential.province",
        // identifiers
        "idNumber",
      ];

    const nextParams = {
      ...queryParams,
      search: q ? { query: q, fields } : null,
    };

    return await getAllPersonRecords(nextParams, actor);
  } catch (error) {
    console.error(`❌ Service error searching persons:`, error);
    throw error;
  }
}

/**
 * Bulk operations for persons
 * @param {string} operation - Type of bulk operation
 * @param {Array} data - Data for bulk operation
 * @param {Object} filters - Filters for bulk operation
 * @param {string} actor - ID of user performing the operation
 * @returns {Promise<Object>} Results of bulk operation
 */
export async function bulkPersonRecords(operation, data, filters, actor) {
  try {
    console.log(`🔄 Bulk ${operation} for persons by ${actor}`);

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    switch (operation) {
      case "create":
        if (!Array.isArray(data)) {
          throw new Error("Data must be an array for bulk create");
        }

        for (const personData of data) {
          try {
            await createPersonRecord(personData, actor);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ data: personData, error: error.message });
          }
        }
        break;

      case "update":
        if (!Array.isArray(data)) {
          throw new Error("Data must be an array for bulk update");
        }

        for (const { id, ...updateData } of data) {
          try {
            await updatePersonRecord(id, updateData, actor);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ id, error: error.message });
          }
        }
        break;

      case "delete":
        const idsToDelete = Array.isArray(data) ? data : data.ids;

        for (const id of idsToDelete) {
          try {
            await deletePersonRecord(id, actor);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ id, error: error.message });
          }
        }
        break;

      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    return results;
  } catch (error) {
    console.error(`❌ Service error in bulk person operation:`, error);
    throw error;
  }
}

/**
 * Export persons data
 * @param {Object} queryParams - Query parameters for export
 * @param {string} format - Export format (csv, json)
 * @param {string} actor - ID of user requesting export
 * @returns {Promise<Object>} Export data and metadata
 */
export async function exportPersonRecords(
  queryParams = {},
  format = "csv",
  actor
) {
  try {
    console.log(`📤 Exporting persons in ${format} format for ${actor}`);

    // Get all persons without pagination for export
    const exportParams = {
      ...queryParams,
      limit: 10000, // High limit for export
      page: 1,
    };

    const result = await getAllPersonRecords(exportParams, actor);

    // Convert based on format
    let content;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case "csv":
        content = convertToCSV(result.data);
        contentType = "text/csv";
        filename = `persons_${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "json":
        content = convertToJSON(result.data);
        contentType = "application/json";
        filename = `persons_${new Date().toISOString().split("T")[0]}.json`;
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      data: result.data,
      content,
      contentType,
      filename,
    };
  } catch (error) {
    console.error(`❌ Service error exporting persons:`, error);
    throw error;
  }
}

/**
 * Validate person data consistency
 * @param {Object} data - Person data to validate
 * @returns {Object} Validation result with errors if any
 */
export function validatePersonDataConsistency(data) {
  const errors = [];

  try {
    // Check SA ID consistency
    if (data.idNumber) {
      // SA ID validation simplified to format-only - check digit validation removed
      // if (!validateSAIdCheckDigit(data.idNumber)) {
      //   errors.push("SA ID number check digit is invalid");
      // }

      if (data.dateOfBirth) {
        const extractedDate = extractDateFromSAId(data.idNumber);
        if (extractedDate && extractedDate !== data.dateOfBirth) {
          errors.push("Date of birth does not match SA ID number");
        }
      }
    }

    // Check age consistency
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));

      if (age < 0) {
        errors.push("Date of birth cannot be in the future");
      }

      if (age > 150) {
        errors.push("Age seems unrealistic (over 150 years)");
      }
    }

    // Nationality-based checks removed

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`],
    };
  }
}

/**
 * Get person statistics (for admin dashboards)
 * @param {string} actor - ID of user requesting statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getPersonStatistics(queryParams = {}, actor) {
  try {
    console.log(`📊 Getting person statistics for ${actor}`);

    // For stats, we don't need sorting - just get all records
    const firestoreQuery = db.collection("touchAfrica/southAfrica/people");
    const snapshot = await firestoreQuery.get();
    const persons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const stats = {
      total: persons.length,
      citizenship: {
        southAfrican: 0,
        permanentResident: 0,
        foreigner: 0,
        unknown: 0,
      },
      gender: {
        male: 0,
        female: 0,
        other: 0,
        unspecified: 0,
      },
      provinces: {},
      recent: {
        last24h: 0,
        last7d: 0,
        last30d: 0,
      },
    };

    const now = new Date();
    const day24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Process each person record for statistics
    persons.forEach((person) => {
      // Count citizenship status - citizenshipStatus is now nested under demographics
      const citizenship =
        person.demographics?.citizenshipStatus
          ?.toLowerCase()
          .replace(" ", "_") || "unknown";
      if (citizenship === "south_african") {
        stats.citizenship.southAfrican++;
      } else if (citizenship === "permanent_resident") {
        stats.citizenship.permanentResident++;
      } else if (citizenship === "foreigner") {
        stats.citizenship.foreigner++;
      } else {
        stats.citizenship.unknown++;
      }

      // Count gender - gender is now nested under demographics
      const genderRaw = person.demographics?.gender || "Unspecified";
      const gender = genderRaw.toLowerCase();

      // Map gender values to stats categories
      if (gender === "male") {
        stats.gender.male++;
      } else if (gender === "female") {
        stats.gender.female++;
      } else if (gender === "other") {
        stats.gender.other++;
      } else {
        // Handle "Prefer not to say", "Unspecified", and any other values
        stats.gender.unspecified++;
      }

      // Count provinces
      const province = person.addresses?.residential?.province;
      if (province) {
        stats.provinces[province] = (stats.provinces[province] || 0) + 1;
      }

      // Count recent additions
      if (person.audit?.createdAt) {
        const created = new Date(person.audit.createdAt);
        if (created > day24h) stats.recent.last24h++;
        if (created > day7d) stats.recent.last7d++;
        if (created > day30d) stats.recent.last30d++;
      }
    });

    console.log(`✅ Generated statistics for ${stats.total} persons`);
    return stats;
  } catch (error) {
    console.error(`❌ Service error getting person statistics:`, error);
    throw error;
  }
}
