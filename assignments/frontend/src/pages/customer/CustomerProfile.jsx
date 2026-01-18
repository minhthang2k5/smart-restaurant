import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Card, Form, Input, Skeleton, Space, Divider } from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
  HistoryOutlined,
  StarOutlined,
  UploadOutlined
} from "@ant-design/icons";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import customerAuthService from "../../services/customerAuthService";
import { Avatar, Upload } from "antd";

export default function CustomerProfile() {
  const { message } = App.useApp();
  const { customer, refreshCustomer, updateProfile, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handleLogout = async () => {
    await logout();
    message.success("Logged out successfully");
    navigate("/customer/login");
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
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Space direction="vertical" align="center">
              <Avatar size={100} src={customer?.avatar} icon={<UserOutlined />} />
              <Upload
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  setUploading(true);
                  try {
                    await customerAuthService.uploadAvatar(file);
                    message.success("Avatar updated");
                    await refreshCustomer();
                    onSuccess("ok");
                  } catch (err) {
                    message.error("Failed to upload avatar");
                    onError(err);
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>Change Photo</Button>
              </Upload>
            </Space>
          </div>
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

          <Divider />

          {/* Quick Actions */}
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              icon={<HistoryOutlined />}
              size="large"
              block
              onClick={() => navigate("/customer/order-history")}
            >
              View Order History
            </Button>
            <Button
              icon={<StarOutlined />}
              size="large"
              block
              onClick={() => navigate("/customer/reviews")}
            >
              My Reviews
            </Button>
            <Button
              icon={<LogoutOutlined />}
              size="large"
              block
              danger
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
