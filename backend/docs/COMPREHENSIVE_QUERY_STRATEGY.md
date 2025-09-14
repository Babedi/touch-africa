# TouchAfrica API - Comprehensive Query Strategy Implementation

## Overview

This document outlines the comprehensive search, sort, order, paginate, and filter strategy implemented across all TouchAfrica backend endpoints.

## Implementation Status

### ✅ Completed Modules

- **Admin Module** (`/internal/admins`) - ✅ Complete
  - Enhanced list endpoint with full query parameters
  - Search endpoint with configurable fields
  - Bulk operations (create, update, delete, activate, deactivate)
  - Export functionality (CSV/JSON)
  - Statistics endpoint with comprehensive metrics
- **Tenant Module** (`/internal/tenants`) - ✅ Complete
  - Enhanced list endpoint with pagination and filtering
  - Search across company info, address, contacts
  - Bulk operations for tenant management
  - Export with province and company data
  - Statistics with province distribution
- **Person Module** (`/internal/persons`) - 🔄 In Progress
  - Controller updated with new handlers
  - Service needs query utility integration
- **Role Module** (`/internal/roles`) - 🔄 In Progress
  - Controller imports updated for query utilities

### 🔄 In Progress Modules

- Person Module - Controller updated, service pending
- Role Module - Controller imports updated, handlers pending

### ⏳ Pending Modules

- Lookup Module
- Permission Module
- Cultivar Template Module
- Service Request Module
- Tenant Admin Module
- Tenant User Module
- Lookup Category Module
- Lookup Sub Category Module
- Role Mapping Module
- Service Info Module

## Query Features

### 1. Pagination

Support for both offset-based and page-based pagination:

```
GET /internal/admins?page=1&limit=20
GET /internal/admins?offset=0&limit=20
```

### 2. Sorting

Multi-field sorting with configurable order:

```
GET /internal/admins?sortBy=personalInfo.firstName,createdAt&order=asc,desc
```

### 3. Filtering

Advanced filtering with multiple operators:

```
GET /internal/admins?status=active&roles=admin&personalInfo.email=@touchafrica.com
GET /internal/admins?createdAt[gte]=2024-01-01&createdAt[lte]=2024-12-31
```

### 4. Searching

Full-text search across specified fields:

```
GET /internal/admins/search?q=john&searchFields=personalInfo.firstName,personalInfo.lastName
```

### 5. Field Selection

Include or exclude specific fields:

```
GET /internal/admins?fields=id,personalInfo.firstName,personalInfo.email
GET /internal/admins?exclude=accessDetails,auditTrail
```

### 6. Bulk Operations

Perform operations on multiple records:

```
POST /internal/admins/bulk
{
  "operation": "create|update|delete|activate|deactivate",
  "data": [...],
  "filters": {...}
}
```

### 7. Export

Export data in multiple formats:

```
GET /internal/admins/export?format=csv&status=active
GET /internal/admins/export?format=json&limit=1000
```

### 8. Statistics

Get aggregated statistics:

```
GET /internal/admins/stats
```

## Query Parameters Reference

### Common Parameters

| Parameter      | Type    | Description           | Example                      |
| -------------- | ------- | --------------------- | ---------------------------- |
| `page`         | integer | Page number (1-based) | `?page=2`                    |
| `limit`        | integer | Items per page        | `?limit=50`                  |
| `offset`       | integer | Offset from start     | `?offset=100`                |
| `sortBy`       | string  | Fields to sort by     | `?sortBy=name,createdAt`     |
| `order`        | string  | Sort order (asc/desc) | `?order=asc,desc`            |
| `q`            | string  | Search query          | `?q=john`                    |
| `searchFields` | string  | Fields to search in   | `?searchFields=name,email`   |
| `fields`       | string  | Fields to include     | `?fields=id,name,email`      |
| `exclude`      | string  | Fields to exclude     | `?exclude=password,internal` |

### Filter Operators

| Operator | Description           | Example                         |
| -------- | --------------------- | ------------------------------- |
| `eq`     | Equals                | `?status=active`                |
| `ne`     | Not equals            | `?status[ne]=inactive`          |
| `gt`     | Greater than          | `?age[gt]=18`                   |
| `gte`    | Greater than or equal | `?createdAt[gte]=2024-01-01`    |
| `lt`     | Less than             | `?age[lt]=65`                   |
| `lte`    | Less than or equal    | `?createdAt[lte]=2024-12-31`    |
| `in`     | In array              | `?status[in]=active,pending`    |
| `nin`    | Not in array          | `?status[nin]=deleted,archived` |
| `exists` | Field exists          | `?email[exists]=true`           |
| `regex`  | Regular expression    | `?name[regex]=^John`            |

## Implementation Examples

### Admin Module Implementation

#### New Endpoints Added:

- `GET /internal/admins/search` - Search admins
- `GET /internal/admins/export` - Export admins
- `GET /internal/admins/stats` - Get admin statistics
- `POST /internal/admins/bulk` - Bulk operations

#### Enhanced Endpoints:

- `GET /internal/admins` - Now supports full query parameters

#### Usage Examples:

1. **Advanced Listing with Filters:**

```bash
curl "http://localhost:3000/api/internal/admins?page=1&limit=10&sortBy=personalInfo.firstName&order=asc&status=active&roles=admin"
```

2. **Search Admins:**

```bash
curl "http://localhost:3000/api/internal/admins/search?q=john&searchFields=personalInfo.firstName,personalInfo.lastName,personalInfo.email"
```

3. **Export Active Admins:**

```bash
curl "http://localhost:3000/api/internal/admins/export?format=csv&status=active" -H "Authorization: Bearer YOUR_TOKEN"
```

4. **Bulk Activate Admins:**

```bash
curl -X POST "http://localhost:3000/api/internal/admins/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "operation": "activate",
    "data": ["admin1", "admin2", "admin3"]
  }'
```

5. **Get Admin Statistics:**

```bash
curl "http://localhost:3000/api/internal/admins/stats" -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Format

### Standard List Response

```json
{
  "success": true,
  "message": "Admins retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "query": {
      "sortBy": ["personalInfo.firstName"],
      "order": ["asc"],
      "filters": {...}
    }
  }
}
```

### Search Response

```json
{
  "success": true,
  "message": "Admin search completed successfully",
  "data": {
    "items": [...],
    "pagination": {...},
    "searchQuery": "john",
    "searchFields": ["personalInfo.firstName", "personalInfo.lastName"]
  }
}
```

### Bulk Operation Response

```json
{
  "success": true,
  "message": "Bulk activate completed successfully",
  "data": {
    "success": 3,
    "failed": 0,
    "errors": []
  }
}
```

### Statistics Response

```json
{
  "success": true,
  "message": "Admin statistics retrieved successfully",
  "data": {
    "total": 150,
    "active": 120,
    "inactive": 25,
    "pending": 5,
    "roleDistribution": {
      "admin": 50,
      "manager": 30,
      "viewer": 70
    },
    "recentLogins": 45,
    "createdThisMonth": 12
  }
}
```

## Security & Permissions

All new endpoints respect existing permission middleware:

- Search requires `admin.read` permission
- Export requires `admin.read` permission
- Statistics require `admin.read` permission
- Bulk operations require appropriate permissions based on operation type

## Performance Considerations

1. **Pagination**: Default limit is 20, maximum is 100 for regular endpoints
2. **Export**: Higher limits (up to 10,000) for export endpoints
3. **Search**: Uses in-memory search for complex text queries, Firestore queries for exact matches
4. **Caching**: Query results can be cached at the service layer
5. **Field Selection**: Reduces response payload size

## Next Steps

1. ✅ Implement remaining 12 modules with same pattern
2. Add query result caching layer
3. Implement query optimization for complex filters
4. Add query performance monitoring
5. Create API documentation with Swagger/OpenAPI

## Testing Examples

```javascript
// Test pagination
const response1 = await fetch("/api/internal/admins?page=1&limit=5");

// Test sorting
const response2 = await fetch(
  "/api/internal/admins?sortBy=personalInfo.firstName&order=desc"
);

// Test filtering
const response3 = await fetch(
  "/api/internal/admins?status=active&roles[in]=admin,manager"
);

// Test search
const response4 = await fetch(
  "/api/internal/admins/search?q=john&searchFields=personalInfo.firstName,personalInfo.email"
);

// Test field selection
const response5 = await fetch(
  "/api/internal/admins?fields=id,personalInfo.firstName,personalInfo.email"
);

// Test export
const response6 = await fetch(
  "/api/internal/admins/export?format=csv&status=active"
);
```
