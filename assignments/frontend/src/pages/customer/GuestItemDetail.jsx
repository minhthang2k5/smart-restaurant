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
  Input,
  Image,
  Row,
  Col,
  Carousel,
  Pagination,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  StarFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import * as menuService from "../../services/menuService";
import * as cartService from "../../services/cartService";
import { formatVND } from "../../utils/currency";
import ItemReviews from "../../components/customer/ItemReviews";

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
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedPageSize] = useState(10);

  useEffect(() => {
    const fetchItemDetail = async () => {
      try {
        setLoading(true);

        // Fetch public item detail (includes category + modifierGroups)
        const itemResponse = await menuService.getPublicMenuItem(itemId);
        const itemData = itemResponse.data;

        setItem(itemData);
        setCategory(itemData.category || null);
        setModifierGroups(itemData.modifierGroups || []);

        // Fetch related items from same category
        // Support both category_id and categoryId
        const categoryId = itemData.category_id || itemData.categoryId || itemData.category?.id;
        
        if (categoryId) {
          try {
            const menuResponse = await menuService.getPublicMenu({
              status: "available",
            });
            const allItems = menuResponse.data?.items || [];
            
            // Filter items from same category, exclude current item
            const related = allItems
              .filter(i => {
                const itemCategoryId = i.category_id || i.categoryId || i.category?.id;
                const sameCategory = itemCategoryId === categoryId;
                const notCurrentItem = i.id !== itemId;
                const isAvailable = i.status === "available";
                
                return sameCategory && notCurrentItem && isAvailable;
              })
              .slice(0, 8); // Limit to 8 items
            
            setRelatedItems(related);
            setRelatedPage(1); // Reset to page 1 when loading new items
          } catch (err) {
            console.error("Failed to load related items:", err);
          }
        }
      } catch (error) {
        message.error("Failed to load item details");
        console.error(error);
        navigate("/menu");
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetail();
  }, [itemId, navigate]);

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

    const optionIds = [];
    Object.values(selectedModifiers).forEach((value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach((id) => id && optionIds.push(id));
        return;
      }
      optionIds.push(value);
    });

    cartService.addToLocalCart({
      menuItemId: item.id,
      quantity: 1,
      modifiers: optionIds.map((optionId) => ({ optionId })),
      specialInstructions: specialInstructions.trim() || null,
    });

    message.success(`Added "${item.name}" to cart - ${formatVND(totalPrice)}`);

    // Navigate back to menu
    navigate("/menu");
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
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
        <Card bodyStyle={{ padding: 0 }}>
          {/* Image Carousel */}
          {item.photos && item.photos.length > 0 && (
            <div style={{ marginBottom: 0 }}>
              <Carousel 
                autoplay 
                dots={{ className: "custom-dots" }}
                style={{ 
                  borderRadius: "8px 8px 0 0", 
                  overflow: "hidden",
                  backgroundColor: "#f5f5f5"
                }}
              >
                {item.photos.map((photo) => (
                  <div 
                    key={photo.id}
                    style={{
                      height: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5"
                    }}
                  >
                    <Image
                      src={photo.url}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      preview={true}
                    />
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* Content with padding */}
          <div style={{ padding: 24 }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>
              {item.name}
              {item.is_chef_recommended && (
                <StarFilled style={{ color: "#faad14", marginLeft: 12, fontSize: 28 }} />
              )}
            </h1>
          </div>

          {/* Tags */}
          <Space style={{ marginBottom: 20 }} wrap size="middle">
            {category && <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>{category.name}</Tag>}
            <Tag color={statusColor[item.status]} style={{ fontSize: 14, padding: "4px 12px" }}>
              {item.status.replace("_", " ").toUpperCase()}
            </Tag>
            {item.is_chef_recommended && (
              <Tag color="gold" icon={<StarFilled />} style={{ fontSize: 14, padding: "4px 12px" }}>
                Chef's Pick
              </Tag>
            )}
            {item.prep_time_minutes > 0 && (
              <Tag icon={<ClockCircleOutlined />} style={{ fontSize: 14, padding: "4px 12px" }}>
                {item.prep_time_minutes} mins
              </Tag>
            )}
          </Space>

          {/* Description */}
          {item.description && (
            <p style={{ fontSize: 16, color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
              {item.description}
            </p>
          )}

          {/* Base Price */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: "#999", marginBottom: 4 }}>Base Price</div>
            <div
              style={{
                fontSize: 36,
                fontWeight: "bold",
                color: "#1890ff",
              }}
            >
              {formatVND(item.price)}
            </div>
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
                  const activeOptions = group.options || [];

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
                              <Radio 
                                key={option.id} 
                                value={option.id}
                                onClick={() => {
                                  // Allow deselect if clicking the same option
                                  if (selectedModifiers[group.id] === option.id) {
                                    setSelectedModifiers((prev) => ({
                                      ...prev,
                                      [group.id]: undefined,
                                    }));
                                  }
                                }}
                              >
                                <Space>
                                  <span>{option.name}</span>
                                  {option.price_adjustment > 0 && (
                                    <span style={{ color: "#1890ff" }}>
                                      +{formatVND(option.price_adjustment)}
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
                                      +{formatVND(option.price_adjustment)}
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

          {/* Special Instructions */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 8 }}>Special Instructions (Optional)</h3>
            <Input.TextArea
              rows={3}
              placeholder="Any special requests? E.g., no onions, less spicy, extra sauce..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>

          {/* Total Price & Add to Cart */}
          <div
            style={{
              padding: "24px",
              background: "#fafafa",
              borderRadius: 8,
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: "#999", marginBottom: 4 }}>Total Price</div>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: "bold",
                    color: "#52c41a",
                    lineHeight: 1,
                  }}
                >
                  {formatVND(totalPrice)}
                </div>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                style={{
                  height: 56,
                  fontSize: 18,
                  fontWeight: 600,
                  paddingLeft: 32,
                  paddingRight: 32,
                  borderRadius: 8,
                }}
              >
                Add to Cart
              </Button>
            </div>
          </div>
          </div>
        </Card>

        {/* Reviews Section */}
        <ItemReviews itemId={itemId} itemName={item.name} />

        {/* Related Items Section */}
        <Card 
          style={{ marginTop: 24 }}
          title={
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              More from {category?.name || "This Category"}
              {relatedItems.length > 0 && ` (${relatedItems.length} items)`}
            </div>
          }
        >
          {relatedItems.length > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                {(() => {
                  const slicedItems = relatedItems.slice(
                    (relatedPage - 1) * relatedPageSize, 
                    relatedPage * relatedPageSize
                  );

                  return slicedItems.map((relatedItem) => (
                <Col key={relatedItem.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable
                    onClick={() => {
                      navigate(`/menu/${relatedItem.id}`);
                      window.scrollTo(0, 0);
                    }}
                    style={{ 
                      height: "100%",
                      display: "flex",
                      flexDirection: "column"
                    }}
                    styles={{
                      body: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        padding: 16
                      }
                    }}
                    cover={
                      relatedItem.photos && relatedItem.photos.length > 0 ? (
                        <div
                          style={{
                            height: 180,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          <img
                            alt={relatedItem.name}
                            src={
                              relatedItem.photos.find((p) => p.is_primary)?.url ||
                              relatedItem.photos[0]?.url
                            }
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 180,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f0f0f0",
                            fontSize: 48,
                          }}
                        >
                          🍴
                        </div>
                      )
                    }
                  >
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      {/* Title */}
                      <div 
                        style={{ 
                          fontSize: 16, 
                          fontWeight: 600,
                          marginBottom: 8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          minHeight: 24
                        }}
                      >
                        {relatedItem.name}
                      </div>

                      {/* Description */}
                      <div
                        style={{
                          color: "#666",
                          fontSize: 13,
                          marginBottom: 8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: 40,
                          flex: 1
                        }}
                      >
                        {relatedItem.description || "No description available"}
                      </div>

                      {/* Rating */}
                      {relatedItem.average_rating > 0 && (
                        <div style={{ fontSize: 13, marginBottom: 8 }}>
                          <StarFilled style={{ color: "#fadb14" }} />{" "}
                          <span style={{ fontWeight: 600 }}>
                            {Number(relatedItem.average_rating).toFixed(1)}
                          </span>
                          <span style={{ color: "#999" }}>
                            {" "}
                            ({relatedItem.review_count || 0})
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#52c41a",
                          marginTop: "auto"
                        }}
                      >
                        {formatVND(relatedItem.price)}
                      </div>
                    </div>
                  </Card>
                </Col>
              ));
              })()}
            </Row>
            
            {/* Pagination */}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
              <Pagination
                current={relatedPage}
                pageSize={relatedPageSize}
                total={relatedItems.length}
                onChange={(page) => {
                  setRelatedPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                showSizeChanger={false}
                showQuickJumper={false}
              />
            </div>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#999",
                fontSize: 16,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
              <div>Các món ăn cùng loại không khả dụng</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
