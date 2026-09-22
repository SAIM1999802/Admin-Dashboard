import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProducts, getOrders, getCustomers } from "../services/api";
import "../styles/Dashboard.css";

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.orders)) return res.data.orders;
  if (Array.isArray(res?.data?.products)) return res.data.products;
  if (Array.isArray(res?.data?.customers)) return res.data.customers;
  return [];
};

const parseOrderAmount = (order) => {
  if (!order) return 0;
  const rawVal =
    order.total_amount ??
    order.totalAmount ??
    order.amount ??
    order.total ??
    order.total_price ??
    order.price ??
    0;
  const numericVal = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ""));
  return isNaN(numericVal) ? 0 : numericVal;
};

const formatOrderDate = (order) => {
  if (!order) return new Date().toLocaleDateString();
  const rawDate =
    order.createdAt || order.created_at || order.order_date || order.date;

  if (!rawDate) return new Date().toLocaleDateString();

  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? String(rawDate) : d.toLocaleDateString();
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [, setUser] = useState(null);

  const [metrics, setMetrics] = useState({
    totalSales: "$0.00",
    totalOrders: "0",
    totalCustomers: "0",
    totalProducts: "0",
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const [productsRes, ordersRes, customersRes] = await Promise.all([
          getProducts().catch(() => ({ data: [] })),
          getOrders().catch(() => ({ data: [] })),
          getCustomers().catch(() => ({ data: [] })),
        ]);

        const productsList = extractArray(productsRes);
        const rawOrdersList = extractArray(ordersRes);

        const activeOrdersList = rawOrdersList.filter(
          (order) =>
            order &&
            String(order.status || "").toLowerCase() !== "deleted" &&
            !order.is_deleted
        );

        let totalCustomersCount = 0;
        if (typeof customersRes?.data?.count === "number") {
          totalCustomersCount = customersRes.data.count;
        } else {
          totalCustomersCount = extractArray(customersRes).length;
        }

        let calculatedSales = 0;
        for (let i = activeOrdersList.length - 1; i >= 0; i--) {
          const status = String(activeOrdersList[i].status || "").toLowerCase();
          if (status !== "cancelled" && status !== "canceled") {
            calculatedSales += parseOrderAmount(activeOrdersList[i]);
          }
        }

        setMetrics({
          totalSales: `$${calculatedSales.toFixed(2)}`,
          totalOrders: activeOrdersList.length.toString(),
          totalCustomers: totalCustomersCount.toString(),
          totalProducts: productsList.length.toString(),
        });

        setRecentOrders(activeOrdersList);
      } catch (error) {
        console.error("Error fetching live metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderStatusBadge = (status) => {
    const formattedStatus = String(status || "")
      .trim()
      .toLowerCase();

    switch (formattedStatus) {
      case "completed":
        return (
          <span className="status-badge completed">
            <i className="bi bi-check-circle-fill"></i> Completed
          </span>
        );
      case "pending":
        return (
          <span className="status-badge pending">
            <i className="bi bi-clock-fill"></i> Pending
          </span>
        );
      case "shipped":
        return (
          <span className="status-badge shipped">
            <i className="bi bi-truck"></i> Shipped
          </span>
        );
      case "cancelled":
      case "canceled":
        return (
          <span className="status-badge cancelled">
            <i className="bi bi-x-circle-fill"></i> Cancelled
          </span>
        );
      default:
        return (
          <span className="status-badge pending">{status || "Pending"}</span>
        );
    }
  };

  const renderTableRows = () => {
    if (recentOrders.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="no-orders-cell">
            No orders recorded yet.
          </td>
        </tr>
      );
    }

    const rows = [];
    const startIndex = Math.max(0, recentOrders.length - 5);
    
    for (let i = recentOrders.length - 1; i >= startIndex; i--) {
      const order = recentOrders[i];
      if (!order) continue;

      const displayOrderId =
        order.custom_id || order.id || order._id || `#${i + 1}`;

      const customerName =
        order.customer_name ||
        order.customerName ||
        order.name ||
        order.customer ||
        "N/A";

      rows.push(
        <tr key={order.id || order._id || `recent-ord-${i}`}>
          <td className="cell-order-id">{displayOrderId}</td>
          <td className="cell-customer">{customerName}</td>
          <td className="cell-date">{formatOrderDate(order)}</td>
          <td className="cell-amount">
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
        <div className="dashboard-header">
          <h4 className="dashboard-title">Overview Metrics</h4>
          {loading && <span className="live-badge">Updating Live Data...</span>}
        </div>

        <div className="metrics-grid">
          <div className="metric-card clickable-card card-sales">
            <div className="metric-icon-wrapper">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Sales</span>
              <h3 className="metric-value">{metrics.totalSales}</h3>
            </div>
          </div>

          <div
            className="metric-card clickable-card card-orders"
            onClick={() => navigate("/orders")}
          >
            <div className="metric-icon-wrapper">
              <i className="bi bi-bag-check-fill"></i>
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Orders</span>
              <h3 className="metric-value">{metrics.totalOrders}</h3>
            </div>
          </div>

          <div
            className="metric-card clickable-card card-customers"
            onClick={() => navigate("/customers")}
          >
            <div className="metric-icon-wrapper">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Customers</span>
              <h3 className="metric-value">{metrics.totalCustomers}</h3>
            </div>
          </div>

          <div
            className="metric-card clickable-card card-products"
            onClick={() => navigate("/products")}
          >
            <div className="metric-icon-wrapper">
              <i className="bi bi-box-seam-fill"></i>
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Products</span>
              <h3 className="metric-value">{metrics.totalProducts}</h3>
            </div>
          </div>
        </div>

        <h5 className="orders-section-heading">Recent Orders</h5>

        <div className="orders-card">
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>CUSTOMER NAME</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>{renderTableRows()}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;