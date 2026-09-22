import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPaymentSession } from "../services/api";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("error");
      return;
    }

    verifyPaymentSession(sessionId)
      .then((res) => {
        const paymentStatus = String(res?.data?.status || "").toLowerCase();
        
        // "Paid" ki jagah "completed" par verify check karega
        if (paymentStatus === "completed") {
          sessionStorage.removeItem("createOrderDraft");
          setStatus("success");
          setTimeout(() => navigate("/orders"), 3000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [searchParams, navigate]);

  if (status === "verifying")
    return <p className="text-center mt-5">Verifying payment...</p>;
  if (status === "error")
    return (
      <p className="text-center mt-5 text-danger">
        Could not verify payment. Contact support.
      </p>
    );

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ height: "60vh" }}
    >
      <h2 className="fw-bold text-success mb-2">Payment Successful 🎉</h2>
      <p className="text-muted">Redirecting you to your orders...</p>
    </div>
  );
};

export default PaymentSuccess;