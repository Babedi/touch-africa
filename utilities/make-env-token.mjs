import jwt from "jsonwebtoken";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Generate a test token
const payload = {
  id: "ADMIN_LOCAL_TEST",
  type: "admin",
  roles: ["externalSuperAdmin", "internalSuperAdmin"],
};

console.log(
  `🔧 Using JWT_SECRET: ${
    process.env.JWT_SECRET ? "Loaded from .env" : "Using fallback"
  }`
);
const secret = process.env.JWT_SECRET || "test-secret-key-for-development";
const token = jwt.sign(payload, secret, { expiresIn: "24h" });

fs.writeFileSync("token.txt", token);
console.log(`✅ Token created in token.txt (length: ${token.length})`);
