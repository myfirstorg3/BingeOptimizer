import { useEffect, useRef, useState } from "react";
import "./MediaDetailPanel.css";

const API_BASE = "http://localhost:5000";
const FALLBACK = "https://via.placeholder.com/300x450/0a0a0f/00e5ff?text=NO+POSTER";

const SENTIMENT_COLOR = (score) => {
  if (!score) return "#9a9aaa";
  if (score >= 8) return "#00ff88";
  if (score >= 6) return "#f5c518";
  if (score >= 4) return "#ff9800";
  return "#ff4d6d";
};

export default function MediaDetailPanel({ item, onClose }) {
  const media = item?.media;
  const panelRef = useRef(null);
  const [aiSummary, setAiSummary] = useState(media?.reviewSummary || null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [rawOMDB, setRawOMDB] = useState(null);
  const pollRef = useRef(null);

  // Parse stored description JSON
  useEffect(() => {
    if (media?.description) {
      try { setRawOMDB(JSON.parse(media.description)); } catch {}
    }
  }, [media]);

  // Fetch full details from DB (no external API)
  useEffect(() => {
    if (!media?.id) return;
    setLoadingDetails(true);
    fetch(`${API_BASE}/api/media/internal/${media.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.rawOMDB) setRawOMDB(data.rawOMDB);
        if (data.aiSummary) {
          setAiSummary(data.aiSummary);
          setGeneratingAI(false);
        } else if (data.generatingAI) {
          setGeneratingAI(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
  }, [media?.id]);

  // Poll for AI summary if generating
  useEffect(() => {
    if (!generatingAI || !media?.id) return;
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/media/internal/${media.id}/ai-summary`);
        const data = await r.json();
        if (data.ready && data.aiSummary) {
          setAiSummary(data.aiSummary);
          setGeneratingAI(false);
          clearInterval(pollRef.current);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [generatingAI, media?.id]);

  // Animate in
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.transform = "translateX(100%)";
      panelRef.current.style.opacity = "0";
      requestAnimationFrame(() => {
        panelRef.current.style.transition = "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease";
        panelRef.current.style.transform = "translateX(0)";
        panelRef.current.style.opacity = "1";
      });
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!media) return null;

  const year = media.releaseDate ? new Date(media.releaseDate).getFullYear() : null;
  const rating = media.avgRating;
  const poster = media.posterUrl || FALLBACK;
  const backdrop = media.backdropUrl || null;
  const genres = rawOMDB?.genre ? rawOMDB.genre.split(", ") : [];
  const sentimentColor = SENTIMENT_COLOR(aiSummary?.sentimentScore);

  return (
    <>
      <div className="mdp-overlay" onClick={onClose} />
      <div ref={panelRef} className="mdp-panel glass">
        {/* Backdrop */}
        <div className="mdp-backdrop" style={{ backgroundImage: backdrop ? `url(${backdrop})` : `url(${poster})` }} />
        <div className="mdp-backdrop-fade" />

        {/* Close */}
        <button className="mdp-close" onClick={onClose}>✕</button>

        <div className="mdp-scroll">
          {/* Header */}
          <div className="mdp-header">
            <img src={poster} alt={media.title} className="mdp-poster" onError={e => { e.target.src = FALLBACK; }} />
            <div className="mdp-header-info">
              <div className="mdp-tags">
                {media.type && <span className="tag tag--cyan">{media.type.toUpperCase()}</span>}
                {rawOMDB?.rated && <span className="tag tag--gold">{rawOMDB.rated}</span>}
                {genres.slice(0, 3).map(g => <span key={g} className="tag tag--pink">{g}</span>)}
              </div>
              <h2 className="mdp-title font-display">{media.title}</h2>
              <div className="mdp-meta font-mono">
                {year && <span>{year}</span>}
                {media.durationMinutes && <span>{media.durationMinutes} min</span>}
                {media.language && <span>{media.language}</span>}
                {media.country && <span>{media.country}</span>}
              </div>

              {/* Ratings row */}
              <div className="mdp-ratings">
                {rating && (
                  <div className="mdp-rating-block">
                    <div className="mdp-rating-val" style={{ color: "#f5c518" }}>★ {rating}</div>
                    <div className="mdp-rating-src font-mono">IMDb</div>
                  </div>
                )}
                {rawOMDB?.rottenTomatoes && (
                  <div className="mdp-rating-block">
                    <div className="mdp-rating-val" style={{ color: "#fa320a" }}>🍅 {rawOMDB.rottenTomatoes}</div>
                    <div className="mdp-rating-src font-mono">Tomatometer</div>
                  </div>
                )}
                {rawOMDB?.metacritic && (
                  <div className="mdp-rating-block">
                    <div className="mdp-rating-val" style={{ color: "#00ce7a" }}>Ⓜ {rawOMDB.metacritic}</div>
                    <div className="mdp-rating-src font-mono">Metacritic</div>
                  </div>
                )}
                {aiSummary?.sentimentScore && (
                  <div className="mdp-rating-block">
                    <div className="mdp-rating-val" style={{ color: sentimentColor }}>✦ {aiSummary.sentimentScore.toFixed(1)}</div>
                    <div className="mdp-rating-src font-mono">AI Score</div>
                  </div>
                )}
              </div>

              {/* Crew */}
              {rawOMDB?.director && (
                <div className="mdp-crew">
                  <span className="mdp-crew-label font-mono">DIR</span>
                  <span className="mdp-crew-val">{rawOMDB.director}</span>
                </div>
              )}
              {rawOMDB?.actors && (
                <div className="mdp-crew">
                  <span className="mdp-crew-label font-mono">CAST</span>
                  <span className="mdp-crew-val">{rawOMDB.actors}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mdp-divider" />

          {/* Synopsis */}
          {media.synopsis && (
            <div className="mdp-section">
              <div className="mdp-section-label font-mono">SYNOPSIS</div>
              <p className="mdp-synopsis">{media.synopsis}</p>
            </div>
          )}

          {/* Gemini AI Review */}
          <div className="mdp-section">
            <div className="mdp-section-label font-mono">
              <span style={{ color: "var(--cyan)" }}>✦</span> GEMINI REVIEW
            </div>
            {generatingAI && !aiSummary && (
              <div className="mdp-ai-generating">
                <div className="mdp-ai-dot" />
                <span className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                  GENERATING AI REVIEW...
                </span>
              </div>
            )}
            {aiSummary ? (
              <div className="mdp-ai-review">
                {aiSummary.sentimentScore && (
                  <div className="mdp-sentiment-bar">
                    <div className="mdp-sentiment-fill" style={{
                      width: `${(aiSummary.sentimentScore / 10) * 100}%`,
                      background: `linear-gradient(90deg, ${sentimentColor}88, ${sentimentColor})`
                    }} />
                    <span className="mdp-sentiment-label font-mono" style={{ color: sentimentColor }}>
                      {aiSummary.sentimentScore >= 8 ? "ACCLAIMED" :
                       aiSummary.sentimentScore >= 6 ? "POSITIVE" :
                       aiSummary.sentimentScore >= 4 ? "MIXED" : "NEGATIVE"}
                    </span>
                  </div>
                )}
                <blockquote className="mdp-ai-text">
                  "{aiSummary.summaryText}"
                </blockquote>
                <div className="mdp-ai-footer font-mono">
                  <span style={{ color: "var(--cyan)", fontSize: 9 }}>✦ {aiSummary.llmModelUsed || "gemini"}</span>
                  {aiSummary.generatedAt && (
                    <span style={{ color: "var(--text-muted)", fontSize: 9 }}>
                      {new Date(aiSummary.generatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ) : !generatingAI && (
              <p className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>No AI review available yet.</p>
            )}
          </div>

          {/* Extra info */}
          {(rawOMDB?.boxOffice || rawOMDB?.awards || rawOMDB?.imdbVotes) && (
            <div className="mdp-section">
              <div className="mdp-section-label font-mono">DETAILS</div>
              <div className="mdp-details-grid">
                {rawOMDB?.boxOffice && (
                  <div className="mdp-detail-item">
                    <div className="mdp-detail-label font-mono">BOX OFFICE</div>
                    <div className="mdp-detail-val">{rawOMDB.boxOffice}</div>
                  </div>
                )}
                {rawOMDB?.imdbVotes && (
                  <div className="mdp-detail-item">
                    <div className="mdp-detail-label font-mono">IMDB VOTES</div>
                    <div className="mdp-detail-val">{rawOMDB.imdbVotes}</div>
                  </div>
                )}
                {rawOMDB?.awards && (
                  <div className="mdp-detail-item mdp-detail-item--wide">
                    <div className="mdp-detail-label font-mono">AWARDS</div>
                    <div className="mdp-detail-val">{rawOMDB.awards}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
