import { Checkbox, Space, Tag } from "antd";

export default function ModifierAttach({
  modifierGroups,
  selectedIds,
  onChange,
}) {
  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Chọn nhóm tùy chọn cho món ăn</h3>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Chọn các nhóm tùy chọn mà khách hàng có thể chọn khi đặt món này.
      </p>

      <Checkbox.Group
        style={{ width: "100%" }}
        value={selectedIds}
        onChange={onChange}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {modifierGroups.map((group) => (
            <Checkbox key={group.id} value={group.id}>
              <Space>
                <span style={{ fontWeight: 500 }}>{group.name}</span>
                <Tag
                  color={group.selection_type === "single" ? "blue" : "green"}
                >
                  {group.selection_type === "single"
                    ? "Chọn duy nhất"
                    : "Chọn nhiều"}
                </Tag>
                {group.is_required && <Tag color="red">Bắt buộc</Tag>}
              </Space>
            </Checkbox>
          ))}
        </Space>
      </Checkbox.Group>

      {modifierGroups.length === 0 && (
        <p style={{ color: "#999", fontStyle: "italic" }}>
          Chưa có nhóm tùy chọn nào. Hãy tạo nhóm tùy chọn trước.
        </p>
      )}
    </div>
  );
}
