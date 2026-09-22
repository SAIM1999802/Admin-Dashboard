import React, { useState } from "react";
import { createCategory } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Category.css";

const AddCategory = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCategory({ Name: name });
      navigate("/categories");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          <div className="category-container">
            <div className="category-header">
              <h2>Add New Category</h2>
            </div>

            <form className="category-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  className="category-input"
                  type="text"
                  placeholder="e.g. Outerwear, Jackets"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  Save Category
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate("/categories")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;