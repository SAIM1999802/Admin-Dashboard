import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCustomerById, updateCustomer } from "../services/api";
import "../styles/Customers.css";

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const response = await getCustomerById(id);
        const customer = response.data?.data || response.data;

        setFormData({
          name: customer?.name || "",
          email: customer?.email || "",
          phone: customer?.phone || "",
          address: customer?.address || "",
        });
      } catch (error) {
        console.error("Failed to load customer:", error);
        setMessage({ type: "error", text: "Failed to load customer details." });
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      await updateCustomer(id, formData);
      navigate("/customers");
    } catch (error) {
      console.error("Error updating customer:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update customer",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page d-flex justify-content-center align-items-center flex-column gap-3">
        <div className="custom-spinner"></div>
        <span className="loading-text">Loading customer details...</span>
      </div>
    );
  }

  return (
    <main className="admin-page container">
      <div className="row">
        <div className="col-12">
          <div className="page-header">
            <h1 className="page-title">Edit Customer #{id}</h1>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/customers")}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back to List
            </button>
          </div>

          <div className="form-card mx-auto" style={{ maxWidth: "650px" }}>
            {message.text && (
              <div
                className={`custom-alert ${
                  message.type === "success"
                    ? "custom-alert-success"
                    : "custom-alert-danger"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="custom-form-group">
                <label htmlFor="customerName" className="custom-form-label">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="name"
                  className="custom-form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="custom-form-group">
                <label htmlFor="customerEmail" className="custom-form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="email"
                  className="custom-form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="custom-form-group">
                <label htmlFor="customerPhone" className="custom-form-label">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="customerPhone"
                  name="phone"
                  className="custom-form-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="custom-form-group">
                <label htmlFor="customerAddress" className="custom-form-label">
                  Delivery Address
                </label>
                <textarea
                  id="customerAddress"
                  name="address"
                  className="custom-form-textarea"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/customers")}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EditCustomer;