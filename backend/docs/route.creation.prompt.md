# Variables

1. Build the `admin` module with a placement of `internal` so you can reproduce the pattern for any `{moduleName}` with any placement of `{modulePlacement}`. Make sure files and folder names use the dot notation version(with only small letters) of {moduleName} if {moduleName} is more than one word.

- the module should be placed under `./backend/modules/{modulePlacement}/{moduleName}/`

- permission key prefix: `{permissionKey}` e.g., `person` (for admin this is `admin`)
- booleans to include optional endpoints:
  - `{includeAuthEndpoints}` (login/logout/me): false
  - `{includeBulk}` (bulk operations): false
  - `{includeActivation}` (activate/deactivate): true
  - `{includePatch}` (PATCH updates): true
  - `{includeExport}` (export): false
  - `{includeStats}` (stats): true
  - `{includeSearch}` (search): true

2.  Created routes and their protection and authorization details
    2.1. POST (Create)

- CreatePost: true
- ProtectedPost: true
- Required permissions: `{permissionKey}.create`

  2.2. GET: By ID

- CreateGet: true
- ProtectedGet: true
- Required permissions: `{permissionKey}.read`

  2.3. PUT: By ID

- CreatePut: true
- ProtectedPut: true
- Required permissions: `{permissionKey}.update`

  2.4. DELETE: By ID

- CreateDelete: true
- ProtectedDelete: true
- Required permissions: `{permissionKey}.delete`

  2.5. GET: List all (advanced list)

- CreateGetList: true
- ProtectedGetList: true
- Required permissions: `{permissionKey}.read`
- Middleware: `advancedListQuery({ sortFields, filterFields, searchFields, expands })`

  2.6. GET: Search

- CreateSearch: {includeSearch}
- ProtectedSearch: true
- Required permissions: `{permissionKey}.read`
- Middleware: `searchQuery([ ...searchFields ])`

  2.7. GET: Export

- CreateExport: {includeExport}
- ProtectedExport: true
- Required permissions: `{permissionKey}.read`
- Middleware: `exportQuery({ sortFields, filterFields })`

  2.8. GET: Stats

- CreateStats: {includeStats}
- ProtectedStats: true
- Required permissions: `{permissionKey}.read`

  2.9. POST: Bulk operations

- CreateBulk: {includeBulk}
- ProtectedBulk: true
- Required permissions: `{permissionKey}.create`, `{permissionKey}.update`, `{permissionKey}.delete`

  2.10. PATCH: By ID (partial update)

- CreatePatch: {includePatch}
- ProtectedPatch: true
- Required permissions: `{permissionKey}.update`

  2.11. PUT: Activate

- CreateActivate: {includeActivation}
- ProtectedActivate: true
- Required permissions: `{permissionKey}.update`

  2.12. PUT: Deactivate

- CreateDeactivate: {includeActivation}
- ProtectedDeactivate: true
- Required permissions: `{permissionKey}.update`

  2.13. GET: Me (current actor)

- CreateMe: {includeAuthEndpoints}
- ProtectedMe: true
- Required permissions: `{permissionKey}.read`

  2.14. POST: Login (unauthenticated)

- CreateLogin: {includeAuthEndpoints}
- ProtectedLogin: false

  2.15. POST: Logout (unauthenticated)

- CreateLogout: {includeAuthEndpoints}
- ProtectedLogout: false

3. JSON structure `{json}` used is(resource availed and accessed via routes):

- The `id` is generated server-side using a pattern like `TENANT${Date.now()}`.

```json
{
  "name": "Tenant Name",
  "root": {
    "personal": {
      "firstName": "Admin",
      "lastName": "User"
    },
    "admin": {
      "email": "admin@example.com",
      "password": "securepassword"
    }
  },
  "active": true
}
```

4. Zod validation schema for `{json}`:

- `Subcategory`: strings (3–50), required
- `description`: strings (3-200), required

5. Firestore storage model

Notes:

- Always use `{ merge: true }` when writing to avoid overwriting sibling data when necessary.

Recommended operations in `{moduleName}.firestore.js`:

- `create{ModuleName}(model)`
- `get{ModuleName}ById(id)`
- `delete{ModuleName}ById(id)`
- `update{ModuleName}ById(id, data)`
- `getAll{ModuleName}s()`

This project does not support an in-memory store. Always use Firestore.

---

6. Firestore path conventions:

- path: `touchAfrica/{southAfrica}/{collectionPlural}/{entityId}` (e.g., admins/persons)

7. Special Notes:

-

9. Applies to this codebase:

- Express (ES Modules)
- JWT authentication + role-based authorization
- Zod validation for `{json}`
- Firestore
- File and folder names:
  - use the dot notation to separate words and only small letters for file and folder names
  - if {moduleName} has multiple words, enforce the notation with module file and folder names like `tenant.user` instead of `tenantUser`
  - When files and folders are moved or renamed, always after moving or renaming the files and/or folders, delete the old files and folders to avoid confusion.
- key names in `{json}` and in code should be in camelCase

# ===============================================================================

# Fixed

## 1) Folder and files

Create the module under:

- `./modules/{modulePlacement}/{moduleName}/`

Files to add:

- `{moduleName}.route.js` — Express router and route definitions
- `{moduleName}.controller.js` — HTTP handlers (validation + service calls)
- `{moduleName}.service.js` — Business logic, prepares data for persistence
- `{moduleName}.firestore.js` — Firestore persistence (CRUD) using field-based storage
- `{moduleName}.validation.js` — Zod schemas and ID helpers

File and folder names:

- use the dot notation to separate words and only small letters for file and folder names

Example (admin):

- `modules/internal/admin/admin.route.js`
- `modules/internal/admin/admin.controller.js`
- `modules/internal/admin/admin.service.js`
- `modules/internal/admin/admin.firestore.js`
- `modules/internal/admin/admin.validation.js`

---

## 2) Route design (copy/paste and replace)

- Base path: `{routeBase}` (e.g., `/internal/admins`)

- Include these routes (aligns with admin module superset):

- POST `{routeBase}` — create: Create?: {CreatePost}, Protected?: {ProtectedPost}, Perm: `{permissionKey}.create`
- GET `{routeBase}/:id` — get by ID: Create?: {CreateGet}, Protected?: {ProtectedGet}, Perm: `{permissionKey}.read`
- PUT `{routeBase}/:id` — update by ID: Create?: {CreatePut}, Protected?: {ProtectedPut}, Perm: `{permissionKey}.update`
- PATCH `{routeBase}/:id` — partial update: Create?: {CreatePatch}, Protected?: {ProtectedPatch}, Perm: `{permissionKey}.update`
- DELETE `{routeBase}/:id` — delete by ID: Create?: {CreateDelete}, Protected?: {ProtectedDelete}, Perm: `{permissionKey}.delete`
- GET `{routeBase}` — list (advanced): Create?: {CreateGetList}, Protected?: {ProtectedGetList}, Perm: `{permissionKey}.read` + `advancedListQuery({...})`
- GET `{routeBase}/search` — search: Create?: {CreateSearch}, Protected?: true, Perm: `{permissionKey}.read` + `searchQuery([...])`
- GET `{routeBase}/export` — export: Create?: {CreateExport}, Protected?: true, Perm: `{permissionKey}.read` + `exportQuery({...})`
- GET `{routeBase}/stats` — stats: Create?: {CreateStats}, Protected?: true, Perm: `{permissionKey}.read`
- POST `{routeBase}/bulk` — bulk ops: Create?: {CreateBulk}, Protected?: true, Perm: `{permissionKey}.create|update|delete`
- PUT `{routeBase}/:id/activate` — activate: Create?: {CreateActivate}, Protected?: true, Perm: `{permissionKey}.update`
- PUT `{routeBase}/:id/deactivate` — deactivate: Create?: {CreateDeactivate}, Protected?: true, Perm: `{permissionKey}.update`
- GET `{routeBase}/me` — current: Create?: {CreateMe}, Protected?: true, Perm: `{permissionKey}.read`
- POST `{routeBase}/login` — login: Create?: {CreateLogin}, Protected?: false
- POST `{routeBase}/logout` — logout: Create?: {CreateLogout}, Protected?: false

Implementation notes:

- Use `authenticateJWT` and `checkPermissions("{permissionKey}.action")` middlewares.
- For bulk ops, supply multiple permissions: `checkPermissions("{permissionKey}.create", "{permissionKey}.update", "{permissionKey}.delete")`.
- Keep authorization rules at router-level so controllers remain focused on logic.
- For listing/search/export, configure `sortFields`, `filterFields`, and `searchFields` arrays that suit your entity.

---

## 3) Validation (Zod)

Create `{moduleName}.validation.js` of `{JSON}` defining:

- Creation schema `{ModuleName}Schema`
- Update schema `{ModuleName}UpdateSchema` (often `partial()` of create)
- ID helper `new{ModuleName}Id()` (e.g., `ADMIN${Date.now()}`)

Controller usage:

- Validate `req.body` on POST/PUT
- Throw a 400 with details if validation fails
- Hash secret fields before persistence when needed

---

## 4) Controller

Responsibilities:

- Validate request body using Zod
- Map authenticated user to `actor` (e.g., `req.admin?.id || req.user?.id || req.user?.email`)
- Hash secrets before persisting (e.g., PBKDF2/bcrypt for passwords)
- Delegate to service and shape responses

Response pattern:

- Success: `{ success: true, data: ... }` (201 for creates)
- Errors: use `next(err)`; global error handler returns consistent JSON

---

## 5) Service

Responsibilities:

- Set defaults (created metadata(format "created": `{ "by": "root", "when": "2025-07-20T09:00:00Z" }`), activation default, etc.)
- Aggregate changes (e.g., append activation history)
- Call Firestore persistence ops
- Keep data-shaping here so controllers stay thin and persistence stays generic.

---

## 6) Router wiring in app.js

Import under the section comment:

```js
// 2.3. Modular route handlers
import { default as {moduleName}Router } from "./modules/{modulePlacement}/{moduleName}/{moduleName}.route.js";
```

Mount under the section comment:

```js
// 6. API ROUTES
app.use({moduleName}Router);
```

Keep route definitions themselves absolute (e.g., `{modulePlacement}/{moduleName}`) inside the router.

---

## 7) Security conventions

- All protected routes must use `authenticateJWT`.
- Use `checkPermissions("{permissionKey}.read|create|update|delete")` where needed.
- Don’t return sensitive fields (e.g., raw passwords); hash before persisting.
- Use input validation (Zod) of `{JSON}` at the edge (controllers).

---

## 8) Testing locally

Generate a internalSuperAdmin token and test against a dev server:

1. Start server:

```cmd
set JWT_SECRET=devsecret
set NODE_ENV=development
set PORT=5051
npm start
```

2. Generate token:

```cmd
node utilities\make-token.mjs devsecret internalSuperAdmin ADMIN_TEST > token.txt
```

3. Call endpoints using the token in the Authorization header (examples with `{routeBase}`):

- GET http://localhost:5051{routeBase}
- GET http://localhost:5051{routeBase}/search?q=a
- GET http://localhost:5051{routeBase}/export?format=json
- GET http://localhost:5051{routeBase}/stats
- POST http://localhost:5051{routeBase}/bulk
- GET http://localhost:5051{routeBase}/:id
- POST http://localhost:5051{routeBase}
- PUT http://localhost:5051{routeBase}/:id
- PATCH http://localhost:5051{routeBase}/:id
- DELETE http://localhost:5051{routeBase}/:id
- PUT http://localhost:5051{routeBase}/:id/activate
- PUT http://localhost:5051{routeBase}/:id/deactivate
- GET http://localhost:5051{routeBase}/me
- POST http://localhost:5051{routeBase}/login
- POST http://localhost:5051{routeBase}/logout

Adapt `tests/{modulePlacement}/{moduleName}.routes.test.mjs` for your new module.

---

## 9) Create an E2E route testing script covering all endpoints

- Place the script in `tests/{modulePlacement}/{moduleName}.routes.test.mjs`
- Place the payload in `tests/payloads/{modulePlacement}/{moduleName}.payload.json`

## 10) Create a post request script and post a valid payload to the endpoint.

- Place the script in `tests/posts/{modulePlacement}/{moduleName}.post.mjs`

## 11) Review checklist (before commit)

- [ ] Files created in `modules/{modulePlacement}/{moduleName}/`
- [ ] Router imported and mounted in `app.js`
- [ ] All routes JWT-protected; role checks added
- [ ] Zod schemas validate POST and PUT
- [ ] IDs generated server-side
- [ ] Sensitive fields hashed/omitted in responses
- [ ] Firestore path consistent and documented
- [ ] README/docs updated if public API changed
- [ ] Router tests added (if applicable)

---
