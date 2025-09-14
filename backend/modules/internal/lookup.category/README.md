# Lookup Category Module

## Overview

The Lookup Category module provides CRUD operations for managing lookup categories in the touchAfrica system. This module follows the established modular architecture pattern and includes comprehensive validation, authentication, and authorization.

## Module Structure

```
modules/internal/lookup.category/
├── lookup.category.validation.js    # Zod schemas and validation functions
├── lookup.category.firestore.js     # Firestore CRUD operations
├── lookup.category.service.js       # Business logic with metadata handling
├── lookup.category.controller.js    # HTTP handlers and request validation
├── lookup.category.route.js         # Express routes with authentication
└── README.md                        # This documentation
```

## API Endpoints

### Base Path: `/internal/lookupCategory`

All endpoints require JWT authentication and appropriate role authorization.

### Authorization Roles

**Read Operations (GET):**

- `internalRootAdmin`
- `internalSuperAdmin`
- `internalStandardAdmin`

**Write Operations (POST, PUT, DELETE):**

- `internalRootAdmin`
- `internalSuperAdmin`

### Endpoints

#### 1. Create Lookup Category

```
POST /internal/lookupCategory/create
```

**Authorization:** Root Admin, Super Admin  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "category": "Emergency Types",
  "description": "Categories for different types of emergency situations"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "LKCT1704067200000",
    "category": "Emergency Types",
    "description": "Categories for different types of emergency situations",
    "created": {
      "by": "ADM1704067000000",
      "when": "2024-01-01T00:00:00.000Z"
    },
    "updated": {
      "by": "ADM1704067000000",
      "when": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 2. Get All Lookup Categories

```
GET /internal/lookupCategory/list
```

**Authorization:** Root Admin, Super Admin, Standard Admin

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "LKCT1704067200000",
      "category": "Emergency Types",
      "description": "Categories for different types of emergency situations",
      "created": {
        "by": "ADM1704067000000",
        "when": "2024-01-01T00:00:00.000Z"
      },
      "updated": {
        "by": "ADM1704067000000",
        "when": "2024-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

#### 3. Get Lookup Category by ID

```
GET /internal/lookupCategory/:id
```

**Authorization:** Root Admin, Super Admin, Standard Admin

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "LKCT1704067200000",
    "category": "Emergency Types",
    "description": "Categories for different types of emergency situations",
    "created": { "by": "ADM1704067000000", "when": "2024-01-01T00:00:00.000Z" },
    "updated": { "by": "ADM1704067000000", "when": "2024-01-01T00:00:00.000Z" }
  }
}
```

#### 4. Update Lookup Category

```
PUT /internal/lookupCategory/:id
```

**Authorization:** Root Admin, Super Admin  
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "category": "Emergency Classifications",
  "description": "Updated categories for emergency situation classifications"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "LKCT1704067200000",
    "category": "Emergency Classifications",
    "description": "Updated categories for emergency situation classifications",
    "created": { "by": "ADM1704067000000", "when": "2024-01-01T00:00:00.000Z" },
    "updated": { "by": "ADM1704067000000", "when": "2024-01-01T00:05:00.000Z" }
  }
}
```

#### 5. Delete Lookup Category

```
DELETE /internal/lookupCategory/:id
```

**Authorization:** Root Admin, Super Admin

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Lookup category deleted successfully"
  }
}
```

#### 6. Search Lookup Categories

```
GET /internal/lookupCategory/search?category={searchTerm}
```

**Authorization:** Root Admin, Super Admin, Standard Admin

**Query Parameters:**

- `category` (string, required): Search term for category name (case-insensitive)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "LKCT1704067200000",
      "category": "Emergency Types",
      "description": "Categories for different types of emergency situations",
      "created": {
        "by": "ADM1704067000000",
        "when": "2024-01-01T00:00:00.000Z"
      },
      "updated": {
        "by": "ADM1704067000000",
        "when": "2024-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

#### 7. Check Lookup Category Exists

```
GET /internal/lookupCategory/:id/exists
```

**Authorization:** Root Admin, Super Admin, Standard Admin

**Response:**

```json
{
  "success": true,
  "data": {
    "exists": true
  }
}
```

## Data Schema

### Lookup Category Object

| Field         | Type   | Required       | Validation                 | Description          |
| ------------- | ------ | -------------- | -------------------------- | -------------------- |
| `id`          | string | Auto-generated | `LKCT{timestamp}` format   | Unique identifier    |
| `category`    | string | Yes            | 3-50 characters            | Category name        |
| `description` | string | Yes            | 3-200 characters           | Category description |
| `created`     | object | Auto-generated | `{by: string, when: Date}` | Creation metadata    |
| `updated`     | object | Auto-generated | `{by: string, when: Date}` | Last update metadata |

### Validation Rules

**Create Schema (LookupCategorySchema):**

- `category`: String, 3-50 characters, trimmed
- `description`: String, 3-200 characters, trimmed

**Update Schema (LookupCategoryUpdateSchema):**

- `category`: String, 3-50 characters, trimmed (optional)
- `description`: String, 3-200 characters, trimmed (optional)
- At least one field must be provided

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 3,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 3 character(s)",
      "path": ["category"]
    }
  ]
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "error": "Access denied"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### Not Found (404)

```json
{
  "success": false,
  "error": "Lookup category not found"
}
```

### Server Error (500)

```json
{
  "success": false,
  "error": "Failed to create lookup category"
}
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Testing

### E2E Route Testing

```bash
node tests/lookup.category.routes.test.mjs
```

### Interactive Demo

```bash
node tests/test-lookup-category-post.mjs
```

### Example cURL Commands

**Create Lookup Category:**

```bash
curl -X POST "http://localhost:5000/internal/lookupCategory/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "category": "Fire Emergency",
    "description": "Categories for fire emergency situations"
  }'
```

**Get All Lookup Categories:**

```bash
curl -X GET "http://localhost:5000/internal/lookupCategory/list" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Search Lookup Categories:**

```bash
curl -X GET "http://localhost:5000/internal/lookupCategory/search?category=Fire" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Storage

**Collection Path:** `touchAfrica/southAfrica/lookupCategory`

**Document Structure:**

```json
{
  "id": "LKCT1704067200000",
  "category": "Emergency Types",
  "description": "Categories for different types of emergency situations",
  "created": {
    "by": "ADM1704067000000",
    "when": "2024-01-01T00:00:00.000Z"
  },
  "updated": {
    "by": "ADM1704067000000",
    "when": "2024-01-01T00:00:00.000Z"
  }
}
```

## Integration

The module is automatically registered in `app.js`:

```javascript
import internalLookupCategoryRouter from "./modules/internal/lookup.category/lookup.category.route.js";
app.use(internalLookupCategoryRouter);
```

## Dependencies

- **Express.js**: Web framework
- **Zod**: Schema validation
- **Firestore**: Database operations
- **JWT**: Authentication
- **Custom Middleware**: `authenticateJWT`, `authorize`

## Related Modules

- **Lookup Module**: `modules/internal/lookup/` - For specific lookup items
- **Admin Module**: `modules/internal/admin/` - For admin user management

## Development Notes

1. Follow the established naming convention using dot notation (`lookup.category`)
2. All Firestore operations use merge writes for data integrity
3. Metadata (created/updated) is automatically handled in the service layer
4. Authorization roles are defined in the controller and enforced via middleware
5. All responses follow the standard `{success: boolean, data: any, error?: string}` format
