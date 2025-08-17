import {
  LookupSchema,
  LookupUpdateSchema,
  isValidLookupId,
} from "./lookup.validation.js";
import {
  createLookupService,
  getLookupService,
  updateLookupService,
  deleteLookupService,
  getAllLookupsService,
} from "./lookup.service.js";

// Define role arrays for authorization
export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "lookupManager",
];
export const writeRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "lookupManager",
];

/**
 * Create a new lookup
 * POST /internal/lookup
 */
export async function createLookupController(req, res, next) {
  try {
    // Validate request body
    const validatedData = LookupSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Create lookup
    const lookup = await createLookupService(validatedData, actor);

    res.status(201).json({
      success: true,
      data: lookup,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }
    next(error);
  }
}

/**
 * Get lookup by ID
 * GET /internal/lookup/:id
 */
export async function getLookupController(req, res, next) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid lookup ID format",
      });
    }

    const lookup = await getLookupService(id);

    if (!lookup) {
      return res.status(404).json({
        success: false,
        error: "Lookup not found",
      });
    }

    res.json({
      success: true,
      data: lookup,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update lookup by ID
 * PUT /internal/lookup/:id
 */
export async function updateLookupController(req, res, next) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid lookup ID format",
      });
    }

    // Validate request body
    const validatedData = LookupUpdateSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Check if lookup exists
    const existingLookup = await getLookupService(id);
    if (!existingLookup) {
      return res.status(404).json({
        success: false,
        error: "Lookup not found",
      });
    }

    // Update lookup
    const updatedLookup = await updateLookupService(id, validatedData, actor);

    res.json({
      success: true,
      data: updatedLookup,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }
    next(error);
  }
}

/**
 * Delete lookup by ID
 * DELETE /internal/lookup/:id
 */
export async function deleteLookupController(req, res, next) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupId(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid lookup ID format",
      });
    }

    // Check if lookup exists
    const existingLookup = await getLookupService(id);
    if (!existingLookup) {
      return res.status(404).json({
        success: false,
        error: "Lookup not found",
      });
    }

    // Delete lookup
    await deleteLookupService(id);

    res.json({
      success: true,
      data: { message: "Lookup deleted successfully" },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all lookups
 * GET /internal/lookup/list
 */
export async function getAllLookupsController(req, res, next) {
  try {
    const lookups = await getAllLookupsService();

    res.json({
      success: true,
      data: lookups,
    });
  } catch (error) {
    next(error);
  }
}
