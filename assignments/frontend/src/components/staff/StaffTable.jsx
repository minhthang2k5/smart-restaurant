import { Button, Space, Table, Tag, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const roleMeta = {
  admin: { label: "Admin", color: "magenta" },
  waiter: { label: "Waiter", color: "blue" },
  kitchen_staff: { label: "Kitchen Staff", color: "volcano" },
};

export default function StaffTable({
  data,
  loading,
  pagination,
  onChange,
  onEdit,
  onToggleStatus,
  onDelete,
  currentUserId,
}) {
  const columns = [
    {
      title: "Họ tên",
      key: "name",
      render: (_, record) =>
        `${record.firstName || ""} ${record.lastName || ""}`.trim() || "—",
      sorter: (a, b) =>
        `${a.firstName || ""} ${a.lastName || ""}`
          .trim()
          .localeCompare(`${b.firstName || ""} ${b.lastName || ""}`.trim()),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 160,
      render: (role) => {
        const meta = roleMeta[role] || { label: role || "—", color: "default" };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Last login",
      dataIndex: "lastLogin",
      key: "lastLogin",
      width: 180,
      render: (val) => (val ? new Date(val).toLocaleString() : "—"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 260,
      render: (_, record) => {
        const nextStatus = record.status === "active" ? "inactive" : "active";
        const isSelf = currentUserId && record.id === currentUserId;

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              Sửa
            </Button>

            <Popconfirm
              title={`Đổi trạng thái sang ${nextStatus}?`}
              onConfirm={() => onToggleStatus(record, nextStatus)}
              okText="Có"
              cancelText="Không"
              disabled={isSelf}
            >
              <Button type="link" size="small" disabled={isSelf}>
                {record.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Xóa nhân viên?"
              description="Tài khoản sẽ bị soft delete (status=inactive)."
              onConfirm={() => onDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isSelf}
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      dataSource={data}
      columns={columns}
      loading={loading}
      pagination={pagination}
      onChange={onChange}
    />
  );
}
