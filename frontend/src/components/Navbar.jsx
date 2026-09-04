import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser && savedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("User parsing error:", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `navbar-link ${isActive ? "active" : ""}`;

  return (
    <nav className="admin-navbar">
      <div className="navbar-left">

        <div
          className="navbar-logo"
          onClick={() => navigate("/dashboard")}
        >
          <div className="logo-icon">
            <i className="bi bi-bag-fill"></i>
          </div>

          <span>LOGO</span>
        </div>

        <div className="navbar-links">

          <NavLink to="/dashboard" className={navLinkClass}>
            <i className="bi bi-grid-fill"></i>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/orders" className={navLinkClass}>
            <i className="bi bi-bag-fill"></i>
            <span>Orders</span>
          </NavLink>

          <NavLink to="/customers" className={navLinkClass}>
            <i className="bi bi-people-fill"></i>
            <span>Customers</span>
          </NavLink>

          <NavLink to="/products" className={navLinkClass}>
            <i className="bi bi-box-fill"></i>
            <span>Products</span>
          </NavLink>

        </div>
      </div>

      <div className="admin-profile" ref={dropdownRef}>

        <button
          className="admin-button"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className="bi bi-person-circle"></i>

          <span>{user?.name || "Admin"}</span>

          <i
            className={`bi ${
              showDropdown
                ? "bi-chevron-up"
                : "bi-chevron-down"
            }`}
          ></i>
        </button>

        {showDropdown && (
          <div className="admin-dropdown">

            <button
              onClick={() => {
                setShowDropdown(false);
                navigate("/ChangeCredentials");
              }}
            >
              <i className="bi bi-gear"></i>
              Settings
            </button>

            <div className="dropdown-divider"></div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </button>

          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;