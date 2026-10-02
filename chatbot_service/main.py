from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, Union, List, Any
import torch

from bot_agent import run_chat


app = FastAPI(title="LSTM Chatbot Service")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SESSION MEMORY
# ============================================================

session_memories: Dict[str, Dict[str, torch.Tensor]] = {}


# ============================================================
# REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):

    message: str

    session_id: Optional[str] = "default_session"

    user_id: Optional[Union[int, str]] = None

    # Cart data coming from the browser's localStorage (cart_<userId>).
    # Frontend sends it ONLY when the user is logged in; after logout
    # it is an empty list / null.
    cart: Optional[List[Dict[str, Any]]] = None


# ============================================================
# RESPONSE MODEL
# ============================================================

class ChatResponse(BaseModel):

    session_id: str

    reply: str


# ============================================================
# CHAT ENDPOINT
# ============================================================

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):

    session_id = request.session_id or "default_session"

    user_msg = request.message

    user_id = request.user_id

    # --------------------------------------------------------
    # Normalize user ID
    # --------------------------------------------------------

    if user_id is not None:
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            user_id = None

    # --------------------------------------------------------
    # Session key
    # --------------------------------------------------------

    cache_key = f"{user_id}_{session_id}" if user_id else session_id

    # --------------------------------------------------------
    # Get LSTM memory
    # --------------------------------------------------------

    session_data = session_memories.get(cache_key, {})

    prev_h = session_data.get("h", None)
    prev_c = session_data.get("c", None)

    # --------------------------------------------------------
    # Clean cart data
    #
    # - image / base64 fields are intentionally NOT copied.
    # - Guest (no valid user_id) => cart is always empty, so a
    #   logged-out browser can never show a cart.
    # --------------------------------------------------------

    clean_cart = []

    if user_id and request.cart:

        for item in request.cart:

            clean_cart.append({
                "id": item.get("id"),
                "name": item.get("name") or item.get("title"),
                "category_id": item.get("category_id"),
                "category": item.get("category"),
                "price": item.get("price"),
                "quantity": item.get("quantity", 1),
                "stock": item.get("stock"),
                "description": item.get("description"),
            })

    # --------------------------------------------------------
    # Run chatbot
    # --------------------------------------------------------

    try:

        bot_reply, next_h, next_c = run_chat(
            message=user_msg,
            user_id=user_id,
            prev_h=prev_h,
            prev_c=prev_c,
            frontend_cart=clean_cart,
        )

        # ----------------------------------------------------
        # Store LSTM state
        # ----------------------------------------------------

        if next_h is not None and next_c is not None:
            session_memories[cache_key] = {"h": next_h, "c": next_c}

        return ChatResponse(session_id=session_id, reply=bot_reply)

    except Exception as e:

        print("\n========================================")
        print("[ERROR in /chat]")
        print(f"{type(e).__name__}: {e}")
        print("========================================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Bot execution failed: {str(e)}",
        )


# ============================================================
# CLEAR SESSION
# ============================================================

@app.delete("/chat/session/{session_id}")
async def clear_session(session_id: str):

    keys_to_delete = [
        key
        for key in session_memories
        if key == session_id or key.endswith(f"_{session_id}")
    ]

    for key in keys_to_delete:
        del session_memories[key]

    if keys_to_delete:
        return {
            "status": "success",
            "message": f"Session {session_id} memory cleared.",
        }

    return {
        "status": "not_found",
        "message": "Session ID not found.",
    }


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)