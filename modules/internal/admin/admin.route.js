import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createInternalAdminHandler,
  getCurrentAdminHandler,
  getInternalAdminByIdHandler,
  updateInternalAdminByIdHandler,
  deleteInternalAdminByIdHandler,
  listInternalAdminsHandler,
  loginInternalAdminHandler,
  logoutInternalAdminHandler,
  activateInternalAdminHandler,
  deactivateInternalAdminHandler,
  readRoles,
  writeRoles,
} from "./admin.controller.js";

const router = express.Router();

// Not protected routes
router.post("/internal/admin/login", loginInternalAdminHandler);
router.post("/internal/admin/logout", logoutInternalAdminHandler);

// Protected routes
router.post(
  "/internal/admin",
  authenticateJWT,
  authorize(...writeRoles),
  createInternalAdminHandler
);

router.get(
  "/internal/admin/me",
  authenticateJWT,
  authorize(...readRoles),
  getCurrentAdminHandler
);

router.get(
  "/internal/admin/list",
  authenticateJWT,
  authorize(...readRoles),
  listInternalAdminsHandler
);

router.get(
  "/internal/admin/:id",
  authenticateJWT,
  authorize(...readRoles),
  getInternalAdminByIdHandler
);

router.put(
  "/internal/admin/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateInternalAdminByIdHandler
);

router.delete(
  "/internal/admin/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteInternalAdminByIdHandler
);

router.put(
  "/internal/admin/:id/activate",
  authenticateJWT,
  authorize(...writeRoles),
  activateInternalAdminHandler
);

router.put(
  "/internal/admin/:id/deactivate",
  authenticateJWT,
  authorize(...writeRoles),
  deactivateInternalAdminHandler
);

export default router;
