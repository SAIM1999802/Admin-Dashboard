import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
    setUser(null);
    setShowDropdown(false);
    
    // Smooth redirect to homepage
    navigate("/homepage", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `velure-nav-item ${isActive ? "active" : ""}`;

  const isUserRole = !user || user?.role === "user";

  return (
    <header className="velure-header">
      <nav className="velure-navbar">
        {/* Brand Logo Left */}
        <div
          className="velure-logo"
          onClick={() =>
            navigate(user?.role === "admin" ? "/dashboard" : "/homepage")
          }
        >
          velure
        </div>


        <div className="velure-nav-pill">
          {isUserRole ? (
            <>

              <NavLink to="/homepage" className={navLinkClass}>
                <span className="dot"></span> Home
              </NavLink>

        
              <NavLink to="/market" className={navLinkClass}>
                <span className="dot"></span> Market
              </NavLink>
              <NavLink to="/contactus" className={navLinkClass}>
                <span className="dot"></span> Contact Us
              </NavLink>
              <NavLink to="/aboutus" className={navLinkClass}>
                <span className="dot"></span> About Us
              </NavLink>
              <NavLink to="/blog" className={navLinkClass}>
                <span className="dot"></span> Blog
              </NavLink>

              {/* My Orders Link - Logged-in users only */}
              {user && (
                <NavLink to="/my-orders" className={navLinkClass}>
                  <span className="dot"></span> My Orders
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                <span className="dot"></span> Dashboard
              </NavLink>

              <NavLink to="/orders" className={navLinkClass}>
                <span className="dot"></span> Orders
              </NavLink>

              <NavLink to="/customers" className={navLinkClass}>
                <span className="dot"></span> Customers
              </NavLink>

              <NavLink to="/products" className={navLinkClass}>
                <span className="dot"></span> Products
              </NavLink>

              <NavLink to="/category" className={navLinkClass}>
                <span className="dot"></span> Categories
              </NavLink>
            </>
          )}
        </div>

        <div className="velure-right-actions">
          <button
            className="icon-btn"
            title="Cart"
            onClick={() => navigate("/checkout")}
          >
            <i className="bi bi-bag"></i>
          </button>

          {/* Profile / Account Dropdown */}
          <div className="velure-profile-wrapper" ref={dropdownRef}>
            <button
              className="velure-user-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>{user ? user?.name || "Account" : "Login / Signup"}</span>
              <i
                className={`bi ${
                  showDropdown ? "bi-chevron-up" : "bi-chevron-down"
                }`}
              ></i>
            </button>

            {showDropdown && (
              <div className="velure-dropdown-menu">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/ChangeCredentials");
                      }}
                    >
                      <i className="bi bi-gear me-2"></i>
                      Settings
                    </button>

                    <div className="velure-dropdown-divider"></div>

                    <button className="logout-btn" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/login");
                      }}
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login
                    </button>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/signup");
                      }}
                    >
                      <i className="bi bi-person-plus me-2"></i>
                      Signup
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;