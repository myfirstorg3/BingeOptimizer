# 📚 Collections & Media Caching

The Collections feature allows users to curate their personal libraries, track what they are watching, and view rich media details. It is heavily optimized to reduce reliance on external APIs.

## 🗄️ The Database-First Caching Strategy

External APIs (like OMDB or TMDB) have rate limits and network latency. Blastoise uses a **Database-First Caching Strategy**.

### The Flow:
1. **Searching:** When a user searches for a movie, the frontend hits the OMDB API directly to get a lightweight list of search results.
2. **Adding to Collection:** When the user clicks "Add to Collection":
   - The backend checks if that `imdbId` exists in the local `Media` table.
   - If **NO**: The backend fetches the full, rich data (plot, actors, runtime) from OMDB, saves it to the local SQLite `Media` table, and then links it to the user's collection.
   - If **YES**: The backend skips OMDB entirely and just links the existing local record to the user's collection.
3. **Viewing Collections:** When the user opens their Collections page, **zero external API calls are made**. All posters, titles, runtimes, and statuses are loaded instantly from the local database.

## 🤖 Background AI Review Generation

To make Collections feel premium, Blastoise automatically generates a "Critic Consensus" review using Gemini AI for every movie added.

**How it works without slowing down the app:**
- When a user adds a movie, the server responds immediately (`res.status(201)`) so the UI feels snappy.
- However, *after* the response is sent, a background Promise continues running (`generateReviewSummary()`).
- This background task calls Gemini, asks it to generate a synthetic review and a sentiment score (1-10) based on the movie's plot, and saves it to the `AIReviewSummary` table.

## 📺 The Media Detail Panel

When a user clicks a movie in their collection, a glassmorphic sliding panel opens. 
- The frontend hits the `/api/media/internal/:id` endpoint.
- Because of our caching strategy, this endpoint queries the database and returns the full OMDB metadata and the Gemini AI Review instantly.
- **Polling:** If the user opens the panel while the background Gemini AI task is still running, the frontend receives a `generatingAI: true` flag. The UI will show a pulsing "Generating AI Review..." animation and silently poll the server every 3 seconds until the review is ready to be displayed.

## 📊 Status Tracking

Users can track media through a `UserMediaStatus` join table. 
- **Statuses:** "unwatched" (Queue), "watching", "completed".
- This table relies on a composite unique key `@@unique([userId, mediaId])`, ensuring a user can only have one status for a specific movie at a time.
