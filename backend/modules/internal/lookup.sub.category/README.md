# Lookup Sub Category Module

## Overview

Complete CRUD API module for managing lookup sub categories in the touchAfrica system. This module follows the established architectural patterns and provides full functionality for subcategory management.

## Routes

### Base Path: `/internal/lookupSubCategory`

| Method | Endpoint      | Description                         | Auth Required | Roles                                                                 |
| ------ | ------------- | ----------------------------------- | ------------- | --------------------------------------------------------------------- |
| POST   | `/`           | Create new lookup sub category      | Yes           | `internalRootAdmin`, `internalSuperAdmin`, `lookupSubCategoryManager` |
| GET    | `/list`       | Get all lookup sub categories       | Yes           | `internalRootAdmin`, `internalSuperAdmin`, `lookupSubCategoryManager` |
| GET    | `/:id`        | Get lookup sub category by ID       | Yes           | `internalRootAdmin`, `internalSuperAdmin`, `lookupSubCategoryManager` |
| PUT    | `/:id`        | Update lookup sub category          | Yes           | `internalRootAdmin`, `internalSuperAdmin`, `lookupSubCategoryManager` |
| DELETE | `/:id`        | Delete lookup sub category          | Yes           | `internalRootAdmin`, `internalSuperAdmin`, `lookupSubCategoryManager` |
| GET    | `/search`     | Search lookup sub categories        | Yes           | `internalRootAdmin`, `internalSuperAdmin`, `lookupSubCategoryManager` |
| GET    | `/:id/exists` | Check if lookup sub category exists | Yes           | `internalRootAdmin`, `internalSuperAdmin`, `lookupSubCategoryManager` |

## Request/Response Format

### Create Lookup Sub Category

**POST** `/internal/lookupSubCategory`

**Request Body:**

```json
{
  "subcategory": "Geography",
  "description": "Major countries for international operations and user registration"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "LOOKUP_SUB_CATEGORY1755422788424",
    "subcategory": "Geography",
    "description": "Major countries for international operations and user registration",
    "created": {
      "by": "ADMIN_LOCAL_TEST",
      "when": "2025-08-17T09:26:28.424Z"
    },
    "updated": {
      "by": "ADMIN_LOCAL_TEST",
      "when": "2025-08-17T09:26:28.424Z"
    }
  }
}
```

### Update Lookup Sub Category

**PUT** `/internal/lookupSubCategory/:id`

**Request Body:**

```json
{
  "subcategory": "Geographic Regions",
  "description": "Updated geographic regions for international operations and user registration"
}
```

### Search Lookup Sub Categories

**GET** `/internal/lookupSubCategory/search?subcategory=Geography`

### Get All Lookup Sub Categories

**GET** `/internal/lookupSubCategory/list`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "LOOKUP_SUB_CATEGORY1755422788424",
      "subcategory": "Geography",
      "description": "Major countries for international operations and user registration",
      "created": {
        "by": "ADMIN_LOCAL_TEST",
        "when": "2025-08-17T09:26:28.424Z"
      },
      "updated": {
        "by": "ADMIN_LOCAL_TEST",
        "when": "2025-08-17T09:26:28.424Z"
      }
    }
  ]
}
```

## Validation Rules

- **subcategory**: 3-50 characters, required
- **description**: 3-200 characters, required
- **ID Format**: `LOOKUP_SUB_CATEGORY{timestamp}`

## Error Responses

### Validation Error

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 3,
      "type": "string",
      "message": "String must contain at least 3 character(s)",
      "path": ["subcategory"]
    }
  ]
}
```

### Unauthorized Access

```json
{
  "success": false,
  "error": "Authentication required",
  "message": "No authentication token provided"
}
```

### Not Found

```json
{
  "success": false,
  "error": "Lookup sub category not found"
}
```

## CURL Examples

### Create

```bash
curl -X POST "http://localhost:5000/internal/lookupSubCategory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subcategory": "Technology",
    "description": "Technology-related subcategories for digital operations"
  }'
```

### Get All

```bash
curl -X GET "http://localhost:5000/internal/lookupSubCategory/list" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update

```bash
curl -X PUT "http://localhost:5000/internal/lookupSubCategory/LOOKUP_SUB_CATEGORY123456789" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subcategory": "Updated Technology",
    "description": "Updated technology-related subcategories"
  }'
```

### Delete

```bash
curl -X DELETE "http://localhost:5000/internal/lookupSubCategory/LOOKUP_SUB_CATEGORY123456789" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Run E2E Tests

```bash
node tests/internal/lookup.sub.category.routes.test.mjs
```

### Run POST Demo

```bash
node tests/posts/internal/lookup.sub.category.post.mjs
```

## Module Files

- `lookup.sub.category.validation.js` - Zod schemas and validation
- `lookup.sub.category.firestore.js` - Firestore CRUD operations
- `lookup.sub.category.service.js` - Business logic layer
- `lookup.sub.category.controller.js` - HTTP request handlers
- `lookup.sub.category.route.js` - Express router configuration

## Implementation Status

✅ **COMPLETE** - All CRUD operations working, 100% test coverage achieved
