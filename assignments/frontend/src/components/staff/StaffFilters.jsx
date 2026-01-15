import { Card, Input, Select, Space, Button } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";

export default function StaffFilters({ value, onChange, onCreate }) {
  const role = value?.role ?? "all";
  const status = value?.status ?? "all";
  const search = value?.search ?? "";

  return (
    <Card style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Space wrap>
          <Input
            style={{ width: 320 }}
            placeholder="Tìm theo tên hoặc email..."
            prefix={<SearchOutlined />}
            value={search}
            allowClear
            onChange={(e) => onChange({ ...value, search: e.target.value })}
          />

          <Select
            style={{ width: 180 }}
            value={role}
            onChange={(val) => onChange({ ...value, role: val })}
          >
            <Select.Option value="all">Tất cả vai trò</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="waiter">Waiter</Select.Option>
            <Select.Option value="kitchen_staff">Kitchen Staff</Select.Option>
          </Select>

          <Select
            style={{ width: 160 }}
            value={status}
            onChange={(val) => onChange({ ...value, status: val })}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Space>

        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Thêm nhân viên
        </Button>
      </div>
    </Card>
  );
}
