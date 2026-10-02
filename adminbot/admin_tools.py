import os
import json
import pymysql
from typing import Optional
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ecommerce_db"),
        cursorclass=pymysql.cursors.DictCursor
    )

# --- 1. Analytics & Sales Reporting ---

@tool
def get_sales_analytics(time_frame: str = "today") -> str:
    """
    Fetch sales summary and revenue metrics for 'today', 'this_month', or 'comparison'.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if time_frame == "today":
                sql = "SELECT COUNT(id) as total_orders, IFNULL(SUM(total_amount), 0) as total_revenue FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'Cancelled' AND is_deleted = 0"
            elif time_frame == "this_month":
                sql = "SELECT COUNT(id) as total_orders, IFNULL(SUM(total_amount), 0) as total_revenue FROM orders WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status != 'Cancelled' AND is_deleted = 0"
            else:
                sql = """
                    SELECT 
                        IFNULL(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) THEN total_amount ELSE 0 END), 0) as current_month_revenue,
                        IFNULL(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN total_amount ELSE 0 END), 0) as prev_month_revenue
                    FROM orders WHERE status != 'Cancelled' AND is_deleted = 0
                """
            cursor.execute(sql)
            res = cursor.fetchone()
            return json.dumps(res, default=str)
    finally:
        conn.close()

@tool
def get_top_performing_products(limit: int = 5) -> str:
    """Fetch top selling products based on total quantity sold."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT p.id, p.name, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as total_revenue
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status != 'Cancelled' AND o.is_deleted = 0 AND p.is_deleted = 0
                GROUP BY p.id, p.name
                ORDER BY total_sold DESC LIMIT %s
            """
            cursor.execute(sql, (limit,))
            return json.dumps(cursor.fetchall(), default=str)
    finally:
        conn.close()

@tool
def get_low_performing_products(days: int = 30) -> str:
    """Fetch products that have zero sales in the last N days."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT id, name, price, stock_count 
                FROM products 
                WHERE id NOT IN (
                    SELECT DISTINCT product_id FROM order_items oi
                    JOIN orders o ON oi.order_id = o.id
                    WHERE o.created_at >= NOW() - INTERVAL %s DAY AND o.is_deleted = 0
                ) AND is_deleted = 0
            """
            cursor.execute(sql, (days,))
            return json.dumps(cursor.fetchall(), default=str)
    finally:
        conn.close()

@tool
def get_vip_customers(limit: int = 5) -> str:
    """Fetch highest spending customers."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT c.id, c.name, c.email, c.phone, SUM(o.total_amount) as total_spent, COUNT(o.id) as order_count
                FROM orders o
                JOIN customers c ON o.customer_id = c.id
                WHERE o.status != 'Cancelled' AND o.is_deleted = 0 AND c.is_deleted = 0
                GROUP BY c.id, c.name, c.email, c.phone
                ORDER BY total_spent DESC LIMIT %s
            """
            cursor.execute(sql, (limit,))
            return json.dumps(cursor.fetchall(), default=str)
    finally:
        conn.close()


# --- 2. Order Management & Logistics ---

@tool
def get_order_details(order_id: int) -> str:
    """Fetch details and status of a specific order ID including customer details and items."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE o.id = %s AND o.is_deleted = 0
            """
            cursor.execute(sql, (order_id,))
            order = cursor.fetchone()
            if not order:
                return json.dumps({"error": "Order not found"})
            
            # Fetch order items
            cursor.execute("SELECT product_name, quantity, price FROM order_items WHERE order_id = %s", (order_id,))
            order["items"] = cursor.fetchall()
            return json.dumps(order, default=str)
    finally:
        conn.close()

@tool
def update_bulk_order_status(from_status: str, to_status: str) -> str:
    """Update status for all orders currently in a specific status (e.g., Processing -> Shipped)."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "UPDATE orders SET status = %s WHERE status = %s AND is_deleted = 0"
            cursor.execute(sql, (to_status, from_status))
            updated_count = cursor.rowcount
            conn.commit()
            return json.dumps({"status": "success", "updated_orders": updated_count})
    finally:
        conn.close()

@tool
def cancel_and_refund_order(order_id: int) -> str:
    """Cancel an order and process refund status."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "UPDATE orders SET status = 'Cancelled' WHERE id = %s AND is_deleted = 0"
            cursor.execute(sql, (order_id,))
            conn.commit()
            return json.dumps({"status": "success", "message": f"Order #{order_id} status updated to Cancelled."})
    finally:
        conn.close()


# --- 3. Inventory & Warehouse Management ---

@tool
def get_low_stock_products(threshold: int = 10) -> str:
    """List products where stock count is less than or equal to the threshold."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT id, name, stock_count, price FROM products WHERE stock_count <= %s AND is_deleted = 0"
            cursor.execute(sql, (threshold,))
            return json.dumps(cursor.fetchall(), default=str)
    finally:
        conn.close()

@tool
def update_product_stock_by_id(product_id: int, stock_change: int) -> str:
    """Update stock quantity for a product using Product ID (e.g., +50 or -10)."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "UPDATE products SET stock_count = stock_count + %s WHERE id = %s AND is_deleted = 0"
            cursor.execute(sql, (stock_change, product_id))
            conn.commit()
            return json.dumps({"status": "success", "message": f"Stock updated for Product ID {product_id}"})
    finally:
        conn.close()

@tool
def apply_category_discount(category_name: str, discount_percent: float) -> str:
    """Apply percentage discount to all products in a given category."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                UPDATE products p
                JOIN categories c ON p.category_id = c.id
                SET p.price = p.price * (1 - (%s / 100))
                WHERE c.Name LIKE %s AND p.is_deleted = 0 AND c.is_deleted = 0
            """
            cursor.execute(sql, (discount_percent, f"%{category_name}%"))
            updated_count = cursor.rowcount
            conn.commit()
            return json.dumps({"status": "success", "message": f"{discount_percent}% discount applied to {updated_count} products in category '{category_name}'."})
    finally:
        conn.close()

@tool
def get_restock_recommendations(days: int = 30) -> str:
    """Predictive restock recommendations based on sales velocity of the last 30 days."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT p.id, p.name, p.stock_count,
                       IFNULL(SUM(oi.quantity), 0) as total_sold_last_30_days,
                       CEIL(IFNULL(SUM(oi.quantity), 0) * 1.5) as recommended_restock_qty
                FROM products p
                LEFT JOIN order_items oi ON p.id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= NOW() - INTERVAL %s DAY AND o.is_deleted = 0
                WHERE p.is_deleted = 0
                GROUP BY p.id, p.name, p.stock_count
                HAVING p.stock_count < recommended_restock_qty
            """
            cursor.execute(sql, (days,))
            return json.dumps(cursor.fetchall(), default=str)
    finally:
        conn.close()