const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { verifySession } = require("../controllers/paymentController");

router.post("/verify-session", verifyToken, verifySession);

module.exports = router;