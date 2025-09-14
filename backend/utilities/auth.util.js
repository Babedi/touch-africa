import jwt from "jsonwebtoken";

// Don't check JWT_SECRET at module load time - check when functions are called
const getJWTSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET environment variable is required but not defined. Please check your .env file."
    );
  }
  return JWT_SECRET;
};

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export function generateToken(payload) {
  const JWT_SECRET = getJWTSecret();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  const JWT_SECRET = getJWTSecret();
  return jwt.verify(token, JWT_SECRET);
}
