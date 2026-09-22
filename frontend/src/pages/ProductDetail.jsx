import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductDetails } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer"
import CartDrawer from "../components/CartDrawer";
import "../styles/Market.css";
import "../styles/Products.css";

const ProductDetail = ({ cart = [], setCart = () => {}, updateCartCount }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quantity for Add to Cart
  const [quantity, setQuantity] = useState(1);

  const [userRole, setUserRole] = useState("user");
  const isAdmin = userRole === "admin";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // User details fetch karna
  const getUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("User parsing error", e);
      return null;
    }
  };

  const currentUser = getUser();
  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.email;

  const isAuthenticated = () => {
    return Boolean(localStorage.getItem("token") || currentUser);
  };

  // LocalStorage Key for Product Reviews
  const reviewsStorageKey = `reviews_product_${id}`;

  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  // Editing Review State (For User & Admin)
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // Admin Reply Inputs & Edit States
  const [replyInputs, setReplyInputs] = useState({});
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState("");

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser && storedUser.role) {
      setUserRole(storedUser.role);
    }

    // Load saved reviews from localStorage
    const savedReviews = localStorage.getItem(reviewsStorageKey);
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (e) {
        setReviews([]);
      }
    } else {
      const initialReviews = [
        {
          id: 1,
          userId: "user_101",
          userName: "Ayesha Khan",
          rating: 5,
          comment: "Quality product! Fabric and color match exactly as shown.",
          date: "2026-02-10",
          adminReply: "Thank you so much for your feedback, Ayesha!",
        },
        {
          id: 2,
          userId: "user_102",
          userName: "Ali Raza",
          rating: 4,
          comment: "Good experience overall. Delivery was quick.",
          date: "2026-02-12",
          adminReply: null,
        },
      ];
      setReviews(initialReviews);
      localStorage.setItem(reviewsStorageKey, JSON.stringify(initialReviews));
    }

    const fetchProduct = async () => {
      try {
        const response = await getProductDetails(id);
        let data = response?.data || response;
        if (Array.isArray(data)) {
          data = data[0] || null;
        }
        setProduct(data);
      } catch (error) {
        console.error("Error loading product detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Save Reviews Helper
  const saveReviewsToStorage = (updatedReviews) => {
    setReviews(updatedReviews);
    localStorage.setItem(reviewsStorageKey, JSON.stringify(updatedReviews));
  };

  const triggerToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // ADD TO CART HANDLER
  const handleAddToCart = () => {
    if (!product) return;

    const availableStock =
      product.stock ?? product.countInStock ?? product.quantity ?? 0;
    if (availableStock <= 0) {
      triggerToast("Item is out of stock!", "danger");
      return;
    }

    const productId = product._id || product.id || id;
    const existingIndex = cart.findIndex(
      (item) =>
        String(item.product) === String(productId) ||
        String(item.id) === String(productId),
    );

    let updatedCart = [];
    if (existingIndex > -1) {
      const currentQtyInCart = cart[existingIndex].quantity;
      if (currentQtyInCart + quantity > availableStock) {
        triggerToast(
          `Cannot add more than available stock (${availableStock})`,
          "danger",
        );
        return;
      }
      updatedCart = cart.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    } else {
      updatedCart = [
        ...cart,
        {
          product: productId,
          id: productId,
          name: product.name,
          price: product.price,
          image: displayImage,
          quantity: quantity,
        },
      ];
    }

    setCart(updatedCart);
    if (updateCartCount) updateCartCount(updatedCart);
    triggerToast(`${product.name} added to cart!`, "success");
    setIsDrawerOpen(true);
  };

  // Review Submit Logic
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      triggerToast("Please login to post a review", "danger");
      return;
    }
    if (!newComment.trim()) {
      triggerToast("Please enter a comment", "danger");
      return;
    }

    const newEntry = {
      id: Date.now(),
      userId: currentUserId || `guest_${Date.now()}`,
      userName:
        currentUser?.name ||
        currentUser?.email?.split("@")[0] ||
        "Verified Buyer",
      rating: newRating,
      comment: newComment,
      date: new Date().toISOString().split("T")[0],
      adminReply: null,
    };

    const updated = [newEntry, ...reviews];
    saveReviewsToStorage(updated);
    setNewComment("");
    setNewRating(5);
    triggerToast("Review posted successfully", "success");
  };

  // Start Edit Review
  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  // Save Edited Review
  const handleSaveEdit = (reviewId) => {
    if (!editComment.trim()) {
      triggerToast("Comment cannot be empty", "danger");
      return;
    }

    const updated = reviews.map((item) =>
      item.id === reviewId
        ? { ...item, rating: editRating, comment: editComment }
        : item,
    );

    saveReviewsToStorage(updated);
    setEditingReviewId(null);
    triggerToast("Review updated successfully", "success");
  };

  // Delete Review (ONLY Admin)
  const handleDeleteReview = (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      const updated = reviews.filter((item) => item.id !== reviewId);
      saveReviewsToStorage(updated);
      triggerToast("Review deleted successfully", "success");
    }
  };

  // Admin Reply Handlers
  const handleAdminReplySubmit = (reviewId) => {
    const replyText = replyInputs[reviewId];
    if (!replyText || !replyText.trim()) {
      triggerToast("Please write a reply first", "danger");
      return;
    }

    const updated = reviews.map((item) =>
      item.id === reviewId ? { ...item, adminReply: replyText } : item,
    );

    saveReviewsToStorage(updated);
    setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
    triggerToast("Reply posted successfully", "success");
  };

  const handleSaveAdminReplyEdit = (reviewId) => {
    if (!editReplyText.trim()) {
      triggerToast("Reply cannot be empty", "danger");
      return;
    }

    const updated = reviews.map((item) =>
      item.id === reviewId ? { ...item, adminReply: editReplyText } : item,
    );

    saveReviewsToStorage(updated);
    setEditingReplyId(null);
    triggerToast("Reply updated successfully", "success");
  };

  const renderStars = (rating, onClick = null) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`bi ${index < rating ? "bi-star-fill text-warning" : "bi-star text-muted"}`}
        style={{
          color: index < rating ? "#f59e0b" : "#cbd5e1",
          marginRight: "3px",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={() => onClick && onClick(index + 1)}
      ></i>
    ));
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <span>Loading product details...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px" }}>
        <h3>Product Not Found</h3>
        <button
          className="btn-submit"
          style={{ marginTop: "15px" }}
          onClick={() => navigate(isAdmin ? "/products" : "/market")}
        >
          Back to Products
        </button>
      </div>
    );
  }

  const displayImage =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : product.image || product.images;

  // Extract Stock Quantity safely from possible backend key names
  const stockCount =
    product.stock ?? product.countInStock ?? product.quantity ?? 0;

  return (
    <div className="product-detail-wrapper">
      <Navbar />

      {!isAdmin && (
        <>
          <div
            className={`velure-toast ${showToast ? "show" : ""} ${
              toastType === "danger" ? "danger" : ""
            }`}
          >
            <i
              className={`bi ${toastType === "danger" ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"}`}
            ></i>
            <span>{toastMessage}</span>
            <button className="toast-close" onClick={() => setShowToast(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <CartDrawer
            cart={cart}
            products={product ? [product] : []}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
            persistCart={(updatedCart) => setCart(updatedCart)}
            triggerToast={triggerToast}
            updateCartCount={updateCartCount}
          />
        </>
      )}

      <div className="product-detail-container">
        <button
          className="btn-back-link"
          onClick={() => navigate(isAdmin ? "/products" : "/market")}
        >
          <i className="bi bi-arrow-left"></i> Back
        </button>

        {/* Product Info Card */}
        <div className="product-detail-card">
          <div className="product-image-box">
            {displayImage ? (
              <img src={displayImage} alt={product.name || "Product"} />
            ) : (
              <span style={{ color: "#94a3b8" }}>No Image Available</span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Header Container: Title and Stock Badge in One Line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >
              <h1 className="product-title" style={{ margin: 0 }}>
                {product.name}
              </h1>

              {/* STOCK INDICATOR BADGE & COUNT */}
              {stockCount > 5 ? (
                <span
                  className="badge bg-success-subtle text-success border border-success"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="bi bi-check-circle-fill me-1"></i> In Stock (
                  {stockCount})
                </span>
              ) : stockCount > 0 ? (
                <span
                  className="badge bg-warning-subtle text-warning-emphasis border border-warning"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> Low
                  Stock (Only {stockCount} left)
                </span>
              ) : (
                <span
                  className="badge bg-danger-subtle text-danger border border-danger"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="bi bi-x-circle-fill me-1"></i> Out of Stock
                </span>
              )}
            </div>

            <p
              style={{ color: "#475569", marginTop: "12px", lineHeight: "1.6" }}
            >
              {product.description}
            </p>
            <h3
              style={{
                marginTop: "16px",
                color: "#124d45",
                fontSize: "1.8rem",
              }}
            >
              ${parseFloat(product.price || 0).toFixed(2)}
            </h3>

            {/* ADD TO CART & QUANTITY CONTROLS (Only for Normal Users) */}
            {!isAdmin && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <button
                  className="btn-submit"
                  style={{
                    padding: "12px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: stockCount <= 0 ? 0.6 : 1,
                    cursor: stockCount <= 0 ? "not-allowed" : "pointer",
                  }}
                  onClick={handleAddToCart}
                  disabled={stockCount <= 0}
                >
                  <i className="bi bi-bag"></i>{" "}
                  {stockCount > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            )}
          </div>  
        </div>

        {/* REVIEWS & RATINGS SECTION */}
        <div className="reviews-section-card">
          <h2 className="reviews-main-heading">Customer Reviews & Ratings</h2>

          {/* USER REVIEW SUBMIT FORM (Non-Admins) */}
          {!isAdmin && (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <h3 className="review-sub-heading">Write a Review</h3>

              <div className="star-rating-select">
                <label className="form-label-bold">Your Rating:</label>
                <div className="stars-input">
                  {renderStars(newRating, (val) => setNewRating(val))}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <textarea
                  className="form-control-custom"
                  rows="3"
                  placeholder="Share your experience with this product..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-submit"
                style={{ marginTop: "12px" }}
              >
                Submit Review
              </button>
            </form>
          )}

          {/* REVIEWS LIST */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No reviews yet. Be the first to review!
              </p>
            ) : (
              reviews.map((rev) => {
                const isOwner =
                  currentUserId && String(rev.userId) === String(currentUserId);
                const canEdit = isOwner || isAdmin;
                const canDelete = isAdmin;

                return (
                  <div key={rev.id} className="review-item-card">
                    {editingReviewId === rev.id ? (
                      /* EDIT MODE FOR REVIEW */
                      <div className="review-edit-box">
                        <div style={{ marginBottom: "8px" }}>
                          <label
                            style={{ fontSize: "0.85rem", fontWeight: "600" }}
                          >
                            Edit Rating:
                          </label>
                          <div>
                            {renderStars(editRating, (val) =>
                              setEditRating(val),
                            )}
                          </div>
                        </div>

                        <textarea
                          className="form-control-custom"
                          rows="2"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                        ></textarea>

                        <div className="review-action-btns">
                          <button
                            className="btn-submit btn-sm"
                            onClick={() => handleSaveEdit(rev.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn-cancel btn-sm"
                            onClick={() => setEditingReviewId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* DISPLAY MODE FOR REVIEW */
                      <>
                        <div className="review-header">
                          <div>
                            <strong className="review-username">
                              {rev.userName}
                            </strong>
                            <div className="review-stars">
                              {renderStars(rev.rating)}
                            </div>
                          </div>

                          <div className="review-header-right">
                            <span className="review-date">{rev.date}</span>

                            <div className="review-controls">
                              {canEdit && (
                                <button
                                  className="btn-icon edit-icon"
                                  title="Edit Review"
                                  onClick={() => handleStartEdit(rev)}
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  className="btn-icon delete-icon"
                                  title="Delete Review (Admin Only)"
                                  onClick={() => handleDeleteReview(rev.id)}
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="review-comment">{rev.comment}</p>
                      </>
                    )}

                    {/* ADMIN REPLY SECTION */}
                    {rev.adminReply && (
                      <div className="admin-reply-box">
                        <div className="admin-reply-header">
                          <span>
                            <i className="bi bi-reply-fill"></i> Store Response
                            (Admin)
                          </span>

                          {isAdmin && editingReplyId !== rev.id && (
                            <button
                              className="btn-icon edit-icon"
                              style={{ fontSize: "0.8rem" }}
                              onClick={() => {
                                setEditingReplyId(rev.id);
                                setEditReplyText(rev.adminReply);
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        </div>

                        {editingReplyId === rev.id ? (
                          <div style={{ marginTop: "8px" }}>
                            <input
                              type="text"
                              className="form-input-custom"
                              value={editReplyText}
                              onChange={(e) => setEditReplyText(e.target.value)}
                            />
                            <div
                              className="review-action-btns"
                              style={{ marginTop: "6px" }}
                            >
                              <button
                                className="btn-submit btn-sm"
                                onClick={() => handleSaveAdminReplyEdit(rev.id)}
                              >
                                Save Reply
                              </button>
                              <button
                                className="btn-cancel btn-sm"
                                onClick={() => setEditingReplyId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="admin-reply-text">{rev.adminReply}</p>
                        )}
                      </div>
                    )}

                    {/* ADMIN REPLY INPUT FORM */}
                    {isAdmin && !rev.adminReply && (
                      <div className="admin-reply-form">
                        <input
                          type="text"
                          className="form-input-custom"
                          placeholder="Write an admin response..."
                          value={replyInputs[rev.id] || ""}
                          onChange={(e) =>
                            setReplyInputs({
                              ...replyInputs,
                              [rev.id]: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => handleAdminReplySubmit(rev.id)}
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />  
    </div>
  );
};

export default ProductDetail;
