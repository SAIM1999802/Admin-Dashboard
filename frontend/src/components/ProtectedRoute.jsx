// components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");
  let user = null;

  if (savedUser && savedUser !== "undefined") {
    try {
      user = JSON.parse(savedUser);
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }

  // 1. Agar user logged in nahi hai
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Agar logged-in user ka role allowed nahi hai
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Admin ko dashboard aur normal user ko market redirect karein
    return <Navigate to={user.role === "admin" ? "/dashboard" : "/market"} replace />;
  }

  return children;
};

export default ProtectedRoute;