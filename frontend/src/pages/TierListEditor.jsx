import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import anime from "animejs";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";
import { searchOMDB } from "../services/omdb";
import "./TierList.css";

const API_BASE = "http://localhost:5000";
const TIERS = ["S", "A", "B", "C", "D"];
const TIER_COLORS = {
  S: { bg: "#e94057", glow: "rgba(233,64,87,0.2)", label: "#fff" },
  A: { bg: "#f5840c", glow: "rgba(245,132,12,0.2)", label: "#fff" },
  B: { bg: "#f5c518", glow: "rgba(245,197,24,0.2)", label: "#000" },
  C: { bg: "#00c896", glow: "rgba(0,200,150,0.2)", label: "#fff" },
  D: { bg: "#a78bfa", glow: "rgba(167,139,250,0.2)", label: "#fff" },
};
const FALLBACK = "https://via.placeholder.com/80x120/0a0a0f/00e5ff?text=?";

async function apiFetch(path, token, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function TierListEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const headerRef = useRef(null);
  const saveTimeout = useRef(null);
  const searchDebounce = useRef(null);

  const [tierList, setTierList]         = useState(null);
  const [tiers, setTiers]               = useState({ S: [], A: [], B: [], C: [], D: [], unranked: [] });
  const [dragging, setDragging]         = useState(null);
  const [hoveredTier, setHoveredTier]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  // Add-media panel
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addTab, setAddTab]             = useState("collection"); // "collection" | "search"
  const [collections, setCollections]   = useState([]);
  const [activeCollId, setActiveCollId] = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [addingId, setAddingId]         = useState(null);

  // All mediaIds already in this tier list (to show checkmarks)
  const allMediaIds = useCallback(() => {
    const ids = new Set();
    Object.values(tiers).forEach(arr => arr.forEach(item => {
      ids.add(item.mediaId || item.media?.id);
    }));
    return ids;
  }, [tiers]);

  // Load tier list from DB
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const tl = await apiFetch(`/api/tierlists/${id}`, token);
      setTierList(tl);
      const built = { S: [], A: [], B: [], C: [], D: [], unranked: [] };
      for (const item of tl.items) {
        const t = item.tier || "unranked";
        if (built[t]) built[t].push(item);
        else built.unranked.push(item);
      }
      Object.keys(built).forEach(k => built[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)));
      setTiers(built);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  // Load user collections for the add panel
  useEffect(() => {
    if (!token || !showAddPanel) return;
    apiFetch("/api/collections", token)
      .then(data => {
        // Pin Uncollected first
        const sorted = [...data].sort((a, b) => {
          if (a.name === "Uncollected") return -1;
          if (b.name === "Uncollected") return 1;
          return a.name.localeCompare(b.name);
        });
        setCollections(sorted);
        if (sorted.length > 0 && !activeCollId) setActiveCollId(sorted[0].id);
      })
      .catch(() => {});
  }, [token, showAddPanel]);

  // Entrance animations
  useEffect(() => {
    if (!tierList) return;
    anime({
      targets: headerRef.current?.querySelectorAll(".tl-letter"),
      translateY: [50, 0], opacity: [0, 1],
      delay: anime.stagger(40), duration: 700, easing: "easeOutExpo"
    });
    gsap.fromTo(".tier-row",
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, stagger: 0.08, duration: 0.5, delay: 0.2, ease: "power3.out" }
    );
  }, [tierList]);

  // Auto-save
  const autoSave = useCallback(async (newTiers) => {
    if (!token || !id) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true); setSaved(false);
      const items = [];
      let pos = 0;
      for (const [tier, arr] of Object.entries(newTiers)) {
        for (const item of arr) {
          items.push({ mediaId: item.mediaId || item.media?.id || item.id, tier, position: pos++ });
        }
      }
      try {
        await apiFetch(`/api/tierlists/${id}/items`, token, { method: "PUT", body: JSON.stringify({ items }) });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
      setSaving(false);
    }, 1500);
  }, [token, id]);

  // OMDB search debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const data = await searchOMDB(searchQuery);
        setSearchResults(data.Search || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 500);
  }, [searchQuery]);

  // Add item to this tier list (via backend, then update local state)
  const handleAddItem = async (mediaId, posterUrl, title, releaseYear) => {
    if (addingId === mediaId) return;
    if (allMediaIds().has(mediaId)) return; // already added
    setAddingId(mediaId);
    try {
      // First ensure media is in our DB by calling the detail endpoint
      await fetch(`${API_BASE}/api/media/${mediaId}`);

      // Then add to tier list
      const result = await apiFetch(`/api/tierlists/${id}/items/add`, token, {
        method: "POST",
        body: JSON.stringify({ mediaId })
      });

      if (!result.duplicate) {
        // Add to local unranked state with a synthetic item structure
        const newItem = result.item || {
          id: crypto.randomUUID(),
          mediaId,
          tier: "unranked",
          position: 999,
          media: { id: mediaId, posterUrl, title, releaseDate: releaseYear ? `${releaseYear}-01-01` : null, avgRating: null }
        };
        setTiers(prev => ({ ...prev, unranked: [...prev.unranked, newItem] }));
        anime({ targets: ".unranked-pool", borderColor: ["rgba(0,229,255,0.5)", "var(--border)"], duration: 800 });
      }
    } catch (e) {
      console.error("Add item error:", e);
    } finally {
      setAddingId(null);
    }
  };

  // Drag handlers
  const onDragStart = (e, item, fromTier) => {
    setDragging({ item, fromTier });
    e.dataTransfer.effectAllowed = "move";
    anime({ targets: e.currentTarget, scale: 0.9, opacity: 0.5, duration: 150 });
  };
  const onDragEnd = (e) => {
    setDragging(null); setHoveredTier(null);
    anime({ targets: e.currentTarget, scale: 1, opacity: 1, duration: 200 });
  };
  const onDrop = (e, toTier) => {
    e.preventDefault();
    if (!dragging) return;
    const { item, fromTier } = dragging;
    if (fromTier === toTier) { setHoveredTier(null); return; }
    setTiers(prev => {
      const next = { ...prev };
      next[fromTier] = next[fromTier].filter(x => (x.mediaId || x.id) !== (item.mediaId || item.id));
      next[toTier]   = [...next[toTier], item];
      autoSave(next);
      return next;
    });
    setHoveredTier(null);
    setTimeout(() => {
      const row = document.querySelector(`[data-tier="${toTier}"]`);
      if (row) anime({ targets: row, backgroundColor: [TIER_COLORS[toTier]?.glow || "rgba(0,229,255,0.1)", "rgba(0,0,0,0)"], duration: 600, easing: "easeOutQuad" });
    }, 50);
  };
  const removeFromTier = (item, fromTier) => {
    setTiers(prev => {
      const next = { ...prev };
      next[fromTier] = next[fromTier].filter(x => (x.mediaId || x.id) !== (item.mediaId || item.id));
      next.unranked  = [...next.unranked, item];
      autoSave(next);
      return next;
    });
  };

  const activeCollection = collections.find(c => c.id === activeCollId);
  const currentIds = allMediaIds();
  const title = tierList?.title || "TIER LIST";

  if (!user && !loading) {
    return (
      <div className="page tier-page">
        <div className="noise-overlay" />
        <div className="coll-login-required">
          <h2 className="font-display" style={{ fontSize: 32 }}>LOGIN REQUIRED</h2>
          <a href="/login" className="btn btn--primary" style={{ marginTop: 20 }}>LOG IN</a>
        </div>
      </div>
    );
  }

  return (
    <div className="page tier-page">
      <div className="noise-overlay" />

      {/* Header */}
      <div ref={headerRef} className="container tl-header">
        <div className="tl-eyebrow">
          <button className="tl-back-btn btn btn--ghost" onClick={() => navigate("/tierlist")}>← BACK</button>
          <span className="tag tag--pink">RANKING</span>
          <span className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.14em" }}>DRAG &amp; DROP TO REORDER</span>
          {tierList?.collection && (
            <span className="font-mono text-muted" style={{ fontSize: 11 }}>📁 {tierList.collection.name}</span>
          )}
          <span className="tl-save-status font-mono">{saving ? "SAVING..." : saved ? "✓ SAVED" : ""}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <h1 className="tl-title font-display" aria-label={title} style={{ fontSize: "clamp(40px, 8vw, 110px)" }}>
            {loading ? <span className="tl-letter" style={{ opacity: 1 }}>LOADING...</span>
              : title.split("").map((c, i) => (
                <span key={i} className={`tl-letter ${c === " " ? "tl-space" : ""}`}>{c === " " ? "\u00A0" : c}</span>
              ))}
          </h1>
          {!loading && (
            <button
              className={`btn tl-add-media-btn ${showAddPanel ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setShowAddPanel(p => !p)}
            >
              {showAddPanel ? "✕ CLOSE" : "+ ADD MEDIA"}
            </button>
          )}
        </div>
        {tierList?.description && <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8 }}>{tierList.description}</p>}
      </div>

      {/* Main layout: tier editor + optional add panel */}
      <div className={`container tl-editor-layout ${showAddPanel ? "tl-editor-layout--panel" : ""}`}>

        {/* Tier rows */}
        <div className="tl-body-inner">
          {loading ? (
            <div className="coll-loading">
              <div className="coll-spinner" />
              <div className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", marginTop: 16 }}>LOADING TIER LIST...</div>
            </div>
          ) : (
            <>
              <div className="tier-list-grid">
                {TIERS.map(tier => {
                  const color = TIER_COLORS[tier];
                  return (
                    <div
                      key={tier}
                      data-tier={tier}
                      className={`tier-row ${hoveredTier === tier ? "tier-row--hovered" : ""}`}
                      onDragOver={e => { e.preventDefault(); setHoveredTier(tier); }}
                      onDragLeave={() => setHoveredTier(null)}
                      onDrop={e => onDrop(e, tier)}
                      style={{ "--tier-color": color.bg, "--tier-glow": color.glow }}
                    >
                      <div className="tier-label" style={{ background: color.bg, color: color.label }}>
                        <span className="font-display">{tier}</span>
                      </div>
                      <div className="tier-items">
                        {tiers[tier].map(item => (
                          <TierItem key={item.id} item={item} tier={tier}
                            onDragStart={onDragStart} onDragEnd={onDragEnd} onRemove={removeFromTier} />
                        ))}
                        {tiers[tier].length === 0 && <div className="tier-empty font-mono">DROP HERE</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className={`unranked-pool glass ${hoveredTier === "unranked" ? "unranked-pool--hovered" : ""}`}
                onDragOver={e => { e.preventDefault(); setHoveredTier("unranked"); }}
                onDragLeave={() => setHoveredTier(null)}
                onDrop={e => onDrop(e, "unranked")}
              >
                <div className="unranked-header">
                  <span className="font-mono text-muted" style={{ fontSize: 10, letterSpacing: "0.16em" }}>UNRANKED POOL</span>
                  <span className="font-mono text-muted" style={{ fontSize: 10 }}>{tiers.unranked.length} ITEMS</span>
                </div>
                <div className="unranked-items">
                  {tiers.unranked.map(item => (
                    <TierItem key={item.id} item={item} tier="unranked"
                      onDragStart={onDragStart} onDragEnd={onDragEnd} onRemove={() => {}} unranked />
                  ))}
                  {tiers.unranked.length === 0 && <div className="tier-empty font-mono">ALL RANKED ✓</div>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ADD MEDIA PANEL */}
        {showAddPanel && (
          <div className="tl-add-panel glass">
            <div className="tl-add-panel-header">
              <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--cyan)" }}>ADD MEDIA</span>
            </div>

            {/* Tabs */}
            <div className="tl-add-tabs">
              <button className={`tl-add-tab ${addTab === "collection" ? "active" : ""}`} onClick={() => setAddTab("collection")}>
                📁 FROM COLLECTION
              </button>
              <button className={`tl-add-tab ${addTab === "search" ? "active" : ""}`} onClick={() => setAddTab("search")}>
                🔍 SEARCH
              </button>
            </div>

            {/* Collection tab */}
            {addTab === "collection" && (
              <div className="tl-add-content">
                {/* Collection picker */}
                <div className="tl-coll-tabs">
                  {collections.map(c => (
                    <button
                      key={c.id}
                      className={`tl-coll-tab ${activeCollId === c.id ? "active" : ""}`}
                      onClick={() => setActiveCollId(c.id)}
                    >
                      {c.name} <span className="coll-tab-count">{c.items?.length || 0}</span>
                    </button>
                  ))}
                </div>

                <div className="tl-add-results">
                  {!activeCollection || activeCollection.items?.length === 0 ? (
                    <div className="font-mono text-muted" style={{ fontSize: 11, padding: "20px 0", textAlign: "center" }}>
                      THIS COLLECTION IS EMPTY
                    </div>
                  ) : (
                    activeCollection.items.map(ci => {
                      const media = ci.media;
                      const alreadyAdded = currentIds.has(media?.id);
                      return (
                        <AddMediaRow
                          key={ci.id}
                          poster={media?.posterUrl}
                          title={media?.title || "Unknown"}
                          year={media?.releaseDate ? new Date(media.releaseDate).getFullYear() : "—"}
                          rating={media?.avgRating}
                          alreadyAdded={alreadyAdded}
                          loading={addingId === media?.id}
                          onAdd={() => handleAddItem(media?.id, media?.posterUrl, media?.title, media?.releaseDate?.substring(0,4))}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Search tab */}
            {addTab === "search" && (
              <div className="tl-add-content">
                <input
                  className="coll-input"
                  type="text"
                  placeholder="Search movies, series..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <div className="tl-add-results" style={{ marginTop: 10 }}>
                  {searching && (
                    <div className="font-mono text-muted" style={{ fontSize: 11, padding: "12px 0", textAlign: "center" }}>SEARCHING...</div>
                  )}
                  {!searching && searchResults.map(r => {
                    const alreadyAdded = currentIds.has(r.imdbID);
                    return (
                      <AddMediaRow
                        key={r.imdbID}
                        poster={r.Poster !== "N/A" ? r.Poster : null}
                        title={r.Title}
                        year={r.Year}
                        alreadyAdded={alreadyAdded}
                        loading={addingId === r.imdbID}
                        onAdd={() => handleAddItem(r.imdbID, r.Poster !== "N/A" ? r.Poster : null, r.Title, r.Year)}
                      />
                    );
                  })}
                  {!searching && searchQuery && searchResults.length === 0 && (
                    <div className="font-mono text-muted" style={{ fontSize: 11, padding: "12px 0", textAlign: "center" }}>NO RESULTS</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Media Row ────────────────────────────────────────────────
function AddMediaRow({ poster, title, year, rating, alreadyAdded, loading, onAdd }) {
  return (
    <div className="tl-add-row">
      <img src={poster || FALLBACK} alt={title} className="tl-add-row-img" onError={e => { e.target.src = FALLBACK; }} />
      <div className="tl-add-row-info">
        <div className="tl-add-row-title">{title}</div>
        <div className="font-mono text-muted" style={{ fontSize: 10 }}>
          {year}{rating ? ` · ★ ${rating}` : ""}
        </div>
      </div>
      <button
        className={`tl-add-row-btn ${alreadyAdded ? "tl-add-row-btn--added" : ""}`}
        onClick={onAdd}
        disabled={alreadyAdded || loading}
        title={alreadyAdded ? "Already in tier list" : "Add to unranked pool"}
      >
        {loading ? "…" : alreadyAdded ? "✓" : "+"}
      </button>
    </div>
  );
}

// ─── TierItem ─────────────────────────────────────────────────────
function TierItem({ item, tier, onDragStart, onDragEnd, onRemove, unranked }) {
  const ref = useRef(null);
  const media = item.media;
  const poster = media?.posterUrl || FALLBACK;
  const title = media?.title || "Unknown";
  const year = media?.releaseDate ? new Date(media.releaseDate).getFullYear() : "—";
  const rating = media?.avgRating || null;

  return (
    <div
      ref={ref}
      className="tier-item"
      draggable
      onDragStart={e => onDragStart(e, item, tier)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => anime({ targets: ref.current, scale: 1.05, duration: 200, easing: "easeOutQuad" })}
      onMouseLeave={() => anime({ targets: ref.current, scale: 1, duration: 200, easing: "easeOutQuad" })}
      title={title}
    >
      <img src={poster} alt={title} className="tier-item__img" onError={e => { e.target.src = FALLBACK; }} />
      <div className="tier-item__tooltip">
        <div className="font-ui" style={{ fontWeight: 700, fontSize: 12 }}>{title}</div>
        <div className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{year}{rating ? ` · ★ ${rating}` : ""}</div>
      </div>
      {!unranked && <button className="tier-item__remove" onClick={() => onRemove(item, tier)} title="Move to unranked">×</button>}
    </div>
  );
}
