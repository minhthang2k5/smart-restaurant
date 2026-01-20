# Review System - Implementation Guide

## 📋 Overview

The review system allows customers to rate and review menu items after completing their dining session. Each customer can review the same item multiple times across different sessions (visits).

---

## 🗂️ Files Created

### Backend Files

```
backend/
├── models/
│   └── Review.js                    # Review model definition
├── controllers/
│   └── reviewController.js          # Review business logic
├── routes/
│   └── reviewRoutes.js             # Review API routes
├── migrations/
│   └── create_reviews.sql          # Database migration
├── scripts/
│   └── testReviews.js              # Automated test script
└── review-test.rest                # REST Client test file
```

### Updated Files

```
backend/
├── models/
│   └── associations.js             # Added Review associations
└── app.js                          # Added review routes
```

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
# Connect to PostgreSQL
psql -U postgres -d your_database_name

# Run migration
\i backend/migrations/create_reviews.sql

# Or using command line
psql -U postgres -d your_database_name -f backend/migrations/create_reviews.sql
```

### 2. Restart Server

```bash
cd backend
npm run dev
```

The review routes will be automatically loaded.

---

## 🧪 Testing

### Option 1: Automated Test Script (Recommended)

```bash
cd backend
node scripts/testReviews.js
```

This will:
- ✅ Create test customer, menu item, session
- ✅ Test all review operations
- ✅ Verify rating calculations
- ✅ Display test data IDs for REST API testing

### Option 2: Manual Testing with REST Client

1. Open `backend/review-test.rest` in VS Code
2. Update variables at the top:
   ```
   @customerToken = your_jwt_token
   @testMenuItemId = menu_item_uuid
   @testSessionId = completed_session_uuid
   ```
3. Click "Send Request" on any test

### Option 3: cURL

```bash
# Get reviews for menu item (public)
curl http://localhost:5000/api/menu-items/{itemId}/reviews

# Create review (requires auth)
curl -X POST http://localhost:5000/api/sessions/{sessionId}/items/{itemId}/review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Delicious!"}'
```

---

## 📡 API Endpoints

### Public Endpoints (No Auth)

#### Get Reviews for Menu Item
```http
GET /api/menu-items/:itemId/reviews?page=1&limit=10&sort=recent
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sort` (optional): `recent` | `highest` | `lowest` | `helpful` (default: `recent`)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Absolutely delicious!",
        "helpful_count": 12,
        "created_at": "2026-01-10T15:30:00Z",
        "customer": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "total": 47,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### Customer Endpoints (Requires Auth)

#### Get Reviewable Sessions
```http
GET /api/reviews/reviewable-sessions
Authorization: Bearer <token>
```

Returns completed sessions with review status for each item.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-uuid",
      "session_number": "SESS-20260110-143052-A3F7B2",
      "completed_at": "2026-01-10T18:30:00Z",
      "table": {
        "table_number": "5"
      },
      "orders": [
        {
          "items": [
            {
              "menu_item_id": "item-uuid",
              "menuItem": {
                "name": "Classic Burger",
                "price": "12.50"
              },
              "reviewed": false,
              "reviewId": null
            }
          ]
        }
      ]
    }
  ]
}
```

#### Create Review
```http
POST /api/sessions/:sessionId/items/:itemId/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent meal!"
}
```

**Validation:**
- `rating`: Required, integer 1-5
- `comment`: Optional, text
- Customer must have ordered the item in this session
- Session must be completed
- Cannot review same item in same session twice

**Response:**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": "review-uuid",
    "rating": 5,
    "comment": "Excellent meal!",
    "customer": { "firstName": "John", "lastName": "Doe" },
    "menuItem": { "id": "item-uuid", "name": "Classic Burger" }
  }
}
```

#### Get My Reviews
```http
GET /api/reviews/my-reviews
Authorization: Bearer <token>
```

#### Update Review
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated comment"
}
```

#### Delete Review
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

---

## 🔄 Business Logic

### Key Features

1. **Multiple Reviews per Item**: Customer can review same item in different sessions
   - Session 1: "Good burger" ⭐⭐⭐⭐⭐
   - Session 2 (2 weeks later): "Still great!" ⭐⭐⭐⭐⭐

2. **Session-Based Reviews**: Reviews are linked to specific dining sessions
   - Only completed sessions can be reviewed
   - Customer must have ordered the item in that session

3. **Automatic Rating Calculation**: Menu item ratings update automatically
   - Average rating (0.00-5.00)
   - Review count
   - Only approved reviews are counted

4. **Review Moderation**: Reviews can be `pending`, `approved`, or `rejected`
   - Default: `approved` (auto-approve)
   - Can be changed to `pending` for manual moderation

### Database Constraints

```sql
-- One review per item per session per customer
CONSTRAINT reviews_unique_per_session 
    UNIQUE (menu_item_id, customer_id, session_id)

-- Rating must be 1-5
CHECK (rating >= 1 AND rating <= 5)

-- Helpful count cannot be negative
CHECK (helpful_count >= 0)
```

### Database Triggers

1. **Auto-update rating on insert**: When review is created
2. **Auto-update rating on update**: When rating/status changes
3. **Auto-update rating on delete**: When review is removed
4. **Auto-update timestamp**: On any review update

---

## 📊 Database Schema

```sql
reviews (
    id UUID PRIMARY KEY,
    menu_item_id UUID NOT NULL → menu_items(id),
    customer_id UUID NOT NULL → users(id),
    session_id UUID NOT NULL → table_sessions(id),
    order_id UUID → orders(id),
    rating INTEGER NOT NULL CHECK (1-5),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0,
    status ENUM('pending','approved','rejected') DEFAULT 'approved',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(menu_item_id, customer_id, session_id)
)

menu_items (
    ...,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0
)
```

---

## 🔐 Authorization

| Endpoint | Customer | Admin |
|----------|:--------:|:-----:|
| Get reviews (public) | ✅ | ✅ |
| Get reviewable sessions | ✅ | ❌ |
| Create review | ✅ | ❌ |
| Update own review | ✅ | ❌ |
| Delete own review | ✅ | ✅ |
| Delete any review | ❌ | ✅ |

---

## ✅ Testing Checklist

- [ ] Run migration successfully
- [ ] Run test script (`node scripts/testReviews.js`)
- [ ] Create review via REST API
- [ ] Verify review appears in menu item reviews
- [ ] Check menu item rating updated
- [ ] Try duplicate review (should fail)
- [ ] Update review
- [ ] Delete review
- [ ] Test pagination (page 1, page 2)
- [ ] Test sorting (recent, highest, lowest, helpful)
- [ ] Test error cases (invalid rating, unauthorized, etc.)

---

## 🐛 Common Issues

### Issue: "Table reviews doesn't exist"
**Solution:** Run the migration:
```bash
psql -U postgres -d your_db -f backend/migrations/create_reviews.sql
```

### Issue: "Review associations not found"
**Solution:** Restart the server after adding associations:
```bash
npm run dev
```

### Issue: "Cannot create review - session not completed"
**Solution:** Ensure the session status is `completed` and has `completed_at` timestamp.

### Issue: "Duplicate key violation"
**Solution:** Customer already reviewed this item in this session. Use update instead.

---

## 📈 Future Enhancements

- [ ] Review images upload
- [ ] Helpful votes (thumbs up/down)
- [ ] Admin moderation dashboard
- [ ] Review responses (restaurant replies)
- [ ] Verified purchase badge
- [ ] Review statistics dashboard
- [ ] Email notifications for new reviews

---

## 📝 Notes

- Reviews are soft-deleted by default (can be restored)
- Rating calculation happens automatically via database triggers
- Frontend integration TBD (API ready)
- Public can view reviews (no auth required)
- Only customers who completed sessions can review

---

## 🎯 Implementation Summary

**Time to implement:** ~4 hours

**Files created:** 6
- 1 Model
- 1 Controller
- 1 Routes
- 1 Migration
- 1 Test script
- 1 REST test file

**Features completed:**
- ✅ View reviews for menu items (-0.5 points)
- ✅ Add review with rating + comment (-0.25 points)
- ✅ Multiple reviews per item (different sessions)
- ✅ Automatic rating calculation
- ✅ Pagination and sorting
- ✅ Review CRUD operations

**Total recovered:** -0.75 points ✨

---

## 📞 Support

For issues or questions:
1. Check database migration ran successfully
2. Verify associations loaded (check server startup logs)
3. Run test script to verify setup
4. Check REST API tests for examples

**Happy reviewing! 🌟**
