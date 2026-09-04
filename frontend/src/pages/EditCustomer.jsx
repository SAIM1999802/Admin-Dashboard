import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCustomerById, updateCustomer } from "../services/api";
import "../styles/EditCustomer.css"; // Separate CSS Import

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
      await updateCustomer(id, formData);
      navigate("/customers");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert(
        error.response?.data?.message || "Failed to update customer"
      );
    } finally {
      setSaving(false);
    }
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

  return (
    <>
      <Navbar />

      <main className="edit-customer-container">
        <div className="edit-customer-wrapper">

          <div className="edit-customer-header">
            <h1 className="edit-customer-title">Edit Customer #{id}</h1>
          </div>

          <div className="edit-customer-card">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
         
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}

                />
              </div>

              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Delivery Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-customer-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/customers")}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default EditCustomer;