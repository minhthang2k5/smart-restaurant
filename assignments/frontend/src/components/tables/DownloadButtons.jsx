import { useState } from "react";
import { Download, FileArchive, FileText, ChevronDown } from "lucide-react";
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" style={{ overflow: "visible" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={tableCount === 0}
        className="flex items-center gap-2 bg-white border-2 border-slate-100 px-6 py-3.5 rounded-2xl text-slate-700 font-bold hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm disabled:opacity-50 leading-tight"
      >
        <Download size={18} />
        <span>Xuất dữ liệu QR</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[150]"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-3 w-72 z-[200] bg-white/95 backdrop-blur-xl border border-rose-50 rounded-3xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 mb-2 border-b border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Định dạng tệp tin
              </p>
            </div>
            <button
              onClick={() => handleDownload("zip")}
              className="w-full flex items-center gap-4 p-4 hover:bg-rose-50 rounded-3xl transition-all text-left group"
            >
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <FileArchive size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-700">Tải tệp ZIP</p>
                <p className="text-xs text-slate-400 font-medium">
                  Nhiều ảnh PNG riêng lẻ
                </p>
              </div>
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 rounded-3xl transition-all text-left group mt-1"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-700">Tải tệp PDF</p>
                <p className="text-xs text-slate-400 font-medium">
                  Một tệp duy nhất để in
                </p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DownloadButtons;
