import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import TableList from "../../components/tables/TableList";
import TableForm from "../../components/tables/TableForm";
import QRCodeModal from "../../components/tables/QRCodeModal";
import DownloadButtons from "../../components/tables/DownloadButtons";
import { useTables } from "../../hooks/useTables";

const Tables = () => {
  const {
    tables,
    loading,
    filters,
    setFilters,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    toggleStatus,
  } = useTables();
  const [formOpen, setFormOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  return (
    <div className="p-8 min-h-screen">
      <div className="glass-card rounded-3xl p-8 mb-6 shadow-xl border-2 border-white/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2
              className="text-3xl font-black tracking-tight mb-2"
              style={{
                background: "linear-gradient(135deg, #f43f5e, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Quản lý không gian bàn
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Tổ chức và quản lý {tables.length} bàn trong hệ thống
            </p>
          </div>
          <div className="flex gap-3">
            <DownloadButtons tableCount={tables.length} />
            <button
              onClick={() => {
                setSelectedTable(null);
                setFormOpen(true);
              }}
              className="neon-button flex items-center gap-2 text-white px-8 py-3.5 rounded-2xl transition-all shadow-xl font-bold text-sm tracking-wide"
              style={{
                background: "linear-gradient(135deg, #f43f5e, #8b5cf6)",
              }}
            >
              <Plus size={20} />
              <span>Thêm bàn mới</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div className="relative group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm số bàn..."
              className="w-full pl-14 pr-5 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-300 transition-all shadow-md font-medium text-slate-700 placeholder:text-slate-400"
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
          <select
            className="px-5 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-300 transition-all shadow-md font-semibold text-slate-700 cursor-pointer"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">🎯 Trạng thái: Tất cả</option>
            <option value="active">✅ Đang hoạt động</option>
            <option value="inactive">⛔ Ngừng hoạt động</option>
          </select>
          <select
            className="px-5 py-4 bg-white/80 backdrop-blur-sm border-2 border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-300 transition-all shadow-md font-semibold text-slate-700 cursor-pointer"
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
          >
            <option value="">📍 Khu vực: Tất cả</option>
            <option value="Main Hall">🏛️ Sảnh chính</option>
            <option value="Outdoor">🌳 Ngoài trời</option>
            <option value="VIP Room">👑 Phòng VIP</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden shadow-xl border-2 border-white/40">
        <TableList
          tables={tables}
          loading={loading}
          onEdit={(t) => {
            setSelectedTable(t);
            setFormOpen(true);
          }}
          onDelete={deleteTable}
          onToggleStatus={toggleStatus}
          onGenerateQR={(t) => {
            setSelectedTable(t);
            setQrModalOpen(true);
          }}
        />
      </div>

      {formOpen && (
        <TableForm
          open={formOpen}
          onCancel={() => setFormOpen(false)}
          onSubmit={async (v) =>
            selectedTable ? updateTable(selectedTable.id, v) : createTable(v)
          }
          initialValues={selectedTable}
        />
      )}

      {qrModalOpen && (
        <QRCodeModal
          open={qrModalOpen}
          onCancel={() => setQrModalOpen(false)}
          table={selectedTable}
          onRegenerate={fetchTables}
        />
      )}
    </div>
  );
};

export default Tables;
