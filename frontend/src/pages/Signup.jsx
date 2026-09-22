import   { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupApi } from "../services/api";

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Password Validation Function
  const validatePass = (password) => {
    const oneLc = /(?=.*[a-z])/.test(password);
    const oneUpc = /(?=.*[A-Z])/.test(password);
    const oneNum = /(?=.*\d)/.test(password);
    const oneSpc = /(?=.*[@$!%*?&])/.test(password);

    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!oneLc) return "Add at least one lowercase letter";
    if (!oneUpc) return "Add at least one uppercase letter";
    if (!oneNum) return "Add at least one number";
    if (!oneSpc) return "Add at least one special character (@$!%*?&)";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const passErr = validatePass(formData.password);
    if (passErr) {
      setError(passErr);
      return;
    }

    try {
      const res = await signupApi(formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card shadow-sm auth-card">
        <h2 className="auth-title">SIGN UP</h2>
        {error && (
          <div className="alert alert-danger py-2 text-center small">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">
              Full Name
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold text-secondary small">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            Create Account
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary text-decoration-none fw-semibold"
          >
            Log In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;