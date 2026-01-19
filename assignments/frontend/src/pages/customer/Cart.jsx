import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Spin,
  Tag,
  Avatar,
} from "antd";
import { ArrowLeftOutlined, ShoppingCartOutlined, EditOutlined } from "@ant-design/icons";
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
  const [editingIndex, setEditingIndex] = useState(null);
  const [editInstructions, setEditInstructions] = useState("");

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

  const handleEditInstructions = (index) => {
    setEditingIndex(index);
    setEditInstructions(items[index]?.specialInstructions || "");
  };

  const handleSaveInstructions = () => {
    if (editingIndex === null) return;
    
    const next = [...items];
    next[editingIndex] = {
      ...next[editingIndex],
      specialInstructions: editInstructions.trim() || null,
    };
    
    cartService.setLocalCartItems(next);
    setItems(next);
    setEditingIndex(null);
    setEditInstructions("");
    refreshSummary(next);
    message.success("Special instructions updated");
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
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "16px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 12px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/menu")}
          style={{ marginBottom: 12 }}
          size="middle"
        >
          Back to Menu
        </Button>

        <Card
          title={
            <span style={{ fontSize: 16 }}>
              <ShoppingCartOutlined /> Cart ({itemCount})
            </span>
          }
          style={{ borderRadius: 8 }}
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
                      style={{ 
                        padding: "12px 0",
                        flexDirection: "column",
                        alignItems: "stretch"
                      }}
                    >
                      {/* Main Content */}
                      <div style={{ 
                        display: "flex", 
                        gap: 12, 
                        width: "100%",
                        marginBottom: 12
                      }}>
                        {/* Avatar */}
                        {summaryItem?.menuItem?.photos && summaryItem.menuItem.photos.length > 0 ? (
                          <Avatar
                            src={summaryItem.menuItem.photos.find((p) => p.is_primary)?.url || summaryItem.menuItem.photos[0]?.url}
                            size={60}
                            shape="square"
                            style={{ flexShrink: 0 }}
                          />
                        ) : (
                          <Avatar size={60} shape="square" style={{ backgroundColor: "#f0f0f0", fontSize: 20, flexShrink: 0 }}>
                            🍴
                          </Avatar>
                        )}

                        {/* Item Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Name and Price */}
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                              {name}
                            </div>
                            {price != null && (
                              <Tag color="green" style={{ margin: 0 }}>
                                {formatVND(price)}
                              </Tag>
                            )}
                          </div>

                          {/* Quantity */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: "#666" }}>Qty:</span>
                            <InputNumber
                              min={1}
                              value={Number(it.quantity || 1)}
                              onChange={(v) => handleQtyChange(index, v)}
                              size="small"
                              style={{ width: 70 }}
                            />
                          </div>
                          
                          {/* Display modifiers */}
                          {summaryItem?.modifiers && summaryItem.modifiers.length > 0 && (
                            <div style={{ 
                              fontSize: 12, 
                              color: "#666", 
                              lineHeight: 1.4,
                              marginBottom: 6,
                              wordBreak: "break-word"
                            }}>
                              <strong>Options:</strong>{" "}
                              {summaryItem.modifiers.map((mod, idx) => (
                                <span key={idx}>
                                  {mod.optionName}
                                  {mod.priceAdjustment > 0 && ` (+${formatVND(mod.priceAdjustment)})`}
                                  {idx < summaryItem.modifiers.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Display special instructions */}
                          {it.specialInstructions && (
                            <div style={{ 
                              fontSize: 12, 
                              color: "#666", 
                              fontStyle: "italic", 
                              lineHeight: 1.4,
                              wordBreak: "break-word"
                            }}>
                              <strong>Note:</strong> {it.specialInstructions}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        display: "flex", 
                        gap: 8, 
                        width: "100%",
                        flexWrap: "wrap"
                      }}>
                        <Button 
                          key="edit" 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditInstructions(index)}
                          size="small"
                          style={{ flex: "1 1 auto", minWidth: 100 }}
                        >
                          Note
                        </Button>
                        <Button 
                          key="remove" 
                          danger 
                          onClick={() => handleRemove(index)}
                          size="small"
                          style={{ flex: "1 1 auto", minWidth: 100 }}
                        >
                          Remove
                        </Button>
                      </div>
                    </List.Item>
                  );
                }}
              />

              <Divider style={{ margin: "16px 0" }} />

              {/* Summary Section - Mobile Optimized */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  <span style={{ color: "#666" }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{formatVND(summary?.subtotal || 0)}</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginBottom: 8,
                  fontSize: 14
                }}>
                  <span style={{ color: "#666" }}>Tax:</span>
                  <span style={{ fontWeight: 600 }}>{formatVND(summary?.tax || 0)}</span>
                </div>
                <Divider style={{ margin: "12px 0" }} />
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  fontSize: 18
                }}>
                  <span style={{ fontWeight: 600 }}>Total:</span>
                  <span style={{ fontWeight: 700, color: "#52c41a" }}>
                    {formatVND(summary?.total || 0)}
                  </span>
                </div>
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div style={{ 
                display: "flex", 
                flexDirection: "column",
                gap: 8,
                width: "100%"
              }}>
                <Button
                  type="primary"
                  onClick={handlePlaceOrder}
                  disabled={items.length === 0}
                  loading={loading}
                  size="large"
                  block
                  style={{ height: 48 }}
                >
                  Place Order
                </Button>
                <Button 
                  onClick={() => navigate("/menu")}
                  size="large"
                  block
                  style={{ height: 48 }}
                >
                  Continue Browsing
                </Button>
              </div>
            </Spin>
          )}
        </Card>

        {/* Edit Special Instructions Modal */}
        <Modal
          title="Special Instructions"
          open={editingIndex !== null}
          onOk={handleSaveInstructions}
          onCancel={() => {
            setEditingIndex(null);
            setEditInstructions("");
          }}
          okText="Save"
          cancelText="Cancel"
        >
          <Input.TextArea
            rows={4}
            placeholder="Any special requests? E.g., no onions, less spicy, extra sauce..."
            value={editInstructions}
            onChange={(e) => setEditInstructions(e.target.value)}
            maxLength={500}
            showCount
          />
        </Modal>
      </div>
    </div>
  );
}
