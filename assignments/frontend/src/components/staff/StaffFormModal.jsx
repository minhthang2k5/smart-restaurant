import { useEffect, useMemo } from "react";
import { Modal, Form, Input, Select } from "antd";

const passwordRules = [
  { required: true, message: "Vui lòng nhập mật khẩu" },
  {
    min: 8,
    message: "Mật khẩu tối thiểu 8 ký tự",
  },
  {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    message: "Mật khẩu phải có chữ hoa, chữ thường và số",
  },
];

export default function StaffFormModal({
  open,
  editing,
  loading,
  onCancel,
  onSubmit,
}) {
  const [form] = Form.useForm();

  const initialValues = useMemo(() => {
    if (!editing) {
      return {
        role: "waiter",
      };
    }

    return {
      email: editing.email,
      firstName: editing.firstName,
      lastName: editing.lastName,
      role: editing.role,
      status: editing.status,
      restaurantId: editing.restaurantId || null,
    };
  }, [editing]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(initialValues);
  }, [form, initialValues, open]);

  const handleOk = async () => {
    const values = await form.validateFields();

    const payload = {
      email: values.email?.trim(),
      firstName: values.firstName?.trim(),
      lastName: values.lastName?.trim(),
      role: values.role,
    };

    if (values.restaurantId) payload.restaurantId = values.restaurantId;

    if (!editing) {
      payload.password = values.password;
    } else if (values.status) {
      payload.status = values.status;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      title={editing ? "Cập nhật nhân viên" : "Thêm nhân viên"}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={editing ? "Cập nhật" : "Tạo"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical" disabled={loading}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input placeholder="staff@smartrestaurant.com" />
        </Form.Item>

        {!editing && (
          <Form.Item name="password" label="Mật khẩu" rules={passwordRules}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
        )}

        <Form.Item
          name="firstName"
          label="First name"
          rules={[
            { required: true, message: "Vui lòng nhập first name" },
            { min: 2, max: 50 },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="Last name"
          rules={[
            { required: true, message: "Vui lòng nhập last name" },
            { min: 2, max: 50 },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          <Select>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="waiter">Waiter</Select.Option>
            <Select.Option value="kitchen_staff">Kitchen Staff</Select.Option>
          </Select>
        </Form.Item>

        {editing && (
          <Form.Item name="status" label="Trạng thái">
            <Select allowClear placeholder="Không đổi">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item name="restaurantId" label="Restaurant ID (optional)">
          <Input placeholder="UUID (optional)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
