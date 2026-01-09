import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import AuthShell from "../components/auth/AuthShell";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  // 1. Khởi tạo form instance để điều khiển reset
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async ({ email }) => {
    if (loading) return;
    setLoading(true);

    try {
      const cleanEmail = (email ?? "").trim();
      const response = await forgotPassword(cleanEmail);

      message.success(
        response?.message ||
          "Đã gửi email khôi phục. Vui lòng kiểm tra hộp thư."
      );

      // 2. Clear form để báo hiệu đã hoàn tất, tránh user bấm gửi lại
      form.resetFields();
    } catch (error) {
      const msg =
        error?.response?.data?.message || error?.message || "Yêu cầu thất bại";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận link reset"
      icon={<Mail className="text-white" size={22} />}
      footer={
        <Link
          to="/login"
          className="text-pink-500 font-semibold hover:text-pink-600 transition-colors"
        >
          Quay lại đăng nhập
        </Link>
      }
    >
      {/* 3. Gắn form instance vào Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={loading}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            // 4. Thêm whitespace: true cho đồng bộ với Register
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

        <Button
          htmlType="submit"
          size="large"
          className="cta-button w-full"
          loading={loading}
          disabled={loading}
        >
          Gửi email khôi phục
        </Button>
      </Form>
    </AuthShell>
  );
}
