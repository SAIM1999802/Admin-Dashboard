import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProducts, getOrders, getCustomers } from "../services/api";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [metrics, setMetrics] = useState({
    totalSales: "$0.00",
    totalOrders: "0",
    totalCustomers: "0",
    totalProducts: "0",
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const parseOrderAmount = (order) => {
    const rawVal =
      order.totalAmount ?? order.amount ?? order.total ?? order.price ?? 0;
    const numericVal = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ""));
    return isNaN(numericVal) ? 0 : numericVal;
  };

  const formatOrderDate = (order) => {
    const rawDate =
      order.createdAt || order.created_at || order.order_date || order.date;

    if (!rawDate) return new Date().toLocaleDateString();

    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? String(rawDate) : d.toLocaleDateString();
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("User parsing error:", e);
      }
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [productsRes, ordersRes, customersRes] = await Promise.all([
          getProducts().catch((err) => {
            console.error("Products API error:", err);
            return { data: [] };
          }),
          getOrders().catch((err) => {
            console.error("Orders API error:", err);
            return { data: [] };
          }),
          getCustomers().catch((err) => {
            console.error("Customers API error:", err);
            return { data: [] };
          }),
        ]);

        const productsList = Array.isArray(productsRes?.data)
          ? productsRes.data
          : Array.isArray(productsRes)
          ? productsRes
          : [];

        const rawOrdersList = Array.isArray(ordersRes?.data)
          ? ordersRes.data
          : Array.isArray(ordersRes)
          ? ordersRes
          : [];

        // 1. For Loop se Active Orders Filter karein
        const activeOrdersList = [];
        for (let i = 0; i < rawOrdersList.length; i++) {
          const order = rawOrdersList[i];
          const status = String(order.status || "").toLowerCase();
          if (status !== "deleted" && !order.is_deleted) {
            activeOrdersList.push(order);
          }
        }

        // 2. Total Customer Count extraction
        let totalCustomersCount = 0;
        if (typeof customersRes?.data?.count === "number") {
          totalCustomersCount = customersRes.data.count;
        } else if (Array.isArray(customersRes?.data?.data)) {
          totalCustomersCount = customersRes.data.data.length;
        } else if (Array.isArray(customersRes?.data)) {
          totalCustomersCount = customersRes.data.length;
        } else if (Array.isArray(customersRes)) {
          totalCustomersCount = customersRes.length;
        }

        // 3. For Loop se Total Sales Calculate karein
        let calculatedSales = 0;
        for (let i = 0; i < activeOrdersList.length; i++) {
          const currentOrder = activeOrdersList[i];
          const status = String(currentOrder.status || "").toLowerCase();

          if (status !== "cancelled" && status !== "canceled") {
            calculatedSales += parseOrderAmount(currentOrder);
          }
        }

        setMetrics({
          totalSales: `$${calculatedSales.toFixed(2)}`,
          totalOrders: activeOrdersList.length.toString(),
          totalCustomers: totalCustomersCount.toString(),
          totalProducts: productsList.length.toString(),
        });

        // 4. For Loop se Last 5 Recent Orders Nikalein (Reverse Order)
        const recent = [];
        const startIdx = Math.max(0, activeOrdersList.length - 5);
        for (let i = activeOrdersList.length - 1; i >= startIdx; i--) {
          recent.push(activeOrdersList[i]);
        }
        setRecentOrders(recent);
      } catch (error) {
        console.error("Error fetching live metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderStatusBadge = (status) => {
    const formattedStatus = String(status || "").trim().toLowerCase();

    switch (formattedStatus) {
      case "completed":
        return (
          <span className="status-badge completed">
            <i className="bi bi-check-circle-fill me-1"></i> Completed
          </span>
        );
      case "pending":
        return (
          <span className="status-badge pending">
            <i className="bi bi-clock-fill me-1"></i> Pending
          </span>
        );
      case "shipped":
        return (
          <span className="status-badge shipped">
            <i className="bi bi-truck me-1"></i> Shipped
          </span>
        );
      case "cancelled":
      case "canceled":
        return (
          <span className="status-badge cancelled">
            <i className="bi bi-x-circle-fill me-1"></i> Cancelled
          </span>
        );
      default:
        return (
          <span className="status-badge pending">{status || "Pending"}</span>
        );
    }
  };

  // ✅ For Loop se Recent Table Rows render ho rahi hain
  const renderTableRows = () => {
    if (recentOrders.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="text-center py-4 text-muted">
            No orders recorded yet.
          </td>
        </tr>
      );
    }

    const rows = [];
    for (let i = 0; i < recentOrders.length; i++) {
      const order = recentOrders[i];
      rows.push(
        <tr key={order.id || i}>
          <td className="order-id-cell text-primary fw-semibold">
            #ORD-{i + 1}
          </td>
          <td className="fw-semibold text-dark">
            {order.customerName || order.customer_name || order.customer || "N/A"}
          </td>
          <td className="text-secondary">{formatOrderDate(order)}</td>
          <td className="fw-bold text-dark">
            ${parseOrderAmount(order).toFixed(2)}
          </td>
          <td>{renderStatusBadge(order.status)}</td>
        </tr>
      );
    }

    return rows;
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-wrapper">
        <div className="container-fluid px-4 px-md-5 py-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h4 className="fw-bold dashboard-title m-0">Overview Metrics</h4>
            {loading && (
              <span className="badge bg-primary-subtle text-primary">
                Updating Live Data...
              </span>
            )}
          </div>

          {/* Metric Cards Grid */}
          <div className="row g-4 mb-5">
            {/* Sales Card */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="metric-card clickable-card card-sales">
                <div className="metric-icon-wrapper icon-sales">
                  <i className="bi bi-currency-dollar"></i>
                </div>
                <div className="metric-details">
                  <span className="metric-label">Total Sales</span>
                  <h3 className="metric-value">{metrics.totalSales}</h3>
                </div>
              </div>
            </div>

            {/* Orders Card */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="metric-card card-orders clickable-card"
                onClick={() => navigate("/orders")}
              >
                <div className="metric-icon-wrapper icon-orders">
                  <i className="bi bi-bag-check-fill"></i>
                </div>
                <div className="metric-details">
                  <span className="metric-label">Total Orders</span>
                  <h3 className="metric-value">{metrics.totalOrders}</h3>
                </div>
              </div>
            </div>

            {/* Customers Card */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="metric-card card-customers clickable-card"
                onClick={() => navigate("/customers")}
              >
                <div className="metric-icon-wrapper icon-customers">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="metric-details">
                  <span className="metric-label">Total Customers</span>
                  <h3 className="metric-value">{metrics.totalCustomers}</h3>
                </div>
              </div>
            </div>

            {/* Products Card */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="metric-card card-products clickable-card"
                onClick={() => navigate("/products")}
              >
                <div className="metric-icon-wrapper icon-products">
                  <i className="bi bi-box-seam-fill"></i>
                </div>
                <div className="metric-details">
                  <span className="metric-label">Total Products</span>
                  <h3 className="metric-value">{metrics.totalProducts}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Section */}
          <h5 className="orders-heading mb-3">Recent Orders</h5>

          <div className="orders-card">
            <div className="table-responsive">
              <table className="table align-middle mb-0 orders-table">
                <thead>
                  <tr>
                    <th style={{ color: "#123f83" }}>ORDER ID</th>
                    <th style={{ color: "#123f83" }}>CUSTOMER NAME</th>
                    <th style={{ color: "#123f83" }}>DATE</th>
                    <th style={{ color: "#123f83" }}>AMOUNT</th>
                    <th style={{ color: "#123f83" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>{renderTableRows()}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;