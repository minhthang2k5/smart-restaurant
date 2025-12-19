import { Table, Button, Tag, Space, Popconfirm, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

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
      title: "Table Number",
      dataIndex: "tableNumber",
      key: "tableNumber",
      sorter: true,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "capacity",
      width: 100,
      render: (capacity) => `${capacity} people`,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      filters: [
        { text: "Main Hall", value: "Main Hall" },
        { text: "Outdoor", value: "Outdoor" },
        { text: "VIP Room", value: "VIP Room" },
      ],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "QR Code",
      key: "qrCode",
      width: 120,
      render: (_, record) =>
        record.qrToken ? (
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            Generated
          </Tag>
        ) : (
          <Tag color="default">Not Generated</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Generate QR">
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              size="small"
              onClick={() => onGenerateQR(record)}
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record)}
            />
          </Tooltip>

          <Tooltip
            title={record.status === "active" ? "Deactivate" : "Activate"}
          >
            <Button
              icon={
                record.status === "active" ? (
                  <CloseCircleOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              size="small"
              danger={record.status === "active"}
              onClick={() => onToggleStatus(record.id, record.status)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this table?"
            description="This action cannot be undone."
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tables}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} tables`,
      }}
    />
  );
};

export default TableList;
