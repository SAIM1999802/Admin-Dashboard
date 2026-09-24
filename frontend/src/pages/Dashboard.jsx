import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProducts, getOrders, getCustomers } from "../services/api";
import "../styles/Dashboard.css";
import {
  DollarSign,
  ShoppingBag,
  BarChart3,
  Target,
  ArrowUpRight,
  Users,
} from "lucide-react";

// Helper utilities
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

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/**
 * Pure SVG CSP-Compliant Bar Chart
 */
const CSPBarChart = ({ data }) => {
  const [activeItem, setActiveItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="no-chart-data">
        No order item details available for charts.
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = 250;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100);
  const maxUnits = Math.max(...data.map((d) => d.units), 10);

  const groupWidth = chartWidth / data.length;
  const barWidthRevenue = Math.min(groupWidth * 0.35, 28);
  const barWidthUnits = Math.min(groupWidth * 0.2, 16);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className="csp-chart-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveItem(null)}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="csp-chart-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const val = Math.round(maxRevenue * ratio);
          return (
            <g key={`grid-${idx}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#eee9df"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="chart-axis-label"
              >
                ${val}
              </text>
            </g>
          );
        })}

        {/* Bars and X-Axis Labels */}
        {data.map((item, idx) => {
          const groupX = padding.left + idx * groupWidth;
          const centerX = groupX + groupWidth / 2;

          const revenueHeight = (item.revenue / maxRevenue) * chartHeight;
          const revenueY = padding.top + chartHeight - revenueHeight;
          const revBarX = centerX - barWidthRevenue - 2;

          const unitsHeight = (item.units / maxUnits) * chartHeight;
          const unitsY = padding.top + chartHeight - unitsHeight;
          const unitsBarX = centerX + 2;

          return (
            <g
              key={`bar-group-${idx}`}
              onMouseEnter={() => setActiveItem(item)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={groupX}
                y={padding.top}
                width={groupWidth}
                height={chartHeight}
                fill="transparent"
              />

              <rect
                x={revBarX}
                y={revenueY}
                width={barWidthRevenue}
                height={revenueHeight}
                fill="#ff6738"
                rx="4"
                ry="4"
                className="csp-bar"
              />

              <rect
                x={unitsBarX}
                y={unitsY}
                width={barWidthUnits}
                height={unitsHeight}
                fill="#0d5142"
                rx="4"
                ry="4"
                className="csp-bar"
              />

              <text
                x={centerX}
                y={svgHeight - 12}
                textAnchor="middle"
                className="chart-category-label"
              >
                {item.category.length > 12
                  ? `${item.category.substring(0, 10)}...`
                  : item.category}
              </text>
            </g>
          );
        })}
      </svg>

      {activeItem && (
        <div
          className="chart-tooltip active-tooltip"
          style={{
            left: `${mousePos.x + 12}px`,
            top: `${mousePos.y - 40}px`,
          }}
        >
          <strong>{activeItem.category}</strong>
          <div>Revenue: {money.format(activeItem.revenue)}</div>
          <div>Units sold: {number.format(activeItem.units)}</div>
        </div>
      )}
    </div>
  );
};

/**
 * Pure SVG Gauge Chart for Target Tracking
 */
const CSPGaugeChart = ({ progress }) => {
  const percentage = Math.min(Math.max(progress, 0), 100);
  const radius = 70;
  const strokeWidth = 16;
  const cx = 100;
  const cy = 90;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 200 110" className="gauge-svg">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#e9e3d8"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#ff6738"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="gauge-center">
        <strong>{progress.toFixed(0)}%</strong>
        <span>of target</span>
      </div>
    </div>
  );
};

const Dashboard = ({ monthlyTarget = 20000 }) => {
  const navigate = useNavigate();
  const [, setUser] = useState(null);

  const [rawProducts, setRawProducts] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);
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
        const ordersList = extractArray(ordersRes);

        let cCount = 0;
        if (typeof customersRes?.data?.count === "number") {
          cCount = customersRes.data.count;
        } else {
          cCount = extractArray(customersRes).length;
        }

        setRawProducts(productsList);
        setRawOrders(ordersList);
        setTotalCustomersCount(cCount);
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

  // Compute live analytics metrics cleanly in single pass
  const metrics = useMemo(() => {
    const activeProducts = rawProducts.filter((p) => !Number(p.is_deleted));
    
    // Map with String matching for product IDs
    const productMap = new Map(
      activeProducts.map((product) => [
        String(product.id || product._id),
        product,
      ])
    );

    const activeOrders = rawOrders.filter(
      (order) =>
        order &&
        String(order.status || "").toLowerCase() !== "deleted" &&
        !order.is_deleted
    );

    const validSalesOrders = activeOrders.filter((order) => {
      const status = String(order.status || "").toLowerCase();
      return status !== "cancelled" && status !== "canceled";
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const categoryMap = new Map();
    const productSales = new Map();

    validSalesOrders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      let orderRev = 0;
      let orderCost = 0;

      if (items.length > 0) {
        items.forEach((item) => {
          const product = productMap.get(String(item.product_id));
          const category = product?.category || order.category || "General";
          const quantity = Number(item.quantity || 1);
          const sellingPrice = Number(item.price ?? product?.price ?? 0);
          const rev = quantity * sellingPrice;
          const cost = quantity * Number(product?.stock_price || 0);

          orderRev += rev;
          orderCost += cost;

          // Category aggregation
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { category, units: 0, revenue: 0 });
          }
          const cRow = categoryMap.get(category);
          cRow.units += quantity;
          cRow.revenue += rev;

          // Product aggregation
          const prodName = item.product_name || product?.name || "Product";
          if (!productSales.has(prodName)) {
            productSales.set(prodName, {
              product: prodName,
              category,
              units: 0,
              revenue: 0,
            });
          }
          const pRow = productSales.get(prodName);
          pRow.units += quantity;
          pRow.revenue += rev;
        });
      } else {
        // Fallback if orders don't have item breakdowns
        const category = order.category || order.type || "General";
        const rev = parseOrderAmount(order);
        const quantity = Number(order.quantity || order.total_units || 1);

        orderRev += rev;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { category, units: 0, revenue: 0 });
        }
        const cRow = categoryMap.get(category);
        cRow.units += quantity;
        cRow.revenue += rev;
      }

      totalRevenue += orderRev;
      totalCost += orderCost;
    });

    const totalOrdersCount = activeOrders.length;
    const averageOrderValue = totalOrdersCount ? totalRevenue / totalOrdersCount : 0;
    const profitMargin = totalRevenue ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    const categoryPerformance = Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const target = Math.max(Number(monthlyTarget) || 0, 0);
    const progress = target > 0 ? (totalRevenue / target) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalOrdersCount,
      averageOrderValue,
      profitMargin,
      categoryPerformance,
      topProducts,
      target,
      progress,
      activeOrders,
      productsCount: activeProducts.length,
    };
  }, [rawProducts, rawOrders, monthlyTarget]);

  const renderStatusBadge = (status) => {
    const formattedStatus = String(status || "").trim().toLowerCase();

    switch (formattedStatus) {
      case "completed":
      case "paid":
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
    if (metrics.activeOrders.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="no-orders-cell">
            No orders recorded yet.
          </td>
        </tr>
      );
    }

    const rows = [];
    const startIndex = Math.max(0, metrics.activeOrders.length - 5);

    for (let i = metrics.activeOrders.length - 1; i >= startIndex; i--) {
      const order = metrics.activeOrders[i];
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
          <div>
            <span className="dashboard-eyebrow">SALES ANALYTICS</span>
            <h4 className="dashboard-title">Overview Metrics</h4>
          </div>
          {loading ? (
            <span className="live-badge">Updating Live Data...</span>
          ) : (
            <span className="live-badge status-online">
              <span className="status-dot" /> Live Data Connected
            </span>
          )}
        </div>

        {/* METRICS GRID */}
        <div className="metrics-grid">
          <div className="metric-card card-sales">
            <div className="metric-icon-wrapper">
              <DollarSign size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Sales</span>
              <h3 className="metric-value">{money.format(metrics.totalRevenue)}</h3>
              <span className="metric-helper">Gross sales from orders</span>
            </div>
          </div>

          <div
            className="metric-card clickable-card card-orders"
            onClick={() => navigate("/orders")}
          >
            <div className="metric-icon-wrapper">
              <ShoppingBag size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Orders</span>
              <h3 className="metric-value">{metrics.totalOrdersCount}</h3>
              <span className="metric-helper">Active customer orders</span>
            </div>
          </div>

          <div
            className="metric-card clickable-card card-customers"
            onClick={() => navigate("/customers")}
          >
            <div className="metric-icon-wrapper">
              <Users size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-label">Total Customers</span>
              <h3 className="metric-value">{totalCustomersCount}</h3>
              <span className="metric-helper">Registered accounts</span>
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
              <h3 className="metric-value">{metrics.productsCount}</h3>
              <span className="metric-helper">Available catalog items</span>
            </div>
          </div>

          <div className="metric-card card-aov">
            <div className="metric-icon-wrapper">
              <BarChart3 size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-label">Average Order Value</span>
              <h3 className="metric-value">{money.format(metrics.averageOrderValue)}</h3>
              <span className="metric-helper">Revenue ÷ total orders</span>
            </div>
          </div>

          <div className="metric-card card-profit">
            <div className="metric-icon-wrapper">
              <Target size={24} />
            </div>
            <div className="metric-details">
              <span className="metric-label">Profit Margin</span>
              <h3 className="metric-value">{metrics.profitMargin.toFixed(1)}%</h3>
              <span className="metric-helper">
                {money.format(metrics.totalRevenue - metrics.totalCost)} gross profit
              </span>
            </div>
          </div>
        </div>

        {/* ANALYTICS SECTION */}
        <div className="analytics-grid">
          <div className="panel panel-large">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">PRODUCT PERFORMANCE</p>
                <h2>Category Sales Mix</h2>
                <p className="panel-description">
                  Units sold and live revenue breakdown by category.
                </p>
              </div>
              <div className="legend-chip">
                <span className="legend-swatch legend-revenue" /> Revenue
                <span className="legend-swatch legend-units" /> Units
              </div>
            </div>

            <div className="chart-wrap">
              <CSPBarChart data={metrics.categoryPerformance} />
            </div>

            {metrics.topProducts.length > 0 && (
              <div className="top-products">
                <div className="top-products-header">
                  <span>Top Performing Products</span>
                  <span>Revenue</span>
                </div>
                {metrics.topProducts.map((item, idx) => (
                  <div className="product-row" key={`${item.product}-${idx}`}>
                    <div className="product-name-cell">
                      <span className="product-rank">{idx + 1}</span>
                      <div>
                        <strong>{item.product}</strong>
                        <span>{item.units} units · {item.category}</span>
                      </div>
                    </div>
                    <strong>{money.format(item.revenue)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel target-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">TARGET PROGRESS</p>
                <h2>Monthly Target</h2>
                <p className="panel-description">
                  Actual revenue vs configured target.
                </p>
              </div>
            </div>

            <CSPGaugeChart progress={metrics.progress} />

            <div className="target-values">
              <div>
                <span>Actual Revenue</span>
                <strong>{money.format(metrics.totalRevenue)}</strong>
              </div>
              <div>
                <span>Monthly Target</span>
                <strong>{money.format(metrics.target)}</strong>
              </div>
            </div>

            <div className="target-footer">
              <div>
                <ArrowUpRight size={17} />
                <span>
                  {metrics.progress >= 100
                    ? "Target reached!"
                    : `${money.format(Math.max(metrics.target - metrics.totalRevenue, 0))} remaining`}
                </span>
              </div>
              <span className="target-badge">
                {metrics.progress >= 100 ? "On target" : "In progress"}
              </span>
            </div>
          </div>
        </div>

        {/* RECENT ORDERS TABLE */}
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