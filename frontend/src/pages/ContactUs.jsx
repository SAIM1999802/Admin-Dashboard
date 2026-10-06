import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/ContactUs.css";

const Icon = ({ children, size = 18, strokeWidth = 1.8, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const MailIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Icon>
);

const PhoneIcon = (p) => (
  <Icon {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
);

const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Icon>
);

const MapPinIcon = (p) => (
  <Icon {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.77 5.6c1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "Most orders arrive within 3–5 business days. You'll get a tracking link as soon as it ships.",
  },
  {
    q: "What's your return policy?",
    a: "30 days, no questions asked. If it didn't hold up or wasn't right for you, send it back for a full refund.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship within Pakistan only, with plans to expand — join the newsletter for updates.",
  },
  {
    q: "How do I track my order?",
    a: "Check your email for a tracking link, or log in and view it under 'My Orders'.",
  },
];

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: "",
  });
  const [openFaq, setOpenFaq] = useState(null);

  // Auto-fill logged in user details
  useEffect(() => {
    // LocalStorage se logged-in user data fetch karna (Apne auth structure ke mutabiq adjust karein)
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (savedUser?.name || savedUser?.email) {
      setForm((f) => ({
        ...f,
        name: savedUser.name || savedUser.fullName || "",
        email: savedUser.email || "",
      }));
    }
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: "" });

    const templateParams = {
      from_name: form.name,
      from_email: form.email,
      message: form.message,
    };

    try {
      const res = await emailjs.send(
        "service_n49f37k",
        "template_xm0s9ui",
        templateParams,
        "pErab04wMLDK9w2hI",
      );

      console.log("SUCCESS!", res.status, res.text);
      setStatus({ loading: false, success: true, error: "" });

      // Reset form but retain logged-in user details
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setForm({
        name: savedUser.name || savedUser.fullName || "",
        email: savedUser.email || "",
        message: "",
      });
    } catch (err) {
      console.error("EmailJS Failed Error:", err);
      setStatus({
        loading: false,
        success: false,
        error: err?.text || "Message could not be sent. Check console.",
      });
    }
  };

  const toggleFaq = (i) => {
    setOpenFaq((prev) => (prev === i ? null : i));
  };

  return (
    <div className="velure-contact-page">
      <Navbar />

      <main className="velure-contact-main">
        {/* Breadcrumb */}
        <div className="velure-container">
          <nav className="velure-breadcrumb">
            <a href="/">Home</a> <span>/</span> <span>Contact Us</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="velure-contact-hero">
          <div className="velure-container">
            <span className="velure-eyebrow">Get in touch</span>
            <h1 className="velure-title">Contact us</h1>
            <p className="velure-lead">
              Questions about an order, a product, or anything else — we usually
              reply within a day.
            </p>
          </div>
        </section>

        {/* Form + Info Grid */}
        <section className="velure-container velure-contact-layout">
          <motion.form
            className="velure-contact-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {status.success && (
              <div className="velure-contact-success">
                Thanks — we'll get back to you shortly.
              </div>
            )}

            {status.error && (
              <div
                className="velure-contact-error"
                style={{ color: "red", marginBottom: "1rem" }}
              >
                {status.error}
              </div>
            )}

            <div className="velure-form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="velure-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="velure-form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={form.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                required
              />
            </div>

            <motion.button
              type="submit"
              className="velure-btn-submit"
              disabled={status.loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {status.loading ? "Sending..." : "Send message"}
            </motion.button>
          </motion.form>

          {/* Info Card Sidebar */}
          <aside className="velure-contact-card">
            <h2>Reach out directly</h2>

            <div className="velure-info-list">
              <div className="velure-info-item">
                <span className="velure-info-icon">
                  <MailIcon />
                </span>
                <div>
                  <h4>Email</h4>
                  <p>abdullahsaeedhayday@gmail.com</p>
                </div>
              </div>

              <div className="velure-info-item">
                <span className="velure-info-icon">
                  <PhoneIcon />
                </span>
                <div>
                  <h4>Phone</h4>
                  <p>+92 3241050124</p>
                </div>
              </div>

              <div className="velure-info-item">
                <span className="velure-info-icon">
                  <ClockIcon />
                </span>
                <div>
                  <h4>Hours</h4>
                  <p>Mon–Fri, 9am–6pm</p>
                </div>
              </div>

              <div className="velure-info-item">
                <span className="velure-info-icon">
                  <MapPinIcon />
                </span>
                <div>
                  <h4>Address</h4>
                  <p>Velure HQ, Karachi, Pakistan</p>
                </div>
              </div>
            </div>

            <hr className="velure-card-divider" />

            <div className="velure-socials-wrapper">
              <h4>Follow us</h4>
              <div className="velure-socials">
                <span className="velure-info-icon">
                  <FacebookIcon />
                </span>
                <span className="velure-info-icon">
                  <TwitterIcon />
                </span>
                <span className="velure-info-icon">
                  <InstagramIcon />
                </span>
              </div>
            </div>
          </aside>
        </section>

        {/* Map / Location */}
        <section className="velure-container velure-map-section">
          <div className="velure-map-frame">
            <iframe
              title="Velure Location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=67.0011%2C24.8407%2C67.0611%2C24.8807&layer=mapnik&marker=24.8607%2C67.0311"
              loading="lazy"
            />
          </div>
          <div className="velure-map-caption">
            <h3>Velure Flagship HQ</h3>
            <p>Shahrah-e-Faisal, Karachi, Sindh, Pakistan</p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="velure-container velure-faq-section">
          <div className="velure-faq-header">
            <span className="velure-eyebrow">Before you reach out</span>
            <h2>Frequently asked questions</h2>
          </div>

          <div className="velure-faq-list">
            {FAQS.map((item, i) => (
              <div
                key={item.q}
                className={`velure-faq-item ${openFaq === i ? "is-open" : ""}`}
                onClick={() => toggleFaq(i)}
              >
                <div className="velure-faq-question">
                  <span>{item.q}</span>
                  <span className="velure-faq-icon">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </div>
                {openFaq === i && <p className="velure-faq-answer">{item.a}</p>}
              </div>
            ))}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}
