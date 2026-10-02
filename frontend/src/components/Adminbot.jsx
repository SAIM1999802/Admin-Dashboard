import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import "../styles/AdminBot.css";

const QUICK_REPLIES = [
  "Show dashboard summary",
  "Low stock products",
  "Recent orders",
];

const nowTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const makeGreeting = () => ({
  id: 1,
  sender: "bot",
  text: "Hi! I am Admin Bot, your AI dashboard assistant. How can I help you?",
  time: nowTime(),
});

const newSessionId = () =>
  `admin_sess_${Math.random().toString(36).substring(2, 9)}`;

// ---------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------

const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Admin Bot user parsing error:", e);
    return null;
  }
};

const isAuthenticated = () => {
  return Boolean(localStorage.getItem("token") || getStoredUser());
};

const getLoggedInUserId = () => {
  if (!isAuthenticated()) return null;

  const user = getStoredUser();
  return Number(user?.id ?? localStorage.getItem("user_id")) || null;
};

const AdminBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([makeGreeting()]);

  const bodyRef = useRef(null);
  const idRef = useRef(2);

  const navigate = useNavigate();

  const adminSessionRef = useRef(null);
  const wasAuthRef = useRef(isAuthenticated());

  // ---------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------

  const getSessionId = () => {
    if (!isAuthenticated()) {
      if (!adminSessionRef.current) {
        adminSessionRef.current = newSessionId();
      }
      return adminSessionRef.current;
    }

    let id = localStorage.getItem("admin_chat_session_id");

    if (!id) {
      id = newSessionId();
      localStorage.setItem("admin_chat_session_id", id);
    }

    return id;
  };

  // ---------------------------------------------------------------
  // Login / Logout detection
  // ---------------------------------------------------------------

  useEffect(() => {
    const handleAuthChange = () => {
      const nowAuth = isAuthenticated();

      if (nowAuth === wasAuthRef.current) return;

      wasAuthRef.current = nowAuth;

      if (!nowAuth) {
        localStorage.removeItem("admin_chat_session_id");
      }

      adminSessionRef.current = null;

      idRef.current = 2;
      setIsOpen(false);
      setInput("");
      setIsTyping(false);
      setMessages([makeGreeting()]);
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  // ---------------------------------------------------------------
  // Auto scroll
  // ---------------------------------------------------------------

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  // ---------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------

  const sendMessage = async (rawText) => {
    const text = rawText.trim();

    if (!text || isTyping) return;

    const userMsg = {
      id: idRef.current++,
      sender: "user",
      text,
      time: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const userId = getLoggedInUserId();

      console.log("Admin Bot -> user_id:", userId);

      const response = await axios.post(
        "http://127.0.0.1:8001/admin-chat",
        {
          session_id: getSessionId(),
          message: text,
          user_id: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      const botReplyText = response.data.reply || "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          sender: "bot",
          text: botReplyText,
          time: nowTime(),
        },
      ]);
    } catch (error) {
      console.error("Admin Bot Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          sender: "bot",
          text: "Sorry, I am having trouble connecting to the Admin AI server right now. Please try again later.",
          time: nowTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="adminbot-window"
          role="dialog"
          aria-label="Admin Bot chat"
        >
          {/* Header */}
          <div className="adminbot-header">
            <div className="adminbot-header-info">
              <div className="adminbot-avatar" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="8" width="16" height="12" rx="3" />
                  <path d="M12 8V4" />
                  <circle cx="12" cy="3" r="1" />
                  <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
                  <path d="M9.5 16.5h5" />
                </svg>
              </div>

              <div className="adminbot-header-text">
                <h3>Admin Bot</h3>
                <span className="adminbot-status">
                  <span className="adminbot-status-dot" />
                  Online
                </span>
              </div>
            </div>

            <button
              className="adminbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Admin Bot"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Chat Body */}
          <div className="adminbot-body" ref={bodyRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`adminbot-chat-row ${
                  m.sender === "user" ? "adminbot-chat-row-user" : ""
                }`}
              >
                {m.sender === "bot" && (
                  <div className="adminbot-avatar-mini" aria-hidden="true">
                    A
                  </div>
                )}

                <div
                  className={`adminbot-chat-bubble ${
                    m.sender === "user"
                      ? "adminbot-user-message"
                      : "adminbot-bot-message"
                  }`}
                >
                  {m.sender === "bot" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <div className="adminbot-table-container">
                            <table className="adminbot-table">{children}</table>
                          </div>
                        ),
                        a: ({ node, href, children, ...props }) => {
                          if (
                            href &&
                            (href.includes("/products/detail/") ||
                              href.startsWith("/product/") ||
                              (href.startsWith("/") && href !== "/"))
                          ) {
                            return (
                              <a
                                href={href}
                                {...props}
                                style={{
                                  color: "#0066cc",
                                  fontWeight: "bold",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(href);
                                  setIsOpen(false);
                                }}
                              >
                                {children}
                              </a>
                            );
                          }

                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            >
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  ) : (
                    <p>{m.text}</p>
                  )}

                  <span className="adminbot-chat-time">{m.time}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="adminbot-chat-row">
                <div className="adminbot-avatar-mini" aria-hidden="true">
                  A
                </div>

                <div className="adminbot-chat-bubble adminbot-bot-message adminbot-typing-bubble">
                  <span className="adminbot-typing-dot" />
                  <span className="adminbot-typing-dot" />
                  <span className="adminbot-typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          <div className="adminbot-quick-replies">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                className="adminbot-quick-chip"
                onClick={() => sendMessage(q)}
                disabled={isTyping}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="adminbot-input-area">
            <input
              type="text"
              placeholder="Ask about sales, orders or inventory..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Type your message"
            />

            <button
              className="adminbot-send"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
                <path d="M3.4 20.4l17.4-7.5c.8-.35.8-1.45 0-1.8L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .72.73 1.2 1.39.91z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="adminbot-button-wrapper">
          <button
            className="adminbot-trigger"
            onClick={() => setIsOpen(true)}
            aria-label="Open Admin Bot"
          >
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>

            <span className="adminbot-pulse" aria-hidden="true" />
          </button>

          <span className="adminbot-tooltip">Admin Bot</span>
        </div>
      )}
    </>
  );
};

export default AdminBot;