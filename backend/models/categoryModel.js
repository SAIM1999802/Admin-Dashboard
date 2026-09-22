const db = require("../config/db");

class CategoryModel {
  static getAllByUserId(userId) {
    const query = `
      SELECT id, Name, Name AS name, user_id, is_deleted 
      FROM categories 
      WHERE user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) 
      ORDER BY id ASC
    `;
    return db.query(query, [userId]);
  }

  static getById(id, userId) {
    const query = `
      SELECT id, Name, Name AS name, user_id, is_deleted 
      FROM categories 
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `;
    return db.query(query, [id, userId]);
  }

  static create(name, userId) {
    const query = "INSERT INTO categories (Name, user_id, is_deleted) VALUES (?, ?, 0)";
    return db.query(query, [name, userId]);
  }

  static update(id, name, userId) {
    const query = "UPDATE categories SET Name = ? WHERE id = ? AND user_id = ? AND is_deleted = 0";
    return db.query(query, [name, id, userId]);
  }

  static softDelete(id, userId) {
    const query = "UPDATE categories SET is_deleted = 1 WHERE id = ? AND user_id = ?";
    return db.query(query, [id, userId]);
  }
}

module.exports = CategoryModel;