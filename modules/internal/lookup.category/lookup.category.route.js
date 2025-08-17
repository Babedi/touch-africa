import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";

import {
  createLookupCategory,
  getLookupCategoryById,
  updateLookupCategoryById,
  deleteLookupCategoryById,
  getAllLookupCategories,
  searchLookupCategories,
  checkLookupCategoryExists,
  readRoles,
  writeRoles,
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
  "/internal/lookupCategory/create",
  authenticateJWT,
  authorize(...writeRoles),
  createLookupCategory
);

/**
 * @route   GET /internal/lookupCategory/list
 * @desc    Get all lookup categories
 * @access  Private (Root Admin, Super Admin, Standard Admin)
 * @auth    JWT Token required
 */
router.get(
  "/internal/lookupCategory/list",
  authenticateJWT,
  authorize(...readRoles),
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
  "/internal/lookupCategory/search",
  authenticateJWT,
  authorize(...readRoles),
  searchLookupCategories
);

/**
 * @route   GET /internal/lookupCategory/:id
 * @desc    Get lookup category by ID
 * @access  Private (Root Admin, Super Admin, Standard Admin)
 * @auth    JWT Token required
 * @param   id - The lookup category ID
 */
router.get(
  "/internal/lookupCategory/:id",
  authenticateJWT,
  authorize(...readRoles),
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
  "/internal/lookupCategory/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateLookupCategoryById
);

/**
 * @route   DELETE /internal/lookupCategory/:id
 * @desc    Delete lookup category by ID
 * @access  Private (Root Admin, Super Admin)
 * @auth    JWT Token required
 * @param   id - The lookup category ID
 */
router.delete(
  "/internal/lookupCategory/:id",
  authenticateJWT,
  authorize(...writeRoles),
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
  "/internal/lookupCategory/:id/exists",
  authenticateJWT,
  authorize(...readRoles),
  checkLookupCategoryExists
);

export default router;
