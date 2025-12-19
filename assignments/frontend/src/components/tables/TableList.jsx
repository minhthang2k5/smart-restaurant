import { Edit2, Trash2, QrCode, Power, PowerOff } from "lucide-react";

const TableList = ({
  tables,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onGenerateQR,
}) => {
  return (
    <div className="overflow-x-auto">
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
        <tbody className="divide-y divide-slate-100">
          {tables.map((table) => (
            <tr
              key={table.id}
              className="hover:bg-rose-50/30 transition-colors group"
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
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onGenerateQR(table)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <QrCode size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(table)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onToggleStatus(table.id, table.status)}
                    className={`p-2 rounded-xl transition-all ${
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
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
  );
};

export default TableList;
