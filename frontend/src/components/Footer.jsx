import React, { useState } from "react";
import "../styles/Footer.css";

// SVG Icons
const TruckIcon = ({ size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 7h11v9H2z" />
    <path d="M13 10h4l3 3v3h-7z" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="16.5" cy="18" r="1.6" />
  </svg>
);

const RefreshIcon = ({ size = 15 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
    <path d="M20 4v4h-4" />
    <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" />
    <path d="M4 20v-4h4" />
  </svg>
);

// Social Media Icons
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.77 5.6c1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const YoutubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const PinterestIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      "All products",
      "New arrivals",
      "Best sellers",
      "Sale",
      "Collections",
      "Gift cards",
    ],
  },
  {
    title: "Customer care",
    links: [
      "Shipping policy",
      "Returns & exchanges",
      "FAQs",
      "Track order",
      "Contact us",
    ],
  },
  {
    title: "About",
    links: ["Our story", "Sustainability", "Careers", "Blog", "Press"],
  },
];

const SOCIAL_ITEMS = [
  { name: "Facebook", icon: FacebookIcon, url: "https://facebook.com" },
  { name: "Instagram", icon: InstagramIcon, url: "https://instagram.com" },
  { name: "X (Twitter)", icon: TwitterIcon, url: "https://x.com" },
  { name: "YouTube", icon: YoutubeIcon, url: "https://youtube.com" },
  { name: "Pinterest", icon: PinterestIcon, url: "https://pinterest.com" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="velure-footer">
      <div className="velure-footer-container">
        <div className="velure-footer-grid">
          {/* Brand Info */}
          <div className="velure-footer-brand">
            <span className="velure-logo">velure</span>
            <p className="velure-brand-desc">
              Considered clothing for everyday life.
              <br />
              Designed to be worn, not just bought.
            </p>
            
            {/* Social Buttons with SVG Icons */}
                <div className="velure-socials">
                  {SOCIAL_ITEMS.map(({ name, icon: Icon, url }) => (
                    <a
                      href={url}
                      key={name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="velure-social-btn"
                      aria-label={name}
                      title={name}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
          </div>

          {/* Navigation Links Columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div className="velure-footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Column */}
          <div className="velure-footer-col velure-newsletter-col">
            <h4>Stay in the loop</h4>
            <p className="velure-newsletter-desc">
              New arrivals, exclusive offers and more.
            </p>

            {subscribed ? (
              <p className="velure-subscribed-msg">
                Thanks — you're subscribed!
              </p>
            ) : (
              <form className="velure-newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button type="submit">Subscribe</button>
              </form>
            )}

            <div className="velure-trust-badges">
              <span>
                <TruckIcon /> Free shipping $75+
              </span>
              <span>
                <RefreshIcon /> 30-day returns
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="velure-footer-bottom">
          <span>© {new Date().getFullYear()} Velure. All rights reserved.</span>
          <div className="velure-footer-legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}