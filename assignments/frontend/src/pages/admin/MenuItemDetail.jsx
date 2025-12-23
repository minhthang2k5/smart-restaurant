import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  message,
  Spin,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import PhotoManagerMock from "../../components/menu/itemDetail/PhotoManagerMock";
import ModifierAttach from "../../components/menu/itemDetail/ModifierAttach";
import * as menuService from "../../services/menuService";

const { TextArea } = Input;

export default function MenuItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // State
  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [attachedModifiers, setAttachedModifiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchItem();
    fetchCategories();
    fetchModifierGroups();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await menuService.getMenuItemById(itemId);
      const itemData = response.data;
      setItem(itemData);

      // Populate form
      form.setFieldsValue({
        name: itemData.name,
        description: itemData.description,
        category_id: itemData.category_id,
        price: itemData.price,
        prep_time_minutes: itemData.prep_time_minutes,
        status: itemData.status,
        is_chef_recommended: itemData.is_chef_recommended,
      });

      // Fetch attached modifiers
      fetchAttachedModifiers();
    } catch (error) {
      message.error("Failed to load item details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await menuService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const fetchModifierGroups = async () => {
    try {
      const response = await menuService.getModifierGroups();
      setModifierGroups(response.data || []);
    } catch (error) {
      console.error("Failed to load modifier groups:", error);
    }
  };

  const fetchAttachedModifiers = async () => {
    try {
      const response = await menuService.getItemModifiers(itemId);
      const groupIds = response.data?.map((g) => g.id) || [];
      setAttachedModifiers(groupIds);
    } catch (error) {
      console.error("Failed to load attached modifiers:", error);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      await menuService.updateMenuItem(itemId, values);
      message.success("Item updated successfully");

      // Refresh item data
      fetchItem();
    } catch (error) {
      if (error.errorFields) {
        message.error("Please check the form fields");
      } else {
        message.error("Failed to update item");
        console.error(error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleModifiersChange = async (selectedGroupIds) => {
    try {
      await menuService.attachModifiersToItem(itemId, selectedGroupIds);
      setAttachedModifiers(selectedGroupIds);
      message.success("Modifiers updated successfully");
    } catch (error) {
      message.error("Failed to update modifiers");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" tip="Loading item details..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Item not found</p>
        <Button onClick={() => navigate("/admin/menu-items")}>
          Back to Menu Items
        </Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: "1",
      label: "Basic Information",
      children: (
        <Card>
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Item Name"
              rules={[
                { required: true, message: "Please enter item name" },
                { min: 2, max: 80, message: "Name must be 2-80 characters" },
              ]}
            >
              <Input placeholder="e.g., Grilled Salmon" />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Category"
              rules={[{ required: true, message: "Please select category" }]}
            >
              <Select placeholder="Select category">
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Price"
              rules={[
                { required: true, message: "Please enter price" },
                {
                  type: "number",
                  min: 0.01,
                  message: "Price must be positive",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0.01}
                step={0.01}
                precision={2}
                prefix="$"
              />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Describe the item..." />
            </Form.Item>

            <Form.Item
              name="prep_time_minutes"
              label="Preparation Time (minutes)"
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={240}
                placeholder="0"
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select>
                <Select.Option value="available">Available</Select.Option>
                <Select.Option value="unavailable">Unavailable</Select.Option>
                <Select.Option value="sold_out">Sold Out</Select.Option>
                <Select.Option value="hidden">Hidden</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="is_chef_recommended"
              label="Chef's Recommendation"
              valuePropName="checked"
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                size="large"
              >
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: "2",
      label: "Photos",
      children: (
        <Card>
          <PhotoManagerMock itemId={itemId} />
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#fff7e6",
              borderRadius: 4,
            }}
          >
            <p style={{ margin: 0, color: "#fa8c16" }}>
              ⚠️ <strong>Note:</strong> Photo upload is currently UI-only
              (mock). Backend implementation pending.
            </p>
          </div>
        </Card>
      ),
    },
    {
      key: "3",
      label: "Modifiers",
      children: (
        <Card>
          <ModifierAttach
            modifierGroups={modifierGroups}
            selected={attachedModifiers}
            onChange={handleModifiersChange}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/menu-items")}
        >
          Back to List
        </Button>
        <h2 style={{ margin: 0 }}>Edit Menu Item: {item.name}</h2>
      </Space>

      <Tabs defaultActiveKey="1" items={tabItems} />
    </div>
  );
}
