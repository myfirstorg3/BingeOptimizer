import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import anime from "animejs";
import { searchOMDB, normalize } from "../services/omdb";
import { useAuth } from "../context/AuthContext";
import "./Search.css";

const API_BASE = "http://localhost:5000";

async function getMediaDetails(imdbID) {
  const res = await fetch(`${API_BASE}/api/media/${imdbID}`);
  if (!res.ok) throw new Error("Failed to fetch media details");
  return res.json();
}

async function pollAISummary(imdbID) {
  const res = await fetch(`${API_BASE}/api/media/${imdbID}/ai-summary`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.ready ? data.aiSummary : null;
}

async function getUserCollections(token) {
  const res = await fetch(`${API_BASE}/api/collections`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  return res.json();
}

async function addToCollectionAPI(imdbID, collectionId, newCollectionName, token) {
  const res = await fetch(`${API_BASE}/api/media/${imdbID}/collect`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ collectionId: collectionId || null, newCollectionName: newCollectionName || null })
  });
  if (!res.ok) throw new Error("Failed to add to collection");
  return res.json();
}

export default function Search() {
  const inputRef   = useRef(null);
  const resultsRef = useRef(null);
  const bgTextRef  = useRef(null);
  const pollRef    = useRef(null);

  const { user, token } = useAuth();

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [typed,   setTyped]   = useState(false);
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);

  // Modal state
  const [modal, setModal]               = useState(null); // { media, rawOMDB, aiSummary, generatingAI }
  const [loadingModal, setLoadingModal] = useState(false);
  const [aiSummary, setAiSummary]       = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Collection UI state
  const [showCollectUI, setShowCollectUI]       = useState(false);
  const [userCollections, setUserCollections]   = useState([]);
  const [collectTarget, setCollectTarget]       = useState("uncollected"); // "uncollected" | collectionId
  const [newCollName, setNewCollName]           = useState("");
  const [creating, setCreating]                 = useState(false);
  const [collectSuccess, setCollectSuccess]     = useState(false);
  const [collectError, setCollectError]         = useState(null);

  // Entrance animations
  useEffect(() => {
    gsap.fromTo(".search-title-word",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: "power3.out" }
    );
    gsap.fromTo(".search-input-wrap",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, delay: 0.4, duration: 0.6, ease: "power3.out" }
    );
    anime({
      targets: ".void-text",
      translateX: ["0%", "2%"],
      direction: "alternate",
      loop: true,
      duration: 8000,
      easing: "easeInOutSine",
    });
    setTimeout(() => inputRef.current?.focus(), 600);
  }, []);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Debounced OMDB search
  const doSearch = useCallback((q) => {
    if (!q.trim()) { setResults([]); setTyped(false); return; }
    setTyped(true);
    setSearching(true);

    searchOMDB(q)
      .then((data) => {
        const normalized = data.Search.map((m) => normalize(m, { score: "B", mood: [], price: null }));
        setResults(normalized);
        setSearching(false);
        requestAnimationFrame(() => {
          const cards = resultsRef.current?.querySelectorAll(".search-result-card");
          if (cards?.length > 0) {
            anime({ targets: cards, opacity: [0,1], translateX: [-20,0], delay: anime.stagger(50), duration: 350, easing: "easeOutQuad" });
          }
        });
      })
      .catch(() => { setResults([]); setSearching(false); });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const closeModal = () => {
    setModal(null);
    setAiSummary(null);
    setGeneratingAI(false);
    setShowCollectUI(false);
    setCollectSuccess(false);
    setCollectError(null);
    setNewCollName("");
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleCardClick = async (imdbId) => {
    closeModal();
    setLoadingModal(true);
    try {
      const data = await getMediaDetails(imdbId);
      setModal(data);
      setAiSummary(data.aiSummary);
      if (data.generatingAI) {
        setGeneratingAI(true);
        // Poll every 4s until AI summary is ready
        pollRef.current = setInterval(async () => {
          const summary = await pollAISummary(imdbId);
          if (summary) {
            setAiSummary(summary);
            setGeneratingAI(false);
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }, 4000);
      }
      // Load user collections in background
      if (user && token) {
        getUserCollections(token).then(setUserCollections).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setModal(null);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCollect = async () => {
    if (!user || !token) return;
    setCollectError(null);
    try {
      const cId = collectTarget === "uncollected" ? null : collectTarget === "new" ? null : collectTarget;
      const cName = collectTarget === "new" ? newCollName : null;
      if (collectTarget === "new" && !newCollName.trim()) {
        setCollectError("Please enter a collection name.");
        return;
      }
      await addToCollectionAPI(modal.media.externalId, cId, cName, token);
      setCollectSuccess(true);
      setShowCollectUI(false);
      // Refresh collections
      getUserCollections(token).then(setUserCollections).catch(() => {});
    } catch (err) {
      setCollectError("Failed to add to collection. Please try again.");
    }
  };

  const parsedMeta = modal?.rawOMDB ? (typeof modal.rawOMDB === "string" ? JSON.parse(modal.rawOMDB) : modal.rawOMDB) : null;

  const SUGGESTIONS = ["Inception", "Naruto", "Breaking Bad", "Dune", "Attack on Titan", "Avatar"];

  return (
    <div className="page search-page">
      <div className="noise-overlay" />
      <div ref={bgTextRef} className="void-text font-display">QUERY&nbsp;THE&nbsp;VOID</div>

      <div className="container search-wrap">
        <div className="search-title">
          {"Query the Void.".split(" ").map((word, i) => (
            <span key={i} className="search-title-word font-display">{word}</span>
          ))}
        </div>

        <div className={`search-input-wrap ${focused ? "focused" : ""}`}>
          <div className="search-icon"><SearchIcon /></div>
          <input
            ref={inputRef}
            type="text"
            className="search-big-input"
            placeholder="Search movies, series, anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query && (
            <button className="search-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>×</button>
          )}
        </div>

        {!typed && (
          <div className="search-suggestions">
            <span className="font-mono text-muted" style={{ fontSize: 10, letterSpacing: "0.14em" }}>TRY:</span>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion-chip" onClick={() => setQuery(s)}>{s}</button>
            ))}
          </div>
        )}

        {typed && (
          <div ref={resultsRef} className="search-results">
            <div className="results-header">
              <span className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
                {searching ? "SEARCHING..." : `${results.length} ${results.length === 1 ? "RESULT" : "RESULTS"} FOR "${query.toUpperCase()}"`}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)", margin: "0 16px" }} />
              <div className="filter-pills" style={{ display: "flex", gap: 4 }}>
                {["all", "movie", "series", "anime"].map((t) => (
                  <button key={t} className="filter-pill active" style={{ padding: "3px 10px" }}>{t}</button>
                ))}
              </div>
            </div>

            {!searching && results.length === 0 ? (
              <div className="no-results-msg">
                <span className="font-display" style={{ fontSize: 80, color: "var(--text-muted)" }}>∅</span>
                <p className="font-mono text-muted" style={{ fontSize: 12, letterSpacing: "0.12em", marginTop: 16 }}>
                  VOID RETURNED NOTHING
                </p>
              </div>
            ) : (
              <div className="search-results-grid">
                {results.map((item) => (
                  <SearchResultCard key={item.id} item={item} onClick={() => handleCardClick(item.id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {(loadingModal || modal) && (
        <div className="media-modal-overlay" onClick={closeModal}>
          <div className="media-modal-content glass" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>

            {loadingModal ? (
              <div className="modal-loading">
                <div className="modal-loading-spinner" />
                <div className="font-mono text-muted" style={{ fontSize: 12, letterSpacing: "0.1em", marginTop: 16 }}>
                  FETCHING FROM DATABASE...
                </div>
              </div>
            ) : modal && (
              <div className="media-details-layout">
                {/* LEFT: Poster */}
                <div className="md-poster-col">
                  <div className="md-poster-wrap">
                    <img
                      src={modal.media.posterUrl || "https://via.placeholder.com/300x450/0a0a0f/00e5ff?text=NO+POSTER"}
                      alt={modal.media.title}
                    />
                    {modal.media.avgRating && (
                      <div className="md-imdb-badge">
                        <span style={{ color: "#f5c518", fontSize: 11, fontWeight: 700 }}>IMDb</span>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{modal.media.avgRating}</span>
                        <span className="text-muted" style={{ fontSize: 10 }}>/10</span>
                      </div>
                    )}
                  </div>

                  {/* Meta pills */}
                  <div className="md-meta-pills">
                    {parsedMeta?.rated && <span className="md-pill">{parsedMeta.rated}</span>}
                    <span className="md-pill">{modal.media.type?.toUpperCase()}</span>
                    {modal.media.durationMinutes && <span className="md-pill">{modal.media.durationMinutes} min</span>}
                    {modal.media.language && <span className="md-pill">{modal.media.language}</span>}
                  </div>

                  {parsedMeta?.rottenTomatoes && (
                    <div className="md-rt-score">
                      <span style={{ fontSize: 18 }}>🍅</span>
                      <span className="font-mono" style={{ fontSize: 14, fontWeight: 700 }}>{parsedMeta.rottenTomatoes}</span>
                    </div>
                  )}
                </div>

                {/* RIGHT: Info */}
                <div className="md-info">
                  <h2 className="font-display md-title">{modal.media.title}</h2>

                  <div className="md-subtitle font-mono">
                    {modal.media.releaseDate?.substring(0, 4)}
                    {parsedMeta?.genre && ` · ${parsedMeta.genre}`}
                  </div>

                  {/* Synopsis */}
                  {modal.media.synopsis && (
                    <p className="md-synopsis">{modal.media.synopsis}</p>
                  )}

                  {/* Crew / Cast */}
                  <div className="md-crew">
                    {parsedMeta?.director && (
                      <div className="md-crew-row">
                        <span className="font-mono md-crew-label">DIRECTOR</span>
                        <span className="md-crew-value">{parsedMeta.director}</span>
                      </div>
                    )}
                    {parsedMeta?.actors && (
                      <div className="md-crew-row">
                        <span className="font-mono md-crew-label">CAST</span>
                        <span className="md-crew-value">{parsedMeta.actors}</span>
                      </div>
                    )}
                    {parsedMeta?.awards && parsedMeta.awards !== "N/A" && (
                      <div className="md-crew-row">
                        <span className="font-mono md-crew-label">AWARDS</span>
                        <span className="md-crew-value" style={{ color: "#f5c518" }}>🏆 {parsedMeta.awards}</span>
                      </div>
                    )}
                    {parsedMeta?.boxOffice && (
                      <div className="md-crew-row">
                        <span className="font-mono md-crew-label">BOX OFFICE</span>
                        <span className="md-crew-value">{parsedMeta.boxOffice}</span>
                      </div>
                    )}
                  </div>

                  {/* AI Review Section */}
                  <div className="md-ai-block">
                    <div className="md-ai-header">
                      <h3 className="font-mono md-ai-label">✦ GEMINI AI CONSENSUS</h3>
                      {aiSummary && (
                        <div className="md-sentiment-badge" style={{
                          background: aiSummary.sentimentScore >= 8 ? "rgba(255,45,107,0.85)" :
                                      aiSummary.sentimentScore >= 6 ? "rgba(255,184,0,0.85)" :
                                      aiSummary.sentimentScore >= 4 ? "rgba(255,120,0,0.85)" : "rgba(100,100,120,0.85)"
                        }}>
                          {aiSummary.sentimentScore.toFixed(1)}/10
                        </div>
                      )}
                    </div>

                    {generatingAI && !aiSummary ? (
                      <div className="md-ai-generating">
                        <div className="ai-skeleton-line" style={{ width: "100%" }} />
                        <div className="ai-skeleton-line" style={{ width: "85%" }} />
                        <div className="ai-skeleton-line" style={{ width: "92%" }} />
                        <div className="ai-skeleton-line" style={{ width: "70%" }} />
                        <div className="font-mono text-muted" style={{ fontSize: 10, marginTop: 8, letterSpacing: "0.1em" }}>
                          GEMINI IS ANALYSING...
                        </div>
                      </div>
                    ) : aiSummary ? (
                      <p className="md-ai-text">{aiSummary.summaryText}</p>
                    ) : (
                      <p className="md-ai-text text-muted" style={{ fontStyle: "italic" }}>
                        AI review not available.
                      </p>
                    )}
                  </div>

                  {/* Collection Actions */}
                  {collectSuccess ? (
                    <div className="md-collect-success font-mono">
                      ✓ ADDED TO COLLECTION
                    </div>
                  ) : user ? (
                    <div className="md-collect-area">
                      {!showCollectUI ? (
                        <button className="btn btn--primary md-collect-btn" onClick={() => setShowCollectUI(true)}>
                          + ADD TO COLLECTION
                        </button>
                      ) : (
                        <div className="md-collect-panel glass">
                          <div className="font-mono" style={{ fontSize: 11, color: "var(--cyan)", letterSpacing: "0.1em", marginBottom: 12 }}>
                            SELECT COLLECTION
                          </div>

                          <div className="md-collect-options">
                            <label className="md-collect-option">
                              <input type="radio" name="collection" value="uncollected"
                                checked={collectTarget === "uncollected"}
                                onChange={() => setCollectTarget("uncollected")} />
                              <span>📥 Uncollected</span>
                            </label>

                            {userCollections.map(c => (
                              <label key={c.id} className="md-collect-option">
                                <input type="radio" name="collection" value={c.id}
                                  checked={collectTarget === c.id}
                                  onChange={() => setCollectTarget(c.id)} />
                                <span>📁 {c.name}</span>
                              </label>
                            ))}

                            <label className="md-collect-option">
                              <input type="radio" name="collection" value="new"
                                checked={collectTarget === "new"}
                                onChange={() => setCollectTarget("new")} />
                              <span>✨ New Collection</span>
                            </label>
                          </div>

                          {collectTarget === "new" && (
                            <input
                              className="md-collect-input"
                              type="text"
                              placeholder="Collection name..."
                              value={newCollName}
                              onChange={e => setNewCollName(e.target.value)}
                            />
                          )}

                          {collectError && (
                            <div className="font-mono" style={{ color: "#ff4d6d", fontSize: 11, marginTop: 8 }}>{collectError}</div>
                          )}

                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleCollect}>
                              CONFIRM
                            </button>
                            <button className="btn btn--ghost" onClick={() => setShowCollectUI(false)}>
                              CANCEL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="md-login-prompt font-mono">
                      <a href="/login" style={{ color: "var(--cyan)" }}>LOG IN</a> to add to your collection
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ item, onClick }) {
  const FALLBACK = "https://via.placeholder.com/300x450/0a0a0f/00e5ff?text=NO+POSTER";
  const rating = item.rating && !isNaN(item.rating) ? item.rating : null;

  return (
    <div className="search-result-card glass" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="src-poster">
        <img src={item.poster || FALLBACK} alt={item.title} onError={(e) => { e.target.src = FALLBACK; }} />
      </div>
      <div className="src-info">
        <div className="src-title">{item.title}</div>
        <div className="src-meta font-mono">
          {item.year > 0 ? item.year : "—"} · {item.type.toUpperCase()}
          {item.duration ? ` · ${item.duration}min` : ""}
        </div>
        <div className="src-genres">
          {item.genre.filter(g => g && g !== "Unknown").map((g) => (
            <span key={g} className="tag tag--cyan" style={{ fontSize: 9, padding: "2px 6px" }}>{g}</span>
          ))}
        </div>
      </div>
      <div className="src-actions">
        <div className="src-rating">
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            {rating ?? "—"}
          </span>
          {rating && <span className="font-mono text-muted" style={{ fontSize: 10 }}>/10</span>}
        </div>
        <button className="btn btn--primary" style={{ fontSize: 10, padding: "6px 14px" }}>VIEW</button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
