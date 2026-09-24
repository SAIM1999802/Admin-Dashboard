import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import { getProducts } from "../services/api";
import Footer from "../components/Footer";

import "../styles/Market.css";

const Market = ({ cart = [], setCart, updateCartCount }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Ek page par kitne products dikhane hain

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
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          setCart([]);
        }
      } else {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  };

  useEffect(() => {
    loadUserCart();
    fetchMarketProducts();

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

  const fetchMarketProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();

      const rawData = response?.data ? response.data : response;
      const productList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.products)
        ? rawData.products
        : [];

      setProducts(productList);

      const uniqueCats = [
        "All",
        ...new Set(productList.map((p) => p.category).filter(Boolean)),
      ];
      setCategories(uniqueCats);
    } catch (error) {
      console.error("Error fetching market products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter((product) =>
        (product.name || "").toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      const stockA = Number(a.stock ?? 0);
      const stockB = Number(b.stock ?? 0);
      if (stockA > 0 && stockB <= 0) return -1;
      if (stockA <= 0 && stockB > 0) return 1;
      return 0;
    });

    setFilteredProducts(result);
    // Search ya Category change hote hi Page 1 par reset kar dein
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, products]);

  // 🔹 PAGINATION COMPUTATIONS
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const triggerToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  const persistCart = (updatedCart) => {
    setCart(updatedCart);
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

    const liveProduct = products.find((p) => p.id === product.id) || product;
    const currentStock = Number(liveProduct.stock ?? 0);

    const existingCartItem = cart.find((item) => item.id === product.id);
    const currentCartQty = existingCartItem ? existingCartItem.quantity : 0;

    if (currentStock <= 0 || currentCartQty >= currentStock) {
      triggerToast("Item is Out of Stock!", "danger");
      return;
    }

    let updatedCart = [];
    let itemExists = false;

    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) {
        updatedCart.push({ ...cart[i], quantity: cart[i].quantity + 1 });
        itemExists = true;
      } else {
        updatedCart.push(cart[i]);
      }
    }

    if (!itemExists) {
      updatedCart.push({ ...product, quantity: 1 });
    }

    persistCart(updatedCart);
    triggerToast("Successfully added to cart", "success");
    setIsDrawerOpen(true);
  };

  return (
    <div className="market-wrapper">
      <Navbar />

      {/* DYNAMIC TOP TOAST POPUP */}
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

      {/* MAIN CONTENT */}
      <div className="market-container">
        <div className="market-header">
          <div>
            <h1 className="serif-title">Collection</h1>
            <p className="market-subtitle">
              Explore curated products tailored for your style
            </p>
          </div>

          <div className="search-box-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="products-grid">
              {currentProducts.map((product) => {
                const stock = Number(product.stock ?? 0);
                const isOutOfStock = stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="velure-card"
                    onClick={() => navigate(`/products/detail/${product.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="velure-card-img-wrapper">
                      <img
                        src={
                          product.image ||
                          "https://via.placeholder.com/300x200?text=No+Image"
                        }
                        alt={product.name}
                        className="velure-card-img"
                      />
                      {product.category && (
                        <span className="category-badge">
                          {product.category}
                        </span>
                      )}

                      {isOutOfStock && (
                        <div className="out-of-stock-overlay">
                          <span className="stock-badge">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="velure-card-body">
                      <div>
                        <h3 className="product-title">{product.name}</h3>
                        {product.description && (
                          <p className="product-desc">{product.description}</p>
                        )}
                      </div>

                      <div className="product-footer">
                        <span className="product-price">
                          ${parseFloat(product.price || 0).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          className="btn-velure-add"
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isOutOfStock}
                        >
                          <i className="bi bi-bag-plus"></i>
                          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🔹 PAGINATION UI CONTROLS */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        className={`pagination-number ${
                          pageNum === currentPage ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  )}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>No Products Found</h3>
            <p className="market-subtitle">
              Try changing your search term or category filter.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Market;