import { Table, Space, Button, Tag, Tooltip } from "antd";
import { Edit2, Trash2, QrCode, Power, PowerOff } from "lucide-react";

const TableList = ({
  tables,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onGenerateQR,
}) => {
  const columns = [
    {
      title: "Mã số bàn",
      dataIndex: "tableNumber",
      key: "tableNumber",
      render: (text) => <span className="font-semibold text-slate-700">{text}</span>,
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity) => <span className="text-slate-600">{capacity} chỗ</span>,
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
      render: (text) => <span className="text-slate-600">{text}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "orange"}>
          {status === "active" ? "Hoạt động" : "Tạm dừng"}
        </Tag>
      ),
    },
    {
      title: "QR Code",
      dataIndex: "qrToken",
      key: "qrToken",
      render: (qrToken) =>
        qrToken ? (
          <span className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
            <QrCode size={14} /> Đã cấp
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Chưa khởi tạo</span>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="QR Code">
            <Button
              type="text"
              icon={<QrCode size={18} />}
              onClick={() => onGenerateQR(record)}
              className="text-pink-600 hover:bg-pink-50"
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit2 size={18} />}
              onClick={() => onEdit(record)}
              className="text-slate-600 hover:bg-slate-100"
            />
          </Tooltip>
          <Tooltip title={record.status === "active" ? "Tắt" : "Bật"}>
            <Button
              type="text"
              icon={record.status === "active" ? <PowerOff size={18} /> : <Power size={18} />}
              onClick={() => onToggleStatus(record.id, record.status)}
              className={
                record.status === "active"
                  ? "text-amber-600 hover:bg-amber-50"
                  : "text-emerald-600 hover:bg-emerald-50"
              }
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<Trash2 size={18} />}
              onClick={() => onDelete(record.id)}
              className="text-rose-600 hover:bg-rose-50"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Table
        dataSource={tables}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bàn`,
        }}
      />
    </div>
  );
};

export default TableList;
