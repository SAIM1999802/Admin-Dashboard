import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/OrderCompleted.css";

export default function OrderCompleted() {
  const navigate = useNavigate();
  const location = useLocation();

  const [seconds, setSeconds] = useState(15);

  const orderId = location.state?.orderId;
  const customerName = location.state?.customerName;
  const totalAmount = location.state?.totalAmount;

  // 1. Countdown Timer Effect
  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000); // Note: 15 seconds countdown ke liye interval 1000ms (1 second) honi chahiye

    return () => clearInterval(timer);
  }, [seconds]);

  // 2. Navigation Effect (Runs safely when seconds reaches 0)
  useEffect(() => {
    if (seconds === 0) {
      navigate("/market", { replace: true });
    }
  }, [seconds, navigate]);

  return (
    <>
      <Navbar />

      <div className="order-completed-page">
        <div className="order-completed-card">
          <div className="success-icon">✓</div>

          <h1>Order Completed!</h1>

          <p className="success-message">
            Thank you for your order, {customerName || "Customer"}.
          </p>

          {orderId && (
            <p className="order-number">Order #{orderId}</p>
          )}

          {totalAmount !== undefined && (
            <p className="order-total">
              Total: ${Number(totalAmount).toFixed(2)}
            </p>
          )}

          <div className="redirect-message">
            <p>You will be redirected to the Market in</p>

            <div className="countdown">{seconds}</div>

            <p>seconds</p>
          </div>

          <button
            className="continue-market-btn"
            onClick={() => navigate("/market")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </>
  );
}