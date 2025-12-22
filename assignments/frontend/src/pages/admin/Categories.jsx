import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import * as menuService from "../../services/menuService";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await menuService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      message.error("Failed to load categories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    form.setFieldsValue(cat);
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editing) {
        // Update existing
        await menuService.updateCategory(editing.id, values);
        message.success("Category updated successfully");
      } else {
        // Create new
        await menuService.createCategory(values);
        message.success("Category created successfully");
      }

      setOpen(false);
      form.resetFields();
      fetchCategories(); // Refresh list
    } catch (error) {
      if (error.errorFields) {
        message.error("Please check the form fields");
      } else {
        message.error(
          editing ? "Failed to update category" : "Failed to create category"
        );
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await menuService.deleteCategory(id);
      message.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      message.error("Failed to delete category");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      const newStatus = cat.status === "active" ? "inactive" : "active";
      await menuService.updateCategory(cat.id, {
        ...cat,
        status: newStatus,
      });
      message.success(
        `Category ${newStatus === "active" ? "activated" : "deactivated"}`
      );
      fetchCategories();
    } catch (error) {
      message.error("Failed to update status");
      console.error(error);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Display Order",
      dataIndex: "display_order",
      key: "display_order",
      width: 120,
      sorter: (a, b) => (a.display_order || 0) - (b.display_order || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => (
        <Switch
          checked={status === "active"}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete category?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>Menu Categories</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Category
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          dataSource={categories}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>

      <Modal
        title={editing ? "Edit Category" : "Create Category"}
        open={open}
        onOk={onSave}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Category Name"
            rules={[
              { required: true, message: "Please enter category name" },
              { min: 2, max: 50, message: "Name must be 2-50 characters" },
            ]}
          >
            <Input placeholder="e.g., Appetizers" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item name="display_order" label="Display Order">
            <Input type="number" min={0} placeholder="0" />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="active">
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              defaultChecked
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
