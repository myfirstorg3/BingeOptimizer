# 📚 Collections & Media Caching Documentation

The Collections feature allows users to curate their personal libraries. It is built around a heavy optimization pattern: the **Database-First Caching Strategy**.

## 🗄️ The Database-First Caching Strategy (`mediaController.js`)

External APIs (like OMDB) have rate limits and network latency. Blastoise avoids hitting them whenever possible.

### Example: Adding to Collection (`addToCollection` endpoint)
When a user clicks "Add to Collection" on a movie with a specific `imdbId`:

```javascript
// 1. Check local DB first
let media = await prisma.media.findFirst({ where: { externalId: imdbId } });

// 2. Fetch from OMDB *only* if not found locally
if (!media) {
  const result = await fetchMediaByIdFromAPI(imdbId);
  media = result.media; // Saved to local DB inside this service function
}

// 3. Upsert the item into the user's collection
const item = await prisma.collectionItem.upsert({
  where: { collectionId_mediaId: { collectionId, mediaId: media.id } },
  update: {}, // Do nothing if it already exists
  create: { collectionId, mediaId: media.id }
});
```

Because of step 1, if 500 users add "The Matrix" to their collections, Blastoise only hits the OMDB API exactly **one** time. The other 499 times, it is served entirely from the local SQLite database.

## 🤖 Non-Blocking AI Generation

To make Collections feel premium, Blastoise automatically generates a "Critic Consensus" review using Gemini AI for every movie. LLM API calls are inherently slow (often taking 2-4 seconds).

**The Architectural Solution:** We do *not* make the user wait for Gemini to finish before returning a success response.

```javascript
// 1. Send the HTTP 201 Created response immediately
res.status(201).json({ item, collection });

// 2. Fire the background AI task (Notice there is no 'await' here)
const existingSummary = await prisma.aIReviewSummary.findFirst({ where: { mediaId: media.id } });
if (!existingSummary) {
  generateReviewSummary(media.id, media.title, media.synopsis)
    .catch(err => console.error('Background AI generation failed:', err.message));
}
```

### The Polling mechanism (`getMediaByInternalId`)
When the user clicks the movie to view details, the frontend requests data.
If the backend sees that the AI review doesn't exist yet, it returns `generatingAI: true`. 
The React frontend then shows a pulsing "Generating..." UI and silently polls the `GET /api/media/internal/:id/ai-summary` endpoint every 3 seconds until the review is ready, creating a seamless user experience.

## 📊 Status Tracking

Users track media through the `UserMediaStatus` join table. 
- **Statuses:** "unwatched" (Queue), "watching", "completed".
- **Implementation:** The `updateItemStatus` endpoint uses Prisma's `upsert` method combined with a composite unique key (`@@unique([userId, mediaId])`). This ensures that no matter how fast a user clicks the status button, they can never create duplicate status rows in the database.
