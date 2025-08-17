# NeighbourGuard Panic Button API - AI Coding Guide

## Architecture Overview

This is a **modular Express.js API** with **Firebase Firestore backend** serving a **multi-tenant emergency response system**. The system has three main user types: Internal Admins, Tenant Admins, and Tenant Users, each with dedicated dashboards.

### Service Boundaries

- **Internal**: Root/Super admin management (`/modules/internal/`)
- **External**: Tenant-scoped operations (`/modules/external/`)
- **General**: Public/shared endpoints (`/modules/general/`)

### Data Flow

- All data flows through **Firestore** with path: `services/neighbourGuardService/{collection}/{docId}`
- Authentication uses **JWT tokens** (Bearer or cookie-based)
- Authorization via **role-based middleware** with granular permissions

## Critical Development Patterns

### Module Structure (MANDATORY)

Each feature follows this exact pattern:

```
modules/{boundary}/{feature}/
├── {feature}.route.js      # Express router + middleware
├── {feature}.controller.js # Request handling + validation
├── {feature}.service.js    # Business logic + Firestore ops
└── README.md              # Route documentation
```

### Authentication Flow

1. **Token Generation**: Use `utilities/make-env-token.mjs` for development tokens
2. **Middleware Chain**: `authenticateJWT → authorize(roles) → handler`
3. **Frontend Auth**: Login modals set both `localStorage.authToken` AND `document.cookie`

### Frontend Structure (STRICT)

```
frontend/
├── public/           # Unauthenticated (landing, login modals etc.)
├── private/          # Protected dashboards
└── shared/           # Common CSS/JS (api-client.js, notifications.js)
```

**Never mix HTML/CSS/JS** - each component gets its own folder with separate files.

## Essential Commands

### Development Workflow

```bash
npm run dev                    # Start with auto-reload
npm run make:token            # Generate JWT for testing
npm run test:tenants          # E2E tenant flow
node test-{feature}.mjs       # Run feature-specific tests
```

## Project-Specific Conventions

### Error Handling

- **API responses**: Always `{success: boolean, data: any, error?: string}`
- **Frontend errors**: Use `showErrorSnackbar()` from `/shared/notifications.js`
- **Auth failures**: Redirect to home with snackbar message

### Role Hierarchy

```javascript
// In controller files - define these arrays:
export const readRoles = ["internalRootAdmin", "internalSuperAdmin", ...];
export const writeRoles = ["internalRootAdmin", "internalSuperAdmin", ...];
```

### Firestore Patterns

- **Collections**: Use semantic names (`tenants`, `admins`, `alarms`)
- **Documents**: Generate IDs with timestamp (`TNNT${Date.now()}`)
- **Metadata**: Always include `created: {by: userId, when: Date}`

### Frontend UI Standards

- **Dashboards**: Sidebar left, header top with user notifications, avatar, logout
- **Modals**: Use existing modal system in `/public/modals/`
- **Notifications**: Snackbar system for all user feedback

## Integration Points

### Firebase Setup

- Service account key: `secrets/serviceAccountKey.json`
- Client initialized in `services/firestore.client.js`
- All collections under `services/neighbourGuardService/`

### Authentication Middleware

- JWT verification in `middleware/auth.middleware.js`
- Role authorization in `middleware/authorize.middleware.js`
- Supports both Bearer tokens and cookies

### Static Asset Serving

- Public assets: No auth required
- Private assets: Requires valid JWT
- Shared assets: Common across all authenticated users

## Development Guards

1. **Environment**: Check `.env`
2. **Module Creation**: Follow exact folder structure above
3. **API Design**: All endpoints return standardized JSON format
4. **Frontend Auth**: Always set both localStorage AND cookies
5. **Testing**: Use `token.txt` for authenticated endpoint testing

## Debugging Workflow

1. **Health Check**: `GET /internal/health` should return `{"status":"ok"}`
2. **Token Issues**: Check `utilities/auth.util.js` for JWT validation
3. **Permission Denied**: Verify role arrays in controller files
4. **Frontend Auth**: Check browser dev tools for localStorage/cookies
5. **Database**: Inspect Firestore console for document structure

## Special Notes

- You are an agent
- Always consider an entire file is under 1000 lines of code or at least 2000 lines of code for better context understanding where applicable
- Use dot notation for file and folder names
- never user native alert, confirmation etc. Use a consistent messaging strategy with include snackbar, various modals, spinners etc.
- all test files should be placed at `tests/`
- all debugging file should be placed at `debug/`

## Quick Reference

- **Base URL**: `http://localhost:5000`
- **Admin Dashboard**: `/private/internal/dashboard/`
- **Tenant Admin**: `/private/external/tenant.admin/dashboard.html`
- **Tenant User**: `/private/external/tenant.user/dashboard.html`
- **API Docs**: Each module's `README.md` lists routes
- **Test Data**: `tests/payloads/` contains sample JSON
