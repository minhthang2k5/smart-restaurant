import { Link, useLocation } from "react-router-dom";
import CustomerAuthShell from "../../components/customerAuth/CustomerAuthShell";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function CustomerAuthError() {
  const query = useQuery();
  const message =
    query.get("message") || "Authentication failed. Please try again.";

  return (
    <CustomerAuthShell
      title="Authentication Error"
      subtitle="Please try again"
      footer={
        <div style={{ textAlign: "center" }}>
          <Link
            to="/customer/login"
            style={{ color: "#1e90ff", fontWeight: 700 }}
          >
            Back to login
          </Link>
        </div>
      }
    >
      <div
        style={{
          marginTop: 8,
          border: "1px solid #ffd6d6",
          background: "#fff5f5",
          borderRadius: 14,
          padding: 14,
          color: "#2c3e50",
          lineHeight: 1.4,
        }}
      >
        {message}
      </div>
    </CustomerAuthShell>
  );
}
