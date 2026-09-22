import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategoryDetails, updateCategory } from '../services/api';
import '../styles/Category.css';

const EditCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await getCategoryDetails(id);
        setName(res.data.Name || res.data.name || '');
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategory();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCategory(id, { Name: name });
      navigate('/categories');
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
              <h2>Edit Category</h2>
            </div>

            <form className="category-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  className="category-input"
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">Update Category</button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => navigate('/categories')}
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

export default EditCategory;