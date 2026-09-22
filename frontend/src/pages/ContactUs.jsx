import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"
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
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact form submitted:", form);
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
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
            {submitted && (
              <div className="velure-contact-success">
                Thanks — we'll get back to you shortly.
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Send message
            </motion.button>
          </motion.form>

          {/* Info Card Sidebar */}
          <aside className="velure-contact-card">
            <h2>Reach out directly</h2>
            
            <div className="velure-info-list">
              <div className="velure-info-item">
                <span className="velure-info-icon"><MailIcon /></span>
                <div>
                  <h4>Email</h4>
                  <p>abdullahsaeedhayday@gmail.com</p>
                </div>
              </div>

              <div className="velure-info-item">
                <span className="velure-info-icon"><PhoneIcon /></span>
                <div>
                  <h4>Phone</h4>
                  <p>+92 3241050124</p>
                </div>
              </div>

              <div className="velure-info-item">
                <span className="velure-info-icon"><ClockIcon /></span>
                <div>
                  <h4>Hours</h4>
                  <p>Mon–Fri, 9am–6pm</p>
                </div>
              </div>

              <div className="velure-info-item">
                <span className="velure-info-icon"><MapPinIcon /></span>
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
                <a href="#" aria-label="Facebook">Fb</a>
                <a href="#" aria-label="Twitter">Tw</a>
                <a href="#" aria-label="Instagram">Ig</a>
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
                  <span className="velure-faq-icon">{openFaq === i ? "−" : "+"}</span>
                </div>
                {openFaq === i && <p className="velure-faq-answer">{item.a}</p>}
              </div>
            ))}
          </div>
        </section>
        <Footer/>
      </main>
            
    </div>
  );
}