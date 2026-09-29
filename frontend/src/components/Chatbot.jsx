import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import "../styles/Chatbot.css";

const QUICK_REPLIES = ["Mera cart dikhao", "Top recommended products", "Track my order"];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I am Sam Bot, your AI shopping assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const bodyRef = useRef(null);
  const idRef = useRef(2);
  const navigate = useNavigate();

  // Unique session ID generate ya localStorage se retrieve karein
  const sessionId = useRef(
    localStorage.getItem("chat_session_id") || 
    `sess_${Math.random().toString(36).substring(2, 9)}`
  ).current;

  useEffect(() => {
    localStorage.setItem("chat_session_id", sessionId);
  }, [sessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const sendMessage = async (rawText) => {
    const text = rawText.trim();
    if (!text || isTyping) return;

    // 1. User message ko UI screen par instantly show karein
    const userMsg = {
      id: idRef.current++,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // 2. Token retrieve karein (agar user logged in hai)
      const token = localStorage.getItem("token");
      
      // Note: Aapka user_id agar localStorage ya auth state me hai to use yahan pass karein (default: 1)
      const userId = Number(localStorage.getItem("user_id")) || 1;

      // 3. FastAPI Backend API Request (`http://127.0.0.1:8000/chat`)
      const response = await axios.post(
        "http://127.0.0.1:8000/chat",
        { 
          session_id: sessionId,
          message: text,
          user_id: userId 
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      // 4. Sam Bot ka live response add karein (FastAPI response structure: response.data.reply)
      const botReplyText = response.data.reply || "No response received.";

      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          sender: "bot",
          text: botReplyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);

      // Error message handle karein
      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          sender: "bot",
          text: "Sorry, I am having trouble connecting to the AI server right now. Please try again later.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage(input);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="Sam Bot chat">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="8" width="16" height="12" rx="3" />
                  <path d="M12 8V4" />
                  <circle cx="12" cy="3" r="1" />
                  <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
                  <path d="M9.5 16.5h5" />
                </svg>
              </div>

              <div className="chatbot-header-text">
                <h3>Sam Bot</h3>
                <span className="chatbot-status">
                  <span className="status-dot"></span>
                  Online
                </span>
              </div>
            </div>

            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close Sam Bot"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Chat Body */}
          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m) => (
              <div key={m.id} className={`chat-row ${m.sender === "user" ? "chat-row-user" : ""}`}>
                {m.sender === "bot" && <div className="chat-avatar-mini" aria-hidden="true">S</div>}
                <div className={`chat-bubble ${m.sender === "user" ? "user-message" : "bot-message"}`}>
                  {m.sender === "bot" ? (
                    <ReactMarkdown
                      components={{
                        a: ({ node, href, children, ...props }) => {
                          if (
                            href &&
                            (href.startsWith("/products/detail/") ||
                             href.startsWith("/product/") ||
                             href.startsWith("/"))
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
                            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
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
                  <span className="chat-time">{m.time}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-row">
                <div className="chat-avatar-mini" aria-hidden="true">S</div>
                <div className="chat-bubble bot-message typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Replies */}
          <div className="chatbot-quick-replies">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                className="quick-chip"
                onClick={() => sendMessage(q)}
                disabled={isTyping}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chatbot-input-area">
            <input
              type="text"
              placeholder="Ask about products or your cart..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Type your message"
            />
            <button
              className="chatbot-send"
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

      {/* Floating Chatbot Button */}
      {!isOpen && (
        <div className="chatbot-button-wrapper">
          <button
            className="chatbot-trigger"
            onClick={() => setIsOpen(true)}
            aria-label="Open Sam Bot"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
            <span className="chatbot-pulse" aria-hidden="true"></span>
          </button>

          <span className="chatbot-tooltip">Sam Bot</span>
        </div>
      )}
    </>
  );
};

export default Chatbot;