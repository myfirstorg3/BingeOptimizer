import { useEffect, useRef, useState, useCallback } from "react";
import anime from "animejs";
import { useAuth } from "../context/AuthContext";
import "./Collection.css";

const API_BASE = "http://localhost:5000";
const FALLBACK  = "https://via.placeholder.com/300x450/0a0a0f/00e5ff?text=NO+POSTER";

const STATUS_META = {
  watching:  { label: "WATCHING",   color: "#00e5ff", icon: "▶" },
  unwatched: { label: "QUEUE",      color: "#f5c518", icon: "◎" },
  completed: { label: "COMPLETED",  color: "#4ade80", icon: "✓" },
};

async function apiFetch(path, token, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {})
    }
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || `${res.status}`); }
  return res.json();
}

// ─── Sort order: watching → unwatched → completed ────────────────
const SORT_ORDER = { watching: 0, unwatched: 1, completed: 2 };
function sortItems(items) {
  return [...items].sort((a, b) => {
    const ao = SORT_ORDER[a.watchStatus ?? "unwatched"] ?? 1;
    const bo = SORT_ORDER[b.watchStatus ?? "unwatched"] ?? 1;
    return ao - bo;
  });
}

export default function Collection() {
  const headerRef = useRef(null);
  const { user, token } = useAuth();

  const [collections, setCollections]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeCollId, setActiveCollId] = useState(null);
  const [activeType, setActiveType]     = useState("all");
  const [layout, setLayout]             = useState("grid");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState(null);

  // Title entrance
  useEffect(() => {
    anime({ targets: ".coll-title-char", translateY:[40,0], opacity:[0,1], delay: anime.stagger(30), duration:600, easing:"easeOutExpo" });
  }, []);

  // Animate collection cards in
  useEffect(() => {
    requestAnimationFrame(() => {
      anime({ targets: ".coll-bucket-card", opacity:[0,1], translateY:[20,0], scale:[0.97,1], delay: anime.stagger(50), duration:350, easing:"easeOutQuad" });
    });
  }, [collections.length]);

  // Animate media cards in when collection changes
  useEffect(() => {
    requestAnimationFrame(() => {
      anime({ targets: ".coll-card", opacity:[0,1], translateY:[16,0], scale:[0.97,1], delay: anime.stagger(35, { start:60 }), duration:320, easing:"easeOutQuad" });
    });
  }, [activeCollId, activeType, layout]);

  const loadCollections = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const raw = await apiFetch("/api/collections", token);
      const data = [...raw].sort((a, b) => {
        if (a.name === "Uncollected") return -1;
        if (b.name === "Uncollected") return 1;
        return a.name.localeCompare(b.name);
      });
      setCollections(data);
      if (data.length > 0 && !activeCollId) setActiveCollId(data[0].id);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadCollections(); }, [loadCollections]);

  const handleCreate = async () => {
    if (!createName.trim()) { setCreateError("Name is required"); return; }
    setCreating(true); setCreateError(null);
    try {
      const newColl = await apiFetch("/api/collections", token, {
        method: "POST",
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() })
      });
      setCollections(prev => [...prev, { ...newColl, items: [] }]);
      setActiveCollId(newColl.id);
      setShowCreate(false); setCreateName(""); setCreateDesc("");
    } catch (e) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleRemoveItem = async (collectionId, mediaId) => {
    // Optimistic
    setCollections(prev => prev.map(c =>
      c.id === collectionId ? { ...c, items: c.items.filter(i => i.mediaId !== mediaId) } : c
    ));
    try {
      await apiFetch(`/api/collections/${collectionId}/items/${mediaId}`, token, { method: "DELETE" });
    } catch {}
  };

  const handleStatusChange = async (collectionId, mediaId, watchStatus) => {
    // Optimistic local update + re-sort
    setCollections(prev => prev.map(c => {
      if (c.id !== collectionId) return c;
      const items = c.items.map(i => i.mediaId === mediaId ? { ...i, watchStatus } : i);
      return { ...c, items: sortItems(items) };
    }));
    try {
      await apiFetch(`/api/collections/${collectionId}/items/${mediaId}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ watchStatus })
      });
    } catch {}
  };

  const activeCollection = collections.find(c => c.id === activeCollId);
  const allItems = activeCollection?.items || [];
  const filteredItems = allItems.filter(item => activeType === "all" || item.media?.type === activeType);
  const TITLE = "COLLECTION";

  if (!user && !loading) {
    return (
      <div className="page coll-page">
        <div className="noise-overlay" />
        <div className="coll-login-required">
          <div className="font-display" style={{ fontSize:80, color:"var(--text-muted)", marginBottom:16 }}>🔒</div>
          <h2 className="font-display" style={{ fontSize:32, marginBottom:12 }}>LOGIN REQUIRED</h2>
          <p className="font-mono text-muted" style={{ fontSize:12, letterSpacing:"0.1em", marginBottom:24 }}>
            Your collections are private. Please log in to view them.
          </p>
          <a href="/login" className="btn btn--primary">LOG IN</a>
        </div>
      </div>
    );
  }

  return (
    <div className="page coll-page">
      <div className="noise-overlay" />

      {/* Header */}
      <div ref={headerRef} className="container coll-header">
        <div className="coll-header-top">
          <div>
            <div className="coll-eyebrow">
              <span className="tag tag--gold">MY ARCHIVE</span>
              <span className="font-mono text-muted" style={{ fontSize:11, letterSpacing:"0.14em" }}>
                {collections.length} COLLECTION{collections.length !== 1 ? "S" : ""} · {collections.reduce((s,c) => s+(c.items?.length||0), 0)} ENTRIES
              </span>
            </div>
            <h1 className="coll-title font-display" aria-label={TITLE}>
              {TITLE.split("").map((c,i) => <span key={i} className="coll-title-char">{c}</span>)}
            </h1>
            <p className="coll-sub">Curated cinematic archives. High-fidelity filtering enabled.</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
            <div className="layout-toggle">
              <button className={`layout-btn ${layout==="grid"?"active":""}`} onClick={() => setLayout("grid")} title="Grid view"><GridIcon /></button>
              <button className={`layout-btn ${layout==="list"?"active":""}`} onClick={() => setLayout("list")} title="List view"><ListIcon /></button>
            </div>
            <button className="btn btn--ghost coll-create-btn" onClick={() => setShowCreate(true)}>+ NEW COLLECTION</button>
          </div>
        </div>
      </div>

      {/* ── COLLECTION CARDS ── */}
      <div className="container" style={{ paddingBottom: activeCollId ? 0 : 60 }}>
        {loading ? (
          <div className="coll-loading"><div className="coll-spinner" />
            <div className="font-mono text-muted" style={{ fontSize:11, letterSpacing:"0.12em", marginTop:16 }}>LOADING COLLECTIONS...</div>
          </div>
        ) : error ? (
          <div className="no-results">
            <div className="font-display" style={{ fontSize:60, color:"var(--pink)" }}>!</div>
            <p className="font-mono text-muted" style={{ fontSize:12 }}>{error}</p>
            <button className="btn btn--ghost" style={{ marginTop:16 }} onClick={loadCollections}>RETRY</button>
          </div>
        ) : collections.length === 0 ? (
          <div className="no-results">
            <div className="font-display" style={{ fontSize:60, color:"var(--text-muted)" }}>∅</div>
            <p className="font-mono text-muted" style={{ fontSize:12, letterSpacing:"0.1em" }}>NO COLLECTIONS YET</p>
            <button className="btn btn--primary" style={{ marginTop:20 }} onClick={() => setShowCreate(true)}>CREATE YOUR FIRST COLLECTION</button>
          </div>
        ) : (
          <div className="coll-bucket-row">
            {collections.map(coll => (
              <CollectionBucketCard
                key={coll.id}
                coll={coll}
                active={activeCollId === coll.id}
                onClick={() => setActiveCollId(coll.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── MEDIA GRID for selected collection ── */}
      {activeCollection && (
        <>
          <div className="container" style={{ paddingTop:8 }}>
            {/* Type filter + section label */}
            <div className="coll-section-header">
              <span className="font-mono" style={{ fontSize:11, letterSpacing:"0.12em", color:"var(--cyan)" }}>
                {activeCollection.name.toUpperCase()}
              </span>
              <div className="coll-section-line" />
              <div className="filter-pills">
                {["all","movie","tv","anime"].map(t => (
                  <button key={t} className={`filter-pill ${activeType===t?"active":""}`} onClick={() => setActiveType(t)}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="container coll-grid-wrap" style={{ paddingBottom:80 }}>
            {filteredItems.length === 0 ? (
              <div className="no-results">
                <div className="font-display" style={{ fontSize:60, color:"var(--text-muted)" }}>∅</div>
                <p className="font-mono text-muted" style={{ fontSize:12, letterSpacing:"0.1em" }}>
                  {allItems.length === 0 ? "THIS COLLECTION IS EMPTY" : "NO ENTRIES MATCH FILTER"}
                </p>
                {allItems.length === 0 && (
                  <p className="text-muted" style={{ fontSize:13, marginTop:8 }}>
                    Go to <a href="/search" style={{ color:"var(--cyan)" }}>Search</a> and add media to this collection.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Status sections */}
                {["watching","unwatched","completed"].map(status => {
                  const group = filteredItems.filter(i => (i.watchStatus ?? "unwatched") === status);
                  if (group.length === 0) return null;
                  const meta = STATUS_META[status];
                  return (
                    <div key={status} className="coll-status-section">
                      <div className="coll-status-label">
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span className="font-mono" style={{ fontSize:10, letterSpacing:"0.14em", color: meta.color }}>{meta.label}</span>
                        <span className="font-mono text-muted" style={{ fontSize:10 }}>{group.length}</span>
                      </div>
                      <div className={`coll-grid ${layout==="list" ? "coll-grid--list" : ""}`}>
                        {group.map(item => (
                          <CollectionCard
                            key={item.id}
                            item={item}
                            layout={layout}
                            collectionId={activeCollId}
                            onRemove={() => handleRemoveItem(activeCollId, item.mediaId)}
                            onStatusChange={(s) => handleStatusChange(activeCollId, item.mediaId, s)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}

      {/* Create Collection Modal */}
      {showCreate && (
        <div className="coll-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="coll-modal glass" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            <h3 className="font-display" style={{ fontSize:22, marginBottom:20 }}>NEW COLLECTION</h3>
            <label className="coll-label font-mono">NAME *</label>
            <input className="coll-input" type="text" placeholder="e.g. Sci-Fi Classics" value={createName}
              onChange={e => setCreateName(e.target.value)} onKeyDown={e => e.key==="Enter" && handleCreate()} autoFocus />
            <label className="coll-label font-mono" style={{ marginTop:14 }}>DESCRIPTION</label>
            <input className="coll-input" type="text" placeholder="Optional description..." value={createDesc}
              onChange={e => setCreateDesc(e.target.value)} />
            {createError && <div className="font-mono" style={{ color:"#ff4d6d", fontSize:11, marginTop:8 }}>{createError}</div>}
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button className="btn btn--primary" style={{ flex:1 }} onClick={handleCreate} disabled={creating}>
                {creating ? "CREATING..." : "CREATE"}
              </button>
              <button className="btn btn--ghost" onClick={() => setShowCreate(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Collection Bucket Card ──────────────────────────────────────
function CollectionBucketCard({ coll, active, onClick }) {
  const ref = useRef(null);
  const items    = coll.items || [];
  const watching  = items.filter(i => i.watchStatus === "watching").length;
  const completed = items.filter(i => i.watchStatus === "completed").length;
  const queued    = items.filter(i => !i.watchStatus || i.watchStatus === "unwatched").length;
  const preview   = items.slice(0, 5);

  const handleMouse = e => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    anime({ targets: ref.current, rotateY: x*5, rotateX: -y*5, duration:200, easing:"easeOutQuad" });
  };
  const handleLeave = () => anime({ targets: ref.current, rotateY:0, rotateX:0, duration:400, easing:"easeOutElastic(1,0.6)" });

  return (
    <div
      ref={ref}
      className={`coll-bucket-card glass ${active ? "coll-bucket-card--active" : ""}`}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ transformStyle:"preserve-3d", perspective:"800px" }}
    >
      {/* Poster strip */}
      <div className="coll-bucket-posters">
        {preview.length > 0 ? preview.map((item, i) => (
          <img
            key={item.id}
            src={item.media?.posterUrl || FALLBACK}
            alt={item.media?.title}
            className="coll-bucket-poster"
            style={{ zIndex: preview.length - i, marginLeft: i === 0 ? 0 : -20 }}
            onError={e => { e.target.src = FALLBACK; }}
          />
        )) : (
          <div className="coll-bucket-empty font-mono text-muted">EMPTY</div>
        )}
      </div>

      {/* Info */}
      <div className="coll-bucket-info">
        <div className="coll-bucket-name">{coll.name}</div>
        <div className="coll-bucket-stats font-mono">
          <span>{items.length} ITEMS</span>
          {watching  > 0 && <span style={{ color:"#00e5ff" }}>▶ {watching}</span>}
          {queued    > 0 && <span style={{ color:"#f5c518" }}>◎ {queued}</span>}
          {completed > 0 && <span style={{ color:"#4ade80" }}>✓ {completed}</span>}
        </div>
      </div>

      {active && <div className="coll-bucket-active-bar" />}
    </div>
  );
}

// ─── Collection Media Card ───────────────────────────────────────
function CollectionCard({ item, layout, collectionId, onRemove, onStatusChange }) {
  const cardRef = useRef(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const media   = item.media;
  const poster  = media?.posterUrl || FALLBACK;
  const title   = media?.title || "Unknown";
  const year    = media?.releaseDate ? new Date(media.releaseDate).getFullYear() : "—";
  const rating  = media?.avgRating || null;
  const type    = media?.type || "—";
  const status  = item.watchStatus ?? "unwatched";
  const statusMeta = STATUS_META[status];

  let meta = {};
  try { meta = media?.description ? JSON.parse(media.description) : {}; } catch {}
  const genres = meta.genre ? meta.genre.split(", ") : [];

  const handleMouse = e => {
    if (layout === "list") return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    anime({ targets: cardRef.current, rotateY: x*8, rotateX: -y*8, duration:200, easing:"easeOutQuad" });
  };
  const handleLeave = () => {
    anime({ targets: cardRef.current, rotateY:0, rotateX:0, duration:400, easing:"easeOutElastic(1,0.6)" });
    setShowStatusMenu(false);
  };

  const cycleStatus = (e) => {
    e.stopPropagation();
    setShowStatusMenu(p => !p);
  };

  if (layout === "list") {
    return (
      <div className="coll-card coll-card--list glass" ref={cardRef}>
        <img src={poster} alt={title} className="coll-list-img" onError={e => { e.target.src = FALLBACK; }} />
        <div className="coll-list-info">
          <div className="coll-list-title">{title}</div>
          <div className="coll-list-meta font-mono">{year} · {type.toUpperCase()} {media?.durationMinutes ? `· ${media.durationMinutes}min` : ""}</div>
          <div className="coll-list-genres">
            {genres.slice(0, 3).map(g => <span key={g} className="tag tag--cyan" style={{ fontSize:9, padding:"2px 6px" }}>{g}</span>)}
          </div>
          {media?.synopsis && <p className="coll-list-synopsis">{media.synopsis.slice(0,120)}...</p>}
        </div>
        <div className="coll-list-right">
          {rating && (
            <>
              <div className="font-mono" style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>{rating}</div>
              <div className="font-mono text-muted" style={{ fontSize:10 }}>/10 IMDb</div>
            </>
          )}
          {/* Status cycle button */}
          <div className="coll-status-btn-wrap" style={{ marginTop:8, position:"relative" }}>
            <button className="coll-status-btn" style={{ color: statusMeta.color, borderColor: statusMeta.color }} onClick={cycleStatus}>
              {statusMeta.icon} {statusMeta.label}
            </button>
            {showStatusMenu && <StatusMenu current={status} onSelect={s => { onStatusChange(s); setShowStatusMenu(false); }} />}
          </div>
          <button className="coll-remove-btn" onClick={onRemove} title="Remove">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="coll-card media-card"
      style={{ transformStyle:"preserve-3d", perspective:"600px" }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      <img src={poster} alt={title} className="media-card__img" loading="lazy" onError={e => { e.target.src = FALLBACK; }} />
      {rating && <div className="coll-rating-badge font-mono">{rating}</div>}

      {/* Status badge */}
      <button
        className="coll-status-badge"
        style={{ background: statusMeta.color + "22", color: statusMeta.color, borderColor: statusMeta.color + "55" }}
        onClick={cycleStatus}
        title="Change status"
      >
        {statusMeta.icon}
      </button>
      {showStatusMenu && (
        <StatusMenu current={status} onSelect={s => { onStatusChange(s); setShowStatusMenu(false); }} style={{ top:40, left:8 }} />
      )}

      <button className="coll-remove-grid-btn" onClick={onRemove} title="Remove">✕</button>
      <div className="media-card__overlay">
        <div className="media-card__title">{title}</div>
        <div className="media-card__meta">{year} · {type.toUpperCase()}</div>
        {rating && <div style={{ marginTop:4, fontSize:11, color:"var(--gold)" }}>★ {rating}</div>}
        <div style={{ marginTop:4, fontSize:10, color: statusMeta.color }}>{statusMeta.icon} {statusMeta.label}</div>
      </div>
    </div>
  );
}

// ─── Status Menu ─────────────────────────────────────────────────
function StatusMenu({ current, onSelect, style = {} }) {
  return (
    <div className="coll-status-menu glass" style={style} onClick={e => e.stopPropagation()}>
      {Object.entries(STATUS_META).map(([key, meta]) => (
        <button
          key={key}
          className={`coll-status-menu-item ${current === key ? "active" : ""}`}
          style={{ "--status-color": meta.color }}
          onClick={() => onSelect(key)}
        >
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </button>
      ))}
    </div>
  );
}

function GridIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="0" y="0" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="8" y="0" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="0" y="8" width="6" height="6" rx="1" fill="currentColor"/>
    <rect x="8" y="8" width="6" height="6" rx="1" fill="currentColor"/>
  </svg>;
}
function ListIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="0" y="1" width="14" height="2" rx="1" fill="currentColor"/>
    <rect x="0" y="6" width="14" height="2" rx="1" fill="currentColor"/>
    <rect x="0" y="11" width="14" height="2" rx="1" fill="currentColor"/>
  </svg>;
}
