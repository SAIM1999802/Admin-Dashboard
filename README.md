# 🛍️ Admin Dashboard + AI Shopping Assistant

A full-stack **Admin Dashboard** for managing Orders, Customers, and Products, with a built-in **Cart Drawer**, **Stripe Checkout**, and an **AI Chatbot** powered by Groq (`openai/gpt-oss-120b`).

- **Backend:** Node.js + Express.js + MySQL
- **Frontend:** React.js (Vite) + JWT authentication
- **Chatbot Service:** Python + FastAPI + LangChain + Groq API

---

## ✨ Features

### 🧑‍💼 Admin Dashboard
- 🔐 JWT-based Authentication (Signup / Login / Update Credentials)
- 📊 Dashboard Overview (Total Sales, Orders, Customers, Products)
- 🛒 Orders Management (Create, Edit, Delete, Soft-Delete Archive)
- 👥 Customer Directory (Add, Edit, View, Delete)
- 📦 Product Inventory (Add, Edit, Delete, Stock Tracking)

### 🛒 Cart & Checkout
- Slide-in **Cart Drawer** available across the app
- Increase (**+**) / decrease (**−**) item quantity
- **Delete** items from the cart
- Live subtotal / total calculation
- **Checkout with Stripe** payment integration

### 🤖 AI Chatbot
- Floating chat widget inside the frontend
- Powered by **Groq API** with the **`openai/gpt-oss-120b`** model
- Built with **FastAPI + LangChain** (tool-calling agent)
- Conversation memory support (`lstm_memory.py`)
- Can understand product images (vision-based analysis)
- Talks directly to the MySQL database through tools (see below)

---

## 🧰 Chatbot Tools

The AI agent can call the following tools:

| Tool | Description |
|------|-------------|
| `search_products` | Search products by name, keyword, or price range |
| `list_categories` | List all available product categories |
| `get_user_orders` | Fetch the order history / order status of a user |
| `add_to_cart` | Add a product to the user's cart |
| `view_cart` | Show current cart items and total |
| `get_recommendations` | Suggest products based on user interest / history |
| `analyze_product_image` | Analyze an uploaded product image and find similar products |

---

## 🗂️ Project / File Structure

```
Admin-Dashboard/
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
│   │   ├── userModel.js
│   │   ├── orderModel.js
│   │   ├── customerModel.js
│   │   └── productModel.js
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
│   ├── package.json
│   └── server.js                 # Entry point / Express server setup
│
├── chatbot_service/              # Python FastAPI AI Chatbot
│   ├── bot_agent.py              # LangChain agent + tools + Groq LLM setup
│   ├── db.py                     # MySQL connection (PyMySQL)
│   ├── lstm_memory.py            # Conversation memory logic
│   ├── main.py                   # FastAPI app / chat endpoints
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables (not committed)
│
└── frontend/                     # React.js Frontend
    ├── public/
    │   └── index.html
    │
    ├── src/
    │   ├── assets/               # Images, logos, styles
    │   ├── components/           # Reusable components
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── CartDrawer.jsx    # Cart drawer (+ / − / delete / checkout)
    │   │   └── ChatBot.jsx       # Floating AI chatbot widget
    │   │
    │   ├── pages/                # Screens / views
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
    │   │   └── api.js            # Axios instance and API call setup
    │   │
    │   ├── App.jsx               # React Router routes setup
    │   ├── main.jsx              # React entry point
    │   └── App.css
    │
    ├── package.json
    └── .gitignore
```

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, MySQL (mysql2), JWT, bcryptjs, Stripe, dotenv, cors

**Frontend:** React.js, React Router DOM, Axios, Bootstrap / Bootstrap Icons, Stripe.js

**Chatbot Service:** Python, FastAPI, Uvicorn, Pydantic, LangChain, PyMySQL, python-dotenv, Groq API (`openai/gpt-oss-120b`)

---

## ⚙️ Environment Variables

> ⚠️ **Important:** `.env` files are **not included** in this repository for security reasons.
> **You must create and update the `.env` files yourself** in each folder using the templates below, and fill in your own credentials/keys.

### 1️⃣ Backend — `backend/.env`

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

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 2️⃣ Chatbot Service — `chatbot_service/.env`

```env
# Groq API
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

# MySQL Database Config (same database as backend)
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=admin_dashboard
DB_PORT=3306
```

### 3️⃣ Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_CHATBOT_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

> 🔑 Groq API key yahan se milegi: [console.groq.com](https://console.groq.com)
> 🔑 Stripe keys yahan se milengi: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
>
> Never push any `.env` file to GitHub. Make sure it is listed in `.gitignore`.

---

## 🗄️ Database Structure

The database name should match the `DB_NAME` value in your `.env` files (e.g. `admin_dashboard`). Both the Node.js backend and the chatbot service use the **same database**.

### Table: `users`

| Column          | Type          | Notes                |
|-----------------|---------------|----------------------|
| id              | INT           | AUTO_INCREMENT, PK   |
| name            | VARCHAR(255)  |                      |
| email           | VARCHAR(255)  |                      |
| password_hash   | VARCHAR(255)  | bcrypt hashed        |
| role            | VARCHAR(55)   |                      |
| created_at      | TIMESTAMP     |                      |

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

| Column            | Type          | Notes                                       |
|-------------------|---------------|---------------------------------------------|
| id                | INT           | AUTO_INCREMENT, PK                          |
| customer_name     | VARCHAR(255)  |                                             |
| customer_email    | VARCHAR(255)  |                                             |
| shipping_address  | TEXT          |                                             |
| total_amount      | DECIMAL(10,2) |                                             |
| payment_method    | VARCHAR(100)  |                                             |
| status            | VARCHAR(50)   | Pending/Shipped/Completed/Cancelled/Deleted |
| user_id           | INT           | admin who created the order                 |
| customer_id       | INT           | FK -> customers.id                          |
| created_at        | TIMESTAMP     |                                             |
| is_deleted        | TINYINT(1)    | soft delete flag                            |

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
cd Admin-Dashboard
```

### 2. Database Setup

- Create a MySQL database named `admin_dashboard` (or whatever name you set in `.env`).
- Create the tables listed above (`users`, `customers`, `products`, `orders`, `order_items`).

### 3. Backend Setup (Node.js)

```bash
cd backend
npm install
# create the .env file (see the "Environment Variables" section above)
npm start
```

Backend runs on **http://localhost:5000**

### 4. Chatbot Service Setup (Python)

```bash
cd chatbot_service

# (optional but recommended) create a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
# create the .env file (see the "Environment Variables" section above)

uvicorn main:app --reload --port 8000
```

Chatbot service runs on **http://localhost:8000**
Interactive API docs (Swagger): **http://localhost:8000/docs**

**`requirements.txt`**

```txt
fastapi==0.110.0
uvicorn==0.28.0
pydantic==2.6.4
langchain==0.1.13
pymysql==1.1.0
python-dotenv==1.0.1
```

> 💡 Groq API ko call karne ke liye agar aap `groq` SDK ya `langchain-groq` / OpenAI-compatible client use kar rahe hain, to us package ko bhi `requirements.txt` mein add kar lein.

### 5. Frontend Setup (React)

```bash
cd frontend
npm install
# create the .env file (see the "Environment Variables" section above)
npm run dev
```

Frontend runs on **http://localhost:5173**

> ✅ Start order: **MySQL → Backend → Chatbot Service → Frontend**

---

## 🛒 How the Cart & Checkout Works

1. User adds products to the cart (from the UI or via the chatbot's `add_to_cart` tool).
2. Opening the **Cart Drawer** shows all items with **+ / − / delete** controls.
3. The total updates instantly as quantities change.
4. Clicking **Checkout** sends the user to **Stripe** for payment.
5. On success, the order and its `order_items` are saved and appear in the **Orders** page.

---

## 🤖 How the Chatbot Works

```
React ChatBot widget  ──►  FastAPI (main.py)  ──►  LangChain Agent (bot_agent.py)
                                                        │
                                   ┌────────────────────┼────────────────────┐
                                   ▼                    ▼                    ▼
                             Groq LLM            Tools (7 total)       Memory
                        (openai/gpt-oss-120b)   ──► MySQL (db.py)   (lstm_memory.py)
```

**Example prompts:**
- *"Show me laptops under 500 dollars"* → `search_products`
- *"What categories do you have?"* → `list_categories`
- *"Where is my order?"* → `get_user_orders`
- *"Add this to my cart"* → `add_to_cart`
- *"What's in my cart?"* → `view_cart`
- *"Suggest something for me"* → `get_recommendations`
- *[uploads an image]* *"Do you have something like this?"* → `analyze_product_image`

---

## 🔌 API Overview

### Node.js Backend (`:5000`)

| Route | Description |
|-------|-------------|
| `/api/auth` | Signup / Login / Update credentials |
| `/api/dashboard` | Dashboard stats |
| `/api/orders` | Orders CRUD + soft delete |
| `/api/customers` | Customers CRUD |
| `/api/products` | Products CRUD |
| `/api/payment` | Stripe checkout / payment |

### Chatbot Service (`:8000`)

| Route | Description |
|-------|-------------|
| `/docs` | Swagger UI for all chatbot endpoints |
| `/chat` | Send a message to the AI agent *(adjust to match your `main.py`)* |

---

## 📌 Notes

- Never commit sensitive data such as `.env`, database credentials, Groq API keys, or Stripe keys.
- Every request (except auth routes) is verified via JWT through `authMiddleware.js`.
- Orders and Products use **soft delete** (`is_deleted`), so data is never permanently removed.
- The chatbot service and backend share the same MySQL database, so make sure both `.env` files point to the same `DB_NAME`.
- Use Stripe **test keys** (`sk_test_...` / `pk_test_...`) during development.

---

## 👨‍💻 Author

Made with ❤️ — feel free to fork, star ⭐ and contribute!
