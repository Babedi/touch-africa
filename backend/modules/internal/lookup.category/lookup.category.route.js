import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";

import {
  createLookupCategory,
  getLookupCategoryById,
  updateLookupCategoryById,
  deleteLookupCategoryById,
  getAllLookupCategories,
  searchLookupCategories,
  checkLookupCategoryExists,
  patchLookupCategoryById,
  searchLookupCategoriesHandler,
  bulkLookupCategoriesHandler,
  exportLookupCategoriesHandler,
  getLookupCategoriesStatsHandler,
} from "./lookup.category.controller.js";

const router = express.Router();

// ================================
// LOOKUP CATEGORY ROUTES
// ================================

/**
 * @route   POST /internal/lookupCategory/create
 * @desc    Create a new lookup category
 * @access  Private (Root Admin, Super Admin)
 * @auth    JWT Token required
 * @body    { category: string, description: string }
 */
router.post(
  "/internal/lookup-categories",
  authenticateJWT,
  checkPermissions("lookup.create"),
  createLookupCategory
);

/**
 * @route   GET /internal/lookupCategory/list
 * @desc    Get all lookup categories
 * @access  Private (Root Admin, Super Admin, Standard Admin)
 * @auth    JWT Token required
 */
router.get(
  "/internal/lookup-categories",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getAllLookupCategories
);

/**
 * @route   GET /internal/lookupCategory/search
 * @desc    Search lookup categories by category name
 * @access  Private (Root Admin, Super Admin, Standard Admin)
 * @auth    JWT Token required
 * @query   ?category=searchTerm
 */
router.get(
  "/internal/lookup-categories/search",
  authenticateJWT,
  checkPermissions("lookup.read"),
  searchLookupCategories
);

// Enhanced search with full query support (q, filters, sort, pagination)
router.get(
  "/internal/lookup-categories/query",
  authenticateJWT,
  checkPermissions("lookup.read"),
  searchLookupCategoriesHandler
);

// Bulk operations
router.post(
  "/internal/lookup-categories/bulk",
  authenticateJWT,
  checkPermissions("lookup.update"),
  bulkLookupCategoriesHandler
);

// Export
router.get(
  "/internal/lookup-categories/export",
  authenticateJWT,
  checkPermissions("lookup.read"),
  exportLookupCategoriesHandler
);

// Stats
router.get(
  "/internal/lookup-categories/stats",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getLookupCategoriesStatsHandler
);

/**
 * @route   GET /internal/lookupCategory/:id
 * @desc    Get lookup category by ID
 * @access  Private (Root Admin, Super Admin, Standard Admin)
 * @auth    JWT Token required
 * @param   id - The lookup category ID
 */
router.get(
  "/internal/lookup-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getLookupCategoryById
);

/**
 * @route   PUT /internal/lookupCategory/:id
 * @desc    Update lookup category by ID
 * @access  Private (Root Admin, Super Admin)
 * @auth    JWT Token required
 * @param   id - The lookup category ID
 * @body    { category?: string, description?: string }
 */
router.put(
  "/internal/lookup-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.update"),
  updateLookupCategoryById
);

/**
 * @route   PATCH /internal/lookup-categories/:id
 * @desc    Partially update lookup category by ID
 * @access  Private (Root Admin, Super Admin)
 * @auth    JWT Token required
 * @param   id - The lookup category ID
 * @body    { category?: string, description?: string }
 */
router.patch(
  "/internal/lookup-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.update"),
  patchLookupCategoryById
);

/**
 * @route   DELETE /internal/lookupCategory/:id
 * @desc    Delete lookup category by ID
 * @access  Private (Root Admin, Super Admin)
 * @auth    JWT Token required
 * @param   id - The lookup category ID
 */
router.delete(
  "/internal/lookup-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.delete"),
  deleteLookupCategoryById
);

/**
 * @route   GET /internal/lookupCategory/:id/exists
 * @desc    Check if lookup category exists
 * @access  Private (Root Admin, Super Admin, Standard Admin)
 * @auth    JWT Token required
 * @param   id - The lookup category ID
 */
router.get(
  "/internal/lookup-categories/:id/exists",
  authenticateJWT,
  checkPermissions("lookup.read"),
  checkLookupCategoryExists
);

export default router;
