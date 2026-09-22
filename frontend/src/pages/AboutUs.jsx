import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AboutUs.css";

export default function AboutUs() {
  return (
    <div className="about-page">
      <Navbar />

      <main className="about-main">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-container">
            <span className="about-eyebrow">Our Story</span>
            <h1 className="about-title">Crafting Quality for Modern Living</h1>
            <p className="about-sub">
              We started with a simple vision: to bring premium, thoughtfully designed everyday essentials directly to your doorstep.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-mission">
          <div className="about-container about-grid">
            <div className="about-content">
              <h2>Driven by Quality & Integrity</h2>
              <p>
                Founded with a passion for excellence, our store combines functional design with top-tier craftsmanship. Whether it's high-performance apparel or essential cookware, every item in our catalog is handpicked and rigorously tested.
              </p>
              <p>
                We believe in sustainable sourcing, transparent pricing, and providing an unparalleled shopping experience from start to finish.
              </p>
            </div>
            <div className="about-image-wrapper">
              <img
                src="/images/Amazon_com_ CAROTE 26PCS Pots and Pans Set Non Stick, Cookware Set Pots and Pans Induction Cook Ware, Nonstick Kitchen Cooking, PFOA Free_ Home & Kitchen.jpg"
                alt="Our Craftsmanship"
                className="about-img"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="about-stats">
          <div className="about-container stats-grid">
            <div className="stat-card">
              <h3>30K+</h3>
              <p>Happy Customers</p>
            </div>
            <div className="stat-card">
              <h3>100%</h3>
              <p>Quality Inspected</p>
            </div>
            <div className="stat-card">
              <h3>24/7</h3>
              <p>Customer Support</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}