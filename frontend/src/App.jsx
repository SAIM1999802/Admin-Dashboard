import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChangeCredentials from "./pages/ChangeCredentials";

import Dashboard from "./pages/Dashboard";
{/* Orders */}
import Orders from "./pages/Orders";
import CreateOrder from "./pages/AddOrder"
import OrderDetail from "./pages/OrderDetail"
import EditOrder from "./pages/EditOrder";
import DeletedOrders from "./pages/DeletedOrders";
{/* Customers */}
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer"
import EditCustomer from "./pages/EditCustomer"
import CustomerDetail from "./pages/CustomerDetail"

{/* Products */}
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";   
import EditProduct from "./pages/EditProduct"; 
import ProductDetail from "./pages/ProductDetail";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ChangeCredentials" element={<ChangeCredentials />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Orders */}
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/add" element={<CreateOrder />} />
        <Route path="/orders/details/:id" element={<OrderDetail />} />
        <Route path="/orders/edit/:id" element={<EditOrder/>}/>
        <Route path="/orders/deleted" element={<DeletedOrders />} />

        {/* Customers */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/add" element={<AddCustomer />} />
        <Route path="/customers/edit/:id" element={<EditCustomer/>}/>
        <Route path="/customers/details/:id" element={<CustomerDetail/>}/>
        
        

        {/* Products Management Routes */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/edit/:id" element={<EditProduct />} />
        <Route path="/products/detail/:id" element={<ProductDetail />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;