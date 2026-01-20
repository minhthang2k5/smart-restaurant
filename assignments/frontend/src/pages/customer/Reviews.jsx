import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  List,
  Typography,
  Spin,
  message,
  Empty,
  Button,
  Modal,
  Rate,
  Input,
  Space,
  Tag,
  Pagination,
} from "antd";
import {
  ArrowLeftOutlined,
  StarOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import * as reviewService from "../../services/reviewService";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};

export default function Reviews() {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const [loading, setLoading] = useState(true);
  const [reviewableSessions, setReviewableSessions] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  
  // Pagination for My Reviews
  const [myReviewsPage, setMyReviewsPage] = useState(1);
  const [myReviewsPageSize] = useState(5);
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, reviewsRes] = await Promise.all([
        reviewService.getReviewableSessions(),
        reviewService.getMyReviews(),
      ]);
      setReviewableSessions(sessionsRes?.data || []);
      setMyReviews(reviewsRes?.data || []);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to load review data"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customer) {
      message.warning("Please log in to view and write reviews");
      navigate("/customer/login");
      return;
    }
    fetchReviewData();
  }, [customer, navigate]);

  const handleOpenReviewModal = (sessionId, itemId, itemName) => {
    setSelectedItem({ sessionId, itemId, itemName });
    setRating(5);
    setComment("");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;
    
    try {
      setSubmitting(true);
      await reviewService.createReview(
        selectedItem.sessionId,
        selectedItem.itemId,
        { rating, comment }
      );
      message.success("Review submitted successfully!");
      setReviewModalOpen(false);
      await fetchReviewData();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to submit review"
      );
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    Modal.confirm({
      title: "Delete Review",
      content: "Are you sure you want to delete this review?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await reviewService.deleteReview(reviewId);
          message.success("Review deleted successfully!");
          await fetchReviewData();
        } catch (error) {
          message.error(
            error?.response?.data?.message || "Failed to delete review"
          );
          console.error(error);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Space
        style={{ width: "100%", marginBottom: "20px" }}
        direction="vertical"
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/menu")}
        >
          Back to Menu
        </Button>
        <Title level={2}>Reviews</Title>
      </Space>

      {/* Reviewable Items Section */}
      <Card
        title="Items You Can Review"
        style={{ marginBottom: "20px" }}
        extra={<StarOutlined />}
      >
        {reviewableSessions.length === 0 ? (
          <Empty description="No items available for review" />
        ) : (
          <List
            dataSource={reviewableSessions}
            renderItem={(session) => {
              // Extract unreviewable items from orders
              const reviewableItems = [];
              (session.orders || []).forEach((order) => {
                (order.items || []).forEach((item) => {
                  if (!item.reviewed && item.menuItem) {
                    // Check if item already added (aggregate quantities)
                    const existing = reviewableItems.find(
                      (r) => r.id === item.menuItem.id
                    );
                    if (existing) {
                      existing.totalQuantity += item.quantity || 1;
                    } else {
                      reviewableItems.push({
                        id: item.menuItem.id,
                        name: item.menuItem.name,
                        totalQuantity: item.quantity || 1,
                      });
                    }
                  }
                });
              });

              if (reviewableItems.length === 0) {
                return null; // Skip sessions with no reviewable items
              }

              return (
                <div key={session.id} style={{ marginBottom: "20px" }}>
                  <Tag color="blue">
                    Table {session.table?.table_number || "N/A"}
                  </Tag>
                  <Text type="secondary" style={{ marginLeft: "8px" }}>
                    {formatDate(session.completed_at)}
                  </Text>
                  <List
                    dataSource={reviewableItems}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        actions={[
                          <Button
                            key="review"
                            type="primary"
                            icon={<StarOutlined />}
                            onClick={() =>
                              handleOpenReviewModal(
                                session.id,
                                item.id,
                                item.name
                              )
                            }
                          >
                            Write Review
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={item.name}
                          description={`Ordered ${item.totalQuantity} time(s)`}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              );
            }}
          />
        )}
      </Card>

      {/* My Reviews Section */}
      <Card title="My Reviews" extra={<EditOutlined />}>
        {myReviews.length === 0 ? (
          <Empty description="You haven't written any reviews yet" />
        ) : (
          <>
            <List
              dataSource={myReviews.slice(
                (myReviewsPage - 1) * myReviewsPageSize,
                myReviewsPage * myReviewsPageSize
              )}
              renderItem={(review) => (
                <List.Item
                  key={review.id}
                  actions={[
                    <Button
                      key="delete"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      Delete
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                    <Space>
                      <Rate disabled value={review.rating} />
                      <Text strong>{review.menuItem?.name || "Unknown"}</Text>
                    </Space>
                  }
                  description={
                    <>
                      <Paragraph style={{ marginBottom: "4px" }}>
                        {review.comment || "No comment"}
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {formatDate(review.created_at)}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
          {myReviews.length > myReviewsPageSize && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Pagination
                current={myReviewsPage}
                pageSize={myReviewsPageSize}
                total={myReviews.length}
                onChange={(page) => setMyReviewsPage(page)}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} reviews`
                }
              />
            </div>
          )}
          </>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        title={`Review: ${selectedItem?.itemName || ""}`}
        open={reviewModalOpen}
        onOk={handleSubmitReview}
        onCancel={() => setReviewModalOpen(false)}
        confirmLoading={submitting}
        okText="Submit Review"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text>Rating:</Text>
            <Rate value={rating} onChange={setRating} style={{ marginLeft: "8px" }} />
          </div>
          <div style={{ width: "100%" }}>
            <Text>Comment (optional):</Text>
            <TextArea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience with this dish..."
              style={{ marginTop: "8px" }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
