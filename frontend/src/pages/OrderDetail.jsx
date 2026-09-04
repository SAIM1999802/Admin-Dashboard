import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getOrderDetails } from "../services/api";
import "../styles/OrderDetail.css";

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

        console.log("API Full Response:", response);

        const resultData =
          response?.data?.data || response?.data || response;
        setOrder(resultData);
      } catch (error) {
        console.error("Error loading order detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const getStatusBadge = (status) => {
    const statusLower = (status || "pending").toLowerCase();
    switch (statusLower) {
      case "completed":
      case "delivered":
        return "badge-status badge-success";
      case "processing":
      case "shipped":
        return "badge-status badge-info";
      case "cancelled":
      case "deleted":
        return "badge-status badge-danger";
      default:
        return "badge-status badge-warning";
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
      <>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-3 fw-semibold">Loading order details...</span>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="container text-center py-5">
          <h3 className="fw-bold text-secondary">Order Not Found</h3>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/orders")}
          >
            Back to Orders List
          </button>
        </div>
      </>
    );
  }

  const formattedDate = getFormattedDate(order);
  const totalAmount = Number(
    order.total_amount || order.totalAmount || order.amount || 0
  ).toFixed(2);

  const itemsList = Array.isArray(order.items) ? order.items : [];
  return (
    <div className="order-detail-wrapper">
      <Navbar />

      <main className="order-detail-container">
        <div className="detail-header-bar mb-3">
          <button
            className="btn-back-link btn btn-link text-decoration-none p-0"
            onClick={() => navigate("/orders")}
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Orders
          </button>
        </div>

        <div className="order-detail-card">
          <div className="order-card-header d-flex justify-content-between align-items-start mb-4">
            <div>
              <h1 className="order-title">
                Order #{order.order_number || order.id || id}
              </h1>
              <span className="order-date-tag">
                Placed on {formattedDate}
              </span>
            </div>

            <span className={getStatusBadge(order.status)}>
              {order.status ? order.status.toUpperCase() : "PENDING"}
            </span>
          </div>

          <div className="detail-data-list mb-4">
            
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
              <span className="detail-value-price text-success fw-bold">
                ${totalAmount}
              </span>
            </div>

            <div className="detail-data-row">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value fw-semibold text-capitalize">
                {order.payment_method || order.payment_status || "Paid"}
              </span>
            </div>
          </div>

          <div className="order-section-box mb-4">
            <h3 className="section-title fw-bold">Shipping Address</h3>
            <p className="section-text text-muted mb-0">
              {order.shipping_address ||
                order.shippingAddress ||
                order.address ||
                "No shipping address provided."}
            </p>
          </div>

          <div className="order-section-box">
            <h3 className="section-title fw-bold mb-3">Order Items</h3>
            {itemsList.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "80px" }}>Picture</th>
                      <th>Product Details</th>
                      <th className="text-center" style={{ width: "120px" }}>
                        Quantity
                      </th>
                      <th className="text-end" style={{ width: "130px" }}>
                        Unit Price
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
                          style={{ cursor: "pointer" }}
                          className="clickable-row"
                        >
                          <td className="text-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={productName}
                                className="img-thumbnail"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-light text-secondary rounded d-flex align-items-center justify-content-center mx-auto"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  fontSize: "12px",
                                }}
                              >
                                No Image
                              </div>
                            )}
                          </td>

                          <td>
                            <div className="fw-semibold text-primary">
                              {productName}
                            </div>
                            {description && (
                              <small className="text-muted d-block mt-1">
                                {description}
                              </small>
                            )}
                          </td>

                          <td className="text-center">
                            <span className="badge bg-secondary fs-6">
                              {qty}
                            </span>
                          </td>

                          <td className="text-end fw-bold">
                            ${price.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted italic mb-0">
                No item details available for this order.
              </p>
            )}

            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold"
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