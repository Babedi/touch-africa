#!/usr/bin/env node
/**
 * Discover Express router endpoints by statically scanning *.route.js files.
 * Outputs a JSON list of { method, path, file }.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROUTES_ROOT = path.resolve(__dirname, "..", "modules");

const ROUTE_FILE_RE = /\.route\.(js|mjs|cjs)$/i;
const METHOD_RE =
  /router\.(get|post|put|patch|delete|options|head)\(\s*([`'"])(.*?)\2/gi;

function collectRouteFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) collectRouteFiles(full, out);
    else if (ROUTE_FILE_RE.test(name)) out.push(full);
  }
  return out;
}

function extractRoutesFromFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const routes = [];
  let m;
  while ((m = METHOD_RE.exec(src))) {
    const method = m[1].toUpperCase();
    const url = m[3];
    routes.push({ method, path: url, file: path.relative(ROUTES_ROOT, file) });
  }
  return routes;
}

const files = collectRouteFiles(ROUTES_ROOT);
const all = [];
for (const f of files) all.push(...extractRoutesFromFile(f));

// Dedupe
const seen = new Set();
const unique = [];
for (const r of all) {
  const key = `${r.method} ${r.path}`;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(r);
  }
}

console.log(JSON.stringify({ count: unique.length, routes: unique }, null, 2));
