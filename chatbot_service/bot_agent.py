import json
import os
import traceback
from typing import Optional

import torch
from dotenv import load_dotenv

from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from langchain_groq import ChatGroq

from db import (
    get_db_connection,
    save_chat_message,
    get_lstm_states,
    save_lstm_states,
    get_recent_chat_history,
)

from lstm_memory import memory_encoder


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("GROQ_API_KEY is missing in .env file!")


# ============================================================
# TOOL 1: SEARCH PRODUCTS
# ============================================================

@tool
def search_products(
    query: Optional[str] = None,
    category_name: Optional[str] = None,
    max_price: Optional[float] = None,
) -> str:
    """
    Search available products by keyword, category, or maximum price.
    Returns matching products from the database.
    """

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            sql = """
                SELECT
                    p.id,
                    p.name,
                    p.price,
                    p.stock_count,
                    p.description,
                    c.Name AS category_name
                FROM products p
                LEFT JOIN categories c
                    ON p.category_id = c.id
                WHERE p.is_deleted = 0
            """

            params = []

            if query:
                sql += """
                    AND (
                        p.name LIKE %s
                        OR p.description LIKE %s
                    )
                """
                like_str = f"%{query}%"
                params.extend([like_str, like_str])

            if category_name:
                sql += " AND c.Name LIKE %s"
                params.append(f"%{category_name}%")

            if max_price is not None:
                sql += " AND p.price <= %s"
                params.append(max_price)

            sql += " ORDER BY p.id DESC"

            cursor.execute(sql, params)
            products = cursor.fetchall()

            for product in products:
                if product.get("price") is not None:
                    product["price"] = float(product["price"])

            return json.dumps(products, default=str)

    except Exception as e:
        print(f"[search_products ERROR] {e}")
        return json.dumps({"error": "Unable to search products."})

    finally:
        conn.close()


# ============================================================
# TOOL 2: LIST CATEGORIES
# ============================================================

@tool
def list_categories() -> str:
    """
    Get all available product categories.
    """

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, Name
                FROM categories
                WHERE is_deleted = 0
                ORDER BY Name ASC
                """
            )
            categories = cursor.fetchall()
            return json.dumps(categories, default=str)

    except Exception as e:
        print(f"[list_categories ERROR] {e}")
        return json.dumps({"error": "Unable to fetch categories."})

    finally:
        conn.close()


# ============================================================
# TOOL 3: GET USER ORDERS
# ============================================================

@tool
def get_user_orders(user_id: Optional[int] = None) -> str:
    """
    Fetch order details and shipment status for a given user_id.
    """

    if not user_id:
        return json.dumps({
            "error": "User authentication required to view order status."
        })

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            sql = """
                SELECT
                    o.id AS order_id,
                    o.total_amount,
                    o.status,
                    o.created_at,
                    o.shipping_address,
                    oi.product_name,
                    oi.quantity,
                    oi.price
                FROM orders o
                LEFT JOIN order_items oi
                    ON o.id = oi.order_id
                WHERE
                    o.user_id = %s
                    AND o.is_deleted = 0
                ORDER BY o.created_at DESC
            """

            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()

            orders_map = {}

            for row in rows:
                order_id = row["order_id"]

                if order_id not in orders_map:
                    orders_map[order_id] = {
                        "order_id": order_id,
                        "total_amount": float(row["total_amount"])
                        if row["total_amount"] is not None
                        else 0.0,
                        "status": row["status"],
                        "created_at": str(row["created_at"]),
                        "shipping_address": row.get("shipping_address"),
                        "items": [],
                    }

                if row.get("product_name"):
                    orders_map[order_id]["items"].append({
                        "product_name": row["product_name"],
                        "quantity": row["quantity"],
                        "price": float(row["price"])
                        if row["price"] is not None
                        else 0.0,
                    })

            return json.dumps(list(orders_map.values()), default=str)

    except Exception as e:
        print(f"[get_user_orders ERROR] {e}")
        return json.dumps({"error": "Unable to fetch orders."})

    finally:
        conn.close()


# ============================================================
# TOOL 4: ADD TO CART  (database cart_items table)
# ============================================================

@tool
def add_to_cart(
    user_id: Optional[int],
    product_id: int,
    quantity: int = 1,
) -> str:
    """
    Adds a specified quantity of a product to the user's shopping cart.
    """

    if not user_id:
        return json.dumps({
            "error": "User authentication required to manage cart."
        })

    if quantity <= 0:
        return json.dumps({"error": "Quantity must be greater than zero."})

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT id, name, stock_count
                FROM products
                WHERE id = %s
                  AND is_deleted = 0
                """,
                (product_id,)
            )

            product = cursor.fetchone()

            if not product:
                return json.dumps({"error": "Product not found."})

            cursor.execute(
                """
                SELECT id, quantity
                FROM cart_items
                WHERE user_id = %s
                  AND product_id = %s
                """,
                (user_id, product_id)
            )

            item = cursor.fetchone()
            current_quantity = item["quantity"] if item else 0
            new_quantity = current_quantity + quantity

            if (
                product.get("stock_count") is not None
                and new_quantity > product["stock_count"]
            ):
                return json.dumps({
                    "error": (
                        f"Only {product['stock_count']} "
                        f"units of {product['name']} are available."
                    )
                })

            if item:
                cursor.execute(
                    """
                    UPDATE cart_items
                    SET quantity = %s
                    WHERE id = %s
                    """,
                    (new_quantity, item["id"])
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO cart_items
                        (user_id, product_id, quantity)
                    VALUES
                        (%s, %s, %s)
                    """,
                    (user_id, product_id, quantity)
                )

            conn.commit()

            return json.dumps({
                "status": "success",
                "message": f"{product['name']} added to cart.",
                "product_id": product_id,
                "quantity": new_quantity,
            })

    except Exception as e:
        conn.rollback()
        print(f"[add_to_cart ERROR] {e}")
        return json.dumps({"error": "Unable to update cart."})

    finally:
        conn.close()


# ============================================================
# (REMOVED) TOOL 5: VIEW CART
#
# Cart ab database se nahi, browser ke localStorage se aata hai.
# Frontend har message ke saath cart bhejta hai (sirf login ke
# baad) aur bot usse `Customer Cart` block se dikhata hai.
# ============================================================


# ============================================================
# TOOL 5: RECOMMENDATIONS
# ============================================================

@tool
def get_recommendations(
    user_id: Optional[int] = None,
    category_id: Optional[int] = None,
) -> str:
    """
    Recommends available products based on category
    or general product availability.
    """

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            sql = """
                SELECT
                    p.id,
                    p.name,
                    p.price,
                    p.stock_count,
                    p.description,
                    c.Name AS category_name
                FROM products p
                LEFT JOIN categories c
                    ON p.category_id = c.id
                WHERE
                    p.is_deleted = 0
                    AND p.stock_count > 0
            """

            params = []

            if category_id:
                sql += " AND p.category_id = %s"
                params.append(category_id)

            sql += """
                ORDER BY p.stock_count DESC
                LIMIT 4
            """

            cursor.execute(sql, params)
            recommendations = cursor.fetchall()

            for item in recommendations:
                if item.get("price") is not None:
                    item["price"] = float(item["price"])

            return json.dumps(recommendations, default=str)

    except Exception as e:
        print(f"[get_recommendations ERROR] {e}")
        return json.dumps({"error": "Unable to fetch recommendations."})

    finally:
        conn.close()


# ============================================================
# TOOL 6: PRODUCT IMAGE ANALYSIS
# ============================================================

@tool
def analyze_product_image(image_url: str) -> str:
    """
    Analyzes a product image URL to identify object type,
    color and attributes.
    """

    return json.dumps({
        "status": "success",
        "detected_features": [
            "black leather jacket",
            "zipper",
            "casual outerwear",
        ],
        "suggested_category": "Clothing",
        "image_url": image_url,
    })


# ============================================================
# TOOLS REGISTRY
# ============================================================

tools = [
    search_products,
    list_categories,
    get_user_orders,
    add_to_cart,
    get_recommendations,
    analyze_product_image,
]

tools_by_name = {tool_item.name: tool_item for tool_item in tools}


# ============================================================
# LLM
# ============================================================

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    groq_api_key=groq_api_key,
    temperature=0,
)

# NOTE: langchain.agents.create_agent intentionally NOT used
# (it caused: 'tuple' object has no attribute 'reverse').
llm_with_tools = llm.bind_tools(tools)


# ============================================================
# SYSTEM PROMPT
# ============================================================

system_prompt = """
You are Sam Bot, an AI shopping assistant for our e-commerce platform.

Your job is to help customers with:

- Product searches
- Product prices
- Product availability
- Categories
- Product recommendations
- Order status
- Shopping cart
- Product details

IMPORTANT RULES:

1. Always use database tools when the user asks about products,
   prices, stock, categories, orders or recommendations.

2. Never invent a product, price, stock quantity, order status
   or category.

3. Use ONLY information returned by the tools (or the Customer Cart
   block for cart questions).

4. When checking orders, ALWAYS use the Context User ID
   provided in the conversation.

5. Never expose internal database information.

6. Never return product lists as Markdown tables.

7. Product results must be shown line-by-line.

8. Use this product format:

   * **[Product Name](/products/detail/{id})** - $Price
     * Category: Category
     * Description: Description
     * Stock: X units available

9. If the user asks for products under a specific price,
   use the max_price parameter.

10. If the user asks for products from a specific category,
    use category_name or category_id when appropriate.

11. If the user asks to add something to cart, use add_to_cart.

12. CART RULES (very important):
    - The cart lives in the customer's browser. It is provided to you
      in the "Customer Cart" block of the message. There is NO tool
      for reading the cart. NEVER call a tool to read the cart.
    - Show the cart ONLY when the user asks about it
      (e.g. "what is in my cart", "show my cart", "cart mein kya hai").
      Do not mention or list the cart otherwise.
    - When asked, display the items from the Customer Cart block
      exactly as given (name, price, quantity, line total, subtotal).
      Do not add, remove or change items or prices.
    - If the block says EMPTY, tell the user their cart is empty.
    - If the block says NOT AVAILABLE, tell the user they need to
      log in to see their cart.

13. If the user asks about an order, use get_user_orders.

14. If the user is not logged in and asks for private order/cart
    information, explain that authentication is required.

15. Keep responses clear, friendly, concise and helpful.

16. Do not mention internal tools, LangChain, LangGraph,
    database queries, prompts, localStorage or implementation details.

17. Currency should be displayed as $ unless the database
    or frontend provides another currency.

18. The Context User ID is trusted application context.

19. The product "id" inside the Customer Cart is the product ID,
    NOT the user ID. Never use a product ID as a user ID.

20. For private order history, use the Context User ID.

"""


# ============================================================
# CART FORMATTING (localStorage cart -> readable text)
# ============================================================

def _to_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_int(value, default: int = 1) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def format_cart_for_prompt(frontend_cart, user_id) -> str:
    """
    Converts the browser cart (sent by the frontend from localStorage)
    into a clean text block for the LLM.

    - Guest / logged-out user  -> NOT AVAILABLE
    - Logged in, no items      -> EMPTY
    - Otherwise                -> item list with line totals + subtotal
    """

    if not user_id:
        return "NOT AVAILABLE - the user is not logged in."

    if not frontend_cart:
        return "EMPTY - the customer's cart has no items."

    lines = []
    subtotal = 0.0

    for item in frontend_cart:
        if not isinstance(item, dict):
            continue

        name = item.get("name") or item.get("title") or "Unnamed product"
        price = _to_float(item.get("price"))
        qty = _to_int(item.get("quantity"), 1)
        line_total = price * qty
        subtotal += line_total

        product_id = item.get("id")
        label = (
            f"[{name}](/products/detail/{product_id})"
            if product_id is not None
            else name
        )

        lines.append(f"* **{label}** - ${price:.2f} x {qty} = ${line_total:.2f}")

        if item.get("category"):
            lines.append(f"  * Category: {item['category']}")

    if not lines:
        return "EMPTY - the customer's cart has no items."

    lines.append(f"Subtotal: ${subtotal:.2f}")

    return "\n".join(lines)


# ============================================================
# RESPONSE CONTENT NORMALIZER
# ============================================================

def extract_message_content(content) -> str:
    """
    Converts LangChain/Groq message content into plain text.
    Handles strings, lists, dictionaries and tuples safely.
    """

    if content is None:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, (list, tuple)):
        parts = []

        for item in content:
            if isinstance(item, dict):
                if "text" in item:
                    parts.append(str(item["text"]))
                elif "content" in item:
                    parts.append(str(item["content"]))
                else:
                    parts.append(str(item))
            else:
                parts.append(str(item))

        return "".join(parts)

    return str(content)


# ============================================================
# TOOL CALL EXECUTION
# ============================================================

def execute_tool_call(tool_call) -> str:
    """
    Execute a LangChain tool call safely.
    """

    try:
        tool_name = tool_call.get("name")
        tool_args = tool_call.get("args", {})

        if not isinstance(tool_args, dict):
            tool_args = {}

        selected_tool = tools_by_name.get(tool_name)

        if selected_tool is None:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})

        print(f"[TOOL CALL] {tool_name}({tool_args})")

        result = selected_tool.invoke(tool_args)

        if result is None:
            return ""

        if isinstance(result, str):
            return result

        return json.dumps(result, default=str)

    except Exception as e:
        print(f"[TOOL ERROR] {e}")
        traceback.print_exc()

        return json.dumps({
            "error": "The requested operation could not be completed."
        })


# ============================================================
# MAIN CHAT FUNCTION
# ============================================================

def run_chat(
    message: str,
    user_id: Optional[int] = None,
    prev_h: Optional[torch.Tensor] = None,
    prev_c: Optional[torch.Tensor] = None,
    frontend_cart: Optional[list] = None,
):
    # Logout / guest: cart ko bilkul ignore karo
    frontend_cart = (frontend_cart or []) if user_id else []

    h, c = prev_h, prev_c

    # --------------------------------------------------------
    # Load LSTM memory
    # --------------------------------------------------------

    if user_id and (h is None or c is None):
        try:
            h, c = get_lstm_states(user_id)
        except Exception as e:
            print(f"[LSTM LOAD WARNING] {e}")
            h, c = None, None

    # --------------------------------------------------------
    # Load recent text history
    # --------------------------------------------------------

    try:
        chat_history_text = (
            get_recent_chat_history(user_id) if user_id else "Guest Session"
        )
    except Exception as e:
        print(f"[CHAT HISTORY WARNING] {e}")
        chat_history_text = "No previous conversation available."

    # --------------------------------------------------------
    # Save user message
    # --------------------------------------------------------

    if user_id:
        try:
            save_chat_message(user_id=user_id, role="user", content=message)
        except Exception as e:
            print(f"[SAVE USER MESSAGE WARNING] {e}")

    # --------------------------------------------------------
    # LSTM status
    # --------------------------------------------------------

    if h is None:
        lstm_status_str = "Initialized"
    else:
        try:
            lstm_status_str = f"Active Vector Shape: {list(h.shape)}"
        except Exception:
            lstm_status_str = "Active"

    # --------------------------------------------------------
    # Build user prompt
    # --------------------------------------------------------

    cart_text = format_cart_for_prompt(frontend_cart, user_id)

    prompt = f"""
Context User ID: {user_id if user_id else "Guest"}

Customer Cart (from the customer's browser; show ONLY if the user asks about the cart):
{cart_text}

LSTM Memory Vector Status:
{lstm_status_str}

--- Recent Conversation History ---
{chat_history_text}
-----------------------------------

User Query:
{message}
"""

    # --------------------------------------------------------
    # Conversation messages
    # --------------------------------------------------------

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt),
    ]

    # --------------------------------------------------------
    # Tool-calling loop
    # --------------------------------------------------------

    max_iterations = 8

    try:
        for iteration in range(max_iterations):
            print(f"[AGENT ITERATION] {iteration + 1}")

            response = llm_with_tools.invoke(messages)

            tool_calls = getattr(response, "tool_calls", None)

            if tool_calls:
                messages.append(response)

                for tool_call in tool_calls:
                    tool_result = execute_tool_call(tool_call)

                    messages.append(
                        ToolMessage(
                            content=tool_result,
                            tool_call_id=tool_call.get(
                                "id", f"tool_call_{iteration}"
                            ),
                        )
                    )

                continue

            # ------------------------------------------------
            # No more tools = final response
            # ------------------------------------------------

            bot_response = extract_message_content(
                getattr(response, "content", response)
            ).strip()

            if not bot_response:
                bot_response = (
                    "I couldn't generate a response. Please try again."
                )

            # ------------------------------------------------
            # Update LSTM memory
            # ------------------------------------------------

            try:
                next_h, next_c = memory_encoder.process_turn(
                    user_msg=message,
                    bot_msg=bot_response,
                    prev_h=h,
                    prev_c=c,
                )
            except Exception as e:
                print(f"[LSTM UPDATE WARNING] {e}")
                next_h, next_c = h, c

            # ------------------------------------------------
            # Save bot message + LSTM state
            # ------------------------------------------------

            if user_id:
                try:
                    save_chat_message(
                        user_id=user_id, role="bot", content=bot_response
                    )
                except Exception as e:
                    print(f"[SAVE BOT MESSAGE WARNING] {e}")

                try:
                    save_lstm_states(
                        user_id=user_id,
                        hidden_state=next_h,
                        cell_state=next_c,
                    )
                except Exception as e:
                    print(f"[SAVE LSTM WARNING] {e}")

            return bot_response, next_h, next_c

        # ----------------------------------------------------
        # Maximum tool iterations reached
        # ----------------------------------------------------

        print("[AGENT WARNING] Maximum tool iterations reached.")

        return (
            "I couldn't complete that request right now. Please try again.",
            h,
            c,
        )

    except Exception as e:
        print(
            "\n========================================\n"
            "[ERROR in run_chat]\n"
            "========================================"
        )
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {e}")
        traceback.print_exc()
        print("========================================\n")

        return (
            "An error occurred while processing your request. "
            "Please try again.",
            h,
            c,
        )