import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useMenu } from "../../context/MenuContext.jsx";
import ModifierAttach from "../../components/menu/itemDetail/ModifierAttach.jsx";
import PhotoManagerMock from "../../components/menu/itemDetail/PhotoManagerMock.jsx";

export default function MenuItemDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const {
    items,
    categories,
    modifierGroups,
    updateItem,
    setItemModifierGroups,
  } = useMenu();

  const item = items.find((x) => x.id === id);
  const [form] = Form.useForm();

  // Photos UI-only state: store inside item via updateItem to keep persistence when navigating
  const [photos, setPhotos] = useState(item?.photos || []);

  const catOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  if (!item) {
    return (
      <div style={{ padding: 20 }}>
        <Typography.Title level={4}>Item not found</Typography.Title>
        <Button onClick={() => nav("/admin/menu-items")}>Back</Button>
      </div>
    );
  }

  function saveInfo() {
    form.validateFields().then((vals) => {
      updateItem(item.id, {
        ...vals,
        price: Number(vals.price),
        prepTime: Number(vals.prepTime),
      });
    });
  }

  function onPhotosChange(next) {
    setPhotos(next);
    // Persist to context item (UI-only)
    updateItem(item.id, { photos: next });
  }

  const tabs = [
    {
      key: "basic",
      label: "Basic Info",
      children: (
        <Card>
          <Form
            layout="vertical"
            form={form}
            initialValues={{
              name: item.name,
              description: item.description,
              categoryId: item.categoryId,
              price: item.price,
              prepTime: item.prepTime,
              status: item.status,
            }}
          >
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item
              label="Category"
              name="categoryId"
              rules={[{ required: true }]}
            >
              <Select options={catOptions} />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="Price"
                  name="price"
                  rules={[{ required: true }]}
                >
                  <Input type="number" min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Prep time (min)" name="prepTime">
                  <Input type="number" min={0} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Status" name="status">
              <Select
                options={[
                  { value: "available", label: "available" },
                  { value: "sold_out", label: "sold_out" },
                  { value: "hidden", label: "hidden" },
                ]}
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: "modifiers",
      label: "Modifiers",
      children: (
        <ModifierAttach
          modifierGroups={modifierGroups}
          selectedIds={item.modifierGroupIds || []}
          onChange={(vals) => setItemModifierGroups(item.id, vals)}
        />
      ),
    },
    {
      key: "photos",
      label: "Photos",
      children: <PhotoManagerMock photos={photos} onChange={onPhotosChange} />,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Space>
          <Button onClick={() => nav("/admin/menu-items")}>Back</Button>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Item Detail
          </Typography.Title>
          <Tag>{item.status}</Tag>
        </Space>
        <Button type="primary" onClick={saveInfo}>
          Save Changes
        </Button>
      </Space>

      <div style={{ marginTop: 16 }}>
        <Tabs items={tabs} />
      </div>
    </div>
  );
}
