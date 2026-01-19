import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
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
  Avatar,
} from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import * as orderService from "../../services/orderService";
import * as sessionService from "../../services/sessionService";
import * as cartService from "../../services/cartService";
import * as paymentService from "../../services/paymentService";
import { formatVND } from "../../utils/currency";

const readTableId = () => localStorage.getItem("tableId");
const readSessionId = () => localStorage.getItem("sessionId");

const MOMO_STORAGE_PREFIX = "momoPayment:";

const readStoredMoMo = (sessionId) => {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem(`${MOMO_STORAGE_PREFIX}${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStoredMoMo = (sessionId, data) => {
  if (!sessionId) return;
  localStorage.setItem(
    `${MOMO_STORAGE_PREFIX}${sessionId}`,
    JSON.stringify(data)
  );
};

const clearStoredMoMo = (sessionId) => {
  if (!sessionId) return;
  localStorage.removeItem(`${MOMO_STORAGE_PREFIX}${sessionId}`);
};

const formatMoney = (value) => formatVND(value);

const toNumber = (value) => {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const computeRunningSessionTotals = (orders) => {
  const safeOrders = Array.isArray(orders) ? orders : [];

  let subtotal = 0;
  let tax = 0;
  let total = 0;

  for (const o of safeOrders) {
    if (!o) continue;
    if (o.status === "rejected") continue;
    subtotal += toNumber(o.subtotal);
    tax += toNumber(o.tax_amount);
    total += toNumber(o.total_amount);
  }

  return {
    subtotal,
    tax_amount: tax,
    total_amount: total,
  };
};

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

  const [momoModalOpen, setMoMoModalOpen] = useState(false);
  const [momoPayInfo, setMoMoPayInfo] = useState(null);
  const [momoStatus, setMoMoStatus] = useState(null);
  const [momoBusy, setMoMoBusy] = useState(false);

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

      // Source of truth for customer order list is the active session.
      // It includes the full `orders` array per the API docs.
      try {
        const s = await sessionService.getActiveSessionByTable(tableId);
        const activeSession = s.data || s;
        setSession(activeSession);

        const id = activeSession?.id;
        if (id) localStorage.setItem("sessionId", id);

        const sessionOrders = Array.isArray(activeSession?.orders)
          ? activeSession.orders
          : [];
        setOrders(sessionOrders);
      } catch (e) {
        if (e?.response?.status === 404) {
          setSession(null);
          setOrders([]);
        } else {
          throw e;
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

  const displayTotals = (() => {
    if (!session) return { subtotal: 0, tax_amount: 0, total_amount: 0 };

    // Backend only updates session totals on completeSession;
    // while session is active, show running totals from orders.
    const hasSessionTotals =
      toNumber(session.subtotal) !== 0 ||
      toNumber(session.tax_amount) !== 0 ||
      toNumber(session.total_amount) !== 0;

    if (session.status === "active" && !hasSessionTotals) {
      return computeRunningSessionTotals(orders);
    }

    return {
      subtotal: toNumber(session.subtotal),
      tax_amount: toNumber(session.tax_amount),
      total_amount: toNumber(session.total_amount),
    };
  })();

  const canPayNow = (() => {
    if (!session) return false;
    if (session.payment_status === "paid") return false;
    if (!Array.isArray(orders) || orders.length === 0) return false;

    // Customer can pay only when all orders are served.
    // Keep `completed` as allowed to avoid edge cases after payment settles.
    const payable = orders.filter((o) => o && o.status !== "rejected");
    if (payable.length === 0) return false;
    return payable.every(
      (o) => o.status === "served" || o.status === "completed"
    );
  })();

  // Real-time updates (Customer namespace): listen for order/session updates for this table.
  // Docs: /customer requires join-table; emits new-order, order-status-updated, order-ready,
  // item-status-updated, order-rejected, session-completed.
  useEffect(() => {
    if (!tableId) return;

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const socketBaseUrl = apiUrl.replace(/\/api\/?$/, "");

    let refreshTimerId;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimerId);
      refreshTimerId = window.setTimeout(() => {
        loadAll();
      }, 200);
    };

    const socket = io(`${socketBaseUrl}/customer`, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    const join = () => {
      socket.emit("join-table", tableId);
    };

    socket.on("connect", join);
    socket.on("joined-table", scheduleRefresh);
    socket.on("new-order", scheduleRefresh);
    socket.on("order-status-updated", scheduleRefresh);
    socket.on("order-ready", scheduleRefresh);
    socket.on("item-status-updated", scheduleRefresh);
    socket.on("order-rejected", scheduleRefresh);
    socket.on("session-completed", scheduleRefresh);

    socket.on("connect_error", (err) => {
      console.error("Customer socket connect_error:", err?.message || err);
    });

    return () => {
      window.clearTimeout(refreshTimerId);
      try {
        socket.emit("leave-table", tableId);
      } catch {
        // ignore
      }
      socket.off("connect", join);
      socket.off("joined-table", scheduleRefresh);
      socket.off("new-order", scheduleRefresh);
      socket.off("order-status-updated", scheduleRefresh);
      socket.off("order-ready", scheduleRefresh);
      socket.off("item-status-updated", scheduleRefresh);
      socket.off("order-rejected", scheduleRefresh);
      socket.off("session-completed", scheduleRefresh);
      socket.disconnect();
    };
  }, [loadAll, tableId]);

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

    // MoMo payment is handled by the dedicated payment endpoints.
    if (paymentMethod === "momo") {
      // If we already initiated payment before (page refresh), restore payUrl from localStorage.
      const stored = readStoredMoMo(sessionId);
      if (stored?.payUrl) {
        setMoMoPayInfo(stored);
        setMoMoModalOpen(true);
        return;
      }

      try {
        setMoMoBusy(true);
        const res = await paymentService.initiateMoMoPayment(sessionId);
        const payload = res?.data || res;
        const data = payload?.data || payload;

        if (!data?.payUrl) {
          message.error("Failed to initiate MoMo payment (missing payUrl)");
          return;
        }

        const payInfo = {
          payUrl: data.payUrl,
          requestId: data.requestId,
          orderId: data.orderId,
          amount: data.amount,
          createdAt: new Date().toISOString(),
        };

        writeStoredMoMo(sessionId, payInfo);
        setMoMoPayInfo(payInfo);
        setMoMoModalOpen(true);

        // Open payment page immediately (still keep modal as fallback)
        window.open(data.payUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        message.error(
          error?.response?.data?.message || "Failed to initiate MoMo payment"
        );
        console.error(error);
      } finally {
        setMoMoBusy(false);
      }

      return;
    }

    try {
      setLoading(true);
      await sessionService.completeSession(sessionId, { paymentMethod });

      message.success("Session completed successfully");
      
      // Set post-payment mode to prevent creating new session on menu redirect
      const tableId = localStorage.getItem("tableId");
      if (tableId) {
        localStorage.setItem("postPaymentMode", "true");
        localStorage.setItem("postPaymentTableId", tableId);
      }
      localStorage.removeItem("sessionId");
      cartService.clearLocalCart();

      await loadAll();
      navigate("/menu");
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to complete session"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Poll MoMo payment status while the modal is open
  useEffect(() => {
    if (!momoModalOpen) return;
    const sessionId = session?.id || readSessionId();
    if (!sessionId) return;

    let stopped = false;
    let intervalId;

    const tick = async () => {
      try {
        const res = await paymentService.getPaymentStatus(sessionId);
        const payload = res?.data || res;
        const status = payload?.data || payload;
        if (stopped) return;

        setMoMoStatus(status);

        const paymentStatus = status?.payment_status;
        if (paymentStatus === "paid") {
          stopped = true;
          window.clearInterval(intervalId);

          message.success("Payment completed successfully");
          clearStoredMoMo(sessionId);
          
          // Set post-payment mode to prevent creating new session on menu redirect
          const tableId = localStorage.getItem("tableId");
          if (tableId) {
            localStorage.setItem("postPaymentMode", "true");
            localStorage.setItem("postPaymentTableId", tableId);
          }
          localStorage.removeItem("sessionId");
          cartService.clearLocalCart();
          setMoMoModalOpen(false);
          await loadAll();
          navigate("/menu");
        }

        if (paymentStatus === "failed" || paymentStatus === "cancelled") {
          // Keep modal open so user can see failure + optionally cancel
          window.clearInterval(intervalId);
        }
      } catch (error) {
        // Keep quiet; user can still open payUrl / retry
        console.error(error);
      }
    };

    tick();
    intervalId = window.setInterval(tick, 2000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [loadAll, momoModalOpen, navigate, session]);

  return (
    <div
      style={{ minHeight: "100vh", background: "#f5f5f5", padding: "16px 0" }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/menu")}
            size="middle"
          >
            Back to Menu
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadAll} size="middle">
            Refresh
          </Button>
        </div>

        <Divider style={{ margin: "12px 0" }} />

        {!tableId && (
          <Alert
            type="warning"
            showIcon
            message="Missing tableId"
            description="Open the menu with ?tableId=... or scan QR again."
          />
        )}

        <Spin spinning={loading}>
          <Card title={<span style={{ fontSize: 16 }}>Active Session</span>} style={{ marginBottom: 16, borderRadius: 8 }}>
            {!session ? (
              <Alert type="info" showIcon message="No active session" />
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#666", fontSize: 14 }}>Session:</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {session.session_number || session.id}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#666", fontSize: 14 }}>Status:</span>
                    <Tag
                      color={session.status === "active" ? "green" : "default"}
                    >
                      {String(session.status || "unknown").toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#666", fontSize: 14 }}>Payment:</span>
                    <Tag
                      color={
                        session.payment_status === "paid" ? "green" : "orange"
                      }
                    >
                      {String(session.payment_status || "unpaid").toUpperCase()}
                    </Tag>
                  </div>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666", fontSize: 14 }}>Subtotal:</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {formatMoney(displayTotals.subtotal)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#666", fontSize: 14 }}>Tax:</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {formatMoney(displayTotals.tax_amount)}
                    </span>
                  </div>
                  <Divider style={{ margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>Total:</span>
                    <span style={{ fontWeight: 700, color: "#52c41a", fontSize: 18 }}>
                      {formatMoney(displayTotals.total_amount)}
                    </span>
                  </div>
                </div>

                <Divider />

                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    Payment method:
                  </div>
                  <Radio.Group
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <Radio value="cash">Cash</Radio>
                    <Radio value="card">Card</Radio>
                    <Radio value="momo">MoMo</Radio>
                  </Radio.Group>
                </div>

                <div style={{ marginTop: 16 }}>
                  <Button
                    type="primary"
                    danger
                    block
                    size="large"
                    disabled={
                      session.payment_status === "paid" ||
                      session.status === "completed" ||
                      !canPayNow ||
                      momoBusy
                    }
                    onClick={handleCompleteSession}
                    loading={loading || momoBusy}
                  >
                    {paymentMethod === "momo"
                      ? "Pay with MoMo"
                      : "Complete Session"}
                  </Button>
                </div>

                {paymentMethod === "momo" && !canPayNow ? (
                  <Alert
                    style={{ marginTop: 12 }}
                    type="warning"
                    showIcon
                    message="Payment is locked"
                    description="You can only pay after all orders are marked SERVED. Please wait for staff to serve your orders."
                  />
                ) : null}
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
                    actions={[
                      <span key="total" style={{ fontWeight: 600 }}>
                        {formatMoney(o.total_amount)}
                      </span>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            {o.order_number || o.id}
                          </span>
                          <Tag
                            color={
                              o.status === "pending"
                                ? "orange"
                                : o.status === "preparing"
                                ? "blue"
                                : "green"
                            }
                          >
                            {String(o.status || "unknown").toUpperCase()}
                          </Tag>
                        </div>
                      }
                      description={
                        o.created_at
                          ? new Date(o.created_at).toLocaleString()
                          : null
                      }
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
                  <Tag
                    color={
                      selectedOrder.status === "pending"
                        ? "orange"
                        : selectedOrder.status === "preparing"
                        ? "blue"
                        : "green"
                    }
                  >
                    {String(selectedOrder.status || "unknown").toUpperCase()}
                  </Tag>
                  <span style={{ marginLeft: 8, fontWeight: 600 }}>
                    Total: {formatMoney(selectedOrder.total_amount)}
                  </span>
                </div>

                <List
                  dataSource={selectedOrder.items || []}
                  renderItem={(it, index) => {
                    // Debug: log photo data
                    if (index === 0) {
                      console.log('Order item:', it);
                      console.log('MenuItem:', it.menuItem);
                      console.log('Photos:', it.menuItem?.photos);
                    }
                    
                    return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          it.menuItem?.photos && it.menuItem.photos.length > 0 ? (
                            <Avatar
                              src={it.menuItem.photos.find((p) => p.is_primary)?.url || it.menuItem.photos[0]?.url}
                              size={64}
                              shape="square"
                            />
                          ) : (
                            <Avatar size={64} shape="square" style={{ backgroundColor: "#f0f0f0", fontSize: 24 }}>
                              🍴
                            </Avatar>
                          )
                        }
                        title={`${it.item_name || "Item"} x${it.quantity}`}
                        description={
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              <Tag style={{ margin: 0 }}>
                                {formatMoney(it.total_price || it.subtotal)}
                              </Tag>
                              {it.status && (
                                <Tag color="blue" style={{ margin: 0 }}>
                                  {String(it.status).toUpperCase()}
                                </Tag>
                              )}
                            </div>
                            {it.menuItem?.status && (
                              <div>
                                <Tag color="green" style={{ margin: 0, fontSize: 10 }}>
                                  {String(it.menuItem.status).toUpperCase()}
                                </Tag>
                              </div>
                            )}
                            {Array.isArray(it?.modifiers) && it.modifiers.length > 0 && (
                              <div style={{ color: "#3498db", fontSize: 11, lineHeight: 1.4 }}>
                                + {it.modifiers.map((mod, idx) => (
                                  <span key={idx}>
                                    {mod.option_name || mod.name || 'Unknown'}
                                    {mod.price_adjustment > 0 && ` (+${formatVND(mod.price_adjustment)})`}
                                    {idx < it.modifiers.length - 1 && ", "}
                                  </span>
                                ))}
                              </div>
                            )}
                            {it?.special_instructions && it.special_instructions.trim().length > 0 && (
                              <div style={{ color: "#9b59b6", fontSize: 11, fontStyle: "italic", fontWeight: 600, lineHeight: 1.4 }}>
                                ✎ {it.special_instructions}
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                    );
                  }}
                />
              </>
            )}
          </Spin>
        </Modal>

        <Modal
          open={momoModalOpen}
          title="MoMo Payment"
          onCancel={() => setMoMoModalOpen(false)}
          footer={null}
        >
          <Alert
            type="info"
            showIcon
            message="Complete payment in MoMo"
            description={
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  Status:{" "}
                  <b>
                    {String(
                      momoStatus?.payment_status || "unknown"
                    ).toUpperCase()}
                  </b>
                </div>
                {momoPayInfo?.amount != null ? (
                  <div>
                    Amount: <b>{momoPayInfo.amount}</b>
                  </div>
                ) : null}
                {momoStatus?.momo_error_message ? (
                  <div style={{ color: "#cf1322" }}>
                    {momoStatus.momo_error_message}
                  </div>
                ) : null}
              </div>
            }
          />

          <div
            style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <Button
              type="primary"
              disabled={!momoPayInfo?.payUrl}
              onClick={() => {
                if (momoPayInfo?.payUrl) {
                  window.open(
                    momoPayInfo.payUrl,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }
              }}
            >
              Open MoMo Payment
            </Button>

            <Button
              disabled={!momoPayInfo?.payUrl}
              onClick={async () => {
                try {
                  if (!momoPayInfo?.payUrl) return;
                  await navigator.clipboard.writeText(momoPayInfo.payUrl);
                  message.success("Payment link copied");
                } catch {
                  message.error("Failed to copy link");
                }
              }}
            >
              Copy Link
            </Button>

            <Button
              danger
              onClick={async () => {
                const sessionId = session?.id || readSessionId();
                if (!sessionId) return;
                try {
                  setMoMoBusy(true);
                  await paymentService.cancelMoMoPayment(sessionId, {
                    reason: "Cancelled by customer",
                  });
                  clearStoredMoMo(sessionId);
                  message.success("Payment cancelled");
                  setMoMoModalOpen(false);
                  await loadAll();
                } catch (error) {
                  message.error(
                    error?.response?.data?.message || "Failed to cancel payment"
                  );
                  console.error(error);
                } finally {
                  setMoMoBusy(false);
                }
              }}
              disabled={momoBusy}
            >
              Cancel Payment
            </Button>
          </div>

          {!momoPayInfo?.payUrl ? (
            <div style={{ marginTop: 12, color: "rgba(0,0,0,0.45)" }}>
              Tip: If you refreshed the page before saving the pay link, click
              “Pay with MoMo” again to initiate.
            </div>
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
