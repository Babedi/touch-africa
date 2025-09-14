# TouchAfrica Backend Architecture Documentation

## 📁 High-Level Architecture

The TouchAfrica backend follows a **modular, layered architecture** with clear separation of concerns, designed for scalability, security, and maintainability.

```
backend/
├── config/           # Environment & configuration management
├── middleware/       # Request processing & security layers
├── modules/          # Business logic organized by domain
├── services/         # External service integrations
├── utilities/        # Shared helper functions
├── secrets/          # Sensitive credentials (git-ignored)
├── tools/            # Administrative scripts
├── tests/            # Test suites
└── docs/             # Documentation
```

## 🔧 Core Components

### 1. **Config Layer** (`backend/config/`)

**Purpose**: Environment variable validation and configuration management

- **`validate-env.js`**: Comprehensive environment validation system
  - Validates required environment variables (JWT secrets, Firebase config, etc.)
  - Applies safe defaults for development environment
  - Enforces production security standards
  - Provides detailed error messages for missing/invalid configuration
  - Supports CLI operations (`validate`, `sample`, `check`)

**Key Features**:

- Type validation and conversion
- Production-specific security warnings
- Configuration summary reporting
- File existence validation

### 2. **Middleware Layer** (`backend/middleware/`)

**Purpose**: Security and request processing pipeline

#### Authentication & Authorization

- **`auth.middleware.js`**: JWT authentication with dual token support
  - Cookie-based authentication (primary)
  - Authorization header support (Bearer tokens)
  - Fallback cookie parsing for edge cases
- **`auth-enhanced.middleware.js`**: Advanced authentication features

  - Refresh token management
  - Enhanced token validation
  - Extended session handling

- Removed `authorize.middleware.js` (legacy RBAC). Use `permission.middleware.js` with module.action strings.

  - Hierarchical role validation
  - Dynamic role checking
  - Role inheritance support

- **`permission.middleware.js`**: Fine-grained permission system
  - Action-based permissions (`module.action` format)
  - Permission caching for performance
  - OR-logic permission checking
  - Role permission mapping integration

#### Security & Protection

- **`security.middleware.js`**: Comprehensive security measures
  - Security headers (Helmet.js integration)
  - Rate limiting per IP
  - XSS protection
  - Request size limiting
  - HTTP Parameter Pollution (HPP) protection

### 3. **Modules Layer** (`backend/modules/`)

**Purpose**: Domain-driven business logic organized by access level

#### **Internal Modules** (`modules/internal/`)

_Admin-only functionality with highest security requirements_

- **`admin/`**: Internal administrator management
  - Admin CRUD operations
  - Authentication & session management
  - Admin activation/deactivation
- **`internal.role/`**: Role management system
  - Role CRUD operations
  - Role-permission mapping
  - Dynamic role configuration
  - Role mapping controller with hot-reload capability
- **`internal.permission/`**: Permission management

  - Permission CRUD operations
  - Permission-role associations
  - Permission validation

- **`lookup/`**: Master data lookup management
  - System-wide lookup tables
  - Reference data management
- **`lookup.category/`**: Lookup category management
  - Hierarchical category structures
  - Category-specific configurations
- **`lookup.sub.category/`**: Lookup subcategory management

  - Nested subcategory support
  - Category relationship management

- **`person/`**: Person/user entity management

  - User profile management
  - Personal information handling
  - User lifecycle operations

- **`service.request/`**: Service request handling

  - Request lifecycle management
  - Service request processing
  - Status tracking and updates

- **`cultivar.template/`**: Agricultural cultivar templates
  - Crop variety templates
  - Agricultural data structures
  - Template management for farming operations

#### **External Modules** (`modules/external/`)

_Public/tenant-facing APIs with controlled access_

- **`tenant/`**: Tenant organization management
  - Multi-tenant architecture support
  - Tenant isolation and security
  - Tenant lifecycle management
- **`tenant.admin/`**: Tenant administrator functions
  - Tenant-scoped admin operations
  - Tenant user management
  - Tenant-specific configurations
- **`tenant.user/`**: Tenant user management
  - End-user operations within tenant scope
  - User role management within tenants
  - Tenant-specific user workflows

#### **General Modules** (`modules/general/`)

_Shared functionality across access levels_

- **`service.info/`**: Service information & metadata
  - System information endpoints
  - Service status and health
  - API documentation metadata

### 4. **Services Layer** (`backend/services/`)

**Purpose**: External service integrations and shared service instances

- **`firestore.client.js`**: Firebase/Firestore database connection
  - Firebase Admin SDK initialization
  - Service account authentication
  - Shared database instance (`db`)
  - Connection configuration and error handling

### 5. **Utilities Layer** (`backend/utilities/`)

**Purpose**: Shared helper functions and common operations

- **`auth.util.js`**: Core authentication utilities

  - JWT token generation and verification
  - Token payload management
  - Authentication helper functions

- **`auth-enhanced.util.js`**: Advanced authentication utilities

  - Refresh token operations
  - Enhanced security features
  - Advanced token management

- **`error-handler.util.js`**: Centralized error handling

  - Standardized error responses
  - Error logging and tracking
  - HTTP status code management
  - Safe error exposure (production vs development)

- **`logger.util.js`**: Application logging system

  - Structured logging
  - Log level management
  - Production-ready logging

- **`logger-console.util.js`**: Console logging utilities
  - Development logging
  - Debug output formatting
  - Console-specific utilities

## 🏗️ Module Architecture Pattern

Each module follows a **consistent 5-layer pattern** for maintainability and predictability:

```
module-name/
├── module.route.js      # Express routes & middleware chains
├── module.controller.js # Request/response handling & validation
├── module.service.js    # Business logic & orchestration
├── module.firestore.js  # Database operations
└── module.validation.js # Input validation schemas
```

### Layer Responsibilities

1. **Route Layer** (`*.route.js`)

   - HTTP route definitions
   - Middleware chain application
   - Permission gate enforcement
   - Route-specific security policies

2. **Controller Layer** (`*.controller.js`)

   - Request parsing and validation
   - Response formatting and status codes
   - Error handling and user feedback
   - Business logic orchestration calls

3. **Service Layer** (`*.service.js`)

   - Core business logic implementation
   - Data transformation and processing
   - Multi-operation orchestration
   - Business rule enforcement

4. **Firestore Layer** (`*.firestore.js`)

   - Database CRUD operations
   - Query optimization
   - Data persistence logic
   - Database-specific error handling

5. **Validation Layer** (`*.validation.js`)
   - Input validation schemas (Zod)
   - Data sanitization rules
   - Request/response validation
   - Type safety enforcement

## 🔐 Security Architecture

### Multi-Layer Security Strategy

1. **Environment Validation**: Strict configuration requirements with production warnings
2. **Rate Limiting**: IP-based request throttling with configurable limits
3. **Authentication**: JWT-based with dual support (cookies + headers)
4. **Authorization**: Role-based access control with hierarchical inheritance
5. **Permissions**: Fine-grained action-based permission system
6. **Input Validation**: Comprehensive schema validation and sanitization
7. **Security Headers**: Complete HTTP security header protection

### Role Hierarchy

```
root
  └── internalRootAdmin
      └── internalSuperAdmin
          └── internalAdmin
              └── tenantAdmin
                  └── tenantUser
```

**Role Characteristics**:

- **root**: System-level access, all permissions
- **internalRootAdmin**: Internal system administration
- **internalSuperAdmin**: Advanced internal operations
- **internalAdmin**: Standard internal administration
- **tenantAdmin**: Tenant-scoped administration
- **tenantUser**: End-user operations within tenant

### Permission System

Permissions follow the format: `module.action`

**Examples**:

- `admin.create` - Create admin users
- `role.read` - Read role information
- `tenant.manage` - Manage tenant operations
- `system.configure` - System configuration access

## 🔄 Request Flow

```
HTTP Request
    ↓
Security Middleware (headers, rate limiting, XSS protection)
    ↓
Request Parsing (JSON, form data, cookies)
    ↓
Authentication (JWT validation from cookies/headers)
    ↓
Authorization (role hierarchy check)
    ↓
Permission Validation (action-specific permissions)
    ↓
Route Handler (business logic execution)
    ↓
Controller (request validation, response formatting)
    ↓
Service (business logic orchestration)
    ↓
Firestore (data persistence operations)
    ↓
Response (formatted JSON with proper status codes)
```

## 🚀 Key Features

### Performance Optimizations

- **Permission Caching**: In-memory cache for role permissions (5-minute TTL)
- **Connection Pooling**: Optimized Firestore connection management
- **Request Compression**: Gzip compression for responses
- **Efficient Queries**: Optimized database query patterns

### Development Features

- **Hot-reloadable Configuration**: Role mappings update without restart
- **Comprehensive Logging**: Request tracking and error monitoring
- **Development Dashboard**: Admin interface for development
- **Environment Validation CLI**: Built-in configuration validation

### Production Readiness

- **Security Hardening**: Complete security middleware stack
- **Error Handling**: Comprehensive error management and reporting
- **Health Monitoring**: Built-in health check endpoints
- **Graceful Shutdown**: Proper connection cleanup and shutdown handling

## 🔧 Administrative Tools

### Built-in Tools

- **Role Mapping Management**: `tools/manage-role-mappings.js`

  - View current role mappings
  - Update role configurations
  - Reload mappings without restart

- **Environment Validation CLI**: `backend/config/validate-env.js`
  ```bash
  node validate-env.js validate    # Validate current environment
  node validate-env.js sample      # Generate sample .env file
  node validate-env.js check [mode] # Check readiness for development/production
  ```

### Runtime Management

- **Permission Cache Management**: Runtime cache clearing capabilities
- **Configuration Hot-reload**: Dynamic configuration updates
- **Health Monitoring**: Real-time system health endpoints

## 📊 API Endpoints

### Public Endpoints

- `GET /internal/health` - System health check
- `POST /internal/admin/login` - Admin authentication

### Protected Internal Endpoints

- `/internal/admin/*` - Admin management
- `/internal/role/*` - Role management
- `/internal/permission/*` - Permission management
- `/internal/lookup/*` - Lookup data management

### External Tenant Endpoints

- `/external/tenant/*` - Tenant operations
- `/external/tenant.admin/*` - Tenant admin functions
- `/external/tenant.user/*` - Tenant user operations

### General Endpoints

- `/general/service.info/*` - Service information

## 🛠️ Development Setup

### Prerequisites

- Node.js (ES modules support)
- Firebase/Firestore project
- Environment configuration (`.env`)
- Service account key (`secrets/serviceAccountKey.json`)

### Environment Variables

Required configuration in `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
TRUST_PROXY=false

# JWT Configuration
JWT_SECRET=your-secret-key-minimum-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\n-----END PRIVATE KEY-----\n"

# Security Configuration
CORS_ORIGIN=*
LOG_LEVEL=debug
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Quick Start

```bash
# Install dependencies
npm install

# Validate environment
node backend/config/validate-env.js validate

# Start development server
npm start
```

## 🏆 Best Practices

### Code Organization

- Follow the 5-layer module pattern consistently
- Keep business logic in service layers
- Use proper error handling at all levels
- Implement comprehensive input validation

### Security

- Always authenticate and authorize requests
- Use permission-based access control
- Validate and sanitize all inputs
- Log security-relevant events

### Performance

- Implement caching where appropriate
- Optimize database queries
- Use connection pooling
- Monitor and profile performance

### Maintenance

- Keep documentation updated
- Use consistent coding patterns
- Implement comprehensive testing
- Monitor error rates and performance metrics

## 📈 Scalability Considerations

### Horizontal Scaling

- Stateless design for easy horizontal scaling
- Session storage in external systems (cookies/tokens)
- Database connection optimization
- Load balancer compatibility

### Performance Scaling

- Caching strategies for frequently accessed data
- Database query optimization
- Efficient memory usage patterns
- Resource monitoring and alerting

### Security Scaling

- Rate limiting per endpoint and user
- Distributed session management
- Audit logging and monitoring
- Automated security scanning

---

This architecture provides a **scalable, secure, and maintainable** foundation for the TouchAfrica platform with clear separation between internal admin functions and external tenant-facing APIs, designed to support growth and evolution of the platform over time.

## Response format

// Successful response
{
"data": {
"id": 1,
"name": "John Doe",
"email": "john@example.com"
},
"message": "User retrieved successfully",
"status": "success"
}

// Error response
{
"error": {
"code": "USER_NOT_FOUND",
"message": "User not found",
"details": "No user exists with ID 999"
},
"status": "error"
}

// List response
{
"data": [
{ /* user 1 */ },
{ /* user 2 */ }
],
"pagination": {
"page": 1,
"limit": 20,
"total": 100,
"pages": 5
}
}

## Best Practices for Endpoint Design

Use plural nouns: /users not /user

Use hyphens for multi-word: /product-categories not /productCategories

Use lowercase: /users not /Users

Avoid verbs in endpoints: Use HTTP methods instead

Version your API: /api/v1/users or use headers

Be consistent: Stick to one naming convention
