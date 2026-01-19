import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Divider,
  InputNumber,
  List,
  message,
  Spin,
  Tag,
} from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import * as cartService from "../../services/cartService";
import * as sessionService from "../../services/sessionService";
import { formatVND } from "../../utils/currency";

const readSessionId = () => localStorage.getItem("sessionId");
const readTableId = () => localStorage.getItem("tableId");

export default function Cart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlTableId = searchParams.get("tableId") || searchParams.get("table");
    if (urlTableId) localStorage.setItem("tableId", String(urlTableId));
  }, [searchParams]);

  const [items, setItems] = useState(() => cartService.getLocalCartItems());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [errors, setErrors] = useState([]);

  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.quantity || 0), 0),
    [items]
  );

  const refreshSummary = async (nextItems) => {
    const currentItems = nextItems || items;
    if (currentItems.length === 0) {
      setSummary(null);
      setErrors([]);
      return;
    }

    try {
      setLoading(true);
      const res = await cartService.getCartSummary(currentItems);
      const cart = res.cart || res.data?.cart || null;
      const errs = res.errors || res.data?.errors || [];

      setSummary(cart);
      setErrors(Array.isArray(errs) ? errs : []);
    } catch (error) {
      setSummary(null);
      setErrors(["Failed to load cart summary"]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSummary(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQtyChange = (index, qty) => {
    const next = cartService.updateLocalCartItemQuantity(index, qty);
    setItems(next);
    refreshSummary(next);
  };

  const handleRemove = (index) => {
    const next = cartService.removeLocalCartItem(index);
    setItems(next);
    refreshSummary(next);
  };

  const ensureSession = async () => {
    const existingSessionId = readSessionId();
    if (existingSessionId) return existingSessionId;

    const tableId = readTableId();
    if (!tableId) {
      message.error(
        "Missing tableId. Please scan QR or open menu with ?table=... (or ?tableId=...)."
      );
      return null;
    }

    try {
      const active = await sessionService.getActiveSessionByTable(tableId);
      const session = active.data || active;
      if (session?.id) {
        localStorage.setItem("sessionId", session.id);
        return session.id;
      }
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error(error);
      }
    }

    try {
      const created = await sessionService.createSession({ tableId });
      const session = created.data || created;
      if (session?.id) {
        localStorage.setItem("sessionId", session.id);
        return session.id;
      }
    } catch (error) {
      message.error("Failed to create session");
      console.error(error);
    }

    return null;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      message.info("Your cart is empty");
      return;
    }

    const sessionId = await ensureSession();
    if (!sessionId) return;

    try {
      setLoading(true);

      const can = await cartService.canOrder(items);
      const canOrder = can.canOrder ?? can.data?.canOrder;
      const reason = can.reason ?? can.data?.reason;

      if (!canOrder) {
        message.error(reason || "Cart cannot be ordered");
        return;
      }

      const res = await sessionService.createOrderInSession(sessionId, items);
      const order = res.data?.order || res.order || null;

      cartService.clearLocalCart();
      setItems([]);
      setSummary(null);
      setErrors([]);

      message.success(
        order?.order_number
          ? `Order placed! #${order.order_number}`
          : "Order placed successfully"
      );

      navigate("/orders");
    } catch (error) {
      const backendErrors = error?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        message.error(backendErrors[0]);
      } else {
        message.error(error?.response?.data?.message || "Failed to place order");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "24px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/menu")}
          style={{ marginBottom: 16 }}
        >
          Back to Menu
        </Button>

        <Card
          title={
            <span>
              <ShoppingCartOutlined /> Cart ({itemCount})
            </span>
          }
        >
          {items.length === 0 ? (
            <Alert type="info" message="Your cart is empty" showIcon />
          ) : (
            <Spin spinning={loading}>
              {errors.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message="Cart warnings"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  }
                  style={{ marginBottom: 16 }}
                />
              )}

              <List
                dataSource={items}
                renderItem={(it, index) => {
                  const summaryItem = summary?.items?.[index];
                  const name =
                    summaryItem?.menuItem?.name ||
                    summaryItem?.item_name ||
                    it.menuItemId;

                  const price =
                    summaryItem?.pricing?.totalPrice ??
                    summaryItem?.total_price ??
                    null;

                  return (
                    <List.Item
                      actions={[
                        <Button key="remove" danger onClick={() => handleRemove(index)}>
                          Remove
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600 }}>{name}</span>
                            {price != null && (
                              <Tag color="green">{formatVND(price)}</Tag>
                            )}
                          </div>
                        }
                        description={
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span>Qty:</span>
                            <InputNumber
                              min={1}
                              value={Number(it.quantity || 1)}
                              onChange={(v) => handleQtyChange(index, v)}
                            />
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />

              <Divider />

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "#666" }}>Subtotal:</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {formatVND(summary?.subtotal || 0)}
                  </div>
                  <div style={{ color: "#666" }}>Tax:</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {formatVND(summary?.tax || 0)}
                  </div>
                  <div style={{ color: "#666" }}>Total:</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#52c41a" }}>
                    {formatVND(summary?.total || 0)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => navigate("/menu")}>Continue browsing</Button>
                  <Button
                    type="primary"
                    onClick={handlePlaceOrder}
                    disabled={items.length === 0}
                    loading={loading}
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            </Spin>
          )}
        </Card>
      </div>
    </div>
  );
}
