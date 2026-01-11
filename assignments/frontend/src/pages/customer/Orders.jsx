import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Divider,
  List,
  message,
  Modal,
  Radio,
  Spin,
  Tag,
} from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import * as orderService from "../../services/orderService";
import * as sessionService from "../../services/sessionService";
import * as cartService from "../../services/cartService";

const readTableId = () => localStorage.getItem("tableId");
const readSessionId = () => localStorage.getItem("sessionId");

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [session, setSession] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("cash");

  const urlTableId = searchParams.get("tableId") || searchParams.get("table");
  const tableId = urlTableId || readTableId();

  useEffect(() => {
    if (urlTableId) localStorage.setItem("tableId", String(urlTableId));
  }, [urlTableId]);

  const loadAll = useCallback(async () => {
    if (!tableId) {
      message.warning(
        "Missing tableId. Please scan QR or open menu with ?table=... (or ?tableId=...)."
      );
      return;
    }

    try {
      setLoading(true);

      // Orders
      const o = await orderService.getOrdersByTable(tableId);
      const list = o.data || o.orders || o;
      const normalized = Array.isArray(list)
        ? list
        : Array.isArray(list?.orders)
        ? list.orders
        : [];
      setOrders(normalized);

      // Active session (optional)
      try {
        const s = await sessionService.getActiveSessionByTable(tableId);
        setSession(s.data || s);
        const id = (s.data || s)?.id;
        if (id) localStorage.setItem("sessionId", id);
      } catch (e) {
        if (e?.response?.status === 404) {
          setSession(null);
        } else {
          console.error(e);
        }
      }
    } catch (error) {
      message.error("Failed to load orders");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openOrderDetail = async (orderId) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      const res = await orderService.getOrderById(orderId);
      setSelectedOrder(res.data || res);
    } catch (error) {
      message.error("Failed to load order detail");
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    const sessionId = session?.id || readSessionId();
    if (!sessionId) {
      message.error("No active session found");
      return;
    }

    try {
      setLoading(true);
      await sessionService.completeSession(sessionId, { paymentMethod });

      message.success("Session completed successfully");
      localStorage.removeItem("sessionId");
      cartService.clearLocalCart();

      await loadAll();
      navigate("/menu");
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to complete session");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "24px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/menu")}>
            Back to Menu
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadAll}>
            Refresh
          </Button>
        </div>

        <Divider />

        {!tableId && (
          <Alert
            type="warning"
            showIcon
            message="Missing tableId"
            description="Open the menu with ?tableId=... or scan QR again."
          />
        )}

        <Spin spinning={loading}>
          <Card title="Active Session" style={{ marginBottom: 16 }}>
            {!session ? (
              <Alert type="info" showIcon message="No active session" />
            ) : (
              <>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#666" }}>Session:</div>
                    <div style={{ fontWeight: 600 }}>{session.session_number || session.id}</div>
                  </div>
                  <div>
                    <div style={{ color: "#666" }}>Status:</div>
                    <Tag color={session.status === "active" ? "green" : "default"}>
                      {String(session.status || "unknown").toUpperCase()}
                    </Tag>
                  </div>
                  <div>
                    <div style={{ color: "#666" }}>Payment:</div>
                    <Tag color={session.payment_status === "paid" ? "green" : "orange"}>
                      {String(session.payment_status || "unpaid").toUpperCase()}
                    </Tag>
                  </div>
                </div>

                <Divider />

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#666" }}>Subtotal:</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(session.subtotal)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#666" }}>Tax:</div>
                    <div style={{ fontWeight: 600 }}>{formatMoney(session.tax_amount)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#666" }}>Total:</div>
                    <div style={{ fontWeight: 700, color: "#52c41a" }}>{formatMoney(session.total_amount)}</div>
                  </div>
                </div>

                <Divider />

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Payment method:</div>
                    <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <Radio value="cash">Cash</Radio>
                      <Radio value="card">Card</Radio>
                      <Radio value="momo">MoMo</Radio>
                      <Radio value="vnpay">VNPay</Radio>
                      <Radio value="zalopay">ZaloPay</Radio>
                      <Radio value="stripe">Stripe</Radio>
                    </Radio.Group>
                  </div>

                  <Button
                    type="primary"
                    danger
                    disabled={session.payment_status === "paid" || session.status === "completed"}
                    onClick={handleCompleteSession}
                    loading={loading}
                  >
                    Complete Session
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card title={`Orders (${orders.length})`}>
            {orders.length === 0 ? (
              <Alert type="info" showIcon message="No orders yet" />
            ) : (
              <List
                dataSource={orders}
                renderItem={(o) => (
                  <List.Item
                    onClick={() => openOrderDetail(o.id)}
                    style={{ cursor: "pointer" }}
                    actions={[<span key="total" style={{ fontWeight: 600 }}>{formatMoney(o.total_amount)}</span>]}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600 }}>{o.order_number || o.id}</span>
                          <Tag color={o.status === "pending" ? "orange" : o.status === "preparing" ? "blue" : "green"}>
                            {String(o.status || "unknown").toUpperCase()}
                          </Tag>
                        </div>
                      }
                      description={o.created_at ? new Date(o.created_at).toLocaleString() : null}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Spin>

        <Modal
          open={detailOpen}
          title={selectedOrder?.order_number || "Order Detail"}
          onCancel={() => {
            setDetailOpen(false);
            setSelectedOrder(null);
          }}
          footer={null}
        >
          <Spin spinning={detailLoading}>
            {!selectedOrder ? (
              <Alert type="info" showIcon message="No order selected" />
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Tag color={selectedOrder.status === "pending" ? "orange" : selectedOrder.status === "preparing" ? "blue" : "green"}>
                    {String(selectedOrder.status || "unknown").toUpperCase()}
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 600 }}>
                    Total: {formatMoney(selectedOrder.total_amount)}
                  </span>
                </div>

                <List
                  dataSource={selectedOrder.items || []}
                  renderItem={(it) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${it.item_name || "Item"} x${it.quantity}`}
                        description={
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Tag>{formatMoney(it.total_price || it.subtotal)}</Tag>
                            {it.status && <Tag color="blue">{String(it.status).toUpperCase()}</Tag>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </Spin>
        </Modal>
      </div>
    </div>
  );
}
