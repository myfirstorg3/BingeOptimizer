// src/services/omdb.js
const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const BASE = "https://www.omdbapi.com";

export async function getMovieById(imdbID) {
  const res = await fetch(`${BASE}/?apikey=${API_KEY}&i=${imdbID}&plot=short`);
  const data = await res.json();
  if (data.Response === "False") throw new Error(data.Error);
  return data;
}

export async function getMediaDetailsFromBackend(imdbID) {
  // Try to reach the backend running on port 5000
  const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/media/${imdbID}`, {
    headers: { "ngrok-skip-browser-warning": "true" }
  });
  if (!res.ok) throw new Error("Failed to fetch from backend");
  const data = await res.json();
  return data; // { media, aiSummary }
}

export async function searchOMDB(query, page = 1) {
  const res = await fetch(`${BASE}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${page}`);
  const data = await res.json();
  if (data.Response === "False") throw new Error(data.Error);
  return data; // { Search: [...], totalResults }
}

// Maps an OMDB movie object → your app's card shape
// `overrides` lets mockData inject score/mood/price/featured
export function normalize(omdb, overrides = {}) {
  const runtime = parseInt(omdb.Runtime) || 90;
  return {
    id:       omdb.imdbID,
    title:    omdb.Title,
    year:     parseInt(omdb.Year) || 0,
    genre:    omdb.Genre ? omdb.Genre.split(", ") : ["Unknown"],
    type:     omdb.Type === "series" ? "series" : omdb.Type === "game" ? "movie" : omdb.Type || "movie",
    rating:   omdb.imdbRating !== "N/A" ? parseFloat(omdb.imdbRating) : 7.0,
    duration: runtime,
    poster:   omdb.Poster !== "N/A" ? omdb.Poster : null,
    synopsis: omdb.Plot || "",
    score:    "B",
    mood:     [],
    price:    null,
    featured: false,
    ...overrides,
  };
}