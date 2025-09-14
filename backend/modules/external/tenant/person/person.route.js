import express from "express";
import { authenticateJWT } from "../../../../middleware/auth.middleware.js";
import {
  advancedListQuery,
  searchQuery,
  exportQuery,
} from "../../../../middleware/query.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
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

// POST /:tenantId/persons - Create new person
router.post(
  "/:tenantId/persons",
  authenticateJWT,
  checkPermissions("tenant.person.create"),
  createPersonHandler
);

// GET /:tenantId/persons/search - Search persons by criteria
router.get(
  "/:tenantId/persons/search",
  authenticateJWT,
  checkPermissions("tenant.person.read"),
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

// GET /:tenantId/persons/export - Export persons data
router.get(
  "/:tenantId/persons/export",
  authenticateJWT,
  checkPermissions("tenant.person.read"),
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

// GET /:tenantId/persons/stats - Get person statistics
router.get(
  "/:tenantId/persons/stats",
  authenticateJWT,
  checkPermissions("tenant.person.read"),
  getPersonStatsHandler
);

// POST /:tenantId/persons/bulk - Bulk operations for persons
router.post(
  "/:tenantId/persons/bulk",
  authenticateJWT,
  checkPermissions(
    "tenant.person.create",
    "tenant.person.update",
    "tenant.person.delete"
  ),
  bulkPersonsHandler
);

// POST /:tenantId/persons/validate - Validate person data consistency
router.post(
  "/:tenantId/persons/validate",
  authenticateJWT,
  checkPermissions("tenant.person.create"),
  validatePersonHandler
);

// GET /:tenantId/persons - List all persons with comprehensive query support
router.get(
  "/:tenantId/persons",
  authenticateJWT,
  checkPermissions("tenant.person.read"),
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

// GET /:tenantId/persons/:id - Get person by ID
router.get(
  "/:tenantId/persons/:id",
  authenticateJWT,
  checkPermissions("tenant.person.read"),
  getPersonByIdHandler
);

// PUT /:tenantId/persons/:id - Update person by ID
router.put(
  "/:tenantId/persons/:id",
  authenticateJWT,
  checkPermissions("tenant.person.update"),
  updatePersonHandler
);

// PATCH /:tenantId/persons/:id - Partially update person by ID
router.patch(
  "/:tenantId/persons/:id",
  authenticateJWT,
  checkPermissions("tenant.person.update"),
  patchPersonHandler
);

// DELETE /:tenantId/persons/:id - Delete person by ID
router.delete(
  "/:tenantId/persons/:id",
  authenticateJWT,
  checkPermissions("tenant.person.delete"),
  deletePersonHandler
);

export default router;
