// src/data/mockData.js
// ─── BLASTOISE MOCK DATA ───────────────────────────────────
// MEDIA is now fetched from OMDB at runtime via useFetchMedia().
// SEED defines which IMDb IDs to load + their app-specific metadata.

export const SEED = [
  { imdbID: "tt0816692", score: "S", mood: ["emotional", "cerebral"],    price: null,  featured: false }, // Interstellar
  { imdbID: "tt0468569", score: "A", mood: ["intense", "cerebral"],      price: null,  featured: false }, // The Dark Knight
  { imdbID: "tt1375666", score: "A", mood: ["cerebral", "intense"],      price: 3.99,  featured: false }, // Inception
  { imdbID: "tt0245429", score: "S", mood: ["atmospheric", "emotional"], price: null,  featured: false }, // Spirited Away
  { imdbID: "tt0120737", score: "S", mood: ["emotional", "atmospheric"], price: null,  featured: false }, // LOTR Fellowship
  { imdbID: "tt4154796", score: "A", mood: ["intense", "fun"],           price: null,  featured: true  }, // Avengers Endgame
  { imdbID: "tt0137523", score: "S", mood: ["cerebral", "intense"],      price: 2.49,  featured: false }, // Fight Club
  { imdbID: "tt0133093", score: "S", mood: ["cerebral", "kinetic"],      price: null,  featured: false }, // The Matrix
  { imdbID: "tt0110912", score: "A", mood: ["intense", "cerebral"],      price: null,  featured: false }, // Pulp Fiction
  { imdbID: "tt0108052", score: "A", mood: ["emotional", "slow-burn"],   price: null,  featured: false }, // Schindler's List
  { imdbID: "tt0167260", score: "B", mood: ["emotional", "atmospheric"], price: 1.99,  featured: false }, // LOTR Return of the King
  { imdbID: "tt0076759", score: "B", mood: ["fun", "kinetic"],           price: null,  featured: false }, // Star Wars
];

// Tier defaults — index into SEED array (same order as before)
export const TIER_ITEMS_DEFAULT_SEED = {
  S: [0, 4, 7],    // Interstellar, LOTR Fellowship, The Matrix
  A: [1, 2, 5],    // Dark Knight, Inception, Endgame
  B: [3, 8, 11],   // Spirited Away, Pulp Fiction, Star Wars
  C: [9],          // Schindler's List
  D: [10],         // LOTR Return
  unranked: [6],   // Fight Club
};

export const TIER_COLORS = {
  S: { bg: "#ff2d6b", glow: "rgba(255,45,107,0.3)", label: "#ff2d6b" },
  A: { bg: "#ff7b00", glow: "rgba(255,123,0,0.3)",  label: "#ff7b00" },
  B: { bg: "#ffb800", glow: "rgba(255,184,0,0.3)",  label: "#ffb800" },
  C: { bg: "#00e5ff", glow: "rgba(0,229,255,0.3)",  label: "#00e5ff" },
  D: { bg: "#9b59b6", glow: "rgba(155,89,182,0.3)", label: "#9b59b6" },
};

export const MOODS = [
  { id: "chill",       label: "Chill",       icon: "🌙" },
  { id: "intense",     label: "Intense",     icon: "⚡" },
  { id: "emotional",   label: "Emotional",   icon: "💧" },
  { id: "fun",         label: "Fun",         icon: "✨" },
  { id: "cerebral",    label: "Cerebral",    icon: "🧠" },
  { id: "atmospheric", label: "Atmospheric", icon: "🌫️" },
  { id: "kinetic",     label: "Kinetic",     icon: "🔥" },
  { id: "slow-burn",   label: "Slow Burn",   icon: "🕯️" },
];

export const GENRES = ["All", "Sci-Fi", "Drama", "Thriller", "Action", "Anime", "Mystery", "Horror", "Cyberpunk", "Space", "Adventure"];

export const STATS = {
  totalWatched: 247,
  hoursLogged:  1839,
  avgRating:    8.4,
  topGenre:     "Sci-Fi",
  streak:       14,
  thisWeek:     9,
};