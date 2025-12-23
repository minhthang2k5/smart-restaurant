import { Card, Checkbox, Divider, Space, Typography } from "antd";

export default function ModifierAttach({
  modifierGroups,
  selectedIds,
  onChange,
}) {
  const options = modifierGroups.map((g) => ({
    label: `${g.name} (${g.selectionType}${g.required ? ", required" : ""})`,
    value: g.id,
  }));

  return (
    <Card title="Attach Modifiers">
      <Checkbox.Group
        options={options}
        value={selectedIds}
        onChange={onChange}
      />
      <Divider />
      <Typography.Text type="secondary">
        Selected: {selectedIds?.length ? selectedIds.join(", ") : "None"}
      </Typography.Text>
    </Card>
  );
}
