# StockFlow — Smart Inventory Management System

A full-stack MERN application for managing inventory in real-time.

---

## 📁 Folder Structure

```
stockflow/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Profile
│   │   └── productController.js# CRUD + Stats + Stock Adjust
│   ├── middleware/
│   │   ├── auth.js             # JWT protect & role authorize
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   ├── User.js             # User schema (bcrypt hashing)
│   │   ├── Product.js          # Product schema (auto status)
│   │   └── Transaction.js      # Stock movement log
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── productRoutes.js
│   ├── .env                    # Environment variables
│   ├── server.js               # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── inventory/
│       │   │   ├── ProductModal.js   # Add/Edit product form
│       │   │   └── AdjustModal.js    # Stock adjustment form
│       │   └── layout/
│       │       ├── Layout.js         # Sidebar + Topbar shell
│       │       └── Layout.css
│       ├── context/
│       │   └── AuthContext.js        # Global auth state
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js          # Stats + Charts
│       │   └── Inventory.js          # Full CRUD table
│       ├── services/
│       │   └── api.js                # Axios instance + all API calls
│       ├── App.js                    # Routes + Auth guards
│       ├── index.js
│       └── index.css                 # Global design system
│
├── package.json                      # Root scripts (concurrently)
└── README.md
```

---

## 🚀 Setup & Run

### Step 1: Install Dependencies

```bash
# Install root deps
npm install

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### Step 2: Run Both Servers

From the **root** `stockflow/` directory:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

### Step 3: Open in Browser

```
http://localhost:3000
```

---

## 🔑 Environment Variables (backend/.env)

```
MONGO_URI=mongodb+srv://STOCKFLOW:STOCKFLOW123@cluster0.hfgw2de.mongodb.net/stockflow?appName=Cluster0
JWT_SECRET=stockflow_jwt_secret_key_2024_super_secure
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user (protected) |
| PUT | /api/auth/profile | Update profile (protected) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List all (search, filter, paginate) |
| GET | /api/products/stats | Dashboard statistics |
| GET | /api/products/:id | Single product |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete (admin/manager only) |
| POST | /api/products/:id/adjust | Stock in/out adjustment |

---

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6, Recharts, Axios
- **Backend**: Node.js, Express 4, MongoDB Atlas, Mongoose
- **Auth**: JWT + Bcryptjs
- **Database**: MongoDB Atlas (cloud)

---

## ✅ Features

- JWT Authentication (Register / Login / Protected Routes)
- Role-based access (admin / manager / staff)
- Full CRUD for products with validation
- Real-time stock status (In Stock / Low Stock / Out of Stock)
- Stock-in / Stock-out adjustments with transaction logging
- Dashboard with stats cards and category bar chart
- Search, filter by status/category, pagination
- Fully responsive dark UI
