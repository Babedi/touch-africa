import "dotenv/config";
import { TouchAfricaApiClient } from "./api-client.js";

function requireEnv(name) {
  const v = (process.env[name] || "").trim();
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
}

async function main() {
  const port = (process.env.PORT || "5000").trim();
  const rawApi = process.env.API_BASE_URL;
  const baseUrl = (
    (rawApi && rawApi.trim()) ||
    `http://localhost:${port}`
  ).replace(/\/$/, "");
  const email = requireEnv("ROOT_ADMIN_EMAIL");
  const password = requireEnv("ROOT_ADMIN_PASSWORD");

  const client = new TouchAfricaApiClient({ baseUrl });
  const login = await client.admins.login({ email, password });
  const payload = login && login.data ? login.data : login;
  const token = payload?.token;
  if (!token) throw new Error("Login failed: no token");
  client.setToken(token);

  const meRes = await client.admins.me();
  const me = meRes && meRes.data ? meRes.data : meRes;
  console.log(
    JSON.stringify(
      { baseUrl, email, roles: me?.roles, permissions: me?.permissions },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error("whoami failed:", e?.status || "", e?.data || e?.message || e);
  process.exit(1);
});
