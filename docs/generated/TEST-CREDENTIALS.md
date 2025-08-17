# Valid Test Credentials for NeighbourGuard™

## Portal Access

- **URL**: http://localhost:5000
- **Icon Buttons**: Click the respective icons to open login modals

## 🏢 Tenant Admin Login

- **Portal**: Click 🏢 icon
- **Tenant**: Sample Response Block
- **Email**: sarah.admin@neighbourguard.co.za
- **Password**: TenantAdminPass123!
- **Status**: ✅ Verified Working

## 👤 Tenant User Login

- **Portal**: Click 👤 icon
- **Tenant**: Sample Response Block
- **Username**: john.smith
- **Password**: password123
- **Status**: ✅ Verified Working

## ⚙️ Internal Admin Login (existing)

- **Portal**: Click ⚙️ icon
- **Email**: test.corrected@neighbourguard.co.za
- **Password**: TestCorrected123!
- **Status**: ✅ Verified Working

## Database IDs (for reference)

- **Tenant ID**: TNNT1755017739510
- **Tenant Admin ID**: IADMIN1755148623543
- **Tenant User ID**: USER1755148639714

## Login Flow Testing

1. Open http://localhost:5000
2. Click the appropriate icon button (⚙️, 🏢, or 👤)
3. Enter the credentials above
4. Verify multi-snackbar success sequences
5. Confirm proper redirection and token storage

## Notes

- All credentials created on: August 14, 2025
- Authentication system supports JWT tokens
- Multi-language tenant support available
- Icon button click events fixed for proper modal handling
- Client-side cookie management implemented for dashboard access
