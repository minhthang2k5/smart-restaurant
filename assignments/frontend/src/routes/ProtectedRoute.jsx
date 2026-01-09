import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return null; 
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = user?.role;
  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/menu" replace />;
  }

  return children;
};

export default ProtectedRoute;
