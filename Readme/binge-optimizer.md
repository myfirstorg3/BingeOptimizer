# 🧠 The Binge Optimizer Documentation

The Binge Optimizer is the flagship, algorithm-driven feature of Blastoise. It solves the modern problem of "decision fatigue" by mathematically scoring a user's collection against their current available time and mood, and then enriching the results with Generative AI.

## ⚙️ System Pipeline

When the `POST /api/binge` endpoint is hit, the system follows a strict two-phase process: **Heuristic Scoring** followed by **LLM Re-ranking**.

### Phase 1: Algorithmic Heuristic Scoring (`bingeService.js`)

The backend fetches every media item in the user's collections, deduplicates them, and passes them through the `scoreMedia()` function. The maximum base score is roughly 125 points.

**The Scoring Formula:**

1. **Duration Fit (Max 25 pts):**
   - *Movies:* 
     - If `duration <= availableTime` → **+25 pts**
     - If `duration <= availableTime * 1.25` (slightly over) → **+10 pts**
     - Exceeds by >25% → **+0 pts** (Soft penalty: we never hard-exclude, but it falls to the bottom of the list).
   - *TV Shows / Anime:* Automatically awarded **+15 pts** as they are episodic and time constraints apply differently.

2. **Mood-to-Genre Mapping (Max 30 pts):**
   - The user selects a mood (e.g., `chill`, `intense`, `cerebral`).
   - The system maps the mood to a subset of genres. For example, `intense` maps to `[action, thriller, crime, war]`.
   - **Formula:** `+10 pts` for every genre match (capped at 30 pts).

3. **Explicit Genre Filter (Max 20 pts):**
   - If the user explicitly selects a genre filter (e.g., "Sci-Fi"), and the media includes it → **+20 pts**.

4. **Quality Signals (Max 50 pts):**
   - **User Tier Lists (Max 25 pts):** The algorithm checks if the user has ranked this media in any of their Tier Lists.
     - Weights: `S=5`, `A=4`, `B=3`, `C=2`, `D=1`, `unranked=0`
     - **Formula:** `TierWeight * 5`
   - **Global IMDb Rating (Max 15 pts):** 
     - **Formula:** `(avgRating / 10.0) * 15`
   - **Gemini Critic Sentiment (Max 10 pts):** If a background AI Review exists for this media, it uses the generated `sentimentScore` (1-10).
     - **Formula:** `(sentimentScore / 10.0) * 10`

*The top 10 highest-scoring candidates are sliced and sent to Phase 2.*

### Phase 2: AI Enrichment (Google Gemini 2.0 Flash)

The backend constructs a highly specific prompt containing the top 10 candidates, their exact algorithmic scores, user tiers, and durations.

**The LLM Prompt Payload:**
```text
You are a movie/TV recommendation expert. The user has {timeStr} available and is in a "{mood}" mood.
From their personal saved collection, the algorithm pre-scored these candidates:
1. "Inception" (movie, 148min, IMDb:8.8, userTier:S, algoScore:87.5)
...
Re-rank these for the best viewing experience given the mood and time...
Return ONLY valid JSON...
```

**JSON Output Format:**
Gemini is forced to return a JSON object with:
- `rankedTitles`: Array of the final re-ranked order.
- `blurbs`: A dictionary providing a customized, one-sentence explanation of *why* this movie fits the user's current mood.
- `sessionNote`: A summary sentence of the overall vibe of the generated session.

## 🚀 Architectural Trade-offs & Interview Points

- **Why a Two-Phase Approach?** 
  Sending a user's entire collection of 500 movies to Gemini would blow up token limits, increase latency to 20+ seconds, and risk LLM hallucinations. By using a fast, deterministic mathematical heuristic to filter down to the Top 10, we keep the AI prompt small, cheap, and lightning-fast (usually under 1.5 seconds), while still getting the "human touch" of customized blurbs.
- **Soft Penalties vs Hard Exclusions:**
  The algorithm intentionally uses soft penalties for duration. If a user has 120 minutes, a 125-minute masterpiece (S-Tier) might still outscore a terrible 90-minute movie. This provides a vastly superior user experience than strict filtering.
