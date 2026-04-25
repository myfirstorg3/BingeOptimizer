import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import anime from "animejs";
import { TIER_COLORS, TIER_ITEMS_DEFAULT_SEED } from "../data/mockData";
import { useFetchMedia } from "../hooks/useFetchMedia";
import "./TierList.css";

const TIERS = ["S", "A", "B", "C", "D"];

export default function TierList() {
  const headerRef = useRef(null);

  // ── OMDB: fetch media once ──
  const { media, loading } = useFetchMedia();

  // Build initial tiers from fetched media using seed indices
  const [tiers, setTiers]             = useState({ S: [], A: [], B: [], C: [], D: [], unranked: [] });
  const [dragging, setDragging]       = useState(null);
  const [hoveredTier, setHoveredTier] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (media.length === 0 || initialized) return;
    const built = {};
    for (const [tier, indices] of Object.entries(TIER_ITEMS_DEFAULT_SEED)) {
      built[tier] = indices.map((i) => media[i]).filter(Boolean);
    }
    setTiers(built);
    setInitialized(true);
  }, [media, initialized]);

  // Entrance animations — UNCHANGED
  useEffect(() => {
    anime({
      targets: headerRef.current?.querySelectorAll(".tl-letter"),
      translateY: [50, 0],
      opacity:    [0, 1],
      delay:      anime.stagger(40),
      duration:   700,
      easing:     "easeOutExpo",
    });
    gsap.fromTo(".tier-row",
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, stagger: 0.1, duration: 0.6, delay: 0.3, ease: "power3.out" }
    );
    gsap.fromTo(".unranked-pool",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, delay: 0.9, ease: "power3.out" }
    );
  }, []);

  // Drag handlers — UNCHANGED
  const onDragStart = (e, item, fromTier) => {
    setDragging({ item, fromTier });
    e.dataTransfer.effectAllowed = "move";
    anime({ targets: e.currentTarget, scale: 0.9, opacity: 0.5, duration: 150 });
  };

  const onDragEnd = (e) => {
    setDragging(null);
    setHoveredTier(null);
    anime({ targets: e.currentTarget, scale: 1, opacity: 1, duration: 200 });
  };

  const onDrop = (e, toTier) => {
    e.preventDefault();
    if (!dragging) return;
    const { item, fromTier } = dragging;
    if (fromTier === toTier) return;

    setTiers((prev) => {
      const next = { ...prev };
      next[fromTier] = next[fromTier].filter((x) => x.id !== item.id);
      next[toTier]   = [...next[toTier], item];
      return next;
    });
    setHoveredTier(null);

    setTimeout(() => {
      const row = document.querySelector(`[data-tier="${toTier}"]`);
      if (row) {
        anime({
          targets: row,
          backgroundColor: [`${TIER_COLORS[toTier]?.glow || "rgba(0,229,255,0.1)"}`, "rgba(0,0,0,0)"],
          duration: 600,
          easing: "easeOutQuad",
        });
      }
    }, 50);
  };

  const removeFromTier = (item, fromTier) => {
    setTiers((prev) => {
      const next = { ...prev };
      next[fromTier] = next[fromTier].filter((x) => x.id !== item.id);
      next.unranked  = [...next.unranked, item];
      return next;
    });
  };

  const TITLE = "TIER LIST";

  return (
    <div className="page tier-page">
      <div className="noise-overlay" />

      {/* Header — UNCHANGED */}
      <div ref={headerRef} className="container tl-header">
        <div className="tl-eyebrow">
          <span className="tag tag--pink">RANKING</span>
          <span className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.14em" }}>DRAG & DROP TO REORDER</span>
        </div>
        <h1 className="tl-title font-display" aria-label={TITLE}>
          {TITLE.split("").map((c, i) => (
            <span key={i} className={`tl-letter ${c === " " ? "tl-space" : ""}`}>
              {c === " " ? "\u00A0" : c}
            </span>
          ))}
        </h1>
      </div>

      {/* Tier rows */}
      <div className="container tl-body">
        {loading ? (
          <div className="font-mono text-muted" style={{ padding: "60px 0", letterSpacing: "0.12em" }}>
            LOADING TIER DATA...
          </div>
        ) : (
          <>
            <div className="tier-list-grid">
              {TIERS.map((tier) => {
                const color = TIER_COLORS[tier];
                return (
                  <div
                    key={tier}
                    data-tier={tier}
                    className={`tier-row ${hoveredTier === tier ? "tier-row--hovered" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setHoveredTier(tier); }}
                    onDragLeave={() => setHoveredTier(null)}
                    onDrop={(e) => onDrop(e, tier)}
                    style={{ "--tier-color": color.bg, "--tier-glow": color.glow }}
                  >
                    <div className="tier-label" style={{ background: color.bg }}>
                      <span className="font-display">{tier}</span>
                    </div>
                    <div className="tier-items">
                      {tiers[tier].map((item) => (
                        <TierItem
                          key={item.id}
                          item={item}
                          tier={tier}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                          onRemove={removeFromTier}
                        />
                      ))}
                      {tiers[tier].length === 0 && (
                        <div className="tier-empty font-mono">DROP HERE</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unranked pool — UNCHANGED */}
            <div
              className={`unranked-pool glass ${hoveredTier === "unranked" ? "unranked-pool--hovered" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setHoveredTier("unranked"); }}
              onDragLeave={() => setHoveredTier(null)}
              onDrop={(e) => onDrop(e, "unranked")}
            >
              <div className="unranked-header">
                <span className="font-mono text-muted" style={{ fontSize: 10, letterSpacing: "0.16em" }}>UNRANKED POOL</span>
                <span className="font-mono text-muted" style={{ fontSize: 10 }}>{tiers.unranked.length} ITEMS</span>
              </div>
              <div className="unranked-items">
                {tiers.unranked.map((item) => (
                  <TierItem
                    key={item.id}
                    item={item}
                    tier="unranked"
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onRemove={() => {}}
                    unranked
                  />
                ))}
                {tiers.unranked.length === 0 && (
                  <div className="tier-empty font-mono">ALL RANKED ✓</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// TierItem — UNCHANGED except poster fallback
function TierItem({ item, tier, onDragStart, onDragEnd, onRemove, unranked }) {
  const ref = useRef(null);
  const FALLBACK_POSTER = "https://via.placeholder.com/80x120/0a0a0f/00e5ff?text=?";

  const handleMouseEnter = () => anime({ targets: ref.current, scale: 1.05, duration: 200, easing: "easeOutQuad" });
  const handleMouseLeave = () => anime({ targets: ref.current, scale: 1,    duration: 200, easing: "easeOutQuad" });

  return (
    <div
      ref={ref}
      className="tier-item"
      draggable
      onDragStart={(e) => onDragStart(e, item, tier)}
      onDragEnd={onDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={item.title}
    >
      <img
        src={item.poster || FALLBACK_POSTER}
        alt={item.title}
        className="tier-item__img"
        onError={(e) => { e.target.src = FALLBACK_POSTER; }}
      />
      <div className="tier-item__tooltip">
        <div className="font-ui" style={{ fontWeight: 700, fontSize: 12 }}>{item.title}</div>
        <div className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{item.year} · ★ {item.rating}</div>
      </div>
      {!unranked && (
        <button className="tier-item__remove" onClick={() => onRemove(item, tier)} title="Remove">×</button>
      )}
    </div>
  );
}
