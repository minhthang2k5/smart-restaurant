import { normalizeRole } from "./roles";

export function getPostLoginPath(role) {
  const r = normalizeRole(role);
  if (r === "kitchen_staff") return "/admin/kds";
  if (r === "waiter") return "/admin/tables";
  if (r === "admin") return "/admin/tables";
  return "/menu";
}
