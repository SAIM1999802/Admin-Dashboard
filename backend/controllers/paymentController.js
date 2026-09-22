const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const orderModel = require("../models/orderModel");

const verifySession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      await orderModel.markOrderPaidBySessionId(sessionId);
      const order = await orderModel.getOrderBySessionId(sessionId);
      return res.status(200).json({ status: "Paid", orderId: order?.id });
    }

    return res.status(200).json({ status: session.payment_status });
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

module.exports = { verifySession };