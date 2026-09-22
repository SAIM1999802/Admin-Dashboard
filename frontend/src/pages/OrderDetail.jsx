import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails } from "../services/api";
import "../styles/Orders.css";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await getOrderDetails(id);
        const resultData = response?.data?.data || response?.data || response;
        setOrder(resultData);
      } catch (error) {
        console.error("Error loading order detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || "pending").toLowerCase();
    switch (statusLower) {
      case "completed":
      case "delivered":
        return "status completed";
      case "processing":
      case "shipped":
        return "status shipped";
      case "cancelled":
      case "deleted":
        return "status cancelled";
      default:
        return "status pending";
    }
  };

  const getFormattedDate = (orderData) => {
    if (!orderData) return "N/A";

    const rawDate =
      orderData.created_at ||
      orderData.createdAt ||
      orderData.order_date ||
      orderData.date;

    if (!rawDate) return "N/A";

    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return String(rawDate);

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleProductClick = (item) => {
    const productId = item.product_id || item.id || item._id;
    if (productId) {
      navigate(`/products/details/${productId}`);
    }
  };

  if (loading) {
    return (
      <div className="order-detail-wrapper">
        <div className="text-center-wrapper">
          <div className="spinner"></div>
          <p className="text-muted-small" style={{ marginTop: "1rem" }}>
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-wrapper">
        <div className="text-center-wrapper">
          <h3 style={{ fontFamily: "var(--font-serif)", color: "#145c52" }}>
            Order Not Found
          </h3>
          <button
            className="primary-btn"
            style={{ marginTop: "1rem" }}
            onClick={() => navigate("/orders")}
          >
            Back to Orders List
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = getFormattedDate(order);
  const totalAmount = Number(
    order.total_amount || order.totalAmount || order.amount || 0
  ).toFixed(2);

  const itemsList = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="order-detail-wrapper">
      <main className="order-detail-container">
        <div className="detail-header-bar">
          <button
            className="btn-back-link"
            onClick={() => navigate("/orders")}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Orders
          </button>
        </div>

        <div className="order-detail-card">
          <div className="order-card-header">
            <div>
              <h1 className="order-title">
                Order #{order.order_number || order.id || id}
              </h1>
              <span className="order-date-tag">
                Placed on {formattedDate}
              </span>
            </div>

            <span className={getStatusBadgeClass(order.status)}>
              {order.status ? order.status.toUpperCase() : "PENDING"}
            </span>
          </div>

          <div className="detail-data-list">
            <div className="detail-data-row">
              <span className="detail-label">Customer Name</span>
              <span className="detail-value">
                {order.customer_name ||
                  order.customerName ||
                  order.name ||
                  "N/A"}
              </span>
            </div>

            <div className="detail-data-row">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">
                {order.customer_email ||
                  order.customerEmail ||
                  order.email ||
                  "N/A"}
              </span>
            </div>

            <div className="detail-data-row">
              <span className="detail-label">Order Date</span>
              <span className="detail-value">{formattedDate}</span>
            </div>

            <div className="detail-data-row">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value-price">${totalAmount}</span>
            </div>

            <div className="detail-data-row">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">
                {order.payment_method || order.payment_status || "Paid"}
              </span>
            </div>
          </div>

          <div className="customer-address-box">
            <h3 className="address-title">Shipping Address</h3>
            <p className="address-text">
              {order.shipping_address ||
                order.shippingAddress ||
                order.address ||
                "No shipping address provided."}
            </p>
          </div>

          <div className="order-items-section">
            <h3 className="section-subtitle">Order Items</h3>
            {itemsList.length > 0 ? (
              <div className="table-card">
                <div className="table-scroll-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: "90px" }}>PICTURE</th>
                        <th>PRODUCT DETAILS</th>
                        <th style={{ width: "120px", textAlign: "center" }}>
                          QUANTITY
                        </th>
                        <th style={{ width: "130px", textAlign: "right" }}>
                          UNIT PRICE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsList.map((item, index) => {
                        const qty = Number(item.quantity || 1);
                        const price = Number(item.price || 0);
                        const productName =
                          item.product_name ||
                          item.name ||
                          `Product #${item.product_id}`;
                        const imageUrl =
                          item.image_url || item.image || item.picture;
                        const description =
                          item.description || item.product_description || "";

                        return (
                          <tr
                            key={index}
                            onClick={() => handleProductClick(item)}
                            className="clickable-row"
                          >
                            <td style={{ textAlign: "center" }}>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={productName}
                                  className="item-img"
                                />
                              ) : (
                                <div className="item-img-placeholder">
                                  No Image
                                </div>
                              )}
                            </td>

                            <td>
                              <div className="item-title">{productName}</div>
                              {description && (
                                <div className="text-muted-small">
                                  {description}
                                </div>
                              )}
                            </td>

                            <td style={{ textAlign: "center" }}>
                              <span className="status completed">{qty}</span>
                            </td>

                            <td style={{ textAlign: "right", fontWeight: "700" }}>
                              ${price.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-muted-small">
                No item details available for this order.
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                className="primary-btn"
                onClick={() => navigate(`/orders/edit/${id}`)}
              >
                <i className="bi bi-pencil-square"></i> Edit Items
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;