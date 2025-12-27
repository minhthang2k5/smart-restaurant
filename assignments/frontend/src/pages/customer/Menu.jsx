import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Input,
  Segmented,
  Tag,
  Space,
  Empty,
  Spin,
  message,
} from "antd";
import {
  SearchOutlined,
  StarFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import * as menuService from "../../services/menuService";

const { Meta } = Card;

const statusColor = {
  available: "green",
  unavailable: "orange",
  sold_out: "red",
};

export default function Menu() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );

  // Fetch data on mount
  useEffect(() => {
    setLoading(true);
    fetchCategories().finally(() => setLoading(false));
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (selectedCategory !== "all") params.category = selectedCategory;
    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, setSearchParams]);

  const fetchCategories = async () => {
    try {
      const response = await menuService.getPublicMenu({
        status: "available", // Only show available items
      });
      // Backend returns { data: { categories, items } }
      setCategories(response.data?.categories || []);
      setItems(response.data?.items || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      message.error("Failed to load menu");
    }
  };

  const fetchItems = async () => {
    // Items are already fetched in fetchCategories
    // This function is now a no-op or can be removed
  };

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) => item.category_id === selectedCategory
      );
    }

    // Filter by search query
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    // Hide "hidden" status items
    filtered = filtered.filter((item) => item.status !== "hidden");

    return filtered;
  }, [items, selectedCategory, search]);

  // Category options for Segmented control
  const categoryOptions = [
    { label: "All", value: "all" },
    ...categories.map((cat) => ({
      label: cat.name,
      value: cat.id,
    })),
  ];

  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : "Unknown";
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#f5f5f5", padding: "24px 0" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Our Menu</h1>
          <p style={{ color: "#666", fontSize: 16 }}>
            Browse our delicious selection
          </p>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Search */}
            <Input
              size="large"
              placeholder="Search menu items..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />

            {/* Category Filter */}
            <div>
              <div style={{ marginBottom: 12, fontWeight: 500 }}>
                Filter by Category:
              </div>
              <Segmented
                options={categoryOptions}
                value={selectedCategory}
                onChange={setSelectedCategory}
                block
              />
            </div>
          </Space>
        </Card>

        {/* Items Grid */}
        <Spin spinning={loading}>
          {filteredItems.length === 0 ? (
            <Empty
              description={
                search || selectedCategory !== "all"
                  ? "No items match your filters"
                  : "No menu items available"
              }
              style={{ marginTop: 60 }}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredItems.map((item) => (
                <Col key={item.id} xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/menu/${item.id}`)}
                    style={{
                      height: "100%",
                      opacity: item.status === "sold_out" ? 0.6 : 1,
                    }}
                  >
                    {/* Category & Status Tags */}
                    <Space
                      style={{
                        marginBottom: 12,
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Tag color="blue">
                        {getCategoryName(item.category_id)}
                      </Tag>
                      <Tag color={statusColor[item.status]}>
                        {item.status.replace("_", " ").toUpperCase()}
                      </Tag>
                    </Space>

                    {/* Item Info */}
                    <Meta
                      title={
                        <Space>
                          <span>{item.name}</span>
                          {item.is_chef_recommended && (
                            <StarFilled style={{ color: "#faad14" }} />
                          )}
                        </Space>
                      }
                      description={
                        <Space
                          direction="vertical"
                          size={8}
                          style={{ width: "100%" }}
                        >
                          {/* Description */}
                          {item.description && (
                            <div
                              style={{
                                color: "#666",
                                fontSize: 13,
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

                          {/* Prep Time */}
                          {item.prep_time_minutes > 0 && (
                            <div style={{ color: "#999", fontSize: 12 }}>
                              <ClockCircleOutlined /> {item.prep_time_minutes}{" "}
                              mins
                            </div>
                          )}

                          {/* Price */}
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: "bold",
                              color: "#1890ff",
                            }}
                          >
                            ${Number(item.price).toFixed(2)}
                          </div>

                          {/* Chef's Pick Badge */}
                          {item.is_chef_recommended && (
                            <Tag color="gold" icon={<StarFilled />}>
                              Chef's Pick
                            </Tag>
                          )}

                          {/* Sold Out Warning */}
                          {item.status === "sold_out" && (
                            <Tag color="red">SOLD OUT</Tag>
                          )}
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </div>
    </div>
  );
}
