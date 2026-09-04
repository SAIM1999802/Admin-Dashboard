import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { createCustomer } from "../services/api";
import "../styles/Orders.css";

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

      // Directly navigate to Create Order Page with filled details
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
      <Navbar />

      <main className="admin-page">
        <div className="page-header">
          <h1 className="page-title">Add New Customer</h1>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary fw-semibold"
              onClick={() => navigate("/orders/add")}
            >
              <i className="bi bi-cart-plus me-1"></i>
              Create Order
            </button>

            <button
              className="btn btn-secondary fw-semibold"
              onClick={() => navigate("/customers")}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back to List
            </button>
          </div>
        </div>

        <div className="table-card p-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
          {message.text && (
            <div
              className={`alert ${
                message.type === "success" ? "alert-success" : "alert-danger"
              } mb-4`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="customerName" className="form-label fw-semibold text-secondary">
                Customer Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="customerName"
                name="name"
                placeholder="Enter customer full name..."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="customerEmail" className="form-label fw-semibold text-secondary">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control"
                id="customerEmail"
                name="email"
                placeholder="enter.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="d-flex justify-content-between align-items-center pt-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
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
      </main>
    </>
  );
};

export default AddCustomer;