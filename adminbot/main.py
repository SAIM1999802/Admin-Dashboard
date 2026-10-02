from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from admin_agent import run_admin_bot

app = FastAPI(title="E-Commerce Admin Bot API")

# Allow React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Match payload with React frontend
class AdminChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: Optional[int] = None

class AdminChatResponse(BaseModel):
    reply: str

@app.get("/")
async def root():
    return {"status": "Admin Bot API is running on port 8001"}

# Endpoint URL: /admin-chat
@app.post("/admin-chat", response_model=AdminChatResponse)
async def admin_chat_endpoint(
    request: AdminChatRequest,
    authorization: Optional[str] = Header(None)
):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Passing message, session_id, and user_id to agent
    try:
        # Check if your run_admin_bot supports session_id / user_id parameter,
        # otherwise run_admin_bot(request.message) is fine.
        bot_reply = run_admin_bot(
            message=request.message,
            session_id=request.session_id,
            user_id=request.user_id
        )
    except TypeError:
        # Fallback if run_admin_bot only accepts message argument
        bot_reply = run_admin_bot(request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return AdminChatResponse(reply=str(bot_reply))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)