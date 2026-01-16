import { useState } from "react";
import { App, Button, Divider, Form, Input } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CustomerAuthShell from "../../components/customerAuth/CustomerAuthShell";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

export default function CustomerLogin() {
  const { message } = App.useApp();
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);

  const onFinish = async ({ email, password }) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await login(email.trim(), password);
      message.success(response?.message || "Logged in successfully");

      const from = location.state?.from?.pathname;
      navigate(from || "/menu", { replace: true });
    } catch (error) {
      if (error?.response?.data?.errors) {
        error.response.data.errors.forEach((err) => {
          message.error(`${err.field || err.path}: ${err.message || err.msg}`);
        });
      } else {
        const msg =
          error?.response?.data?.message || error?.message || "Login failed";
        message.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    window.location.href = `${base}/auth/google`;
  };

  return (
    <CustomerAuthShell
      title="Welcome Back"
      subtitle="Sign in to continue"
      footer={
        <div style={{ textAlign: "center", color: "#7f8c8d" }}>
          Don&apos;t have an account?{" "}
          <Link
            to="/customer/register"
            style={{ color: "#e74c3c", fontWeight: 700 }}
          >
            Sign Up
          </Link>
          <div style={{ marginTop: 10 }}>
            <Link to="/menu" style={{ color: "#7f8c8d", fontSize: 13 }}>
              Continue as Guest →
            </Link>
          </div>
        </div>
      }
    >
      <Form layout="vertical" onFinish={onFinish} disabled={loading}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email" },
          ]}
        >
          <Input
            placeholder="you@example.com"
            size="large"
            style={{ borderRadius: 12 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password
            placeholder="Enter your password"
            size="large"
            style={{ borderRadius: 12 }}
          />
        </Form.Item>

        <div style={{ textAlign: "right", marginBottom: 10 }}>
          <Link
            to="/forgot-password"
            style={{ color: "#e74c3c", fontSize: 13 }}
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          htmlType="submit"
          size="large"
          loading={loading}
          disabled={loading}
          style={{
            width: "100%",
            background: "#e74c3c",
            borderColor: "#e74c3c",
            color: "white",
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          Sign In
        </Button>

        <Divider style={{ margin: "18px 0" }}>or continue with</Divider>

        <Button
          size="large"
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            borderRadius: 12,
            borderWidth: 2,
          }}
        >
          Continue with Google
        </Button>
      </Form>
    </CustomerAuthShell>
  );
}
