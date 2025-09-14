import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  advancedListQuery,
  searchQuery,
  exportQuery,
} from "../../../middleware/query.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createPersonHandler,
  getPersonByIdHandler,
  updatePersonHandler,
  deletePersonHandler,
  listPersonsHandler,
  searchPersonsHandler,
  bulkPersonsHandler,
  exportPersonsHandler,
  getPersonStatsHandler,
  validatePersonHandler,
  patchPersonHandler,
} from "./person.controller.js";

/**
 * Person Router
 * Defines HTTP routes for person management with authentication and authorization
 */

const router = express.Router();

// POST /internal/persons - Create new person
router.post(
  "/internal/persons",
  authenticateJWT,
  checkPermissions("admin.create"),
  createPersonHandler
);

// GET /internal/persons/search - Search persons by criteria
router.get(
  "/internal/persons/search",
  authenticateJWT,
  checkPermissions("admin.read"),
  advancedListQuery({
    sortFields: [
      "personalInfo.fullName",
      "personalInfo.firstName",
      "personalInfo.lastName",
      "personalInfo.gender",
      "gender",
      "contactInfo.email",
      "contactInfo.mobile",
      "address.city",
      "address.province",
      "idNumber",
      // flat sorts
      "firstName",
      "lastName",
      "surname",
      "email",
      "createdAt",
      "audit.createdAt",
    ],
    searchFields: [
      // nested shapes
      "personalInfo.firstName",
      "personalInfo.lastName",
      "personalInfo.fullName",
      "contactInfo.email",
      "contactInfo.mobile",
      "idNumber",
      "address.province",
      "address.city",
      // flat shapes used by current data
      "firstName",
      "surname",
      "email",
      "contact.email",
      "contact.mobile",
      "addresses.residential.city",
      "addresses.residential.province",
    ],
  }),
  searchPersonsHandler
);

// GET /internal/persons/export - Export persons data
router.get(
  "/internal/persons/export",
  authenticateJWT,
  checkPermissions("admin.read"),
  exportQuery({
    sortFields: [
      "personalInfo.firstName",
      "personalInfo.lastName",
      "contactInfo.email",
      "audit.createdAt",
    ],
    filterFields: [
      "citizenship",
      "address.province",
      "contactInfo.email",
      "idNumber",
    ],
  }),
  exportPersonsHandler
);

// GET /internal/persons/stats - Get person statistics
router.get(
  "/internal/persons/stats",
  authenticateJWT,
  checkPermissions("admin.read"),
  getPersonStatsHandler
);

// POST /internal/persons/bulk - Bulk operations for persons
router.post(
  "/internal/persons/bulk",
  authenticateJWT,
  checkPermissions("admin.create", "admin.update", "admin.delete"),
  bulkPersonsHandler
);

// POST /internal/persons/validate - Validate person data consistency
router.post(
  "/internal/persons/validate",
  authenticateJWT,
  checkPermissions("admin.create"),
  validatePersonHandler
);

// GET /internal/persons - List all persons with comprehensive query support
router.get(
  "/internal/persons",
  authenticateJWT,
  checkPermissions("admin.read"),
  advancedListQuery({
    sortFields: [
      "gender",
      "personalInfo.gender",
      "personalInfo.firstName",
      "personalInfo.lastName",
      "personalInfo.fullName",
      "contactInfo.email",
      "contactInfo.mobile",
      "address.city",
      "address.province",
      "idNumber",
      // flat sorts
      "firstName",
      "lastName",
      "surname",
      "email",
      "createdAt",
      "audit.createdAt",
    ],
    filterFields: [
      "citizenship",
      "address.province",
      "contactInfo.email",
      "idNumber",
    ],
    searchFields: [
      // nested shapes
      "personalInfo.firstName",
      "personalInfo.lastName",
      "personalInfo.fullName",
      "contactInfo.email",
      "contactInfo.mobile",
      "idNumber",
      "address.province",
      "address.city",
      // flat shapes used by current data
      "firstName",
      "surname",
      "email",
      "contact.email",
      "contact.mobile",
      "addresses.residential.city",
      "addresses.residential.province",
    ],
    expands: ["personalInfo", "contactInfo", "address"],
  }),
  listPersonsHandler
);

// GET /internal/persons/:id - Get person by ID
router.get(
  "/internal/persons/:id",
  authenticateJWT,
  checkPermissions("admin.read"),
  getPersonByIdHandler
);

// PUT /internal/persons/:id - Update person by ID
router.put(
  "/internal/persons/:id",
  authenticateJWT,
  checkPermissions("admin.update"),
  updatePersonHandler
);

// PATCH /internal/persons/:id - Partially update person by ID
router.patch(
  "/internal/persons/:id",
  authenticateJWT,
  checkPermissions("admin.update"),
  patchPersonHandler
);

// DELETE /internal/persons/:id - Delete person by ID
router.delete(
  "/internal/persons/:id",
  authenticateJWT,
  checkPermissions("admin.delete"),
  deletePersonHandler
);

export default router;
