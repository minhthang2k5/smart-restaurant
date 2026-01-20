import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Button,
  Card,
  Descriptions,
  Input,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  Typography,
  message,
} from "antd";
import {
  acceptOrder,
  getOrders,
  rejectOrder,
  updateOrderStatus,
} from "../../services/waiterOrderService";
import { useAuth } from "../../contexts/AuthContext";
import { formatVND } from "../../utils/currency";

const STATUS_TABS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Received" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
];

const statusToColor = (status) => {
  switch (status) {
    case "pending":
      return "gold";
    case "accepted":
      return "blue";
    case "preparing":
      return "processing";
    case "ready":
      return "green";
    case "served":
      return "cyan";
    case "completed":
      return "success";
    case "rejected":
      return "red";
    default:
      return "default";
  }
};

const getUserId = (user) => user?.id || user?.data?.id || user?.user?.id;

const isNewOrder = (order) => {
  if (!order?.created_at) return false;
  if (order?.status !== "pending") return false;
  const createdAt = new Date(order.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= 2 * 60 * 1000;
};

const formatMoney = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return formatVND(0);
  return formatVND(num);
};

const statusLabel = (status) => {
  if (!status) return "Unknown";
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderSortBy, setOrderSortBy] = useState("created_desc");

  const waiterId = useMemo(() => getUserId(user), [user]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ status: "all", limit });

      const payload = res?.data || res;
      setOrders(payload || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Real-time updates (Waiter namespace): refresh orders when new orders or status changes happen.
  // Docs: /waiter emits new-order, order-ready, order-status-updated.
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const socketBaseUrl = apiUrl.replace(/\/api\/?$/, "");

    let refreshTimerId;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimerId);
      refreshTimerId = window.setTimeout(() => {
        fetchOrders();
      }, 200);
    };

    const socket = io(`${socketBaseUrl}/waiter`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    socket.on("connected", scheduleRefresh);
    socket.on("new-order", scheduleRefresh);
    socket.on("order-ready", scheduleRefresh);
    socket.on("order-status-updated", scheduleRefresh);

    socket.on("connect_error", (err) => {
      console.error("Waiter socket connect_error:", err?.message || err);
    });

    return () => {
      window.clearTimeout(refreshTimerId);
      socket.off("connected", scheduleRefresh);
      socket.off("new-order", scheduleRefresh);
      socket.off("order-ready", scheduleRefresh);
      socket.off("order-status-updated", scheduleRefresh);
      socket.disconnect();
    };
  }, [fetchOrders]);

  const runOrderAction = useCallback(
    async (orderId, action, fn) => {
      setActionLoading((prev) => ({ ...prev, [orderId]: action }));
      try {
        const res = await fn();
        const payload = res?.data || res;
        if (payload?.message) message.success(payload.message);
        await fetchOrders();
      } catch (err) {
        message.error(err?.response?.data?.message || "Action failed");
      } finally {
        setActionLoading((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
      }
    },
    [fetchOrders]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const counts = useMemo(() => {
    const byStatus = (status) =>
      orders.filter((o) => (status ? o?.status === status : true)).length;

    return {
      all: orders.length,
      pending: byStatus("pending"),
      preparing: byStatus("preparing"),
      ready: byStatus("ready"),
      completed: byStatus("completed"),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const tableQuery = tableFilter.trim().toLowerCase();

    // Determine time range based on filter
    let startTime = null;
    let endTime = null;
    const now = new Date();

    if (timeFilter === "today") {
      // Today: from 00:00:00 to 23:59:59 today
      startTime = new Date(now);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(now);
      endTime.setHours(23, 59, 59, 999);
    } else if (timeFilter === "yesterday") {
      // Yesterday: from 00:00:00 to 23:59:59 yesterday
      startTime = new Date(now);
      startTime.setDate(startTime.getDate() - 1);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(startTime);
      endTime.setHours(23, 59, 59, 999);
    } else if (timeFilter === "week") {
      // Last 7 days
      startTime = new Date(now);
      startTime.setDate(startTime.getDate() - 7);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(now);
      endTime.setHours(23, 59, 59, 999);
    } else if (timeFilter === "month") {
      // Last 30 days
      startTime = new Date(now);
      startTime.setDate(startTime.getDate() - 30);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(now);
      endTime.setHours(23, 59, 59, 999);
    }
    // else timeFilter === "all": no time restriction

    // Filter orders
    const filtered = orders.filter((o) => {
      // Filter by status tab
      if (activeTab !== "all" && o?.status !== activeTab) return false;

      // Filter by search text (order number or table number)
      if (query) {
        const orderNumber = (o?.order_number || "").toLowerCase();
        const tableNumber = (o?.table?.table_number || "").toLowerCase();
        if (!orderNumber.includes(query) && !tableNumber.includes(query)) {
          return false;
        }
      }

      // Filter by table
      if (tableQuery) {
        const tableId = (o?.table?.id || "").toLowerCase();
        const tableNumber = (o?.table?.table_number || "").toLowerCase();
        if (!tableId.includes(tableQuery) && !tableNumber.includes(tableQuery)) {
          return false;
        }
      }

      // Filter by time range
      if (startTime && endTime) {
        // Support both createdAt (camelCase) and created_at (snake_case)
        const createdAtValue = o?.createdAt || o?.created_at;
        const createdAt = createdAtValue ? new Date(createdAtValue) : null;
        
        // If no valid created_at, exclude from specific time filters
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
          return false;
        }
        return createdAt >= startTime && createdAt <= endTime;
      }

      // For "all" filter or when no time filter, include all orders
      return true;
    });

    // Sort filtered orders
    return filtered.sort((a, b) => {
      switch (orderSortBy) {
        case "created_asc":
          // Oldest first - support both createdAt and created_at
          return new Date(a.createdAt || a.created_at || 0) - new Date(b.createdAt || b.created_at || 0);
        case "created_desc":
          // Newest first - support both createdAt and created_at
          return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0);
        case "price_asc":
          // Price: Low to High
          return (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
        case "price_desc":
          // Price: High to Low
          return (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0);
        case "popularity": {
          // Sort by frequency of items across all orders
          // Count how many times each item appears in all orders
          const itemFrequency = {};
          filtered.forEach(order => {
            const items = Array.isArray(order.items) ? order.items : [];
            items.forEach(item => {
              const itemName = item?.item_name || item?.menuItem?.name || '';
              if (itemName) {
                itemFrequency[itemName] = (itemFrequency[itemName] || 0) + 1;
              }
            });
          });
          
          // Get the most frequently ordered item in each order
          const getMostFrequentItem = (order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            if (items.length === 0) return { name: '', frequency: 0 };
            
            let mostFrequent = items[0];
            let maxFreq = itemFrequency[mostFrequent?.item_name || mostFrequent?.menuItem?.name || ''] || 0;
            
            for (const item of items) {
              const itemName = item?.item_name || item?.menuItem?.name || '';
              const freq = itemFrequency[itemName] || 0;
              if (freq > maxFreq) {
                maxFreq = freq;
                mostFrequent = item;
              }
            }
            
            return {
              name: mostFrequent?.item_name || mostFrequent?.menuItem?.name || '',
              frequency: maxFreq
            };
          };
          
          const itemA = getMostFrequentItem(a);
          const itemB = getMostFrequentItem(b);
          
          // First sort by frequency (highest first)
          if (itemB.frequency !== itemA.frequency) {
            return itemB.frequency - itemA.frequency;
          }
          
          // Then sort by item name to group same items together
          return itemA.name.localeCompare(itemB.name);
        }
        default:
          // Default: newest first
          return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0);
      }
    });
  }, [activeTab, orders, searchText, tableFilter, timeFilter, orderSortBy]);

  const columns = useMemo(
    () => [
      {
        title: "Order ID",
        dataIndex: "order_number",
        key: "order_number",
        width: 140,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{record?.order_number || "—"}</Typography.Text>
            {isNewOrder(record) ? (
              <Tag color="gold" style={{ width: "fit-content" }}>
                New
              </Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: "Table",
        dataIndex: "table",
        key: "table",
        width: 120,
        render: (table) =>
          table?.table_number ? (
            <Space direction="vertical" size={0}>
              <Typography.Text>{table.table_number}</Typography.Text>
              {table.location ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {table.location}
                </Typography.Text>
              ) : null}
            </Space>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (status) => (
          <Tag color={statusToColor(status)} style={{ textTransform: "capitalize" }}>
            {status || "unknown"}
          </Tag>
        ),
      },
      {
        title: "Items",
        dataIndex: "items",
        key: "items",
        width: 180,
        render: (items) => {
          const safeItems = Array.isArray(items) ? items : [];
          const preview = safeItems.slice(0, 2);
          const remaining = safeItems.length - preview.length;

          if (safeItems.length === 0) {
            return <Typography.Text type="secondary">—</Typography.Text>;
          }

          return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {preview.map((it) => {
                const modifiers = Array.isArray(it?.modifiers) ? it.modifiers : [];
                const hasModifiers = modifiers.length > 0;
                const hasNote = it?.special_instructions && it.special_instructions.trim().length > 0;
                
                return (
                  <div key={it?.id} style={{ width: '100%' }}>
                    <Typography.Text style={{ fontSize: 13, display: 'block' }}>
                      {it?.quantity || 1}x {it?.item_name || "Item"}
                    </Typography.Text>
                    {(hasModifiers || hasNote) && (
                      <div style={{ marginTop: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {hasModifiers && (
                          <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                            {modifiers.length} Modifier{modifiers.length > 1 ? 's' : ''}
                          </Tag>
                        )}
                        {hasNote && (
                          <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>
                            ✎ Special Note
                          </Tag>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {remaining > 0 && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  +{remaining} more item{remaining > 1 ? 's' : ''}
                </Typography.Text>
              )}
            </Space>
          );
        },
      },
      {
        title: "Total",
        dataIndex: "total_amount",
        key: "total_amount",
        width: 100,
        render: (v) => <Typography.Text>{formatMoney(v)}</Typography.Text>,
      },
      {
        title: "Time",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 120,
        render: (v, record) => {
          const dateValue = v || record.created_at;
          if (!dateValue) return <Typography.Text type="secondary">—</Typography.Text>;
          const date = new Date(dateValue);
          const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text style={{ fontWeight: 600 }}>{timeStr}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>{dateStr}</Typography.Text>
            </Space>
          );
        },
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 300,
        render: (_, record) => {
          const action = actionLoading[record.id];
          const isBusy = Boolean(action);

          return (
            <Space>
              {record.status === "pending" ? (
                <>
                  <Button
                    type="primary"
                    loading={isBusy && action === "accept"}
                    onClick={() =>
                      runOrderAction(record.id, "accept", () =>
                        acceptOrder(record.id, waiterId)
                      )
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    danger
                    loading={isBusy && action === "reject"}
                    onClick={() => {
                      setRejectingOrder(record);
                      setRejectReason("");
                    }}
                  >
                    Reject
                  </Button>
                </>
              ) : null}

              {record.status === "ready" ? (
                <Button
                  loading={isBusy && action === "served"}
                  onClick={() =>
                    runOrderAction(record.id, "served", () =>
                      updateOrderStatus(record.id, "served")
                    )
                  }
                >
                  Mark Served
                </Button>
              ) : null}

              <Button onClick={() => setViewingOrder(record)}>View</Button>
            </Space>
          );
        },
      },
    ],
    [actionLoading, runOrderAction, waiterId]
  );

  return (
    <div className="p-6">
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Orders
            </Typography.Title>
            <Typography.Text type="secondary">
              Manage and track all orders
            </Typography.Text>
          </div>

          <Space>
            <Button type="default" onClick={() => navigate("/admin/kds")}>
              Open KDS
            </Button>
            <Button disabled type="primary">
              + Manual Order
            </Button>
            <Button onClick={fetchOrders} loading={loading}>
              Refresh
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={STATUS_TABS.map((t) => ({
              key: t.key,
              label: (
                <Space size={8}>
                  <span>{t.label}</span>
                  <Tag
                    color={
                      t.key === "pending"
                        ? "gold"
                        : t.key === "ready"
                          ? "green"
                          : t.key === "preparing"
                            ? "processing"
                            : "default"
                    }
                  >
                    {counts[t.key] ?? 0}
                  </Tag>
                </Space>
              ),
            }))}
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by order ID or table..."
            style={{ width: 360 }}
            allowClear
          />

          <Input
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            placeholder="Filter by table ID or table number"
            style={{ width: 320 }}
            allowClear
          />

          <Select
            value={timeFilter}
            onChange={setTimeFilter}
            options={[
              { value: "today", label: "Today" },
              { value: "yesterday", label: "Yesterday" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "all", label: "All Time" },
            ]}
            style={{ width: 180 }}
          />

          <Select
            value={limit}
            onChange={setLimit}
            options={[
              { value: 20, label: "Limit 20" },
              { value: 50, label: "Limit 50" },
              { value: 100, label: "Limit 100" },
            ]}
            style={{ width: 140 }}
          />

          <Select
            value={orderSortBy}
            onChange={setOrderSortBy}
            style={{ width: 200 }}
            placeholder="Sort by"
          >
            <Select.Option value="created_desc">Newest First</Select.Option>
            <Select.Option value="created_asc">Oldest First</Select.Option>
            <Select.Option value="price_desc">Price: High to Low</Select.Option>
            <Select.Option value="price_asc">Price: Low to High</Select.Option>
            <Select.Option value="popularity">Popularity</Select.Option>
          </Select>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredOrders}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          onRow={(record) => {
            if (!isNewOrder(record)) return {};
            return {
              style: {
                background: "rgba(250, 204, 21, 0.12)",
              },
            };
          }}
        />
      </Card>

      <Modal
        title={`Reject ${rejectingOrder?.order_number || "order"}`}
        open={Boolean(rejectingOrder)}
        onCancel={() => setRejectingOrder(null)}
        okText="Reject"
        okButtonProps={{ danger: true }}
        onOk={async () => {
          if (!rejectingOrder) return;
          await runOrderAction(rejectingOrder.id, "reject", () =>
            rejectOrder(rejectingOrder.id, rejectReason, waiterId)
          );
          setRejectingOrder(null);
        }}
      >
        <Typography.Paragraph type="secondary">
          Provide a reason (optional).
        </Typography.Paragraph>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={4}
          placeholder="Ingredient not available"
        />
      </Modal>

      <Modal
        title={viewingOrder?.order_number || "Order"}
        open={Boolean(viewingOrder)}
        onCancel={() => setViewingOrder(null)}
        footer={[
          <Button key="close" onClick={() => setViewingOrder(null)}>
            Close
          </Button>,
        ]}
      >
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Status">
            <Tag color={statusToColor(viewingOrder?.status)}>
              {statusLabel(viewingOrder?.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Table">
            {viewingOrder?.table?.table_number || viewingOrder?.table?.id || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {(() => {
              const dateValue = viewingOrder?.createdAt || viewingOrder?.created_at;
              if (!dateValue) return "—";
              const date = new Date(dateValue);
              if (isNaN(date.getTime())) return "—";
              return date.toLocaleString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              });
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="Total">
            {formatMoney(viewingOrder?.total_amount)}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            Items
          </Typography.Title>
          <List
            dataSource={Array.isArray(viewingOrder?.items) ? viewingOrder.items : []}
            locale={{ emptyText: "No items" }}
            renderItem={(it) => {
              const modifiers = Array.isArray(it?.modifiers) ? it.modifiers : [];
              const hasModifiers = modifiers.length > 0;
              const hasNote = it?.special_instructions && it.special_instructions.trim().length > 0;
              
              return (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Typography.Text strong>
                          {it?.quantity || 1}x {it?.item_name || "Item"}
                        </Typography.Text>
                        <Tag color={statusToColor(it?.status)}>{it?.status || "—"}</Tag>
                      </Space>
                    }
                    description={
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Display modifiers */}
                        {hasModifiers && (
                          <div style={{ 
                            padding: '6px 10px', 
                            background: '#e6f7ff', 
                            borderLeft: '3px solid #1890ff',
                            borderRadius: 4
                          }}>
                            <div style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, marginBottom: 4 }}>
                              OPTIONS:
                            </div>
                            <div style={{ fontSize: 13, color: "#666" }}>
                              {modifiers.map((mod, idx) => (
                                <span key={idx}>
                                  {mod.option_name || mod.name || 'Unknown'}
                                  {mod.price_adjustment > 0 && ` (+${formatMoney(mod.price_adjustment)})`}
                                  {idx < modifiers.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Display special instructions */}
                        {hasNote && (
                          <div style={{ 
                            padding: '6px 10px', 
                            background: '#f9f0ff', 
                            borderLeft: '3px solid #9b59b6',
                            borderRadius: 4
                          }}>
                            <div style={{ fontSize: 12, color: '#9b59b6', fontWeight: 600, marginBottom: 4 }}>
                              ✎ SPECIAL NOTE:
                            </div>
                            <div style={{ fontSize: 13, color: "#9b59b6", fontStyle: "italic", fontWeight: 500 }}>
                              {it.special_instructions}
                            </div>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
