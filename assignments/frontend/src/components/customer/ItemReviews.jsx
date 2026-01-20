import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  List,
  Rate,
  Avatar,
  Empty,
  Pagination,
  Spin,
  Divider,
  Button,
  Alert,
} from "antd";
import { UserOutlined, StarFilled, EditOutlined } from "@ant-design/icons";
import * as reviewService from "../../services/reviewService";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function ItemReviews({ itemId, itemName }) {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [itemId, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getItemReviews(itemId, {
        page,
        limit: pageSize,
        sort: "recent",
      });

      if (response.data) {
        const reviews = response.data.reviews || [];
        const pagination = response.data.pagination || {};
        const stats = response.data.stats || null;

        setReviews(reviews);
        setTotal(pagination.total || 0);
        setStats(stats);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderReviewStats = () => {
    if (!stats || stats.totalReviews === 0) return null;

    return (
      <div
        style={{
          padding: "20px 24px",
          background: "#fafafa",
          borderRadius: 8,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "#faad14",
              lineHeight: 1,
            }}
          >
            {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
          </div>
          <Rate
            disabled
            allowHalf
            value={stats.averageRating || 0}
            style={{ fontSize: 20, marginTop: 8 }}
          />
          <div style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
            {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution?.[rating] || 0;
            const percentage =
              stats.totalReviews > 0
                ? ((count / stats.totalReviews) * 100).toFixed(0)
                : 0;

            return (
              <div
                key={rating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 60,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <StarFilled style={{ color: "#faad14", fontSize: 14 }} />
                  <span style={{ fontSize: 14 }}>{rating}</span>
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: "#e8e8e8",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: "#faad14",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 50,
                    textAlign: "right",
                    fontSize: 14,
                    color: "#666",
                  }}
                >
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card
      title={
        <span style={{ fontSize: 20, fontWeight: 600 }}>
          Customer Reviews
          {stats && stats.totalReviews > 0 && (
            <span
              style={{
                color: "#999",
                fontWeight: 400,
                fontSize: 16,
                marginLeft: 8,
              }}
            >
              ({stats.totalReviews})
            </span>
          )}
        </span>
      }
      style={{ marginTop: 24 }}
    >
      {customer && (
        <Alert
          message="Want to review this item?"
          description={
            <div>
              You can write a review after ordering and completing your meal.{" "}
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => navigate("/customer/reviews")}
                style={{ padding: 0 }}
              >
                Go to My Reviews
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {renderReviewStats()}

      <Spin spinning={loading}>
        {reviews.length === 0 ? (
          <Empty
            description="No reviews yet. Be the first to review this item!"
            style={{ padding: "40px 0" }}
          />
        ) : (
          <>
            <List
              dataSource={reviews}
              renderItem={(review) => (
                <List.Item
                  style={{
                    padding: "20px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={48}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                      >
                        {review.customer?.name?.[0]?.toUpperCase() || "?"}
                      </Avatar>
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600 }}>
                            {review.customer?.name || "Anonymous"}
                          </div>
                          <Rate
                            disabled
                            value={review.rating}
                            style={{ fontSize: 16, marginTop: 4 }}
                          />
                        </div>
                        <div style={{ fontSize: 13, color: "#999" }}>
                          {review.created_at
                            ? dayjs(review.created_at).fromNow()
                            : ""}
                        </div>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 12 }}>
                        {review.comment && (
                          <p
                            style={{
                              fontSize: 15,
                              color: "#262626",
                              marginBottom: 8,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {review.comment}
                          </p>
                        )}
                        {review.session && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#999",
                              marginTop: 8,
                            }}
                          >
                            Table {review.session.table?.table_number || "N/A"}{" "}
                            •{" "}
                            {review.session.created_at
                              ? dayjs(review.session.created_at).format(
                                  "MMM DD, YYYY",
                                )
                              : ""}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {total > pageSize && (
              <>
                <Divider />
                <div style={{ textAlign: "center", paddingTop: 16 }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={(newPage) => setPage(newPage)}
                    showSizeChanger={false}
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total} reviews`
                    }
                  />
                </div>
              </>
            )}
          </>
        )}
      </Spin>
    </Card>
  );
}
