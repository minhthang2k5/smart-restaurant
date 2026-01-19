import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
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
  Pagination,
} from "antd";
import {
  SearchOutlined,
  StarFilled,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import * as menuService from "../../services/menuService";
import * as cartService from "../../services/cartService";
import * as sessionService from "../../services/sessionService";
import tableService from "../../services/tableService";
import { formatVND } from "../../utils/currency";

const { Meta } = Card;

const statusColor = {
  available: "green",
  unavailable: "orange",
  sold_out: "red",
};

export default function Menu() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTableId = searchParams.get("tableId") || searchParams.get("table");
  const urlToken = searchParams.get("token");
  const sessionInitKeyRef = useRef(null);

  // State
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(() => cartService.getLocalCartCount());
  const [isPostPaymentMode, setIsPostPaymentMode] = useState(
    () => localStorage.getItem("postPaymentMode") === "true"
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Function to start a new order (clear post-payment mode)
  const handleStartNewOrder = async () => {
    const tableId = localStorage.getItem("tableId");
    if (!tableId) {
      message.error("No table context. Please scan QR code again.");
      return;
    }

    try {
      // Clear post-payment mode
      localStorage.removeItem("postPaymentMode");
      localStorage.removeItem("postPaymentTableId");
      localStorage.removeItem("sessionId");
      setIsPostPaymentMode(false);

      // Create new session
      const created = await sessionService.createSession({ tableId });
      const session = created.data || created;
      if (session?.id) {
        localStorage.setItem("sessionId", session.id);
        message.success("New order started!");
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to start new order");
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await menuService.getPublicMenu({
        status: "available", // Only show available items
      });
      // Backend returns { data: { categories, items } }
      setCategories(response.data?.categories || []);
      setItems(response.data?.items || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      message.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );

  // Fetch data on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (selectedCategory !== "all") params.category = selectedCategory;

    // Preserve table context (QR uses ?table=...) and token
    const tableId = urlTableId || localStorage.getItem("tableId");
    if (tableId) params.table = tableId;
    if (urlToken) params.token = urlToken;

    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, setSearchParams, urlTableId, urlToken]);

  // Keep cart badge fresh
  useEffect(() => {
    const update = () => setCartCount(cartService.getLocalCartCount());
    update();

    window.addEventListener("cart:updated", update);
    window.addEventListener("focus", update);

    return () => {
      window.removeEventListener("cart:updated", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  // If tableId is present, create/get session and store sessionId
  // SMART CHECK: Detect post-payment mode vs ordering mode
  useEffect(() => {
    let cancelled = false;

    // Prevent duplicate initialization in React 18 StrictMode (dev)
    const key = `${urlTableId || ""}:${urlToken || ""}`;
    if (sessionInitKeyRef.current === key) return;
    sessionInitKeyRef.current = key;

    const ensureSession = async () => {
      const tableIdFromUrl = urlTableId;
      const tokenFromUrl = urlToken;

      // Check if we're in post-payment mode (just completed payment on this device)
      const postPaymentMode = localStorage.getItem("postPaymentMode");
      const postPaymentTableId = localStorage.getItem("postPaymentTableId");
      
      // If in post-payment mode and same table, don't create new session
      // User is just browsing menu after payment - show view-only mode
      if (postPaymentMode === "true") {
        const currentTableId = tableIdFromUrl || localStorage.getItem("tableId");
        if (currentTableId === postPaymentTableId) {
          // Still in post-payment mode for same table - don't create session
          // The "Order Again" button will clear this flag when user wants to start fresh
          return;
        } else {
          // Different table - clear post-payment mode and proceed normally
          localStorage.removeItem("postPaymentMode");
          localStorage.removeItem("postPaymentTableId");
        }
      }

      if (tableIdFromUrl) localStorage.setItem("tableId", String(tableIdFromUrl));
      if (tokenFromUrl) localStorage.setItem("qrToken", String(tokenFromUrl));

      let tableId = tableIdFromUrl || localStorage.getItem("tableId");
      if (!tableId && !tokenFromUrl) return;

      // If QR token is present, verify it and trust table id from server
      try {
        if (tokenFromUrl) {
          const verified = await tableService.verifyQRToken(tokenFromUrl);
          const verifiedTableId = verified?.data?.table?.id;
          if (verifiedTableId) {
            tableId = String(verifiedTableId);
            localStorage.setItem("tableId", tableId);
          }
        }
      } catch (error) {
        if (cancelled) return;
        message.error(
          error?.response?.data?.message ||
            "This QR code is invalid or has expired. Please ask staff for assistance."
        );
        localStorage.removeItem("tableId");
        localStorage.removeItem("sessionId");
        return;
      }

      if (!tableId) return;

      // SMART SESSION CHECK: Get both active and recent completed sessions
      try {
        const checkResult = await sessionService.checkTableSessionStatus(tableId);
        const { active, recentCompleted } = checkResult.data || checkResult;
        if (cancelled) return;

        // Case 1: Active session exists - use it
        if (active?.id) {
          localStorage.setItem("sessionId", active.id);
          localStorage.removeItem("postPaymentMode");
          localStorage.removeItem("postPaymentTableId");
          setIsPostPaymentMode(false);
          return;
        }

        // Case 2: No active session, but recently completed session exists
        // Check if this device had this session (stored sessionId matches)
        const storedSessionId = localStorage.getItem("sessionId");
        if (recentCompleted?.id && storedSessionId === recentCompleted.id) {
          // This device just completed payment - enter post-payment mode
          localStorage.setItem("postPaymentMode", "true");
          localStorage.setItem("postPaymentTableId", tableId);
          setIsPostPaymentMode(true);
          return;
        }

        // Case 3: No active session, no matching recent session - create new
        // (This handles: new customer, or different device scanning after payment)
        const created = await sessionService.createSession({ tableId });
        const session = created.data || created;
        if (cancelled) return;
        if (session?.id) {
          localStorage.setItem("sessionId", session.id);
          localStorage.removeItem("postPaymentMode");
          localStorage.removeItem("postPaymentTableId");
          setIsPostPaymentMode(false);
        }
      } catch (error) {
        console.error("Session check/create error:", error);
      }
    };

    ensureSession();
    return () => {
      cancelled = true;
    };
  }, [urlTableId, urlToken]);

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Get items for current page
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, pageSize]);

  // Total count for pagination
  const totalItems = filteredItems.length;

  // Category options
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

        {/* Post-Payment Mode Banner */}
        {isPostPaymentMode && (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            message="Payment Completed!"
            description={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <span>Thank you for dining with us. Would you like to order more?</span>
                <Button type="primary" onClick={handleStartNewOrder}>
                  Order Again
                </Button>
              </div>
            }
            style={{ marginBottom: 24 }}
            showIcon
          />
        )}

        {/* Customer actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <Button icon={<ProfileOutlined />} onClick={() => navigate("/orders")}>
            My Orders
          </Button>
          <Badge count={cartCount} size="small">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate("/cart")}
            >
              Cart
            </Button>
          </Badge>
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
              <div 
                style={{ 
                  display: "flex", 
                  gap: 8,
                  overflowX: "auto",
                  overflowY: "hidden",
                  paddingBottom: 8,
                  scrollbarWidth: "thin",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {categoryOptions.map((cat) => (
                  <Button
                    key={cat.value}
                    type={selectedCategory === cat.value ? "primary" : "default"}
                    size="large"
                    onClick={() => setSelectedCategory(cat.value)}
                    style={{
                      flexShrink: 0,
                      minWidth: 100,
                      height: 48,
                      fontWeight: selectedCategory === cat.value ? 600 : 400
                    }}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
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
              {paginatedItems.map((item) => (
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
                            {formatVND(item.price)}
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

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div 
            style={{ 
              marginTop: 32, 
              marginBottom: 24,
              display: "flex", 
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalItems}
              onChange={(page, newPageSize) => {
                setCurrentPage(page);
                if (newPageSize !== pageSize) {
                  setPageSize(newPageSize);
                  setCurrentPage(1);
                }
              }}
              showSizeChanger
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
              pageSizeOptions={[6, 12, 24, 48]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
