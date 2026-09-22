import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { getProducts } from "../services/api";
import "../styles/Homepage.css";

const Icon = ({ children, size = 20, strokeWidth = 1.8, className = "" }) => (
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

const BagIcon = (p) => (
  <Icon {...p}>
    <path d="M6 8h12l-1 12H7L6 8z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Icon>
);
const TruckIcon = (p) => (
  <Icon {...p}>
    <path d="M2 7h11v9H2z" />
    <path d="M13 10h4l3 3v3h-7z" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="16.5" cy="18" r="1.6" />
  </Icon>
);
const ShieldIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" />
  </Icon>
);
const RefreshIcon = (p) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
    <path d="M20 4v4h-4" />
    <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" />
    <path d="M4 20v-4h4" />
  </Icon>
);
const HeadsetIcon = (p) => (
  <Icon {...p}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
    <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
  </Icon>
);
const MailIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Icon>
);
const GemIcon = (p) => (
  <Icon {...p}>
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M2 9h20" />
    <path d="M9 3l3 6-3 12" />
    <path d="M15 3l-3 6 3 12" />
  </Icon>
);
const GiftIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <rect x="5" y="12" width="14" height="9" rx="1" />
    <path d="M12 8v13" />
    <path d="M12 8c-1.6 0-3-1-3-2.5S10.4 3 12 4.5C12 3 13.4 2 15 3.5S13.6 8 12 8z" />
  </Icon>
);
const ChevronRightIcon = (p) => (
  <Icon {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);

const StarIcon = ({ filled, size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden="true"
  >
    <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.8 1.5 6.9L12 17.7 5.9 21.3l1.5-6.9-5.2-4.8 6.9-.7L12 2.5z" />
  </svg>
);

const Ph = ({ src, alt, className = "" }) => {
  if (src)
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  return <div className={`hp-ph ${className}`} role="img" aria-label={alt} />;
};

const TRUST_FEATURES = [
  {
    icon: GemIcon,
    title: "Premium quality",
    text: "Every piece checked by hand before it ships.",
  },
  {
    icon: TruckIcon,
    title: "Fast, free shipping",
    text: "On all orders over $75, no exceptions.",
  },
  {
    icon: HeadsetIcon,
    title: "Here when you need us",
    text: "Real people, seven days a week.",
  },
  {
    icon: ShieldIcon,
    title: "Secure checkout",
    text: "Your payment details stay encrypted.",
  },
];

const renderStars = (rating) => {
  const rounded = Math.round(rating || 5);
  return Array.from({ length: 5 }).map((_, i) => (
    <StarIcon key={i} filled={i < rounded} />
  ));
};

const HERO_SLIDES = [
  {
    eyebrow: "Fashion & Apparel",
    titleLine1: "Everyday Style &",
    titleLine2: "Performance Wear",
    sub: "Premium activewear, footwear, and classic accessories made to last.",
    flag: "Up to 40% off",
    mainImage: "/images/Adidas_Shirt.jpg",
    mainAlt: "adidas Performance Laufshirt ADIZERO ESSENTIALS RUNNING",
    accentImage: "/images/Nike Running Shoes.jpg",
    accentAlt: "Detail shot",
  },
  {
    eyebrow: "Kitchen & Cookware",
    titleLine1: "Non-Stick Cookware &",
    titleLine2: "Kitchen Essentials",
    sub: "Immerse yourself in effortless cooking with premium PFOA-free cookware sets.",
    flag: "Special Deals",
    mainImage:
      "/images/Amazon_com_ CAROTE 26PCS Pots and Pans Set Non Stick, Cookware Set Pots and Pans Induction Cook Ware, Nonstick Kitchen Cooking, PFOA Free_ Home & Kitchen.jpg",
    mainAlt: "CAROTE 26PCS Pots and Pans Set Non Stick",
    accentImage: "/images/tumbler.jpg",
    accentAlt: "Kitchen accessory",
  },
];

const SLIDE_INTERVAL_MS = 4500;

const heroCopyStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const copyItemVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -14, transition: { duration: 0.3 } },
};

const heroVisualStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const mainImgVariant = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 1.04, transition: { duration: 0.35 } },
};

const accentImgVariant = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
};

const flagVariant = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 18 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.25 } },
};

export default function HomePage({ cart = [], setCart, updateCartCount }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Cart Drawer & Toast State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Helper Functions
  const getUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("User parsing error", e);
      return null;
    }
  };

  const isAuthenticated = () => {
    return Boolean(localStorage.getItem("token") || getUser());
  };

  const getCartKey = () => {
    const user = getUser();
    const userId = user?.id || user?._id || user?.email || "guest";
    return `cart_${userId}`;
  };

  const loadUserCart = () => {
    if (isAuthenticated()) {
      const key = getCartKey();
      const savedCart = localStorage.getItem(key);
      if (savedCart && setCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          setCart([]);
        }
      } else if (setCart) {
        setCart([]);
      }
    } else if (setCart) {
      setCart([]);
    }
  };

  useEffect(() => {
    loadUserCart();
    fetchFeaturedProducts();

    const handleStorageChange = () => {
      loadUserCart();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleStorageChange);
    };
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      const rawData = response?.data ? response.data : response;
      const productList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.products)
        ? rawData.products
        : [];

      setProducts(productList.slice(0, 6));
    } catch (error) {
      console.error("Error fetching homepage products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const slide = HERO_SLIDES[activeSlide];

  const triggerToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  const persistCart = (updatedCart) => {
    if (setCart) setCart(updatedCart);
    if (isAuthenticated()) {
      const key = getCartKey();
      localStorage.setItem(key, JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const handleAddToCart = (product, e) => {
    if (e) e.stopPropagation();

    if (!isAuthenticated()) {
      triggerToast("Please login or signup first", "danger");
      return;
    }

    const currentStock = Number(product.stock ?? 0);
    const productId = product.id || product._id;

    const existingCartItem = cart.find((item) => (item.id || item._id) === productId);
    const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;

    if (currentStock <= 0 || currentCartQty >= currentStock) {
      triggerToast("Item is Out of Stock!", "danger");
      return;
    }

    let updatedCart = [];
    let itemExists = false;

    for (let i = 0; i < cart.length; i++) {
      const itemId = cart[i].id || cart[i]._id;
      if (itemId === productId) {
        updatedCart.push({ ...cart[i], quantity: cart[i].quantity + 1 });
        itemExists = true;
      } else {
        updatedCart.push(cart[i]);
      }
    }

    if (!itemExists) {
      updatedCart.push({ ...product, id: productId, quantity: 1 });
    }

    persistCart(updatedCart);
    triggerToast("Successfully added to cart", "success");
    setIsDrawerOpen(true);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <div className="hp-page">
      <Navbar />


      <div
        className={`velure-toast ${showToast ? "show" : ""} ${
          toastType === "danger" ? "danger" : ""
        }`}
      >
        <i
          className={`bi ${
            toastType === "danger"
              ? "bi-exclamation-circle-fill"
              : "bi-check-circle-fill"
          }`}
        ></i>
        <span>{toastMessage}</span>
        <button className="toast-close" onClick={() => setShowToast(false)}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <CartDrawer
        cart={cart}
        products={products}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        persistCart={persistCart}
        triggerToast={triggerToast}
        updateCartCount={updateCartCount}
      />

      <main id="top">
    
        <section className="hp-hero">
          <div className="hp-container hp-hero-grid">
            <div className="hp-hero-copy">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  variants={heroCopyStagger}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.span className="hp-eyebrow" variants={copyItemVariant}>
                    {slide.eyebrow}
                  </motion.span>
                  <motion.h1 className="hp-h1" variants={copyItemVariant}>
                    {slide.titleLine1}
                    <br />
                    {slide.titleLine2}
                  </motion.h1>
                  <motion.p className="hp-hero-sub" variants={copyItemVariant}>
                    {slide.sub}
                  </motion.p>
                </motion.div>
              </AnimatePresence>

              <motion.div
                className="hp-hero-cta"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <motion.button
                  type="button"
                  className="hp-btn hp-btn-primary"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/market")}
                >
                  Shop the edit
                </motion.button>
                <motion.button
                  type="button"
                  className="hp-btn hp-btn-outline"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/market")}
                >
                  Browse collections
                </motion.button>
              </motion.div>

              <motion.ul
                className="hp-trust-row"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <li>
                  <TruckIcon size={16} /> Free shipping over $75
                </li>
                <li>
                  <ShieldIcon size={16} /> Secure checkout
                </li>
                <li>
                  <RefreshIcon size={16} /> 30-day returns
                </li>
              </motion.ul>
            </div>

            <div className="hp-hero-visual">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  variants={heroVisualStagger}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ position: "absolute", inset: 0 }}
                >
                  <motion.div
                    variants={mainImgVariant}
                    style={{ position: "absolute", inset: 0 }}
                  >
                    <Ph
                      src={slide.mainImage}
                      alt={slide.mainAlt}
                      className="hp-hero-img-main"
                    />
                  </motion.div>

                  <motion.div
                    variants={accentImgVariant}
                    style={{ position: "absolute", inset: 0 }}
                  >
                    <Ph
                      src={slide.accentImage}
                      alt={slide.accentAlt}
                      className="hp-hero-img-accent"
                    />
                  </motion.div>

                  <motion.span className="hp-hero-flag" variants={flagVariant}>
                    {slide.flag}
                  </motion.span>
                </motion.div>
              </AnimatePresence>

              <motion.div
                className="hp-social-proof"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="hp-avatars">
                  <span>A</span>
                  <span>M</span>
                  <span>R</span>
                </div>
                <div>
                  <div className="hp-social-rating">
                    {renderStars(4.8)}
                    <span>4.8</span>
                  </div>
                  <p>Loved by 30,000+ customers</p>
                </div>
              </motion.div>

              <motion.div
                className="hp-hero-dots"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {HERO_SLIDES.map((_, i) => (
                  <span
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`Go to slide ${i + 1}`}
                    className={i === activeSlide ? "is-active" : ""}
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveSlide(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setActiveSlide(i);
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ---------- Featured products (Dynamic API) ---------- */}
        <section className="hp-section hp-products">
          <div className="hp-container">
            <div className="hp-products-header">
              <h2>Featured pieces</h2>
              <a href="/market" className="hp-view-all">
                View all products <ChevronRightIcon size={16} />
              </a>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p>Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="hp-product-grid">
                {products.map((product) => {
                  const price = parseFloat(product.price || 0);
                  const isOutOfStock = Number(product.stock ?? 0) <= 0;
                  const productId = product.id || product._id;

                  return (
                    <article
                      className="hp-product-card"
                      key={productId}
                      onClick={() => navigate(`/products/detail/${productId}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="hp-product-media">
                        <Ph
                          src={
                            product.image ||
                            "https://via.placeholder.com/300x200?text=No+Image"
                          }
                          alt={product.name}
                          className="hp-product-img"
                        />
                        {product.category && (
                          <span className="hp-product-badge hp-badge-new">
                            {product.category}
                          </span>
                        )}
                      </div>
                      <div className="hp-product-body">
                        <h3>{product.name}</h3>
                        <div className="hp-product-rating">
                          {renderStars(product.rating || 5)}
                          <span>({product.reviews || 12})</span>
                        </div>
                        <div className="hp-product-price">
                          <span className="hp-price-current">
                            ${price.toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="hp-add-cart"
                          disabled={isOutOfStock}
                          onClick={(e) => handleAddToCart(product, e)}
                        >
                          <BagIcon size={16} />{" "}
                          {isOutOfStock ? "Out of Stock" : "Add to cart"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p>No featured products available.</p>
              </div>
            )}
          </div>
        </section>

        {/* ---------- Trust bar ---------- */}
        <section className="hp-trust-bar">
          <div className="hp-container hp-trust-grid">
            {TRUST_FEATURES.map(({ icon: FeatureIcon, title, text }) => (
              <div className="hp-trust-item" key={title}>
                <span className="hp-trust-icon">
                  <FeatureIcon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Newsletter ---------- */}
        <section className="hp-newsletter">
          <div className="hp-container hp-newsletter-inner">
            <div className="hp-newsletter-copy">
              <span className="hp-newsletter-icon">
                <MailIcon size={22} />
              </span>
              <div>
                <h2>Get 10% off your first order</h2>
                <p>
                  Join the list for new arrivals and early access to sales.
                </p>
              </div>
            </div>

            {subscribed ? (
              <p className="hp-newsletter-thanks">
                You're on the list — check your inbox to confirm.
              </p>
            ) : (
              <form
                className="hp-newsletter-form"
                onSubmit={handleSubscribe}
              >
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

            <div className="hp-newsletter-note">
              <GiftIcon size={18} /> New arrivals, every week.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}