const db = require("../config/db");

const getAllProducts = async () => {
  const [rows] = await db.query(
    `SELECT 
      p.id, 
      p.name, 
      p.category_id, 
      c.Name AS category, 
      p.price, 
      p.stock_count AS stock, 
      p.image, 
      p.description 
     FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id AND c.is_deleted = 0
     WHERE p.is_deleted = 0 
     ORDER BY p.id ASC`
  );
  return rows;
};
const getProductById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
      p.id, 
      p.name, 
      p.category_id, 
      c.Name AS category, 
      p.price, 
      p.stock_count AS stock, 
      p.image, 
      p.description 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id AND c.is_deleted = 0
     WHERE p.id = ? AND p.is_deleted = 0`,
    [id]
  );
  return rows[0] || null;
};

const createProduct = async (data, userId) => {
  const { name, category_id, price, stock, image, description } = data;
  const cleanDescription = description != null ? String(description).trim() : "";
  const finalStock = parseInt(stock, 10) || 0;

  const query = `
    INSERT INTO products (name, category_id, price, stock_count, image, description, is_deleted, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `;

  const [result] = await db.query(query, [
    name || "Untitled Product",
    category_id || null,
    parseFloat(price) || 0.00,
    finalStock,
    image || null,
    cleanDescription,
    userId
  ]);

  return { id: result.insertId, ...data };
};

const updateProduct = async (id, data, userId) => {
  const { name, category_id, price, stock, image, description } = data;
  const cleanDescription = description != null ? String(description).trim() : "";
  const finalStock = parseInt(stock, 10) || 0;

  const query = `
    UPDATE products 
    SET name = ?, category_id = ?, price = ?, stock_count = ?, image = ?, description = ? 
    WHERE id = ? AND user_id = ? AND is_deleted = 0
  `;

  const [result] = await db.query(query, [
    name || "Untitled Product",
    category_id || null,
    parseFloat(price) || 0.00,
    finalStock,
    image || null,
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