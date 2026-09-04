import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { updateProduct, getProducts } from "../services/api";
import "../styles/EditProduct.css";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    images: [],
  });

  useEffect(() => {
    const fetchSingleProduct = async () => {
      try {
        const res = await getProducts();
        const product = res.data.find((p) => String(p.id) === String(id));
        if (product) {
          setFormData({
            id: product.id,
            name: product.name || "",
            category: product.category || "Electronics",
            price: product.price || "",
            stock: product.stock || "",
            description: product.description || "",
            images: Array.isArray(product.images)
              ? product.images
              : product.image
                ? [product.image]
                : [],
          });
        }
      } catch (err) {
        console.error("Failed to load product", err);
      }
    };
    fetchSingleProduct();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultipleImages = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleFactor = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleFactor;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, compressedBase64],
          }));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(id, formData);
      navigate("/products");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="edit-product-container">
        <h2>Edit Product</h2>
        <form onSubmit={handleSubmit} className="edit-product-form">
          <div className="form-group">
            <label className="form-label">Product ID (Auto-Generated)</label>
            <input
              type="text"
              value={`#PROD-${formData.id}`}
              disabled
              className="form-control-custom"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-control-custom"
            />
          </div>

          <div className="form-group-row">
            <div className="form-field">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-control-custom"
              >
                <option value="Electronics">Electronics</option>
                <option value="Footwear">Footwear</option>
                <option value="Clothing">Clothing</option>
                <option value="Bottles">Bottles</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="form-control-custom"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Stock Count</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                className="form-control-custom"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              className="form-control-custom"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleMultipleImages}
              className="mt-1"
            />
            <div className="image-preview-wrapper">
              {formData.images.map((img, index) => (
                <div key={index} className="image-item">
                  <img src={img} alt="preview" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Update Product
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditProduct;