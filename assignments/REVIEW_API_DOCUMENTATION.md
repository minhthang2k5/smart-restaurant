# Review System API Documentation

## Overview

API cho hệ thống đánh giá món ăn của khách hàng. Khách hàng có thể đánh giá món ăn sau khi hoàn thành phiên order, xem lại các đánh giá của mình, và quản lý reviews.

**Base URL**: `/api`

**Authentication**: Hầu hết endpoints yêu cầu JWT token trong header `Authorization: Bearer <token>`

---

## Endpoints

### 1. Get Reviews for Menu Item

Lấy danh sách đánh giá cho một món ăn (công khai, không cần authentication).

**Endpoint**: `GET /menu-items/:itemId/reviews`

**Authentication**: ❌ Không cần

**Parameters**:
- `itemId` (path, UUID) - ID của món ăn

**Query Parameters**:
- `page` (number, optional) - Trang hiện tại (default: 1)
- `limit` (number, optional) - Số reviews mỗi trang (default: 10, max: 50)
- `sort` (string, optional) - Sắp xếp theo:
  - `recent` (default) - Mới nhất
  - `highest` - Rating cao nhất
  - `lowest` - Rating thấp nhất
  - `helpful` - Hữu ích nhất

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "rating": 5,
        "comment": "Món ăn rất ngon, phục vụ tốt!",
        "helpful_count": 12,
        "created_at": "2026-01-10T10:30:00Z",
        "customer": {
          "id": "customer-uuid",
          "name": "Nguyễn Văn A",
          "avatar_url": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

**Example**:
```http
GET /api/menu-items/aa80c2ea-10bd-4c91-a954-f2b6d545c43a/reviews?page=1&limit=10&sort=recent
```

---

### 2. Get Reviewable Sessions

Lấy danh sách các phiên order đã hoàn thành mà khách hàng có thể đánh giá.

**Endpoint**: `GET /reviews/reviewable-sessions`

**Authentication**: ✅ Yêu cầu (Customer)

**Query Parameters**:
- `page` (number, optional) - Trang hiện tại (default: 1)
- `limit` (number, optional) - Số sessions mỗi trang (default: 10)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "33a91087-23fe-4305-b4a1-8f178427f916",
        "table_number": 5,
        "completed_at": "2026-01-10T15:30:00Z",
        "total_amount": 250000,
        "items": [
          {
            "item_id": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
            "item_name": "Phở Bò Đặc Biệt",
            "quantity": 2,
            "price": 75000,
            "image_url": "https://...",
            "reviewed": false,
            "review_id": null
          },
          {
            "item_id": "bb80c2ea-10bd-4c91-a954-f2b6d545c43b",
            "item_name": "Bún Chả Hà Nội",
            "quantity": 1,
            "price": 60000,
            "image_url": "https://...",
            "reviewed": true,
            "review_id": "review-uuid-123"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

**Example**:
```http
GET /api/reviews/reviewable-sessions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. Create Review

Tạo đánh giá mới cho một món ăn trong phiên order.

**Endpoint**: `POST /sessions/:sessionId/items/:itemId/review`

**Authentication**: ✅ Yêu cầu (Customer)

**Parameters**:
- `sessionId` (path, UUID) - ID của phiên order
- `itemId` (path, UUID) - ID của món ăn

**Request Body**:
```json
{
  "rating": 5,
  "comment": "Món ăn rất ngon, phục vụ tận tình!"
}
```

**Validation**:
- `rating`: Bắt buộc, số nguyên từ 1-5
- `comment`: Tùy chọn, chuỗi tối đa 1000 ký tự

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "menu_item_id": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
    "customer_id": "d5a36762-8c4f-4c99-a2c3-0e8e5b5e5e5e",
    "session_id": "33a91087-23fe-4305-b4a1-8f178427f916",
    "rating": 5,
    "comment": "Món ăn rất ngon, phục vụ tận tình!",
    "helpful_count": 0,
    "status": "approved",
    "created_at": "2026-01-12T10:30:00Z"
  }
}
```

**Example**:
```http
POST /api/sessions/33a91087-23fe-4305-b4a1-8f178427f916/items/aa80c2ea-10bd-4c91-a954-f2b6d545c43a/review
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "rating": 5,
  "comment": "Món ăn rất ngon!"
}
```

---

### 4. Update Review

Cập nhật đánh giá của khách hàng (chỉ chủ sở hữu mới có thể sửa).

**Endpoint**: `PUT /reviews/:id`

**Authentication**: ✅ Yêu cầu (Customer - chủ sở hữu review)

**Parameters**:
- `id` (path, UUID) - ID của review

**Request Body**:
```json
{
  "rating": 4,
  "comment": "Món ăn ngon nhưng phục vụ hơi chậm"
}
```

**Validation**:
- `rating`: Tùy chọn, số nguyên từ 1-5
- `comment`: Tùy chọn, chuỗi tối đa 1000 ký tự
- Ít nhất một trong hai fields phải được cung cấp

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "menu_item_id": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
    "rating": 4,
    "comment": "Món ăn ngon nhưng phục vụ hơi chậm",
    "updated_at": "2026-01-12T11:00:00Z"
  }
}
```

**Example**:
```http
PUT /api/reviews/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "rating": 4,
  "comment": "Món ăn ngon nhưng phục vụ hơi chậm"
}
```

---

### 5. Delete Review

Xóa đánh giá (chủ sở hữu hoặc admin).

**Endpoint**: `DELETE /reviews/:id`

**Authentication**: ✅ Yêu cầu (Customer - chủ sở hữu hoặc Admin)

**Parameters**:
- `id` (path, UUID) - ID của review

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Example**:
```http
DELETE /api/reviews/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 6. Get My Reviews

Lấy tất cả đánh giá của khách hàng hiện tại.

**Endpoint**: `GET /reviews/my-reviews`

**Authentication**: ✅ Yêu cầu (Customer)

**Query Parameters**:
- `page` (number, optional) - Trang hiện tại (default: 1)
- `limit` (number, optional) - Số reviews mỗi trang (default: 10)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "rating": 5,
        "comment": "Món ăn rất ngon!",
        "helpful_count": 12,
        "created_at": "2026-01-10T10:30:00Z",
        "updated_at": "2026-01-10T10:30:00Z",
        "menu_item": {
          "id": "aa80c2ea-10bd-4c91-a954-f2b6d545c43a",
          "name": "Phở Bò Đặc Biệt",
          "price": 75000,
          "image_url": "https://..."
        },
        "session": {
          "id": "33a91087-23fe-4305-b4a1-8f178427f916",
          "table_number": 5,
          "completed_at": "2026-01-10T15:30:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

**Example**:
```http
GET /api/reviews/my-reviews?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Responses

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Không có quyền truy cập |
| 404 | Not Found - Resource không tồn tại |
| 409 | Conflict - Review đã tồn tại |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Specific Error Messages

**Invalid UUID Format** (400):
```json
{
  "success": false,
  "message": "Invalid session ID or item ID format"
}
```

**Missing Rating** (400):
```json
{
  "success": false,
  "message": "Rating is required"
}
```

**Invalid Rating** (400):
```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

**Session Not Found** (404):
```json
{
  "success": false,
  "message": "Session not found"
}
```

**Session Not Completed** (403):
```json
{
  "success": false,
  "message": "Session is not completed yet"
}
```

**Duplicate Review** (409):
```json
{
  "success": false,
  "message": "You have already reviewed this item"
}
```

**Unauthorized Access** (403):
```json
{
  "success": false,
  "message": "You can only update your own reviews"
}
```

---

## Business Rules

### Review Creation Rules

1. **Session phải ở trạng thái 'completed'**: Khách hàng chỉ có thể review sau khi hoàn thành phiên order
2. **Một review cho mỗi món mỗi session**: Không thể tạo review trùng lặp
3. **Ownership validation**: Khách hàng chỉ có thể review món ăn trong session của mình
4. **Rating range**: Rating phải từ 1-5 (số nguyên)
5. **Comment length**: Tối đa 1000 ký tự

### Review Update Rules

1. **Ownership**: Chỉ chủ sở hữu mới có thể sửa review của mình
2. **Partial updates**: Có thể cập nhật rating, comment, hoặc cả hai
3. **Validation**: Rating và comment vẫn phải tuân theo quy tắc như khi tạo mới

### Review Delete Rules

1. **Ownership or Admin**: Chủ sở hữu hoặc admin có thể xóa review
2. **Cascade effects**: Xóa review sẽ tự động cập nhật average_rating của món ăn (qua database trigger)

### Auto-Rating Calculation

- Database trigger tự động tính `average_rating` và `review_count` cho menu_items
- Trigger được kích hoạt khi:
  - Tạo review mới (INSERT)
  - Cập nhật rating (UPDATE)
  - Xóa review (DELETE)

---

## Pagination

Tất cả endpoints trả về danh sách đều hỗ trợ pagination:

**Query Parameters**:
- `page`: Trang hiện tại (default: 1)
- `limit`: Số items mỗi trang (default: 10, max: 50)

**Response Format**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

## Sorting Options

Endpoint `GET /menu-items/:itemId/reviews` hỗ trợ sorting:

| Sort Value | Description | Order |
|------------|-------------|-------|
| `recent` | Mới nhất | `created_at DESC` |
| `highest` | Rating cao nhất | `rating DESC, created_at DESC` |
| `lowest` | Rating thấp nhất | `rating ASC, created_at DESC` |
| `helpful` | Hữu ích nhất | `helpful_count DESC, created_at DESC` |

**Example**:
```http
GET /api/menu-items/aa80c2ea-10bd-4c91-a954-f2b6d545c43a/reviews?sort=helpful&page=1&limit=10
```

---

## Database Schema

### Table: `reviews`

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(menu_item_id, customer_id, session_id)
);
```

### Indexes

1. `idx_reviews_menu_item` - Tìm reviews theo món ăn (nhanh)
2. `idx_reviews_customer` - Tìm reviews theo khách hàng
3. `idx_reviews_session` - Tìm reviews theo session
4. `idx_reviews_rating` - Sort theo rating
5. `idx_reviews_created_at` - Sort theo thời gian
6. `idx_reviews_helpful_count` - Sort theo helpful
7. `idx_reviews_status` - Filter theo status

### Trigger: Auto-update average_rating

```sql
CREATE OR REPLACE FUNCTION update_menu_item_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE menu_items
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
            FROM reviews
            WHERE menu_item_id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
            AND status = 'approved'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE menu_item_id = COALESCE(NEW.menu_item_id, OLD.menu_item_id)
            AND status = 'approved'
        )
    WHERE id = COALESCE(NEW.menu_item_id, OLD.menu_item_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

---

## Architecture

### Layer Structure

```
reviewRoutes.js (HTTP Layer)
    ↓
reviewController.js (Controller Layer - HTTP handling, validation)
    ↓
reviewService.js (Service Layer - Business logic)
    ↓
Review.js (Model Layer - Database operations)
```

### Controller Responsibilities

- HTTP request/response handling
- UUID validation
- Parameter extraction
- Error code mapping (400, 403, 404, 500)
- JSON response formatting

### Service Responsibilities

- Business logic execution
- Data validation
- Database queries
- Error throwing with descriptive messages
- Transaction management

### Model Responsibilities

- Database schema definition
- Associations (belongsTo MenuItem, User, TableSession)
- Data validation (Sequelize validators)

---

## Testing

### Test File: `test/review-test.rest`

40+ test cases covering:

1. **Public Endpoints** (6 tests)
   - Get reviews with pagination
   - Get reviews with sorting
   - Get reviews for invalid item

2. **Create Review** (6 tests)
   - Valid review
   - Duplicate review
   - Invalid session
   - Missing rating

3. **Update Review** (3 tests)
   - Update rating
   - Update comment
   - Update both

4. **Delete Review** (3 tests)
   - Owner delete
   - Admin delete
   - Unauthorized delete

5. **Workflow Tests** (7 steps)
   - Complete order flow
   - Review creation flow

### Helper Scripts

- `scripts/checkSession.js` - Validate session data
- `scripts/getTestIds.js` - Get real test IDs from database

---

## Security

### Authentication

- JWT tokens required for protected endpoints
- Token verification in `authenticate` middleware
- Token format: `Authorization: Bearer <token>`

### Authorization

- Role-based access control
- `authorize('customer')` middleware for customer endpoints
- Admin can delete any review, customers can only delete own

### Validation

- UUID format validation before database queries
- Input sanitization (rating range, comment length)
- Ownership validation for update/delete operations

### SQL Injection Prevention

- Sequelize ORM with parameterized queries
- No raw SQL in controllers or services
- Input validation at controller layer

---

## Performance Considerations

### Indexes

- 7 indexes created for optimal query performance
- Composite index on (menu_item_id, customer_id, session_id) for unique constraint

### Pagination

- Default limit: 10 items
- Max limit: 50 items
- Offset-based pagination using `LIMIT` and `OFFSET`

### Query Optimization

- `findAndCountAll` for paginated results (single query)
- Selective field loading with `attributes`
- Join optimization with `include` and `required: false`

### Caching Opportunities

- Menu item reviews can be cached (public data)
- Average ratings cached in menu_items table (denormalized)
- Consider Redis for frequently accessed reviews

---

## Future Enhancements

### Possible Features

1. **Review Images**: Allow customers to upload photos
2. **Helpful Votes**: Let users mark reviews as helpful
3. **Review Responses**: Restaurant can respond to reviews
4. **Review Moderation**: Admin approval workflow
5. **Review Analytics**: Charts and statistics
6. **Verified Reviews**: Badge for verified orders
7. **Review Editing History**: Track changes
8. **Review Reports**: Flag inappropriate content

### API Versioning

Current version: `v1` (implicit)

Future versions can be added:
- `/api/v2/reviews/...`
- Breaking changes in new version
- Maintain backward compatibility in v1

---

## Example Workflow

### Complete Review Flow

1. **Customer completes order**
   ```http
   POST /api/sessions/:sessionId/complete
   ```

2. **Customer views reviewable sessions**
   ```http
   GET /api/reviews/reviewable-sessions
   ```

3. **Customer creates review**
   ```http
   POST /api/sessions/:sessionId/items/:itemId/review
   {
     "rating": 5,
     "comment": "Excellent!"
   }
   ```

4. **System auto-updates menu item rating**
   - Database trigger calculates new average_rating
   - Updates menu_items.average_rating and review_count

5. **Customer views their reviews**
   ```http
   GET /api/reviews/my-reviews
   ```

6. **Public can see reviews**
   ```http
   GET /api/menu-items/:itemId/reviews?sort=helpful
   ```

---

## Contact & Support

For questions or issues:
- Check error messages in response
- Review business rules section
- Test with provided REST client file
- Contact development team

**Last Updated**: January 12, 2026
**API Version**: 1.0.0
**Documentation Version**: 1.0.0
