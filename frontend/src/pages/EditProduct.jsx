import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateProduct, getProducts, getCategories } from "../services/api";
import "../styles/Products.css";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    stock_price: "",
    price: "",
    stock: "",
    description: "",
    images: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        let catsList = [];
        if (Array.isArray(catRes.data)) {
          catsList = catRes.data;
        } else if (Array.isArray(catRes.data?.data)) {
          catsList = catRes.data.data;
        } else if (Array.isArray(catRes)) {
          catsList = catRes;
        }
        setCategories(catsList);

        const productsList = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data?.data || [];
        const product = productsList.find((p) => String(p.id) === String(id));

        if (product) {
          let loadedImages = [];
          if (Array.isArray(product.images) && product.images.length > 0) {
            loadedImages = product.images;
          } else if (product.image) {
            loadedImages = [product.image];
          }

          const currentCatId = product.category_id || product.category?.id;
          const initialCat = catsList.find((c) => String(c.id) === String(currentCatId)) ||
            catsList.find((c) => (c.Name || c.name) === product.category);

          setSelectedCategory(initialCat || null);

          setFormData({
            id: product.id || "",
            name: product.name || "",
            stock_price: product.stock_price || "",
            price: product.price || "",
            stock: product.stock_count ?? product.stock ?? "",
            description: product.description || "",
            images: loadedImages,
          });
        }
      } catch (err) {
        console.error("Failed to load product or categories", err);
      }
    };
    fetchData();
  }, [id]);

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
        stock_price: parseFloat(formData. stock_price) || 0,
        price: parseFloat(formData.price) || 0,
        stock_count: parseInt(formData.stock, 10) || 0,
        description: formData.description.trim(),
        images: formData.images,
        image: formData.images.length > 0 ? formData.images[0] : "",
      };

      await updateProduct(id, payload);
      navigate("/products");
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const filteredCategories = (categories || []).filter((cat) => {
    const nameStr = cat?.Name || cat?.name || "";
    return nameStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="product-page-wrapper">
      <div className="edit-product-container">
        <h2 className="card-form-title">EDIT PRODUCT</h2>
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label className="form-label-bold">PRODUCT ID (AUTO-GENERATED)</label>
            <input
              type="text"
              value={`#PROD-${formData.id}`}
              disabled
              className="form-control-custom"
            />
          </div>

          <div className="form-group">
            <label className="form-label-bold">PRODUCT NAME</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-control-custom"
            />
          </div>

          <div className="form-row">
            <div className="position-relative" style={{ position: "relative" }} ref={dropdownRef}>
              <label className="form-label-bold">CATEGORY</label>
              <div
                className="form-control-custom custom-select-trigger"
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
                    className="form-control-custom"
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
                value={formData.stock_price}
                onChange={handleInputChange}
                required
                className="form-control-custom"
              />
            </div>
            <div>
              <label className="form-label-bold">SELLING PRICE ($)</label>
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

            <div>
              <label className="form-label-bold">STOCK COUNT</label>
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
            <label className="form-label-bold">DESCRIPTION</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              className="form-control-custom"
            />
          </div>

          <div className="form-group">
            <label className="form-label-bold">PRODUCT IMAGES</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleMultipleImages}
              style={{ marginTop: "6px" }}
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
    </div>
  );
};

export default EditProduct;