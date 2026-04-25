import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import anime from "animejs";
import { GENRES } from "../data/mockData";
import { useFetchMedia } from "../hooks/useFetchMedia";
import "./Collection.css";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_POSTER = "https://via.placeholder.com/300x450/0a0a0f/00e5ff?text=NO+POSTER";

export default function Collection() {
  const headerRef = useRef(null);
  const gridRef   = useRef(null);

  const [activeGenre, setActiveGenre] = useState("All");
  const [activeType,  setActiveType]  = useState("all");
  const [layout,      setLayout]      = useState("grid");
  const [hoveredCard, setHoveredCard] = useState(null);

  // ── OMDB: fetch media once ──
  const { media, loading } = useFetchMedia();

  const filtered = media.filter((m) => {
    const genreOk = activeGenre === "All" || m.genre.includes(activeGenre);
    const typeOk  = activeType  === "all" || m.type === activeType;
    return genreOk && typeOk;
  });

  // Title entrance — UNCHANGED
  useEffect(() => {
    anime({
      targets: ".coll-title-char",
      translateY: [40, 0],
      opacity:    [0, 1],
      delay:      anime.stagger(30),
      duration:   600,
      easing:     "easeOutExpo",
    });
  }, []);

  // Card stagger on filter change — UNCHANGED
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".coll-card");
    if (!cards) return;
    anime({
      targets: cards,
      opacity:    [0, 1],
      translateY: [20, 0],
      scale:      [0.96, 1],
      delay:      anime.stagger(40, { start: 100 }),
      duration:   400,
      easing:     "easeOutQuad",
    });
  }, [filtered.length, activeGenre, activeType, loading]);

  const TITLE = "COLLECTION";

  return (
    <div className="page coll-page">
      <div className="noise-overlay" />

      {/* Header — UNCHANGED */}
      <div ref={headerRef} className="container coll-header">
        <div className="coll-header-top">
          <div>
            <div className="coll-eyebrow">
              <span className="tag tag--gold">MY ARCHIVE</span>
              <span className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.14em" }}>
                {media.length} ENTRIES
              </span>
            </div>
            <h1 className="coll-title font-display" aria-label={TITLE}>
              {TITLE.split("").map((c, i) => (
                <span key={i} className="coll-title-char">{c}</span>
              ))}
            </h1>
            <p className="coll-sub">Curated cinematic archives. High-fidelity filtering enabled.</p>
          </div>
          <div className="layout-toggle">
            <button className={`layout-btn ${layout === "grid" ? "active" : ""}`} onClick={() => setLayout("grid")} title="Grid view"><GridIcon /></button>
            <button className={`layout-btn ${layout === "list" ? "active" : ""}`} onClick={() => setLayout("list")} title="List view"><ListIcon /></button>
          </div>
        </div>

        {/* Filters — UNCHANGED */}
        <div className="coll-filters">
          <div className="filter-section">
            <span className="filter-label font-mono">TYPE</span>
            <div className="filter-pills">
              {["all", "movie", "series", "anime"].map((t) => (
                <button key={t} className={`filter-pill ${activeType === t ? "active" : ""}`} onClick={() => setActiveType(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="filter-divider" />
          <div className="filter-section" style={{ flex: 1 }}>
            <span className="filter-label font-mono">GENRE</span>
            <div className="genre-filter-scroll">
              {GENRES.map((g) => (
                <button key={g} className={`genre-filter-chip ${activeGenre === g ? "active" : ""}`} onClick={() => setActiveGenre(g)}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* Grid */}
      <div ref={gridRef} className="container coll-grid-wrap">
        {loading ? (
          <div className="font-mono text-muted" style={{ padding: "80px 0", textAlign: "center", letterSpacing: "0.12em" }}>
            LOADING COLLECTION...
          </div>
        ) : (
          <div className={`coll-grid ${layout === "list" ? "coll-grid--list" : ""}`}>
            {filtered.map((item) => (
              <CollectionCard
                key={item.id}
                item={item}
                layout={layout}
                hovered={hoveredCard === item.id}
                onHover={setHoveredCard}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="no-results">
            <div className="font-display" style={{ fontSize: 60, color: "var(--text-muted)" }}>∅</div>
            <p className="font-mono text-muted" style={{ fontSize: 12, letterSpacing: "0.1em" }}>NO ENTRIES MATCH FILTER</p>
          </div>
        )}
      </div>
    </div>
  );
}

// CollectionCard — UNCHANGED except poster fallback
function CollectionCard({ item, layout, hovered, onHover }) {
  const cardRef = useRef(null);

  const handleMouse = (e) => {
    if (layout === "list") return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    anime({ targets: cardRef.current, rotateY: x * 8, rotateX: -y * 8, duration: 200, easing: "easeOutQuad" });
  };

  const handleMouseLeave = () => {
    anime({ targets: cardRef.current, rotateY: 0, rotateX: 0, duration: 400, easing: "easeOutElastic(1, 0.6)" });
    onHover(null);
  };

  const poster = item.poster || FALLBACK_POSTER;

  if (layout === "list") {
    return (
      <div className="coll-card coll-card--list glass" ref={cardRef}>
        <img src={poster} alt={item.title} className="coll-list-img" onError={(e) => { e.target.src = FALLBACK_POSTER; }} />
        <div className="coll-list-info">
          <div className="coll-list-title">{item.title}</div>
          <div className="coll-list-meta font-mono">
            {item.year} · {item.type} · {item.duration}{item.type === "movie" ? "min" : "m/ep"}
          </div>
          <div className="coll-list-genres">
            {item.genre.map((g) => (
              <span key={g} className="tag tag--cyan" style={{ fontSize: 9, padding: "2px 6px" }}>{g}</span>
            ))}
          </div>
          <p className="coll-list-synopsis">{item.synopsis}</p>
        </div>
        <div className="coll-list-right">
          <div className={`score-badge-lg font-display score-badge--${item.score.toLowerCase()}`}>{item.score}</div>
          <div className="font-mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>★ {item.rating}</div>
          {item.price && (
            <div className="font-mono" style={{ fontSize: 11, color: "var(--gold)" }}>${item.price}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="coll-card media-card"
      style={{ transformStyle: "preserve-3d", perspective: "600px" }}
      onMouseMove={handleMouse}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={handleMouseLeave}
    >
      <img src={poster} alt={item.title} className="media-card__img" loading="lazy" onError={(e) => { e.target.src = FALLBACK_POSTER; }} />
      <div className={`rec-badge font-display score-badge score-badge--${item.score.toLowerCase()}`}>{item.score}</div>
      {item.featured && (
        <div className="featured-badge tag tag--pink" style={{ position: "absolute", top: 10, left: 10, fontSize: 8 }}>★ FEATURED</div>
      )}
      <div className="media-card__overlay">
        <div className="media-card__title">{item.title}</div>
        <div className="media-card__meta">{item.year} · ★ {item.rating}</div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {item.synopsis.slice(0, 70)}...
        </div>
        {item.price ? (
          <div className="font-mono text-gold" style={{ fontSize: 11, marginTop: 6 }}>${item.price}</div>
        ) : (
          <div className="font-mono text-green" style={{ fontSize: 11, marginTop: 6 }}>FREE</div>
        )}
      </div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="0" y="0" width="6" height="6" rx="1" fill="currentColor"/>
      <rect x="8" y="0" width="6" height="6" rx="1" fill="currentColor"/>
      <rect x="0" y="8" width="6" height="6" rx="1" fill="currentColor"/>
      <rect x="8" y="8" width="6" height="6" rx="1" fill="currentColor"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="0" y="1" width="14" height="2" rx="1" fill="currentColor"/>
      <rect x="0" y="6" width="14" height="2" rx="1" fill="currentColor"/>
      <rect x="0" y="11" width="14" height="2" rx="1" fill="currentColor"/>
    </svg>
  );
}
