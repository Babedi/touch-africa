# external/tenant module

Routes:

- POST /external/tenant
- GET /external/tenant/:id
- GET /external/tenant/list
- PUT /external/tenant/:id
- DELETE /external/tenant/:id

Auth: JWT + role checks at router level. Firestore path: services/neighbourGuardService/tenants/{tenantId}
