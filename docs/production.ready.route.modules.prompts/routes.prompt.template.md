# Variables

1. Build the `lookup` module with a placement of `internal` so you can reproduce the pattern for any `{moduleName}` with any placement of `{modulePlacement}`. Make sure filed and folder names use the dot notation version(with only small letters) of {moduleName} if {moduleName} is more than one word.

- the module should be placed under `./modules/{modulePlacement}/{moduleName}/`

2.  Created routes and their protection and authorization details
    2.1. POST

- CreatePost: true
- ProtectedPost: true
- Allowed roles: `internalSuperAdmin`,`internalRootAdmin`, `{moduleName}Manager`

  2.2. GET: By ID

- CreateGet: true
- ProtectedGet: true
- Allowed roles: `internalSuperAdmin`,`internalRootAdmin`, `{moduleName}Manager`

  2.3. PUT: By ID

- CreatePut: true
- ProtectedPut: true
- Allowed roles: `internalSuperAdmin`,`internalRootAdmin`, `{moduleName}Manager`

  2.4. DELETE: By ID

- CreateDelete: true
- ProtectedDelete: true
- Allowed roles: `internalSuperAdmin`,`internalRootAdmin`, `{moduleName}Manager`

  2.5. GET: List all

- CreateGetList: true
- ProtectedGetList: true
- Allowed roles: `internalSuperAdmin`,`internalRootAdmin`, `{moduleName}Manager`

3. JSON structure `{json}` used is(resource availed and accessed via routes):

- The `id` is generated server-side using a pattern like `LOOKUP${Date.now()}`.

```json
{
  "category": "Geography",
  "subCategory": "Countries",
  "items": [
    "South Africa",
    "United States",
    "United Kingdom",
    "India",
    "China",
    "Australia",
    "Canada",
    "Germany",
    "France",
    "Japan",
    "Brazil",
    "Russia",
    "Mexico",
    "Italy",
    "Spain",
    "Netherlands",
    "Sweden",
    "Norway",
    "Denmark",
    "Finland"
  ],
  "description": "Major countries for international operations and user registration"
}
```

4. Zod validation schema for `{json}`:

- `category`: strings (3–50), required
  `subCategory`: strings (3–50), required
- `items`: strings[] (1–25), required
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

- path: `/services/{neighbourGuardService}/lookups`

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

- Base path for `{modulePlacement}` modules: `modules/{modulePlacement}/{moduleName}`

- Include these routes:

- POST `{modulePlacement}/{moduleName}` — create: Create?: {CreatePost}, protected by JWT?: {ProtectedPost}
- GET `{modulePlacement}/{moduleName}/:id` — get by ID: Create?: {CreateGet}, protected by JWT?: {ProtectedGet}
- PUT `{modulePlacement}/{moduleName}/:id` — update by ID: Create?: {CreatePut}, protected by JWT?: {ProtectedPut}
- Delete `{modulePlacement}/{moduleName}/:id` — delete by ID: Create?: {CreateDelete}, protected by JWT?: {ProtectedDelete}
- GET `{modulePlacement}/{moduleName}/list` — list all: Create?: {CreateGetList}, protected by JWT?: {ProtectedGetList}

Implementation notes:

- Use `authenticateJWT` and `authorize("role", ...)` middlewares.
- Keep authorization rules at router-level so controllers remain focused on logic.

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

- All routes must use `authenticateJWT`(if applicable).
- Use `authorize(...)` where needed (write vs read).
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

3. Call endpoints using the token in the Authorization header:

- GET http://localhost:5051/{modulePlacement}/{moduleName}/list
- POST http://localhost:5051/{modulePlacement}/{moduleName}
- etc.

Adapt `tests/{modulePlacement}/{moduleName}.routes.test.mjs` for your new module.

---

## 9) Create a E2E route testing script testing all route with valid a payload.

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
