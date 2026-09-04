const db = require("../config/db");

const getAllProducts = async (userId) => {
  const [rows] = await db.query(
    "SELECT id, name, category, price, stock_count AS stock, image, description FROM products WHERE is_deleted = 0 AND user_id = ?",
    [userId]
  );
  return rows;
};

const getProductById = async (id, userId) => {
  const [rows] = await db.query(
    "SELECT id, name, category, price, stock_count AS stock, image, description FROM products WHERE id = ? AND user_id = ? AND is_deleted = 0",
    [id, userId]
  );
  return rows[0];
};

const createProduct = async (data, userId) => {
  const { name, category, price, stock, image, images, description } = data;
  const mainImage = (Array.isArray(images) && images.length > 0) ? images[0] : (image || null);

  const cleanDescription = description != null ? String(description).trim() : "";

  const query = `
    INSERT INTO products (name, category, price, stock_count, image, description, is_deleted, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `;

  const [result] = await db.query(query, [
    name || "Untitled Product",
    category || "Electronics",
    parseFloat(price) || 0.00,
    parseInt(stock, 10) || 0,
    mainImage,
    cleanDescription,
    userId
  ]);

  return result;
};

const updateProduct = async (id, data, userId) => {
  const { name, category, price, stock, image, images, description } = data;
  const mainImage = (Array.isArray(images) && images.length > 0) ? images[0] : (image || null);

  const cleanDescription = description != null ? String(description).trim() : "";

  const query = `
    UPDATE products 
    SET name = ?, category = ?, price = ?, stock_count = ?, image = ?, description = ? 
    WHERE id = ? AND user_id = ? AND is_deleted = 0
  `;

  const [result] = await db.query(query, [
    name || "Untitled Product",
    category || "Electronics",
    parseFloat(price) || 0.00,
    parseInt(stock, 10) || 0,
    mainImage,
    cleanDescription,
    parseInt(id, 10),
    userId
  ]);

  return result;
};

const deleteProduct = async (id, userId) => {
  const query = "UPDATE products SET is_deleted = 1 WHERE id = ? AND user_id = ?";
  const [result] = await db.query(query, [id, userId]);
  return result;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};