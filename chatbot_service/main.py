from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import torch

from bot_agent import run_chat

app = FastAPI(title="LSTM Chatbot Service")

# --- CORS Middleware Addition ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React / Vite dev server
        "http://127.0.0.1:5173",
        "*"                       # Development testing ke liye
    ],
    allow_credentials=True,
    allow_methods=["*"],          # POST, GET, OPTIONS etc.
    allow_headers=["*"],
)

# In-memory session store: {session_id: {"h": Tensor, "c": Tensor}}
session_memories: Dict[str, Dict[str, torch.Tensor]] = {}


class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: Optional[int] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    session_id = request.session_id
    user_msg = request.message
    user_id = request.user_id

    # 1. Retrieve previous LSTM state from in-memory cache
    session_data = session_memories.get(session_id, {})
    prev_h = session_data.get("h", None)
    prev_c = session_data.get("c", None)

    try:
        # 2. Run chat and update LSTM states through bot_agent
        bot_reply, next_h, next_c = run_chat(
            message=user_msg,
            user_id=user_id,
            prev_h=prev_h,
            prev_c=prev_c
        )

        # 3. Store updated states in-memory session cache
        if next_h is not None and next_c is not None:
            session_memories[session_id] = {
                "h": next_h,
                "c": next_c
            }

        return ChatResponse(session_id=session_id, reply=bot_reply)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/chat/session/{session_id}")
async def clear_session(session_id: str):
    """Session ki LSTM memory clear karne ke liye"""
    if session_id in session_memories:
        del session_memories[session_id]
        return {"status": "success", "message": f"Session {session_id} memory cleared."}
    return {"status": "not_found", "message": "Session ID not found."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)