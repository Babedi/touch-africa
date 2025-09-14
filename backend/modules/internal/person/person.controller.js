import { z } from "zod";
import { PersonSchema, PersonUpdateSchema } from "./person.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createPersonRecord,
  getPersonRecord,
  updatePersonRecord,
  deletePersonRecord,
  getAllPersonRecords,
  searchPersonRecords,
  bulkPersonRecords,
  exportPersonRecords,
  getPersonStatistics,
  validatePersonDataConsistency,
} from "./person.service.js";
import {
  sendSuccess,
  sendList,
  sendError,
  sendValidationError,
  sendNotFound,
  sendConflict,
  handleZodError,
} from "../../../utilities/response.util.js";
import {
  formatPaginatedResponse,
  createExportResponse,
} from "../../../utilities/query.util.js";

/**
 * Person Controller
 * Handles HTTP requests for person management
 */

// Define role-based access control
// Permissions defined in route handlers directly

// Permissions defined in route handlers directly

/**
 * Extract actor information from request
 * @param {Object} req - Express request object
 * @returns {string} Actor identifier
 */
function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

/**
 * Create a new person
 * POST /internal/person
 */
export async function createPersonHandler(req, res, next) {
  try {
    // Validate request body
    const validatedData = PersonSchema.parse(req.body);

    // Additional business validation
    const consistencyCheck = validatePersonDataConsistency(validatedData);
    if (!consistencyCheck.isValid) {
      return sendValidationError(
        res,
        "Data consistency validation failed",
        consistencyCheck.errors
      );
    }

    const actor = actorFrom(req);
    const data = await createPersonRecord(validatedData, actor);

    return sendSuccess(res, data, "Person created successfully", 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return handleZodError(res, err);
    }

    // Handle duplicate errors
    if (
      err.code === "DUPLICATE_PERSON" ||
      err.status === 409 ||
      (err.message || "").includes("already exists")
    ) {
      const message =
        err.message || "Person with the provided SA ID number already exists";
      return sendConflict(res, message, err.details || { field: "idNumber" });
    }

    next(err);
  }
}

/**
 * Get person by ID
 * GET /internal/person/:id
 */
export async function getPersonByIdHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendValidationError(res, "Person ID is required");
    }

    const actor = actorFrom(req);
    const data = await getPersonRecord(id, actor);

    if (!data) {
      return sendNotFound(res, `Person with ID ${id} not found`);
    }

    return sendSuccess(res, data, "Person retrieved successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Update person by ID
 * PUT /internal/person/:id
 */
export async function updatePersonHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendValidationError(res, "Person ID is required");
    }

    // Validate request body (partial update)
    const validatedData = PersonUpdateSchema.parse(req.body);

    // Additional business validation if data provided
    const consistencyCheck = validatePersonDataConsistency(validatedData);
    if (!consistencyCheck.isValid) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Data consistency validation failed",
        details: consistencyCheck.errors,
      });
    }

    const actor = actorFrom(req);
    const data = await updatePersonRecord(id, validatedData, actor);

    return sendSuccess(res, data, "Person updated successfully");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return handleZodError(res, err);
    }

    // Handle not found errors
    if (err.message.includes("not found")) {
      return sendNotFound(res, err.message);
    }

    // Handle duplicate errors
    if (
      err.code === "DUPLICATE_PERSON" ||
      err.status === 409 ||
      (err.message || "").includes("already exists")
    ) {
      const message =
        err.message || "Person with the provided SA ID number already exists";
      return sendConflict(res, message, err.details || { field: "idNumber" });
    }

    next(err);
  }
}

/**
 * Delete person by ID
 * DELETE /internal/person/:id
 */
export async function deletePersonHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendValidationError(res, "Person ID is required");
    }

    const actor = actorFrom(req);
    const success = await deletePersonRecord(id, actor);

    if (!success) {
      return sendNotFound(res, `Person with ID ${id} not found`);
    }

    return sendSuccess(
      res,
      { message: "Person deleted successfully" },
      "Person deleted successfully"
    );
  } catch (err) {
    // Handle not found errors
    if (err.message.includes("not found")) {
      return sendNotFound(res, err.message);
    }

    next(err);
  }
}

/**
 * Partially update person by ID
 * PATCH /internal/person/:id
 */
export async function patchPersonHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      return sendValidationError(res, "Person ID is required");
    }

    // Validate partial update data
    const parsed = PersonUpdateSchema.partial().parse(req.body);
    const actor = actorFrom(req);

    const updatedPerson = await updatePersonRecord(id, parsed, actor);

    return sendSuccess(
      res,
      updatedPerson,
      "Person partially updated successfully"
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return handleZodError(res, err);
    }

    // Handle not found errors
    if (err.message.includes("not found")) {
      return sendNotFound(res, err.message);
    }

    // Handle duplicate errors (though less likely in patches since idNumber is immutable)
    if (
      err.code === "DUPLICATE_PERSON" ||
      err.status === 409 ||
      (err.message || "").includes("already exists")
    ) {
      const message =
        err.message ||
        "Patch failed: This would create a duplicate person record";
      return sendConflict(res, message, err.details || { field: "idNumber" });
    }

    next(err);
  }
}

/**
 * Get all persons with pagination
 * GET /internal/person/list
 */
export async function listPersonsHandler(req, res, next) {
  try {
    const actor = actorFrom(req);
    const result = await getAllPersonRecords(req.parsedQuery, actor);

    // Return flat list response (data array + pagination)
    return sendList(
      res,
      result.data,
      result.pagination,
      "Persons retrieved successfully"
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Search persons by criteria
 * GET /internal/person/search
 */
export async function searchPersonsHandler(req, res, next) {
  try {
    const actor = actorFrom(req);
    const result = await searchPersonRecords(req.parsedQuery, actor);

    // Return flat list response (data array + pagination)
    return sendList(
      res,
      result.data,
      result.pagination,
      "Person search completed successfully"
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk operations for persons
 * POST /internal/person/bulk
 */
export async function bulkPersonsHandler(req, res, next) {
  try {
    const { operation, data, filters } = req.body;
    const actor = actorFrom(req);

    const result = await bulkPersonRecords(operation, data, filters, actor);

    return sendSuccess(res, result, `Bulk ${operation} completed successfully`);
  } catch (err) {
    next(err);
  }
}

/**
 * Export persons
 * GET /internal/person/export
 */
export async function exportPersonsHandler(req, res, next) {
  try {
    const { format = "csv" } = req.query;
    const actor = actorFrom(req);
    const result = await exportPersonRecords(req.parsedQuery, format, actor);

    // Create export response
    const exportResponse = createExportResponse(result.data, format, "persons");

    res.setHeader("Content-Type", exportResponse.contentType);
    res.setHeader("Content-Disposition", exportResponse.disposition);

    return res.send(exportResponse.content);
  } catch (err) {
    next(err);
  }
}

/**
 * Get person statistics (admin endpoint)
 * GET /internal/person/stats
 */
export async function getPersonStatsHandler(req, res, next) {
  try {
    const actor = actorFrom(req);
    const stats = await getPersonStatistics(req.parsedQuery, actor);

    return sendSuccess(res, stats, "Person statistics retrieved successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Get person statistics (admin endpoint)
 * GET /internal/person/statistics
 */
export async function getPersonStatisticsHandler(req, res, next) {
  try {
    const actor = actorFrom(req);
    const data = await getPersonStatistics(actor);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Validate person data consistency (utility endpoint)
 * POST /internal/person/validate
 */
export async function validatePersonHandler(req, res, next) {
  try {
    // Validate request body structure first
    const validatedData = PersonSchema.parse(req.body);

    // Then check business consistency
    const consistencyCheck = validatePersonDataConsistency(validatedData);

    res.status(200).json({
      success: true,
      data: {
        isValid: consistencyCheck.isValid,
        errors: consistencyCheck.errors,
        warnings: [],
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(200).json({
        success: true,
        data: {
          isValid: false,
          errors: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
          warnings: [],
        },
      });
    }

    next(err);
  }
}
