# Admin Dashboard

A full-stack **Admin Dashboard** application for managing Orders, Customers, and Products. The backend is built with **Node.js + Express.js + MySQL**, and the frontend is built with **React.js**, using JWT authentication.

---

## ✨ Features

- 🔐 JWT-based Authentication (Signup / Login / Update Credentials)
- 📊 Dashboard Overview (Total Sales, Orders, Customers, Products)
- 🛒 Orders Management (Create, Edit, Delete, Soft-Delete Archive)
- 👥 Customer Directory (Add, Edit, View, Delete)
- 📦 Product Inventory (Add, Edit, Delete, Stock Tracking)
- 💳 Stripe Payment Integration (basic setup)

---

## 🗂️ Project / File Structure

```
admin-dashboard/
│
├── backend/                      # Node.js + Express.js + MySQL Backend
│   ├── config/
│   │   └── db.js                 # MySQL connection pool configuration
│   │
│   ├── controllers/              # Request and response logic
│   │   ├── authController.js     # Signup and login logic
│   │   ├── dashboardController.js# Fetches dashboard stats/metrics
│   │   ├── orderController.js    # Fetch/manage orders
│   │   ├── customerController.js # Customer directory logic
│   │   └── productController.js  # Product inventory logic
│   │
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification/protection middleware
│   │
│   ├── models/                   # MySQL queries & database interaction
│   │   ├── userModel.js          # Users table queries
│   │   ├── orderModel.js         # Orders table queries
│   │   ├── customerModel.js      # Customers table queries
│   │   └── productModel.js       # Products table queries
│   │
│   ├── routes/                   # API endpoints / route definitions
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── dashboardRoutes.js    # /api/dashboard
│   │   ├── orderRoutes.js        # /api/orders
│   │   ├── customerRoutes.js     # /api/customers
│   │   ├── productRoutes.js      # /api/products
│   │   └── paymentRoutes.js      # /api/payment (Stripe)
│   │
│   ├── .env                      # Environment variables (not committed)
│   ├── .gitignore
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Entry point / Express server setup
│
└── frontend/                     # React.js Frontend
    ├── public/
    │   └── index.html
    │
    ├── src/
    │   ├── assets/                # Images, logos, styles
    │   ├── components/            # Reusable components
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   │
    │   ├── pages/                 # Screens / views
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Orders.jsx
    │   │   ├── AddOrder.jsx
    │   │   ├── OrderDetail.jsx
    │   │   ├── EditOrder.jsx
    │   │   ├── DeletedOrders.jsx
    │   │   ├── Customers.jsx
    │   │   ├── AddCustomer.jsx
    │   │   ├── EditCustomer.jsx
    │   │   ├── CustomerDetail.jsx
    │   │   ├── Products.jsx
    │   │   ├── AddProduct.jsx
    │   │   ├── EditProduct.jsx
    │   │   ├── ProductDetail.jsx
    │   │   └── ChangeCredentials.jsx
    │   │
    │   ├── services/
    │   │   └── api.js             # Axios instance and API call setup
    │   │
    │   ├── App.jsx                # React Router routes setup
    │   ├── main.jsx                # React entry point
    │   └── App.css
    │
    ├── package.json               # Frontend dependencies
    └── .gitignore
```

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, MySQL (mysql2), JWT, bcryptjs, Stripe, dotenv, cors
**Frontend:** React.js, React Router DOM, Axios, Bootstrap / Bootstrap Icons

---

## ⚙️ Environment Variables (.env)

Create your own `.env` file inside the `backend/` folder (this file is not committed to the repo — it's already listed in `.gitignore`). Set the following variables:

```env
# Server Port
PORT=5000

# MySQL Database Config
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=admin_dashboard

# JWT Secret (use any strong random string)
JWT_SECRET=your_super_secret_jwt_key

# Stripe (if using the payment feature)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

> ⚠️ **Note:** Never push the `.env` file to GitHub. It is already excluded via `.gitignore`.

---

## 🗄️ Database Structure

The database name should match the `DB_NAME` value in your `.env` file (e.g. `admin_dashboard`). Below are all the tables and their columns.

### Table: `users`

| Column          | Type          | Notes                |
|-----------------|---------------|-----------------------|
| id              | INT           | AUTO_INCREMENT, PK    |
| name            | VARCHAR(255)  |                        |
| email           | VARCHAR(255)  |                        |
| password_hash   | VARCHAR(255)  | bcrypt hashed          |
| role            | VARCHAR(55)   |                        |
| created_at      | TIMESTAMP     |                        |

### Table: `customers`

| Column      | Type          | Notes              |
|-------------|---------------|--------------------|
| id          | INT           | AUTO_INCREMENT, PK |
| name        | VARCHAR(255)  |                    |
| email       | VARCHAR(255)  |                    |
| phone       | VARCHAR(50)   |                    |
| address     | TEXT          |                    |
| created_at  | TIMESTAMP     |                    |
| updated_at  | TIMESTAMP     |                    |
| is_deleted  | TINYINT(1)    | soft delete flag   |

### Table: `products`

| Column       | Type          | Notes              |
|--------------|---------------|--------------------|
| id           | INT           | AUTO_INCREMENT, PK |
| user_id      | INT           | owner reference    |
| name         | VARCHAR(255)  |                    |
| category     | VARCHAR(100)  |                    |
| price        | DECIMAL(10,2) |                    |
| stock_count  | INT           |                    |
| image        | LONGTEXT      | base64 / URL       |
| description  | TEXT          |                    |
| created_at   | TIMESTAMP     |                    |
| is_deleted   | TINYINT(1)    | soft delete flag   |

### Table: `orders`

| Column            | Type          | Notes              |
|-------------------|---------------|--------------------|
| id                | INT           | AUTO_INCREMENT, PK |
| customer_name     | VARCHAR(255)  |                    |
| customer_email    | VARCHAR(255)  |                    |
| shipping_address  | TEXT          |                    |
| total_amount      | DECIMAL(10,2) |                    |
| payment_method    | VARCHAR(100)  |                    |
| status            | VARCHAR(50)   | Pending/Shipped/Completed/Cancelled/Deleted |
| user_id           | INT           | admin who created the order |
| customer_id       | INT           | FK -> customers.id |
| created_at        | TIMESTAMP     |                    |
| is_deleted        | TINYINT(1)    | soft delete flag   |

### Table: `order_items`

| Column        | Type          | Notes              |
|---------------|---------------|--------------------|
| id            | INT           | AUTO_INCREMENT, PK |
| order_id      | INT           | FK -> orders.id    |
| product_id    | INT           | FK -> products.id  |
| product_name  | VARCHAR(255)  |                    |
| quantity      | INT           |                    |
| price         | DECIMAL(10,2) |                    |

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd admin-dashboard
```

### 2. Backend Setup
```bash
cd backend
npm install
# create the .env file (following the format above)
npm start
```

### 3. Database Setup
- Create a MySQL database named `admin_dashboard` (or whatever name you set in `.env`).
- Create the tables listed above (`users`, `customers`, `products`, `orders`, `order_items`).

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📌 Notes

- Never commit sensitive data such as `.env`, database credentials, or Stripe keys.
- Every request (except auth routes) is verified via JWT through `authMiddleware.js`.
- Orders and Products use **soft delete** (`is_deleted`), so data is never permanently removed.
