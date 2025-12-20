import { useState, useEffect } from "react";
import { X, Layout, Users, MapPin, AlignLeft, CheckCircle } from "lucide-react";

const TableForm = ({ open, onCancel, onSubmit, initialValues, loading }) => {
  const [formData, setFormData] = useState({
    tableNumber: "",
    capacity: 4,
    location: "Indoor",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setFormData({
        tableNumber: initialValues.tableNumber || "",
        capacity: initialValues.capacity || 4,
        location: initialValues.location || "Indoor",
        description: initialValues.description || "",
      });
    } else {
      setFormData({
        tableNumber: "",
        capacity: 4,
        location: "Indoor",
        description: "",
      });
    }
    // Reset states khi mở modal
    setShowSuccess(false);
    setIsSubmitting(false);
  }, [initialValues, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);

      // ✅ Hiển thị success message
      setShowSuccess(true);

      // ✅ Tự động đóng sau 2 giây
      setTimeout(() => {
        setShowSuccess(false);
        onCancel();
      }, 1000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl shadow-rose-900/10 relative">
        {/* ✅ Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-300">
            <div className="bg-linear-to-br from-green-400 to-emerald-500 rounded-full p-6 shadow-2xl shadow-green-500/30 animate-in zoom-in duration-500">
              <CheckCircle size={64} className="text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mt-6">
              {initialValues ? "Cập nhật thành công!" : "Tạo bàn thành công!"}
            </h3>
            <p className="text-slate-500 mt-2 font-medium">
              Đang đóng cửa sổ...
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 leading-tight drop-shadow-sm">
            {initialValues ? "Cập nhật bàn" : "Thiết lập bàn mới"}
          </h2>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 px-1 italic uppercase tracking-wider leading-relaxed">
              <Layout size={14} /> Mã số bàn
            </label>
            <input
              required
              disabled={isSubmitting}
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
              placeholder="Ví dụ: T-10, VIP-01"
              value={formData.tableNumber}
              onChange={(e) =>
                setFormData({ ...formData, tableNumber: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 px-1 italic uppercase tracking-wider">
                <Users size={14} /> Sức chứa
              </label>
              <input
                type="number"
                min="1"
                max="20"
                required
                disabled={isSubmitting}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 px-1 italic uppercase tracking-wider">
                <MapPin size={14} /> Vị trí
              </label>
              <select
                disabled={isSubmitting}
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 outline-none bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              >
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Patio">Patio</option>
                <option value="VIP Room">VIP Room</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 px-1 italic uppercase tracking-wider">
              <AlignLeft size={14} /> Ghi chú thêm
            </label>
            <textarea
              rows="3"
              disabled={isSubmitting}
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 outline-none resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
              placeholder="Ghi chú về bàn (không bắt buộc)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all leading-tight disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1 py-4 px-6 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all leading-tight disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                "Lưu thông tin"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableForm;
