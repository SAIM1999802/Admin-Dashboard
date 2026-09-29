const express = require("express");
const router = express.Router();
const axios = require("axios");
const verifyToken = require("../middleware/authMiddleware"); // Check karein aapke verifyToken middleware ka sahi relative path yahi hai

// POST /api/chat
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    // VerifyToken middleware se attached user object se user ID nikalna
    const userId = req.user ? req.user.id || req.user.userId : null;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    // Python FastAPI Chatbot Service ko request proxy karna
    const pythonResponse = await axios.post("http://127.0.0.1:8000/chat", {
      message: message,
      userId: userId,
    });

    return res.json({ response: pythonResponse.data.response });
  } catch (error) {
    // Console par detailed error log check karein
    if (error.response) {
      console.error(
        "Python FastAPI Error Response:",
        error.response.status,
        error.response.data,
      );
    } else if (error.request) {
      console.error(
        "No Response from Python Server (Is FastAPI Running?):",
        error.message,
      );
    } else {
      console.error("Express Internal Error:", error.message);
    }
    return res.status(500).json({
      error: "Failed to process chat message.",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
