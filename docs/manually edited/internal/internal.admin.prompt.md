Build the `internalAdmin` module with a placement of `internal` so you can reproduce the pattern for any `{moduleName}` with any placement of `{modulePlacement}`. Make sure filed and folder names use the dot notation version(with only small letters) of {moduleName} if {moduleName} is more than one word.

2.1. JSON structure `{json}` used is(This is just a sample, do not incorporate its valued anywhere but only consider its keys and their types):

```json
{
  "roles": ["internalSuperAdmin"],

  "title": "Mr",
  "names": "Simon Lesedi",
  "surname": "Babedi",

  "accessDetails": {
    "email": "sl.babedi@neighbourguard.co.za",
    "password": "SecureAdminPass123",
    "lastLogin": []
  },

  "account": {
    "isActive": {
      "value": true,
      "changes": []
    }
  }
}
```

2.2. The `id` is generated server-side using a pattern like `IADMIN${Date.now()}`.

3. Zod validation schema for `{json}`:

- `title`: option from one of the options at firestore path `/services/{neighbourGuardService}/lookups/{titlePrefixes}`
- `names`, `surname`: strings (3–50)
- `accessDetails.email`: must end with `@neighbourguard.co.za`
- `accessDetails.password`: password must conform to format found at firestore path `/services/{neighbourGuardService}/formats/{passwords}` field `regex`
- `roles`: array of strings, 1–50 items
- `account.isActive.value`: boolean default true

4. Firestore path conventions:

- path: `/services/{neighbourGuardService}/admins/{adminId}`

5. Special Notes:

- always consider more than 2000 line of code for context where application within each file and other
- override old with new changes and do not make it backward compatible. Delete old...
- note that the first admin added must be assigned the role of a internalRootAdmin and this admin must never be deleted or modified by anyone except itself

6. Routes Authorization pattern (recommended):

- Read: `internalRootAdmin`,`internalSuperAdmin`
- Write: `internalRootAdmin`,`internalSuperAdmin`

7. Applies to this codebase:

- Express (ES Modules)
- JWT authentication + role-based authorization
- Zod validation for `{json}`
- Firestore (single-document, field-based storage)

---

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

Base path for `{modulePlacement}` modules: `modules/{modulePlacement}/{moduleName}`.

Include these routes (all protected by JWT):

Not protected routes

- POST `{modulePlacement}/{moduleName}/login` — login
- POST `{modulePlacement}/{moduleName}/logout` — logout

Protected routes

- POST `{modulePlacement}/{moduleName}` — create
- GET `{modulePlacement}/{moduleName}/me` — get current {moduleName} details (if applicable)
- GET `{modulePlacement}/{moduleName}/:id` — get by ID
- DELETE `{modulePlacement}/{moduleName}/:id` — delete by ID
- PUT `{modulePlacement}/{moduleName}/:id` — update by ID

- GET `{modulePlacement}/{moduleName}/list` — list all

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

## 6) Firestore storage model

Notes:

- Always use `{ merge: true }` when writing to avoid overwriting sibling data when necessary.

Recommended operations in `{moduleName}.firestore.js`:

- `create{ModuleName}(model)`
- `get{ModuleName}ById(id)`
- `delete{ModuleName}ById(id)`
- `update{ModuleName}ById(id, data)`
- `activate{ModuleName}ById(id, change)`
- `deactivate{ModuleName}ById(id, change)`
- `getAll{ModuleName}s()`

This project does not support an in-memory store. Always use Firestore.

---

## 7) Router wiring in app.js

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

## 8) Security conventions

- All routes must use `authenticateJWT`(if applicable).
- Use `authorize(...)` where needed (write vs read).
- Don’t return sensitive fields (e.g., raw passwords); hash before persisting.
- Use input validation (Zod) of `{JSON}` at the edge (controllers).

---

## 9) Testing locally

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

## 10) Create a E2E route testing script testing all route with valid a payload.

## 11) Create a post request script and post a valid payload to the endpoint.

- Place the script in `utilities/posts/{modulePlacement}/{moduleName}.post.mjs`

## 12) Review checklist (before commit)

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
