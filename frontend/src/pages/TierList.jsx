import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import anime from "animejs";
import { useAuth } from "../context/AuthContext";
import "./TierList.css";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000");
const TIERS = ["S", "A", "B", "C", "D"];
const TIER_COLORS = {
  S: { bg: "#e94057", label: "#fff" },
  A: { bg: "#f5840c", label: "#fff" },
  B: { bg: "#f5c518", label: "#000" },
  C: { bg: "#00c896", label: "#fff" },
  D: { bg: "#a78bfa", label: "#fff" },
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
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function TierListGallery() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const headerRef = useRef(null);

  const [tierLists, setTierLists]   = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle]   = useState("");
  const [createDesc, setCreateDesc]     = useState("");
  const [createCollId, setCreateCollId] = useState("");
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState(null);

  // Entrance animation
  useEffect(() => {
    anime({
      targets: headerRef.current?.querySelectorAll(".tl-letter"),
      translateY: [50, 0], opacity: [0, 1],
      delay: anime.stagger(40), duration: 700, easing: "easeOutExpo"
    });
  }, []);

  // Animate cards in
  useEffect(() => {
    requestAnimationFrame(() => {
      anime({
        targets: ".tl-card",
        opacity: [0, 1], translateY: [20, 0], scale: [0.97, 1],
        delay: anime.stagger(60, { start: 100 }), duration: 400, easing: "easeOutQuad"
      });
    });
  }, [tierLists]);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const [tls, colls] = await Promise.all([
        apiFetch("/api/tierlists", token),
        apiFetch("/api/collections", token)
      ]);
      setTierLists(tls);
      setCollections(colls);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!createTitle.trim()) { setCreateError("Title is required"); return; }
    setCreating(true);
    setCreateError(null);
    try {
      const tl = await apiFetch("/api/tierlists", token, {
        method: "POST",
        body: JSON.stringify({
          title: createTitle.trim(),
          description: createDesc.trim() || null,
          collectionId: createCollId || null
        })
      });
      setTierLists(prev => [...prev, tl]);
      setShowCreate(false);
      setCreateTitle(""); setCreateDesc(""); setCreateCollId("");
      navigate(`/tierlist/${tl.id}`);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this tier list?")) return;
    try {
      await apiFetch(`/api/tierlists/${id}`, token, { method: "DELETE" });
      setTierLists(prev => prev.filter(t => t.id !== id));
    } catch {}
  };

  const handleTogglePublic = async (e, id, currentIsPublic) => {
    e.stopPropagation();
    const newVal = !currentIsPublic;
    setTierLists(prev => prev.map(t => t.id === id ? { ...t, isPublic: newVal } : t));
    try {
      await apiFetch(`/api/tierlists/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ isPublic: newVal })
      });
    } catch {
      setTierLists(prev => prev.map(t => t.id === id ? { ...t, isPublic: currentIsPublic } : t));
    }
  };

  const TITLE = "TIER LIST";

  if (!user && !loading) {
    return (
      <div className="page tier-page">
        <div className="noise-overlay" />
        <div className="coll-login-required">
          <div className="font-display" style={{ fontSize: 80, color: "var(--text-muted)", marginBottom: 16 }}>🔒</div>
          <h2 className="font-display" style={{ fontSize: 32, marginBottom: 12 }}>LOGIN REQUIRED</h2>
          <p className="font-mono text-muted" style={{ fontSize: 12, letterSpacing: "0.1em", marginBottom: 24 }}>
            Log in to create and manage your tier lists.
          </p>
          <a href="/login" className="btn btn--primary">LOG IN</a>
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
          <span className="tag tag--pink">RANKING</span>
          <span className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
            {tierLists.length} TIER LIST{tierLists.length !== 1 ? "S" : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <h1 className="tl-title font-display" aria-label={TITLE}>
            {TITLE.split("").map((c, i) => (
              <span key={i} className={`tl-letter ${c === " " ? "tl-space" : ""}`}>
                {c === " " ? "\u00A0" : c}
              </span>
            ))}
          </h1>
          <button className="btn btn--primary tl-create-btn" onClick={() => setShowCreate(true)}>
            + NEW TIER LIST
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="container tl-gallery">
        {loading ? (
          <div className="coll-loading">
            <div className="coll-spinner" />
            <div className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.12em", marginTop: 16 }}>
              LOADING TIER LISTS...
            </div>
          </div>
        ) : error ? (
          <div className="no-results">
            <div className="font-display" style={{ fontSize: 60, color: "var(--pink)" }}>!</div>
            <p className="font-mono text-muted" style={{ fontSize: 12, letterSpacing: "0.1em" }}>{error}</p>
          </div>
        ) : tierLists.length === 0 ? (
          <div className="no-results">
            <div className="font-display" style={{ fontSize: 60, color: "var(--text-muted)" }}>∅</div>
            <p className="font-mono text-muted" style={{ fontSize: 12, letterSpacing: "0.1em" }}>NO TIER LISTS YET</p>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>
              Create a tier list from a collection or start fresh.
            </p>
            <button className="btn btn--primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>
              CREATE YOUR FIRST TIER LIST
            </button>
          </div>
        ) : (
          <div className="tl-card-grid">
            {tierLists.map(tl => (
              <TierListCard key={tl.id} tl={tl} onClick={() => navigate(`/tierlist/${tl.id}`)} onDelete={handleDelete} onTogglePublic={handleTogglePublic} />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="coll-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="coll-modal glass" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            <h3 className="font-display" style={{ fontSize: 22, marginBottom: 20 }}>NEW TIER LIST</h3>

            <label className="coll-label font-mono">TITLE *</label>
            <input
              className="coll-input"
              type="text"
              placeholder="e.g. All-Time Favourites"
              value={createTitle}
              onChange={e => setCreateTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              autoFocus
            />

            <label className="coll-label font-mono" style={{ marginTop: 14 }}>DESCRIPTION</label>
            <input
              className="coll-input"
              type="text"
              placeholder="Optional description..."
              value={createDesc}
              onChange={e => setCreateDesc(e.target.value)}
            />

            <label className="coll-label font-mono" style={{ marginTop: 14 }}>SEED FROM COLLECTION (optional)</label>
            <select
              className="coll-input"
              value={createCollId}
              onChange={e => setCreateCollId(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="">— Start Empty —</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.items?.length || 0} items)</option>
              ))}
            </select>

            {createError && (
              <div className="font-mono" style={{ color: "#ff4d6d", fontSize: 11, marginTop: 8 }}>{createError}</div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleCreate} disabled={creating}>
                {creating ? "CREATING..." : "CREATE & OPEN"}
              </button>
              <button className="btn btn--ghost" onClick={() => setShowCreate(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tier List Card ──────────────────────────────────────────────
function TierListCard({ tl, onClick, onDelete, onTogglePublic }) {
  const cardRef = useRef(null);
  const preview = tl.items?.slice(0, 8) || [];
  const ranked  = tl.items?.filter(i => i.tier && i.tier !== "unranked") || [];

  // Get a mini-preview of the tier distribution
  const tierCounts = TIERS.reduce((acc, t) => {
    acc[t] = tl.items?.filter(i => i.tier === t).length || 0;
    return acc;
  }, {});

  const handleMouse = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    anime({ targets: cardRef.current, rotateY: x * 6, rotateX: -y * 6, duration: 200, easing: "easeOutQuad" });
  };
  const handleMouseLeave = () => {
    anime({ targets: cardRef.current, rotateY: 0, rotateX: 0, duration: 400, easing: "easeOutElastic(1, 0.6)" });
  };

  return (
    <div
      ref={cardRef}
      className="tl-card glass"
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d", perspective: "800px", cursor: "pointer" }}
    >
      {/* Poster strip preview */}
      <div className="tl-card-preview">
        {preview.length > 0 ? (
          <div className="tl-card-posters">
            {preview.map((item, i) => (
              <div key={item.id} className="tl-card-poster-wrap" style={{ zIndex: preview.length - i }}>
                <img
                  src={item.media?.posterUrl || "https://via.placeholder.com/80x120/0a0a0f/00e5ff?text=?"}
                  alt={item.media?.title}
                  className="tl-card-poster"
                  onError={e => { e.target.src = "https://via.placeholder.com/80x120/0a0a0f/00e5ff?text=?"; }}
                />
                {item.tier && item.tier !== "unranked" && (
                  <div className="tl-card-tier-badge" style={{ background: TIER_COLORS[item.tier]?.bg, color: TIER_COLORS[item.tier]?.label }}>
                    {item.tier}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="tl-card-empty-preview font-mono text-muted">EMPTY</div>
        )}

        {/* Mini tier bar */}
        {ranked.length > 0 && (
          <div className="tl-card-tier-bar">
            {TIERS.map(t => tierCounts[t] > 0 && (
              <div key={t} className="tl-card-tier-seg" style={{ background: TIER_COLORS[t].bg, flex: tierCounts[t] }} title={`${t}: ${tierCounts[t]}`} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="tl-card-info">
        <div className="tl-card-title">{tl.title}</div>
        {tl.description && <div className="tl-card-desc text-muted">{tl.description}</div>}
        <div className="tl-card-meta font-mono">
          <span>{tl.items?.length || 0} ITEMS</span>
          {tl.collection && <span className="tl-card-coll-tag">📁 {tl.collection.name}</span>}
          <span style={{ color: "var(--text-muted)" }}>{new Date(tl.createdAt).toLocaleDateString()}</span>
        </div>
        <button
          className={`coll-public-toggle ${tl.isPublic ? "coll-public-toggle--on" : ""}`}
          onClick={(e) => onTogglePublic(e, tl.id, tl.isPublic)}
          title={tl.isPublic ? "Public — click to make private" : "Private — click to make public"}
        >
          {tl.isPublic ? "🌐 PUBLIC" : "🔒 PRIVATE"}
        </button>
      </div>

      <button className="tl-card-delete" onClick={e => onDelete(e, tl.id)} title="Delete">🗑</button>
    </div>
  );
}
