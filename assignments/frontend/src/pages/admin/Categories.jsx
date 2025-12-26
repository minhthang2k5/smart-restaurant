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
      message.error("Tải danh sách danh mục thất bại");
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
        message.success("Cập nhật danh mục thành công");
      } else {
        // Create new
        await menuService.createCategory(values);
        message.success("Tạo danh mục thành công");
      }

      setOpen(false);
      form.resetFields();
      fetchCategories(); // Refresh list
    } catch (error) {
      if (error.errorFields) {
        message.error("Vui lòng kiểm tra các trường nhập liệu");
      } else {
        message.error(
          editing ? "Cập nhật danh mục thất bại" : "Tạo danh mục thất bại"
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
      message.success("Xóa danh mục thành công");
      fetchCategories();
    } catch (error) {
      message.error("Xóa danh mục thất bại");
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
        `Danh mục đã ${newStatus === "active" ? "kích hoạt" : "tắt"}`
      );
      fetchCategories();
    } catch (error) {
      message.error("Cập nhật trạng thái thất bại");
      console.error(error);
    }
  };

  const columns = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Thứ tự hiển thị",
      dataIndex: "display_order",
      key: "display_order",
      width: 120,
      sorter: (a, b) => (a.display_order || 0) - (b.display_order || 0),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => (
        <Switch
          checked={status === "active"}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: "Thao tác",
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
            Sửa
          </Button>
          <Popconfirm
            title="Xóa danh mục?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
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
        <h2>Danh Mục Món Ăn</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm danh mục
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
        title={editing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
        open={open}
        onOk={onSave}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        okText={editing ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              { required: true, message: "Vui lòng nhập tên danh mục" },
              { min: 2, max: 50, message: "Tên phải từ 2-50 ký tự" },
            ]}
          >
            <Input placeholder="VD: Món khai vị" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả (không bắt buộc)" />
          </Form.Item>

          <Form.Item name="display_order" label="Thứ tự hiển thị">
            <Input type="number" min={0} placeholder="0" />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" initialValue="active">
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Tắt"
              defaultChecked
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
