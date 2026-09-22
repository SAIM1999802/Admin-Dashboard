const orderModel = require("../models/orderModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendOrderEmail } = require("../config/mailer");

// ======================================================
// GET ALL ORDERS
// ======================================================
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getAllOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getOrders:", error);
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// ======================================================
// GET MY ORDERS
// ======================================================
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email || "";

    const orders = await orderModel.getMyOrders(userId, userEmail);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getMyOrders:", error);
    res.status(500).json({
      message: "Failed to fetch order history",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE ORDER (SMTP Integrated)
// ======================================================
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      customerId,
      customerName,
      customerEmail,
      shippingAddress,
      totalAmount,
      paymentMethod,
      items,
      successUrl, // NEW
      cancelUrl, // NEW
    } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
      });
    }

    // Validate customer information
    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    if (!customerEmail || !String(customerEmail).trim()) {
      return res.status(400).json({
        message: "Customer email is required",
      });
    }

    const isCard = paymentMethod === "Card (Stripe)";
    let stripeSessionId = null;
    let checkoutUrl = null;

    if (isCard) {
      const lineItems = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product_name || item.name || "Product",
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: parseInt(item.quantity, 10) || 1,
      }));

      const finalSuccessUrl = successUrl
        ? `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`
        : `${process.env.FRONTEND_URL}/orders/payment-success?session_id={CHECKOUT_SESSION_ID}`;

      const finalCancelUrl =
        cancelUrl || `${process.env.FRONTEND_URL}/orders/add`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: customerEmail.trim(),
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
      });

      stripeSessionId = session.id;
      checkoutUrl = session.url;
    }

    // Save order in Database
    const result = await orderModel.createOrder(
      {
        customerId: customerId || null,
        customerName: String(customerName).trim(),
        customerEmail: String(customerEmail).trim().toLowerCase(),
        shippingAddress: shippingAddress || "",
        totalAmount: Number(totalAmount) || 0,
        paymentMethod: paymentMethod || "Cash on Delivery",
        items,
        stripeSessionId,
      },
      userId,
    );

    const createdOrderId = result.insertId || result.id || "N/A";

    // INSIDE createOrder FUNCTION
    try {
      await sendOrderEmail(customerEmail.trim(), {
        id: createdOrderId,
        customerName: String(customerName).trim(),
        totalAmount: Number(totalAmount) || 0,
        paymentMethod: paymentMethod || "Cash on Delivery",
        shippingAddress: shippingAddress || "",
      });
    } catch (emailError) {
      console.error("Failed to send SMTP email:", emailError.message);
    }

    // Stripe Response
    if (isCard) {
      return res.status(200).json({
        message: "Redirecting to payment",
        checkoutUrl,
        data: result,
      });
    }

    // COD Response
    return res.status(200).json({
      message: "Order created successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Error in createOrder:", error);
    return res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// ======================================================
// GET ORDER BY ID
// ======================================================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID provided.",
      });
    }

    const userId = req.user?.id || null;
    const order = await orderModel.getOrderById(id, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching order details.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE ORDER STATUS
// ======================================================
const updateOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const result = await orderModel.updateOrderStatus(id, status, userId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Order not found or unauthorized",
      });
    }

    res.status(200).json({
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error in updateOrder:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// ======================================================
// EDIT ORDER
// ======================================================
const editOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      customerName,
      customerEmail,
      shippingAddress,
      totalAmount,
      paymentMethod,
      status,
      items,
    } = req.body;

    const result = await orderModel.updateOrder(
      id,
      {
        customerName,
        customerEmail,
        shippingAddress,
        totalAmount,
        paymentMethod,
        status,
        items,
      },
      userId,
    );

    res.status(200).json({
      message: "Order updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in editOrder:", error);
    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// ======================================================
// GET DELETED ORDERS
// ======================================================
const getDeletedOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getDeletedOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getDeletedOrders:", error);
    res.status(500).json({
      message: "Failed to fetch deleted orders",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE ORDER
// ======================================================
const deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await orderModel.softDeleteOrder(id, userId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Order not found or unauthorized",
      });
    }

    res.status(200).json({
      message: "Order soft deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    res.status(500).json({
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  getOrders,
  getMyOrders,
  createOrder,
  updateOrder,
  getOrderById,
  editOrder,
  getDeletedOrders,
  deleteOrder,
};
