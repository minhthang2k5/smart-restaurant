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
import { formatVND } from "../../utils/currency";

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
      message.error("Tải danh sách món ăn thất bại");
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
        message.success("Cập nhật món ăn thành công");
      } else {
        await menuService.createMenuItem(values);
        message.success("Tạo món ăn thành công");
      }

      setOpen(false);
      form.resetFields();
      fetchItems();
    } catch (error) {
      if (error.errorFields) {
        message.error("Vui lòng kiểm tra các trường nhập liệu");
      } else {
        message.error(
          editing ? "Cập nhật món ăn thất bại" : "Tạo món ăn thất bại"
        );
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xóa món ăn?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          setLoading(true);
          await menuService.deleteMenuItem(id);
          message.success("Xóa món ăn thành công");
          fetchItems();
        } catch (error) {
          message.error("Xóa món ăn thất bại");
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
        <h2>Món Ăn</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm Món
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Tìm kiếm theo tên..."
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
              placeholder="Lọc theo danh mục"
              value={categoryId}
              onChange={(val) => {
                setCategoryId(val);
                setPage(1);
              }}
            >
              <Select.Option value="all">Tất cả danh mục</Select.Option>
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>

            <Select
              style={{ width: 150 }}
              placeholder="Lọc theo trạng thái"
              value={status}
              onChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="available">Còn hàng</Select.Option>
              <Select.Option value="unavailable">Tạm hết</Select.Option>
              <Select.Option value="sold_out">Hết hàng</Select.Option>
              <Select.Option value="hidden">Ẩn</Select.Option>
            </Select>

            <Select
              style={{ width: 180 }}
              placeholder="Sắp xếp"
              value={sort}
              onChange={(val) => {
                setSort(val);
                setPage(1);
              }}
            >
              <Select.Option value="created_at_desc">
                Mới nhất
              </Select.Option>
              <Select.Option value="created_at_asc">Cũ nhất</Select.Option>
              <Select.Option value="price_asc">
                Giá: Thấp đến Cao
              </Select.Option>
              <Select.Option value="price_desc">
                Giá: Cao đến Thấp
              </Select.Option>
              <Select.Option value="name_asc">Tên: A-Z</Select.Option>
              <Select.Option value="name_desc">Tên: Z-A</Select.Option>
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
                ? "Không tìm thấy món ăn phù hợp"
                : "Chưa có món ăn nào. Tạo món mới để bắt đầu!"
            }
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {items.map((item) => {
                const imageUrl = item.primaryPhoto?.url
                  ? item.primaryPhoto.url.startsWith('http')
                    ? item.primaryPhoto.url
                    : `http://localhost:3000${item.primaryPhoto.url}`
                  : null;

                return (
                  <Col key={item.id} xs={24} sm={12} md={8}>
                    <Card
                      onClick={() => navigate(`/admin/menu-items/${item.id}`)}
                      style={{ cursor: "pointer" }}
                      cover={
                        imageUrl ? (
                          <div style={{ height: 200, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                            <img
                              alt={item.name}
                              src={imageUrl}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                              }}
                            />
                          </div>
                        ) : (
                          <div style={{ 
                            height: 200, 
                            backgroundColor: '#f5f5f5', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#bbb'
                          }}>
                            <span>Không có ảnh</span>
                          </div>
                        )
                      }
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
                              <Tag color="gold">Đầu bếp đề xuất</Tag>
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
                            {categoryMap[item.category_id] || "Không xác định"}
                          </div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: "#1890ff",
                            }}
                          >
                            {formatVND(item.price)}
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
                );
              })}
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
                  `${range[0]}-${range[1]} trong ${t} món`
                }
              />
            </div>
          </>
        )}
      </Spin>

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? "Chỉnh sửa món ăn" : "Tạo món ăn mới"}
        open={open}
        onOk={onSave}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        okText={editing ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        width={600}
      >
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
              { type: "number", min: 0.01, message: "Giá phải lớn hơn 0" },
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

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả món ăn (không bắt buộc)" />
          </Form.Item>

          <Form.Item name="prep_time_minutes" label="Thời gian chuẩn bị (phút)">
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
        </Form>
      </Modal>
    </div>
  );
}
