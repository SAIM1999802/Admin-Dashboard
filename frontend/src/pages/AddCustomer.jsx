import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createCustomer } from "../services/api";
import "../styles/Customers.css";

const AddCustomer = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      if (typeof createCustomer === "function") {
        await createCustomer(formData);
      }

      setMessage({ type: "success", text: "Customer added successfully!" });

      setTimeout(() => {
        navigate("/orders/add", {
          state: { newCustomer: { name: formData.name, email: formData.email } },
        });
      }, 1000);
    } catch (error) {
      console.error("Error adding customer:", error);
      setMessage({
        type: "error",
        text: "Failed to add customer. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>


      <main className="admin-page container">
        <div className="row">
          <div className="col-12">
            <div className="page-header">
              <h1 className="page-title">Add New Customer</h1>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn-outline-primary"
                  onClick={() => navigate("/orders/add")}
                >
                  <i className="bi bi-cart-plus me-1"></i>
                  Create Order
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/customers")}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to List
                </button>
              </div>
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
                    Customer Name <span style={{ color: "#d93838" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="custom-form-input"
                    id="customerName"
                    name="name"
                    placeholder="Enter customer full name..."
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="custom-form-group">
                  <label htmlFor="customerEmail" className="custom-form-label">
                    Email Address <span style={{ color: "#d93838" }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="custom-form-input"
                    id="customerEmail"
                    name="email"
                    placeholder="enter.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate("/customers")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AddCustomer;