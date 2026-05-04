import os
import time
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from pyngrok import ngrok

app = FastAPI(title="Blastoise ML Engine", description="Local LLM and Vector DB Service")

# --- Models ---
class BingeRequest(BaseModel):
    time_available_mins: int
    moods: List[str]
    candidate_media: List[dict] # list of {id, title, duration, rating, genres}

class SearchQuery(BaseModel):
    query: str

# --- Dummy LLM Initialization ---
# In a real scenario, you'd load Llama-3 8B or Mistral 7B via transformers or vLLM here.
# For example: 
# from transformers import pipeline
# pipe = pipeline("text-generation", model="meta-llama/Meta-Llama-3-8B-Instruct", device_map="auto")

print("Initializing ML Engine...")
print("Loaded Local LLM (Mocked)...")

# --- API Endpoints ---

@app.post("/api/optimize-binge")
async def optimize_binge(req: BingeRequest):
    """
    Takes available time and candidates, uses a local LLM to solve a knapsack-like problem 
    and rank the best sequence of movies/shows.
    """
    start_time = time.time()
    
    # 1. We mock the LLM processing here since running a 7B model requires GPU.
    # The LLM would be prompted to select media that perfectly fits the `time_available_mins`
    # while adhering to `moods` and highest ratings.
    
    selected = []
    total_time = 0
    
    # Simple mock algorithm: greedily add best rated that fits
    sorted_candidates = sorted(req.candidate_media, key=lambda x: x.get('rating', 0), reverse=True)
    
    for media in sorted_candidates:
        duration = media.get('duration') or 120 # fallback 2 hours
        if total_time + duration <= req.time_available_mins:
            selected.append({
                "mediaId": media['id'],
                "title": media['title'],
                "duration": duration,
                "reason": f"Highly rated and fits the {req.moods[0] if req.moods else 'selected'} mood."
            })
            total_time += duration
            
    latency_ms = int((time.time() - start_time) * 1000)
    
    return {
        "rankedResults": selected,
        "total_duration_mins": total_time,
        "llmModelUsed": "local-llama-3-8b-instruct-mock",
        "latencyMs": latency_ms
    }

@app.post("/api/vector-search")
async def vector_search(req: SearchQuery):
    """
    Takes a misspelled query and uses SentenceTransformers + ChromaDB to find closest match.
    """
    # Mocking Vector DB lookup
    # e.g. querying ChromaDB collections here
    
    return {
        "original_query": req.query,
        "closest_match": "Avengers: Endgame", # Mock corrected title
        "confidence": 0.92
    }

if __name__ == "__main__":
    # Optional: Setup Ngrok tunnel if public endpoint is needed by the Node backend
    # public_url = ngrok.connect(8000)
    # print(f"Ngrok Tunnel URL: {public_url}")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
