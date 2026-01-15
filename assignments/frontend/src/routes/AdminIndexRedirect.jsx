import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { normalizeRole } from "../utils/roles";

export default function AdminIndexRedirect() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  if (role === "kitchen_staff") {
    return <Navigate to="/admin/kds" replace />;
  }

  if (role === "waiter") {
    return <Navigate to="/admin/tables" replace />;
  }

  return <Navigate to="/admin/tables" replace />;
}
