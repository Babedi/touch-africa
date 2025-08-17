# 🔐 VALID TENANT CREDENTIALS FOR TESTING

## 🏢 Tenant Information

- **Tenant ID**: `TNNT1755017739510`
- **Tenant Name**: `Sample Area`
- **Location**: Sample Area, Gauteng, South Africa

---

## 👑 Tenant Admin Credentials

### Login Information

- **Email**: `sarah.admin@neighbourguard.co.za`
- **Password**: `TenantAdminPass123!`
- **Tenant Name**: `Sample Response Block`

### Login Endpoint

```
POST /external/tenantAdmin/login
```

### Login Payload

```json
{
  "tenantName": "Sample Response Block",
  "email": "sarah.admin@neighbourguard.co.za",
  "password": "TenantAdminPass123!"
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "ADMIN_TNNT1755017739510",
      "email": "sarah.admin@neighbourguard.co.za",
      "tenantId": "TNNT1755017739510",
      "tenantName": "Sample Area",
      "roles": ["tenantAdmin"],
      "permissions": ["read", "write", "admin"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tenantId": "TNNT1755017739510"
  }
}
```

---

## 👤 Tenant User Credentials

### Login Information

- **Phone Number**: `+27123456789`
- **PIN**: `1234` (4-digit PIN)
- **Tenant Name**: `Sample Response Block`

### Login Endpoint

```
POST /external/tenantUser/login
```

### Login Payload

```json
{
  "tenantName": "Sample Response Block",
  "phoneNumber": "+27123456789",
  "pin": "1234"
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "USER_TNNT1755017739510",
      "phoneNumber": "+27123456789",
      "tenantId": "TNNT1755017739510",
      "tenantName": "Sample Response Block",
      "roles": ["tenantUser"],
      "permissions": ["read", "write"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tenantId": "TNNT1755017739510"
  }
}
```

---

## 📱 Frontend Testing

### Test with Login Modals

You can now test both login modals with these credentials:

1. **Tenant Admin Modal**: Use the tenant admin credentials above
2. **Tenant User Modal**: Use the tenant user credentials above

### Multi-Snackbar Success Sequences

Both login types will now show the enhanced multi-step success notifications:

- **Tenant Admin**: 4-step tenant management sequence
- **Tenant User**: 4-step safety portal sequence

---

## 🧪 Quick Test Commands

### Test Tenant Admin Login

```bash
node test-tenant-credentials.mjs
```

### Manual cURL Test (Tenant Admin)

```bash
curl -X POST http://localhost:5000/external/tenantAdmin/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Sample Area",
    "email": "sarah.admin@neighbourguard.co.za",
    "password": "TenantAdminPass123!"
  }'
```

### Manual cURL Test (Tenant User)

```bash
curl -X POST http://localhost:5000/external/tenantUser/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Sample Response Block",
    "phoneNumber": "+27123456789",
    "pin": "1234"
  }'
```

---

## ✅ Status

- ✅ Tenant Admin credentials: **WORKING**
- ✅ Tenant User credentials: **WORKING**
- ✅ Database records: **CREATED**
- ✅ Login endpoints: **FUNCTIONAL**
- ✅ JWT tokens: **GENERATING**
- ✅ Multi-snackbar sequences: **READY**

## 🎯 Ready for Frontend Testing!

Both credential types are fully functional and ready for testing the enhanced login experience with multi-step success notifications.
