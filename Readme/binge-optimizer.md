# 🧠 The Binge Optimizer

The Binge Optimizer is the flagship, algorithm-driven feature of Blastoise. It solves the modern problem of "decision fatigue"—spending more time scrolling through Netflix to find something to watch than actually watching it.

## ❓ The Problem
A user has 2 hours of free time before bed and wants something "intense". They have 50 movies in their watchlist. Which one should they pick?

## ⚙️ How it Works (System Flow)

When an interviewer asks how the Binge Optimizer works, explain this multi-step pipeline:

### 1. User Input (Frontend)
The user navigates to the Dashboard and inputs:
- **Time Available:** (e.g., 120 minutes)
- **Current Mood:** (e.g., Intense, Relaxing, Funny)
- **Genre Filter:** (e.g., Sci-Fi, All)

### 2. Algorithmic Filtering (Backend)
When the request hits the `POST /api/binge` endpoint:
1. **Query Local DB:** The backend queries the `UserMediaStatus` table to find all media the user has marked as "unwatched" or "queue".
2. **Time Constraint:** It filters out any movies or TV episodes whose `durationMinutes` exceeds the user's available time.
3. **Scoring:** The backend applies a lightweight scoring algorithm prioritizing:
   - High `avgRating`
   - Exact genre matches
   - Shortest time gap (e.g., if you have 120 mins, a 115-min movie scores higher than a 90-min movie to maximize your free time).

### 3. AI Enrichment (Google Gemini 2.0 Flash)
Once the backend selects the top 5-6 optimal choices, it doesn't just hand them to the user. It passes those titles and the user's chosen "Mood" to the **Gemini AI API**.

**The Prompt:**
We ask Gemini to act as a curator. It looks at the selected movies and writes a custom, one-sentence "blurb" explaining *why* this specific movie perfectly matches the user's current mood. It also generates a `sessionNote` summarizing the overall vibe of the recommendations.

### 4. Presentation
The frontend receives the ranked list alongside the Gemini-generated blurbs. The items are displayed as cards, sometimes featuring an auto-assigned "Tier" (S, A, B) based on how perfectly they matched the algorithm's scoring criteria.

## 🚀 Key Interview Talking Points
- **Why AI?** Traditional algorithms can filter by time and genre, but they can't understand "mood". AI bridges the gap between raw data (duration/genre) and human emotion (mood).
- **Performance:** We filter down to 5-6 movies *before* sending data to the LLM. Sending the entire database to Gemini would be slow and expensive. Filtering locally first ensures low latency and low API token usage.
