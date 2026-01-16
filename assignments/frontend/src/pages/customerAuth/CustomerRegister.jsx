import { useState } from "react";
import { App, Button, Divider, Form, Input } from "antd";
import { GoogleOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import CustomerAuthShell from "../../components/customerAuth/CustomerAuthShell";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

export default function CustomerRegister() {
  const { message } = App.useApp();
  const { register } = useCustomerAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const onFinish = async ({ firstName, lastName, email, password }) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await register(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim()
      );

      message.success(
        response?.message ||
          "Registration successful. Please verify your email."
      );
      navigate("/customer/login", { replace: true });
    } catch (error) {
      if (error?.response?.data?.errors) {
        error.response.data.errors.forEach((err) => {
          message.error(`${err.field || err.path}: ${err.message || err.msg}`);
        });
      } else {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Registration failed";
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
      title="Create Account"
      subtitle="Join and start ordering"
      footer={
        <div style={{ textAlign: "center", color: "#7f8c8d" }}>
          Already have an account?{" "}
          <Link
            to="/customer/login"
            style={{ color: "#e74c3c", fontWeight: 700 }}
          >
            Sign In
          </Link>
        </div>
      }
    >
      <Form layout="vertical" onFinish={onFinish} disabled={loading}>
        <Form.Item
          name="firstName"
          label="First name"
          rules={[
            { required: true, message: "Please enter your first name" },
            { min: 2, max: 50 },
          ]}
        >
          <Input size="large" style={{ borderRadius: 12 }} />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last name"
          rules={[
            { required: true, message: "Please enter your last name" },
            { min: 2, max: 50 },
          ]}
        >
          <Input size="large" style={{ borderRadius: 12 }} />
        </Form.Item>

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
          rules={[
            { required: true, message: "Please enter a password" },
            { min: 8, message: "Password must be at least 8 characters" },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
              message: "Must include uppercase, lowercase and a number",
            },
          ]}
        >
          <Input.Password size="large" style={{ borderRadius: 12 }} />
        </Form.Item>

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
          Sign Up
        </Button>

        <Divider style={{ margin: "18px 0" }}>or continue with</Divider>

        <Button
          size="large"
          icon={<GoogleOutlined />}
          onClick={handleGoogleLogin}
          style={{ width: "100%", borderRadius: 12, borderWidth: 2 }}
        >
          Continue with Google
        </Button>
      </Form>
    </CustomerAuthShell>
  );
}
