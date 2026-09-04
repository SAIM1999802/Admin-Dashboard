const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  getOrders,
  getDeletedOrders,
  deleteOrder,
  createOrder,
  updateOrder,
  getOrderById,
  editOrder,
} = require("../controllers/orderController");

router.use(verifyToken);

router.get("/", getOrders);
router.get("/deleted", getDeletedOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id/status", updateOrder);
router.put("/:id", editOrder);
router.delete("/:id", deleteOrder);

module.exports = router;