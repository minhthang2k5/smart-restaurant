# Smart Restaurant QR Code Management System

A full-stack web application for managing restaurant tables with QR code generation for customer menu access.

---

## 📖 Assignment Overview

This project implements **Week 3: Table Management with QR Code Integration** for a smart restaurant system. The assignment focuses on building a complete CRUD application with QR code functionality that allows:

### What This Assignment Does:

**1. Admin Table Management:**

-   Create, read, update, and delete restaurant tables
-   Each table has: table number, capacity (1-20 people), location, and optional description
-   Filter tables by status (active/inactive) and location
-   Sort tables by various fields
-   Change table status (activate/deactivate)

**2. QR Code Generation & Management:**

-   Generate unique QR codes for each table using JWT authentication
-   Each QR code contains a secure token that identifies the table
-   QR tokens expire after 24 hours for security
-   Track when each QR code was created
-   Invalidate old tokens when new ones are generated

**3. QR Code Download Options:**

-   Download individual QR codes as PNG (high resolution 800x800px)
-   Download individual QR codes as PDF with table details
-   Bulk download all QR codes as ZIP file
-   Bulk download all QR codes as multi-page PDF
-   Optional: Include WiFi information in PDF downloads

**4. Bulk QR Regeneration:**

-   Regenerate all QR codes at once (requires confirmation)
-   Useful when tokens need to be refreshed for all tables
-   Provides detailed success/failure report for each table

**5. Customer QR Code Verification:**

-   Customers scan QR code at their table
-   System verifies the JWT token (signature, expiration, validity)
-   Displays welcome page with table information
-   Prevents use of expired or invalid QR codes
-   Prevents use of old QR codes after new ones are generated

**6. Security & Authentication:**

-   JWT-based token authentication for QR codes
-   Stateless verification (JWT signature validation)
-   Stateful verification (checks if token is the latest one issued)
-   CORS protection (only allows frontend domain)
-   Environment-based configuration for production/development

### Technical Implementation:

**Backend (Express.js + Sequelize):**

-   RESTful API with proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
-   PostgreSQL database with Sequelize ORM
-   Table model with fields: tableNumber, capacity, location, description, status, qrToken, qrTokenCreatedAt
-   QR service for token generation and verification
-   Download service for PNG/PDF generation
-   File compression with archiver (ZIP downloads)

**Frontend (React + Vite):**

-   Admin dashboard with table list and management forms
-   QR code display modal with base64 image
-   Download buttons for various formats
-   Bulk operations with confirmation dialogs
-   Customer menu page with QR verification
-   React Router for SPA routing
-   Ant Design for UI components
-   Axios for API calls with interceptors

**Deployment:**

-   Backend deployed on Render (Web Service)
-   Frontend deployed on Render (Static Site)
-   PostgreSQL database on Neon.tech
-   Environment variables configured for production
-   SPA routing configured with `_redirects` file

---

## 🌐 Deployment URLs

### Production Environment

| Service         | URL                                       | Description                                   |
| --------------- | ----------------------------------------- | --------------------------------------------- |
| **Frontend**    | https://smart-restaurant-app.onrender.com | Admin dashboard and customer menu interface   |
| **Backend API** | https://smart-restaurant-be.onrender.com  | RESTful API endpoints                         |
| **Database**    | Neon.tech PostgreSQL                      | Serverless PostgreSQL with connection pooling |

### API Base URL

```
https://smart-restaurant-be.onrender.com/api
```

### Available Endpoints

**Admin Routes:**

-   `GET /api/admin/tables` - Get all tables
-   `POST /api/admin/tables` - Create new table
-   `PUT /api/admin/tables/:id` - Update table
-   `DELETE /api/admin/tables/:id` - Delete table
-   `POST /api/admin/tables/:id/qr/generate` - Generate QR code
-   `GET /api/admin/tables/:id/qr/download` - Download QR code (PNG/PDF)
-   `GET /api/admin/tables/qr/download-all` - Download all QR codes (ZIP)
-   `POST /api/admin/tables/qr/regenerate-all` - Bulk regenerate QR codes

**Customer Routes:**

-   `GET /api/menu/verify?token={jwt}` - Verify QR code token and get table info

---

## 🚀 Features

-   ✅ Table management (CRUD operations)
-   ✅ QR code generation with JWT authentication
-   ✅ Single/bulk QR code download (PNG/PDF/ZIP)
-   ✅ Bulk QR regeneration
-   ✅ Customer menu access via QR scan
-   ✅ Responsive admin dashboard
-   ✅ Real-time table status tracking

---

## 🛠️ Tech Stack

### Frontend

-   **Framework:** React 18.3.1
-   **Build Tool:** Vite 5.x
-   **UI Library:** Ant Design 5.x
-   **Routing:** React Router v6
-   **HTTP Client:** Axios
-   **Hosting:** Render (Static Site)

### Backend

-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **ORM:** Sequelize
-   **Database:** PostgreSQL (Neon.tech)
-   **Authentication:** JWT (jsonwebtoken)
-   **QR Generation:** qrcode library
-   **PDF Generation:** pdfkit
-   **Hosting:** Render (Web Service)

---

## 📦 Installation & Setup

### Prerequisites

-   Node.js >= 18.x
-   PostgreSQL database
-   Git

### Local Development

1. **Clone repository**

```bash
git clone <repository-url>
cd smart-restaurant
```

2. **Backend Setup**

```bash
cd assignments/backend
npm install

# Create config.env
echo "DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173" > config.env

npm run dev
# Server runs on http://localhost:3000
```

3. **Frontend Setup**

```bash
cd assignments/frontend
npm install

# Create .env.development
echo "VITE_API_URL=http://localhost:3000/api" > .env.development

npm run dev
# App runs on http://localhost:5173
```

---

## 🌍 Environment Variables

### Backend (.env or config.env)

```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=https://smart-restaurant-app.onrender.com
PORT=3000
```

### Frontend (.env.production)

```env
VITE_API_URL=https://smart-restaurant-be.onrender.com/api
VITE_APP_NAME=Smart Restaurant Admin
VITE_FRONTEND_URL=https://smart-restaurant-app.onrender.com
```

---

## 📱 Usage

### Admin Dashboard

1. Access: https://smart-restaurant-app.onrender.com/admin/tables
2. Create new tables with table number, capacity, and location
3. Generate QR codes for each table
4. Download QR codes individually or in bulk
5. Regenerate all QR codes with one click

### Customer Flow

1. Scan QR code at restaurant table
2. Redirected to: `/menu?table={id}&token={jwt}`
3. Token verified by backend
4. Menu displayed with table information
5. (Future: Order placement and payment)

---

## 🔐 Security

-   JWT tokens expire after 24 hours
-   QR codes contain signed tokens to prevent tampering
-   CORS configured to allow only frontend domain
-   Database uses SSL connection (Neon.tech serverless PostgreSQL)
-   Environment variables secured in Render dashboard
-   Stateful token validation prevents reuse of old QR codes

---

## 🐛 Known Issues & Solutions

### 404 on Page Refresh

**Issue:** Getting 404 error when refreshing `/admin/tables` or other routes

**Solution:** Added `_redirects` file in `public/` folder:

```
/*    /index.html   200
```

This tells Render to redirect all routes to `index.html` for SPA routing.

---

## 📄 License

This project is for educational purposes.

---

## 👥 Contact

For questions or support, please contact the development team.

---

**Last Updated:** December 20, 2025
