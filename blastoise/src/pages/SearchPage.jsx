import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Cards from "../components/Cards";
import DB from "../db/db";

const SearchPage = () => {
  // Get all movie/TV/anime data from database
  const movies = DB();

  // State for search input
  const [search, setSearch] = useState("");

  // State for selected filters
  const [selectedType, setSelectedType] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  // Create unique genre list for dropdown
  const genres = ["all", ...new Set(movies.map((movie) => movie.genre))];

  // Create unique language list for dropdown
  const languages = ["all", ...new Set(movies.map((movie) => movie.language))];

  // Filter movies based on search text + selected filters
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Check if movie title includes search text
      const matchesSearch = movie.title
        .toLowerCase()
        .includes(search.toLowerCase());

      // Check type filter
      const matchesType =
        selectedType === "all" || movie.type === selectedType;

      // Check genre filter
      const matchesGenre =
        selectedGenre === "all" || movie.genre === selectedGenre;

      // Check language filter
      const matchesLanguage =
        selectedLanguage === "all" || movie.language === selectedLanguage;

      // Return only movies matching all conditions
      return (
        matchesSearch &&
        matchesType &&
        matchesGenre &&
        matchesLanguage
      );
    });
  }, [movies, search, selectedType, selectedGenre, selectedLanguage]);

  return (
    <div className="text-white p-6">
      {/* Page heading */}
      <h1 className="text-3xl font-semibold mb-6">Search</h1>

      {/* Search bar + filter dropdowns */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search movies, TV series, anime..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[#111] border border-gray-700 outline-none"
        />

        {/* Type filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-3 rounded-lg bg-[#111] border border-gray-700 outline-none"
        >
          <option value="all">Type: All</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Series</option>
          <option value="anime">Anime</option>
        </select>

        {/* Genre filter */}
        <select
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="px-4 py-3 rounded-lg bg-[#111] border border-gray-700 outline-none"
        >
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              Genre: {genre === "all" ? "All" : genre}
            </option>
          ))}
        </select>

        {/* Language filter */}
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-4 py-3 rounded-lg bg-[#111] border border-gray-700 outline-none"
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              Language: {language === "all" ? "All" : language}
            </option>
          ))}
        </select>
      </div>

      {/* Show number of matching results */}
      <p className="text-gray-400 mb-6">
        {filteredMovies.length} title
        {filteredMovies.length !== 1 ? "s" : ""} found
      </p>

      {/* If matching titles exist, show cards */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredMovies.map((movie) => (
            <Link key={movie.id} to={`/media/${movie.id}`}>
              <Cards
                title={movie.title}
                poster={movie.poster}
                year={movie.year}
                rating={movie.rating}
              />
            </Link>
          ))}
        </div>
      ) : (
        // If no results found
        <p className="text-gray-400">No matching titles found.</p>
      )}
    </div>
  );
};

export default SearchPage;