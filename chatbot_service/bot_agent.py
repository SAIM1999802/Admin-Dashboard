import json
import os
from typing import Optional, Tuple
import torch
from dotenv import load_dotenv

from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langchain.agents import create_agent

from db import get_db_connection, save_chat_message, get_lstm_states, save_lstm_states
from lstm_memory import memory_encoder

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is missing in .env file!")

# --- Tools Definition ---

@tool
def search_products(
    query: Optional[str] = None,
    category_name: Optional[str] = None,
    max_price: Optional[float] = None,
) -> str:
    """
    Search available products by keyword, category, or maximum price filter.
    Returns matching products from the database.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT p.id, p.name, p.price, p.stock_count, p.description, c.Name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_deleted = 0
            """
            params = []
            if query:
                sql += " AND (p.name LIKE %s OR p.description LIKE %s)"
                like_str = f"%{query}%"
                params.extend([like_str, like_str])
            if category_name:
                sql += " AND c.Name LIKE %s"
                params.append(f"%{category_name}%")
            if max_price is not None:
                sql += " AND p.price <= %s"
                params.append(max_price)

            cursor.execute(sql, params)
            products = cursor.fetchall()

            for p in products:
                p["price"] = float(p["price"])
            return json.dumps(products)
    finally:
        conn.close()

@tool
def list_categories() -> str:
    """Get all available product categories."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, Name FROM categories WHERE is_deleted = 0")
            categories = cursor.fetchall()
            return json.dumps(categories)
    finally:
        conn.close()

@tool
def get_user_orders(user_id: Optional[int] = None) -> str:
    """Fetch order details and shipment status for a given user_id."""
    if not user_id:
        return json.dumps({"error": "User authentication required to view order status."})

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """ 
                SELECT o.id as order_id, o.total_amount, o.status, o.created_at, o.shipping_address,
                       oi.product_name, oi.quantity, oi.price
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.user_id = %s AND o.is_deleted = 0
                ORDER BY o.created_at DESC
                """
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()

            orders_map = {}
            for r in rows:
                oid = r["order_id"]
                if oid not in orders_map:
                    orders_map[oid] = {
                        "order_id": oid,
                        "total_amount": float(r["total_amount"]),
                        "status": r["status"],
                        "created_at": str(r["created_at"]),
                        "items": [],
                    }

                if r.get("product_name"):
                    orders_map[oid]["items"].append(
                        {
                            "product_name": r["product_name"],
                            "quantity": r["quantity"],
                            "price": float(r["price"]),
                        }
                    )
            return json.dumps(list(orders_map.values()))
    finally:
        conn.close()

# --- 1. Cart System Tools ---

@tool
def add_to_cart(user_id: Optional[int], product_id: int, quantity: int = 1) -> str:
    """Adds a specified quantity of a product to the user's shopping cart."""
    if not user_id:
        return json.dumps({"error": "User authentication required to manage cart."})

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if product is already in cart
            sql_check = "SELECT id, quantity FROM cart_items WHERE user_id = %s AND product_id = %s"
            cursor.execute(sql_check, (user_id, product_id))
            item = cursor.fetchone()

            if item:
                new_qty = item["quantity"] + quantity
                sql_update = "UPDATE cart_items SET quantity = %s WHERE id = %s"
                cursor.execute(sql_update, (new_qty, item["id"]))
            else:
                sql_insert = "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (%s, %s, %s)"
                cursor.execute(sql_insert, (user_id, product_id, quantity))

            conn.commit()
            return json.dumps({"status": "success", "message": f"Product {product_id} added/updated in cart."})
    finally:
        conn.close()

@tool
def view_cart(user_id: Optional[int]) -> str:
    """Fetches all items currently present in the user's shopping cart."""
    if not user_id:
        return json.dumps({"error": "User authentication required to view cart."})

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT ci.id as cart_item_id, p.id as product_id, p.name, p.price, ci.quantity
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = %s
            """
            cursor.execute(sql, (user_id,))
            cart_items = cursor.fetchall()
            
            for item in cart_items:
                item["price"] = float(item["price"])
                
            return json.dumps(cart_items)
    finally:
        conn.close()


# --- 2. Recommendation Engine Tool ---

@tool
def get_recommendations(user_id: Optional[int] = None, category_id: Optional[int] = None) -> str:
    """
    Recommends top trending or related products based on category or general popularity.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT p.id, p.name, p.price, p.description, c.Name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_deleted = 0
            """
            params = []
            if category_id:
                sql += " AND p.category_id = %s"
                params.append(category_id)
            
            sql += " ORDER BY p.stock_count DESC LIMIT 4" # Simple trend rule
            cursor.execute(sql, params)
            recs = cursor.fetchall()

            for r in recs:
                r["price"] = float(r["price"])
            return json.dumps(recs)
    finally:
        conn.close()


# --- 3. Multi-modal Image Analysis Tool (Mock/Hook) ---

@tool
def analyze_product_image(image_url: str) -> str:
    """
    Analyzes an uploaded product image URL to identify object types, color, and attributes.
    Useful for visual search or product verification.
    """
    # Is tool ko aap future me Gemini Vision ya MobileNet classifier se connect kar sakte ho
    return json.dumps({
        "status": "success",
        "detected_features": ["black leather jacket", "zipper", "casual outerwear"],
        "suggested_category": "Clothing",
        "image_url": image_url
    })
    
# --- Agent Initialization ---

llm = ChatGroq(model="openai/gpt-oss-120b", groq_api_key=groq_api_key, temperature=0)
tools = [search_products, list_categories, get_user_orders,add_to_cart,view_cart,get_recommendations,analyze_product_image ]

system_prompt = (
    "You are Sam Bot, an AI shopping assistant for our e-commerce platform.\n"
    "Rules:\n"
    "1. Always give accurate information based strictly on tool results. Never invent products or prices.\n"
    "2. When checking order status, pass the user_id provided in the prompt context to the get_user_orders tool.\n"
    "3. NEVER return product lists as Markdown Tables.\n"
    "4. Always present each product line-by-line as an itemized list using this EXACT format:\n\n"
    "   * **[Product Name](/products/detail/{id})** - ${Price}\n"
    "     * Category: {Category}\n"
    "     * Description: {Description}\n"
    "     * Stock: {Stock} units available\n\n"
    "5. Keep replies clear, polite, and directly answer the user's question."
)

sam_agent = create_agent(tools=tools, model=llm, system_prompt=system_prompt)


def run_chat(
    message: str, 
    user_id: Optional[int] = None, 
    prev_h: Optional[torch.Tensor] = None, 
    prev_c: Optional[torch.Tensor] = None
) -> Tuple[str, Optional[torch.Tensor], Optional[torch.Tensor]]:
    """
    Runs chat turn using Groq agent and updates LSTM states.
    Returns: (bot_response, next_h, next_c)
    """
    h, c = prev_h, prev_c

    # Agar direct tensors nahi diye to DB se fetch karo
    if user_id and (h is None or c is None):
        h, c = get_lstm_states(user_id)

    if user_id:
        save_chat_message(user_id=user_id, role="user", content=message)

    lstm_status_str = "Initialized (New State)" if h is None else f"Active Vector Shape: {list(h.shape)}"

    prompt = (
        f"Context User ID: {user_id if user_id else 'Guest'}\n"
        f"LSTM Memory Vector Context: {lstm_status_str}\n"
        f"User Query: {message}"
    )

    try:
        result = sam_agent.invoke({"messages": [{"role": "user", "content": prompt}]})
        raw_content = result["messages"][-1].content

        if isinstance(raw_content, list):
            bot_response = "".join(
                [
                    item.get("text", "") if isinstance(item, dict) else str(item)
                    for item in raw_content
                ]
            )
        else:
            bot_response = str(raw_content)

        # Update LSTM memory states
        next_h, next_c = memory_encoder.process_turn(
            user_msg=message, bot_msg=bot_response, prev_h=h, prev_c=c
        )

        # Save to DB if logged in
        if user_id:
            save_chat_message(user_id=user_id, role="bot", content=bot_response)
            save_lstm_states(user_id=user_id, hidden_state=next_h, cell_state=next_c)

        return bot_response, next_h, next_c

    except Exception as e:
        print(f"Agent Execution Error: {e}")
        return "An error occurred while processing your request. Please try again.", h, c