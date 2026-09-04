import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../services/api";
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ name: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await loginApi(formData);
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        const userData = res.data.user || { name: formData.name };
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/dashboard");
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card shadow-sm auth-card">
        <h2 className="auth-title">LOG IN</h2>
        {error && (
          <div className="alert alert-danger py-2 text-center small">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">
              Username
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">
              Password
            </label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            Log In
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Don't have an account?{" "}
          <Link
            to="/Signup"
            className="text-primary text-decoration-none fw-semibold"
          >
            Sign Up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;