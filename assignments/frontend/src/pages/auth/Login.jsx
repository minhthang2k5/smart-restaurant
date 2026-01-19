import { useState } from "react";
import { Form, Input, Button, App } from "antd";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import AuthShell from "../../components/auth/AuthShell";
import { getPostLoginPath } from "../../utils/roleRedirect";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);

  const onFinish = async ({ email, password }) => {
    if (loading) return;
    setLoading(true);

    try {
      const cleanEmail = email.trim();

      const response = await login(cleanEmail, password);

      if (!response?.user) {
        throw new Error(response?.message || "Invalid login response");
      }

      message.success(response?.message || "Đăng nhập thành công");

      const role = response?.user?.role;
      const target = getPostLoginPath(role);

      const from = location.state?.from?.pathname;
      navigate(from || target, { replace: true });
    } catch (error) {
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        errors.forEach((err) => {
          message.error(`${err.field}: ${err.message}`);
        });
      } else {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Đăng nhập thất bại";
        message.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Chào mừng quay lại 💗"
      icon={<LogIn className="text-white" size={22} />}
      footer={
        <>

          <div className="mt-2">
            Quên mật khẩu?{" "}
            <Link to="/forgot-password" className="text-rose-500 font-semibold">
              Khôi phục
            </Link>
          </div>
        </>
      }
    >
      <Form layout="vertical" onFinish={onFinish} disabled={loading}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input
            size="large"
            placeholder="you@example.com"
            className="rounded-2xl"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
        >
          <Input.Password
            size="large"
            placeholder="••••••••"
            className="rounded-2xl"
          />
        </Form.Item>

        <Button
          htmlType="submit"
          size="large"
          className="cta-button w-full"
          loading={loading}
          disabled={loading}
        >
          Đăng nhập
        </Button>
      </Form>
    </AuthShell>
  );
}
