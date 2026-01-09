import { useEffect, useMemo, useState, useRef } from "react";
import { Result, Spin, App } from "antd";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import AuthShell from "../../components/auth/AuthShell";

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  // Ref để chặn việc gọi API 2 lần trong Strict Mode
  const isCalledRef = useRef(false);

  const [status, setStatus] = useState("loading"); // loading | success | error

  // Lấy token và trim cẩn thận
  const token = useMemo(
    () => (searchParams.get("token") ?? "").trim(),
    [searchParams]
  );

  // ✅ Cải tiến 1: Nếu token đổi (hiếm nhưng có thể), cho phép gọi lại API
  useEffect(() => {
    isCalledRef.current = false;
  }, [token]);

  useEffect(() => {
    let timeoutId;
    let active = true; 
    // 1. Nếu không có token -> Báo lỗi ngay
    if (!token) {
      setStatus("error");
      return;
    }

    // 2. Chặn double request (Strict Mode)
    if (isCalledRef.current) return;
    isCalledRef.current = true;

    const run = async () => {
      try {
        const response = await verifyEmail(token);

        if (!active) return;

        setStatus("success");
        message.success(response?.message || "Xác thực email thành công!");

        const role = response?.user?.role;
        const target = role === "admin" ? "/admin/tables" : "/menu";

        timeoutId = setTimeout(() => {
          if (!active) return;
          navigate(target, { replace: true });
        }, 1500);
      } catch (err) {
        if (!active) return;

        if (err?.response?.data?.errors) {
          const errors = err.response.data.errors;
          errors.forEach((error) => {
            message.error(`${error.field}: ${error.message}`);
          });
        } else {
          const msg =
            err?.response?.data?.message || err?.message || "Xác thực thất bại";
          message.error(msg);
        }
        setStatus("error");
      }
    };

    run();

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token, verifyEmail, navigate]);

  return (
    <AuthShell
      title="Xác thực email"
      subtitle={status === "loading" ? "Đang kiểm tra thông tin..." : " "}
      icon={<BadgeCheck className="text-white" size={22} />}
      footer={
        status === "error" ? (
          <div className="flex flex-col gap-2 mt-4">
            <Link
              to="/login"
              className="text-pink-500 font-semibold hover:text-pink-600 transition-colors"
            >
              Quay lại đăng nhập
            </Link>
            {/* Tùy chọn: Có thể dẫn về trang gửi lại verify email nếu có */}
          </div>
        ) : null
      }
    >
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <Spin size="large" />
          <p className="text-slate-400 text-sm">
            Vui lòng không tắt trình duyệt...
          </p>
        </div>
      )}

      {status === "success" && (
        <Result
          status="success"
          title="Xác thực thành công!"
          subTitle="Tài khoản của bạn đã được kích hoạt. Đang chuyển hướng..."
          className="py-4"
        />
      )}

      {status === "error" && (
        <Result
          status="error"
          title="Xác thực thất bại"
          subTitle="Đường dẫn không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại email."
          className="py-4"
        />
      )}
    </AuthShell>
  );
}
