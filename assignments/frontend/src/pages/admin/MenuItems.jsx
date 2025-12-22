import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { useMenu } from "../../context/MenuContext.jsx";

const statusColor = { available: "green", sold_out: "red", hidden: "default" };

export default function MenuItems() {
  const { items, categories, addItem, updateItem, deleteItem } = useMenu();

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("createdAt_desc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const categoryMap = useMemo(() => {
    const m = new Map();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    let arr = [...items];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((it) => it.name.toLowerCase().includes(s));
    }
    if (categoryId !== "all")
      arr = arr.filter((it) => it.categoryId === categoryId);
    if (status !== "all") arr = arr.filter((it) => it.status === status);

    const [key, dir] = sort.split("_");
    arr.sort((a, b) => {
      let va = a[key],
        vb = b[key];

      if (key === "price") {
        va = Number(va);
        vb = Number(vb);
      }
      if (key === "createdAt") {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
      }

      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [items, q, categoryId, status, sort]);

  // If filters change -> reset to page 1 (better UX)
  useEffect(() => {
    setPage(1);
  }, [q, categoryId, status, sort]);

  // Ensure page not out of range when filtered list shrinks
  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    form.setFieldsValue({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      price: item.price,
      prepTime: item.prepTime,
      status: item.status,
      chefRecommended: item.chefRecommended,
    });
    setOpen(true);
  }

  function onSave() {
    form.validateFields().then((vals) => {
      const payload = {
        ...vals,
        price: Number(vals.price),
        prepTime: Number(vals.prepTime),
      };
      if (editing) updateItem(editing.id, payload);
      else addItem(payload);
      setOpen(false);
    });
  }

  return (
    <div style={{ padding: 20 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Menu Items
        </Typography.Title>
        <Button type="primary" onClick={openCreate}>
          + Add Menu Item
        </Button>
      </Space>

      {/* Filters */}
      <Card style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Search by name..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} md={6}>
            <Select
              style={{ width: "100%" }}
              value={categoryId}
              onChange={setCategoryId}
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </Col>

          <Col xs={24} md={5}>
            <Select
              style={{ width: "100%" }}
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All Status" },
                { value: "available", label: "Available" },
                { value: "sold_out", label: "Sold out" },
                { value: "hidden", label: "Hidden" },
              ]}
            />
          </Col>

          <Col xs={24} md={5}>
            <Select
              style={{ width: "100%" }}
              value={sort}
              onChange={setSort}
              options={[
                { value: "createdAt_desc", label: "Newest" },
                { value: "createdAt_asc", label: "Oldest" },
                { value: "price_asc", label: "Price: Low → High" },
                { value: "price_desc", label: "Price: High → Low" },
                // UI chuẩn bị cho backend popularity (nếu muốn)
                // { value: "popularity_desc", label: "Popularity (coming soon)" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* List */}
      <Card style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>
          {pagedItems.map((it) => {
            const catName = categoryMap.get(it.categoryId)?.name ?? "Unknown";
            return (
              <Col key={it.id} xs={24} md={12} lg={8}>
                <Card
                  title={
                    <Space>
                      <span>{it.name}</span>
                      {it.chefRecommended ? <Tag color="pink">Chef</Tag> : null}
                    </Space>
                  }
                  extra={
                    <Tag color={statusColor[it.status] || "default"}>
                      {it.status}
                    </Tag>
                  }
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Typography.Text type="secondary">
                      {catName}
                    </Typography.Text>
                    <Typography.Text strong>
                      {it.price.toLocaleString()}đ
                    </Typography.Text>

                    <Space
                      style={{ justifyContent: "space-between", width: "100%" }}
                    >
                      <Link to={`/admin/menu-items/${it.id}`}>Detail</Link>
                      <Space>
                        <Button size="small" onClick={() => openEdit(it)}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() => deleteItem(it.id)}
                        >
                          Delete
                        </Button>
                      </Space>
                    </Space>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Pagination bar */}
        <div
          style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}
        >
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
            showTotal={(t, range) => `${range[0]}-${range[1]} of ${t} items`}
          />
        </div>
      </Card>

      {/* Modal */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSave}
        okText="Save"
        title={editing ? "Edit Menu Item" : "Add Menu Item"}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ status: "available", chefRecommended: false }}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Enter item name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label="Category"
            name="categoryId"
            rules={[{ required: true, message: "Choose category" }]}
          >
            <Select
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Price"
                name="price"
                rules={[{ required: true, message: "Enter price" }]}
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

          <Form.Item
            label="Chef recommended"
            name="chefRecommended"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
