import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mood → genre keywords for scoring
const MOOD_GENRE_MAP = {
  chill:       ['drama', 'romance', 'animation', 'comedy', 'family'],
  intense:     ['action', 'thriller', 'crime', 'war'],
  emotional:   ['drama', 'biography', 'history', 'romance'],
  fun:         ['comedy', 'animation', 'adventure', 'family', 'sci-fi'],
  cerebral:    ['sci-fi', 'mystery', 'thriller', 'documentary'],
  atmospheric: ['horror', 'mystery', 'fantasy', 'sci-fi'],
  kinetic:     ['action', 'adventure', 'sport'],
  'slow-burn': ['drama', 'thriller', 'mystery', 'western'],
};

// Best tier gets highest weight
const TIER_WEIGHTS = { S: 5, A: 4, B: 3, C: 2, D: 1, unranked: 0 };

function getGenreString(media) {
  if (!media.description) return '';
  try { return JSON.parse(media.description)?.genre || ''; } catch { return ''; }
}

function scoreMedia(media, { timeMins, moods, genre, tierRank, aiSentiment }) {
  let score = 0;

  // 1. Duration fit — soft penalty only, never hard-exclude
  const dur = media.durationMinutes;
  if (dur && media.type === 'movie') {
    if (dur <= timeMins) {
      score += 25; // fits perfectly
    } else if (dur <= timeMins * 1.25) {
      score += 10; // slightly over, still a good fit
    }
    // Over 25% longer = 0 duration pts, but still included in results
  } else {
    score += 15; // TV/anime: no duration concern
  }

  // 2. Mood → genre match
  const mediaGenres = getGenreString(media).toLowerCase();
  const moodHits = moods.reduce((sum, mood) => {
    const wanted = MOOD_GENRE_MAP[mood] || [];
    return sum + wanted.filter(g => mediaGenres.includes(g)).length;
  }, 0);
  score += Math.min(30, moodHits * 10);

  // 3. Explicit genre filter
  if (genre && genre !== 'all' && mediaGenres.includes(genre.toLowerCase())) {
    score += 20;
  }

  // 4. IMDb rating (0–15 pts)
  if (media.avgRating) {
    score += (media.avgRating / 10) * 15;
  }

  // 5. Tier rank — biggest user-specific signal (0–25 pts)
  score += (TIER_WEIGHTS[tierRank] ?? 0) * 5;

  // 6. AI sentiment bonus (0–10 pts)
  if (aiSentiment) {
    score += (aiSentiment / 10) * 10;
  }

  return Math.round(score * 10) / 10;
}


export async function runBingeOptimizer({ userId, timeMins, moods, genre }) {
  // 1. Fetch all collection items with basic media info (no deep nesting)
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          media: true // basic media only
        }
      }
    }
  });

  // 2. Fetch all AI summaries for this user's media (separate query, simpler)
  const allMediaIds = [];
  const mediaMap = {};
  for (const coll of collections) {
    for (const ci of coll.items) {
      if (ci.media && !mediaMap[ci.media.id]) {
        mediaMap[ci.media.id] = ci.media;
        allMediaIds.push(ci.media.id);
      }
    }
  }

  let sentimentMap = {};
  if (allMediaIds.length > 0) {
    try {
      const summaries = await prisma.aIReviewSummary.findMany({
        where: { mediaId: { in: allMediaIds } },
        select: { mediaId: true, sentimentScore: true }
      });
      summaries.forEach(s => { sentimentMap[s.mediaId] = s.sentimentScore; });
    } catch (e) {
      // aIReviewSummary may not exist yet, ignore
    }
  }

  // 3. Fetch best tier rank per media across all user's tier lists
  const tierLists = await prisma.tierList.findMany({
    where: { userId },
    include: { items: { select: { mediaId: true, tier: true } } }
  });

  const tierMap = {};
  for (const tl of tierLists) {
    for (const item of tl.items) {
      const curr = TIER_WEIGHTS[tierMap[item.mediaId]] ?? -1;
      const next = TIER_WEIGHTS[item.tier] ?? 0;
      if (next > curr) tierMap[item.mediaId] = item.tier;
    }
  }

  // 4. Deduplicate and score every item (NO hard exclusions — always return results)
  const seen = new Set();
  const candidates = [];

  for (const coll of collections) {
    for (const ci of coll.items) {
      if (seen.has(ci.mediaId) || !ci.media) continue;
      seen.add(ci.mediaId);

      const media    = ci.media;
      const tierRank = tierMap[media.id] || 'unranked';
      const aiSentiment = sentimentMap[media.id] ?? null;
      const score    = scoreMedia(media, { timeMins, moods, genre, tierRank, aiSentiment });
      const genreStr = getGenreString(media);

      candidates.push({
        mediaId:         media.id,
        externalId:      media.externalId,
        title:           media.title,
        posterUrl:       media.posterUrl,
        type:            media.type,
        durationMinutes: media.durationMinutes,
        releaseDate:     media.releaseDate,
        avgRating:       media.avgRating,
        synopsis:        media.synopsis,
        genre:           genreStr,
        tierRank,
        score,
      });
    }
  }

  if (candidates.length === 0) return [];

  // 5. Sort by score — always return something
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 10);
}


export function buildGeminiPrompt(candidates, { timeMins, moods, genre }) {
  const hours  = Math.floor(timeMins / 60);
  const mins   = timeMins % 60;
  const timeStr = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

  const list = candidates.map((c, i) =>
    `${i + 1}. "${c.title}" (${c.type}, ${c.durationMinutes ?? '?'}min, IMDb:${c.avgRating ?? 'N/A'}, userTier:${c.tierRank}, algoScore:${c.score})`
  ).join('\n');

  return `You are a movie/TV recommendation expert. The user has ${timeStr} available and is in a "${moods.join(', ')}" mood${genre && genre !== 'all' ? `, preferring ${genre}` : ''}.

From their personal saved collection, the algorithm pre-scored these candidates:
${list}

Re-rank these for the best viewing experience given the mood and time. Prioritize higher-tier items and good mood fit. Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "rankedTitles": ["Title1","Title2",...],
  "blurbs": {
    "Title1": "One sentence: why this fits the mood perfectly.",
    "Title2": "..."
  },
  "sessionNote": "One engaging sentence summarizing this viewing session."
}`;
}
