import { run } from "./tenant.alarm.routes.test.mjs";

run()
  .then((r) => {
    console.log("tenant.alarm e2e ok", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error("tenant.alarm e2e failed", e?.message || e);
    process.exit(1);
  });
