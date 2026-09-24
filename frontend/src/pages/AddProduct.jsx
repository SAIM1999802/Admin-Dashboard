import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addProduct, getCategories } from "../services/api";
import "../styles/Products.css";

const AddProduct = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    stock_price:"",
    price: "",
    stock: "",
    description: "",
    images: [],
  });

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await getCategories();
        let catsList = [];
        if (Array.isArray(response.data)) {
          catsList = response.data;
        } else if (Array.isArray(response.data?.data)) {
          catsList = response.data.data;
        } else if (Array.isArray(response)) {
          catsList = response;
        }
        setCategories(catsList);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultipleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const processFile = (file) => {
      return new Promise((resolve) => {
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
            resolve(compressedBase64);
          };
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const processedImages = await Promise.all(files.map(processFile));
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...processedImages],
      }));
    } catch (err) {
      console.error("Error processing images:", err);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        category_id: selectedCategory.id,
        stock_price: parseFloat(formData.stock_price) || 0,
        price: parseFloat(formData.price) || 0,
        stock_count: parseInt(formData.stock, 10) || 0,
        description: formData.description.trim(),
        images: formData.images,
        image: formData.images.length > 0 ? formData.images[0] : "",
      };

      await addProduct(payload);
      navigate("/products");
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const filteredCategories = (categories || []).filter((cat) => {
    const nameStr = cat?.Name || cat?.name || "";
    return nameStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="product-page-wrapper">
      <div className="add-product-container">
        <h2 className="card-form-title">CREATE NEW PRODUCT</h2>
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label className="form-label-bold">PRODUCT NAME</label>
            <input
              type="text"
              name="name"
              className="form-input-custom"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="position-relative" style={{ position: "relative" }} ref={dropdownRef}>
              <label className="form-label-bold">CATEGORY</label>
              <div
                className="form-input-custom custom-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <span>
                  {selectedCategory
                    ? selectedCategory.Name || selectedCategory.name
                    : "Select Category..."}
                </span>
                <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`}></i>
              </div>

              {isOpen && (
                <div className="dropdown-menu-custom">
                  <input
                    type="text"
                    className="form-input-custom"
                    style={{ padding: "6px 10px", marginBottom: "8px" }}
                    placeholder="Search category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <div>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="dropdown-item-custom"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          {cat.Name || cat.name}
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", padding: "8px", color: "#64748b" }}>
                        No categories found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="form-label-bold">STOCK PRICE ($)</label>
              <input
                type="number"
                step="0.01"
                name="stock_price"
                className="form-input-custom"
                value={formData.stock_price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="form-label-bold">SELLING PRICE ($)</label>
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

            <div>
              <label className="form-label-bold">STOCK COUNT</label>
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

          <div className="form-group">
            <label className="form-label-bold">DESCRIPTION</label>
            <textarea
              name="description"
              rows="4"
              className="form-input-custom"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product details..."
            />
          </div>

          <div className="form-group">
            <label className="form-label-bold">PRODUCT IMAGES (MULTIPLE)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{ marginTop: "6px" }}
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

          <div className="action-buttons-group">
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
    </div>
  );
};

export default AddProduct;