import { useEffect, useMemo, useState } from "react";
import { Card, Descriptions, Form, Input, Button, App, Space } from "antd";
import userService from "../../services/userService";
import { useAuth } from "../../contexts/AuthContext";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [saving, setSaving] = useState(false);

  const initialValues = useMemo(
    () => ({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    }),
    [user]
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const onSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const values = await form.validateFields();
      const payload = {
        firstName: values.firstName?.trim() || undefined,
        lastName: values.lastName?.trim() || undefined,
      };

      await userService.updateProfile(payload);
      message.success("Profile updated successfully");
      await refreshUser();
    } catch (error) {
      if (error?.errorFields) {
        message.error("Please check the form fields");
      } else {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile";
        message.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>My Profile</h2>
      </div>

      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        <Card>
          <Descriptions title="Account" column={1} size="small">
            <Descriptions.Item label="Email">
              {user?.email || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              {user?.role || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {user?.status || "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Update name">
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            disabled={saving}
          >
            <Form.Item
              name="firstName"
              label="First name"
              rules={[
                {
                  min: 2,
                  max: 50,
                  message: "First name must be 2-50 characters",
                },
              ]}
            >
              <Input placeholder="First name" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last name"
              rules={[
                {
                  min: 2,
                  max: 50,
                  message: "Last name must be 2-50 characters",
                },
              ]}
            >
              <Input placeholder="Last name" />
            </Form.Item>

            <Button type="primary" onClick={onSave} loading={saving}>
              Save changes
            </Button>
          </Form>
        </Card>
      </Space>
    </div>
  );
}
