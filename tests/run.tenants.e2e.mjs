import { readFile } from "node:fs/promises";
import {
  testCreateTenant,
  testGetTenantById,
  testListTenants,
  testUpdateTenant,
  testActivateTenant,
  testDeactivateTenant,
  waitForHealth,
} from "./tenant.routes.test.mjs";

async function main() {
  try {
    // Set env
    const token = (await readFile(new URL("../token.txt", import.meta.url)))
      .toString()
      .trim();
    if (!token) throw new Error("Missing token");
    process.env.TOKEN = token;
    // Force tests to hit port 5000 unless explicitly overridden by caller
    if (!process.env.PORT) process.env.PORT = "5000";
    if (process.env.PORT !== "5000") process.env.PORT = "5000";
    // Wait for server health
    const healthy = await waitForHealth();
    if (!healthy) throw new Error("Server not healthy on 5000");

    // Create
    const createRes = await testCreateTenant();
    if (createRes.status !== 201)
      throw new Error(`Create failed: ${createRes.status}`);
    const tenantId = createRes.data?.data?.id;
    if (!tenantId) throw new Error("No tenant id returned");
    console.log("Created:", tenantId);

    // Get
    const getRes = await testGetTenantById(tenantId);
    if (getRes.status >= 300) throw new Error(`Get failed: ${getRes.status}`);
    console.log("Get OK");

    // List
    const listRes = await testListTenants();
    if (listRes.status >= 300)
      throw new Error(`List failed: ${listRes.status}`);
    console.log("List OK");

    // Update
    const updRes = await testUpdateTenant(tenantId);
    if (updRes.status >= 300)
      throw new Error(`Update failed: ${updRes.status}`);
    console.log("Update OK");

    // Activate
    const actRes = await testActivateTenant(tenantId);
    if (actRes.status >= 300)
      throw new Error(`Activate failed: ${actRes.status}`);
    console.log("Activate OK");

    // Deactivate
    const deactRes = await testDeactivateTenant(tenantId);
    if (deactRes.status >= 300)
      throw new Error(`Deactivate failed: ${deactRes.status}`);
    console.log("Deactivate OK");

    console.log("E2E OK");
  } catch (e) {
    console.error("E2E FAILED:", e?.message || e);
    process.exit(1);
  }
}

main();
