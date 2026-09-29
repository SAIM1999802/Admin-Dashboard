import React, { useState } from "react";
import { createCategory } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Category.css";

const AddCategory = () => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createCategory({ Name: name });
      navigate("/categories");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="category-page-scope">
      <main className="admin-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="category-container">
                <div className="category-header">
                  <h2>Add New Category</h2>
                </div>

                <form className="category-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="categoryName">Category Name</label>
                    <input
                      id="categoryName"
                      className="category-input"
                      type="text"
                      placeholder="e.g. Outerwear, Jackets"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="primary-btn" disabled={saving}>
                      {saving ? "Saving..." : "Save Category"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => navigate("/categories")}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddCategory;