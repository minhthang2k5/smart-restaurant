import { useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileArchive, FileText, ChevronDown, X } from "lucide-react";
import tableService from "../../services/tableService";
import { downloadFile } from "../../utils/download";

const DownloadButtons = ({ tableCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownload = async (format) => {
    if (tableCount === 0) return;
    setLoading(true);
    setIsOpen(false);
    try {
      const blob = await tableService.downloadAllQRCodes(format);
      const ext = format === "zip" ? "zip" : "pdf";
      downloadFile(blob, `restaurant-qr-codes.${ext}`);
    } catch (error) {
      console.error(error);
      alert(`Không thể tải xuống: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ GIẢI PHÁP MỚI: Dùng Modal thay vì Dropdown
  const DownloadModal = () => {
    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 animate-in fade-in duration-200">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Modal Content */}
        <div className="relative bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl w-full max-w-md animate-in zoom-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                Xuất dữ liệu QR
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Chọn định dạng tệp tin để tải xuống
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-3 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Options */}
          <div className="p-6 space-y-3">
            {/* ZIP Option */}
            <button
              onClick={() => handleDownload("zip")}
              disabled={loading}
              className="w-full flex items-center gap-5 p-6 bg-linear-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 rounded-3xl transition-all text-left group border-2 border-rose-100 hover:border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-4 bg-white rounded-2xl text-rose-600 shadow-lg shadow-rose-200/50 transition-transform">
                <FileArchive size={28} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-lg leading-tight">
                  Tải tệp ZIP
                </p>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Nhiều ảnh PNG riêng lẻ • {tableCount} bàn
                </p>
              </div>
              <ChevronDown
                size={20}
                className="text-rose-400 -rotate-90 group-hover:translate-x-1 transition-transform"
              />
            </button>

            {/* PDF Option */}
            <button
              onClick={() => handleDownload("pdf")}
              disabled={loading}
              className="w-full flex items-center gap-5 p-6 bg-linear-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-3xl transition-all text-left group border-2 border-blue-100 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-lg shadow-blue-200/50 transition-transform">
                <FileText size={28} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-lg leading-tight">
                  Tải tệp PDF
                </p>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Một tệp duy nhất để in • {tableCount} bàn
                </p>
              </div>
              <ChevronDown
                size={20}
                className="text-blue-400 -rotate-90 group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4">
            <p className="text-xs text-slate-400 text-center font-medium">
              💡 Gợi ý: Dùng ZIP để in từng bàn, dùng PDF để in hàng loạt
            </p>
          </div>
        </div>
      </div>,
      document.body // ✅ Render trực tiếp vào <body>, tránh mọi overflow/z-index issues
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={tableCount === 0 || loading}
        className="flex items-center gap-3 bg-white border-2 border-slate-100 px-6 py-3.5 rounded-2xl text-slate-700 font-bold hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed leading-tight"
      >
        <Download size={18} />
        <span>{loading ? "Đang tải..." : "Xuất dữ liệu QR"}</span>
        {!loading && <ChevronDown size={16} />}
      </button>

      <DownloadModal />
    </>
  );
};

export default DownloadButtons;
