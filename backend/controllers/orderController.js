const orderModel = require("../models/orderModel");

const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getAllOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getOrders:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      customerName,
      customerEmail,
      shippingAddress,
      totalAmount,
      paymentMethod,
      items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Order must contain at least one item" });
    }

    const result = await orderModel.createOrder(
      {
        customerName,
        customerEmail,
        shippingAddress,
        totalAmount,
        paymentMethod,
        items,
      },
      userId
    );
    res.status(200).json({ message: "Order created successfully!", data: result });
  } catch (e) {
    console.error("Error in createOrder:", e);
    res
      .status(500)
      .json({ message: "Failed to create order", error: e.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID provided.",
      });
    }

    const order = await orderModel.getOrderById(id);

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
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const result = await orderModel.updateOrderStatus(id, status, userId);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Order not found or unauthorized" });
    }
    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error in updateOrder:", error);
    res
      .status(500)
      .json({ message: "Failed to update order status", error: error.message });
  }
};

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
      userId
    );

    res.status(200).json({ message: "Order updated successfully", data: result });
  } catch (error) {
    console.error("Error in editOrder:", error);
    res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
};

const getDeletedOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getDeletedOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getDeletedOrders:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch deleted orders", error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await orderModel.softDeleteOrder(id, userId);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Order not found or unauthorized" });
    }

    res.status(200).json({ message: "Order soft deleted successfully" });
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    res
      .status(500)
      .json({ message: "Failed to delete order", error: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrder,
  getOrderById,
  editOrder,
  getDeletedOrders,
  deleteOrder,
};