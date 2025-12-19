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
              className="text-4xl font-bold tracking-tight pb-3"
              style={{
                background: "linear-gradient(135deg, #EC4899, #FB7185)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Quản lý không gian bàn
            </h2>
          </div>
          <div className="flex gap-4">
            <DownloadButtons tableCount={tables.length} />
            <button
              onClick={() => {
                setSelectedTable(null);
                setFormOpen(true);
              }}
              className="cta-button flex items-center gap-3"
            >
              <Plus size={22} />
              <span>Thêm bàn mới</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="relative group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-all duration-300"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm số bàn..."
              className="w-full pl-16 pr-6 py-5 bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-300 transition-all shadow-lg font-medium text-slate-700 placeholder:text-slate-400 hover:bg-white/85"
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
          <select
            className="px-6 py-5 bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-300 transition-all shadow-lg font-semibold text-slate-700 cursor-pointer hover:bg-white/85"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">🎯 Trạng thái: Tất cả</option>
            <option value="active">✅ Đang hoạt động</option>
            <option value="inactive">⛔ Ngừng hoạt động</option>
          </select>
          <select
            className="px-6 py-5 bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-300 transition-all shadow-lg font-semibold text-slate-700 cursor-pointer hover:bg-white/85"
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
