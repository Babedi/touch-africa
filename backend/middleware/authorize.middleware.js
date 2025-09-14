// Legacy RBAC middleware removed. Use permission.middleware.js instead.
export function authorize() {
  return function (_req, res) {
    return res.status(410).json({
      success: false,
      error: "authorize.middleware removed",
      message:
        "Use checkPermissions/checkAllPermissions from permission.middleware.js",
    });
  };
}
