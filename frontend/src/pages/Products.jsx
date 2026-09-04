import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProducts, deleteProduct } from "../services/api";
import "../styles/Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const navigate = useNavigate();

  const fetchProductList = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (e) {
      console.error("Error fetching products:", e);
    }
  };

  useEffect(() => {
    fetchProductList();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      category === "All Categories" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const getStatus = (stock) => {
  const numStock = Number(stock);
    if (numStock === 0)
      return <span className="status out-stock">Out of Stock</span>;
    if (numStock <= 30)
      return <span className="status low-stock">Low Stock </span>;
    return <span className="status in-stock">In Stock </span>;
  };

  const renderProductRows = () => {
    const rows = [];
    for (let i = 0; i < filteredProducts.length; i++) {
      const item = filteredProducts[i];
      const mainImage = Array.isArray(item.images)
        ? item.images[0]
        : item.image;

      rows.push(
        <tr key={item.id} className="table-row-border">
          <td className="py-3 text-primary fw-semibold">{i+1}</td>
          <td className="py-3">
            <div
              className="d-flex align-items-center gap-3 product-detail-link"
              onClick={() => navigate(`/products/detail/${item.id}`)}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={item.name}
                  className="product-img-thumb "
                />
              ) : (
                <div className="product-img-placeholder" />
              )}
              <span className="fw-semibold text-dark clickable-name">
                {item.name}
              </span>
            </div>
          </td>
          <td className="py-3">{item.category}</td>
          <td className="py-3">${item.price}</td>
          <td className="py-3">{item.stock}</td>
          <td className="py-3">{getStatus(item.stock)}</td>
          <td className="py-3 text-end">
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn-action-edit custom-tooltip"
                onClick={() => navigate(`/products/edit/${item.id}`)}
                data-title="Edit Product"
              >
                <i className="bi bi-pencil-fill me-1"></i> Edit
              </button>
              <button
                className="btn-action-delete custom-tooltip"
                onClick={() => handleDelete(item.id)}
                data-title="Delete Product"
              >
                <i className="bi bi-trash-fill me-1"></i> Delete
              </button>
            </div>
          </td>
        </tr>,
      );
    }

    return rows;
  };

  return (
    <>
      <Navbar />
      <main className="admin-page">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="page-header-icon">
              <i className="bi bi-box-fill"></i>
            </div>
            <h1 className="m-0 fs-3 fw-bold">Product Inventory</h1>
          </div>

          <button
            className="btn-add-product"
            onClick={() => navigate("/products/add")}
          >
            <i className="bi bi-plus-lg me-2"></i> Add Product
          </button>
        </div>

        <div className="inventory-card">
          <div className="d-flex gap-3 mb-4">
            <input
              type="text"
              className="search-input-custom"
              placeholder="Search Product Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="category-select-custom"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All Categories">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Footwear">Footwear</option>
              <option value="Clothing">Clothing</option>  
              <option value="Bottles">Bottles</option>
            </select>
          </div>

          <div className="table-responsive tab-scroll">
            <table className="table align-middle">
              <thead>
                <tr className="table-row-border">
                  <th style={{ color: "#123f83" }} className="py-3">ID</th>
                  <th style={{ color: "#123f83" }} className="py-3">PRODUCT</th>
                  <th style={{ color: "#123f83" }} className="py-3">CATEGORY</th>
                  <th style={{ color: "#123f83" }} className="py-3">PRICE</th>
                  <th style={{ color: "#123f83" }} className="py-3">STOCK</th>
                  <th style={{ color: "#123f83" }} className="py-3">STATUS</th>
                  <th style={{ color: "#123f83" }} className="py-3 text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {renderProductRows()}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default Products;
