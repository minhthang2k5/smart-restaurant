import { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Pagination,
  Spin,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import * as menuService from "../../services/menuService";

const statusColor = {
  available: "green",
  unavailable: "orange",
  sold_out: "red",
  hidden: "default",
};

export default function MenuItems() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Data states
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("created_at_desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [total, setTotal] = useState(0);

  // Modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [q, categoryId, status, sort, page, pageSize]);

  const fetchCategories = async () => {
    try {
      const response = await menuService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = {
        page,
        limit: pageSize,
      };

      // Add filters
      if (q) params.name = q;
      if (categoryId !== "all") params.category_id = categoryId;
      if (status !== "all") params.status = status;

      // Add sorting
      const [sortField, sortOrder] = sort.split("_");
      params.sort = sortField;
      params.order = sortOrder.toUpperCase();

      const response = await menuService.getMenuItems(params);

      setItems(response.data || []);
      setTotal(response.pagination?.totalItems || 0);
    } catch (error) {
      message.error("Failed to load menu items");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "available" });
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    form.setFieldsValue(item);
    setOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editing) {
        await menuService.updateMenuItem(editing.id, values);
        message.success("Item updated successfully");
      } else {
        await menuService.createMenuItem(values);
        message.success("Item created successfully");
      }

      setOpen(false);
      form.resetFields();
      fetchItems();
    } catch (error) {
      if (error.errorFields) {
        message.error("Please check the form fields");
      } else {
        message.error(
          editing ? "Failed to update item" : "Failed to create item"
        );
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Delete menu item?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          await menuService.deleteMenuItem(id);
          message.success("Item deleted successfully");
          fetchItems();
        } catch (error) {
          message.error("Failed to delete item");
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>Menu Items</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Search by name..."
            prefix={<SearchOutlined />}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1); // Reset to page 1
            }}
            allowClear
          />
          <Space wrap>
            <Select
              style={{ width: 200 }}
              placeholder="Filter by category"
              value={categoryId}
              onChange={(val) => {
                setCategoryId(val);
                setPage(1);
              }}
            >
              <Select.Option value="all">All Categories</Select.Option>
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>

            <Select
              style={{ width: 150 }}
              placeholder="Filter by status"
              value={status}
              onChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="available">Available</Select.Option>
              <Select.Option value="unavailable">Unavailable</Select.Option>
              <Select.Option value="sold_out">Sold Out</Select.Option>
              <Select.Option value="hidden">Hidden</Select.Option>
            </Select>

            <Select
              style={{ width: 180 }}
              placeholder="Sort by"
              value={sort}
              onChange={(val) => {
                setSort(val);
                setPage(1);
              }}
            >
              <Select.Option value="created_at_desc">
                Newest First
              </Select.Option>
              <Select.Option value="created_at_asc">Oldest First</Select.Option>
              <Select.Option value="price_asc">
                Price: Low to High
              </Select.Option>
              <Select.Option value="price_desc">
                Price: High to Low
              </Select.Option>
              <Select.Option value="name_asc">Name: A-Z</Select.Option>
              <Select.Option value="name_desc">Name: Z-A</Select.Option>
            </Select>
          </Space>
        </Space>
      </Card>

      {/* Items Grid */}
      <Spin spinning={loading}>
        {items.length === 0 ? (
          <Empty
            description={
              q || categoryId !== "all" || status !== "all"
                ? "No items match your filters"
                : "No menu items yet. Create one to get started!"
            }
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {items.map((item) => (
                <Col key={item.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/admin/menu-items/${item.id}`)}
                    actions={[
                      <EditOutlined
                        key="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(item);
                        }}
                      />,
                      <DeleteOutlined
                        key="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      />,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Space
                          direction="vertical"
                          size={4}
                          style={{ width: "100%" }}
                        >
                          <span>{item.name}</span>
                          <Space>
                            <Tag color={statusColor[item.status]}>
                              {item.status}
                            </Tag>
                            {item.is_chef_recommended && (
                              <Tag color="gold">Chef's Pick</Tag>
                            )}
                          </Space>
                        </Space>
                      }
                      description={
                        <Space
                          direction="vertical"
                          size={4}
                          style={{ width: "100%" }}
                        >
                          <div style={{ color: "#666", fontSize: 12 }}>
                            {categoryMap[item.category_id] || "Unknown"}
                          </div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: "#1890ff",
                            }}
                          >
                            ${Number(item.price).toFixed(2)}
                          </div>
                          {item.description && (
                            <div
                              style={{
                                fontSize: 13,
                                color: "#999",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                pageSizeOptions={[6, 9, 12, 24]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
                showTotal={(t, range) =>
                  `${range[0]}-${range[1]} of ${t} items`
                }
              />
            </div>
          </>
        )}
      </Spin>

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? "Edit Menu Item" : "Create Menu Item"}
        open={open}
        onOk={onSave}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
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
              { type: "number", min: 0.01, message: "Price must be positive" },
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
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item name="prep_time_minutes" label="Prep Time (minutes)">
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
        </Form>
      </Modal>
    </div>
  );
}
