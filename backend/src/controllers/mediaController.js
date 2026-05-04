import { PrismaClient } from '@prisma/client';
import { fetchMediaByIdFromAPI } from '../services/mediaService.js';
import { generateReviewSummary } from '../services/geminiService.js';

const prisma = new PrismaClient();

// GET /api/media/internal/:id — fetch cached media details by internal DB id (no external API)
export const getMediaByInternalId = async (req, res) => {
  const { id } = req.params;
  try {
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        reviewSummary: true,
      }
    });
    if (!media) return res.status(404).json({ error: 'Media not found' });

    let rawOMDB = null;
    if (media.description) {
      try { rawOMDB = JSON.parse(media.description); } catch {}
    }

    // If no AI summary yet, fire background generation
    if (!media.reviewSummary) {
      res.status(200).json({ media, rawOMDB, aiSummary: null, generatingAI: true });
      generateReviewSummary(media.id, media.title, media.synopsis)
        .catch(err => console.error('Background AI generation failed:', err.message));
    } else {
      res.status(200).json({ media, rawOMDB, aiSummary: media.reviewSummary, generatingAI: false });
    }
  } catch (error) {
    console.error('Error in getMediaByInternalId:', error);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
};

// GET /api/media/internal/:id/ai-summary — poll for AI summary by internal id
export const getAISummaryByInternalId = async (req, res) => {
  const { id } = req.params;
  try {
    const aiSummary = await prisma.aIReviewSummary.findFirst({ where: { mediaId: id } });
    if (!aiSummary) return res.status(202).json({ ready: false });
    res.status(200).json({ ready: true, aiSummary });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMediaDetails = async (req, res) => {
  const { imdbId } = req.params;
  if (!imdbId) return res.status(400).json({ error: "IMDB ID is required" });

  try {
    // 1. Check local DB first
    let media = await prisma.media.findFirst({ where: { externalId: imdbId } });
    let rawOMDB = null;

    // 2. Fallback: fetch from OMDB and cache in DB
    if (!media) {
      const result = await fetchMediaByIdFromAPI(imdbId);
      if (!result) return res.status(404).json({ error: "Media not found" });
      media = result.media;
      rawOMDB = result.rawOMDB;
    } else {
      // Already in DB — parse stored description JSON if available
      if (media.description) {
        try { rawOMDB = JSON.parse(media.description); } catch { rawOMDB = null; }
      }
      // If description is missing (old cached entry), re-fetch rich data from OMDB
      // and update the DB record in background (no blocking)
      if (!rawOMDB) {
        try {
          const apiKey = process.env.OMDB_API_KEY;
          const { default: axios } = await import('axios');
          const response = await axios.get(`http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}&plot=full`);
          if (response.data.Response !== 'False') {
            const d = response.data;
            rawOMDB = {
              director: d.Director !== 'N/A' ? d.Director : null,
              actors: d.Actors !== 'N/A' ? d.Actors : null,
              genre: d.Genre !== 'N/A' ? d.Genre : null,
              awards: d.Awards !== 'N/A' ? d.Awards : null,
              rated: d.Rated !== 'N/A' ? d.Rated : null,
              boxOffice: d.BoxOffice !== 'N/A' ? d.BoxOffice : null,
              imdbVotes: d.imdbVotes !== 'N/A' ? d.imdbVotes : null,
              rottenTomatoes: d.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null,
              metacritic: d.Ratings?.find(r => r.Source === 'Metacritic')?.Value || null,
            };
            // Update DB in background
            prisma.media.update({
              where: { id: media.id },
              data: { description: JSON.stringify(rawOMDB), synopsis: d.Plot !== 'N/A' ? d.Plot : media.synopsis }
            }).catch(e => console.error('DB update error:', e.message));
          }
        } catch (e) {
          console.error('OMDB re-fetch error:', e.message);
        }
      }
    }

    // 3. Check for existing AI summary
    let aiSummary = await prisma.aIReviewSummary.findFirst({ where: { mediaId: media.id } });

    // 4. Return immediately with whatever we have, fire Gemini async if needed
    if (!aiSummary) {
      // Return immediately without blocking on Gemini
      res.status(200).json({ media, rawOMDB, aiSummary: null, generatingAI: true });

      // Generate AI summary in background and save
      generateReviewSummary(media.id, media.title, media.synopsis)
        .then(() => console.log(`AI summary generated for ${media.title}`))
        .catch(err => console.error(`Background AI generation failed for ${media.title}:`, err.message));
    } else {
      res.status(200).json({ media, rawOMDB, aiSummary, generatingAI: false });
    }

  } catch (error) {
    console.error("Error in getMediaDetails:", error);
    res.status(500).json({ error: "Internal Server Error", detail: error.message });
  }
};

// Separate endpoint to get AI summary for a media (poll after generatingAI:true)
export const getAISummary = async (req, res) => {
  const { imdbId } = req.params;
  try {
    const media = await prisma.media.findFirst({ where: { externalId: imdbId } });
    if (!media) return res.status(404).json({ error: "Media not found" });

    const aiSummary = await prisma.aIReviewSummary.findFirst({ where: { mediaId: media.id } });
    if (!aiSummary) return res.status(202).json({ ready: false });

    res.status(200).json({ ready: true, aiSummary });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add media to a collection
export const addToCollection = async (req, res) => {
  const { imdbId } = req.params;
  const { collectionId, newCollectionName } = req.body;
  const userId = req.user.id;

  try {
    // Ensure media exists in DB
    let media = await prisma.media.findFirst({ where: { externalId: imdbId } });
    if (!media) {
      const result = await fetchMediaByIdFromAPI(imdbId);
      if (!result) return res.status(404).json({ error: "Media not found" });
      media = result.media;
    }

    let targetCollectionId = collectionId;

    // Create new collection if requested
    if (!collectionId && newCollectionName) {
      const newCollection = await prisma.collection.create({
        data: { userId, name: newCollectionName, isPublic: false }
      });
      targetCollectionId = newCollection.id;
    }

    // If no collection specified, find or create "Uncollected"
    if (!targetCollectionId) {
      let uncollected = await prisma.collection.findFirst({
        where: { userId, name: "Uncollected" }
      });
      if (!uncollected) {
        uncollected = await prisma.collection.create({
          data: { userId, name: "Uncollected", isPublic: false }
        });
      }
      targetCollectionId = uncollected.id;
    }

    // Upsert item in collection
    const item = await prisma.collectionItem.upsert({
      where: { collectionId_mediaId: { collectionId: targetCollectionId, mediaId: media.id } },
      update: {},
      create: { collectionId: targetCollectionId, mediaId: media.id }
    });

    const collection = await prisma.collection.findUnique({ where: { id: targetCollectionId } });
    res.status(201).json({ item, collection });

    // Fire background AI summary generation if not already done
    const existingSummary = await prisma.aIReviewSummary.findFirst({ where: { mediaId: media.id } });
    if (!existingSummary) {
      generateReviewSummary(media.id, media.title, media.synopsis)
        .catch(err => console.error('Background AI generation on collect failed:', err.message));
    }

  } catch (error) {
    console.error("Error in addToCollection:", error);
    res.status(500).json({ error: "Internal Server Error", detail: error.message });
  }
};
