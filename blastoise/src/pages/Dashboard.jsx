import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import anime from "animejs";
import { MOODS, STATS } from "../data/mockData";
import { useFetchMedia } from "../hooks/useFetchMedia";
import "./Dashboard.css";

gsap.registerPlugin(ScrollTrigger);

// Animated counter — UNCHANGED
function Counter({ target, suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const obj = { val: 0 };
    anime({
      targets: obj,
      val: target,
      duration: 1800,
      delay: 300,
      easing: "easeOutExpo",
      update: () => {
        if (ref.current) {
          ref.current.textContent =
            Number(obj.val.toFixed(0)).toLocaleString() + suffix;
        }
      },
    });
  }, [target]);
  return <span ref={ref}>0{suffix}</span>;
}

const FALLBACK_POSTER = "https://via.placeholder.com/300x450/0a0a0f/00e5ff?text=NO+POSTER";

export default function Dashboard() {
  const heroRef   = useRef(null);
  const statsRef  = useRef(null);
  const recsRef   = useRef(null);
  const canvasRef = useRef(null);

  const [timeSlot,      setTimeSlot]      = useState("2h");
  const [selectedMoods, setSelectedMoods] = useState(["intense"]);
  const [genre,         setGenre]         = useState("all");
  const [optimized,     setOptimized]     = useState(false);
  const [recs,          setRecs]          = useState([]);

  // ── OMDB: fetch media once ──
  const { media, loading } = useFetchMedia();

  // Seed recs once media loads
  useEffect(() => {
    if (media.length > 0 && recs.length === 0) {
      setRecs(media.slice(0, 6));
    }
  }, [media]);

  // Canvas particles — UNCHANGED
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, particles, raf;

    const init = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: 60 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        a: Math.random() * 0.5 + 0.1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.a})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,229,255,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);

  // Hero entrance — UNCHANGED
  useEffect(() => {
    const letters = heroRef.current?.querySelectorAll(".hero-letter");
    if (letters) {
      anime({
        targets: letters,
        translateY: [60, 0],
        opacity:    [0, 1],
        delay:      anime.stagger(60),
        duration:   800,
        easing:     "easeOutExpo",
      });
    }
    gsap.fromTo(".hero-sub",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, delay: 0.5, duration: 0.7, ease: "power3.out" }
    );
    gsap.fromTo(".optimizer-card",
      { opacity: 0, y: 40, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, delay: 0.7, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  // Stats scroll reveal — UNCHANGED
  useEffect(() => {
    gsap.fromTo(".stat-card",
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  // Recs reveal — UNCHANGED
  useEffect(() => {
    gsap.fromTo(".rec-card",
      { opacity: 0, scale: 0.95, y: 20 },
      {
        opacity: 1, scale: 1, y: 0,
        stagger: 0.07,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: recsRef.current,
          start: "top 80%",
        },
      }
    );
  }, [recs]);

  const toggleMood = (id) => {
    setSelectedMoods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // ── OMDB: handleOptimize now filters real media ──
  const handleOptimize = () => {
    const btn = document.querySelector(".optimize-btn");
    anime({ targets: btn, scale: [1, 0.94, 1], duration: 300, easing: "easeInOutQuad" });
    anime({
      targets: ".optimizer-title",
      translateX: [0, -3, 3, -2, 0],
      duration: 300,
      easing: "linear",
    });

    setTimeout(() => {
      const mins = timeSlot === "1h" ? 60 : timeSlot === "2h" ? 120 : timeSlot === "3h" ? 180 : 240;

      const filtered = media.filter((m) => {
        const moodMatch =
          selectedMoods.length === 0 ||
          m.mood.some((md) => selectedMoods.includes(md));
        const durMatch  = m.duration <= mins;
        const genreMatch =
          genre === "all" ||
          m.genre.map((g) => g.toLowerCase()).includes(genre.toLowerCase());
        return moodMatch && durMatch && genreMatch;
      });

      setRecs(filtered.length > 0 ? filtered : media.slice(0, 4));
      setOptimized(true);

      anime({
        targets: ".rec-card",
        opacity:    [0, 1],
        translateY: [16, 0],
        delay:      anime.stagger(50),
        duration:   400,
        easing:     "easeOutQuad",
      });
    }, 400);
  };

  const TITLE = "BINGE OPTIMIZER";

  return (
    <div className="page dashboard">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="noise-overlay" />

      {/* ── HERO — UNCHANGED ── */}
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
          the algorithm composes your perfect viewing session.
        </p>
      </section>

      {/* ── OPTIMIZER CARD — UNCHANGED ── */}
      <section className="container optimizer-section">
        <div className="optimizer-card glass">
          <div className="optimizer-header">
            <h2 className="optimizer-title font-mono">CONFIGURE_SESSION</h2>
            <div className="optimizer-header-line" />
          </div>
          <div className="optimizer-body">
            <div className="opt-group">
              <label className="opt-label">TIME AVAILABLE</label>
              <div className="time-pills">
                {["1h", "2h", "3h", "4h+"].map((t) => (
                  <button key={t} className={`time-pill ${timeSlot === t ? "active" : ""}`} onClick={() => setTimeSlot(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="opt-group">
              <label className="opt-label">CURRENT MOOD</label>
              <div className="mood-grid">
                {MOODS.map((mood) => (
                  <button key={mood.id} className={`mood-chip ${selectedMoods.includes(mood.id) ? "active" : ""}`} onClick={() => toggleMood(mood.id)}>
                    <span>{mood.icon}</span>
                    <span>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="opt-group">
              <label className="opt-label">GENRE FILTER</label>
              <div className="genre-row">
                {["all", "Sci-Fi", "Action", "Drama", "Anime", "Horror"].map((g) => (
                  <button key={g} className={`genre-btn ${genre === g ? "active" : ""}`} onClick={() => setGenre(g)}>{g}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="optimizer-footer">
            <button className="optimize-btn btn btn--primary" onClick={handleOptimize} disabled={loading}>
              <span>▶</span>
              <span>{loading ? "LOADING..." : "OPTIMIZE SESSION"}</span>
            </button>
            {optimized && (
              <span className="opt-result-text font-mono">{recs.length} TITLES MATCHED</span>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS — UNCHANGED ── */}
      <section ref={statsRef} className="container section stats-section">
        <div className="section-header">
          <span className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.12em" }}>01 // YOUR STATS</span>
          <div className="section-line" />
        </div>
        <div className="stats-grid">
          {[
            { label: "Titles Watched", value: STATS.totalWatched, suffix: "" },
            { label: "Hours Logged",   value: STATS.hoursLogged,  suffix: "h" },
            { label: "Avg Rating",     value: STATS.avgRating,    suffix: "" },
            { label: "Day Streak",     value: STATS.streak,       suffix: "" },
            { label: "This Week",      value: STATS.thisWeek,     suffix: "" },
          ].map((s, i) => (
            <div key={i} className="stat-card glass">
              <div className="stat-value font-display">
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div className="stat-label font-mono">{s.label}</div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${Math.min(100, (s.value / (i === 1 ? 5000 : i === 2 ? 10 : 500)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RECOMMENDATIONS ── */}
      <section ref={recsRef} className="container section">
        <div className="section-header">
          <span className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
            02 // {optimized ? "OPTIMIZED FOR YOU" : "RECOMMENDED"}
          </span>
          <div className="section-line" />
          <button className="btn btn--ghost" style={{ whiteSpace: "nowrap", fontSize: 10 }}>VIEW ALL →</button>
        </div>

        {loading ? (
          <div className="font-mono text-muted" style={{ padding: "40px 0", letterSpacing: "0.12em" }}>
            FETCHING TITLES...
          </div>
        ) : (
          <div className="recs-grid">
            {recs.slice(0, 6).map((item) => (
              <div key={item.id} className="rec-card media-card">
                <img
                  src={item.poster || FALLBACK_POSTER}
                  alt={item.title}
                  className="media-card__img"
                  loading="lazy"
                  onError={(e) => { e.target.src = FALLBACK_POSTER; }}
                />
                <div className={`rec-badge font-display score-badge score-badge--${item.score.toLowerCase()}`}>
                  {item.score}
                </div>
                <div className="media-card__overlay">
                  <div className="media-card__title">{item.title}</div>
                  <div className="media-card__meta">
                    {item.year} · {item.duration}{item.type === "movie" ? "min" : "m/ep"}
                    {item.price && ` · $${item.price}`}
                  </div>
                  <div className="rec-genres">
                    {item.genre.slice(0, 2).map((g) => (
                      <span key={g} className="tag tag--cyan" style={{ fontSize: 9, padding: "2px 6px" }}>{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
