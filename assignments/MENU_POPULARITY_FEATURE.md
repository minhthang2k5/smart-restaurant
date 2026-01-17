# Menu Item Popularity Sorting - Implementation Guide

## Tổng quan

Feature "Sort by Popularity" cho phép sắp xếp menu items dựa trên số lượng order đã hoàn thành (completed orders). Độ phổ biến được tính bằng số lần món ăn xuất hiện trong các order có status = 'completed'.

## Thay đổi so với code cũ

### 1. Backend Architecture Changes

#### **Service Layer (NEW)**
- **File mới**: `backend/services/menuItemService.js`
- **Purpose**: Xử lý business logic cho popularity sorting
- **Method**: `getItemsByPopularity(filters, options)`

#### **Controller Layer (MODIFIED)**
- **File**: `backend/controllers/menuItemController.js`
- **Changes**: 
  ```javascript
  // Thêm conditional routing cho popularity sort
  if (sort === 'popularity') {
    // Gọi menuItemService thay vì APIFeatures
    const result = await menuItemService.getItemsByPopularity(...)
  }
  ```

#### **API Features (MODIFIED)**
- **File**: `backend/utils/apiFeatures.js`
- **Changes**: Thêm `'popularity'` vào `allowedFields` array

### 2. Database Query Changes

**Cách cũ** (Regular sorting):
- Sử dụng APIFeatures utility
- Sort trực tiếp trên các field có sẵn (price, name, created_at)
- Không có calculated field

**Cách mới** (Popularity sorting):
- Sử dụng Sequelize subquery với `literal()`
- Tính toán `popularity_count` từ bảng `order_items` và `orders`
- Query phức tạp hơn nhưng hiệu quả

```sql
-- Subquery tính popularity_count
SELECT COUNT(DISTINCT "order_items"."order_id")
FROM "order_items"
INNER JOIN "orders" ON "order_items"."order_id" = "orders"."id"
WHERE "order_items"."menu_item_id" = "MenuItem"."id"
  AND "orders"."status" = 'completed'
```

## API Endpoint Details

### Endpoint
```
GET /api/admin/menu/items
```

### Request Parameters

| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| `sort` | string | No | Field để sort | `'popularity'`, `'price'`, `'name'`, `'created_at'` |
| `order` | string | No | Thứ tự sort | `'ASC'`, `'DESC'` (default: `'DESC'`) |
| `page` | integer | No | Trang hiện tại | >= 1 (default: 1) |
| `limit` | integer | No | Số items per page | 1-100 (default: 10) |
| `name` | string | No | Filter by name | Case-insensitive partial match |
| `category_id` | integer | No | Filter by category | Category ID |
| `status` | string | No | Filter by status | `'available'`, `'unavailable'`, `'out_of_stock'` |

### Sự khác biệt quan trọng

#### **Khi `sort=popularity`**:
✅ Response bao gồm field `popularity_count` (integer)
✅ Được xử lý bởi `menuItemService`
✅ Query phức tạp hơn (join với orders)
✅ Performance phụ thuộc vào số lượng orders

#### **Khi `sort` = (price/name/created_at/invalid)**:
❌ Response KHÔNG có field `popularity_count`
❌ Được xử lý bởi `APIFeatures` utility
❌ Query đơn giản (chỉ query bảng menu_items)
❌ Performance tốt hơn

## Response Format

### Popularity Sort Response

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Phở Bò",
      "description": "Traditional Vietnamese beef noodle soup",
      "price": "75000.00",
      "category_id": 1,
      "status": "available",
      "image_url": "/uploads/pho-bo.jpg",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "popularity_count": 145,  // ⭐ NEW FIELD - Số lần xuất hiện trong completed orders
      "MenuItemPhotos": [
        {
          "id": 1,
          "photo_url": "/uploads/pho-bo-1.jpg",
          "is_primary": true
        }
      ]
    },
    {
      "id": 2,
      "name": "Bún Chả",
      "description": "Grilled pork with vermicelli",
      "price": "65000.00",
      "category_id": 1,
      "status": "available",
      "image_url": "/uploads/bun-cha.jpg",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "popularity_count": 98,  // ⭐ Số lượng giảm dần (sorted DESC)
      "MenuItemPhotos": []
    }
  ],
  "pagination": {
    "total": 21,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### Regular Sort Response (NO popularity_count)

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Phở Bò",
      "description": "Traditional Vietnamese beef noodle soup",
      "price": "75000.00",
      "category_id": 1,
      "status": "available",
      "image_url": "/uploads/pho-bo.jpg",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      // ❌ NO popularity_count field
      "MenuItemPhotos": [...]
    }
  ],
  "pagination": {...}
}
```

## Frontend Implementation Guide

### 1. Thêm Sort Option vào UI

```javascript
// Sort options cho dropdown/select
const sortOptions = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'price', label: 'Price' },
  { value: 'name', label: 'Name' },
  { value: 'popularity', label: 'Most Popular' }  // ⭐ NEW OPTION
];
```

### 2. API Call Example

```javascript
// Fetch menu items sorted by popularity
const fetchMenuItems = async (params) => {
  const queryParams = new URLSearchParams({
    sort: params.sort || 'created_at',
    order: params.order || 'DESC',
    page: params.page || 1,
    limit: params.limit || 10,
    ...(params.name && { name: params.name }),
    ...(params.category_id && { category_id: params.category_id }),
    ...(params.status && { status: params.status })
  });

  const response = await fetch(
    `http://localhost:3000/api/admin/menu/items?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};

// Usage: Fetch most popular items
const popularItems = await fetchMenuItems({
  sort: 'popularity',
  order: 'DESC',
  limit: 10
});
```

### 3. Displaying Popularity Count

```javascript
// Component hiển thị menu item
const MenuItemCard = ({ item, sortBy }) => {
  return (
    <div className="menu-item-card">
      <img src={item.image_url} alt={item.name} />
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <span className="price">{item.price} VND</span>
      
      {/* Chỉ hiển thị popularity count khi sort by popularity */}
      {sortBy === 'popularity' && item.popularity_count !== undefined && (
        <div className="popularity-badge">
          🔥 {item.popularity_count} orders completed
        </div>
      )}
    </div>
  );
};
```

### 4. State Management Example (React)

```javascript
import { useState, useEffect } from 'react';

const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const loadItems = async () => {
      const result = await fetchMenuItems({
        sort: sortBy,
        order: order,
        page: page,
        limit: 10
      });
      
      setItems(result.data);
      setPagination(result.pagination);
    };

    loadItems();
  }, [sortBy, order, page]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(1); // Reset to page 1 khi đổi sort
  };

  return (
    <div>
      <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
        <option value="created_at">Newest First</option>
        <option value="price">Price</option>
        <option value="name">Name</option>
        <option value="popularity">Most Popular</option>
      </select>

      <div className="menu-items">
        {items.map(item => (
          <MenuItemCard key={item.id} item={item} sortBy={sortBy} />
        ))}
      </div>

      {/* Pagination controls */}
      <Pagination 
        current={page}
        total={pagination.totalPages}
        onChange={setPage}
      />
    </div>
  );
};
```

## Request Examples

### 1. Get Top 10 Most Popular Items
```http
GET /api/admin/menu/items?sort=popularity&order=DESC&limit=10
```

### 2. Get Least Popular Items (ASC)
```http
GET /api/admin/menu/items?sort=popularity&order=ASC&limit=10
```

### 3. Popular Items in Specific Category
```http
GET /api/admin/menu/items?sort=popularity&order=DESC&category_id=1&limit=10
```

### 4. Popular Items by Name Search
```http
GET /api/admin/menu/items?sort=popularity&order=DESC&name=phở
```

### 5. Popular Available Items Only
```http
GET /api/admin/menu/items?sort=popularity&order=DESC&status=available
```

### 6. Pagination Example
```http
# Page 1
GET /api/admin/menu/items?sort=popularity&order=DESC&page=1&limit=10

# Page 2
GET /api/admin/menu/items?sort=popularity&order=DESC&page=2&limit=10
```

## TypeScript Types (Optional)

```typescript
// Menu Item Response Type
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category_id: number;
  status: 'available' | 'unavailable' | 'out_of_stock';
  image_url: string | null;
  created_at: string;
  updated_at: string;
  popularity_count?: number;  // ⭐ Optional - chỉ có khi sort=popularity
  MenuItemPhotos: MenuItemPhoto[];
}

interface MenuItemPhoto {
  id: number;
  photo_url: string;
  is_primary: boolean;
}

interface MenuItemsResponse {
  status: 'success' | 'error';
  data: MenuItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Parameters Type
interface MenuItemQueryParams {
  sort?: 'popularity' | 'price' | 'name' | 'created_at';
  order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  name?: string;
  category_id?: number;
  status?: 'available' | 'unavailable' | 'out_of_stock';
}
```

## Performance Considerations

### 1. Caching Strategy
```javascript
// Cache popular items vì query phức tạp
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let popularItemsCache = null;
let cacheTimestamp = null;

const getPopularItems = async () => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (popularItemsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return popularItemsCache;
  }
  
  // Fetch fresh data
  const result = await fetchMenuItems({
    sort: 'popularity',
    order: 'DESC',
    limit: 20
  });
  
  popularItemsCache = result;
  cacheTimestamp = now;
  
  return result;
};
```

### 2. Loading States
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const loadPopularItems = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await fetchMenuItems({
      sort: 'popularity',
      order: 'DESC'
    });
    setItems(result.data);
  } catch (err) {
    setError('Failed to load popular items');
    console.error(err);
  } finally {
    setLoading(false);
  }
};
```

## Testing với REST Client

Test files đã được chuẩn bị sẵn:
- `backend/menu-items-popularity.rest` - 20 test cases đầy đủ
- `backend/menu-items-popularity-quick.rest` - 5 test cases nhanh

### Quick Test
```http
### TEST 1: Basic popularity sort (DESC)
GET http://localhost:3000/api/admin/menu/items?sort=popularity&order=DESC
Authorization: Bearer {{token}}

### TEST 2: Popularity with pagination
GET http://localhost:3000/api/admin/menu/items?sort=popularity&order=DESC&page=1&limit=5
Authorization: Bearer {{token}}
```

## Error Handling

### Common Errors

1. **401 Unauthorized**
   - Cause: Missing or invalid token
   - Solution: Ensure Authorization header is included

2. **400 Bad Request**
   - Cause: Invalid parameters (e.g., page < 1, limit > 100)
   - Solution: Validate parameters before sending

3. **500 Internal Server Error**
   - Cause: Database connection issue
   - Solution: Check backend logs

### Error Response Format
```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Migration từ Regular Sort sang Popularity Sort

### Bước 1: Update Sort Options
```javascript
// Cũ
<select value={sortBy} onChange={handleSortChange}>
  <option value="price">Price</option>
  <option value="name">Name</option>
</select>

// Mới - Thêm popularity option
<select value={sortBy} onChange={handleSortChange}>
  <option value="price">Price</option>
  <option value="name">Name</option>
  <option value="popularity">Most Popular</option>  {/* ⭐ NEW */}
</select>
```

### Bước 2: Update API Call
```javascript
// Không cần thay đổi gì - API endpoint giống hệt
// Chỉ cần thêm sort=popularity vào query params
const result = await fetch(
  `${API_URL}/menu/items?sort=popularity&order=DESC`
);
```

### Bước 3: Update UI Component
```javascript
// Thêm conditional rendering cho popularity_count
{sortBy === 'popularity' && item.popularity_count !== undefined && (
  <span className="popularity-badge">
    {item.popularity_count} orders
  </span>
)}
```

## Best Practices

### 1. ✅ DO
- Cache popular items nếu data không thay đổi thường xuyên
- Hiển thị loading state khi fetch data
- Validate parameters trước khi call API
- Handle errors gracefully
- Reset page về 1 khi đổi sort option

### 2. ❌ DON'T
- Không assume `popularity_count` luôn tồn tại - check `sortBy === 'popularity'`
- Không call API quá nhiều lần - implement debounce cho search
- Không hard-code page size - cho phép user chọn
- Không ignore error responses

## Tóm tắt

### Key Points
1. **Field mới**: `popularity_count` - chỉ có khi `sort=popularity`
2. **Query phức tạp hơn**: Join với orders table
3. **Performance**: Xem xét cache cho popular items
4. **Backward compatible**: Không breaking changes với existing API
5. **Testing**: Sử dụng .rest files đã chuẩn bị

### Frontend Checklist
- [ ] Thêm "Most Popular" option vào sort dropdown
- [ ] Update API call để support sort=popularity
- [ ] Hiển thị popularity_count khi available
- [ ] Implement loading states
- [ ] Implement error handling
- [ ] Add caching strategy (optional)
- [ ] Test với REST Client
- [ ] Update TypeScript types (nếu dùng TS)

## References

- Backend Service: `backend/services/menuItemService.js`
- Controller: `backend/controllers/menuItemController.js`
- Test Files: `backend/menu-items-popularity*.rest`
- API Documentation: `assignments/MENU_API_DOCUMENTATION.md`
