import torch
import torch.nn as nn
from langchain_huggingface import HuggingFaceEmbeddings

class LSTMMemoryEncoder(nn.Module):
    def __init__(self, input_dim=384, hidden_dim=256):
        super(LSTMMemoryEncoder, self).__init__()
        self.hidden_dim = hidden_dim
        self.lstm = nn.LSTMCell(input_dim, hidden_dim)
        self._embedder = None

    @property
    def embedder(self):
        if self._embedder is None:
            self._embedder = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        return self._embedder

    def encode_text(self, text: str) -> torch.Tensor:
        emb = self.embedder.embed_query(text)
        return torch.tensor(emb, dtype=torch.float32).unsqueeze(0)

    def process_turn(self, user_msg: str, bot_msg: str, prev_h=None, prev_c=None):
        turn_text = f"User: {user_msg} | Bot: {bot_msg}"
        x = self.encode_text(turn_text)

        if prev_h is None or prev_c is None:
            prev_h = torch.zeros(1, self.hidden_dim)
            prev_c = torch.zeros(1, self.hidden_dim)

        next_h, next_c = self.lstm(x, (prev_h, prev_c))
        return next_h, next_c

memory_encoder = LSTMMemoryEncoder()