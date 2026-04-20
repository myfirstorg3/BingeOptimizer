// src/hooks/useFetchMedia.js
// Fetches all SEED entries from OMDB once and caches in module scope.
// All pages call this hook — only one batch of requests ever fires.

import { useState, useEffect } from "react";
import { SEED } from "../data/mockData";
import { getMovieById, normalize } from "../services/omdb";

let _cache = null; // module-level cache — persists across re-renders

export function useFetchMedia() {
  const [media, setMedia] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache) return; // already fetched
    let cancelled = false;

    async function fetchAll() {
      try {
        const results = await Promise.all(
          SEED.map(({ imdbID, ...overrides }) =>
            getMovieById(imdbID).then((omdb) => normalize(omdb, overrides))
          )
        );
        if (!cancelled) {
          _cache = results;
          setMedia(results);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { media, loading, error };
}