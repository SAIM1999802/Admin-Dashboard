import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { getOrders, getDeletedOrders, deleteOrder } from "../services/api";
import "../styles/Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const navigate = useNavigate();

  const extractOrdersArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const fetchOrdersList = async () => {
    try {
      const response = await getOrders();
      setOrders(extractOrdersArray(response));
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  // Fetch Deleted Orders
  const fetchDeletedOrdersList = async () => {
    try {
      const response = await getDeletedOrders();
      setOrders(extractOrdersArray(response));
    } catch (error) {
      console.error("Error fetching deleted orders:", error);
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, []);

  const handleFilterChange = (e) => {
    const selectedValue = e.target.value;
    setStatusFilter(selectedValue);

    if (selectedValue === "Deleted") {
      fetchDeletedOrdersList(); 
    } else {
      fetchOrdersList(); 
    }
  };

  const handleDelete = async (e, order) => {
    e.stopPropagation();
    const orderId = order?.id || order?._id;

    if (!orderId) return;

    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(orderId);
        if (statusFilter === "Deleted") {
          fetchDeletedOrdersList();
        } else {
          fetchOrdersList();
        }
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete the order.");
      }
    }
  };

  const handleEdit = (e, order) => {
    e.stopPropagation();
    const orderId = order.id || order._id;

    if (orderId) {
      navigate(`/orders/edit/${orderId}`);
    } else {
      console.error("Order ID missing:", order);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/orders/details/${id}`);
  };

  const parseAmount = (order) => {
    const rawVal =
      order.totalAmount ?? order.total_amount ?? order.amount ?? order.total ?? order.price ?? 0;
    const numericVal = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ""));
    return isNaN(numericVal) ? 0 : numericVal;
  };

  const formatDate = (order) => {
    const rawDate =
      order.createdAt || order.created_at || order.order_date || order.date;

    if (!rawDate) return new Date().toLocaleDateString();

    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? String(rawDate) : d.toLocaleDateString();
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const orderId = order.id ? String(order.id) : "";
      const customerName = order.customerName || order.customer_name || order.customer || "";
      const customerId = order.customer_id ? String(order.customer_id) : "";

      const matchesSearch =
        orderId.toLowerCase().includes(search.toLowerCase()) ||
        customerName.toLowerCase().includes(search.toLowerCase()) ||
        customerId.toLowerCase().includes(search.toLowerCase());

      if (statusFilter === "All Statuses" || statusFilter === "Deleted") {
        return matchesSearch;
      }

      return (
        matchesSearch &&
        String(order.status).toLowerCase() === String(statusFilter).toLowerCase()
      );
    });
  };

  const filteredOrders = getFilteredOrders();

  const renderStatus = (status) => {
    const currentStatus = status || "Pending";
    const statusLower = String(currentStatus).toLowerCase();

    return (
      <span
        className={`status ${
          statusLower === "completed"
            ? "completed"
            : statusLower === "pending"
              ? "pending"
              : statusLower === "shipped"
                ? "shipped"
                : "cancelled"
        }`}
      >
        {currentStatus}
      </span>
    );
  };

  const renderTableRows = () => {

    if (filteredOrders.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center py-4">
            No orders found.
          </td>
        </tr>
      );
    }

    return filteredOrders.map((order, i) => {
      const isCompleted = String(order.status).toLowerCase() === "completed";
      const isDeleted = statusFilter === "Deleted" || Number(order.is_deleted) === 1;

      return (
        <tr
          key={order.id || order._id || i}
          onClick={() => handleRowClick(order.id || order._id)}
          style={{ cursor: "pointer" }}
          className="clickable-row"
        >
          <td className="text-primary fw-semibold">{i + 1}</td>
          <td>{order.customerName || order.customer_name || order.customer || "N/A"}</td>
          <td>{formatDate(order)}</td>
          <td>${parseAmount(order).toFixed(2)}</td>
          <td>{renderStatus(order.status)}</td>
          <td>
            <div className="action-buttons">
              {!isDeleted && (
                <button 
                  className="btn-action-edit custom-tooltip me-2"
                  data-title={isCompleted ? "Unable to edit completed order" : "Edit Order"}
                  onClick={(e) => handleEdit(e, order)}
                  disabled={isCompleted}
                >
                  <i className="bi bi-pencil-fill"></i> Edit
                </button>
              )}
              {!isDeleted && (
                <button
                  className="btn-action-delete custom-tooltip"
                  data-title="Delete Order"
                  onClick={(e) => handleDelete(e, order)}
                >
                  <i className="bi bi-trash-fill"></i> Delete
                </button>
              )}
              {isDeleted && <span className="badge bg-danger">Deleted</span>}
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <>
      <Navbar />

      <main className="admin-page">
        <div className="page-header">
          <h1 className="page-title">Orders Management</h1>

          <button
            className="primary-btn"
            onClick={() => navigate("/orders/add")}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Create Order
          </button>
        </div>

        <div className="orders-filter-container">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search Order ID, Customer Name, or Customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={handleFilterChange}
            className="status-filter-select"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Deleted">View Deleted</option>
          </select>
        </div>

        <div className="table-card">
          <div
            style={{
              maxHeight: "350px",
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="tab-scroll">ORDER ID</th>
                  <th className="tab-scroll">CUSTOMER NAME</th>
                  <th className="tab-scroll">DATE</th>
                  <th className="tab-scroll">AMOUNT</th>
                  <th className="tab-scroll">STATUS</th>
                  <th className="tab-scroll">ACTIONS</th>
                </tr>
              </thead>
              <tbody>{renderTableRows()}</tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default Orders;