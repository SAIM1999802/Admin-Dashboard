import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { getOrders, getDeletedOrders, deleteOrder } from "../services/api";
import "../styles/Orders.css";

const extractOrdersArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const parseAmount = (order) => {
  if (!order) return 0;
  const rawVal =
    order.totalAmount ?? order.total_amount ?? order.amount ?? order.total ?? order.price ?? 0;
  const numericVal = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ""));
  return isNaN(numericVal) ? 0 : numericVal;
};

const formatDate = (order) => {
  if (!order) return new Date().toLocaleDateString();
  const rawDate =
    order.createdAt || order.created_at || order.order_date || order.date;

  if (!rawDate) return new Date().toLocaleDateString();

  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? String(rawDate) : d.toLocaleDateString();
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const navigate = useNavigate();

  const fetchOrdersList = async () => {
    try {
      const response = await getOrders();
      setOrders(extractOrdersArray(response));
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

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
    if (statusFilter === "Deleted") {
      fetchDeletedOrdersList();
    } else {
      fetchOrdersList();
    }

    const intervalId = setInterval(() => {
      if (statusFilter === "Deleted") {
        fetchDeletedOrdersList();
      } else {
        fetchOrdersList();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [statusFilter]);

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
    const orderId = order?.id || order?._id;

    if (orderId) {
      navigate(`/orders/edit/${orderId}`);
    } else {
      console.error("Order ID missing:", order);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/orders/details/${id}`);
  };

  const getFilteredOrders = () => {
    const result = [];
    const searchLower = search.toLowerCase();
    const filterStatusLower = String(statusFilter).toLowerCase();

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (!order) continue;

      const orderId = order.id ? String(order.id) : "";
      const customerName = order.customerName || order.customer_name || order.customer || "";
      const customerId = order.customer_id ? String(order.customer_id) : "";

      const matchesSearch =
        orderId.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower) ||
        customerId.toLowerCase().includes(searchLower);

      if (!matchesSearch) continue;

      if (statusFilter === "All Statuses" || statusFilter === "Deleted") {
        result.push(order);
        continue;
      }

      const orderStatusLower = String(order.status || "").toLowerCase();

      if (filterStatusLower === "completed") {
        if (orderStatusLower === "completed" || orderStatusLower === "paid") {
          result.push(order);
        }
      } else if (orderStatusLower === filterStatusLower) {
        result.push(order);
      }
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || a.order_date || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || b.order_date || b.date || 0).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      const idA = Number(a.id || a._id) || 0;
      const idB = Number(b.id || b._id) || 0;
      return idA - idB;
    });

    return result;
  };

  const filteredOrders = getFilteredOrders();

  const renderStatus = (status) => {
    const rawStatus = status || "Pending";
    const statusLower = String(rawStatus).toLowerCase();

    let displayStatus = rawStatus;
    if (statusLower === "paid" || statusLower === "completed") {
      displayStatus = "Completed";
    } else if (statusLower === "processing") {
      displayStatus = "Processing";
    }

    const statusClasses = {
      completed: "completed",
      paid: "completed",
      pending: "pending",
      processing: "processing",
      shipped: "shipped",
      cancelled: "cancelled",
    };

    const statusClass = statusClasses[statusLower] || "pending";

    return <span className={`status ${statusClass}`}>{displayStatus}</span>;
  };

  const renderTableRows = () => {
    if (filteredOrders.length === 0) {
      return (
        <tr>
          <td colSpan="6" style={{ textAlign: "center", padding: "1.5rem 0" }}>
            No orders found.
          </td>
        </tr>
      );
    }

    const rows = [];
    for (let i = 0; i < filteredOrders.length; i++) {
      const order = filteredOrders[i];
      if (!order) continue;

      const statusLower = String(order.status || "").toLowerCase();
      const isCompleted = statusLower === "completed" || statusLower === "paid";
      const isDeleted = statusFilter === "Deleted" || Number(order.is_deleted) === 1;

      rows.push(
        <tr
          key={order.id || order._id || i}
          onClick={() => handleRowClick(order.id || order._id)}
          className="clickable-row"
        >
          <td className="text-primary-styled">{i + 1}</td>
          <td>{order.customerName || order.customer_name || order.customer || "N/A"}</td>
          <td>{formatDate(order)}</td>
          <td>${parseAmount(order).toFixed(2)}</td>
          <td>{renderStatus(order.status)}</td>
          <td>
            <div className="action-buttons">
              {!isDeleted && (
                <button
                  className="btn-action-edit custom-tooltip"
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
              {isDeleted && <span className="badge-deleted">Deleted</span>}
            </div>
          </td>
        </tr>
      );
    }

    return rows;
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
            <i className="bi bi-plus-lg"></i>
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
            <option value="Processing">Processing</option>
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Deleted">View Deleted</option>
          </select>
        </div>

        <div className="table-card">
          <div className="table-scroll-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>CUSTOMER NAME</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
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