import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Blog.css";

const BLOG_POSTS = [
  {
    id: 1,
    title: "How to Choose the Best Non-Stick Cookware for Your Kitchen",
    category: "Kitchen & Living",
    date: "Sep 12, 2026",
    image:
      "/images/Amazon_com_ CAROTE 26PCS Pots and Pans Set Non Stick, Cookware Set Pots and Pans Induction Cook Ware, Nonstick Kitchen Cooking, PFOA Free_ Home & Kitchen.jpg",
    excerpt:
      "A complete guide to PFOA-free coatings, heat distribution, and maintaining your pots and pans for years.",
  },
  {
    id: 2,
    title: "Essential Running Gear to Level Up Your Daily Workout",
    category: "Fashion & Apparel",
    date: "Sep 08, 2026",
    image: "/images/Adidas_Shirt.jpg",
    excerpt:
      "Discover breathable fabrics, ergonomic sneakers, and accessories engineered to boost your training performance.",
  },
  {
    id: 3,
    title: "5 Everyday Accessories Every Modern Wardrobe Needs",
    category: "Lifestyle",
    date: "Aug 29, 2026",
    image: "/images/tumbler.jpg",
    excerpt:
      "Simple, functional, and sleek items that make daily routines effortless and stylish.",
  },
];

export default function Blog() {
  return (
    <div className="blog-page">
      <Navbar />

      <main className="blog-main">
        {/* Header */}
        <section className="blog-hero">
          <div className="blog-container">
            <span className="blog-eyebrow">Journal & Insights</span>
            <h1 className="blog-title">Latest Stories & Guides</h1>
            <p className="blog-sub">
              Tips, buying guides, and inspiration for your daily active lifestyle and home.
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="blog-content">
          <div className="blog-container">
            <div className="blog-grid">
              {BLOG_POSTS.map((post) => (
                <article key={post.id} className="blog-card">
                  <div className="blog-media">
                    <img src={post.image} alt={post.title} className="blog-img" />
                    <span className="blog-category">{post.category}</span>
                  </div>
                  <div className="blog-body">
                    <span className="blog-date">{post.date}</span>
                    <h2 className="blog-card-title">{post.title}</h2>
                    <p className="blog-excerpt">{post.excerpt}</p>
                    <button className="blog-read-more" type="button">
                      Read Article &rarr;
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}