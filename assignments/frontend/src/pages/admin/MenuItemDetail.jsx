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
import PhotoManager from "../../components/menu/itemDetail/PhotoManager";
import ModifierAttach from "../../components/menu/itemDetail/ModifierAttach";
import * as menuService from "../../services/menuService";
import api from "../../services/api";

const { TextArea } = Input;

export default function MenuItemDetail() {
  const { id: itemId } = useParams();
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
      message.error("Tải thông tin món ăn thất bại");
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
      setAttachedModifiers([]);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      await menuService.updateMenuItem(itemId, values);
      message.success("Cập nhật món ăn thành công");

      // Refresh item data
      fetchItem();
    } catch (error) {
      if (error.errorFields) {
        message.error("Vui lòng kiểm tra các trường nhập liệu");
      } else {
        message.error("Cập nhật món ăn thất bại");
        console.error(error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleModifiersChange = async (selectedGroupIds) => {
    try {
    
      if (selectedGroupIds.length === 0) {
        // If no groups selected, detach all
        await api.delete(`/admin/menu/items/${itemId}/modifier-groups`);
        setAttachedModifiers([]);
        message.success("Đã xóa tất cả tùy chọn");
      } else {
        // Otherwise attach selected groups
        await menuService.attachModifiersToItem(itemId, selectedGroupIds);
        setAttachedModifiers(selectedGroupIds);
        message.success("Cập nhật tùy chọn thành công");
      }
    } catch (error) {
      message.error("Cập nhật tùy chọn thất bại");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" tip="Đang tải thông tin món ăn..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Không tìm thấy món ăn</p>
        <Button onClick={() => navigate("/admin/menu-items")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: "1",
      label: "Thông tin cơ bản",
      children: (
        <Card>
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Tên món ăn"
              rules={[
                { required: true, message: "Vui lòng nhập tên món" },
                { min: 2, max: 80, message: "Tên phải từ 2-80 ký tự" },
              ]}
            >
              <Input placeholder="VD: Cá hồi nướng" />
            </Form.Item>

            <Form.Item
              name="category_id"
              label="Danh mục"
              rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
            >
              <Select placeholder="Chọn danh mục">
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Giá"
              rules={[
                { required: true, message: "Vui lòng nhập giá" },
                {
                  type: "number",
                  min: 0.01,
                  message: "Giá phải lớn hơn 0",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0.01}
                step={0.01}
                precision={2}
                prefix="VNĐ"
              />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <TextArea rows={4} placeholder="Mô tả món ăn..." />
            </Form.Item>

            <Form.Item
              name="prep_time_minutes"
              label="Thời gian chuẩn bị (phút)"
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
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select>
                <Select.Option value="available">Còn hàng</Select.Option>
                <Select.Option value="unavailable">Tạm hết</Select.Option>
                <Select.Option value="sold_out">Hết hàng</Select.Option>
                <Select.Option value="hidden">Ẩn</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="is_chef_recommended"
              label="Đề xuất của đầu bếp"
              valuePropName="checked"
            >
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                size="large"
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: "2",
      label: "Hình ảnh",
      children: (
        <Card>
          <PhotoManager itemId={item.id} initialPhotos={item.photos || []} />
        </Card>
      ),
    },
    {
      key: "3",
      label: "Tùy chọn",
      children: (
        <Card>
          <ModifierAttach
            modifierGroups={modifierGroups}
            selectedIds={attachedModifiers}
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
          Quay lại
        </Button>
        <h2 style={{ margin: 0 }}>Chỉnh sửa món ăn: {item.name}</h2>
      </Space>

      <Tabs defaultActiveKey="1" items={tabItems} />
    </div>
  );
}
