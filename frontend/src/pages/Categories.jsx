import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { getCategories, deleteCategory, getProducts } from "../services/api";
import "../styles/Category.css";

const extractDataArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);
      setCategories(extractDataArray(catRes));
      setProducts(extractDataArray(prodRes));
    } catch (err) {
      console.error("Error fetching categories or products:", err);
      setCategories([]);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!id) return;

    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        fetchData();
      } catch (err) {
        console.error("Error deleting category:", err);
        alert("Failed to delete category.");
      }
    }
  };

  const handleEdit = (e, id) => {
    e.stopPropagation();
    if (id) {
      navigate(`/categories/edit/${id}`);
    }
  };

  const getFilteredCategories = () => {
    const result = [];
    const searchLower = search.toLowerCase();

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (!category) continue;

      const catName = String(category.Name || category.name || "");
      const catId = String(category.id || category._id || "");

      const matchesSearch =
        catName.toLowerCase().includes(searchLower) ||
        catId.toLowerCase().includes(searchLower);

      if (matchesSearch) {
        result.push(category);
      }
    }

    return result;
  };

  const getProductCountForCategory = (category) => {
    let count = 0;
    const categoryId = category.id || category._id;
    const categoryName = (category.Name || category.name || "").toLowerCase();

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      if (!prod) continue;

      const prodCat = prod.category || prod.categoryId || prod.Category || prod.CategoryId;
      
      if (typeof prodCat === "object" && prodCat !== null) {
        const pCatId = prodCat.id || prodCat._id;
        const pCatName = (prodCat.Name || prodCat.name || "").toLowerCase();
        if (pCatId === categoryId || (pCatName && pCatName === categoryName)) {
          count++;
        }
      } else if (prodCat === categoryId || String(prodCat).toLowerCase() === categoryName) {
        count++;
      }
    }

    return count;
  };

  const filteredCategories = getFilteredCategories();

  const renderTableRows = () => {
    if (filteredCategories.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="text-center text-empty">
            No categories found.
          </td>
        </tr>
      );
    }

    return filteredCategories.map((item, index) => {
      const productCount = getProductCountForCategory(item);

      return (
        <tr key={item.id || item._id || index}>
          <td className="id-cell">#{index + 1}</td>
          <td style={{ fontWeight: 500 }}>{item.Name || item.name || "N/A"}</td>
          <td className="text-center">
            <span className="count-badge">{productCount}</span>
          </td>
          <td className="text-center">
            <div className="action-buttons" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="btn-action-edit"
                onClick={(e) => handleEdit(e, item.id || item._id)}
              >
                <i className="bi bi-pencil-fill"></i> Edit
              </button>
              <button
                type="button"
                className="btn-action-delete"
                onClick={(e) => handleDelete(e, item.id || item._id)}
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

      <main className="admin-page container">
        <div className="row">
          <div className="col-12">
            <div className="page-header">
              <h1 className="page-title">Categories Management</h1>

              <button
                type="button"
                className="primary-btn"
                onClick={() => navigate("/categories/add")}
              >
                <i className="bi bi-plus-lg"></i>
                Add Category
              </button>
            </div>

            <div className="orders-filter-container">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search Category Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-card">
              <div className="table-scroll-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "15%" }}>ID</th>
                      <th>Category Name</th>
                      <th className="text-center">Product Count</th>
                      <th className="text-center" style={{ width: "25%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{renderTableRows()}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Categories;