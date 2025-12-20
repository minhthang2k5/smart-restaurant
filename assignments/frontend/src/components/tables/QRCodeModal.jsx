import { useState, useEffect } from "react";
import {
  X,
  Download,
  RefreshCw,
  Wifi,
  FileText,
  ImageIcon,
  ShieldAlert,
} from "lucide-react";
import QRCode from "react-qr-code";
import tableService from "../../services/tableService";
import { downloadFile } from "../../utils/download";

const QRCodeModal = ({ open, onCancel, table, onRegenerate }) => {
  const [loading, setLoading] = useState(false);
  const [includeWifi, setIncludeWifi] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState(null);

  // ✅ FIX: Chỉ hiển thị token có sẵn, KHÔNG tự động generate
  useEffect(() => {
    if (open && table) {
      // Reset state khi mở modal
      setError(null);
      
      // Nếu table đã có token, hiển thị nó
      if (table.qrToken) {
        setQrData({ token: table.qrToken });
      } else {
        // Nếu chưa có token, để trống (hiển thị nút "Tạo QR")
        setQrData(null);
      }
    }

    // Cleanup khi đóng modal
    return () => {
      setQrData(null);
      setLoading(false);
      setError(null);
    };
  }, [open, table?.id, table?.qrToken]); // Dependencies đầy đủ

  // ✅ FIX 2: Thêm error handling và gọi onRegenerate
  const handleGenerate = async () => {
    if (!table || !table.id) {
      setError("Thông tin bàn không hợp lệ");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await tableService.generateQRCode(table.id);

      if (response && response.data) {
        setQrData(response.data);

        // ✅ Gọi callback để refresh danh sách tables
        if (onRegenerate) {
          await onRegenerate();
        }
      } else {
        throw new Error("Không nhận được dữ liệu QR từ server");
      }
    } catch (error) {
      console.error("Error generating QR:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Không thể tạo mã QR. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX 3: Xử lý regenerate với confirmation
  const handleRegenerate = async () => {
    const confirmRegenerate = window.confirm(
      "Bạn có chắc muốn tạo mã QR mới?\n\n" +
        "⚠️ Mã QR cũ sẽ không còn hoạt động.\n" +
        "Khách hàng đang sử dụng mã cũ sẽ phải quét lại mã mới."
    );

    if (!confirmRegenerate) return;

    await handleGenerate();
  };

  const getQRUrl = () => {
    if (!table) return "";
    // ✅ Dùng token hiện tại để đảm bảo QR update khi regenerate
    const token = qrData?.token || table?.qrToken;
    if (!token) return "";
    const frontendUrl =
      import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    // ✅ Thêm timestamp để force re-render QR code khi token đổi
    return `${frontendUrl}/menu?table=${table.id}&token=${token}`;
  };

  const handleDownload = async (format) => {
    if (!table || !table.id) {
      setError("Không thể tải xuống: Thông tin bàn không hợp lệ");
      return;
    }

    // ✅ Kiểm tra có QR token chưa
    const token = qrData?.token || table?.qrToken;
    if (!token) {
      setError("Vui lòng tạo mã QR trước khi tải xuống");
      return;
    }

    try {
      setLoading(true);
      const blob = await tableService.downloadQRCode(
        table.id,
        format,
        includeWifi
      );
      const ext = format === "png" ? "png" : "pdf";
      downloadFile(blob, `table-${table.tableNumber}-qr.${ext}`);
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
      setError(`Không thể tải xuống file ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !table) return null;

  // ✅ Ưu tiên qrData mới từ API, fallback sang table.qrToken cũ
  const currentToken = qrData?.token || table?.qrToken;
  const hasQRCode = !!currentToken;

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="glass-modal w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-8 pb-4">
          <h3 className="text-2xl font-bold text-slate-800 leading-relaxed drop-shadow-sm">
            Mã QR Bàn {table.tableNumber}
          </h3>
          <button
            onClick={onCancel}
            className="p-3 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8">
          {/* ✅ Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <ShieldAlert
                size={20}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* QR Container */}
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-inner border border-slate-100 relative group">
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-[2.5rem] z-10">
                  <RefreshCw className="animate-spin text-rose-500" size={32} />
                </div>
              )}

              {hasQRCode ? (
                <QRCode 
                  key={currentToken} 
                  value={getQRUrl()} 
                  size={200} 
                  level="H" 
                />
              ) : (
                <div className="w-50 h-50 flex items-center justify-center bg-slate-50 rounded-xl">
                  <p className="text-slate-400 text-sm text-center px-4">
                    Chưa có mã QR
                  </p>
                </div>
              )}
            </div>

            <p className="mt-6 text-xs text-slate-400 font-medium uppercase tracking-widest">
              Quét để gọi món
            </p>

            {/* ✅ Nút Generate/Regenerate */}
            {hasQRCode ? (
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="mt-4 flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Làm mới mã QR
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Đang tạo...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Tạo mã QR
                  </>
                )}
              </button>
            )}
          </div>

          {/* Options - Chỉ hiển thị khi đã có QR */}
          {hasQRCode && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-rose-500 shadow-sm">
                    <Wifi size={18} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    Hiển thị thông tin WiFi
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeWifi}
                  onChange={(e) => setIncludeWifi(e.target.checked)}
                  className="w-5 h-5 accent-rose-500 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDownload("png")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-4 border-2 border-slate-800 text-slate-800 rounded-2xl hover:bg-slate-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImageIcon size={18} /> PNG
                </button>
                <button
                  onClick={() => handleDownload("pdf")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-4 border-2 border-slate-800 text-slate-800 rounded-2xl hover:bg-slate-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText size={18} /> PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
