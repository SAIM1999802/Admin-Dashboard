import os
import io
import torch
import pymysql
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ecommerce_db"),
        port=int(os.getenv("DB_PORT", 3306)),
        cursorclass=pymysql.cursors.DictCursor
    )

def save_chat_message(user_id: int, role: str, content: str):
    if not user_id:
        return
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO chat_history (user_id, role, content) VALUES (%s, %s, %s)"
            cursor.execute(sql, (user_id, role, content))
            conn.commit()
    finally:
        conn.close()

def get_lstm_states(user_id: int):
    """DB se hidden_state aur cell_state blobs padhkar PyTorch tensors return karta hai."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT hidden_state, cell_state FROM user_lstm_memory WHERE user_id = %s",
                (user_id,)
            )
            row = cursor.fetchone()
            if row:
                h_buf = io.BytesIO(row["hidden_state"])
                c_buf = io.BytesIO(row["cell_state"])
                hidden_state = torch.load(h_buf, weights_only=True)
                cell_state = torch.load(c_buf, weights_only=True)
                return hidden_state, cell_state
            return None, None
    finally:
        conn.close()

def save_lstm_states(user_id: int, hidden_state: torch.Tensor, cell_state: torch.Tensor):
    """PyTorch tensors ko binary format me serialize karke DB me save/update karta hai."""
    h_buf = io.BytesIO()
    c_buf = io.BytesIO()
    torch.save(hidden_state, h_buf)
    torch.save(cell_state, c_buf)
    
    h_bytes = h_buf.getvalue()
    c_bytes = c_buf.getvalue()

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO user_lstm_memory (user_id, hidden_state, cell_state)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE 
                    hidden_state = VALUES(hidden_state),
                    cell_state = VALUES(cell_state);
            """
            cursor.execute(sql, (user_id, h_bytes, c_bytes))
            conn.commit()
    finally:
        conn.close()