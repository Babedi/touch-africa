# Module Creation Prompt Template

## VARIABLES TO EDIT BEFORE USE

- MODULE_NAME: lookups
- MODULE_TYPE: internal
- ROUTE_PREFIX: /internal/lookups
- COLLECTION_NAME: lookups
- ID_PREFIX: LOOKUP
- REQUIRES_TENANT_HEADER: false
- REQUIRES_AUTH: false
- HAS_LOGIN_SYSTEM: false
- HAS_AVAILABILITY_STATUS: false
- HAS_SOFT_DELETE: false
- HAS_AUDIT_TRAIL: false
- HAS_BULK_OPERATIONS: true
- HAS_SEARCH_FILTER: true
- HAS_PAGINATION: true
- HAS_CACHING: true
- HAS_FILE_UPLOAD: false
- HAS_REAL_TIME: false
- LOGIN_CREDENTIALS: false
- READ_ROLES: false
- WRITE_ROLES: internalRootAdmin, internalSuperAdmin
- MAIN_ENTITY_FIELDS: category, subCategory, items
- VALIDATION_RULES: all fields are required
- SAMPLE_DATA_VALUES:
  "category": {
  "subCategory1": {
  "items": ["South Africa", "United States", "United Kingdom", "India", "China"]
  },
  "subCategory2": {
  "items": [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
  ]
  }
  }
- MENU_INTEGRATION: false
- RELATIONSHIP_MODULES: N/A
- PERFORMANCE_REQUIREMENTS: N/A
- BUSINESS_RULES: allow a 1 min to 100 max items

---

## COMPREHENSIVE MODULE CREATION REQUEST

Create a complete **${MODULE_NAME}** module for the **${MODULE_TYPE}** category with the following specifications:

### 1. MODULE STRUCTURE REQUIREMENTS

**Location**: `modules/${MODULE_TYPE}/${MODULE_NAME}/`

**Required Files**:

- `${MODULE_NAME}.route.js` - Express router with full CRUD operations (NOTE: Use .route.js extension to match existing codebase)
- `${MODULE_NAME}.validation.js` - Zod validation schemas with comprehensive error handling
- `${MODULE_NAME}.controller.js` - Request/response handlers with proper error management
- `${MODULE_NAME}.service.js` - Business logic layer with database operations
- `${MODULE_NAME}.firestore.js` - Firestore-specific database operations (if complex queries needed)
- `README.md` - Module documentation with API examples and usage instructions

### 2. ROUTE SPECIFICATIONS

**Base Route**: `${ROUTE_PREFIX}`

**Required Endpoints**:

- `POST ${ROUTE_PREFIX}` - Create new ${MODULE_NAME}
- `GET ${ROUTE_PREFIX}/list` - Get all ${MODULE_NAME} records
- `GET ${ROUTE_PREFIX}/:id` - Get specific ${MODULE_NAME} by ID
- `PUT ${ROUTE_PREFIX}/:id` - Update ${MODULE_NAME}
- `DELETE ${ROUTE_PREFIX}/:id` - Delete ${MODULE_NAME}

**Conditional Endpoints**:

**Search & Filter Endpoints** (if ${HAS_SEARCH_FILTER} = true):

- `GET ${ROUTE_PREFIX}/search` - Advanced search with query parameters
- `POST ${ROUTE_PREFIX}/filter` - Complex filtering with request body

**Bulk Operations** (if ${HAS_BULK_OPERATIONS} = true):

- `POST ${ROUTE_PREFIX}/bulk` - Bulk create multiple records
- `PUT ${ROUTE_PREFIX}/bulk` - Bulk update multiple records
- `DELETE ${ROUTE_PREFIX}/bulk` - Bulk delete multiple records

**Authentication Endpoints** (if ${HAS_LOGIN_SYSTEM} = true):

- `POST ${ROUTE_PREFIX}/login` - Authenticate ${MODULE_NAME} and return JWT token
- `POST ${ROUTE_PREFIX}/logout` - Logout ${MODULE_NAME} and invalidate session
- `GET ${ROUTE_PREFIX}/verify-token` - Verify current authentication status
- `POST ${ROUTE_PREFIX}/refresh-token` - Refresh expired authentication token

**Availability Endpoints** (if ${HAS_AVAILABILITY_STATUS} = true):

- `PUT ${ROUTE_PREFIX}/:id/availability` - Update availability status (available/unavailable)
- `GET ${ROUTE_PREFIX}/available` - Get all available ${MODULE_NAME} records
- `GET ${ROUTE_PREFIX}/unavailable` - Get all unavailable ${MODULE_NAME} records
- `PUT ${ROUTE_PREFIX}/:id/heartbeat` - Update last seen timestamp

**File Upload Endpoints** (if ${HAS_FILE_UPLOAD} = true):

- `POST ${ROUTE_PREFIX}/:id/upload` - Upload files for specific record
- `GET ${ROUTE_PREFIX}/:id/files` - Get list of files for record
- `DELETE ${ROUTE_PREFIX}/:id/files/:fileId` - Delete specific file

**Real-time Endpoints** (if ${HAS_REAL_TIME} = true):

- `GET ${ROUTE_PREFIX}/stream` - Server-Sent Events stream for real-time updates
- WebSocket endpoint: `ws://localhost:PORT${ROUTE_PREFIX}/ws` - WebSocket connection

**Authentication Requirements**:

- JWT Authentication: ${REQUIRES_AUTH}
- Tenant Header Required: ${REQUIRES_TENANT_HEADER}
- Read Roles: ${READ_ROLES}
- Write Roles: ${WRITE_ROLES}
- Middleware: Apply appropriate auth.middleware.js and authorize.middleware.js based on codebase patterns

### 3. DATA MODEL SPECIFICATIONS

**Firestore Collection**: `${COLLECTION_NAME}`

**Primary Entity Fields**:
${MAIN_ENTITY_FIELDS}

**System Fields** (Auto-generated):

- `id`: Unique identifier with prefix `${ID_PREFIX}` + timestamp
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `tenantId`: Associated tenant (if ${REQUIRES_TENANT_HEADER} = true)

**Soft Delete Fields** (if ${HAS_SOFT_DELETE} = true):

- `deletedAt`: ISO timestamp when record was soft deleted (null if active)
- `deletedBy`: ID of user/admin who performed soft delete

**Audit Trail Fields** (if ${HAS_AUDIT_TRAIL} = true):

- `createdBy`: ID of user/admin who created the record
- `updatedBy`: ID of user/admin who last updated the record
- `version`: Incremental version number for optimistic concurrency control
- `auditLog`: Array of audit trail entries with timestamp, action, actor, and changes

**Authentication Fields** (if ${HAS_LOGIN_SYSTEM} = true):

- `${LOGIN_CREDENTIALS}`: Authentication credentials (hashed passwords using bcrypt)
- `lastLoginAt`: ISO timestamp of last successful login
- `loginAttempts`: Number of failed login attempts (reset on successful login)
- `isLocked`: Boolean flag for account lockout (auto-unlock after timeout)
- `lockoutUntil`: ISO timestamp when account lockout expires
- `sessionTokens`: Array of active session tokens with expiry timestamps
- `passwordResetToken`: Temporary token for password reset (expires in 1 hour)
- `emailVerified`: Boolean flag for email verification status
- `twoFactorEnabled`: Boolean flag for 2FA enablement

**Availability Fields** (if ${HAS_AVAILABILITY_STATUS} = true):

- `isAvailable`: Boolean availability status
- `availabilityUpdatedAt`: ISO timestamp of last availability change
- `lastSeenAt`: ISO timestamp of last activity/heartbeat
- `unavailabilityReason`: String describing why unavailable (optional)

**Performance Fields** (if ${HAS_CACHING} = true):

- `cacheKey`: Redis cache key for this record
- `cacheExpiry`: ISO timestamp when cache expires
- `cacheVersion`: Version for cache invalidation

**File Fields** (if ${HAS_FILE_UPLOAD} = true):

- `attachments`: Array of file metadata objects with filename, size, mimetype, uploadedAt
- `fileStoragePath`: Cloud storage path prefix for this record's files

### 4. VALIDATION REQUIREMENTS

**Zod Schema Rules**:
${VALIDATION_RULES}

**Validation Structure**:

```javascript
// Base schema for creation
const Create${MODULE_NAME}Schema = z.object({
  // Define all required and optional fields
});

// Schema for updates (all fields optional)
const Update${MODULE_NAME}Schema = Create${MODULE_NAME}Schema.partial();

// Authentication schemas (if ${HAS_LOGIN_SYSTEM} = true)
const ${MODULE_NAME}LoginSchema = z.object({
  ${LOGIN_CREDENTIALS}: // Define login credential validation
});

// Availability schemas (if ${HAS_AVAILABILITY_STATUS} = true)
const ${MODULE_NAME}AvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  availabilityReason: z.string().optional()
});

// Export validation functions
module.exports = {
  validateCreate${MODULE_NAME}: (data) => Create${MODULE_NAME}Schema.parse(data),
  validateUpdate${MODULE_NAME}: (data) => Update${MODULE_NAME}Schema.parse(data),
  ${HAS_LOGIN_SYSTEM ? `validate${MODULE_NAME}Login: (data) => ${MODULE_NAME}LoginSchema.parse(data),` : '// No login validation needed'}
  ${HAS_AVAILABILITY_STATUS ? `validate${MODULE_NAME}Availability: (data) => ${MODULE_NAME}AvailabilitySchema.parse(data)` : '// No availability validation needed'}
};
```

### 5. CONTROLLER IMPLEMENTATION

**Required Functions**:

- `create${MODULE_NAME}Handler(req, res, next)` - Handle POST requests with comprehensive validation
- `get${MODULE_NAME}ListHandler(req, res, next)` - Handle GET list requests with pagination support
- `get${MODULE_NAME}ByIdHandler(req, res, next)` - Handle GET by ID requests with caching
- `update${MODULE_NAME}Handler(req, res, next)` - Handle PUT requests with version control
- `delete${MODULE_NAME}Handler(req, res, next)` - Handle DELETE requests (hard or soft delete)

**Enhanced CRUD Functions** (conditional based on flags):

**Search & Filter Functions** (if ${HAS_SEARCH_FILTER} = true):

- `search${MODULE_NAME}Handler(req, res, next)` - Advanced search with Elasticsearch-style queries
- `filter${MODULE_NAME}Handler(req, res, next)` - Complex filtering with multiple criteria

**Bulk Operations Functions** (if ${HAS_BULK_OPERATIONS} = true):

- `bulkCreate${MODULE_NAME}Handler(req, res, next)` - Bulk create with transaction support
- `bulkUpdate${MODULE_NAME}Handler(req, res, next)` - Bulk update with optimistic locking
- `bulkDelete${MODULE_NAME}Handler(req, res, next)` - Bulk delete with cascade handling

**Authentication Functions** (if ${HAS_LOGIN_SYSTEM} = true):

- `login${MODULE_NAME}Handler(req, res, next)` - Handle login with rate limiting
- `logout${MODULE_NAME}Handler(req, res, next)` - Handle logout with session cleanup
- `verifyToken${MODULE_NAME}Handler(req, res, next)` - Verify authentication token validity
- `refreshToken${MODULE_NAME}Handler(req, res, next)` - Refresh expired tokens with rotation
- `resetPassword${MODULE_NAME}Handler(req, res, next)` - Password reset workflow
- `changePassword${MODULE_NAME}Handler(req, res, next)` - Password change with validation

**Availability Functions** (if ${HAS_AVAILABILITY_STATUS} = true):

- `update${MODULE_NAME}AvailabilityHandler(req, res, next)` - Update availability status
- `getAvailable${MODULE_NAME}sHandler(req, res, next)` - Get all available records
- `getUnavailable${MODULE_NAME}sHandler(req, res, next)` - Get all unavailable records
- `updateLastSeen${MODULE_NAME}Handler(req, res, next)` - Update last activity timestamp

**File Upload Functions** (if ${HAS_FILE_UPLOAD} = true):

- `upload${MODULE_NAME}FileHandler(req, res, next)` - Handle file uploads with validation
- `get${MODULE_NAME}FilesHandler(req, res, next)` - Get list of files for record
- `delete${MODULE_NAME}FileHandler(req, res, next)` - Delete specific file with cleanup

**Real-time Functions** (if ${HAS_REAL_TIME} = true):

- `stream${MODULE_NAME}Handler(req, res, next)` - Server-Sent Events stream setup
- `websocket${MODULE_NAME}Handler(socket, data)` - WebSocket message handler

**Role-based Authorization**:

- `readRoles`: Export array of roles that can read: [${READ_ROLES}]
- `writeRoles`: Export array of roles that can write: [${WRITE_ROLES}]
- Implement `actorFrom(req)` helper to extract actor information from request

**Advanced Error Handling**:

- Proper HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500)
- Consistent error response format with correlation IDs
- Validation error details with field-specific messages
- Database operation error handling with retry logic
- Rate limiting error responses
- Circuit breaker patterns for external service calls

**Performance Optimizations** (if ${PERFORMANCE_REQUIREMENTS} defined):

- Response caching with cache-control headers
- Database query optimization
- Memory-efficient data streaming for large datasets
- Compression for large responses
- Connection pooling management

**Audit Trail Implementation** (if ${HAS_AUDIT_TRAIL} = true):

- Track all CRUD operations with actor information
- Version control for updates with change tracking
- Comprehensive audit log with metadata

**Soft Delete Implementation** (if ${HAS_SOFT_DELETE} = true):

- Mark records as deleted instead of hard delete
- Filter out soft-deleted records in list operations
- Restore functionality for soft-deleted records

**Error Handling**:

- Proper HTTP status codes (200, 201, 400, 404, 500)
- Consistent error response format
- Validation error details
- Database operation error handling

**Response Format**:

```javascript
// Success responses
{ success: true, data: {...}, message: "Operation completed" }

// Error responses
{ success: false, error: "Error message", details: {...} }
```

### 6. SERVICE LAYER IMPLEMENTATION

**Core Service Functions**:

- `create${MODULE_NAME}Service(data, context)` - Business logic for creation with validation
- `get${MODULE_NAME}ListService(filters, pagination, context)` - List with filtering and pagination
- `get${MODULE_NAME}ByIdService(id, context)` - Single record retrieval with caching
- `update${MODULE_NAME}Service(id, data, context)` - Update with optimistic locking
- `delete${MODULE_NAME}Service(id, context)` - Delete with cascade handling

**Enhanced Service Functions** (conditional based on flags):

**Search & Analytics Services** (if ${HAS_SEARCH_FILTER} = true):

- `search${MODULE_NAME}Service(query, options, context)` - Full-text search implementation
- `getAdvancedFilters${MODULE_NAME}Service(context)` - Available filter options
- `get${MODULE_NAME}Analytics(timeRange, context)` - Analytics and reporting

**Bulk Operations Services** (if ${HAS_BULK_OPERATIONS} = true):

- `bulkCreate${MODULE_NAME}Service(dataArray, context)` - Batch creation with transaction
- `bulkUpdate${MODULE_NAME}Service(updates, context)` - Batch updates with validation
- `bulkDelete${MODULE_NAME}Service(ids, context)` - Batch deletion with integrity checks
- `importFrom${MODULE_NAME}Service(source, format, context)` - Data import functionality
- `exportTo${MODULE_NAME}Service(filters, format, context)` - Data export functionality

**Authentication Services** (if ${HAS_LOGIN_SYSTEM} = true):

- `authenticate${MODULE_NAME}Service(credentials, context)` - Authentication logic
- `generateTokensService(user, context)` - JWT token generation with refresh
- `validateTokenService(token, context)` - Token validation and extraction
- `revokeTokenService(token, context)` - Token revocation and blacklisting
- `resetPasswordService(identifier, context)` - Password reset workflow
- `changePasswordService(userId, oldPassword, newPassword, context)` - Password change
- `lockAccountService(userId, reason, context)` - Account locking mechanism
- `unlockAccountService(userId, context)` - Account unlocking mechanism

**Availability Services** (if ${HAS_AVAILABILITY_STATUS} = true):

- `updateAvailabilityService(id, status, context)` - Availability management
- `getAvailabilityStatsService(context)` - Availability statistics
- `scheduleAvailabilityService(id, schedule, context)` - Scheduled availability
- `notifyAvailabilityChangeService(id, oldStatus, newStatus, context)` - Change notifications

**Caching Services** (if ${HAS_CACHING} = true):

- `cacheGet${MODULE_NAME}Service(key, context)` - Cache retrieval with fallback
- `cacheSet${MODULE_NAME}Service(key, data, ttl, context)` - Cache storage with TTL
- `cacheInvalidate${MODULE_NAME}Service(pattern, context)` - Cache invalidation
- `cacheWarmup${MODULE_NAME}Service(context)` - Cache warming strategies

**File Management Services** (if ${HAS_FILE_UPLOAD} = true):

- `uploadFileService(file, metadata, context)` - File upload with validation
- `getFileService(fileId, context)` - File retrieval with access control
- `deleteFileService(fileId, context)` - File deletion with cleanup
- `generatePresignedUrlService(fileId, operation, context)` - Presigned URLs
- `scanFileForVirusService(fileId, context)` - File security scanning
- `processFileService(fileId, operations, context)` - File processing pipeline

**Real-time Services** (if ${HAS_REAL_TIME} = true):

- `subscribeToUpdatesService(userId, filters, context)` - Real-time subscriptions
- `publishUpdateService(event, data, context)` - Event publishing
- `getActiveConnectionsService(context)` - Connection management
- `broadcastToRoleService(role, message, context)` - Role-based broadcasting

**Audit & Compliance Services** (if ${HAS_AUDIT_TRAIL} = true):

- `logAuditEventService(action, entityId, changes, context)` - Audit logging
- `getAuditHistoryService(entityId, context)` - Audit trail retrieval
- `exportAuditLogService(filters, context)` - Audit log export
- `validateComplianceService(entityId, context)` - Compliance checking

**Business Logic Services** (based on ${BUSINESS_RULES}):

- `validateBusinessRulesService(data, operation, context)` - Business rule validation
- `calculateDerivedFieldsService(data, context)` - Computed field calculations
- `enforceWorkflowService(entityId, action, context)` - Workflow management
- `generateReportsService(type, parameters, context)` - Report generation

**Database Services**:

- `${MODULE_NAME}Repository` - Data access layer with Firestore integration
- `validate${MODULE_NAME}IntegrityService(data, context)` - Data integrity checks
- `migrate${MODULE_NAME}DataService(from, to, context)` - Data migration utilities
- `backup${MODULE_NAME}DataService(context)` - Data backup functionality

**External Integration Services**:

- `sync${MODULE_NAME}WithExternalService(externalId, context)` - External sync
- `webhook${MODULE_NAME}HandlerService(payload, source, context)` - Webhook processing
- `notificationService(event, recipients, context)` - Multi-channel notifications

**Performance Services**:

- `optimize${MODULE_NAME}QueryService(query, context)` - Query optimization
- `preload${MODULE_NAME}DataService(ids, context)` - Data preloading
- `compress${MODULE_NAME}ResponseService(data, context)` - Response compression
- `rateLimit${MODULE_NAME}Service(identifier, context)` - Rate limiting logic

**Context Object Structure**:

```javascript
const context = {
  user: { id, role, permissions, tenantId },
  requestId: "unique-correlation-id",
  clientInfo: { ip, userAgent, apiVersion },
  performance: { startTime, timeout, cacheHint },
  audit: { actor, action, resource, timestamp },
};
```

**Service Layer Architecture**:

- Dependency injection for database and external services
- Clean separation of business logic from data access
- Comprehensive error handling with specific business exceptions
- Transaction management for multi-step operations
- Retry logic for transient failures
- Circuit breaker patterns for external service calls
- Metrics collection for monitoring and observability

### 7. FIRESTORE INTEGRATION

**Database Operations**:

- Use `services/firestore.client.js` for all database operations
- Implement proper error handling for Firestore operations
- Use transactions for complex operations
- Include proper indexing considerations

**Document Structure**:

```javascript
{
  id: "${ID_PREFIX}${timestamp}",
  ...entityFields,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tenantId: "TNNT...", // if applicable

  // Authentication fields (if ${HAS_LOGIN_SYSTEM} = true)
  ${LOGIN_CREDENTIALS}: "hashed_credentials",
  lastLoginAt: new Date().toISOString(),
  loginAttempts: 0,
  isLocked: false,
  sessionToken: "jwt_token_hash",

  // Availability fields (if ${HAS_AVAILABILITY_STATUS} = true)
  isAvailable: true,
  availabilityUpdatedAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString()
}
```

**Security Considerations**:

- Password hashing using bcrypt or similar
- JWT token management with proper expiration
- Rate limiting for login attempts
- Account lockout after failed attempts
- Secure session management

### 8. COMPREHENSIVE TESTING REQUIREMENTS

**Test Payload Files** (in `tests/payloads/`):

**Core Payloads**:

- `${MODULE_NAME}.json` - Complete valid payload with all fields
- `${MODULE_NAME}.min.json` - Minimal valid payload (required fields only)
- `${MODULE_NAME}.invalid.json` - Invalid payload for validation testing
- `${MODULE_NAME}.edge-cases.json` - Edge case values (empty strings, nulls, extremes)

**Authentication Test Payloads** (if ${HAS_LOGIN_SYSTEM} = true):

- `${MODULE_NAME}.login.json` - Valid login credentials
- `${MODULE_NAME}.login.invalid.json` - Invalid login credentials
- `${MODULE_NAME}.login.bruteforce.json` - Multiple invalid attempts for lockout testing
- `${MODULE_NAME}.password-reset.json` - Password reset request payload
- `${MODULE_NAME}.token-refresh.json` - Token refresh payload

**Availability Test Payloads** (if ${HAS_AVAILABILITY_STATUS} = true):

- `${MODULE_NAME}.availability.json` - Availability status update payload
- `${MODULE_NAME}.availability-schedule.json` - Scheduled availability changes

**Bulk Operations Payloads** (if ${HAS_BULK_OPERATIONS} = true):

- `${MODULE_NAME}.bulk-create.json` - Array of valid records for bulk creation
- `${MODULE_NAME}.bulk-update.json` - Array of update operations
- `${MODULE_NAME}.bulk-mixed.json` - Mixed valid/invalid records for partial success testing

**File Upload Payloads** (if ${HAS_FILE_UPLOAD} = true):

- `${MODULE_NAME}.file-metadata.json` - File upload metadata
- Test files in various formats (PDF, images, documents)
- Large file for size limit testing
- Malicious file for security testing

**Sample Test Data**:
${SAMPLE_DATA_VALUES}

**Test Scripts** (create these files):

**Core Test Scripts**:

- `test-${MODULE_NAME}-routes.mjs` - Basic route testing script
- `tests/${MODULE_TYPE}/${MODULE_NAME}.routes.test.mjs` - Comprehensive test suite
- `tests/${MODULE_TYPE}/${MODULE_NAME}.integration.test.mjs` - Integration tests
- `tests/${MODULE_TYPE}/${MODULE_NAME}.performance.test.mjs` - Performance tests
- `tests/${MODULE_TYPE}/${MODULE_NAME}.security.test.mjs` - Security tests

**Specialized Test Scripts** (conditional):

- `tests/${MODULE_TYPE}/${MODULE_NAME}.auth.test.mjs` - Authentication tests (if ${HAS_LOGIN_SYSTEM})
- `tests/${MODULE_TYPE}/${MODULE_NAME}.bulk.test.mjs` - Bulk operation tests (if ${HAS_BULK_OPERATIONS})
- `tests/${MODULE_TYPE}/${MODULE_NAME}.realtime.test.mjs` - Real-time functionality tests (if ${HAS_REAL_TIME})
- `tests/${MODULE_TYPE}/${MODULE_NAME}.file.test.mjs` - File upload tests (if ${HAS_FILE_UPLOAD})

**Comprehensive Test Coverage**:

**Core CRUD Testing**:

- All CRUD operations with valid data
- Validation testing (valid and invalid data)
- Database persistence verification
- Error scenario testing
- Edge case handling
- Concurrent operation testing
- Transaction rollback testing

**Security Testing**:

- Authentication/authorization testing
- Input sanitization verification
- SQL injection protection
- XSS protection
- CSRF protection
- Rate limiting verification
- Token security testing

**Performance Testing**:

- Load testing for high concurrency
- Memory usage monitoring
- Response time benchmarks
- Database query optimization verification
- Cache effectiveness testing
- Large dataset handling

**Authentication Test Coverage** (if ${HAS_LOGIN_SYSTEM} = true):

- Valid login with correct credentials
- Invalid login attempts with wrong credentials
- Password hashing and verification
- JWT token generation and validation
- Token expiration and refresh
- Session management and cleanup
- Account lockout after failed attempts
- Password strength validation
- Multi-device session handling
- Logout and token revocation

**Availability Test Coverage** (if ${HAS_AVAILABILITY_STATUS} = true):

- Availability status updates
- Filtering by availability status
- Last seen timestamp updates
- Availability change notifications
- Scheduled availability changes
- Availability history tracking

**Bulk Operations Test Coverage** (if ${HAS_BULK_OPERATIONS} = true):

- Bulk creation with valid data
- Bulk creation with mixed valid/invalid data
- Bulk update operations
- Bulk delete operations
- Transaction handling in bulk operations
- Performance testing for large bulk operations
- Error handling and rollback in bulk operations

**File Upload Test Coverage** (if ${HAS_FILE_UPLOAD} = true):

- Valid file upload with supported formats
- File size limit enforcement
- Malicious file detection
- File metadata extraction
- File storage and retrieval
- File deletion and cleanup
- Virus scanning integration
- File access control
- Large file upload handling

**Real-time Test Coverage** (if ${HAS_REAL_TIME} = true):

- WebSocket connection establishment
- Real-time event publishing
- Event subscription and filtering
- Connection cleanup on disconnect
- Broadcasting to multiple clients
- Role-based event filtering
- Server-Sent Events testing
- Connection pooling and scaling

**Caching Test Coverage** (if ${HAS_CACHING} = true):

- Cache hit and miss scenarios
- Cache invalidation testing
- TTL expiration verification
- Cache warming strategies
- Cache key collision prevention
- Memory usage monitoring
- Cache consistency across instances

**Audit Trail Test Coverage** (if ${HAS_AUDIT_TRAIL} = true):

- Audit log creation for all operations
- Audit log integrity verification
- Historical data reconstruction
- Compliance reporting
- Data retention policy enforcement
- Audit log export functionality

**Data Quality Testing**:

- Data validation at multiple layers
- Business rule enforcement
- Data integrity constraints
- Referential integrity testing
- Data migration verification
- Backup and restore testing

**Error Handling Testing**:

- Network failure simulation
- Database connection failures
- External service unavailability
- Memory exhaustion scenarios
- Timeout handling
- Graceful degradation testing

**Monitoring and Observability Testing**:

- Metrics collection verification
- Log aggregation testing
- Health check endpoint validation
- Alert trigger testing
- Performance monitoring
- Error tracking integration

### 8. INTEGRATION REQUIREMENTS

**App.js Integration**:

```javascript
// Add to app.js
const ${MODULE_NAME}Routes = require('./modules/${MODULE_TYPE}/${MODULE_NAME}/${MODULE_NAME}.routes');
app.use('${ROUTE_PREFIX}', ${MODULE_NAME}Routes);
```

**Menu Integration** (if ${MENU_INTEGRATION} = true):

- Add menu items to tenant activation context menu
- Implement menu-based routing for alarm systems
- Create menu validation schemas

**Relationship Handling** (if applicable):

- Foreign key relationships to: ${RELATIONSHIP_MODULES}
- Cascade delete operations where appropriate
- Reference validation

### 9. SAMPLE IMPLEMENTATION TEMPLATES

**Route Template**:

```javascript
const express = require('express');
const router = express.Router();
const { validateCreate${MODULE_NAME}, validateUpdate${MODULE_NAME}${HAS_LOGIN_SYSTEM ? `, validate${MODULE_NAME}Login` : ''}${HAS_AVAILABILITY_STATUS ? `, validate${MODULE_NAME}Availability` : ''} } = require('./${MODULE_NAME}.validation');
const {
  create${MODULE_NAME},
  get${MODULE_NAME}List,
  get${MODULE_NAME}ById,
  update${MODULE_NAME},
  delete${MODULE_NAME}${HAS_LOGIN_SYSTEM ? `,
  login${MODULE_NAME},
  logout${MODULE_NAME},
  verifyToken${MODULE_NAME}` : ''}${HAS_AVAILABILITY_STATUS ? `,
  update${MODULE_NAME}Availability,
  getAvailable${MODULE_NAME}s,
  getUnavailable${MODULE_NAME}s` : ''}
} = require('./${MODULE_NAME}.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const authorizeMiddleware = require('../../../middleware/authorize.middleware');

// Authentication routes (if ${HAS_LOGIN_SYSTEM} = true) - NO AUTH REQUIRED
${HAS_LOGIN_SYSTEM ? `
router.post('/login', login${MODULE_NAME});
router.post('/logout', logout${MODULE_NAME});
router.get('/verify-token', verifyToken${MODULE_NAME});
` : '// No authentication routes needed'}

// Apply middleware for protected routes
${REQUIRES_AUTH ? 'router.use(authMiddleware);' : '// No auth required'}
${REQUIRES_AUTH ? 'router.use(authorizeMiddleware);' : '// No authorization required'}

// CRUD routes
router.post('/', create${MODULE_NAME});
router.get('/list', get${MODULE_NAME}List);
router.get('/:id', get${MODULE_NAME}ById);
router.put('/:id', update${MODULE_NAME});
router.delete('/:id', delete${MODULE_NAME});

// Availability routes (if ${HAS_AVAILABILITY_STATUS} = true)
${HAS_AVAILABILITY_STATUS ? `
router.put('/:id/availability', update${MODULE_NAME}Availability);
router.get('/available', getAvailable${MODULE_NAME}s);
router.get('/unavailable', getUnavailable${MODULE_NAME}s);
` : '// No availability routes needed'}

module.exports = router;
```

### 10. QUALITY ASSURANCE CHECKLIST

**Code Quality**:

- [ ] Consistent naming conventions
- [ ] Proper error handling
- [ ] Input validation and sanitization
- [ ] Security best practices
- [ ] Performance optimization

**Testing Verification**:

- [ ] All endpoints return proper status codes
- [ ] Validation works for both valid and invalid data
- [ ] Database operations persist correctly
- [ ] Authentication/authorization enforced
- [ ] Error responses are informative

**Authentication Testing** (if ${HAS_LOGIN_SYSTEM} = true):

- [ ] Login endpoint works with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Passwords are properly hashed
- [ ] JWT tokens are generated correctly
- [ ] Token validation works properly
- [ ] Account lockout functions after failed attempts
- [ ] Logout invalidates sessions properly

**Availability Testing** (if ${HAS_AVAILABILITY_STATUS} = true):

- [ ] Availability status updates correctly
- [ ] Available/unavailable filtering works
- [ ] Last seen timestamps update properly
- [ ] Availability changes are tracked

**Integration Testing**:

- [ ] Module integrates with existing app.js
- [ ] Firestore operations work correctly
- [ ] Related modules interact properly
- [ ] Menu systems work (if applicable)

### 11. DEPLOYMENT VERIFICATION

**Manual Testing Commands**:

```bash
# Test health check
curl http://localhost:5000/internal/health

# Test module creation
curl -X POST http://localhost:5000${ROUTE_PREFIX} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat token.txt)" \
  ${REQUIRES_TENANT_HEADER ? '-H "x-tenant-id: TENANT_ID"' : ''} \
  -d @tests/payloads/${MODULE_NAME}.min.json

# Test module list
curl -X GET http://localhost:5000${ROUTE_PREFIX}/list \
  -H "Authorization: Bearer $(cat token.txt)" \
  ${REQUIRES_TENANT_HEADER ? '-H "x-tenant-id: TENANT_ID"' : ''}

# Test module retrieval
curl -X GET http://localhost:5000${ROUTE_PREFIX}/[ID] \
  -H "Authorization: Bearer $(cat token.txt)" \
  ${REQUIRES_TENANT_HEADER ? '-H "x-tenant-id: TENANT_ID"' : ''}

# Authentication testing (if ${HAS_LOGIN_SYSTEM} = true)
${HAS_LOGIN_SYSTEM ? `
# Test login
curl -X POST http://localhost:5000${ROUTE_PREFIX}/login \\
  -H "Content-Type: application/json" \\
  -d @tests/payloads/${MODULE_NAME}.login.json

# Test logout
curl -X POST http://localhost:5000${ROUTE_PREFIX}/logout \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer [LOGIN_TOKEN]"

# Test token verification
curl -X GET http://localhost:5000${ROUTE_PREFIX}/verify-token \\
  -H "Authorization: Bearer [LOGIN_TOKEN]"
` : '# No authentication endpoints to test'}

# Availability testing (if ${HAS_AVAILABILITY_STATUS} = true)
${HAS_AVAILABILITY_STATUS ? `
# Test availability update
curl -X PUT http://localhost:5000${ROUTE_PREFIX}/[ID]/availability \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $(cat token.txt)" \\
  ${REQUIRES_TENANT_HEADER ? '-H "x-tenant-id: TENANT_ID"' : ''} \\
  -d '{"isAvailable": false, "availabilityReason": "Maintenance"}'

# Test get available records
curl -X GET http://localhost:5000${ROUTE_PREFIX}/available \\
  -H "Authorization: Bearer $(cat token.txt)" \\
  ${REQUIRES_TENANT_HEADER ? '-H "x-tenant-id: TENANT_ID"' : ''}

# Test get unavailable records
curl -X GET http://localhost:5000${ROUTE_PREFIX}/unavailable \\
  -H "Authorization: Bearer $(cat token.txt)" \\
  ${REQUIRES_TENANT_HEADER ? '-H "x-tenant-id: TENANT_ID"' : ''}
` : '# No availability endpoints to test'}
```

**Database Verification**:

- Verify documents are created in `${COLLECTION_NAME}` collection
- Check all required fields are populated
- Validate relationships to other collections
- Confirm proper indexing

**Authentication Database Verification** (if ${HAS_LOGIN_SYSTEM} = true):

- Verify passwords are properly hashed (not stored in plain text)
- Check login attempts and lockout status tracking
- Validate session token storage and management
- Confirm last login timestamp updates

**Availability Database Verification** (if ${HAS_AVAILABILITY_STATUS} = true):

- Verify availability status updates in database
- Check availability timestamp tracking
- Validate last seen timestamp updates
- Confirm availability change audit trail

### 12. DOCUMENTATION REQUIREMENTS

**README Updates**:

- Add module to main project README
- Document API endpoints
- Include sample requests/responses
- Add troubleshooting section

**Code Comments**:

- Function documentation
- Complex logic explanation
- API endpoint descriptions
- Validation rule explanations

---

## IMPLEMENTATION NOTES

1. **Start with validation schema** - This defines the data structure
2. **Implement controller functions** - Handle business logic
3. **Create routes** - Wire everything together
4. **Add to app.js** - Integrate with main application
5. **Create test payloads** - Enable testing
6. **Write test scripts** - Verify functionality
7. **Test manually** - Ensure real-world usage works
8. **Verify database** - Confirm data persistence

## TROUBLESHOOTING COMMON ISSUES

- **400 Bad Request**: Check validation schema and payload format
- **401 Unauthorized**: Verify JWT token and authentication middleware
- **403 Forbidden**: Check authorization middleware and permissions
- **404 Not Found**: Verify route registration in app.js
- **409 Conflict**: Check for duplicate keys or constraint violations
- **422 Unprocessable Entity**: Verify business rule validation
- **429 Too Many Requests**: Check rate limiting configuration
- **500 Internal Server Error**: Check Firestore connection and error handling
- **503 Service Unavailable**: Check external service dependencies

## DEPLOYMENT AND MONITORING

### Production Deployment Checklist

**Performance Optimization**:

- [ ] Database indexes configured for query patterns
- [ ] Redis cache configured and warmed up
- [ ] Connection pooling optimized
- [ ] Response compression enabled
- [ ] CDN configured for file uploads
- [ ] Memory leak detection enabled

**Security Hardening**:

- [ ] Rate limiting configured per endpoint
- [ ] Input validation comprehensive
- [ ] Authentication tokens secured
- [ ] HTTPS enforced
- [ ] CORS policies configured
- [ ] Security headers implemented
- [ ] File upload security scanning enabled

**Monitoring Setup**:

- [ ] Health checks configured
- [ ] Metrics collection enabled
- [ ] Error tracking integrated
- [ ] Performance monitoring active
- [ ] Audit logging configured
- [ ] Alerting rules defined

**Scalability Preparation**:

- [ ] Horizontal scaling tested
- [ ] Load balancer configuration verified
- [ ] Database sharding strategy defined
- [ ] Cache invalidation strategy implemented
- [ ] Circuit breakers configured

### Key Performance Indicators (KPIs)

**Response Time Targets**:

- GET operations: < 100ms (cached), < 500ms (uncached)
- POST operations: < 1000ms
- PUT operations: < 800ms
- DELETE operations: < 300ms
- Bulk operations: < 5000ms
- File uploads: < 30000ms

**Availability Targets**:

- Uptime: 99.9%
- Error rate: < 0.1%
- Cache hit ratio: > 80%
- Database connection success: > 99.5%

**Security Metrics**:

- Failed authentication rate: < 1%
- Rate limit triggers: Monitor and alert
- Security scan results: 0 high/critical vulnerabilities
- Audit log completeness: 100%

### Production Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# Database Configuration
FIRESTORE_PROJECT_ID=your-project-id
FIRESTORE_CREDENTIALS_PATH=/path/to/service-account.json

# Authentication Configuration
JWT_SECRET=your-super-secure-secret
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d
BCRYPT_ROUNDS=12

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Cache Configuration (if ${HAS_CACHING} = true)
REDIS_URL=redis://your-redis-instance
CACHE_TTL_DEFAULT=3600
CACHE_TTL_AUTH=1800

# File Upload Configuration (if ${HAS_FILE_UPLOAD} = true)
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
FILE_STORAGE_PATH=/secure/file/storage
VIRUS_SCAN_ENABLED=true

# External Service Configuration
EXTERNAL_API_BASE_URL=https://api.external-service.com
EXTERNAL_API_TIMEOUT=30000
CIRCUIT_BREAKER_THRESHOLD=5

# Monitoring Configuration
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
ERROR_TRACKING_DSN=your-sentry-dsn
```

---

**Enterprise Module Creation Complete**: This comprehensive template provides all necessary components for creating production-ready, scalable, and maintainable modules that integrate seamlessly with existing enterprise architecture patterns.

**Post-Creation Steps**:

1. Run comprehensive test suite
2. Perform security audit
3. Configure monitoring and alerting
4. Document API endpoints
5. Set up CI/CD pipeline
6. Conduct performance testing
7. Deploy to staging environment
8. Validate with stakeholders
9. Deploy to production with monitoring
