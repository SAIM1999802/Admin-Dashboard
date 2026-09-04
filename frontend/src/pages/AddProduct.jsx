import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { addProduct } from "../services/api";
import "../styles/AddProduct.css";

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics",
    price: "",
    stock: "",
    description: "",
    images: [],
  });

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
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        description: formData.description.trim(), 
        images: formData.images,
      };

      await addProduct(payload);
      navigate("/products");
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="add-product-container">
        <h2 className="add-product-title">Create New Product</h2>
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="mb-3">
            <label className="form-label-bold">Product Name</label>
            <input
              type="text"
              name="name"
              className="form-input-custom"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label-bold">Category</label>
              <select
                name="category"
                className="form-input-custom"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="Electronics">Electronics</option>
                <option value="Footwear">Footwear</option>
                <option value="Clothing">Clothing</option>
                <option value="Clothing">Bottles</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label-bold">Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                className="form-input-custom"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label-bold">Stock Count</label>
              <input
                type="number"
                name="stock"
                className="form-input-custom"
                value={formData.stock}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label-bold">Description</label>
            <textarea
              name="description"
              rows="4"
              className="form-input-custom"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product details..."
            />
          </div>

          <div className="mb-4">
            <label className="form-label-bold">Product Images (Multiple)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="form-control mt-1"
              onChange={handleMultipleImages}
            />
            <div className="images-preview-grid">
              {formData.images.map((img, index) => (
                <div key={index} className="image-preview-item">
                  <img src={img} alt="preview" />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/products")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save-product">
              Save Product
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddProduct;