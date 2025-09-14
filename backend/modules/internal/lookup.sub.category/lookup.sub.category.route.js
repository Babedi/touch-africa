import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";

import {
  createLookupSubCategory,
  getLookupSubCategoryById,
  updateLookupSubCategoryById,
  deleteLookupSubCategoryById,
  getAllLookupSubCategories,
  searchLookupSubCategories,
  checkLookupSubCategoryExists,
  patchLookupSubCategoryById,
  searchLookupSubCategoriesHandler,
  bulkLookupSubCategoriesHandler,
  exportLookupSubCategoriesHandler,
  getLookupSubCategoriesStatsHandler,
} from "./lookup.sub.category.controller.js";

const router = express.Router();

// ================================
// LOOKUP SUB CATEGORY ROUTES
// ================================

/**
 * @route   POST /internal/lookupSubCategory
 * @desc    Create a new lookup sub category
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @body    { subcategory: string, description: string }
 */
router.post(
  "/internal/lookup-sub-categories",
  authenticateJWT,
  checkPermissions("lookup.create"),
  createLookupSubCategory
);

/**
 * @route   GET /internal/lookupSubCategory/list
 * @desc    Get all lookup sub categories
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 */
router.get(
  "/internal/lookup-sub-categories",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getAllLookupSubCategories
);

/**
 * @route   GET /internal/lookupSubCategory/search
 * @desc    Search lookup sub categories by subcategory name
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @query   ?subcategory=searchTerm
 */
router.get(
  "/internal/lookup-sub-categories/search",
  authenticateJWT,
  checkPermissions("lookup.read"),
  searchLookupSubCategories
);

// Enhanced search with full query support (q, filters, sort, pagination)
router.get(
  "/internal/lookup-sub-categories/query",
  authenticateJWT,
  checkPermissions("lookup.read"),
  searchLookupSubCategoriesHandler
);

// Bulk operations
router.post(
  "/internal/lookup-sub-categories/bulk",
  authenticateJWT,
  checkPermissions("lookup.update"),
  bulkLookupSubCategoriesHandler
);

// Export
router.get(
  "/internal/lookup-sub-categories/export",
  authenticateJWT,
  checkPermissions("lookup.read"),
  exportLookupSubCategoriesHandler
);

// Stats
router.get(
  "/internal/lookup-sub-categories/stats",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getLookupSubCategoriesStatsHandler
);

/**
 * @route   GET /internal/lookupSubCategory/:id
 * @desc    Get lookup sub category by ID
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @param   id - The lookup sub category ID
 */
router.get(
  "/internal/lookup-sub-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getLookupSubCategoryById
);

/**
 * @route   PUT /internal/lookupSubCategory/:id
 * @desc    Update lookup sub category by ID
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @param   id - The lookup sub category ID
 * @body    { subcategory?: string, description?: string }
 */
router.put(
  "/internal/lookup-sub-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.update"),
  updateLookupSubCategoryById
);

/**
 * @route   PATCH /internal/lookup-sub-categories/:id
 * @desc    Partially update lookup sub category by ID
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @param   id - The lookup sub category ID
 * @body    { subcategory?: string, description?: string }
 */
router.patch(
  "/internal/lookup-sub-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.update"),
  patchLookupSubCategoryById
);

/**
 * @route   DELETE /internal/lookupSubCategory/:id
 * @desc    Delete lookup sub category by ID
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @param   id - The lookup sub category ID
 */
router.delete(
  "/internal/lookup-sub-categories/:id",
  authenticateJWT,
  checkPermissions("lookup.delete"),
  deleteLookupSubCategoryById
);

/**
 * @route   GET /internal/lookupSubCategory/:id/exists
 * @desc    Check if lookup sub category exists
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @param   id - The lookup sub category ID
 */
router.get(
  "/internal/lookup-sub-categories/:id/exists",
  authenticateJWT,
  checkPermissions("lookup.read"),
  checkLookupSubCategoryExists
);

export default router;
