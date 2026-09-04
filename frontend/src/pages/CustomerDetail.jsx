import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCustomerDetails } from "../services/api";
import "../styles/CustomerDetail.css";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await getCustomerDetails(id);
        let data = response?.data || response;
        if (Array.isArray(data)) {
          data = data[0] || null;
        }
        setCustomer(data);
      } catch (error) {
        console.error("Error loading customer detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const handleEditClick = () => {
    const customerId = customer?.id || id;
    navigate(`/customers/edit/${customerId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-3 fw-semibold">Loading customer details...</span>
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <Navbar />
        <div className="container text-center py-5">
          <h3 className="fw-bold text-secondary">Customer Not Found</h3>
          <button 
            className="btn btn-primary mt-3" 
            onClick={() => navigate("/customers")}
          >
            Back to Customers List
          </button>
        </div>
      </>
    );
  }

  const totalOrders = Number(customer.orders || customer.total_orders || customer.ordersCount || 0);

  return (
    <div className="customer-detail-wrapper">
      <Navbar />

      <main className="customer-detail-container">
        <div className="detail-header-bar">
          <button
            className="btn-back-link"
            onClick={() => navigate("/customers")}
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Customers
          </button>

          <button
            className="btn btn-warning d-flex align-items-center gap-2 fw-semibold px-3 py-2"
            onClick={handleEditClick}
          >
            <i className="bi bi-pencil-square"></i>
            <span>Edit Customer</span>
          </button>
        </div>

 
        <div className="customer-detail-card">
  
          <div className="customer-card-header">
            <div>
              <h1 className="customer-title">{customer.name}</h1>
              <span className="customer-id-tag">
                Customer ID: #{customer.id || id}
              </span>
            </div>
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
              <span className="detail-value-price text-primary fw-bold">
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
        </div>
      </main>
    </div>
  );
};

export default CustomerDetail;