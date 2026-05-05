import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import anime from "animejs";
import { MOODS } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import MediaDetailPanel from "./MediaDetailPanel";
import "./Dashboard.css";

gsap.registerPlugin(ScrollTrigger);

const API_BASE = "http://localhost:5000";
const FALLBACK_POSTER = "https://placehold.co/300x450/0a0a0f/00e5ff?text=NO+POSTER";

const TIME_OPTIONS = [
  { label: "30m", mins: 30 },
  { label: "1h",  mins: 60 },
  { label: "1.5h", mins: 90 },
  { label: "2h",  mins: 120 },
  { label: "3h",  mins: 180 },
  { label: "4h+", mins: 240 },
];

// Curated all-time favorite picks (for guest landing)
const ALL_TIME_PICKS = [
  { title: "The Dark Knight",      year: 2008, imdb: "tt0468569", rating: 9.0, genre: "Action", poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { title: "Inception",            year: 2010, imdb: "tt1375666", rating: 8.8, genre: "Sci-Fi",  poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg" },
  { title: "Interstellar",         year: 2014, imdb: "tt0816692", rating: 8.7, genre: "Sci-Fi",  poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { title: "Breaking Bad",         year: 2008, imdb: "tt0903747", rating: 9.5, genre: "Drama",   poster: "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg" },
  { title: "Parasite",             year: 2019, imdb: "tt6751668", rating: 8.5, genre: "Thriller", poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
  { title: "Attack on Titan",      year: 2013, imdb: "tt2560140", rating: 9.0, genre: "Anime",   poster: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg" },
];

const TRENDING_NOW = [
  { title: "Dune: Part Two",   year: 2024, genre: "Sci-Fi",  rating: 8.5, poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc91p.jpg" },
  { title: "Poor Things",       year: 2023, genre: "Drama",   rating: 8.0, poster: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8Ph1ih2qA82t4D1R7.jpg" },
  { title: "Oppenheimer",       year: 2023, genre: "History", rating: 8.9, poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { title: "The Bear",          year: 2022, genre: "Drama",   rating: 8.6, poster: "https://image.tmdb.org/t/p/w500/rZ6X1vQz7Z0c5SXYb8RzJk3jF3K.jpg" },
  { title: "Shogun",            year: 2024, genre: "History", rating: 9.0, poster: "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1SyWA.jpg" },
  { title: "Fallout",           year: 2024, genre: "Sci-Fi",  rating: 8.5, poster: "https://image.tmdb.org/t/p/w500/AnsSK2kSRxc09RkL5HUXF3A1R6G.jpg" },
];

export default function Dashboard() {
  const heroRef  = useRef(null);
  const recsRef  = useRef(null);
  const canvasRef = useRef(null);
  const pollRef  = useRef(null);

  const { user, token } = useAuth();

  const [timeMins,      setTimeMins]      = useState(120);
  const [selectedMoods, setSelectedMoods] = useState(["intense"]);
  const [genre,         setGenre]         = useState("all");
  const [optimizing,    setOptimizing]    = useState(false);
  const [optimized,     setOptimized]     = useState(false);
  const [recs,          setRecs]          = useState([]);
  const [aiBlurbs,      setAiBlurbs]      = useState(null);
  const [sessionNote,   setSessionNote]   = useState(null);
  const [aiLatency,     setAiLatency]     = useState(null);
  const [noResults,     setNoResults]     = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState(null);

  // Canvas particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, particles, raf;
    const init = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        a: Math.random() * 0.5 + 0.1,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.a})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.strokeStyle = `rgba(0,229,255,${0.06*(1-dist/100)})`;
            ctx.lineWidth = 0.5; ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);

  // Entrance animations
  useEffect(() => {
    const letters = heroRef.current?.querySelectorAll(".hero-letter");
    if (letters) anime({ targets: letters, translateY: [60,0], opacity: [0,1], delay: anime.stagger(60), duration: 800, easing: "easeOutExpo" });
    gsap.fromTo(".hero-sub", { opacity:0, y:20 }, { opacity:1, y:0, delay:0.5, duration:0.7, ease:"power3.out" });
    if (user) {
      gsap.fromTo(".optimizer-card", { opacity:0, y:40, scale:0.97 }, { opacity:1, y:0, scale:1, delay:0.7, duration:0.8, ease:"power3.out" });
    } else {
      gsap.fromTo(".dash-guest-section", { opacity:0, y:30 }, { opacity:1, y:0, delay:0.6, duration:0.7, ease:"power3.out" });
    }
  }, [user]);

  useEffect(() => {
    if (recs.length === 0) return;
    gsap.fromTo(".rec-card", { opacity:0, scale:0.95, y:20 }, {
      opacity:1, scale:1, y:0, stagger:0.07, duration:0.5, ease:"power2.out",
      scrollTrigger: { trigger: recsRef.current, start:"top 80%" }
    });
  }, [recs]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const toggleMood = id => setSelectedMoods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleOptimize = async () => {
    if (!user || !token) { window.location.href = "/login"; return; }
    anime({ targets: ".optimize-btn", scale:[1,0.94,1], duration:300, easing:"easeInOutQuad" });
    anime({ targets: ".optimizer-title", translateX:[0,-3,3,-2,0], duration:300, easing:"linear" });
    setOptimizing(true); setOptimized(false); setRecs([]); setAiBlurbs(null);
    setSessionNote(null); setAiLatency(null); setNoResults(false);
    try {
      const res = await fetch(`${API_BASE}/api/binge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timeMins, moods: selectedMoods, genre })
      });
      const data = await res.json();
      setRecs(data.results || []);
      setAiBlurbs(data.aiBlurbs || null);
      setSessionNote(data.sessionNote || null);
      setAiLatency(data.llmLatencyMs || null);
      setOptimized(true);
      setNoResults(!data.results?.length);
      requestAnimationFrame(() => {
        anime({ targets:".rec-card", opacity:[0,1], translateY:[16,0], delay:anime.stagger(50), duration:400, easing:"easeOutQuad" });
      });
      setTimeout(() => recsRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 200);
    } catch (err) {
      console.error(err); setNoResults(true); setOptimized(true);
    } finally {
      setOptimizing(false);
    }
  };

  const TITLE = user ? "BINGE OPTIMIZER" : "BLASTOISE";

  return (
    <div className="page dashboard">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="noise-overlay" />

      {/* HERO */}
      <section ref={heroRef} className="hero container">
        <div className="hero-eyebrow">
          <span className="tag tag--cyan">v2.4.1</span>
          <span className="hero-eyebrow-text font-mono">
            {user ? "ALGORITHMIC CURATION ENGINE" : "YOUR CINEMATIC UNIVERSE"}
          </span>
        </div>
        <h1 className="hero-title" aria-label={TITLE}>
          {TITLE.split("").map((ch, i) => (
            <span key={i} className={`hero-letter ${ch === " " ? "hero-letter--space" : ""}`}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </h1>
        <p className="hero-sub">
          {user
            ? <>Select your available time and current mood —<br />the algorithm scores your entire collection and picks the perfect session.</>
            : <>Track, curate, and discover your next obsession.<br />Log in to unlock personalized recommendations from your collection.</>
          }
        </p>
        {!user && (
          <div style={{ display:"flex", gap:12, marginTop:32 }}>
            <a href="/login" className="btn btn--primary">GET STARTED</a>
            <a href="/search" className="btn btn--ghost">BROWSE MEDIA</a>
          </div>
        )}
      </section>

      {/* ── LOGGED-IN: BINGE OPTIMIZER ── */}
      {user && (
        <section className="container optimizer-section">
          <div className="optimizer-card glass">
            <div className="optimizer-header">
              <h2 className="optimizer-title font-mono">CONFIGURE_SESSION</h2>
              <div className="optimizer-header-line" />
            </div>
            <div className="optimizer-body">
              {/* Time */}
              <div className="opt-group">
                <label className="opt-label">TIME AVAILABLE</label>
                <div className="time-pills">
                  {TIME_OPTIONS.map(t => (
                    <button key={t.label}
                      className={`time-pill ${timeMins === t.mins ? "active" : ""}`}
                      onClick={() => setTimeMins(t.mins)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Mood */}
              <div className="opt-group">
                <label className="opt-label">CURRENT MOOD <span className="text-muted" style={{fontSize:9}}>(select multiple)</span></label>
                <div className="mood-grid">
                  {MOODS.map(mood => (
                    <button key={mood.id}
                      className={`mood-chip ${selectedMoods.includes(mood.id) ? "active" : ""}`}
                      onClick={() => toggleMood(mood.id)}>
                      <span>{mood.icon}</span><span>{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Genre */}
              <div className="opt-group">
                <label className="opt-label">GENRE FILTER</label>
                <div className="genre-row">
                  {["all", "Sci-Fi", "Action", "Drama", "Anime", "Horror", "Thriller", "Comedy"].map(g => (
                    <button key={g} className={`genre-btn ${genre === g ? "active" : ""}`} onClick={() => setGenre(g)}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="optimizer-footer">
              <button className="optimize-btn btn btn--primary" onClick={handleOptimize} disabled={optimizing}>
                <span>▶</span>
                <span>{optimizing ? "GEMINI + ALGO SCORING..." : "OPTIMIZE SESSION"}</span>
              </button>
              {optimized && !optimizing && (
                <span className="opt-result-text font-mono">
                  {noResults ? "NO MATCHES — ADD MEDIA TO YOUR COLLECTION" : `${recs.length} TITLES MATCHED${aiLatency ? ` · AI in ${(aiLatency/1000).toFixed(1)}s` : ""}`}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── GUEST: TRENDING NOW ── */}
      {!user && (
        <section className="container section dash-guest-section">
          <div className="section-header">
            <span className="font-mono text-muted" style={{ fontSize:11, letterSpacing:"0.12em" }}>01 // TRENDING NOW</span>
            <div className="section-line" />
            <span className="tag tag--pink">2024</span>
          </div>
          <div className="recs-grid">
            {TRENDING_NOW.map((item, i) => (
              <GuestMediaCard key={i} item={item} onClick={() => setSelectedMediaItem({ 
                media: { 
                  id: null, 
                  title: item.title, 
                  posterUrl: item.poster, 
                  releaseDate: item.year ? `${item.year}-01-01` : null, 
                  avgRating: item.rating, 
                  type: item.genre, 
                  synopsis: "Log in or sign up to fetch full details, AI reviews, and add this to your personal collection!" 
                } 
              })} />
            ))}
          </div>
        </section>
      )}

      {/* ── GUEST: ALL-TIME FAVORITES ── */}
      {!user && (
        <section className="container section dash-guest-section">
          <div className="section-header">
            <span className="font-mono text-muted" style={{ fontSize:11, letterSpacing:"0.12em" }}>02 // ALL-TIME FAVORITES</span>
            <div className="section-line" />
            <span className="tag tag--gold">COMMUNITY PICKS</span>
          </div>
          <div className="recs-grid">
            {ALL_TIME_PICKS.map((item, i) => (
              <GuestMediaCard key={i} item={item} gold onClick={() => setSelectedMediaItem({ 
                media: { 
                  id: null, 
                  title: item.title, 
                  posterUrl: item.poster, 
                  releaseDate: item.year ? `${item.year}-01-01` : null, 
                  avgRating: item.rating, 
                  type: item.genre, 
                  synopsis: "Log in or sign up to fetch full details, AI reviews, and add this to your personal collection!" 
                } 
              })} />
            ))}
          </div>

          {/* CTA */}
          <div className="dash-cta glass">
            <div className="dash-cta-icon">✦</div>
            <div>
              <div className="font-display" style={{ fontSize:28, letterSpacing:"0.04em" }}>BUILD YOUR COLLECTION</div>
              <p style={{ fontSize:13, color:"var(--text-secondary)", marginTop:6, maxWidth:480 }}>
                Sign up to track what you've watched, get AI-powered recommendations from your personal collection, and unlock the Binge Optimizer.
              </p>
            </div>
            <div style={{ display:"flex", gap:10, flexShrink:0 }}>
              <a href="/register" className="btn btn--primary">SIGN UP FREE</a>
              <a href="/login" className="btn btn--ghost">LOG IN</a>
            </div>
          </div>
        </section>
      )}

      {/* ── LOGGED-IN: BINGE RESULTS ── */}
      {user && (optimized || recs.length > 0) && (
        <section ref={recsRef} className="container section">
          <div className="section-header">
            <span className="font-mono text-muted" style={{ fontSize:11, letterSpacing:"0.12em" }}>
              02 // OPTIMIZED FOR YOU
            </span>
            <div className="section-line" />
            {aiLatency && (
              <span className="font-mono text-muted" style={{ fontSize:10, whiteSpace:"nowrap" }}>
                ✦ GEMINI IN {(aiLatency/1000).toFixed(1)}s
              </span>
            )}
          </div>

          {sessionNote && (
            <div className="binge-session-note glass">
              <span className="font-mono" style={{fontSize:10,color:"var(--cyan)",letterSpacing:"0.1em"}}>✦ GEMINI SESSION NOTE</span>
              <p style={{margin:"8px 0 0",fontSize:13,color:"var(--text-secondary)",lineHeight:1.5}}>{sessionNote}</p>
            </div>
          )}

          {noResults ? (
            <div className="no-results" style={{padding:"60px 0"}}>
              <div className="font-display" style={{fontSize:60,color:"var(--text-muted)"}}>∅</div>
              <p className="font-mono text-muted" style={{fontSize:12,letterSpacing:"0.1em",marginTop:12}}>
                NO MATCHES FOUND — ADD MORE MEDIA TO YOUR COLLECTION
              </p>
              <a href="/search" className="btn btn--primary" style={{marginTop:20}}>GO TO SEARCH</a>
            </div>
          ) : (
            <div className="recs-grid">
              {recs.slice(0, 6).map(item => (
                <BingeResultCard key={item.mediaId} item={item} blurb={aiBlurbs?.[item.title]} onClick={() => setSelectedMediaItem({
                  media: {
                    id: item.mediaId,
                    title: item.title,
                    posterUrl: item.posterUrl,
                    releaseDate: item.releaseDate,
                    avgRating: item.avgRating,
                    genre: item.genre
                  }
                })} />
              ))}
            </div>
          )}
        </section>
      )}

      {selectedMediaItem && (
        <MediaDetailPanel item={selectedMediaItem} onClose={() => setSelectedMediaItem(null)} />
      )}
    </div>
  );
}

function GuestMediaCard({ item, gold, onClick }) {
  return (
    <div className="rec-card media-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <img
        src={item.poster || FALLBACK_POSTER}
        alt={item.title}
        className="media-card__img"
        loading="lazy"
        onError={e => { e.target.src = FALLBACK_POSTER; }}
      />
      {item.rating && (
        <div className="coll-rating-badge font-mono" style={{ color: gold ? "var(--gold)" : "var(--cyan)" }}>
          ★ {item.rating}
        </div>
      )}
      <div className="media-card__overlay">
        <div className="media-card__title">{item.title}</div>
        <div className="media-card__meta">{item.year} · {item.genre}</div>
      </div>
    </div>
  );
}

const TIER_COLORS_MAP = { S:"#e94057", A:"#f5840c", B:"#f5c518", C:"#00c896", D:"#a78bfa" };

function BingeResultCard({ item, blurb, onClick }) {
  const tier = item.tierRank;
  const tierColor = TIER_COLORS_MAP[tier];
  const score = item.score;

  return (
    <div className="rec-card media-card" onClick={onClick} style={{ cursor: "pointer" }}>
      <img
        src={item.posterUrl || FALLBACK_POSTER}
        alt={item.title}
        className="media-card__img"
        loading="lazy"
        onError={e => { e.target.src = FALLBACK_POSTER; }}
      />
      {tier && tier !== "unranked" && (
        <div className="rec-badge font-display" style={{
          position:"absolute", top:8, right:8,
          background: tierColor, color: tier === "B" ? "#000" : "#fff",
          borderRadius:4, width:28, height:28, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:14, fontWeight:900, boxShadow:"0 2px 8px rgba(0,0,0,0.5)"
        }}>{tier}</div>
      )}
      <div className="binge-score-chip font-mono">{Math.round(score)}pts</div>
      <div className="media-card__overlay">
        <div className="media-card__title">{item.title}</div>
        <div className="media-card__meta">
          {item.releaseDate ? new Date(item.releaseDate).getFullYear() : "—"}
          {item.durationMinutes ? ` · ${item.durationMinutes}min` : ""}
          {item.avgRating ? ` · ★${item.avgRating}` : ""}
        </div>
        {item.genre && (
          <div style={{marginTop:4,fontSize:10,color:"var(--cyan)",opacity:0.8}}>{item.genre.split(",")[0].trim()}</div>
        )}
        {blurb && (
          <div className="binge-ai-blurb">
            <span style={{color:"var(--cyan)",fontSize:9}}>✦ </span>{blurb}
          </div>
        )}
      </div>
    </div>
  );
}
