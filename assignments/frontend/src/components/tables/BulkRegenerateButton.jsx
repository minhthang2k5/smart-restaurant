import { useState } from "react";
import { createPortal } from "react-dom";
import {
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import tableService from "../../services/tableService";

const BulkRegenerateButton = ({ tableCount, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegenerateAll = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await tableService.regenerateAllQR(true);

      if (response.data && response.data.status === "success") {
        setResult({
          type: "success",
          summary: response.data.data.summary,
          details: response.data.data.affectedTables,
        });

        // Show success overlay
        setShowSuccess(true);

        // Auto close after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setIsOpen(false);
          setResult(null);
          if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error("Error regenerating QR codes:", error);
      setResult({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Không thể tạo lại mã QR",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setShowSuccess(false);
  };

  const RegenerateModal = () => {
    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 animate-in fade-in duration-200">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={!loading ? handleClose : undefined}
        />

        {/* Modal Content */}
        <div className="relative bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl w-full max-w-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
          {/* Success Overlay */}
          {showSuccess && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[3rem] flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6 shadow-2xl shadow-green-500/30 animate-in zoom-in duration-500">
                <CheckCircle size={64} className="text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mt-6">
                Tạo lại thành công!
              </h3>
              <p className="text-slate-500 mt-2 font-medium">
                Đã cập nhật {result?.summary.successful}/{result?.summary.totalTables} bàn
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Đang đóng cửa sổ...
              </p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xl rounded-t-[3rem] z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-br from-orange-100 to-red-100 rounded-2xl">
                <RefreshCw
                  size={28}
                  className="text-orange-600"
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                  Tạo lại tất cả mã QR
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Thao tác này sẽ ảnh hưởng đến {tableCount} bàn đang hoạt động
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-3 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {!result && !loading && (
              <div className="space-y-6">
                {/* Warning Box */}
                <div className="bg-linear-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-3xl p-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle
                      size={24}
                      className="text-orange-600 shrink-0 mt-1"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg mb-2">
                        ⚠️ Cảnh báo quan trọng
                      </h4>
                      <ul className="space-y-2 text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold">•</span>
                          <span className="text-sm leading-relaxed">
                            <strong>Tất cả mã QR cũ sẽ bị vô hiệu hóa</strong>{" "}
                            ngay lập tức
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold">•</span>
                          <span className="text-sm leading-relaxed">
                            Khách hàng đang sử dụng mã cũ{" "}
                            <strong>sẽ không thể đặt món</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold">•</span>
                          <span className="text-sm leading-relaxed">
                            Bạn cần{" "}
                            <strong>
                              in và thay thế tất cả {tableCount} mã QR
                            </strong>{" "}
                            trên bàn
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 font-bold">•</span>
                          <span className="text-sm leading-relaxed">
                            Thao tác này <strong>không thể hoàn tác</strong>
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Use Cases */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    💡 Khi nào nên dùng tính năng này?
                  </h5>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>✓ Nghi ngờ mã QR bị lộ hoặc sao chép trái phép</li>
                    <li>
                      ✓ Định kỳ thay đổi mã bảo mật (khuyến nghị 3-6 tháng/lần)
                    </li>
                    <li>✓ Sau sự cố bảo mật hoặc vi phạm dữ liệu</li>
                    <li>✓ Cập nhật hệ thống menu hoặc cấu trúc URL mới</li>
                  </ul>
                </div>

                {/* Confirmation */}
                <div className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-300">
                  <p className="text-center text-slate-600 font-medium">
                    Bạn có chắc chắn muốn tiếp tục?
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <RefreshCw
                  className="animate-spin text-orange-500 mx-auto mb-4"
                  size={48}
                />
                <h4 className="text-xl font-bold text-slate-800 mb-2">
                  Đang tạo lại mã QR...
                </h4>
                <p className="text-slate-500">
                  Vui lòng chờ, quá trình này có thể mất vài giây
                </p>
              </div>
            )}

            {result && result.type === "success" && (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="text-center py-6">
                  <div className="bg-linear-to-br from-green-400 to-emerald-500 rounded-full p-6 w-fit mx-auto shadow-2xl shadow-green-500/30 animate-in zoom-in duration-500">
                    <CheckCircle
                      size={48}
                      className="text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800 mt-6">
                    Tạo lại thành công!
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Đã cập nhật {result.summary.successful}/
                    {result.summary.totalTables} bàn
                  </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">
                      {result.summary.totalTables}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      Tổng số bàn
                    </div>
                  </div>
                  <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                    <div className="text-3xl font-bold text-green-600">
                      {result.summary.successful}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      Thành công
                    </div>
                  </div>
                  <div className="bg-linear-to-br from-red-50 to-rose-50 rounded-2xl p-4 border border-red-200">
                    <div className="text-3xl font-bold text-red-600">
                      {result.summary.failed}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      Thất bại
                    </div>
                  </div>
                </div>

                {/* Details */}
                {result.details && result.details.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 max-h-60 overflow-y-auto">
                    <h5 className="font-bold text-slate-700 mb-3 text-sm">
                      Chi tiết từng bàn:
                    </h5>
                    <div className="space-y-2">
                      {result.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl ${
                            detail.status === "success"
                              ? "bg-green-50 border border-green-200"
                              : "bg-red-50 border border-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {detail.status === "success" ? (
                              <CheckCircle
                                size={16}
                                className="text-green-600"
                              />
                            ) : (
                              <XCircle size={16} className="text-red-600" />
                            )}
                            <span className="font-semibold text-slate-700 text-sm">
                              Bàn {detail.tableNumber}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              detail.status === "success"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {detail.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                  <h5 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    📋 Bước tiếp theo
                  </h5>
                  <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                    <li>Tải xuống tất cả mã QR mới (nút "Xuất dữ liệu QR")</li>
                    <li>In mã QR với chất lượng cao</li>
                    <li>Thay thế mã QR cũ tại tất cả các bàn</li>
                    <li>Kiểm tra hoạt động bằng cách quét thử</li>
                  </ol>
                </div>
              </div>
            )}

            {result && result.type === "error" && (
              <div className="text-center py-12">
                <div className="bg-linear-to-br from-red-400 to-rose-500 rounded-full p-6 w-fit mx-auto shadow-2xl shadow-red-500/30">
                  <XCircle size={48} className="text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-2xl font-bold text-slate-800 mt-6">
                  Có lỗi xảy ra!
                </h4>
                <p className="text-slate-600 mt-2">{result.message}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-4 p-8 pt-6 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-xl rounded-b-[3rem]">
            {!result && (
              <>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-4 px-6 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleRegenerateAll}
                  disabled={loading || tableCount === 0}
                  className="flex-1 py-4 px-6 bg-linear-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={20} />
                      Xác nhận tạo lại
                    </>
                  )}
                </button>
              </>
            )}
            {result && (
              <button
                onClick={handleClose}
                className="flex-1 py-4 px-6 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={tableCount === 0}
        className="flex items-center gap-3 bg-linear-to-r from-orange-50 to-red-50 border-2 border-orange-200 px-6 py-3.5 rounded-2xl text-orange-700 font-bold hover:from-orange-100 hover:to-red-100 hover:border-orange-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed leading-tight"
        title="Tạo lại tất cả mã QR"
      >
        <RefreshCw size={18} />
        <span>Tạo lại toàn bộ QR</span>
      </button>

      <RegenerateModal />
    </>
  );
};

export default BulkRegenerateButton;
