import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Cards from "../components/Cards";
import DB from "../db/db";

const Collection = () => {
  // Get all media items from the database
  const movies = DB();

  // Stores which tab is currently selected
  // Default tab is "All"
  const [activeFolder, setActiveFolder] = useState("collection");

  // Stores media folder data from localStorage
  // Format example:
  // {
  //   "1": ["movies", "anime"],
  //   "2": ["tv"]
  // }
  const [mediaFolders, setMediaFolders] = useState({});

  // Stores favourite media IDs from localStorage
  // Example: [1, 3, 5]
  const [favorites, setfavorites] = useState([]);

  // Runs once when the component loads
  // Used to fetch saved folder and favourite data from localStorage
  useEffect(() => {
    const storedFolders =
      JSON.parse(localStorage.getItem("mediaFolders")) || {};

    const storedfavorites =
      JSON.parse(localStorage.getItem("favorites")) || [];

    // Save localStorage data into state
    setMediaFolders(storedFolders);
    setfavorites(storedfavorites);
  }, []);

  // Tabs shown at the top of the Collection page
  const folderTabs = [
    { key: "collection", label: "All" },
    { key: "movies", label: "Movies" },
    { key: "tv", label: "TV Series" },
    { key: "anime", label: "Anime" },
    { key: "favorites", label: "Favourites" },
  ];

  // Removes a media item from one specific folder only
  // Example: remove movie with id 1 from "movies" folder
  const removeFromFolder = (movieId, folder) => {
    // Get current folder data from localStorage
    const storedFolders =
      JSON.parse(localStorage.getItem("mediaFolders")) || {};

    // Get the folders of the selected movie
    const currentFolders = storedFolders[String(movieId)] || [];

    // Remove the selected folder from that movie's folder list
    const updatedFolders = currentFolders.filter((f) => f !== folder);

    // Update the object with new folder list
    storedFolders[String(movieId)] = updatedFolders;

    // Save updated data back to localStorage
    localStorage.setItem("mediaFolders", JSON.stringify(storedFolders));

    // Update state so UI refreshes immediately
    setMediaFolders(storedFolders);
  };

  // Removes a media item from all folders
  // Used when user is in "All" tab and clicks Remove
  const removeFromAllFolders = (movieId) => {
    const storedFolders =
      JSON.parse(localStorage.getItem("mediaFolders")) || {};

    // Empty the folder list for this movie
    storedFolders[String(movieId)] = [];

    // Save changes in localStorage
    localStorage.setItem("mediaFolders", JSON.stringify(storedFolders));

    // Update state so page re-renders
    setMediaFolders(storedFolders);
  };

  // Removes a media item from favourites
  const removeFromFavorites = (movieId) => {
    const storedfavorites =
      JSON.parse(localStorage.getItem("favorites")) || [];

    // Keep all IDs except the one being removed
    const updatedfavorites = storedfavorites.filter((id) => id !== movieId);

    // Save updated favourites list
    localStorage.setItem("favorites", JSON.stringify(updatedfavorites));

    // Update state so UI changes instantly
    setfavorites(updatedfavorites);
  };

  // Filters items based on the currently active tab
  // useMemo is used so filtering only runs again when dependencies change
  const filteredItems = useMemo(() => {
    // If Favourites tab is selected,
    // show only those movies whose IDs are in favorites array
    if (activeFolder === "favorites") {
      return movies.filter((movie) => favorites.includes(movie.id));
    }

    // If All tab is selected,
    // show media items that are present in at least one folder
    if (activeFolder === "collection") {
      return movies.filter((movie) => {
        const folders = mediaFolders[String(movie.id)] || [];
        return folders.length > 0;
      });
    }

    // Otherwise show media items belonging to the selected folder
    // Example: movies, tv, anime
    return movies.filter((movie) => {
      const folders = mediaFolders[String(movie.id)] || [];
      return folders.includes(activeFolder);
    });
  }, [movies, mediaFolders, favorites, activeFolder]);

  return (
    <div className="text-white p-6">
      {/* Page title */}
      <h1 className="text-3xl font-semibold mb-6">My Collection</h1>

      {/* Top tab buttons */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {folderTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFolder(tab.key)} // Change active tab on click
            className={`px-4 py-2 rounded-lg ${
              activeFolder === tab.key
                ? "bg-blue-600" // Style for selected tab
                : "bg-[#111] border border-gray-700" // Style for inactive tab
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shows number of items currently visible */}
      <div className="mb-8">
        <p className="text-gray-400">
          {filteredItems.length} title
          {filteredItems.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* If there are items after filtering, show them in a grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredItems.map((movie) => (
            <div key={movie.id} className="relative group">
              {/* Remove button */}
              <button
                onClick={(e) => {
                  // Prevent Link navigation when clicking Remove
                  e.preventDefault();

                  // If user is in Favourites tab,
                  // remove the movie from favourites only
                  if (activeFolder === "favorites") {
                    removeFromFavorites(movie.id);
                  }

                  // If user is in All tab,
                  // remove the movie from all folders
                  else if (activeFolder === "collection") {
                    removeFromAllFolders(movie.id);
                  }

                  // If user is in Movies / TV / Anime tab,
                  // remove the movie only from that folder
                  else {
                    removeFromFolder(movie.id, activeFolder);
                  }
                }}
                className="absolute top-2 left-2 z-20 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition"
              >
                Remove
              </button>

              {/* Clicking card opens media details page */}
              <Link to={`/media/${movie.id}`}>
                <Cards
                  title={movie.title}
                  poster={movie.poster}
                  year={movie.year}
                  rating={movie.rating}
                />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        // Shown when no items exist in selected folder/tab
        <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-6 text-gray-400">
          No titles added in this folder yet.
        </div>
      )}
    </div>
  );
};

export default Collection;