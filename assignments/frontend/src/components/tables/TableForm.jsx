import { Modal, Form, Input, InputNumber, Select } from "antd";

const { TextArea } = Input;
const { Option } = Select;

const TableForm = ({ open, onCancel, onSubmit, initialValues, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const success = await onSubmit(values);
      if (success) {
        form.resetFields();
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title={initialValues ? "Edit Table" : "Create New Table"}
      open={open}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          initialValues || {
            capacity: 4,
            location: "Main Hall",
          }
        }
      >
        <Form.Item
          label="Table Number"
          name="tableNumber"
          rules={[
            { required: true, message: "Please input table number!" },
            {
              pattern: /^[A-Z0-9-]+$/i,
              message: "Only letters, numbers and hyphens allowed",
            },
          ]}
        >
          <Input placeholder="e.g., T-01, VIP-A" />
        </Form.Item>

        <Form.Item
          label="Capacity"
          name="capacity"
          rules={[
            { required: true, message: "Please input capacity!" },
            {
              type: "number",
              min: 1,
              max: 20,
              message: "Capacity must be between 1 and 20",
            },
          ]}
        >
          <InputNumber
            min={1}
            max={20}
            style={{ width: "100%" }}
            addonAfter="people"
          />
        </Form.Item>

        <Form.Item
          label="Location"
          name="location"
          rules={[{ required: true, message: "Please select location!" }]}
        >
          <Select placeholder="Select location">
            <Option value="Main Hall">Main Hall</Option>
            <Option value="Outdoor">Outdoor</Option>
            <Option value="VIP Room">VIP Room</Option>
            <Option value="Terrace">Terrace</Option>
            <Option value="Bar Area">Bar Area</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea rows={3} placeholder="Optional notes about this table..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TableForm;
