import { verifyToken } from "../utilities/auth.util.js";
import {
  sendValidationError,
  sendUnauthorized,
} from "../utilities/response.util.js";

export function authenticateJWT(req, res, next) {
  // Debug logging
  console.log("Auth middleware - URL:", req.url);
  console.log("Auth middleware - Raw cookie header:", req.headers.cookie);
  console.log("Auth middleware - Parsed cookies:", req.cookies);
  console.log(
    "Auth middleware - authToken from cookies:",
    req.cookies?.authToken
  );

  // Check for token in Authorization header (Bearer token) or cookies
  const authHeader = req.headers.authorization;
  let rawToken = null;

  if (authHeader?.startsWith("Bearer ")) {
    rawToken = authHeader.substring(7);
    console.log("Auth middleware - Using Authorization header token");
  } else if (req.cookies?.authToken) {
    rawToken = req.cookies.authToken;
    console.log("Auth middleware - Using cookie token");
  } else if (req.headers.cookie) {
    // Fallback: manually parse cookie header if cookie-parser failed
    const cookieMatch = req.headers.cookie.match(/authToken=([^;]+)/);
    if (cookieMatch) {
      rawToken = cookieMatch[1];
      console.log("Auth middleware - Using manually parsed cookie token");
    }
  }

  const token = typeof rawToken === "string" ? rawToken.trim() : rawToken;

  if (!token) {
    console.log("Auth middleware - No token found in any location");
    return sendUnauthorized(
      res,
      "Authentication required: No authentication token provided. Please log in to access this resource."
    );
  }

  try {
    // Debug: lengths only (avoid printing secrets)
    try {
      const secretLen = String(process.env.JWT_SECRET || "").length;
      console.log("Auth middleware - JWT secret length:", secretLen);
      console.log(
        "Auth middleware - Token length:",
        typeof token === "string" ? token.length : 0
      );
    } catch {}
    const decoded = verifyToken(token);

    // Handle different user types
    if (decoded.type === "admin" || decoded.type === "internal_admin") {
      req.admin = decoded;
    } else {
      req.user = decoded;
    }

    // Ensure permissions claim is propagated for downstream permission checks
    const perms = Array.isArray(decoded.permissions) ? decoded.permissions : [];
    if (req.admin) req.admin.permissions = perms;
    if (req.user) req.user.permissions = perms;

    console.log(
      "Auth middleware - Authentication successful for:",
      decoded.email
    );
    next();
  } catch (err) {
    console.log("Auth middleware - Token verification failed:", err.message);

    // Provide more descriptive error messages based on the error type
    let errorMessage = "Authentication failed: ";

    if (err.message.includes("expired")) {
      errorMessage +=
        "Your session has expired. Please log in again to continue.";
    } else if (err.message.includes("invalid")) {
      errorMessage += "Invalid authentication token. Please log in again.";
    } else if (err.message.includes("malformed")) {
      errorMessage +=
        "Malformed authentication token. Please clear your browser data and log in again.";
    } else if (err.message.includes("signature")) {
      errorMessage +=
        "Authentication token signature is invalid. Please log in again.";
    } else {
      errorMessage +=
        "Authentication token could not be verified. Please log in again.";
    }

    return res.status(403).json({
      error: {
        code: "AUTHENTICATION_FAILED",
        message: errorMessage,
        details: {
          suggestion:
            "Please log out and log in again, or clear your browser data if the problem persists.",
        },
      },
      status: "error",
    });
  }
}
