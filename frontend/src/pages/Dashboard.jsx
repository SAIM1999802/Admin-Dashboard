import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AdminBot from "../components/adminbot";
import { getProducts, getOrders, getCustomers } from "../services/api";
import "../styles/Dashboard.css";
import * as XLSX from "xlsx";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  UserCheck,
  ClipboardList,
  Download,
} from "lucide-react";

const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.orders)) return res.data.orders;
  if (Array.isArray(res?.data?.products)) return res.data.products;
  if (Array.isArray(res?.data?.customers)) return res.data.customers;
  return [];
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const numericValue = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

const getProductSellingPrice = (product) => product ? parseNumber(product.price) : 0;
const getProductCostPrice = (product) => product ? parseNumber(product.stock_price ?? product.cost_price ?? product.stockPrice) : 0;

const getOrderDate = (order) => {
  if (!order) return null;
  const rawDate = order.createdAt || order.created_at || order.order_date || order.orderDate || order.date || order.updatedAt || order.updated_at || order.timestamp;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatOrderDate = (order) => {
  const date = getOrderDate(order);
  return date ? date.toLocaleDateString() : new Date().toLocaleDateString();
};

const getProductId = (productOrItem) => productOrItem ? (productOrItem.product_id ?? productOrItem.productId ?? productOrItem.productID ?? productOrItem.id ?? productOrItem._id ?? null) : null;

const getItemQuantity = (item) => {
  const quantity = item?.quantity ?? item?.qty ?? item?.total_quantity ?? item?.totalQuantity ?? 1;
  const parsedQuantity = Number(quantity);
  return Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
};

const getOrderUnits = (order) => {
  if (!order) return 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => sum + getItemQuantity(item), 0);
  }
  return getItemQuantity(order);
};

const getOrderRevenue = (order, productMap) => {
  if (!order) return 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    let revenue = 0;
    let foundProduct = false;
    order.items.forEach((item) => {
      const productId = getProductId(item);
      const product = productMap.get(String(productId));
      if (product) {
        foundProduct = true;
        revenue += getProductSellingPrice(product) * getItemQuantity(item);
      }
    });
    if (foundProduct) return revenue;
    return parseNumber(order.total_amount ?? order.totalAmount ?? order.amount ?? order.total ?? order.total_price);
  }
  const productId = getProductId(order);
  const product = productMap.get(String(productId));
  if (product) return getProductSellingPrice(product) * getItemQuantity(order);
  return parseNumber(order.total_amount ?? order.totalAmount ?? order.amount ?? order.total ?? order.total_price);
};

/**
 * Cost calculation.
 *
 * IMPORTANT FIX: previously this returned 0 whenever an order's items could
 * not be matched against the currently-loaded productMap (e.g. a very
 * recently placed order whose product hasn't synced into productMap yet,
 * or a product referenced by an order that has since been edited/removed).
 * Revenue already had a fallback (order.total_amount etc.) for that same
 * situation, but cost did not - so cost silently became 0 and
 * profit = revenue - 0 = revenue for those orders.
 *
 * Because "daily" / "weekly" buckets only contain the most recent orders,
 * they were the ranges most likely to be made up entirely of these
 * unmatched orders - which is why profit appeared identical to sales for
 * Daily/Weekly, while Monthly/Yearly (mixing in older, properly-matched
 * orders) looked correct.
 *
 * Fix: when an order's product(s) can't be matched, fall back to an
 * estimated cost using the average cost-to-price ratio computed from the
 * products we DO have full data for, instead of silently treating cost as 0.
 */
const getOrderCost = (order, productMap, avgCostRatio = 0) => {
  if (!order) return 0;
  if (Array.isArray(order.items) && order.items.length > 0) {
    let cost = 0;
    let foundProduct = false;
    order.items.forEach((item) => {
      const productId = getProductId(item);
      const product = productMap.get(String(productId));
      if (product) {
        foundProduct = true;
        cost += getProductCostPrice(product) * getItemQuantity(item);
      }
    });
    if (foundProduct) return cost;
    return getOrderRevenue(order, productMap) * avgCostRatio;
  }
  const productId = getProductId(order);
  const product = productMap.get(String(productId));
  if (product) return getProductCostPrice(product) * getItemQuantity(order);
  return getOrderRevenue(order, productMap) * avgCostRatio;
};

const getCustomerKey = (order) => {
  if (!order) return null;
  const key = order.customer_id || order.customerId || order.customer_email || order.email || order.customer_name || order.customerName || order.name || order.customer || null;
  return key ? String(key).trim().toLowerCase() : null;
};

const isOrderInRange = (order, range, now) => {
  const orderDate = getOrderDate(order);
  if (!orderDate) return false;

  switch (range) {
    case "daily":
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      );
    case "weekly": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    }
    case "monthly":
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
    case "yearly":
      return orderDate.getFullYear() === now.getFullYear();
    default:
      return false;
  }
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatHourLabel = (hour) => {
  const period = hour < 12 ? "am" : "pm";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}${period}`;
};

const RANGE_TEXT = {
  daily: { periodLabel: "Today", noun: "today" },
  weekly: { periodLabel: "This Week", noun: "this week" },
  monthly: { periodLabel: "This Month", noun: "this month" },
  yearly: { periodLabel: "This Year", noun: "this year" },
};

const TIME_RANGE_TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const CSPBarChart = ({ data }) => {
  const [activeItem, setActiveItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div className="no-chart-data">Is selected period ke liye koi data available nahi hai.</div>;
  }

  const svgWidth = 600, svgHeight = 250;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10);
  const maxUnits = Math.max(...data.map((d) => d.units), 1);
  const groupWidth = chartWidth / data.length;
  const barWidthRevenue = Math.min(groupWidth * 0.35, 28);
  const barWidthUnits = Math.min(groupWidth * 0.2, 16);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="csp-chart-container" onMouseMove={handleMouseMove} onMouseLeave={() => setActiveItem(null)}>
      <style>{`
        @keyframes cspBarGrow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
        @keyframes cspLabelFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="csp-chart-svg" preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio);
          return (
            <g key={`grid-${idx}`}>
              <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#eee9df" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="chart-axis-label">
                ${Math.round(maxRevenue * ratio)}
              </text>
            </g>
          );
        })}
        {data.map((item, idx) => {
          const groupX = padding.left + idx * groupWidth;
          const centerX = groupX + groupWidth / 2;
          const revenueHeight = (item.revenue / maxRevenue) * chartHeight;
          const revenueY = padding.top + chartHeight - revenueHeight;
          const unitsHeight = (item.units / maxUnits) * chartHeight;
          const unitsY = padding.top + chartHeight - unitsHeight;
          const delay = `${idx * 0.035}s`;

          return (
            <g key={`bar-group-${item.category}-${idx}`} className="csp-bar-group" onMouseEnter={() => setActiveItem(item)}>
              <rect x={groupX} y={padding.top} width={groupWidth} height={chartHeight} fill="transparent" />
              <rect
                className="csp-bar csp-bar-revenue"
                x={centerX - barWidthRevenue - 2}
                y={revenueY}
                width={barWidthRevenue}
                height={revenueHeight}
                rx="4"
                ry="4"
                style={{ animationDelay: delay }}
              />
              <rect
                className="csp-bar csp-bar-units"
                x={centerX + 2}
                y={unitsY}
                width={barWidthUnits}
                height={unitsHeight}
                rx="4"
                ry="4"
                style={{ animationDelay: delay }}
              />
              <text x={centerX} y={svgHeight - 12} textAnchor="middle" className="csp-bar-label" style={{ animationDelay: delay }}>
                {item.category.length > 12 ? `${item.category.substring(0, 10)}...` : item.category}
              </text>
            </g>
          );
        })}
      </svg>
      {activeItem && (
        <div className="chart-tooltip active-tooltip" style={{ left: `${mousePos.x + 12}px`, top: `${mousePos.y - 40}px` }}>
          <strong>{activeItem.category}</strong>
          <div>Revenue: {money.format(activeItem.revenue)}</div>
          <div>Units sold: {number.format(activeItem.units)}</div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [, setUser] = useState(null);
  const [globalTimeRange, setGlobalTimeRange] = useState("weekly");
  const [rawProducts, setRawProducts] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try { setUser(JSON.parse(savedUser)); } catch (error) { console.error("User parsing error:", error); }
    }

    const fetchDashboardData = async () => {
      try {
        const [productsRes, ordersRes, customersRes] = await Promise.all([
          getProducts().catch(() => ({ data: [] })),
          getOrders().catch(() => ({ data: [] })),
          getCustomers().catch(() => ({ data: [] })),
        ]);
        setRawProducts(extractArray(productsRes));
        setRawOrders(extractArray(ordersRes));
        setTotalCustomersCount(typeof customersRes?.data?.count === "number" ? customersRes.data.count : extractArray(customersRes).length);
      } catch (error) {
        console.error("Error fetching live metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const productMap = useMemo(() => {
    return new Map(rawProducts.map((p) => [String(p.id ?? p._id), p]));
  }, [rawProducts]);

  // Average cost-to-price ratio across products that have BOTH a valid
  // selling price and a valid cost price. Used as a fallback estimate for
  // orders whose product can't be matched in productMap, so cost never
  // silently collapses to 0 (which used to make profit === sales).
  const avgCostRatio = useMemo(() => {
    let totalPrice = 0;
    let totalCost = 0;
    rawProducts.forEach((p) => {
      const price = getProductSellingPrice(p);
      const cost = getProductCostPrice(p);
      if (price > 0 && cost > 0) {
        totalPrice += price;
        totalCost += cost;
      }
    });
    return totalPrice > 0 ? totalCost / totalPrice : 0.6;
  }, [rawProducts]);

  const globalMetrics = useMemo(() => {
    const activeProducts = rawProducts.filter((p) => !Number(p.is_deleted));
    const validSalesOrders = rawOrders.filter((o) => {
      if (!o) return false;
      const status = String(o.status || "").toLowerCase();
      return status !== "deleted" && !o.is_deleted && status !== "cancelled" && status !== "canceled";
    });

    let totalRevenue = 0, totalCost = 0;
    validSalesOrders.forEach((o) => {
      totalRevenue += getOrderRevenue(o, productMap);
      totalCost += getOrderCost(o, productMap, avgCostRatio);
    });

    const totalProfit = totalRevenue - totalCost;
    const totalOrdersCount = validSalesOrders.length;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalOrdersCount,
      averageOrderValue: totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      allOrders: validSalesOrders,
      productsCount: activeProducts.length,
    };
  }, [rawProducts, rawOrders, productMap, avgCostRatio]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return globalMetrics.allOrders.filter((o) => isOrderInRange(o, globalTimeRange, now));
  }, [globalMetrics.allOrders, globalTimeRange]);

  const filteredMetrics = useMemo(() => {
    let filteredSales = 0, filteredCost = 0;
    const customerSet = new Set();

    filteredOrders.forEach((o) => {
      filteredSales += getOrderRevenue(o, productMap);
      filteredCost += getOrderCost(o, productMap, avgCostRatio);
      const key = getCustomerKey(o);
      if (key) customerSet.add(key);
    });

    return {
      filteredSales,
      filteredCost,
      filteredProfit: filteredSales - filteredCost,
      filteredActiveCustomers: customerSet.size,
      filteredOrdersCount: filteredOrders.length,
    };
  }, [filteredOrders, productMap, avgCostRatio]);

  const chartData = useMemo(() => {
    const now = new Date();
    if (globalTimeRange === "daily") {
      const buckets = Array.from({ length: 24 }, (_, h) => ({ category: formatHourLabel(h), revenue: 0, units: 0 }));
      globalMetrics.allOrders.forEach((o) => {
        const d = getOrderDate(o);
        if (d && d.toDateString() === now.toDateString()) {
          buckets[d.getHours()].revenue += getOrderRevenue(o, productMap);
          buckets[d.getHours()].units += getOrderUnits(o);
        }
      });
      return buckets;
    }

    if (globalTimeRange === "weekly") {
      const buckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        buckets.push({ key: d.toDateString(), category: `${DAY_LABELS[d.getDay()]} ${d.getDate()}`, revenue: 0, units: 0 });
      }
      globalMetrics.allOrders.forEach((o) => {
        const d = getOrderDate(o);
        if (!d) return;
        const bucket = buckets.find((b) => b.key === d.toDateString());
        if (bucket) {
          bucket.revenue += getOrderRevenue(o, productMap);
          bucket.units += getOrderUnits(o);
        }
      });
      return buckets;
    }

    if (globalTimeRange === "monthly") {
      const year = now.getFullYear(), month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const buckets = [];
      for (let start = 1; start <= daysInMonth; start += 3) {
        const end = Math.min(start + 2, daysInMonth);
        buckets.push({ category: start === end ? `${start}` : `${start}-${end}`, revenue: 0, units: 0 });
      }
      globalMetrics.allOrders.forEach((o) => {
        const d = getOrderDate(o);
        if (d && d.getFullYear() === year && d.getMonth() === month) {
          const idx = Math.floor((d.getDate() - 1) / 3);
          if (buckets[idx]) {
            buckets[idx].revenue += getOrderRevenue(o, productMap);
            buckets[idx].units += getOrderUnits(o);
          }
        }
      });
      return buckets;
    }

    if (globalTimeRange === "yearly") {
      const year = now.getFullYear();
      const buckets = MONTH_LABELS.map((label) => ({ category: label, revenue: 0, units: 0 }));
      globalMetrics.allOrders.forEach((o) => {
        const d = getOrderDate(o);
        if (d && d.getFullYear() === year) {
          buckets[d.getMonth()].revenue += getOrderRevenue(o, productMap);
          buckets[d.getMonth()].units += getOrderUnits(o);
        }
      });
      return buckets;
    }
    return [];
  }, [globalMetrics.allOrders, globalTimeRange, productMap]);

  const panelCopy = useMemo(() => {
    switch (globalTimeRange) {
      case "daily": return { kicker: "SALES TREND", title: "Today", description: "Hourly revenue and units for today." };
      case "monthly": return { kicker: "SALES TREND", title: "This Month", description: "Revenue and units broken into 3-day intervals." };
      case "yearly": return { kicker: "SALES TREND", title: "This Year", description: "Month-by-month revenue and units breakdown." };
      default: return { kicker: "SALES TREND", title: "Last 7 Days", description: "Daily revenue and units, day by day." };
    }
  }, [globalTimeRange]);

  const renderStatusBadge = (status) => {
    const s = String(status || "").trim().toLowerCase();
    if (s === "completed" || s === "paid") return <span className="status-badge completed"><i className="bi bi-check-circle-fill"></i> Completed</span>;
    if (s === "pending") return <span className="status-badge pending"><i className="bi bi-clock-fill"></i> Pending</span>;
    if (s === "shipped") return <span className="status-badge shipped"><i className="bi bi-truck"></i> Shipped</span>;
    if (s === "cancelled" || s === "canceled") return <span className="status-badge cancelled"><i className="bi bi-x-circle-fill"></i> Cancelled</span>;
    return <span className="status-badge pending">{status || "Pending"}</span>;
  };

  const renderTableRows = () => {
    if (globalMetrics.allOrders.length === 0) {
      return <tr><td colSpan="5" className="no-orders-cell">No orders found.</td></tr>;
    }
    return globalMetrics.allOrders.slice().reverse().slice(0, 5).map((order, i) => (
      <tr key={order.id || order._id || `recent-${i}`}>
        <td className="cell-order-id">{order.custom_id || order.id || order._id || `#${i + 1}`}</td>
        <td className="cell-customer">{order.customer_name || order.customerName || order.name || order.customer || "N/A"}</td>
        <td className="cell-date">{formatOrderDate(order)}</td>
        <td className="cell-amount">${getOrderRevenue(order, productMap).toFixed(2)}</td>
        <td>{renderStatusBadge(order.status)}</td>
      </tr>
    ));
  };

  const handleExportReport = () => {
    try {
      const wb = XLSX.utils.book_new();
      const periodLabel = RANGE_TEXT[globalTimeRange].periodLabel;

      const summaryRows = [
        ["Dashboard Export", ""],
        ["Generated", new Date().toLocaleString()],
        [],
        ["Metric", "Value"],
        ["Total Sales", Number(globalMetrics.totalRevenue.toFixed(2))],
        ["Total Cost", Number(globalMetrics.totalCost.toFixed(2))],
        ["Total Profit", Number(globalMetrics.totalProfit.toFixed(2))],
        ["Total Orders", globalMetrics.totalOrdersCount],
        ["Total Customers", totalCustomersCount],
        ["Total Products", globalMetrics.productsCount],
        ["Average Order Value", Number(globalMetrics.averageOrderValue.toFixed(2))],
        ["Profit Margin (%)", Number(globalMetrics.profitMargin.toFixed(2))],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      summarySheet["!cols"] = [{ wch: 28 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      const filteredRows = [
        ["Filter Applied", periodLabel],
        [],
        ["Metric", "Value"],
        ["Filtered Sales", Number(filteredMetrics.filteredSales.toFixed(2))],
        ["Filtered Cost", Number(filteredMetrics.filteredCost.toFixed(2))],
        ["Filtered Profit", Number(filteredMetrics.filteredProfit.toFixed(2))],
        ["Filtered Active Customers", filteredMetrics.filteredActiveCustomers],
        ["Filtered Orders", filteredMetrics.filteredOrdersCount],
      ];
      const filteredSheet = XLSX.utils.aoa_to_sheet(filteredRows);
      filteredSheet["!cols"] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, filteredSheet, "Filtered Breakdown");

      const chartRows = [["Period", "Revenue", "Units Sold"], ...chartData.map((item) => [item.category, Number(item.revenue.toFixed(2)), item.units])];
      const chartSheet = XLSX.utils.aoa_to_sheet(chartRows);
      chartSheet["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, chartSheet, `${periodLabel} Chart Data`.slice(0, 31));

      const recentRows = [
        ["Order ID", "Customer", "Date", "Sales", "Cost", "Profit", "Status"],
        ...globalMetrics.allOrders.slice().reverse().slice(0, 25).map((o) => {
          const sales = getOrderRevenue(o, productMap);
          const cost = getOrderCost(o, productMap, avgCostRatio);
          return [
            o.custom_id || o.id || o._id || "",
            o.customer_name || o.customerName || o.name || o.customer || "N/A",
            formatOrderDate(o),
            Number(sales.toFixed(2)),
            Number(cost.toFixed(2)),
            Number((sales - cost).toFixed(2)),
            o.status || "Pending",
          ];
        }),
      ];
      const recentSheet = XLSX.utils.aoa_to_sheet(recentRows);
      recentSheet["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, recentSheet, "Recent Orders");

      XLSX.writeFile(wb, `dashboard-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Failed to export dashboard report:", error);
    }
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
          <div className="dashboard-header-actions">
            {loading ? <span className="live-badge">Updating Live Data...</span> : <span className="live-badge status-online"><span className="status-dot" />Live Data Connected</span>}
            <button type="button" className="export-report-btn" onClick={handleExportReport}>
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>

        <div className="metrics-grid metrics-grid-4 top-metrics-grid">
          <div className="metric-card card-sales">
            <div className="metric-icon-wrapper"><DollarSign size={24} /></div>
            <div className="metric-details">
              <span className="metric-label">Total Sales</span>
              <h3 className="metric-value">{money.format(globalMetrics.totalRevenue)}</h3>
              <span className="metric-helper">Selling price × quantity</span>
            </div>
          </div>
          <div className="metric-card clickable-card card-orders" onClick={() => navigate("/orders")}>
            <div className="metric-icon-wrapper"><ShoppingBag size={24} /></div>
            <div className="metric-details">
              <span className="metric-label">Total Orders</span>
              <h3 className="metric-value">{globalMetrics.totalOrdersCount}</h3>
              <span className="metric-helper">Total active orders</span>
            </div>
          </div>
          <div className="metric-card clickable-card card-customers" onClick={() => navigate("/customers")}>
            <div className="metric-icon-wrapper"><Users size={24} /></div>
            <div className="metric-details">
              <span className="metric-label">Total Customers</span>
              <h3 className="metric-value">{totalCustomersCount}</h3>
              <span className="metric-helper">Registered accounts</span>
            </div>
          </div>
          <div className="metric-card clickable-card card-products" onClick={() => navigate("/products")}>
            <div className="metric-icon-wrapper"><i className="bi bi-box-seam-fill"></i></div>
            <div className="metric-details">
              <span className="metric-label">Total Products</span>
              <h3 className="metric-value">{globalMetrics.productsCount}</h3>
              <span className="metric-helper">Available catalog items</span>
            </div>
          </div>
        </div>

        <div className="time-filter-wrap">
          <div className="time-filter-tabs">
            {TIME_RANGE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGlobalTimeRange(tab.id)}
                className={`time-tab${globalTimeRange === tab.id ? " active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="metrics-grid metrics-grid-4 filtered-metrics-grid">
          <div className="metric-card card-sales">
            <div className="metric-icon-wrapper"><DollarSign size={24} /></div>
            <div className="metric-details">
              <span className="metric-label">Sales</span>
              <h3 className="metric-value">{money.format(filteredMetrics.filteredSales)}</h3>
              <span className="metric-helper">{RANGE_TEXT[globalTimeRange].periodLabel}</span>
            </div>
          </div>
          <div className="metric-card card-profit">
            <div className="metric-icon-wrapper"><TrendingUp size={24} /></div>
            <div className="metric-details">
              <span className="metric-label">Profit</span>
              <h3 className="metric-value">{money.format(filteredMetrics.filteredProfit)}</h3>
              <span className="metric-helper">Sales − stock cost {RANGE_TEXT[globalTimeRange].noun}</span>
            </div>
          </div>
          <div className="metric-card card-customers">
            <div className="metric-icon-wrapper"><UserCheck size={24} /></div>
            <div className="metric-details">
              <span className="metric-label">Active Customers</span>
              <h3 className="metric-value">{number.format(filteredMetrics.filteredActiveCustomers)}</h3>
              <span className="metric-helper">Unique buyers {RANGE_TEXT[globalTimeRange].noun}</span>
            </div>
          </div>
          <div className="metric-card card-orders">
            <div className="metric-icon-wrapper"><ClipboardList size={24} /></div>
            <div className="metric-details">
              <span className="metric-label">Orders</span>
              <h3 className="metric-value">{number.format(filteredMetrics.filteredOrdersCount)}</h3>
              <span className="metric-helper">Orders placed {RANGE_TEXT[globalTimeRange].noun}</span>
            </div>
          </div>
        </div>

        <div className="analytics-grid analytics-grid-single">
          <div className="panel panel-large">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">{panelCopy.kicker}</p>
                <h2>{panelCopy.title}</h2>
                <p className="panel-description">{panelCopy.description}</p>
              </div>
              <div className="legend-chip">
                <span className="legend-swatch legend-revenue" /> Revenue
                <span className="legend-swatch legend-units" /> Units
              </div>
            </div>
            <div className="chart-wrap">
              <CSPBarChart data={chartData} />
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
      <AdminBot/>
    </>
  );
};

export default Dashboard;