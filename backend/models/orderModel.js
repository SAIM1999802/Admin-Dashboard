const db = require("../config/db");

const createOrder = async (data, userId) => {
  const {
    customerName = "",
    customerEmail = "",
    shippingAddress = "",
    totalAmount,
    paymentMethod,
    items,
  } = data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const safeEmail = (customerEmail || "").trim().toLowerCase();
    const safeName = (customerName || "").trim();

    let customerId = null;

    if (safeEmail) {
      const [existingCustomer] = await connection.query(
        "SELECT id FROM customers WHERE LOWER(email) = LOWER(?)",
        [safeEmail]
      );

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
      } else {
        const [newCust] = await connection.query(
          "INSERT INTO customers (name, email, address) VALUES (?, ?, ?)",
          [safeName, safeEmail, shippingAddress || ""]
        );
        customerId = newCust.insertId;
      }
    }

    const orderQuery = `
      INSERT INTO orders (customer_name, customer_email, shipping_address, total_amount, payment_method, status, user_id, customer_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [orderResult] = await connection.query(orderQuery, [
      safeName,
      safeEmail,
      shippingAddress || "",
      parseFloat(totalAmount) || 0.0,
      paymentMethod ? paymentMethod.trim() : "Cash on Delivery",
      "Pending",
      userId,
      customerId,
    ]);

    const orderId = orderResult.insertId;

    if (Array.isArray(items) && items.length > 0) {
      const itemValues = [];

      for (const item of items) {
        const prodId = item.id || item.product_id;
        const itemQty = parseInt(item.quantity, 10) || 1;
        const itemPrice = parseFloat(item.price) || 0.0;
        const itemName = item.name || item.product_name || `Product #${prodId}`;

        const [prodCheck] = await connection.query(
          `SELECT stock_count FROM products WHERE id = ? AND user_id = ? AND is_deleted = 0 FOR UPDATE`,
          [prodId, userId]
        );

        if (!prodCheck[0] || prodCheck[0].stock_count < itemQty) {
          throw new Error(`Insufficient stock for product: ${itemName}`);
        }

        await connection.query(
          `UPDATE products SET stock_count = stock_count - ? WHERE id = ? AND user_id = ? AND is_deleted = 0`,
          [itemQty, prodId, userId]
        );

        itemValues.push([orderId, prodId, itemName, itemQty, itemPrice]);
      }

      const itemsQuery = `
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
        VALUES ?
      `;
      await connection.query(itemsQuery, [itemValues]);
    }

    await connection.commit();
    return { id: orderId, message: "Order created successfully" };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateOrderStatus = async (id, status, userId) => {
  const query = "UPDATE orders SET status = ? WHERE id = ? AND user_id = ?";
  const [result] = await db.query(query, [status, id, userId]);
  return result;
};

const getOrderById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
      id, 
      customer_name, 
      customer_email, 
      shipping_address, 
      total_amount, 
      payment_method, 
      status, 
      created_at 
     FROM orders 
     WHERE id = ?`,
    [id]
  );

  if (!rows[0]) return null;

  const [items] = await db.query(
    `SELECT 
      oi.product_id, 
      oi.product_name, 
      oi.quantity, 
      oi.price,
      p.image AS image_url,
      p.image,
      p.description
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [id]
  );

  return {
    ...rows[0],
    items: items || [],
  };
};

const updateOrder = async (id, data, userId) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingOrders] = await connection.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)",
      [id, userId]
    );

    if (existingOrders.length === 0) {
      throw new Error("Order not found or unauthorized");
    }

    const currentOrder = existingOrders[0];

    const customerName = data.customerName !== undefined ? data.customerName : currentOrder.customer_name;
    const customerEmail = data.customerEmail !== undefined ? data.customerEmail : currentOrder.customer_email;
    const shippingAddress = data.shippingAddress !== undefined ? data.shippingAddress : currentOrder.shipping_address;
    const totalAmount = data.totalAmount !== undefined ? data.totalAmount : currentOrder.total_amount;
    const paymentMethod = data.paymentMethod !== undefined ? data.paymentMethod : currentOrder.payment_method;
    const status = data.status !== undefined ? data.status : currentOrder.status;

    const safeEmail = (customerEmail || "").toString().trim().toLowerCase();
    const safeName = (customerName || "").toString().trim();

    let customerId = currentOrder.customer_id;

    if (safeEmail) {
      const [existingCustomer] = await connection.query(
        "SELECT id FROM customers WHERE LOWER(email) = LOWER(?)",
        [safeEmail]
      );

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
      } else {
        const [newCust] = await connection.query(
          "INSERT INTO customers (name, email, address) VALUES (?, ?, ?)",
          [safeName, safeEmail, shippingAddress || ""]
        );
        customerId = newCust.insertId;
      }
    }

    const query = `
      UPDATE orders 
      SET 
        customer_name = ?, 
        customer_email = ?, 
        shipping_address = ?, 
        total_amount = ?, 
        payment_method = ?, 
        status = ?,
        customer_id = ? 
      WHERE id = ? AND user_id = ?
    `;

    await connection.query(query, [
      safeName,
      safeEmail,
      shippingAddress || "",
      parseFloat(totalAmount) || 0.0,
      paymentMethod ? String(paymentMethod).trim() : "Cash on Delivery",
      status,
      customerId,
      id,
      userId,
    ]);

    if (Array.isArray(data.items)) {
      const [oldItems] = await connection.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [id]
      );

      // Map current items in order
      const oldItemMap = new Map();
      oldItems.forEach((item) => {
        oldItemMap.set(Number(item.product_id), Number(item.quantity));
      });

      // Map incoming updated items
      const newItemMap = new Map();
      data.items.forEach((item) => {
        const prodId = Number(item.product_id || item.id);
        const qty = parseInt(item.quantity, 10) || 1;
        newItemMap.set(prodId, qty);
      });

      // Combine all product IDs involved
      const allProductIds = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);

      for (const prodId of allProductIds) {
        const oldQty = oldItemMap.get(prodId) || 0;
        const newQty = newItemMap.get(prodId) || 0;
        const diff = newQty - oldQty;

        if (diff > 0) {
          // Additional quantity requested: check stock
          const [prodCheck] = await connection.query(
            "SELECT stock_count FROM products WHERE id = ? AND user_id = ? AND is_deleted = 0 FOR UPDATE",
            [prodId, userId]
          );

          if (!prodCheck[0] || prodCheck[0].stock_count < diff) {
            throw new Error(`Insufficient stock available for product ID: ${prodId}`);
          }

          await connection.query(
            "UPDATE products SET stock_count = stock_count - ? WHERE id = ? AND user_id = ?",
            [diff, prodId, userId]
          );
        } else if (diff < 0) {
          // Quantity reduced: restore stock
          await connection.query(
            "UPDATE products SET stock_count = stock_count + ? WHERE id = ? AND user_id = ?",
            [Math.abs(diff), prodId, userId]
          );
        }
      }

      // Replace old line items
      await connection.query("DELETE FROM order_items WHERE order_id = ?", [id]);

      if (data.items.length > 0) {
        const itemValues = data.items.map((item) => [
          id,
          item.product_id || item.id,
          item.product_name || item.name,
          parseInt(item.quantity, 10) || 1,
          parseFloat(item.price) || 0.0,
        ]);

        const itemsQuery = `
          INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
          VALUES ?
        `;
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

const getAllOrders = async (userId) => {
  const query = `
    SELECT 
      id, 
      customer_name AS customerName, 
      customer_email AS customerEmail, 
      shipping_address AS shippingAddress, 
      total_amount AS totalAmount, 
      payment_method AS paymentMethod, 
      status, 
      created_at AS createdAt
    FROM orders 
    WHERE user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
    ORDER BY created_at DESC
  `;
  const [rows] = await db.query(query, [userId]);
  return rows;
};

const getDeletedOrders = async (userId) => {
  const query = `
    SELECT 
      id, 
      customer_name AS customerName, 
      customer_email AS customerEmail, 
      shipping_address AS shippingAddress, 
      total_amount AS totalAmount, 
      payment_method AS paymentMethod, 
      status, 
      created_at AS createdAt
    FROM orders 
    WHERE user_id = ? AND is_deleted = 1
    ORDER BY created_at DESC
  `;
  const [rows] = await db.query(query, [userId]);
  return rows;
};

const softDeleteOrder = async (id, userId) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingOrders] = await connection.query(
      "SELECT id FROM orders WHERE id = ? AND user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)",
      [id, userId]
    );

    if (existingOrders.length === 0) {
      throw new Error("Order not found or unauthorized");
    }

    // 1. Fetch line items to restore stock
    const [items] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [id]
    );

    // 2. Restore stock for each item
    for (const item of items) {
      await connection.query(
        "UPDATE products SET stock_count = stock_count + ? WHERE id = ? AND user_id = ?",
        [item.quantity, item.product_id, userId]
      );
    }

    // 3. Mark as soft-deleted
    const [result] = await connection.query(
      "UPDATE orders SET is_deleted = 1, status = 'Deleted' WHERE id = ? AND user_id = ?",
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
  updateOrderStatus,
  getOrderById,
  updateOrder,
  getDeletedOrders,
  softDeleteOrder,
};