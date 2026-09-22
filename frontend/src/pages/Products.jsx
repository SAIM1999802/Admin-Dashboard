import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProducts, deleteProduct } from "../services/api";
import "../styles/Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const navigate = useNavigate();

  const fetchProductList = async () => {
    try {
      const response = await getProducts();
      const productList = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setProducts(productList);

      const uniqueCategories = [
        ...new Set(
          productList
            .map((item) => item.category)
            .filter((cat) => cat && cat.trim() !== "")
        ),
      ];
      setCategories(uniqueCategories);
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
      return <span className="status low-stock">Low Stock</span>;
    return <span className="status in-stock">In Stock</span>;
  };

  const renderProductRows = () => {
    return filteredProducts.map((item, i) => {
      const mainImage = Array.isArray(item.images)
        ? item.images[0]
        : item.image;

      return (
        <tr key={item.id}>
          <td style={{color :"#124d45", fontWeight: "600" }}>{i + 1}</td>
          <td>
            <div
              className="product-cell"
              onClick={() => navigate(`/products/detail/${item.id}`)}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={item.name}
                  className="product-img-thumb"
                />
              ) : (
                <div className="product-img-placeholder" />
              )}
              <span style={{ fontWeight: "600", color: "#0f172a" }}>
                {item.name}
              </span>
            </div>
          </td>
          <td>{item.category}</td>
          <td>${item.price}</td>
          <td>{item.stock}</td>
          <td>{getStatus(item.stock)}</td>
          <td style={{ textAlign: "right" }}>
            <div className="action-buttons-group" style={{ marginTop: 0, justifyContent: "flex-end" }}>
              <button
                className="btn-action-edit custom-tooltip"
                onClick={() => navigate(`/products/edit/${item.id}`)}
                data-title="Edit Product"
              >
                <i className="bi bi-pencil-fill"></i> Edit
              </button>
              <button
                className="btn-action-delete custom-tooltip"
                onClick={() => handleDelete(item.id)}
                data-title="Delete Product"
              >
                <i className="bi bi-trash-fill"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <>
      <Navbar />
      <main className="admin-page">
        <div className="page-header">
          <div className="page-title-group">
            <h1 className="add-product-title">Product Inventory</h1>
          </div>

          <button
            className="btn-add-product"
            onClick={() => navigate("/products/add")}
          >
            <i className="bi bi-plus-lg"></i> Add Product
          </button>
        </div>

        <div className="inventory-card" style={{ maxWidth: "100%" }}>
          <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
            <input
              type="text"
              className="search-input-custom"
              placeholder="Search Product Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="category-select-custom"
              style={{ width: "250px" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All Categories">All Categories</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="table-responsive tab-scroll">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>{renderProductRows()}</tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

export default Products;