import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isRoleAllowed } from "../utils/roles";
import { getPostLoginPath } from "../utils/roleRedirect";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = user?.role;
  if (allowedRoles?.length && !isRoleAllowed(role, allowedRoles)) {
    return <Navigate to={getPostLoginPath(role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
