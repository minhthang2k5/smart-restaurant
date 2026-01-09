import { useMemo, useState } from "react";
import { Form, Input, Button, Result, message } from "antd";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { KeyRound } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import AuthShell from "../components/auth/AuthShell";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const token = useMemo(
    () => (searchParams.get("token") ?? "").trim(),
    [searchParams]
  );

  const onFinish = async ({ password }) => {
    // Double check token dù UI đã chặn
    if (!token) {
      message.error("Đường dẫn không hợp lệ hoặc thiếu token.");
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      // AuthContext: gửi token và mật khẩu mới (giữ nguyên khoảng trắng của password)
      const response = await resetPassword(token, password);

      message.success(response?.message || "Cập nhật mật khẩu thành công!");

      // Chuyển hướng về login, replace=true để user không back lại được trang reset này
      navigate("/login", { replace: true });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Đặt lại mật khẩu thất bại. Token có thể đã hết hạn.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        title="Lỗi đường dẫn"
        subtitle="Không tìm thấy mã xác thực"
        icon={<KeyRound className="text-white" size={22} />}
        footer={
          <Link
            to="/forgot-password"
            className="text-pink-500 font-semibold hover:text-pink-600 transition-colors"
          >
            Gửi lại email khôi phục
          </Link>
        }
      >
        <Result
          status="error"
          title="Link không hợp lệ"
          subTitle="Đường dẫn này bị thiếu token xác thực. Vui lòng kiểm tra lại email hoặc yêu cầu gửi lại link mới."
          className="py-0" // Antd Result mặc định padding hơi to, chỉnh lại cho gọn trong thẻ card
        />
      </AuthShell>
    );
  }

  // Màn hình nhập mật khẩu mới
  return (
    <AuthShell
      title="Reset mật khẩu"
      subtitle="Tạo mật khẩu mới cho tài khoản"
      icon={<KeyRound className="text-white" size={22} />}
      footer={
        <Link
          to="/login"
          className="text-pink-500 font-semibold hover:text-pink-600 transition-colors"
        >
          Quay lại đăng nhập
        </Link>
      }
    >
      <Form layout="vertical" onFinish={onFinish} disabled={loading}>
        <Form.Item
          name="password"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới" },
            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
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
          Cập nhật mật khẩu
        </Button>
      </Form>
    </AuthShell>
  );
}
