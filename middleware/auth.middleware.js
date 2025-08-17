import { verifyToken } from "../utilities/auth.util.js";

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
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "No authentication token provided",
    });
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

    console.log(
      "Auth middleware - Authentication successful for:",
      decoded.email
    );
    next();
  } catch (err) {
    console.log("Auth middleware - Token verification failed:", err.message);
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
      message: err.message,
    });
  }
}
