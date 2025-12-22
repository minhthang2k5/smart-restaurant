import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Checkbox,
  Divider,
  Radio,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useMenu } from "../../context/MenuContext.jsx";

function formatVND(n) {
  return Number(n || 0).toLocaleString() + "đ";
}

export default function GuestItemDetail() {
  const { itemId } = useParams();
  const nav = useNavigate();
  const { items, categories, modifierGroups } = useMenu();

  const item = items.find((x) => x.id === itemId);
  const category = item
    ? categories.find((c) => c.id === item.categoryId)
    : null;

  const attachedGroups = useMemo(() => {
    if (!item) return [];
    return modifierGroups.filter((g) => item.modifierGroupIds?.includes(g.id));
  }, [item, modifierGroups]);

  // selections: { [groupId]: optionId|string[] }
  const [selections, setSelections] = useState({});

  const basePrice = item?.price ?? 0;

  const selectedAdjustment = useMemo(() => {
    let sum = 0;

    for (const g of attachedGroups) {
      const sel = selections[g.id];

      if (!sel) continue;

      if (g.selectionType === "single") {
        const opt = g.options.find((o) => o.id === sel);
        if (opt && opt.status !== "inactive")
          sum += Number(opt.priceAdjustment || 0);
      } else {
        const ids = Array.isArray(sel) ? sel : [];
        for (const id of ids) {
          const opt = g.options.find((o) => o.id === id);
          if (opt && opt.status !== "inactive")
            sum += Number(opt.priceAdjustment || 0);
        }
      }
    }

    return sum;
  }, [attachedGroups, selections]);

  const totalPrice = basePrice + selectedAdjustment;

  if (!item) {
    return (
      <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        <Typography.Title level={4}>Item not found</Typography.Title>
        <Button onClick={() => nav("/menu")}>Back to menu</Button>
      </div>
    );
  }

  // guest visibility rule UI-only
  if (category?.status !== "active" || item.status === "hidden") {
    return (
      <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        <Typography.Title level={4}>
          This item is not available.
        </Typography.Title>
        <Button onClick={() => nav("/menu")}>Back to menu</Button>
      </div>
    );
  }

  function setSingle(groupId, optionId) {
    setSelections((prev) => ({ ...prev, [groupId]: optionId }));
  }

  function setMultiple(groupId, optionIds) {
    setSelections((prev) => ({ ...prev, [groupId]: optionIds }));
  }

  function validateBeforeAdd() {
    for (const g of attachedGroups) {
      const sel = selections[g.id];

      // only consider active options
      const activeOptions = g.options.filter((o) => o.status !== "inactive");

      if (g.required) {
        if (!sel || (Array.isArray(sel) && sel.length === 0)) {
          return `Please select option(s) for "${g.name}".`;
        }
      }

      if (g.selectionType === "multiple") {
        const chosen = Array.isArray(sel) ? sel : [];
        const chosenActive = chosen.filter((id) =>
          activeOptions.some((o) => o.id === id)
        );

        const min = Number(g.min ?? 0);
        const max = Number(g.max ?? chosenActive.length);

        if (chosenActive.length < min) {
          return `"${g.name}": choose at least ${min}.`;
        }
        if (chosenActive.length > max) {
          return `"${g.name}": choose at most ${max}.`;
        }
      }
    }
    return null;
  }

  function onAddToCart() {
    if (item.status === "sold_out") {
      message.error("This item is sold out.");
      return;
    }

    const err = validateBeforeAdd();
    if (err) {
      message.warning(err);
      return;
    }

    // UI-only
    message.success("Added to cart (UI only)");
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Button onClick={() => nav("/menu")}>← Back</Button>

        <Card>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {item.name}
              </Typography.Title>
              <Tag color={item.status === "available" ? "green" : "red"}>
                {item.status}
              </Tag>
            </Space>

            <Typography.Text type="secondary">
              {category?.name ?? "Unknown category"}
            </Typography.Text>

            {item.description ? (
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {item.description}
              </Typography.Paragraph>
            ) : null}

            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Typography.Text strong style={{ fontSize: 18 }}>
                {formatVND(totalPrice)}
              </Typography.Text>
              <Typography.Text type="secondary">
                Base: {formatVND(basePrice)} • Add-ons:{" "}
                {formatVND(selectedAdjustment)}
              </Typography.Text>
            </Space>

            {item.status === "sold_out" ? (
              <Typography.Text type="danger">Sold out</Typography.Text>
            ) : null}
          </Space>
        </Card>

        {/* Modifiers */}
        {attachedGroups.map((g) => {
          const activeOptions = g.options.filter(
            (o) => o.status !== "inactive"
          );

          if (activeOptions.length === 0) return null;

          return (
            <Card
              key={g.id}
              title={
                <Space>
                  <span>{g.name}</span>
                  {g.required ? (
                    <Tag color="purple">required</Tag>
                  ) : (
                    <Tag>optional</Tag>
                  )}
                  <Tag color="blue">{g.selectionType}</Tag>
                  {g.selectionType === "multiple" ? (
                    <Tag>
                      min {g.min ?? 0} / max {g.max ?? "-"}
                    </Tag>
                  ) : null}
                </Space>
              }
            >
              {g.selectionType === "single" ? (
                <Radio.Group
                  value={selections[g.id]}
                  onChange={(e) => setSingle(g.id, e.target.value)}
                >
                  <Space direction="vertical">
                    {activeOptions.map((o) => (
                      <Radio key={o.id} value={o.id}>
                        <Space>
                          <span>{o.name}</span>
                          {Number(o.priceAdjustment) !== 0 ? (
                            <Typography.Text type="secondary">
                              (+{formatVND(o.priceAdjustment)})
                            </Typography.Text>
                          ) : (
                            <Typography.Text type="secondary">
                              (no extra)
                            </Typography.Text>
                          )}
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              ) : (
                <Checkbox.Group
                  value={
                    Array.isArray(selections[g.id]) ? selections[g.id] : []
                  }
                  onChange={(vals) => setMultiple(g.id, vals)}
                >
                  <Space direction="vertical">
                    {activeOptions.map((o) => (
                      <Checkbox key={o.id} value={o.id}>
                        <Space>
                          <span>{o.name}</span>
                          {Number(o.priceAdjustment) !== 0 ? (
                            <Typography.Text type="secondary">
                              (+{formatVND(o.priceAdjustment)})
                            </Typography.Text>
                          ) : (
                            <Typography.Text type="secondary">
                              (no extra)
                            </Typography.Text>
                          )}
                        </Space>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}
            </Card>
          );
        })}

        {attachedGroups.length === 0 ? (
          <Card>
            <Typography.Text type="secondary">
              No modifiers for this item.
            </Typography.Text>
          </Card>
        ) : null}

        <Divider />

        <Button
          type="primary"
          size="large"
          onClick={onAddToCart}
          disabled={item.status === "sold_out"}
        >
          Add to cart (UI only) • {formatVND(totalPrice)}
        </Button>
      </Space>
    </div>
  );
}
