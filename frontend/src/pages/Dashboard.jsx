import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import anime from "animejs";
import { MOODS, STATS } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

gsap.registerPlugin(ScrollTrigger);

const API_BASE = "http://localhost:5000";
const FALLBACK_POSTER = "https://via.placeholder.com/300x450/0a0a0f/00e5ff?text=NO+POSTER";

const TIME_OPTIONS = [
  { label: "30m", mins: 30 },
  { label: "1h",  mins: 60 },
  { label: "1.5h", mins: 90 },
  { label: "2h",  mins: 120 },
  { label: "3h",  mins: 180 },
  { label: "4h+", mins: 240 },
];

// Animated counter
function Counter({ target, suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const obj = { val: 0 };
    anime({
      targets: obj, val: target, duration: 1800, delay: 300, easing: "easeOutExpo",
      update: () => { if (ref.current) ref.current.textContent = Number(obj.val.toFixed(0)).toLocaleString() + suffix; },
    });
  }, [target]);
  return <span ref={ref}>0{suffix}</span>;
}

export default function Dashboard() {
  const heroRef   = useRef(null);
  const statsRef  = useRef(null);
  const recsRef   = useRef(null);
  const canvasRef = useRef(null);


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
    gsap.fromTo(".optimizer-card", { opacity:0, y:40, scale:0.97 }, { opacity:1, y:0, scale:1, delay:0.7, duration:0.8, ease:"power3.out" });
  }, []);

  useEffect(() => {
    gsap.fromTo(".stat-card", { opacity:0, y:30 }, {
      opacity:1, y:0, stagger:0.1, duration:0.6, ease:"power3.out",
      scrollTrigger: { trigger: statsRef.current, start:"top 80%" }
    });
  }, []);

  useEffect(() => {
    if (recs.length === 0) return;
    gsap.fromTo(".rec-card", { opacity:0, scale:0.95, y:20 }, {
      opacity:1, scale:1, y:0, stagger:0.07, duration:0.5, ease:"power2.out",
      scrollTrigger: { trigger: recsRef.current, start:"top 80%" }
    });
  }, [recs]);

  // Cleanup on unmount
  useEffect(() => () => {}, []);

  const toggleMood = id => setSelectedMoods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  // Poll for AI enrichment
  const startPolling = useCallback((sid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/binge/${sid}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.aiReady) {
          setRecs(data.results || []);
          setAiBlurbs(data.aiBlurbs);
          setSessionNote(data.sessionNote);
          setAiLatency(data.llmLatencyMs);
          setAiEnriching(false);
          clearInterval(pollRef.current);
          pollRef.current = null;
          // Animate re-render
          requestAnimationFrame(() => {
            anime({ targets: ".rec-card", opacity:[0,1], translateY:[8,0], delay: anime.stagger(40), duration:300, easing:"easeOutQuad" });
          });
        }
      } catch {}
    }, 3000);
  }, [token]);

  const handleOptimize = async () => {
    if (!user || !token) { window.location.href = "/login"; return; }

    anime({ targets: ".optimize-btn", scale:[1,0.94,1], duration:300, easing:"easeInOutQuad" });
    anime({ targets: ".optimizer-title", translateX:[0,-3,3,-2,0], duration:300, easing:"linear" });

    setOptimizing(true);
    setOptimized(false);
    setRecs([]);
    setAiBlurbs(null);
    setSessionNote(null);
    setAiLatency(null);
    setNoResults(false);

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
      console.error(err);
      setNoResults(true);
      setOptimized(true);
    } finally {
      setOptimizing(false);
    }
  };

  const TITLE = "BINGE OPTIMIZER";

  return (
    <div className="page dashboard">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="noise-overlay" />

      {/* HERO */}
      <section ref={heroRef} className="hero container">
        <div className="hero-eyebrow">
          <span className="tag tag--cyan">v2.4.1</span>
          <span className="hero-eyebrow-text font-mono">ALGORITHMIC CURATION ENGINE</span>
        </div>
        <h1 className="hero-title" aria-label={TITLE}>
          {TITLE.split("").map((ch, i) => (
            <span key={i} className={`hero-letter ${ch === " " ? "hero-letter--space" : ""}`}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </h1>
        <p className="hero-sub">
          Select your available time and current mood —<br />
          the algorithm scores your entire collection and picks the perfect session.
        </p>
      </section>

      {/* OPTIMIZER CARD */}
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
            {!user && (
              <span className="font-mono text-muted" style={{fontSize:11}}>
                <a href="/login" style={{color:"var(--cyan)"}}>LOG IN</a> to use your collection
              </span>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} className="container section stats-section">
        <div className="section-header">
          <span className="font-mono text-muted" style={{ fontSize:11, letterSpacing:"0.12em" }}>01 // YOUR STATS</span>
          <div className="section-line" />
        </div>
        <div className="stats-grid">
          {[
            { label:"Titles Watched", value:STATS.totalWatched, suffix:"" },
            { label:"Hours Logged",   value:STATS.hoursLogged,  suffix:"h" },
            { label:"Avg Rating",     value:STATS.avgRating,    suffix:"" },
            { label:"Day Streak",     value:STATS.streak,       suffix:"" },
            { label:"This Week",      value:STATS.thisWeek,     suffix:"" },
          ].map((s,i) => (
            <div key={i} className="stat-card glass">
              <div className="stat-value font-display"><Counter target={s.value} suffix={s.suffix} /></div>
              <div className="stat-label font-mono">{s.label}</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width:`${Math.min(100,(s.value/(i===1?5000:i===2?10:500))*100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESULTS */}
      {(optimized || recs.length > 0) && (
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

          {/* Gemini session note */}
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
                <BingeResultCard key={item.mediaId} item={item} blurb={aiBlurbs?.[item.title]} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Result Card ────────────────────────────────────────────────
const TIER_COLORS_MAP = { S:"#e94057", A:"#f5840c", B:"#f5c518", C:"#00c896", D:"#a78bfa" };

function BingeResultCard({ item, blurb }) {
  const tier = item.tierRank;
  const tierColor = TIER_COLORS_MAP[tier];
  const score = item.score;

  return (
    <div className="rec-card media-card">
      <img
        src={item.posterUrl || FALLBACK_POSTER}
        alt={item.title}
        className="media-card__img"
        loading="lazy"
        onError={e => { e.target.src = FALLBACK_POSTER; }}
      />

      {/* Tier badge */}
      {tier && tier !== "unranked" && (
        <div className="rec-badge font-display" style={{
          position:"absolute", top:8, right:8,
          background: tierColor, color: tier === "B" ? "#000" : "#fff",
          borderRadius:4, width:28, height:28, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:14, fontWeight:900, boxShadow:"0 2px 8px rgba(0,0,0,0.5)"
        }}>{tier}</div>
      )}

      {/* Algorithm score */}
      <div className="binge-score-chip font-mono">
        {Math.round(score)}pts
      </div>

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
