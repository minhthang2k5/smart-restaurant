import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Tag,
  Radio,
  Checkbox,
  Space,
  Divider,
  message,
  Spin,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  StarFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import * as menuService from "../../services/menuService";

const statusColor = {
  available: "green",
  unavailable: "orange",
  sold_out: "red",
  hidden: "default",
};

export default function GuestItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  // State
  const [item, setItem] = useState(null);
  const [category, setCategory] = useState(null);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItemDetail();
  }, [itemId]);

  const fetchItemDetail = async () => {
    try {
      setLoading(true);

      // Fetch item
      const itemResponse = await menuService.getPublicMenuItem(itemId);
      const itemData = itemResponse.data;

      // Check if item is hidden
      if (itemData.status === "hidden") {
        message.warning("This item is not available");
        navigate("/menu");
        return;
      }

      setItem(itemData);

      // Fetch category
      const categoriesResponse = await menuService.getCategories();
      const cat = categoriesResponse.data?.find(
        (c) => c.id === itemData.category_id
      );
      setCategory(cat);

      // Check if category is active
      if (cat && cat.status !== "active") {
        message.warning("This item's category is currently inactive");
      }

      // Fetch modifiers for this item
      const modifiersResponse = await menuService.getItemModifiers(itemId);
      setModifierGroups(modifiersResponse.data || []);
    } catch (error) {
      message.error("Failed to load item details");
      console.error(error);
      navigate("/menu");
    } finally {
      setLoading(false);
    }
  };

  const handleModifierChange = (groupId, optionId, isMultiple) => {
    setSelectedModifiers((prev) => {
      if (isMultiple) {
        // Multiple select: toggle option in array
        const current = prev[groupId] || [];
        const exists = current.includes(optionId);
        return {
          ...prev,
          [groupId]: exists
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      } else {
        // Single select: replace value
        return {
          ...prev,
          [groupId]: optionId,
        };
      }
    });
  };

  // Calculate total price with modifiers
  const totalPrice = useMemo(() => {
    if (!item) return 0;

    let total = Number(item.price);

    modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group.id];
      if (!selected) return;

      if (group.selection_type === "single") {
        // Single select
        const option = group.options?.find((opt) => opt.id === selected);
        if (option) {
          total += Number(option.price_adjustment || 0);
        }
      } else {
        // Multiple select
        if (Array.isArray(selected)) {
          selected.forEach((optionId) => {
            const option = group.options?.find((opt) => opt.id === optionId);
            if (option) {
              total += Number(option.price_adjustment || 0);
            }
          });
        }
      }
    });

    return total;
  }, [item, modifierGroups, selectedModifiers]);

  // Validate selections before adding to cart
  const validateSelections = () => {
    for (const group of modifierGroups) {
      const selected = selectedModifiers[group.id];

      // Check required groups
      if (group.is_required && !selected) {
        message.error(`Please select an option for "${group.name}"`);
        return false;
      }

      // Check multiple select min/max
      if (group.selection_type === "multiple" && Array.isArray(selected)) {
        const count = selected.length;

        if (group.min_selections && count < group.min_selections) {
          message.error(
            `Please select at least ${group.min_selections} option(s) for "${group.name}"`
          );
          return false;
        }

        if (group.max_selections && count > group.max_selections) {
          message.error(
            `Please select at most ${group.max_selections} option(s) for "${group.name}"`
          );
          return false;
        }
      }
    }

    return true;
  };

  const handleAddToCart = () => {
    if (item.status === "sold_out") {
      message.error("This item is sold out");
      return;
    }

    if (item.status === "unavailable") {
      message.error("This item is currently unavailable");
      return;
    }

    if (!validateSelections()) {
      return;
    }

    // TODO: Add to cart logic (context/state management)
    message.success(`Added "${item.name}" to cart - $${totalPrice.toFixed(2)}`);
    console.log("Add to cart:", {
      item,
      selectedModifiers,
      totalPrice,
    });

    // Navigate back to menu
    navigate("/menu");
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" tip="Loading item details..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Item not found</p>
        <Button onClick={() => navigate("/menu")}>Back to Menu</Button>
      </div>
    );
  }

  const isSoldOut = item.status === "sold_out";
  const isUnavailable = item.status === "unavailable";
  const canAddToCart =
    !isSoldOut && !isUnavailable && category?.status === "active";

  return (
    <div
      style={{ minHeight: "100vh", background: "#f5f5f5", padding: "24px 0" }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/menu")}
          style={{ marginBottom: 16 }}
        >
          Back to Menu
        </Button>

        {/* Item Detail Card */}
        <Card>
          {/* Header */}
          <Space style={{ marginBottom: 16 }} wrap>
            <h1 style={{ margin: 0, fontSize: 28 }}>
              {item.name}
              {item.is_chef_recommended && (
                <StarFilled style={{ color: "#faad14", marginLeft: 8 }} />
              )}
            </h1>
          </Space>

          {/* Tags */}
          <Space style={{ marginBottom: 16 }} wrap>
            {category && <Tag color="blue">{category.name}</Tag>}
            <Tag color={statusColor[item.status]}>
              {item.status.replace("_", " ").toUpperCase()}
            </Tag>
            {item.is_chef_recommended && (
              <Tag color="gold" icon={<StarFilled />}>
                Chef's Pick
              </Tag>
            )}
          </Space>

          {/* Description */}
          {item.description && (
            <p style={{ fontSize: 16, color: "#666", marginBottom: 16 }}>
              {item.description}
            </p>
          )}

          {/* Prep Time */}
          {item.prep_time_minutes > 0 && (
            <div style={{ color: "#999", marginBottom: 16 }}>
              <ClockCircleOutlined /> Preparation time: {item.prep_time_minutes}{" "}
              minutes
            </div>
          )}

          {/* Base Price */}
          <div
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#1890ff",
              marginBottom: 16,
            }}
          >
            Base Price: ${Number(item.price).toFixed(2)}
          </div>

          {/* Warnings */}
          {isSoldOut && (
            <Alert
              message="Sold Out"
              description="This item is currently sold out."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {isUnavailable && (
            <Alert
              message="Unavailable"
              description="This item is temporarily unavailable."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {category?.status !== "active" && (
            <Alert
              message="Category Inactive"
              description="This item's category is currently inactive."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider />

          {/* Modifier Groups */}
          {modifierGroups.length > 0 && (
            <>
              <h3>Customize Your Order:</h3>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                {modifierGroups.map((group) => {
                  const activeOptions =
                    group.options?.filter((opt) => opt.status === "active") ||
                    [];

                  if (activeOptions.length === 0) return null;

                  return (
                    <div key={group.id}>
                      <div style={{ marginBottom: 8 }}>
                        <strong>{group.name}</strong>
                        {group.is_required && (
                          <Tag color="red" style={{ marginLeft: 8 }}>
                            Required
                          </Tag>
                        )}
                        {group.selection_type === "multiple" && (
                          <span
                            style={{
                              color: "#999",
                              fontSize: 12,
                              marginLeft: 8,
                            }}
                          >
                            (Select{" "}
                            {group.min_selections && group.max_selections
                              ? `${group.min_selections}-${group.max_selections}`
                              : group.min_selections
                              ? `at least ${group.min_selections}`
                              : group.max_selections
                              ? `up to ${group.max_selections}`
                              : "multiple"}
                            )
                          </span>
                        )}
                      </div>

                      {group.selection_type === "single" ? (
                        <Radio.Group
                          value={selectedModifiers[group.id]}
                          onChange={(e) =>
                            handleModifierChange(
                              group.id,
                              e.target.value,
                              false
                            )
                          }
                          style={{ width: "100%" }}
                        >
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {activeOptions.map((option) => (
                              <Radio key={option.id} value={option.id}>
                                <Space>
                                  <span>{option.name}</span>
                                  {option.price_adjustment > 0 && (
                                    <span style={{ color: "#1890ff" }}>
                                      +$
                                      {Number(option.price_adjustment).toFixed(
                                        2
                                      )}
                                    </span>
                                  )}
                                </Space>
                              </Radio>
                            ))}
                          </Space>
                        </Radio.Group>
                      ) : (
                        <Checkbox.Group
                          value={selectedModifiers[group.id] || []}
                          onChange={(values) =>
                            setSelectedModifiers((prev) => ({
                              ...prev,
                              [group.id]: values,
                            }))
                          }
                          style={{ width: "100%" }}
                        >
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {activeOptions.map((option) => (
                              <Checkbox key={option.id} value={option.id}>
                                <Space>
                                  <span>{option.name}</span>
                                  {option.price_adjustment > 0 && (
                                    <span style={{ color: "#1890ff" }}>
                                      +$
                                      {Number(option.price_adjustment).toFixed(
                                        2
                                      )}
                                    </span>
                                  )}
                                </Space>
                              </Checkbox>
                            ))}
                          </Space>
                        </Checkbox.Group>
                      )}
                    </div>
                  );
                })}
              </Space>

              <Divider />
            </>
          )}

          {/* Total Price & Add to Cart */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: "#999" }}>Total Price:</div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: "#52c41a",
                }}
              >
                ${totalPrice.toFixed(2)}
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleAddToCart}
              disabled={!canAddToCart}
            >
              Add to Cart
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
