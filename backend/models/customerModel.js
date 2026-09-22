const db = require("../config/db");

const CustomerModel = {
  getAllCustomers: async (userId) => {
    if (!userId) throw new Error("User ID is required to fetch customers");
    const query = `
      SELECT 
        c.id, 
        c.user_id,
        c.name, 
        c.email, 
        c.phone,
        c.address,
        c.created_at,
        c.updated_at,
        COUNT(o.id) AS total_orders, 
        IFNULL(SUM(o.total_amount), 0) AS total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
      WHERE (c.is_deleted = 0 OR c.is_deleted IS NULL)
        AND c.user_id = ?
      GROUP BY c.id, c.user_id, c.name, c.email, c.phone, c.address, c.created_at, c.updated_at
      ORDER BY c.id DESC;
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  },

  getCustomerById: async (id, userId) => {
    if (!userId) throw new Error("User ID is required");

    const query = `
      SELECT 
        c.id, 
        c.user_id,
        c.name, 
        c.email, 
        c.phone,
        c.address,
        c.created_at,
        c.updated_at,
        COUNT(o.id) AS total_orders,
        IFNULL(SUM(o.total_amount), 0) AS total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
      WHERE c.id = ? 
        AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
        AND c.user_id = ?
      GROUP BY c.id, c.user_id, c.name, c.email, c.phone, c.address, c.created_at, c.updated_at;
    `;
    const [rows] = await db.query(query, [id, userId]);
    
    // Check if valid row returned and id isn't null from GROUP BY
    if (!rows[0] || rows[0].id === null) {
      return null;
    }
    
    return rows[0];
  },

  getCustomerOrders: async (customerId, userId) => {
    const query = `
      SELECT 
        o.id,
        o.total_amount AS totalAmount,
        o.payment_method AS paymentMethod,
        o.status,
        o.created_at AS createdAt
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.customer_id = ?
        AND c.user_id = ?
        AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
      ORDER BY o.created_at DESC;
    `;
    const [rows] = await db.query(query, [customerId, userId]);
    return rows;
  },

  getCustomerByEmail: async (email, userId) => {
    const query = `
      SELECT * FROM customers 
      WHERE LOWER(email) = LOWER(?) 
        AND (is_deleted = 0 OR is_deleted IS NULL)
        AND (user_id = ? OR ? IS NULL)
      LIMIT 1;
    `;
    const [rows] = await db.query(query, [email, userId || null, userId || null]);
    return rows[0] || null;
  },

  createCustomer: async (data, userId) => {
    const { name, email, phone = "", address = "" } = data;
    const query = `
      INSERT INTO customers (name, email, phone, address, user_id, is_deleted) 
      VALUES (?, ?, ?, ?, ?, 0);
    `;
    const [result] = await db.query(query, [
      (name || "").trim(),
      (email || "").trim().toLowerCase(),
      phone,
      address,
      userId || null
    ]);
    return { id: result.insertId, name, email, phone, address };
  },

  updateCustomer: async (id, data, userId) => {
    const { name, email, phone, address } = data;
    const query = `
      UPDATE customers 
      SET name = ?, email = ?, phone = ?, address = ? 
      WHERE id = ? 
        AND (is_deleted = 0 OR is_deleted IS NULL)
        AND (user_id = ? OR ? IS NULL);
    `;
    const [result] = await db.query(query, [
      name, 
      email ? email.toLowerCase() : "", 
      phone, 
      address, 
      id, 
      userId || null, 
      userId || null
    ]);
    return result;
  },

  deleteCustomer: async (id, userId) => {
    const query = `
      UPDATE customers 
      SET is_deleted = 1 
      WHERE id = ? AND (user_id = ? OR ? IS NULL);
    `;
    const [result] = await db.query(query, [id, userId || null, userId || null]);
    return result;
  },
};

module.exports = CustomerModel;