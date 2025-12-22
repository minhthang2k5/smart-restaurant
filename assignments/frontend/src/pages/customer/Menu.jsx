import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Col, Input, Row, Segmented, Space, Tag, Typography } from "antd";
import { useMenu } from "../../context/MenuContext.jsx";

const statusColor = { available: "green", sold_out: "red", hidden: "default" };

export default function Menu() {
  const { categories, items } = useMenu();

  const activeCategories = useMemo(
    () => categories.filter((c) => c.status === "active"),
    [categories]
  );

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const segmentedOptions = useMemo(() => {
    return [
      { label: "All", value: "all" },
      ...activeCategories.map((c) => ({ label: c.name, value: c.id })),
    ];
  }, [activeCategories]);

  const categoryMap = useMemo(() => {
    const m = new Map();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  // Guest rule (UI-only assumption):
  // - category must be active
  // - hide items with status "hidden"
  const filtered = useMemo(() => {
    let arr = [...items];

    // only show items whose category is active
    arr = arr.filter(
      (it) => categoryMap.get(it.categoryId)?.status === "active"
    );

    // hide hidden items
    arr = arr.filter((it) => it.status !== "hidden");

    if (cat !== "all") arr = arr.filter((it) => it.categoryId === cat);

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter(
        (it) =>
          it.name.toLowerCase().includes(s) ||
          (it.description || "").toLowerCase().includes(s)
      );
    }

    return arr;
  }, [items, cat, q, categoryMap]);

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Menu
        </Typography.Title>
        <Typography.Text type="secondary">
          Browse dishes by category, then tap one to see options.
        </Typography.Text>

        <Input
          placeholder="Search dishes..."
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <Segmented
          block
          options={segmentedOptions}
          value={cat}
          onChange={setCat}
        />

        <Row gutter={[16, 16]}>
          {filtered.map((it) => {
            const catName = categoryMap.get(it.categoryId)?.name ?? "Unknown";

            return (
              <Col key={it.id} xs={24} sm={12} lg={8}>
                <Link to={`/menu/${it.id}`} style={{ textDecoration: "none" }}>
                  <Card
                    hoverable
                    title={
                      <Space>
                        <span>{it.name}</span>
                        {it.chefRecommended ? (
                          <Tag color="pink">Chef</Tag>
                        ) : null}
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
                      {it.description ? (
                        <Typography.Paragraph
                          type="secondary"
                          style={{ marginBottom: 0 }}
                          ellipsis={{ rows: 2 }}
                        >
                          {it.description}
                        </Typography.Paragraph>
                      ) : null}
                      <Typography.Text strong>
                        {it.price.toLocaleString()}đ
                      </Typography.Text>

                      {it.status === "sold_out" ? (
                        <Typography.Text type="danger">
                          Sold out
                        </Typography.Text>
                      ) : null}
                    </Space>
                  </Card>
                </Link>
              </Col>
            );
          })}
        </Row>

        {filtered.length === 0 ? (
          <Card>
            <Typography.Text type="secondary">
              No items found. Try another keyword/category.
            </Typography.Text>
          </Card>
        ) : null}
      </Space>
    </div>
  );
}
