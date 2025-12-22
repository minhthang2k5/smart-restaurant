import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMenu } from "../../context/MenuContext.jsx";

export default function Modifiers() {
  const {
    modifierGroups,
    addModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,
    addModifierOption,
    updateModifierOption,
    deleteModifierOption,
  } = useMenu();

  const [selectedGroupId, setSelectedGroupId] = useState(
    modifierGroups[0]?.id || null
  );
  const selectedGroup =
    modifierGroups.find((g) => g.id === selectedGroupId) || null;

  // ---- Group modal state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm] = Form.useForm();

  // ---- Option modal state
  const [optModalOpen, setOptModalOpen] = useState(false);
  const [editingOpt, setEditingOpt] = useState(null);
  const [optForm] = Form.useForm();

  const groupData = useMemo(
    () => modifierGroups.map((g) => ({ key: g.id, ...g })),
    [modifierGroups]
  );

  function openCreateGroup() {
    setEditingGroup(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({
      selectionType: "single",
      required: false,
      min: 0,
      max: 1,
      status: "active",
    });
    setGroupModalOpen(true);
  }

  function openEditGroup(g) {
    setEditingGroup(g);
    groupForm.setFieldsValue({
      name: g.name,
      selectionType: g.selectionType,
      required: g.required,
      min: g.min,
      max: g.max,
      status: g.status,
    });
    setGroupModalOpen(true);
  }

  function saveGroup() {
    groupForm.validateFields().then((vals) => {
      const payload = {
        ...vals,
        min: Number(vals.min ?? 0),
        max: Number(vals.max ?? 0),
      };

      // basic UI validation for min/max
      if (payload.min < 0 || payload.max < 0) return;
      if (payload.selectionType === "single") {
        payload.min = 1;
        payload.max = 1;
      } else {
        if (payload.max < payload.min) {
          // swap or force sensible value
          payload.max = payload.min;
        }
      }

      if (editingGroup) {
        updateModifierGroup(editingGroup.id, payload);
      } else {
        const g = addModifierGroup(payload);
        setSelectedGroupId(g.id);
      }
      setGroupModalOpen(false);
    });
  }

  function onDeleteGroup(groupId) {
    deleteModifierGroup(groupId);
    if (groupId === selectedGroupId) {
      const next = modifierGroups.filter((g) => g.id !== groupId)[0];
      setSelectedGroupId(next?.id || null);
    }
  }

  // ---- Options
  function openCreateOption() {
    if (!selectedGroup) return;
    setEditingOpt(null);
    optForm.resetFields();
    optForm.setFieldsValue({ priceAdjustment: 0, status: "active" });
    setOptModalOpen(true);
  }

  function openEditOption(opt) {
    setEditingOpt(opt);
    optForm.setFieldsValue({
      name: opt.name,
      priceAdjustment: opt.priceAdjustment,
      status: opt.status,
    });
    setOptModalOpen(true);
  }

  function saveOption() {
    if (!selectedGroup) return;
    optForm.validateFields().then((vals) => {
      const payload = {
        ...vals,
        priceAdjustment: Number(vals.priceAdjustment ?? 0),
      };

      if (editingOpt)
        updateModifierOption(selectedGroup.id, editingOpt.id, payload);
      else addModifierOption(selectedGroup.id, payload);

      setOptModalOpen(false);
    });
  }

  const optionColumns = [
    { title: "Name", dataIndex: "name" },
    {
      title: "Price Adjustment",
      dataIndex: "priceAdjustment",
      render: (v) => `${Number(v || 0).toLocaleString()}đ`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) =>
        v === "active" ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>,
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditOption(record)}>
            Edit
          </Button>
          <Button
            size="small"
            danger
            onClick={() => deleteModifierOption(selectedGroup.id, record.id)}
          >
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
          Modifiers
        </Typography.Title>
        <Button type="primary" onClick={openCreateGroup}>
          + Add Group
        </Button>
      </Space>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Left: Groups */}
        <Col xs={24} lg={10}>
          <Card title="Modifier Groups">
            <Table
              size="small"
              dataSource={groupData}
              pagination={{ pageSize: 6 }}
              rowClassName={(r) =>
                r.id === selectedGroupId ? "ant-table-row-selected" : ""
              }
              onRow={(record) => ({
                onClick: () => setSelectedGroupId(record.id),
                style: { cursor: "pointer" },
              })}
              columns={[
                { title: "Name", dataIndex: "name" },
                {
                  title: "Type",
                  dataIndex: "selectionType",
                  render: (v) => <Tag color="blue">{v}</Tag>,
                },
                {
                  title: "Required",
                  dataIndex: "required",
                  render: (v) =>
                    v ? (
                      <Tag color="purple">required</Tag>
                    ) : (
                      <Tag>optional</Tag>
                    ),
                },
                {
                  title: "Rule",
                  render: (_, g) =>
                    g.selectionType === "single"
                      ? "min=1, max=1"
                      : `min=${g.min}, max=${g.max}`,
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  render: (v) =>
                    v === "active" ? (
                      <Tag color="green">active</Tag>
                    ) : (
                      <Tag>inactive</Tag>
                    ),
                },
                {
                  title: "Actions",
                  render: (_, g) => (
                    <Space>
                      <Button size="small" onClick={() => openEditGroup(g)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        onClick={() => onDeleteGroup(g.id)}
                      >
                        Delete
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right: Options */}
        <Col xs={24} lg={14}>
          <Card
            title={
              selectedGroup ? `Options of: ${selectedGroup.name}` : "Options"
            }
            extra={
              <Button onClick={openCreateOption} disabled={!selectedGroup}>
                + Add Option
              </Button>
            }
          >
            {!selectedGroup ? (
              <Typography.Text type="secondary">
                Select a group first.
              </Typography.Text>
            ) : (
              <Table
                size="small"
                dataSource={selectedGroup.options.map((o) => ({
                  key: o.id,
                  ...o,
                }))}
                columns={optionColumns}
                pagination={{ pageSize: 6 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Group Modal */}
      <Modal
        open={groupModalOpen}
        onCancel={() => setGroupModalOpen(false)}
        onOk={saveGroup}
        okText="Save"
        title={editingGroup ? "Edit Group" : "Add Group"}
      >
        <Form layout="vertical" form={groupForm}>
          <Form.Item
            label="Group name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Size" />
          </Form.Item>

          <Form.Item
            label="Selection type"
            name="selectionType"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "single", label: "single (radio)" },
                { value: "multiple", label: "multiple (checkbox)" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Required" name="required" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Min (only for multiple)" name="min">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Max (only for multiple)" name="max">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Status" name="status">
            <Select
              options={[
                { value: "active", label: "active" },
                { value: "inactive", label: "inactive" },
              ]}
            />
          </Form.Item>

          <Typography.Text type="secondary">
            Note: If selection type is <b>single</b>, UI will force min=max=1.
          </Typography.Text>
        </Form>
      </Modal>

      {/* Option Modal */}
      <Modal
        open={optModalOpen}
        onCancel={() => setOptModalOpen(false)}
        onOk={saveOption}
        okText="Save"
        title={editingOpt ? "Edit Option" : "Add Option"}
      >
        <Form layout="vertical" form={optForm}>
          <Form.Item
            label="Option name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Large" />
          </Form.Item>

          <Form.Item label="Price adjustment" name="priceAdjustment">
            <Input type="number" />
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select
              options={[
                { value: "active", label: "active" },
                { value: "inactive", label: "inactive" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
