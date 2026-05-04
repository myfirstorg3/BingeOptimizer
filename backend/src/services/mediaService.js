import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// OMDB API fallback/primary fetcher by title
export const fetchMediaFromAPI = async (title) => {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) throw new Error("OMDB API key is missing");
  const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}&plot=full`);
  if (response.data.Response === 'False') return null;
  return upsertMediaFromOMDB(response.data);
};

// Fetch full media details by IMDB ID — returns { media, rawOMDB }
export const fetchMediaByIdFromAPI = async (imdbId) => {
  try {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) throw new Error("OMDB API key is missing");

    const response = await axios.get(`http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}&plot=full`);
    if (response.data.Response === 'False') return null;

    const data = response.data;
    const media = await upsertMediaFromOMDB(data);
    return { media, rawOMDB: data };
  } catch (error) {
    console.error("Error fetching media by ID:", error.message);
    throw error;
  }
};

async function upsertMediaFromOMDB(data) {
  // Check if already exists
  let media = await prisma.media.findFirst({ where: { externalId: data.imdbID } });
  if (media) return media;

  const releaseDate = data.Released && data.Released !== 'N/A' ? new Date(data.Released) : null;
  const durationMinutes = data.Runtime && data.Runtime !== 'N/A' ? parseInt(data.Runtime.split(' ')[0]) : null;
  const avgRating = data.imdbRating && data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null;

  media = await prisma.media.create({
    data: {
      externalId: data.imdbID,
      externalSource: 'omdb',
      title: data.Title,
      posterUrl: data.Poster && data.Poster !== 'N/A' ? data.Poster : null,
      type: data.Type === 'series' ? 'tv' : data.Type,
      releaseDate,
      durationMinutes,
      synopsis: data.Plot && data.Plot !== 'N/A' ? data.Plot : null,
      // Store rich metadata in description field as JSON
      description: JSON.stringify({
        director: data.Director && data.Director !== 'N/A' ? data.Director : null,
        actors: data.Actors && data.Actors !== 'N/A' ? data.Actors : null,
        genre: data.Genre && data.Genre !== 'N/A' ? data.Genre : null,
        awards: data.Awards && data.Awards !== 'N/A' ? data.Awards : null,
        rated: data.Rated && data.Rated !== 'N/A' ? data.Rated : null,
        boxOffice: data.BoxOffice && data.BoxOffice !== 'N/A' ? data.BoxOffice : null,
        imdbVotes: data.imdbVotes && data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
        rottenTomatoes: data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null,
        metacritic: data.Ratings?.find(r => r.Source === 'Metacritic')?.Value || null,
      }),
      avgRating,
      language: data.Language,
      country: data.Country,
      lastApiFetchAt: new Date(),
    }
  });

  return media;
}
