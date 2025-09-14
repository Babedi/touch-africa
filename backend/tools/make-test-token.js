#!/usr/bin/env node
/**
 * Generate a test JWT matching our auth middleware expectations.
 * Usage:
 *   node backend/tools/make-test-token.js --type=admin --perms=admin.read,admin.update --userId=dev1 --email=dev@example.com
 */
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

function parseArgs() {
  const args = new Map();
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.split("=");
    args.set(k.replace(/^--/, ""), v ?? true);
  }
  return args;
}

const args = parseArgs();
const type = args.get("type") || "admin";
const perms = (args.get("perms") || "admin.read").split(",");
const userId = args.get("userId") || "tester";
const email = args.get("email") || "tester@example.com";
const tenantId = args.get("tenantId") || "internal";
const expiresIn = args.get("expiresIn") || process.env.JWT_EXPIRES_IN || "1h";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be set in .env and be at least 32 chars.");
  process.exit(1);
}

const payload = { userId, email, permissions: perms, tenantId, type };
const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
console.log(token);

try {
  const outPath = path.resolve(process.cwd(), "backend", "tools", "token.txt");
  fs.writeFileSync(outPath, token, "utf8");
} catch {}
