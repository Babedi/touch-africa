#!/usr/bin/env node
/**
 * Hit all discovered routes against a running server.
 * Usage:
 *   node backend/tools/smoke-all-routes.js --base=http://localhost:5000 [--token=BEARER]
 */
import { execSync } from "child_process";

function parseArgs() {
  const args = new Map();
  for (const a of process.argv.slice(2)) {
    const [k, v] = a.split("=");
    args.set(k.replace(/^--/, ""), v ?? true);
  }
  return args;
}

function discover() {
  const json = execSync("node backend/tools/discover-routes.js", {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
  });
  return JSON.parse(json);
}

async function main() {
  const args = parseArgs();
  const base = args.get("base") || "http://localhost:5000";
  const token = args.get("token");

  const { routes } = discover();

  // Only test idempotent endpoints by default; POST/PUT/PATCH/DELETE opt-in
  const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);
  const toTest = routes.filter((r) => SAFE.has(r.method));

  const results = [];
  for (const r of toTest) {
    const url = base.replace(/\/$/, "") + r.path;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(url, { method: r.method, headers });
      results.push({ method: r.method, path: r.path, status: res.status });
    } catch (err) {
      results.push({
        method: r.method,
        path: r.path,
        status: "ERR",
        error: err.message,
      });
    }
  }

  // Summaries
  const counts = results.reduce((acc, r) => {
    const k = String(r.status);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  console.log("Base:", base);
  console.log("Token provided:", Boolean(token));
  console.log("Tested routes:", toTest.length);
  console.log("Status counts:", counts);
  console.log("\nSample failures (first 10):");
  for (const r of results.filter((x) => x.status !== 200).slice(0, 10)) {
    console.log(
      `${r.method} ${r.path} -> ${r.status}${r.error ? " | " + r.error : ""}`
    );
  }
}

main().catch((e) => {
  console.error("Smoke test failed:", e);
  process.exit(1);
});
