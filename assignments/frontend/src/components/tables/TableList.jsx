import { useState } from "react";
import { Edit2, Trash2, QrCode, Power, PowerOff, ChevronLeft, ChevronRight } from "lucide-react";

const TableList = ({
  tables,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onGenerateQR,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(tables.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTables = tables.slice(startIndex, endIndex);

  // Reset to page 1 when tables change
  useState(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [tables.length]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
              Mã số bàn
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
              Sức chứa
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
              Vị trí
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
              Trạng thái
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
              QR Code
            </th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pink-50">
          {currentTables.map((table, index) => (
            <tr
              key={table.id}
              className="hover:bg-linear-to-r hover:from-pink-50/50 hover:to-rose-50/30 transition-all duration-300 group"
            >
              <td className="px-6 py-4 font-semibold text-slate-700">
                {table.tableNumber}
              </td>
              <td className="px-6 py-4 text-slate-600">{table.capacity} chỗ</td>
              <td className="px-6 py-4 text-slate-600">{table.location}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    table.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {table.status === "active" ? "Hoạt động" : "Tạm dừng"}
                </span>
              </td>
              <td className="px-6 py-4">
                {table.qrToken ? (
                  <span className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
                    <QrCode size={14} /> Đã cấp
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs tracking-tight">
                    Chưa khởi tạo
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={() => onGenerateQR(table)}
                    className="p-3 text-pink-600 hover:bg-pink-50 rounded-2xl transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <QrCode size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(table)}
                    className="p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onToggleStatus(table.id, table.status)}
                    className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 shadow-sm ${
                      table.status === "active"
                        ? "text-amber-600 hover:bg-amber-50"
                        : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {table.status === "active" ? (
                      <PowerOff size={18} />
                    ) : (
                      <Power size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(table.id)}
                    className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-pink-50 bg-white/50 backdrop-blur-sm shrink-0">
          <div className="text-sm text-slate-600 font-medium">
            Hiển thị <span className="font-bold text-pink-600">{startIndex + 1}</span> đến{" "}
            <span className="font-bold text-pink-600">{Math.min(endIndex, tables.length)}</span> trong tổng số{" "}
            <span className="font-bold text-pink-600">{tables.length}</span> bàn
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft size={18} className="text-pink-600" />
            </button>

            {/* Page Numbers */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-10 h-10 rounded-xl font-semibold transition-all duration-300 ${
                    currentPage === page
                      ? "bg-linear-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-110"
                      : "border border-pink-200 text-slate-600 hover:bg-pink-50 hover:scale-105"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-pink-200 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              <ChevronRight size={18} className="text-pink-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableList;
