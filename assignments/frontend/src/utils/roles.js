export function normalizeRole(role) {
  if (!role) return "";
  return String(role)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function isRoleAllowed(role, allowedRoles) {
  if (!allowedRoles?.length) return true;
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return allowedRoles.map(normalizeRole).includes(normalized);
}
