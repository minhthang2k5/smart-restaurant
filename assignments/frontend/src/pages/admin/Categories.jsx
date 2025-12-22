import { useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMenu } from "../../context/MenuContext.jsx";

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useMenu();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const dataSource = useMemo(
    () => categories.map((c) => ({ key: c.id, ...c })),
    [categories]
  );

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    form.setFieldsValue({ name: cat.name });
    setOpen(true);
  }

  function onSave() {
    form.validateFields().then((vals) => {
      if (editing) updateCategory(editing.id, { name: vals.name });
      else addCategory({ name: vals.name });
      setOpen(false);
    });
  }

  const columns = [
    { title: "Name", dataIndex: "name" },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) =>
        v === "active" ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>,
    },
    {
      title: "Toggle",
      render: (_, record) => (
        <Switch
          checked={record.status === "active"}
          onChange={(checked) =>
            updateCategory(record.id, {
              status: checked ? "active" : "inactive",
            })
          }
        />
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => openEdit(record)}>Edit</Button>
          <Button danger onClick={() => deleteCategory(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Menu Categories
        </Typography.Title>
        <Button type="primary" onClick={openCreate}>
          + Add Category
        </Button>
      </Space>

      <div style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{ pageSize: 8 }}
        />
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        title={editing ? "Edit Category" : "Add Category"}
        okText="Save"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Category name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g., Appetizers" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
