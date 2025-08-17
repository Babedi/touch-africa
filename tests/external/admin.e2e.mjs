// E2E script that runs all external admin routes in sequence
import {
  waitForHealth,
  testCreateAdmin,
  testGetAdminById,
  testListAdmins,
  testUpdateAdmin,
  testActivateAdmin,
  testDeactivateAdmin,
} from "./admin.routes.test.mjs";

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

async function run() {
  const ok = await waitForHealth();
  if (!ok) {
    console.error("Health check failed");
    process.exit(1);
  }

  const created = await testCreateAdmin();
  log("CREATE", created);
  if (created.status !== 201) process.exit(1);
  const id = created.data?.data?.id;
  if (!id) process.exit(1);

  const byId = await testGetAdminById(id);
  log("GET BY ID", byId);
  if (byId.status >= 300) process.exit(1);

  const list = await testListAdmins();
  log("LIST", list);
  if (list.status >= 300) process.exit(1);

  const upd = await testUpdateAdmin(id);
  log("UPDATE", upd);
  if (upd.status >= 300) process.exit(1);

  const act = await testActivateAdmin(id);
  log("ACTIVATE", act);
  if (act.status >= 300) process.exit(1);

  const deact = await testDeactivateAdmin(id);
  log("DEACTIVATE", deact);
  if (deact.status >= 300) process.exit(1);
}

run();
