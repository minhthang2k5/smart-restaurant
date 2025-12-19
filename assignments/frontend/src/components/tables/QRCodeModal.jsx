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

  useEffect(() => {
    if (open && table && !table.qrToken && !qrData) handleGenerate();
    return () => {
      setQrData(null);
      setLoading(false);
    };
  }, [open, table]);

  const handleGenerate = async () => {
    if (!table) return;
    setLoading(true);
    try {
      const response = await tableService.generateQRCode(table.id);
      setQrData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getQRUrl = () => {
    if (!table) return "";
    const token = qrData?.token || table?.qrToken;
    if (!token) return "";
    const frontendUrl =
      import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    return `${frontendUrl}/menu?table=${table.id}&token=${token}`;
  };

  if (!open || !table) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="glass-modal w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-8 pb-4">
          <h3 className="text-xl font-bold text-slate-800">
            Mã QR Bàn {table.tableNumber}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8">
          {/* QR Container */}
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-inner border border-slate-100 relative group">
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-[2.5rem] z-10">
                  <RefreshCw className="animate-spin text-rose-500" />
                </div>
              )}
              <QRCode value={getQRUrl()} size={200} level="H" />
            </div>

            <p className="mt-6 text-xs text-slate-400 font-medium uppercase tracking-widest">
              Quét để gọi món
            </p>
            <button
              onClick={handleGenerate}
              className="mt-4 flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold text-sm transition-colors"
            >
              <RefreshCw size={14} /> Làm mới mã QR
            </button>
          </div>

          {/* Options */}
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
                onClick={() => {}}
                className="flex items-center justify-center gap-2 py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
              >
                <ImageIcon size={18} /> PNG
              </button>
              <button
                onClick={() => {}}
                className="flex items-center justify-center gap-2 py-4 border-2 border-slate-800 text-slate-800 rounded-2xl hover:bg-slate-50 transition-all"
              >
                <FileText size={18} /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
