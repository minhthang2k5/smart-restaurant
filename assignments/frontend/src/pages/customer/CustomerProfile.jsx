import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Card, Form, Input, Skeleton } from "antd";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

export default function CustomerProfile() {
  const { message } = App.useApp();
  const { customer, refreshCustomer, updateProfile } = useCustomerAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const profile = (await refreshCustomer()) || customer;
        if (profile) {
          form.setFieldsValue({
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values) => {
    if (saving) return;
    setSaving(true);

    try {
      await updateProfile({
        firstName: values.firstName?.trim(),
        lastName: values.lastName?.trim(),
      });
      message.success("Profile updated");
    } catch (error) {
      const msg =
        error?.response?.data?.message || error?.message || "Update failed";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#f5f5f5", padding: "24px 0" }}
    >
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
              <UserOutlined /> Profile
            </span>
          }
        >
          {loading ? (
            <Skeleton active />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              disabled={saving}
            >
              <Form.Item
                name="firstName"
                label="First name"
                rules={[{ required: true, message: "First name is required" }]}
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                name="lastName"
                label="Last name"
                rules={[{ required: true, message: "Last name is required" }]}
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item name="email" label="Email">
                <Input size="large" disabled />
              </Form.Item>

              <Button
                htmlType="submit"
                size="large"
                loading={saving}
                style={{
                  width: "100%",
                  background: "#1677ff",
                  borderColor: "#1677ff",
                  color: "white",
                  borderRadius: 12,
                  fontWeight: 700,
                }}
              >
                Save Changes
              </Button>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
