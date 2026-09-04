const db = require("../config/db");

const CustomerModel = {
  getAllCustomers: async () => {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.email, 
        c.phone,
        c.address,
        c.created_at,
        COUNT(o.id) AS total_orders, 
        IFNULL(SUM(o.total_amount), 0) AS total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
      WHERE c.is_deleted = 0 OR c.is_deleted IS NULL
      GROUP BY c.id
      ORDER BY c.id DESC;
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  getCustomerById: async (id) => {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.email, 
        c.phone,
        c.address,
        c.created_at,
        COUNT(o.id) AS total_orders
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
      WHERE c.id = ? AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
      GROUP BY c.id;
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  },

  getCustomerByEmail: async (email) => {
    const query = `SELECT * FROM customers WHERE LOWER(email) = LOWER(?) AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1`;
    const [rows] = await db.query(query, [email]);
    return rows[0] || null;
  },

  createCustomer: async (name, email) => {
    const query = `INSERT INTO customers (name, email) VALUES (?, ?)`;
    const [result] = await db.query(query, [name, email]);
    return { id: result.insertId, name, email };
  },

  updateCustomer: async (id, name, email, phone, address) => {
    const query = `
      UPDATE customers 
      SET name = ?, email = ?, phone = ?, address = ? 
      WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    `;
    const [result] = await db.query(query, [name, email, phone, address, id]);
    return result;
  },

  deleteCustomer: async (id) => {
    const query = `UPDATE customers SET is_deleted = 1 WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    return result;
  },
};

module.exports = CustomerModel;