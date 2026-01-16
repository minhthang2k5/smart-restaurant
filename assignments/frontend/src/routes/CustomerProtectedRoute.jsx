import { Navigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../contexts/CustomerAuthContext";

export default function CustomerProtectedRoute({ children }) {
  const { customer, initializing } = useCustomerAuth();
  const location = useLocation();

  if (initializing) return null;
  if (!customer) {
    return <Navigate to="/customer/login" replace state={{ from: location }} />;
  }

  return children;
}
