# Module Scaffold Prompt: Create a module in external/tenant.admin

Variables (edit these first):

- MODULE_KIND: external
- MODULE_SLUG: tenant.admin
- ENTITY_NAME: TenantAdmin
- ENTITY_ID_FIELD: id
- ROUTE_BASE: /external/tenant-admins
- COLLECTION_PATH: /touchAfrica/{southAfrica}/tenants/{TNNT1755017739510}/admins/{EADMIN1755017739510}
- PERMISSION_PREFIX: EXTERNAL_TENANT_ADMIN
- ROLE_NAME: tenantAdmin
- JWT_TYPE: tenant_admin
- TEST_TENANT_ID: TestTenant
- AUTH_BYPASS_PERMISSION: all.access
- TARGET_MODULE_PATH: backend/modules/external/tenant.admin
- APP_ENTRY_FILE: app.js
- API_CLIENT_FILE: integration/api-client.js
- TEST_DIR: integration/tests
- INCLUDE_DOCS: true
- DOCS_FILES: README.md, API.md

Instructions:

1. Create the module folder structure at TARGET_MODULE_PATH

   - Required files:
     - controller: admin.controller.js → use ENTITY_NAME semantics (e.g., `${ENTITY_NAME}Controller`)
     - service: admin.service.js → implement CRUD/search/export/stats for ENTITY_NAME
     - route: admin.route.js → mount on ROUTE_BASE and wire handlers + middleware
     - firestore: admin.firestore.js → CRUD helpers for COLLECTION_PATH using ENTITY_ID_FIELD
     - validation: admin.validation.js → schemas/validators for create/update/search
   - Ensure internal imports are relative within TARGET_MODULE_PATH

2. Define routing and names

   - In the route file:
     - Set base path to ROUTE_BASE (e.g., /external/tenant-admins)
     - Export an Express Router instance with endpoints:
       - GET `${ROUTE_BASE}` list
       - GET `${ROUTE_BASE}/search` search
       - GET `${ROUTE_BASE}/export` export (format param)
       - GET `${ROUTE_BASE}/stats` stats
       - GET `${ROUTE_BASE}/:id` getById
       - POST `${ROUTE_BASE}` create
       - PUT/PATCH `${ROUTE_BASE}/:id` update
       - DELETE `${ROUTE_BASE}/:id` remove
       - Optional: GET `${ROUTE_BASE}/me`, POST `${ROUTE_BASE}/logout`
     - Apply auth, permission, and query middlewares consistently

3. Configure Firestore data access

   - In the firestore file:
     - Export helpers to list/search/get/create/update/delete using COLLECTION_PATH
     - Use ENTITY_ID_FIELD as identifier; generate IDs when not provided
     - Guard unsafe orderBy with try/catch; allow in-memory sort as fallback

4. Implement service and controller

   - Service:
     - Implement list/search/export/stats/getById/create/update/remove using firestore helpers
     - Respect pagination/sorting/search from query.util
   - Controller:
     - Parse req.parsedQuery; call service; return standardized responses via response.util

5. Permissions and roles

   - Use PERMISSION_PREFIX for authorize checks (e.g., `${PERMISSION_PREFIX}.read`, `.write`, `.export`)
   - Ensure JWT_TYPE is honored in auth flows (if type filtering is used)
   - If role mappings are configured, add ROLE_NAME where appropriate

6. Mount the router in APP_ENTRY_FILE

   - Import the router from TARGET_MODULE_PATH/admin.route.js
   - Call `app.use(router)` near other module routers

7. API client integration (API_CLIENT_FILE)

   - Add a namespace (e.g., `external.tenantAdmins`) with methods:
     - list(params), search(q, params), export(format, params), stats(params)
     - getById(id), create(data), update(id, data), remove(id)
     - Optional: me(), logout()
   - Base URLs on ROUTE_BASE

8. Tests (TEST_DIR)

   - Add smoke tests for the namespace; include `x-tenant-id: TEST_TENANT_ID`
   - Generate a JWT with JWT_TYPE and AUTH_BYPASS_PERMISSION (or ROLE_NAME permissions)
   - Seed a matching Firestore doc for `me` if implemented
   - Mark currently unimplemented endpoints as expected (400/404/501)

9. Module docs (INCLUDE_DOCS=true)

   - Create `TARGET_MODULE_PATH/docs` with DOCS_FILES
     - README.md: overview, model, permissions, sample payloads
     - API.md: endpoints, params, examples, error codes

10. Quality and run

- Start the server and hit ROUTE_BASE endpoints to verify 200/expected statuses
- Ensure standardized responses/headers (e.g., X-Total-Count) are present when applicable

Deliverables:

- TARGET_MODULE_PATH with controller, service, route, firestore, validation implemented
- Router mounted in APP_ENTRY_FILE
- API client namespace added to API_CLIENT_FILE
- Tests added under TEST_DIR
- TARGET_MODULE_PATH/docs with README.md and API.md (if INCLUDE_DOCS)

Notes:

- Keep absolute collection paths consistent with the rest of the project (touchAfrica/southAfrica/\*)
- Prefer absolute static fragment paths on the frontend if you add UI
- Respect x-tenant-id header in external contexts
