// Simple role-based authorization middleware.
// Usage: authorize("internalSuperAdmin", "admin")
export function authorize(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  return function (req, res, next) {
    const principal = req.admin || req.user || null;
    const roles = Array.isArray(principal?.roles) ? principal.roles : [];
    const has = roles.some((r) => allowed.has(r));
    if (!has) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Insufficient role" });
    }
    next();
  };
}
