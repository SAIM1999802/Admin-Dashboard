import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { updateCredentials } from "../services/api";

const ChangeCredentials = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePass = (password) => {
      
    const oneLc = /(?=.*[a-z])/.test(password);
    const oneUpc = /(?=.*[A-Z])/.test(password);
    const oneNum = /(?=.*\d)/.test(password);
    const oneSpc = /(?=.*[@$!%*?&])/.test(password);
    
    if (!oneNum) return "Add at least one number";
    if (!oneLc) return "Add at least one lowercase letter";
    if (!oneUpc) return "Add at least one uppercase letter";
    if (!oneSpc) return "Add at least one special character (@$!%*?&)";
    if (password.length < 8) return "Password must be at least 8 characters long";

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
  
    const passValidationError = validatePass(formData.newPassword);
    if (passValidationError) {
      setError(passValidationError);
      return;
    }
  
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
  
    try {
      setLoading(true);
  
      const payload = {
        username: formData.username.trim(),
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };
  
      const res = await updateCredentials(payload);
  
      // LocalStorage mein user details update karein taake Navbar ka display name change ho jaye
      const savedUser = localStorage.getItem("user");
      if (savedUser && savedUser !== "undefined") {
        const parsedUser = JSON.parse(savedUser);
        parsedUser.name = formData.username.trim();
        localStorage.setItem("user", JSON.stringify(parsedUser));
      }
  
      setSuccess("Username and password updated successfully!");
      setFormData({
        username: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
  
      // Page redirect karne se pehle page refresh karein ya dashboard navigate karein
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
  
    } catch (err) {
      console.error("Error updating credentials:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update credentials. Check your current password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f4f6f9", minHeight: "100vh" }}>
      <Navbar />

      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div
              className="card border-0 shadow-sm p-4"
              style={{ borderRadius: "12px" }}
            >
              <h2 className="fw-bold fs-3 mb-1">Account Settings</h2>
              <p className="text-muted small mb-4">
                Update your account username and password.
              </p>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success py-2 small" role="alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    New Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter new username"
                    required
                  />
                </div>

  
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <hr className="my-4" />

                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    required
                  />
                </div>


                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    style={{ backgroundColor: "#f0f4f9" }}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>


                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-light w-50 py-2 fw-semibold"
                    style={{ backgroundColor: "#f4f6f9" }}
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary w-50 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Credentials"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChangeCredentials;