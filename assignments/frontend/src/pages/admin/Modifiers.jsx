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
      message.error("Failed to load modifier groups");
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
      message.error("Failed to load options");
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
        message.success("Group updated");
      } else {
        await menuService.createModifierGroup(values);
        message.success("Group created");
      }

      setGroupModalOpen(false);
      groupForm.resetFields();
      fetchGroups();
    } catch (error) {
      if (!error.errorFields) {
        message.error("Failed to save group");
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
      message.success("Group deleted");
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
        setOptions([]);
      }
      fetchGroups();
    } catch (error) {
      message.error("Failed to delete group");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Option CRUD
  const openCreateOption = () => {
    if (!selectedGroup) {
      message.warning("Please select a group first");
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
        message.success("Option updated");
      } else {
        await menuService.createModifierOption(selectedGroup.id, values);
        message.success("Option created");
      }

      setOptionModalOpen(false);
      optionForm.resetFields();
      fetchOptions(selectedGroup.id);
    } catch (error) {
      if (!error.errorFields) {
        message.error("Failed to save option");
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
      message.success("Option deleted");
      fetchOptions(selectedGroup.id);
    } catch (error) {
      message.error("Failed to delete option");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const groupColumns = [
    {
      title: "Group Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "selection_type",
      key: "selection_type",
      render: (type) =>
        type === "single" ? "Single Select" : "Multiple Select",
    },
    {
      title: "Required",
      dataIndex: "is_required",
      key: "is_required",
      render: (required) => (required ? "Yes" : "No"),
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
            onClick={() => openEditGroup(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete group?"
            onConfirm={() => deleteGroup(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const optionColumns = [
    {
      title: "Option Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Price Adjustment",
      dataIndex: "price_adjustment",
      key: "price_adjustment",
      render: (price) => `$${Number(price).toFixed(2)}`,
    },
    {
      title: "Status",
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
            Edit
          </Button>
          <Popconfirm
            title="Delete option?"
            onConfirm={() => deleteOption(record.id)}
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
      <h2 style={{ marginBottom: 24 }}>Modifier Groups & Options</h2>

      <Spin spinning={loading}>
        <Row gutter={16}>
          {/* Left: Groups */}
          <Col span={12}>
            <Card
              title="Modifier Groups"
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={openCreateGroup}
                >
                  Add Group
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
                  ? `Options for "${selectedGroup.name}"`
                  : "Select a group"
              }
              extra={
                selectedGroup && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={openCreateOption}
                  >
                    Add Option
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
                  Select a modifier group to view options
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Group Modal */}
      <Modal
        title={editingGroup ? "Edit Group" : "Create Group"}
        open={groupModalOpen}
        onOk={saveGroup}
        onCancel={() => {
          setGroupModalOpen(false);
          groupForm.resetFields();
        }}
        confirmLoading={loading}
      >
        <Form form={groupForm} layout="vertical">
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: "Please enter group name" }]}
          >
            <Input placeholder="e.g., Size" />
          </Form.Item>

          <Form.Item
            name="selection_type"
            label="Selection Type"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="single">Single Select</Select.Option>
              <Select.Option value="multiple">Multiple Select</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_required"
            label="Required"
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
                  <Form.Item name="min_selections" label="Min Selections">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item name="max_selections" label="Max Selections">
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>

          <Form.Item name="display_order" label="Display Order">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Option Modal */}
      <Modal
        title={editingOption ? "Edit Option" : "Create Option"}
        open={optionModalOpen}
        onOk={saveOption}
        onCancel={() => {
          setOptionModalOpen(false);
          optionForm.resetFields();
        }}
        confirmLoading={loading}
      >
        <Form form={optionForm} layout="vertical">
          <Form.Item
            name="name"
            label="Option Name"
            rules={[{ required: true, message: "Please enter option name" }]}
          >
            <Input placeholder="e.g., Large" />
          </Form.Item>

          <Form.Item
            name="price_adjustment"
            label="Price Adjustment"
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

          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
