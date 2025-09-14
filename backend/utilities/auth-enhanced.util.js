import jwt from "jsonwebtoken";
import crypto from "crypto";

// Enhanced JWT utilities with refresh token support and security improvements
const getJWTSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET environment variable is required but not defined. Please check your .env file."
    );
  }
  if (JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long for security"
    );
  }
  return JWT_SECRET;
};

const getRefreshSecret = () => {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh";
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Generate access token with enhanced payload
 */
export function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  const JWT_SECRET = getJWTSecret();

  const enhancedPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(), // JWT ID for tracking
    sessionId: crypto.randomBytes(16).toString("hex"),
  };

  return jwt.sign(enhancedPayload, JWT_SECRET, { expiresIn });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload) {
  const REFRESH_SECRET = getRefreshSecret();

  const refreshPayload = {
    userId: payload.userId,
    role: payload.role,
    tenantId: payload.tenantId,
    type: "refresh",
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  };

  return jwt.sign(refreshPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

/**
 * Verify access token
 */
export function verifyToken(token) {
  const JWT_SECRET = getJWTSecret();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Additional validation
    if (!decoded.userId || !decoded.role) {
      throw new Error("Invalid token payload");
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  const REFRESH_SECRET = getRefreshSecret();
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);

    if (decoded.type !== "refresh") {
      throw new Error("Invalid refresh token type");
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token");
    }
    throw error;
  }
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(payload) {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
    tokenType: "Bearer",
  };
}

/**
 * Extract token from request (header or cookie)
 */
export function extractTokenFromRequest(req) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Check cookies
  if (req.cookies?.authToken) {
    return req.cookies.authToken.trim();
  }

  // Fallback: manually parse cookie header
  if (req.headers.cookie) {
    const cookieMatch = req.headers.cookie.match(/authToken=([^;]+)/);
    if (cookieMatch) {
      return cookieMatch[1].trim();
    }
  }

  return null;
}

/**
 * Hash password with salt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password
 */
export function verifyPassword(password, hashedPassword) {
  const [salt, hash] = hashedPassword.split(":");
  const hashToVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === hashToVerify;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Validate token strength and format
 */
export function validateTokenFormat(token) {
  if (!token || typeof token !== "string") {
    return false;
  }

  // Basic JWT format check (3 parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Check if each part is valid base64
  try {
    parts.forEach((part) => {
      const padding = 4 - (part.length % 4);
      const paddedPart = part + "=".repeat(padding % 4);
      atob(paddedPart);
    });
    return true;
  } catch {
    return false;
  }
}
