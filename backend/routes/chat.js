const express = require("express");
const router = express.Router();
const axios = require("axios");
const verifyToken = require("../middleware/authMiddleware"); // Check karein aapke verifyToken middleware ka sahi relative path yahi hai

// POST /api/chat
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user ? req.user.id || req.user.userId : null;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    // FastAPI Chatbot Service ko correct snake_case keys ke sath request proxy karna
    const pythonResponse = await axios.post("http://127.0.0.1:8000/chat", {
      message: message,
      user_id: userId,
      session_id: sessionId || `session_${userId || 'guest'}`, // Fallback session ID
    });

    // FastAPI se "reply" aa raha hai, usko "response" key mein map kar rahe hain
    const botReply = pythonResponse.data.reply || pythonResponse.data.response;

    return res.json({ response: botReply });
  } catch (error) {
    if (error.response) {
      console.error(
        "Python FastAPI Error Response:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        "No Response from Python Server (Is FastAPI Running?):",
        error.message
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
