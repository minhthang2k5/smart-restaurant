import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Alert,
  Button,
  Card,
  List,
  message,
  Tag,
  Badge,
  Spin,
} from "antd";
import {
  ReloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import * as billService from "../../services/billService";
import { formatVND } from "../../utils/currency";

export default function BillRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await billService.getPendingBillRequests();
      const data = res?.data || res;
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to load bill requests"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Real-time updates for new bill requests
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const socketBaseUrl = apiUrl.replace(/\/api\/?$/, "");

    const socket = io(`${socketBaseUrl}/waiter`, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Waiter connected for bill requests");
      socket.emit("join", "waiter");
    });

    socket.on("bill-requested", (data) => {
      console.log("📋 New bill request:", data);
      message.info(`Table ${data.tableNumber} requested bill`);
      loadRequests();
    });

    socket.on("connect_error", (err) => {
      console.error("Waiter socket connect_error:", err?.message || err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeSinceRequest = (requestedAt) => {
    if (!requestedAt) return "";
    const now = new Date();
    const requested = new Date(requestedAt);
    const diffMs = now - requested;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  const handleViewBill = (sessionId) => {
    navigate(`/admin/bill-preview/${sessionId}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FileTextOutlined style={{ fontSize: 24 }} />
              <span style={{ fontSize: 20, fontWeight: 600 }}>
                Bill Requests
              </span>
              <Badge
                count={requests.length}
                style={{ backgroundColor: "#52c41a" }}
              />
            </div>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={loadRequests}
              loading={loading}
            >
              Refresh
            </Button>
          }
        >
          <Spin spinning={loading}>
            {requests.length === 0 ? (
              <Alert
                type="info"
                showIcon
                message="No pending bill requests"
                description="Customers can request bills from their order page. Requests will appear here in real-time."
              />
            ) : (
              <List
                dataSource={requests}
                renderItem={(request) => (
                  <List.Item
                    key={request.sessionId}
                    style={{
                      cursor: "pointer",
                      padding: "16px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fafafa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => handleViewBill(request.sessionId)}
                    actions={[
                      <Button
                        key="view"
                        type="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBill(request.sessionId);
                        }}
                      >
                        View Bill
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{ fontSize: 18, fontWeight: 600 }}
                          >
                            Table {request.tableNumber}
                          </span>
                          {request.location && (
                            <Tag color="blue">{request.location}</Tag>
                          )}
                          <Tag
                            color="orange"
                            icon={<ClockCircleOutlined />}
                          >
                            {getTimeSinceRequest(request.billRequestedAt)}
                          </Tag>
                        </div>
                      }
                      description={
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <div style={{ display: "flex", gap: 16 }}>
                            <span style={{ color: "#666" }}>
                              Session: {request.sessionNumber}
                            </span>
                            <span style={{ color: "#666" }}>
                              Started: {formatDate(request.startedAt)}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 16 }}>
                            <span style={{ color: "#666" }}>
                              Subtotal: {formatVND(request.subtotal || 0)}
                            </span>
                            <span style={{ color: "#666" }}>
                              Tax: {formatVND(request.taxAmount || 0)}
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#52c41a",
                                fontSize: 16,
                              }}
                            >
                              Total: {formatVND(request.totalAmount || 0)}
                            </span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </Card>
      </div>
    </div>
  );
}
