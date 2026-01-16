import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Spin } from "antd";
import CustomerAuthShell from "../../components/customerAuth/CustomerAuthShell";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

export default function CustomerGoogleSuccess() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { loginWithToken } = useCustomerAuth();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const extractToken = () => {
          // 1) Standard querystring
          const searchParams = new URLSearchParams(
            window.location.search || ""
          );
          const fromSearch = searchParams.get("token");
          if (fromSearch) return fromSearch;

          // 2) Hash-based routing querystring: /#/auth/google-success?token=...
          const hash = window.location.hash || "";
          const qIndex = hash.indexOf("?");
          if (qIndex !== -1) {
            const hashQuery = hash.slice(qIndex + 1);
            const hashParams = new URLSearchParams(hashQuery);
            const fromHashQuery = hashParams.get("token");
            if (fromHashQuery) return fromHashQuery;
          }

          // 3) Fallback: search full href for token=... anywhere
          const href = window.location.href || "";
          const match = href.match(/(?:\?|#|&)token=([^&#]+)/i);
          return match?.[1] ? decodeURIComponent(match[1]) : null;
        };

        const tokenFromUrl = extractToken();
        const token = tokenFromUrl || localStorage.getItem("customer_token");

        if (!token) throw new Error("Missing token from Google OAuth callback");

        await loginWithToken(token);
        message.success("Signed in with Google");
        navigate("/menu", { replace: true });
      } catch (error) {
        const msg = error?.message || "Google login failed";
        message.error(msg);
        navigate(`/customer/auth/error?message=${encodeURIComponent(msg)}`, {
          replace: true,
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loginWithToken, message, navigate]);

  return (
    <CustomerAuthShell
      title="Signing you in..."
      subtitle="Please wait"
      footer={null}
    >
      <div
        style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}
      >
        {loading ? <Spin /> : null}
      </div>
    </CustomerAuthShell>
  );
}
