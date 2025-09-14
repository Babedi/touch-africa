import {
  CultivarTemplateSchema,
  CultivarTemplateUpdateSchema,
  validateActor,
} from "./cultivar.template.validation.js";
import {
  createTemplate,
  getTemplateById,
  updateTemplateById,
  deleteTemplateById,
  getAllTemplates,
  listTemplatesService,
  searchTemplatesService,
  bulkTemplatesService,
  exportTemplatesService,
  getTemplatesStatsService,
} from "./cultivar.template.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  handleZodError,
} from "../../../utilities/response.util.js";

/**
 * Create a new cultivar template
 */
export const createCultivarTemplate = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = CultivarTemplateSchema.parse(req.body);

    // Get actor
    const actor = validateActor(req);

    // Create template
    const template = await createTemplate(validatedData, actor);

    return sendSuccess(
      res,
      template,
      "Cultivar template created successfully",
      201
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * Get cultivar template by ID
 */
export const getCultivarTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await getTemplateById(id);

    if (!template) {
      return sendNotFound(res, "Template not found");
    }

    return sendSuccess(
      res,
      template,
      "Cultivar template retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update cultivar template by ID
 */
export const updateCultivarTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = CultivarTemplateUpdateSchema.parse(req.body);

    // Get actor
    const actor = validateActor(req);

    // Update template
    const template = await updateTemplateById(id, validatedData, actor);

    return sendSuccess(res, template, "Cultivar template updated successfully");
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    if (error.message.includes("not found")) {
      return sendNotFound(res, "Template not found");
    }
    next(error);
  }
};

/**
 * Delete cultivar template by ID
 */
export const deleteCultivarTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteTemplateById(id);

    return sendSuccess(
      res,
      { message: "Template deleted successfully" },
      "Template deleted successfully"
    );
  } catch (error) {
    if (error.message.includes("not found")) {
      return sendNotFound(res, "Template not found");
    }
    next(error);
  }
};

/**
 * Get all cultivar templates with comprehensive query support
 */
export const getAllCultivarTemplates = async (req, res, next) => {
  try {
    // Normalized query provided by advancedListQuery middleware (optional)
    const qp = { ...req.query };
    if (req.parsedQuery) {
      const { pagination, sort, search, filters } = req.parsedQuery;
      if (pagination) {
        qp.page = pagination.page;
        qp.limit = pagination.limit;
      }
      if (sort?.field) {
        const fieldMap = {
          createdAt: "created.when",
          updatedAt: "updated.when",
        };
        qp.sort = fieldMap[sort.field] || sort.field;
        qp.order = sort.order;
      }
      if (search?.query) qp.search = search.query;
      if (filters) qp.filters = filters;
    }
    const result = await listTemplatesService(qp);
    return sendSuccess(
      res,
      result.data,
      "Cultivar templates retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Search cultivar templates with enhanced query capabilities
 * GET /internal/cultivar-templates/search
 */
export const searchCultivarTemplates = async (req, res, next) => {
  try {
    const result = await searchTemplatesService(req.query);

    return sendSuccess(
      res,
      result.data,
      "Template search completed successfully",
      200,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk operations for cultivar templates
 * POST /internal/cultivar-templates/bulk
 */
export const bulkCultivarTemplates = async (req, res, next) => {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const result = await bulkTemplatesService(operation, data);

    const statusCode = result.success ? 200 : 207; // 207 for partial success
    return sendSuccess(
      res,
      result,
      `Bulk ${operation} operation completed`,
      statusCode
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Export cultivar templates data
 * GET /internal/cultivar-templates/export
 */
export const exportCultivarTemplates = async (req, res, next) => {
  try {
    const { format = "json" } = req.query;
    const result = await exportTemplatesService(format, req.query);

    // Set appropriate headers for file download
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return res.send(result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get cultivar templates statistics and analytics
 * GET /internal/cultivar-templates/stats
 */
export const getCultivarTemplatesStats = async (req, res, next) => {
  try {
    const stats = await getTemplatesStatsService();

    return sendSuccess(
      res,
      stats,
      "Template statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Partially update cultivar template by ID
 * PATCH /internal/cultivar-templates/:id
 */
export const patchCultivarTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body for partial update
    const validatedData = CultivarTemplateUpdateSchema.partial().parse(
      req.body
    );

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update template
    const updatedTemplate = await updateTemplate(id, validatedData, actor);

    return sendSuccess(
      res,
      updatedTemplate,
      "Cultivar template partially updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};
