import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Alert } from "antd";
import AuthShell from "../../components/auth/AuthShell";

export default function AuthError() {
  const location = useLocation();

  const message = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("message") || "Authentication failed";
  }, [location.search]);

  return (
    <AuthShell
      title="Authentication Error"
      subtitle="Please try again"
      footer={
        <Link to="/login" className="text-pink-500 font-semibold">
          Back to login
        </Link>
      }
    >
      <Alert type="error" message={message} showIcon />
    </AuthShell>
  );
}
