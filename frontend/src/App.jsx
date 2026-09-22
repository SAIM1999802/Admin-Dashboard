import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChangeCredentials from "./pages/ChangeCredentials";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/Homepage";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import Blog from "./pages/Blog";
// Market Management
import Market from "./pages/Market";
import Checkout from "./pages/Checkout";
import MyOrderHistory from "./pages/OrderHistory";

// Category Management
import AddCategory from "./pages/AddCategory";
import Categories from "./pages/Categories";
import EditCategory from "./pages/EditCategory";

/* Orders */
import Orders from "./pages/Orders";
import CreateOrder from "./pages/AddOrder";
import OrderDetail from "./pages/OrderDetail";
import EditOrder from "./pages/EditOrder";
import DeletedOrders from "./pages/DeletedOrders";
import OrderCompleted from "./pages/OrderCompleted";
/* Customers */
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
import CustomerDetail from "./pages/CustomerDetail";

/* Products */
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductDetail from "./pages/ProductDetail";

/* Payments */
import PaymentSuccess from "./pages/PaymentSuccess";

function App() {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    if (!savedCart) return [];
    try {
      return JSON.parse(savedCart);
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const updateCartCount = () => {
    let totalCount = 0;
    for (let i = 0; i < cart.length; i++) {
      totalCount += cart[i]?.quantity || 0;
    }
    return totalCount;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route -> Directly to Homepage */}
        <Route path="/" element={<Navigate to="/homepage" replace />} />

        {/* --- Fully Public Routes (No Auth Required) --- */}
        <Route
          path="/homepage"
          element={
            <HomePage
              allowedRoles={["user"]}
              cart={cart}
              setCart={setCart}
              updateCartCount={updateCartCount}
            />
          }
        />
        <Route
          path="/market"
          element={
            <Market
              allowedRoles={["user"]}
              cart={cart}
              setCart={setCart}
              updateCartCount={updateCartCount}
            />
          }
        />
        <Route
          path="/products/detail/:id"
          element={
            <ProductDetail
              allowedRoles={["user"]}
              cart={cart}
              setCart={setCart}
              updateCartCount={updateCartCount}
            />
          }
        />
        <Route
          path="/contactus"
          element={
            <ContactUs
              allowedRoles={["user"]}
            />
          }
        />
        <Route
          path="/aboutus"
          element={
            <AboutUs
              allowedRoles={["user"]}
            />
          }
        />
        <Route
          path="/blog"
          element={
            <Blog
              allowedRoles={["user"]}
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* --- User & Admin Settings --- */}
        <Route
          path="/ChangeCredentials"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <ChangeCredentials />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Checkout cartItems={cart} clearCart={() => setCart([])} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <MyOrderHistory />
            </ProtectedRoute>
          }
        />

        {/* --- Admin Only Routes --- */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Orders Management */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/details/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/deleted"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DeletedOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-completed"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <OrderCompleted />
            </ProtectedRoute>
          }
        />

        {/* Customers Management */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/details/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CustomerDetail />
            </ProtectedRoute>
          }
        />

        {/* Products Management */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditProduct />
            </ProtectedRoute>
          }
        />

        {/* Categories Management */}
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/add"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category"
          element={<Navigate to="/categories" replace />}
        />

        {/* Payment Success */}
        <Route
          path="/orders/payment-success"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        {/* Fallback to Homepage */}
        <Route path="*" element={<Navigate to="/homepage" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
