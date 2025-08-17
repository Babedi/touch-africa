import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";

import {
  createLookupSubCategory,
  getLookupSubCategoryById,
  updateLookupSubCategoryById,
  deleteLookupSubCategoryById,
  getAllLookupSubCategories,
  searchLookupSubCategories,
  checkLookupSubCategoryExists,
  readRoles,
  writeRoles,
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
  "/internal/lookupSubCategory",
  authenticateJWT,
  authorize(...writeRoles),
  createLookupSubCategory
);

/**
 * @route   GET /internal/lookupSubCategory/list
 * @desc    Get all lookup sub categories
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 */
router.get(
  "/internal/lookupSubCategory/list",
  authenticateJWT,
  authorize(...readRoles),
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
  "/internal/lookupSubCategory/search",
  authenticateJWT,
  authorize(...readRoles),
  searchLookupSubCategories
);

/**
 * @route   GET /internal/lookupSubCategory/:id
 * @desc    Get lookup sub category by ID
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @param   id - The lookup sub category ID
 */
router.get(
  "/internal/lookupSubCategory/:id",
  authenticateJWT,
  authorize(...readRoles),
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
  "/internal/lookupSubCategory/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateLookupSubCategoryById
);

/**
 * @route   DELETE /internal/lookupSubCategory/:id
 * @desc    Delete lookup sub category by ID
 * @access  Private (Root Admin, Super Admin, lookupSubCategoryManager)
 * @auth    JWT Token required
 * @param   id - The lookup sub category ID
 */
router.delete(
  "/internal/lookupSubCategory/:id",
  authenticateJWT,
  authorize(...writeRoles),
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
  "/internal/lookupSubCategory/:id/exists",
  authenticateJWT,
  authorize(...readRoles),
  checkLookupSubCategoryExists
);

export default router;
