import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// OMDB API fallback/primary fetcher
export const fetchMediaFromAPI = async (title) => {
  try {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) throw new Error("OMDB API key is missing");

    const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`);
    
    if (response.data.Response === 'False') {
      return null;
    }

    const data = response.data;
    
    // Check if media already exists in our DB
    let media = await prisma.media.findFirst({
      where: { externalId: data.imdbID }
    });

    if (!media) {
      // Parse dates and numbers safely
      const releaseDate = data.Released !== 'N/A' ? new Date(data.Released) : null;
      const durationMinutes = data.Runtime !== 'N/A' ? parseInt(data.Runtime.split(' ')[0]) : null;
      const avgRating = data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null;

      media = await prisma.media.create({
        data: {
          externalId: data.imdbID,
          externalSource: 'omdb',
          title: data.Title,
          posterUrl: data.Poster !== 'N/A' ? data.Poster : null,
          type: data.Type === 'series' ? 'tv' : data.Type,
          releaseDate,
          durationMinutes,
          synopsis: data.Plot !== 'N/A' ? data.Plot : null,
          avgRating,
          language: data.Language,
          country: data.Country,
          lastApiFetchAt: new Date()
        }
      });
    }

    return media;
  } catch (error) {
    console.error("Error fetching media:", error.message);
    throw error;
  }
};
