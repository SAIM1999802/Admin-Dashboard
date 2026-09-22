import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomerDetails } from "../services/api";
import "../styles/Customers.css";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const data = await getCustomerDetails(id);
        console.log("Customer Received:", data);
        setCustomer(data);
      } catch (error) {
        console.error("Error loading customer detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const handleEditClick = () => {
    const customerId = customer?.id || id;
    navigate(`/customers/edit/${customerId}`);
  };

  const handleOrderRowClick = (orderId) => {
    if (orderId) {
      navigate(`/orders/details/${orderId}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 flex-column gap-3">
        <div className="custom-spinner"></div>
        <span style={{ fontWeight: 600, color: "#073b34" }}>
          Loading customer details...
        </span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container text-center py-5">
        <h3 style={{ color: "#073b34", fontWeight: 700 }}>
          Customer Not Found
        </h3>
        <button
          className="primary-btn mt-3"
          onClick={() => navigate("/customers")}
        >
          Back to Customers List
        </button>
      </div>
    );
  }

  const totalOrders = Number(customer.orders ?? customer.total_orders ?? 0);

  return (
    <div className="customer-detail-wrapper">
      <main className="container py-4">
        <div className="row">
          <div className="col-12 col-md-10 mx-auto">
            <div className="detail-header-bar">
              <button
                type="button"
                className="btn-back-link"
                onClick={() => navigate("/customers")}
              >
                <i className="bi bi-arrow-left"></i> Back to Customers
              </button>

              <button
                type="button"
                className="btn-action-edit"
                onClick={handleEditClick}
              >
                <i className="bi bi-pencil-square me-1"></i> Edit Customer
              </button>
            </div>

            <div className="customer-detail-card">
              <div className="customer-card-header">
                <h1 className="customer-title">{customer.name}</h1>
                <span className="customer-id-tag">
                  {customer.custom_id || `Customer ID: #${customer.id || id}`}
                </span>
              </div>

              <div className="detail-data-list">
                <div className="detail-data-row">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">
                    {customer.email || "Not Provided"}
                  </span>
                </div>

                <div className="detail-data-row">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">
                    {customer.phone ? customer.phone : "Not Provided"}
                  </span>
                </div>

                <div className="detail-data-row">
                  <span className="detail-label">Total Orders Placed</span>
                  <span className="detail-value-price">
                    {totalOrders} {totalOrders === 1 ? "Order" : "Orders"}
                  </span>
                </div>
              </div>

              <div className="customer-address-box">
                <h3 className="address-title">Delivery Address</h3>
                <p className="address-text">
                  {customer.address && customer.address.trim() !== ""
                    ? customer.address
                    : "No address provided for this customer."}
                </p>
              </div>

              {/* ORDER HISTORY TABLE WITH CLICKABLE ROWS */}
              <div className="order-items-section mt-4">
                <h3 className="order-items-main-title">Order History</h3>

                <div className="order-items-card-wrapper">
                  <div className="table-responsive">
                    <table className="table custom-order-items-table align-middle m-0">
                      <thead>
                        <tr>
                          <th style={{ width: "120px" }}>ORDER ID</th>
                          <th>DATE</th>
                          <th>PAYMENT METHOD</th>
                          <th
                            className="text-center"
                            style={{ width: "140px" }}
                          >
                            STATUS
                          </th>
                          <th className="text-end" style={{ width: "160px" }}>
                            TOTAL AMOUNT
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.orderHistory &&
                        customer.orderHistory.length > 0 ? (
                          customer.orderHistory.map((order, index) => {
                            const orderId = order.id || order._id || index;
                            const rawDate =
                              order.createdAt || order.created_at || order.date;
                            const paymentMethod =
                              order.paymentMethod ||
                              order.payment_method ||
                              "N/A";
                            const orderStatus = order.status || "Completed";
                            const statusLower =
                              String(orderStatus).toLowerCase();
                            const amount = Number(
                              order.totalAmount ||
                                order.total_amount ||
                                order.amount ||
                                0,
                            );

                            return (
                              <tr
                                key={orderId}
                                onClick={() => handleOrderRowClick(orderId)}
                                className="clickable-order-row"
                                style={{ cursor: "pointer" }}
                              >
                                <td>
                                  <strong className="order-id-badge">
                                    #{orderId}
                                  </strong>
                                </td>
                                <td>
                                  <span className="order-date-text">
                                    {rawDate
                                      ? new Date(rawDate).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </td>
                                <td>
                                  <span className="payment-method-text">
                                    {paymentMethod}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span
                                    className={`status-pill ${
                                      statusLower === "completed" ||
                                      statusLower === "paid"
                                        ? "status-completed"
                                        : statusLower === "pending"
                                          ? "status-pending"
                                          : "status-secondary"
                                    }`}
                                  >
                                    {orderStatus}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <strong className="order-unit-price">
                                    ${amount.toFixed(2)}
                                  </strong>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center py-4 text-muted"
                            >
                              No orders placed yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDetail;
