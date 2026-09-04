import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { getDeletedOrders } from "../services/api";
import "../styles/Orders.css";

const DeletedOrders = () => {
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeleted = async () => {
      try {
        const response = await getDeletedOrders();
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        setDeletedOrders(data);
      } catch (error) {
        console.error("Error fetching deleted orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeleted();
  }, []);

  const formatDate = (order) => {
    const rawDate =
      order.createdAt ||
      order.created_at ||
      order.order_date ||
      order.date;
    if (!rawDate) return "N/A";
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? String(rawDate) : d.toLocaleDateString();
  };

  const parseAmount = (order) => {
    const rawVal =
      order.totalAmount ?? order.total_amount ?? order.amount ?? 0;
    const numericVal = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ""));
    return isNaN(numericVal) ? 0 : numericVal;
  };

  const handleRowClick = (order) => {
    const orderId = order.id || order._id;
    if (orderId) {
      navigate(`/orders/details/${orderId}`);
    }
  };

  return (
    <>
      <Navbar />
      <main className="admin-page">
        <div className="page-header d-flex justify-content-between align-items-center mb-4">
          <h1 className="page-title text-danger">Deleted Orders Archive</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/orders")}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Orders
          </button>
        </div>

        <div className="table-card">
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ color: "#123f83" }}>ORDER ID</th>
                  <th style={{ color: "#123f83" }}>CUSTOMER NAME</th>
                  <th style={{ color: "#123f83" }}>CUSTOMER EMAIL</th>
                  <th style={{ color: "#123f83" }}>DATE</th>
                  <th style={{ color: "#123f83" }}>AMOUNT</th>
                  <th style={{ color: "#123f83" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      Loading deleted orders...
                    </td>
                  </tr>
                ) : deletedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-4 text-muted"
                    >
                      No deleted orders found in archive.
                    </td>
                  </tr>
                ) : (
                  deletedOrders.map((order, idx) => {
                    const orderId = order.id || order._id || idx + 1;
                    return (
                      <tr
                        key={orderId}
                        onClick={() => handleRowClick(order)}
                        style={{ cursor: "pointer" }}
                        className="clickable-row"
                      >
                        <td className="text-danger fw-semibold">
                          ORD#{orderId}
                        </td>
                        <td>
                          {order.customerName || order.customer_name || "N/A"}
                        </td>
                        <td>
                          {order.customerEmail ||
                            order.customer_email ||
                            "N/A"}
                        </td>
                        <td>{formatDate(order)}</td>
                        <td>${parseAmount(order).toFixed(2)}</td>
                        <td>
                          <span className="badge bg-danger">Deleted</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default DeletedOrders;