import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProductDetails } from "../services/api";
import "../styles/ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProductDetails(id);
        
        // Handle array responses (e.g. SQL SELECT returns [ { ... } ])
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-3 fw-semibold">Loading product details...</span>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="container text-center py-5">
          <h3 className="fw-bold text-secondary">Product Not Found</h3>
          <button 
            className="btn btn-primary mt-3" 
            onClick={() => navigate("/products")}
          >
            Back to Products List
          </button>
        </div>
      </>
    );
  }

  // Handle Array images or Single String image
  const displayImage = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : product.image || product.images;

  // Safe Stock Status Rendering
  const stockCount = Number(product.stock || 0);
  const renderStockBadge = () => {
    if (stockCount === 0) {
      return <span className="badge-stock out-stock">• Out of Stock</span>;
    } else if (stockCount <= 5) {
      return <span className="badge-stock low-stock">• Low Stock ({stockCount})</span>;
    }
    return <span className="badge-stock in-stock">• In Stock ({stockCount})</span>;
  };

  return (
    <div className="product-detail-wrapper">
      <Navbar />

      <div className="product-detail-container">
        <button
          className="btn-back-link"
          onClick={() => navigate("/products")}
        >
          <i className="bi bi-arrow-left me-2"></i> Back to Products
        </button>

        <div className="product-detail-card">
          {/* Image Container */}
          <div className="product-image-box">
            {displayImage ? (
              <img src={displayImage} alt={product.name || "Product"} />
            ) : (
              <span className="no-image-text">No Image Available</span>
            )}
          </div>

          {/* Details Content */}
          <div className="product-info-content">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <h1 className="product-title">{product.name}</h1>
              <button
                className="btn-edit-action"
                onClick={() => navigate(`/products/edit/${product.id || id}`)}
              >
                <i className="bi bi-pencil-fill me-1"></i> Edit
              </button>
            </div>

            <div className="my-2">
              {renderStockBadge()}
            </div>

            <div className="detail-data-list">
              <div className="detail-data-row">
                <span className="detail-label">Category</span>
                <span className="detail-value">
                  {product.category || "Uncategorized"}
                </span>
              </div>

              <div className="detail-data-row">
                <span className="detail-label">Price</span>
                <span className="detail-value-price">
                  ${parseFloat(product.price || 0).toFixed(2)}
                </span>
              </div>

              <div className="detail-data-row">
                <span className="detail-label">Quantity in stock</span>
                <span className="detail-value">{stockCount} units</span>
              </div>
            </div>

            <div className="product-description-section">
              <h3 className="description-title">Description</h3>
              <p className="description-text">
                {product.description && product.description.trim() !== ""
                  ? product.description
                  : "No detailed description provided for this product."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;