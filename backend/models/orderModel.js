const db = require("../config/db");

const createOrder = async (data, userId) => {
  const {
    customerId: inputCustomerId,
    customerName: inputName,
    customerEmail: inputEmail,
    shippingAddress = "",
    totalAmount,
    paymentMethod,
    items,
    stripeSessionId = null,
  } = data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let customerId = inputCustomerId || null;
    const safeName = String(inputName || "").trim();
    const safeEmail = String(inputEmail || "").trim().toLowerCase();

    if (customerId) {
      const [customerRows] = await connection.query(
        `SELECT id FROM customers WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1`,
        [customerId, userId]
      );

      if (customerRows.length === 0) {
        throw new Error("Selected customer not found");
      }
      customerId = customerRows[0].id;
    }

    if (!customerId && safeEmail) {
      const [existingCustomer] = await connection.query(
        `SELECT id FROM customers WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1`,
        [safeEmail]
      );

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
        await connection.query(
          `UPDATE customers SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [safeName, shippingAddress || "", customerId]
        );
      } else {
        if (!safeName) {
          throw new Error("Customer name is required");
        }
        const [newCustomer] = await connection.query(
          `INSERT INTO customers (name, email, address, user_id, is_deleted) VALUES (?, ?, ?, ?, 0)`,
          [safeName, safeEmail, shippingAddress || "", userId]
        );
        customerId = newCustomer.insertId;
      }
    }

    if (!customerId) {
      throw new Error("Customer record is required to create an order");
    }

    const orderQuery = `
      INSERT INTO orders (customer_id, shipping_address, total_amount, payment_method, status, user_id, stripe_session_id, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const [orderResult] = await connection.query(orderQuery, [
      customerId,
      shippingAddress || "",
      parseFloat(totalAmount) || 0.0,
      paymentMethod ? String(paymentMethod).trim() : "Cash on Delivery",
      "Pending",
      userId,
      stripeSessionId,
    ]);

    const orderId = orderResult.insertId;

    if (Array.isArray(items) && items.length > 0) {
      const itemValues = [];

      for (const item of items) {
        const prodId = item.id || item.product_id;
        const itemQty = parseInt(item.quantity, 10) || 1;
        const itemPrice = parseFloat(item.price) || 0.0;
        const itemName = item.name || item.product_name || `Product #${prodId}`;

        if (!prodId) {
          throw new Error("Product ID is missing");
        }

        const [prodCheck] = await connection.query(
          `SELECT id, stock_count FROM products WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
          [prodId]
        );

        if (!prodCheck[0]) {
          throw new Error(`Product not found: ${itemName}`);
        }

        if (Number(prodCheck[0].stock_count) < itemQty) {
          throw new Error(`Insufficient stock for product: ${itemName}`);
        }

        await connection.query(
          `UPDATE products SET stock_count = stock_count - ? WHERE id = ? AND is_deleted = 0`,
          [itemQty, prodId]
        );

        itemValues.push([orderId, prodId, itemName, itemQty, itemPrice]);
      }

      if (itemValues.length > 0) {
        const itemsQuery = `INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES ?`;
        await connection.query(itemsQuery, [itemValues]);
      }
    }

    await connection.commit();
    return { id: orderId, customerId, message: "Order created successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const markOrderPaidBySessionId = async (sessionId) => {
  const [result] = await db.query(
    `UPDATE orders SET status = 'Paid' WHERE stripe_session_id = ?`,
    [sessionId]
  );
  return result;
};

const getOrderBySessionId = async (sessionId) => {
  const [rows] = await db.query(
    `SELECT id, status FROM orders WHERE stripe_session_id = ?`,
    [sessionId]
  );
  return rows[0] || null;
};

const getMyOrders = async (userId, userEmail) => {
  const query = `
    SELECT 
      o.id AS order_id, o.customer_id,
      IFNULL(c.name, 'N/A') AS customer_name,
      IFNULL(c.email, 'N/A') AS customer_email,
      o.shipping_address, o.total_amount AS total_price,
      o.payment_method, o.status, o.created_at
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE (o.user_id = ? OR LOWER(c.email) = LOWER(?))
      AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
    ORDER BY o.created_at DESC
  `;

  const [orders] = await db.query(query, [userId, userEmail || ""]);
  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => order.order_id);
  const [items] = await db.query(
    `
    SELECT oi.order_id, oi.product_id, oi.product_name AS name, oi.quantity, oi.price, IFNULL(p.image, '') AS image
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id IN (?)
    `,
    [orderIds]
  );

  return orders.map((order) => ({
    ...order,
    items: items.filter((item) => item.order_id === order.order_id),
  }));
};

const getAllOrders = async (userId) => {
  const query = `
    SELECT 
      o.id, o.customer_id AS customerId,
      IFNULL(c.name, 'N/A') AS customerName,
      IFNULL(c.email, 'N/A') AS customerEmail,
      o.shipping_address AS shippingAddress,
      o.total_amount AS totalAmount,
      o.payment_method AS paymentMethod,
      o.status, o.created_at AS createdAt
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.id
    WHERE o.user_id = ? AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
    ORDER BY o.created_at ASC
  `;

  const [rows] = await db.query(query, [userId]);
  return rows;
};

const getOrderById = async (id, userId) => {
  const [rows] = await db.query(
    `
    SELECT 
      o.id, o.customer_id,
      IFNULL(c.name, 'N/A') AS customer_name,
      IFNULL(c.email, 'N/A') AS customer_email,
      o.shipping_address, o.total_amount, o.payment_method, o.status, o.created_at
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ? AND (o.user_id = ? OR ? IS NULL)
    `,
    [id, userId || null, userId || null]
  );

  if (!rows[0]) return null;

  const [items] = await db.query(
    `
    SELECT oi.product_id, oi.product_name, oi.quantity, oi.price, p.image AS image_url, p.image, p.description
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
    `,
    [id]
  );

  return { ...rows[0], items: items || [] };
};

const updateOrder = async (id, data, userId) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingOrders] = await connection.query(
      `SELECT * FROM orders WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [id, userId]
    );

    if (existingOrders.length === 0) {
      throw new Error("Order not found or unauthorized");
    }

    const currentOrder = existingOrders[0];
    let customerId = data.customerId !== undefined ? data.customerId : currentOrder.customer_id;
    const shippingAddress = data.shippingAddress !== undefined ? data.shippingAddress : currentOrder.shipping_address;
    const totalAmount = data.totalAmount !== undefined ? data.totalAmount : currentOrder.total_amount;
    const paymentMethod = data.paymentMethod !== undefined ? data.paymentMethod : currentOrder.payment_method;
    const status = data.status !== undefined ? data.status : currentOrder.status;

    if (data.customerEmail && !customerId) {
      const [existingCustomer] = await connection.query(
        `SELECT id FROM customers WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) LIMIT 1`,
        [data.customerEmail.trim().toLowerCase(), userId]
      );
      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
      }
    }

    if (!customerId) {
      throw new Error("Customer record is required");
    }

    const query = `
      UPDATE orders 
      SET customer_id = ?, shipping_address = ?, total_amount = ?, payment_method = ?, status = ?
      WHERE id = ? AND user_id = ?
    `;

    await connection.query(query, [
      customerId,
      shippingAddress || "",
      parseFloat(totalAmount) || 0.0,
      paymentMethod ? String(paymentMethod).trim() : "Cash on Delivery",
      status,
      id,
      userId,
    ]);

    if (Array.isArray(data.items)) {
      const [oldItems] = await connection.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
        [id]
      );

      const oldItemMap = new Map();
      oldItems.forEach((item) => oldItemMap.set(Number(item.product_id), Number(item.quantity)));

      const newItemMap = new Map();
      data.items.forEach((item) => {
        const prodId = Number(item.product_id || item.id);
        const qty = parseInt(item.quantity, 10) || 1;
        newItemMap.set(prodId, qty);
      });

      const allProductIds = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);

      for (const prodId of allProductIds) {
        const oldQty = oldItemMap.get(prodId) || 0;
        const newQty = newItemMap.get(prodId) || 0;
        const diff = newQty - oldQty;

        if (diff > 0) {
          const [prodCheck] = await connection.query(
            `SELECT stock_count FROM products WHERE id = ? AND is_deleted = 0 FOR UPDATE`,
            [prodId]
          );

          if (!prodCheck[0] || prodCheck[0].stock_count < diff) {
            throw new Error(`Insufficient stock available for product ID: ${prodId}`);
          }

          await connection.query(
            `UPDATE products SET stock_count = stock_count - ? WHERE id = ? AND is_deleted = 0`,
            [diff, prodId]
          );
        } else if (diff < 0) {
          await connection.query(
            `UPDATE products SET stock_count = stock_count + ? WHERE id = ? AND is_deleted = 0`,
            [Math.abs(diff), prodId]
          );
        }
      }

      await connection.query(`DELETE FROM order_items WHERE order_id = ?`, [id]);

      if (data.items.length > 0) {
        const itemValues = data.items.map((item) => [
          id,
          item.product_id || item.id,
          item.product_name || item.name,
          parseInt(item.quantity, 10) || 1,
          parseFloat(item.price) || 0.0,
        ]);

        const itemsQuery = `INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES ?`;
        await connection.query(itemsQuery, [itemValues]);
      }
    }

    await connection.commit();
    return { message: "Order updated successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateOrderStatus = async (id, status, userId) => {
  const query = `UPDATE orders SET status = ? WHERE id = ? AND user_id = ?`;
  const [result] = await db.query(query, [status, id, userId]);
  return result;
};

const getDeletedOrders = async (userId) => {
  const query = `
    SELECT 
      o.id, o.customer_id AS customerId,
      IFNULL(c.name, 'N/A') AS customerName,
      IFNULL(c.email, 'N/A') AS customerEmail,
      o.shipping_address AS shippingAddress,
      o.total_amount AS totalAmount,
      o.payment_method AS paymentMethod,
      o.status, o.created_at AS createdAt
    FROM orders o
    INNER JOIN customers c ON o.customer_id = c.id
    WHERE o.user_id = ? AND o.is_deleted = 1
    ORDER BY o.created_at DESC
  `;

  const [rows] = await db.query(query, [userId]);
  return rows;
};

const softDeleteOrder = async (id, userId) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingOrders] = await connection.query(
      `SELECT id FROM orders WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [id, userId]
    );

    if (existingOrders.length === 0) {
      throw new Error("Order not found or unauthorized");
    }

    const [items] = await connection.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
      [id]
    );

    for (const item of items) {
      await connection.query(
        `UPDATE products SET stock_count = stock_count + ? WHERE id = ?`,
        [item.quantity, item.product_id]
      );
    }

    const [result] = await connection.query(
      `UPDATE orders SET is_deleted = 1, status = 'Deleted' WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  markOrderPaidBySessionId,
  getOrderBySessionId,
  updateOrderStatus,
  getOrderById,
  updateOrder,
  getDeletedOrders,
  softDeleteOrder,
  getMyOrders,
};