import { useState, useEffect } from "react";
import useDB from "../db/db";
import TierCard from "../components/TierCard";

const DEFAULT_TIERS = [
  { label: "S", color: "#FF7F7F" },
  { label: "A", color: "#FFBF7F" },
  { label: "B", color: "#FFFF7F" },
  { label: "C", color: "#7FFF7F" },
  { label: "D", color: "#7FBFFF" },
];

const TierList = () => {
  const movies = useDB();
  const [tiers, setTiers] = useState(
    DEFAULT_TIERS.map((t) => ({ ...t, movies: [] }))
  );
  const [unranked, setUnranked] = useState([]);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    if (movies.length > 0) {
      setUnranked(movies);
    }
  }, [movies]);

  const handleDragStart = (movie, from) => {
    setDragging({ movie, from });
  };

  const handleDropOnTier = (tierLabel) => {
    if (!dragging) return;
    let newUnranked = unranked;
    let newTiers = tiers.map((t) => ({
      ...t,
      movies: t.movies.filter((m) => m.id !== dragging.movie.id),
    }));
    if (dragging.from === "unranked") {
      newUnranked = unranked.filter((m) => m.id !== dragging.movie.id);
    }
    newTiers = newTiers.map((t) =>
      t.label === tierLabel
        ? { ...t, movies: [...t.movies, dragging.movie] }
        : t
    );
    setUnranked(newUnranked);
    setTiers(newTiers);
    setDragging(null);
  };

  const handleDropOnUnranked = () => {
    if (!dragging || dragging.from === "unranked") return;
    const newTiers = tiers.map((t) => ({
      ...t,
      movies: t.movies.filter((m) => m.id !== dragging.movie.id),
    }));
    setUnranked([...unranked, dragging.movie]);
    setTiers(newTiers);
    setDragging(null);
  };

  return (
    <div className="text-white w-full">
      <div className="flex flex-col gap-3 mb-8">
        {tiers.map((tier) => (
          <div
            key={tier.label}
            className="flex items-stretch min-h-[160px] rounded-lg overflow-hidden border border-[#2A2A2A]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDropOnTier(tier.label)}
          >
            <div
              className="w-[70px] min-w-[70px] flex items-center justify-center text-2xl font-bold text-black"
              style={{ backgroundColor: tier.color }}
            >
              {tier.label}
            </div>
            <div className="flex flex-wrap gap-3 p-3 flex-1 bg-[#1a1a1a]">
              {tier.movies.length === 0 && (
                <span className="text-[#444] text-sm self-center pl-2">
                  Drop movies here
                </span>
              )}
              {tier.movies.map((movie) => (
                <TierCard
                  key={movie.id}
                  title={movie.title}
                  poster={movie.poster}
                  rating={movie.rating?.toFixed(1)}
                  year={movie.year}
                  draggable={true}
                  onDragStart={() => handleDragStart(movie, tier.label)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="border border-[#2A2A2A] rounded-lg bg-[#1a1a1a] p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropOnUnranked}
      >
        <p className="text-[#737373] text-sm mb-3">
          Unranked — drag movies into tiers above
        </p>
        <div className="flex flex-wrap gap-3">
          {unranked.map((movie) => (
            <TierCard
              key={movie.id}
              title={movie.title}
              poster={movie.poster}
              rating={movie.rating?.toFixed(1)}
              year={movie.year}
              draggable={true}
              onDragStart={() => handleDragStart(movie, "unranked")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TierList;