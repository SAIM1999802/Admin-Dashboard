import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.agents import create_agent

from admin_tools import (
    get_sales_analytics,
    get_top_performing_products,
    get_low_performing_products,
    get_vip_customers,
    get_order_details,
    update_bulk_order_status,
    cancel_and_refund_order,
    get_low_stock_products,
    update_product_stock_by_id,
    apply_category_discount,
    get_restock_recommendations
)

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is missing in .env file!")

admin_tools_list = [
    get_sales_analytics,
    get_top_performing_products,
    get_low_performing_products,
    get_vip_customers,
    get_order_details,
    update_bulk_order_status,
    cancel_and_refund_order,
    get_low_stock_products,
    update_product_stock_by_id,
    apply_category_discount,
    get_restock_recommendations
]

llm = ChatGroq(model="openai/gpt-oss-120b", groq_api_key=groq_api_key, temperature=0)

system_prompt = (
    "You are an AI Store Admin Assistant for an e-commerce management dashboard.\n"
    "Your job is to assist store admins with Analytics, Orders, Inventory, and Discounts using the database tools.\n"
    "Rules:\n"
    "1. ALWAYS respond strictly in ENGLISH.\n"
    "2. Base answers strictly on tool results.\n"
    "3. Format currency values clearly (e.g., $ or Rs. depending on standard numbers).\n"
    "4. Present data using clean Markdown tables or bullet points.\n"
    "5. Keep responses concise, professional, and clear."
)

admin_agent = create_agent(tools=admin_tools_list, model=llm, system_prompt=system_prompt , temperature=0)

def run_admin_bot(query: str) -> str:
    try:
        response = admin_agent.invoke({"messages": [{"role": "user", "content": query}]})
        
        # Extract response safely
        if isinstance(response, tuple):
            response = response[0]
            
        messages = response.get("messages", []) if isinstance(response, dict) else getattr(response, "messages", [])
        
        if messages:
            last_msg = messages[-1]
            raw_content = getattr(last_msg, "content", last_msg)
            if isinstance(raw_content, list):
                return "".join([item.get("text", "") if isinstance(item, dict) else str(item) for item in raw_content])
            return str(raw_content)
            
        return str(response)
    except Exception as e:
        print(f"[Admin Bot Error]: {e}")
        return f"An error occurred while processing your query: {str(e)}"