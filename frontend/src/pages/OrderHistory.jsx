import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";

const getStatusBadgeClass = (status) => {
  if (!status) return "bg-secondary";
  
  const lowerStatus = status.toLowerCase();
  if (lowerStatus === "completed") return "bg-success";
  if (lowerStatus === "pending") return "bg-warning text-dark";
  if (lowerStatus === "cancelled") return "bg-danger";
  
  return "bg-secondary";
};

const renderOrderItems = (items) => {
  if (!items || items.length === 0) return null;

  const itemList = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    itemList.push(
      <li
        key={i}
        className="list-group-item d-flex justify-content-between align-items-center px-0"
      >
        <div className="d-flex align-items-center gap-3">
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: "40px",
              height: "40px",
              objectFit: "cover",
            }}
          />
          <div>
            <h6 className="mb-0">{item.name}</h6>
            <small className="text-muted">
              Qty: {item.quantity} x ${item.price}
            </small>
          </div>
        </div>
        <span>${(item.quantity * item.price).toFixed(2)}</span>
      </li>
    );
  }
  return itemList;
};

const renderOrdersList = (orders) => {
  const orderCards = [];
  for (let i = orders.length-1; i >= 0 ; i--) {
    const order = orders[i];
    const orderNumber = orders.length - i;
    orderCards.push(
      <div key={order.order_id || i} className="card shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <div>
            <strong>Order #{orderNumber}</strong>
            <span className="text-muted ms-3">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span
              className={`badge ${getStatusBadgeClass(order.status)} me-3`}
            >
              {order.status}
            </span>
            <strong>
              Total: ${Number(order.total_price).toFixed(2)}
            </strong>
          </div>
        </div>
        <div className="card-body">
          <ul className="list-group list-group-flush">
            {renderOrderItems(order.items)}
          </ul>
        </div>
      </div>
    );
  }
  return <div className="d-flex flex-column gap-3 mt-4">{orderCards}</div>;
};

const renderOrdersContent = (orders) => {
  if (orders.length === 0) {
    return (
      <div className="alert alert-info mt-3">
        You haven't placed any orders yet.
      </div>
    );
  }
  return renderOrdersList(orders);
};

const MyOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/orders/my-orders",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching order history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container mt-4">Loading orders...</div>;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>My Orders</h2>
        {renderOrdersContent(orders)}
      </div>
    </>
  );
};

export default MyOrderHistory;