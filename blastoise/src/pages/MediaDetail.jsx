import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DB from "../db/db";

function MediaDetail() {
  const { id } = useParams();
  const movies = DB();

  const media = movies.find((item) => item.id === Number(id));

  const [selectedFolder, setSelectedFolder] = useState("collection");
  const [savedFolders, setSavedFolders] = useState([]);
  const [favorites, setfavorites] = useState([]);

  useEffect(() => {
    const storedFolders =
      JSON.parse(localStorage.getItem("mediaFolders")) || {};
    const storedfavorites =
      JSON.parse(localStorage.getItem("favorites")) || [];

    const mediaFolders = storedFolders[id] || [];

    setSavedFolders(mediaFolders);
    setfavorites(storedfavorites);
  }, [id]);

  const handleAddToFolder = () => {
    const storedFolders =
      JSON.parse(localStorage.getItem("mediaFolders")) || {};

    const currentFolders = storedFolders[id] || [];

    if (!currentFolders.includes(selectedFolder)) {
      storedFolders[id] = [...currentFolders, selectedFolder];
      localStorage.setItem("mediaFolders", JSON.stringify(storedFolders));
      setSavedFolders(storedFolders[id]);
    }
  };

  const toggleFavorite = () => {
    let updatedfavorites = [];

    if (favorites.includes(Number(id))) {
      updatedfavorites = favorites.filter((favId) => favId !== Number(id));
    } else {
      updatedfavorites = [...favorites, Number(id)];
    }

    setfavorites(updatedfavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedfavorites));
  };

  if (!media) {
    return <div className="text-white">Media not found.</div>;
  }

  return (
    <div className="text-white">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img
            src={media.poster}
            alt={media.title}
            className="w-full max-w-sm rounded-2xl border border-[#2A2A2A]"
          />
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4">{media.title}</h1>

          <div className="space-y-2 text-gray-300 mb-6">
            <p><span className="text-white font-medium">Year:</span> {media.year}</p>
            <p><span className="text-white font-medium">Rating:</span> {media.rating}</p>
            <p><span className="text-white font-medium">Type:</span> {media.type}</p>
            <p><span className="text-white font-medium">Genre:</span> {media.genre}</p>
            <p><span className="text-white font-medium">Language:</span> {media.language}</p>
            <p><span className="text-white font-medium">Description:</span> {media.description}</p>
          </div>

          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Add to Folder</h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-[#111] border border-gray-700 outline-none"
                >
                  <option value="collection">Collection</option>
                  <option value="movies">Movies</option>
                  <option value="tv">TV Series</option>
                  <option value="anime">Anime</option>
                </select>

                <button
                  onClick={handleAddToFolder}
                  className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>

              {savedFolders.length > 0 && (
                <p className="text-gray-400 mt-3">
                  Added in: {savedFolders.join(", ")}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Favourite</h2>

              <button
                onClick={toggleFavorite}
                className="px-4 py-3 rounded-lg bg-[#111] border border-gray-700 hover:border-blue-500 transition"
              >
                {favorites.includes(Number(id))
                  ? "Remove from favorites"
                  : "Add to favorites"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaDetail;