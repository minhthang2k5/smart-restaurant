import { useState } from "react";
import { Form, Input, Button, App } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import AuthShell from "../../components/auth/AuthShell";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async ({ firstName, lastName, email, password }) => {
    if (loading) return;
    setLoading(true);

    try {
      const cleanData = {
        firstName: (firstName ?? "").trim(),
        lastName: (lastName ?? "").trim(),
        email: (email ?? "").trim(),
        password: password,
      };

      const response = await register(
        cleanData.email,
        cleanData.password,
        cleanData.firstName,
        cleanData.lastName
      );

      message.success(
        response?.message || "Đăng ký thành công! Vui lòng kiểm tra email."
      );
      navigate("/login", { replace: true });
    } catch (error) {
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        errors.forEach((err) => {
          message.error(`${err.field}: ${err.message}`);
        });
      } else {
        const msg =
          error?.response?.data?.message || error?.message || "Đăng ký thất bại";
        message.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Điền nhanh 30s là xong :3"
      icon={<UserPlus className="text-white" size={22} />}
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-pink-500 font-semibold hover:text-pink-600 transition-colors"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <Form layout="vertical" onFinish={onFinish} disabled={loading}>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="firstName"
            label="Họ"
            rules={[
              { required: true, whitespace: true, message: "Vui lòng nhập họ" },
            ]}
          >
            <Input size="large" className="rounded-2xl" placeholder="Nguyễn" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Tên"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên",
              },
            ]}
          >
            <Input size="large" className="rounded-2xl" placeholder="Văn A" />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Vui lòng nhập email",
            },
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
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu" },
            { min: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: "Mật khẩu phải có chữ hoa, chữ thường và số",
            },
          ]}
          hasFeedback
        >
          <Input.Password
            size="large"
            className="rounded-2xl"
            placeholder="••••••••"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Nhập lại mật khẩu"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Vui lòng nhập lại mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu nhập lại không khớp")
                );
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            className="rounded-2xl"
            placeholder="••••••••"
          />
        </Form.Item>

        <Button
          htmlType="submit"
          size="large"
          className="cta-button w-full"
          loading={loading}
          disabled={loading}
        >
          Đăng ký
        </Button>
      </Form>
    </AuthShell>
  );
}
