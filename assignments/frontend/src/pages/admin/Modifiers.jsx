import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Space,
  message,
  Popconfirm,
  Spin,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import * as menuService from "../../services/menuService";

export default function Modifiers() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingOption, setEditingOption] = useState(null);

  const [groupForm] = Form.useForm();
  const [optionForm] = Form.useForm();

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchOptions(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await menuService.getModifierGroups();
      setGroups(response.data || []);
    } catch (error) {
      message.error("Tải danh sách nhóm thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async (groupId) => {
    try {
      const response = await menuService.getModifierOptions(groupId);
      setOptions(response.data || []);
    } catch (error) {
      message.error("Tải danh sách lựa chọn thất bại");
      console.error(error);
    }
  };

  // Group CRUD
  const openCreateGroup = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({ selection_type: "single", is_required: false });
    setGroupModalOpen(true);
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    groupForm.setFieldsValue(group);
    setGroupModalOpen(true);
  };

  const saveGroup = async () => {
    try {
      const values = await groupForm.validateFields();
      setLoading(true);

      if (editingGroup) {
        await menuService.updateModifierGroup(editingGroup.id, values);
        message.success("Cập nhật nhóm thành công");
      } else {
        await menuService.createModifierGroup(values);
        message.success("Tạo nhóm thành công");
      }

      setGroupModalOpen(false);
      groupForm.resetFields();
      fetchGroups();
    } catch (error) {
      if (!error.errorFields) {
        message.error("Lưu nhóm thất bại");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (id) => {
    try {
      setLoading(true);
      await menuService.deleteModifierGroup(id);
      message.success("Xóa nhóm thành công");
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
        setOptions([]);
      }
      fetchGroups();
    } catch (error) {
      message.error("Xóa nhóm thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Option CRUD
  const openCreateOption = () => {
    if (!selectedGroup) {
      message.warning("Vui lòng chọn nhóm trước");
      return;
    }
    setEditingOption(null);
    optionForm.resetFields();
    optionForm.setFieldsValue({ price_adjustment: 0 });
    setOptionModalOpen(true);
  };

  const openEditOption = (option) => {
    setEditingOption(option);
    optionForm.setFieldsValue(option);
    setOptionModalOpen(true);
  };

  const saveOption = async () => {
    try {
      const values = await optionForm.validateFields();
      setLoading(true);

      if (editingOption) {
        await menuService.updateModifierOption(editingOption.id, values);
        message.success("Cập nhật lựa chọn thành công");
      } else {
        await menuService.createModifierOption(selectedGroup.id, values);
        message.success("Tạo lựa chọn thành công");
      }

      setOptionModalOpen(false);
      optionForm.resetFields();
      fetchOptions(selectedGroup.id);
    } catch (error) {
      if (!error.errorFields) {
        message.error("Lưu lựa chọn thất bại");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteOption = async (id) => {
    try {
      setLoading(true);
      await menuService.deleteModifierOption(id);
      message.success("Xóa lựa chọn thành công");
      fetchOptions(selectedGroup.id);
    } catch (error) {
      message.error("Xóa lựa chọn thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const groupColumns = [
    {
      title: "Tên nhóm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Kiểu",
      dataIndex: "selection_type",
      key: "selection_type",
      render: (type) =>
        type === "single" ? "Chọn duy nhất" : "Chọn nhiều",
    },
    {
      title: "Bắt buộc",
      dataIndex: "is_required",
      key: "is_required",
      render: (required) => (required ? "Có" : "Không"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditGroup(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa nhóm?"
            onConfirm={() => deleteGroup(record.id)}
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

  const optionColumns = [
    {
      title: "Tên lựa chọn",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Phụ phí",
      dataIndex: "price_adjustment",
      key: "price_adjustment",
      render: (price) => `$${Number(price).toFixed(2)}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditOption(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa lựa chọn?"
            onConfirm={() => deleteOption(record.id)}
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
      <h2 style={{ marginBottom: 24 }}>Nhóm Tùy Chọn & Lựa Chọn</h2>

      <Spin spinning={loading}>
        <Row gutter={16}>
          {/* Left: Groups */}
          <Col span={12}>
            <Card
              title="Nhóm Tùy Chọn"
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={openCreateGroup}
                >
                  Thêm nhóm
                </Button>
              }
            >
              <Table
                dataSource={groups}
                columns={groupColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({
                  onClick: () => setSelectedGroup(record),
                  style: {
                    cursor: "pointer",
                    background:
                      selectedGroup?.id === record.id ? "#e6f7ff" : undefined,
                  },
                })}
              />
            </Card>
          </Col>

          {/* Right: Options */}
          <Col span={12}>
            <Card
              title={
                selectedGroup
                  ? `Lựa chọn cho "${selectedGroup.name}"`
                  : "Chọn một nhóm"
              }
              extra={
                selectedGroup && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={openCreateOption}
                  >
                    Thêm lựa chọn
                  </Button>
                )
              }
            >
              {selectedGroup ? (
                <Table
                  dataSource={options}
                  columns={optionColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <div
                  style={{ textAlign: "center", padding: 40, color: "#999" }}
                >
                  Chọn một nhóm tùy chọn để xem các lựa chọn
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Group Modal */}
      <Modal
        title={editingGroup ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}
        open={groupModalOpen}
        onOk={saveGroup}
        onCancel={() => {
          setGroupModalOpen(false);
          groupForm.resetFields();
        }}
        confirmLoading={loading}
        okText={editingGroup ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên nhóm"
            rules={[{ required: true, message: "Vui lòng nhập tên nhóm" }]}
          >
            <Input placeholder="VD: Kích cỡ" />
          </Form.Item>

          <Form.Item
            name="selection_type"
            label="Kiểu lựa chọn"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="single">Chọn duy nhất</Select.Option>
              <Select.Option value="multiple">Chọn nhiều</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_required"
            label="Bắt buộc"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) =>
              prev.selection_type !== curr.selection_type
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("selection_type") === "multiple" && (
                <>
                  <Form.Item name="min_selections" label="Số lượng tối thiểu">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="max_selections" label="Số lượng tối đa">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>

          <Form.Item name="display_order" label="Thứ tự hiển thị">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Option Modal */}
      <Modal
        title={editingOption ? "Chỉnh sửa lựa chọn" : "Tạo lựa chọn mới"}
        open={optionModalOpen}
        onOk={saveOption}
        onCancel={() => {
          setOptionModalOpen(false);
          optionForm.resetFields();
        }}
        confirmLoading={loading}
        okText={editingOption ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form form={optionForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên lựa chọn"
            rules={[{ required: true, message: "Vui lòng nhập tên lựa chọn" }]}
          >
            <Input placeholder="VD: Lớn" />
          </Form.Item>

          <Form.Item
            name="price_adjustment"
            label="Phụ phí"
            rules={[{ required: true }, { type: "number", min: 0 }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              prefix="$"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" initialValue="active">
            <Select>
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Tắt</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
