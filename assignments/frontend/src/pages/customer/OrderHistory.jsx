import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  List,
  Typography,
  Spin,
  message,
  Empty,
  Tag,
  Space,
  Divider,
  Button,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import * as sessionService from "../../services/sessionService";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { formatVND } from "../../utils/currency";

const { Title, Text } = Typography;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};

const formatMoney = (value) => formatVND(value);

export default function OrderHistory() {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await sessionService.getMySessionHistory();
      const data = response?.data || [];
      setSessions(data);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to load order history"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customer) {
      message.warning("Please log in to view order history");
      navigate("/customer/login");
      return;
    }
    fetchHistory();
  }, [customer, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Space
        style={{ width: "100%", marginBottom: "20px" }}
        direction="vertical"
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/menu")}
        >
          Back to Menu
        </Button>
        <Title level={2}>Order History</Title>
      </Space>

      {sessions.length === 0 ? (
        <Empty description="No past orders found" />
      ) : (
        <List
          dataSource={sessions}
          renderItem={(session) => {
            const orders = session.orders || [];
            // Calculate total from orders if session total is 0
            let totalAmount = Number(session.total_amount) || 0;
            if (totalAmount === 0) {
              totalAmount = orders.reduce((sum, order) => {
                return sum + Number(order.total_amount || 0);
              }, 0);
            }
            const itemCount = orders.reduce((sum, order) => {
              return sum + (order.items?.length || 0);
            }, 0);

            return (
              <Card
                key={session.id}
                style={{ marginBottom: "16px" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <Tag color={session.status === "completed" ? "green" : "orange"}>
                      {session.status?.toUpperCase()}
                    </Tag>
                    <Text strong>
                      Table {session.table?.table_number || "N/A"}
                    </Text>
                  </Space>

                  <Space>
                    <CalendarOutlined />
                    <Text type="secondary">
                      {formatDate(session.completed_at || session.created_at)}
                    </Text>
                  </Space>

                  <Space>
                    <ShoppingOutlined />
                    <Text>{itemCount} item(s) ordered</Text>
                  </Space>

                  <Divider style={{ margin: "8px 0" }} />

                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <Text type="secondary">Total Amount:</Text>
                    <Text strong style={{ fontSize: "16px" }}>
                      <DollarOutlined /> {formatMoney(totalAmount)}
                    </Text>
                  </Space>

                  {orders.length > 0 && (
                    <div>
                      <Text type="secondary">Items:</Text>
                      <div style={{ marginTop: "8px" }}>
                        {orders.map((order) =>
                          (order.items || []).map((item) => (
                            <div key={item.id} style={{ marginBottom: "8px", padding: "8px", background: "#f9f9f9", borderRadius: "4px" }}>
                              <div style={{ fontWeight: 600 }}>
                                {item.menuItem?.name || "Unknown"} x{item.quantity}
                              </div>
                              {Array.isArray(item?.modifiers) && item.modifiers.length > 0 && (
                                <div style={{ color: "#3498db", fontSize: 12, marginTop: 4 }}>
                                  + {item.modifiers.map((mod, idx) => (
                                    <span key={idx}>
                                      {mod.option_name || mod.name || 'Unknown'}
                                      {mod.price_adjustment > 0 && ` (+${formatVND(mod.price_adjustment)})`}
                                      {idx < item.modifiers.length - 1 && ", "}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item?.special_instructions && item.special_instructions.trim().length > 0 && (
                                <div style={{ color: "#9b59b6", fontSize: 12, marginTop: 4, fontStyle: "italic", fontWeight: 600 }}>
                                  ✎ {item.special_instructions}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </Space>
              </Card>
            );
          }}
        />
      )}
    </div>
  );
}
