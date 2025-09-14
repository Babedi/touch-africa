// Minimal server to mount only the permission routes and smoke test endpoints
console.log("[permission-smoke-test] starting");
process.on("unhandledRejection", (e) => {
  console.error("[permission-smoke-test] unhandledRejection", e);
});
process.on("uncaughtException", (e) => {
  console.error("[permission-smoke-test] uncaughtException", e);
});
import express from "express";
import permissionRouter from "../modules/internal/permission/permission.route.js";

const app = express();
app.use(express.json());
app.use(permissionRouter);

const PORT = 3050;
const server = app.listen(PORT, () => {
  console.log(`[permission-smoke-test] listening on http://localhost:${PORT}`);
  runSmoke().finally(() => {
    server.close(() => {
      console.log("Smoke server closed");
      process.exit(0);
    });
  });
});

async function hit(method, path) {
  const url = `http://localhost:${PORT}${path}`;
  const res = await fetch(url, { method });
  return { path, method, status: res.status };
}

async function runSmoke() {
  const endpoints = [
    { method: "GET", path: "/internal/permissions" },
    { method: "GET", path: "/internal/permissions/search" },
    { method: "POST", path: "/internal/permissions/bulk" },
    { method: "GET", path: "/internal/permissions/export" },
    { method: "GET", path: "/internal/permissions/stats" },
  ];
  const results = [];
  for (const e of endpoints) {
    try {
      const r = await hit(e.method, e.path);
      results.push(r);
    } catch (err) {
      results.push({ ...e, status: "ERR", error: err.message });
    }
  }
  console.log("Smoke results (expect 401 Unauthorized without token):");
  for (const r of results) console.log(`${r.method} ${r.path} -> ${r.status}`);
}
