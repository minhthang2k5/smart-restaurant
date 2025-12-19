import { useState } from "react";
import { X, Layout, Users, MapPin, AlignLeft } from "lucide-react";

const TableForm = ({ open, onCancel, onSubmit, initialValues, loading }) => {
  const [formData, setFormData] = useState(
    initialValues || {
      tableNumber: "",
      capacity: 4,
      location: "Main Hall",
      description: "",
    }
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl shadow-rose-900/10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialValues ? "Cập nhật bàn" : "Thiết lập bàn mới"}
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 px-1 italic uppercase tracking-wider">
              <Layout size={14} /> Mã số bàn
            </label>
            <input
              required
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
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
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 outline-none"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 px-1 italic uppercase tracking-wider">
                <MapPin size={14} /> Vị trí
              </label>
              <select
                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 outline-none bg-white"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              >
                <option value="Main Hall">Sảnh chính</option>
                <option value="Outdoor">Ngoài trời</option>
                <option value="VIP Room">Phòng VIP</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-500 flex items-center gap-2 px-1 italic uppercase tracking-wider">
              <AlignLeft size={14} /> Ghi chú thêm
            </label>
            <textarea
              rows="3"
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-rose-300 outline-none resize-none"
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
              className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableForm;
