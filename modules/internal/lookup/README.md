# Lookup Module

## Overview

The Lookup module provides hierarchical data management for the NeighbourGuard Panic Button API. It allows creation and management of categorized lookup data used throughout the system.

## API Endpoints

### Base Path: `/internal/lookup`

#### Authentication

All endpoints require JWT authentication with appropriate role authorization.

#### Authorized Roles

- `internalRootAdmin` - Full access
- `internalSuperAdmin` - Full access
- `lookupManager` - Full access

---

### 1. Create Lookup

**POST** `/internal/lookup`

Create a new lookup entry.

**Request Body:**

```json
{
  "category": "Geography",
  "subCategory": "Countries",
  "items": ["South Africa", "United States", "United Kingdom"],
  "description": "Major countries for international operations"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "LOOKUP1692179400000",
    "category": "Geography",
    "subCategory": "Countries",
    "items": ["South Africa", "United States", "United Kingdom"],
    "description": "Major countries for international operations",
    "created": {
      "by": "admin@example.com",
      "when": "2025-08-16T14:30:00Z"
    },
    "updated": {
      "by": "admin@example.com",
      "when": "2025-08-16T14:30:00Z"
    },
    "active": true
  }
}
```

---

### 2. Get Lookup by ID

**GET** `/internal/lookup/:id`

Retrieve a specific lookup by ID.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "LOOKUP1692179400000",
    "category": "Geography",
    "subCategory": "Countries",
    "items": ["South Africa", "United States", "United Kingdom"],
    "description": "Major countries for international operations",
    "created": {
      "by": "admin@example.com",
      "when": "2025-08-16T14:30:00Z"
    },
    "updated": {
      "by": "admin@example.com",
      "when": "2025-08-16T14:30:00Z"
    },
    "active": true
  }
}
```

---

### 3. Update Lookup

**PUT** `/internal/lookup/:id`

Update an existing lookup. All fields are optional for updates.

**Request Body:**

```json
{
  "description": "Updated description",
  "items": ["South Africa", "United States", "United Kingdom", "Canada"]
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "LOOKUP1692179400000",
    "category": "Geography",
    "subCategory": "Countries",
    "items": ["South Africa", "United States", "United Kingdom", "Canada"],
    "description": "Updated description",
    "created": {
      "by": "admin@example.com",
      "when": "2025-08-16T14:30:00Z"
    },
    "updated": {
      "by": "admin@example.com",
      "when": "2025-08-16T14:35:00Z"
    },
    "active": true
  }
}
```

---

### 4. Delete Lookup

**DELETE** `/internal/lookup/:id`

Delete a lookup by ID.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Lookup deleted successfully"
  }
}
```

---

### 5. List All Lookups

**GET** `/internal/lookup/list`

Retrieve all lookups in the system.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "LOOKUP1692179400000",
      "category": "Geography",
      "subCategory": "Countries",
      "items": ["South Africa", "United States"],
      "description": "Major countries",
      "created": {
        "by": "admin@example.com",
        "when": "2025-08-16T14:30:00Z"
      },
      "updated": {
        "by": "admin@example.com",
        "when": "2025-08-16T14:30:00Z"
      },
      "active": true
    }
  ]
}
```

---

## Data Model

### Lookup Object

```json
{
  "id": "string", // Auto-generated: LOOKUP{timestamp}
  "category": "string", // 3-50 characters, required
  "subCategory": "string", // 3-50 characters, required
  "items": ["string"], // Array of 1-25 strings, required
  "description": "string", // 3-200 characters, required
  "created": {
    "by": "string", // Creator identifier
    "when": "string" // ISO timestamp
  },
  "updated": {
    "by": "string", // Last updater identifier
    "when": "string" // ISO timestamp
  },
  "active": "boolean" // Default: true
}
```

---

## Error Responses

### 400 - Bad Request

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

### 401 - Unauthorized

```json
{
  "success": false,
  "error": "No token provided"
}
```

### 403 - Forbidden

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 - Not Found

```json
{
  "success": false,
  "error": "Lookup not found"
}
```

---

## Testing

### Generate Token

```bash
npm run make:token
```

### Run E2E Tests

```bash
npm run test:lookup
```

### Post Sample Data

```bash
npm run post:lookup
```

---

## Firestore Structure

**Collection Path:** `/services/neighbourGuardService/lookups`

**Document Structure:**

```
lookups/
  └── LOOKUP{timestamp}/
      ├── id: "LOOKUP{timestamp}"
      ├── category: "Geography"
      ├── subCategory: "Countries"
      ├── items: ["South Africa", "United States"]
      ├── description: "Major countries"
      ├── created: { by: "admin", when: "2025-08-16T14:30:00Z" }
      ├── updated: { by: "admin", when: "2025-08-16T14:30:00Z" }
      └── active: true
```
