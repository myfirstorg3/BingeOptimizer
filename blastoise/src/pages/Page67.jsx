import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function Page67() {
  const numRef    = useRef(null);
  const textRef   = useRef(null);
  const pageRef = useRef(null);
  const [clicks, setClicks]   = useState(0);
  const [phase,  setPhase]    = useState(0); // 0 idle · 1 shaking · 2 chaos

  const handleClick = () => {
    const next = clicks + 1;
    setClicks(next);
    if (next >= 10) setPhase(2);
    else             setPhase(1);

    const el = numRef.current;
    gsap.killTweensOf(el);

    if (next < 10) {
      gsap.fromTo(
        el,
        { rotation: -12, x: -6 },
        {
          rotation: 0, x: 0,
          ease: "elastic.out(1.4, 0.3)",
          duration: 0.6,
        }
      );
    } else {
      gsap.fromTo(
        el,
        { rotation: -20, x: -10, scale: 0.9 },
        {
          rotation: 0, x: 0, scale: 1,
          ease: "elastic.out(1.6, 0.2)",
          duration: 0.9,
        }
      );
    }
  };
  // ── Page entry wobble ──
  useEffect(() => {
    gsap.fromTo(
      pageRef.current,
      { rotation: -18, x: -60, y: 40, scale: 1.15 }, // Starts tilted and shifted
      {
        rotation: 0,
        x: 0,
        y: 0,
        scale: 1,
        ease: "elastic.out(2.5, 0.1)", // The bouncy meme wobble
        duration: 3.5,
      }
    );
  }, []);

  // idle pulse
  useEffect(() => {
    if (phase !== 0) return;
    const tl = gsap.to(numRef.current, {
      y: -6,
      duration: 1.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
    return () => tl.kill();
  }, [phase]);

  // chaos loop
  useEffect(() => {
    if (phase !== 2) return;
    const tl = gsap.to(numRef.current, {
      rotation: "random(-15, 15)",
      x: "random(-10, 10)",
      y: "random(-8, 8)",
      duration: 0.08,
      ease: "none",
      repeat: -1,
    });
    return () => tl.kill();
  }, [phase]);

  const captions = [
    "just a number.",
    "or is it?",
    "keep clicking.",
    "it's waking up.",
    "it knows.",
    "stop.",
    "please.",
    "ok fine.",
    "you asked for this.",
    "☠︎ CHAOS MODE ☠︎",
  ];

  const caption = captions[Math.min(clicks, captions.length - 1)];

  return (
    <main ref={pageRef} className="page page--67">
      <div className="sixtyseven-wrap">

        {/* ── Scanline decoration ── */}
        <div className="sixtyseven-scanlines" aria-hidden="true" />

        {/* ── Corner tags ── */}
        <span className="sixtyseven-corner sixtyseven-corner--tl font-mono">/67</span>
        <span className="sixtyseven-corner sixtyseven-corner--br font-mono">
          clicks: {clicks}
        </span>

        {/* ── The number ── */}
        <button className="sixtyseven-btn" onClick={handleClick} aria-label="Click 67">
          <span
            ref={numRef}
            className={`sixtyseven-num font-display ${phase === 2 ? "text-pink glow-pink" : "text-cyan glow-cyan"}`}
          >
            67
          </span>
        </button>

        {/* ── Caption ── */}
        <p
          ref={textRef}
          key={clicks}
          className={`sixtyseven-caption font-mono ${phase === 2 ? "text-pink" : "text-secondary"}`}
        >
          {caption}
        </p>

        {/* ── Click hint ── */}
        {clicks === 0 && (
          <p className="sixtyseven-hint font-mono text-muted">
            // click it
          </p>
        )}

        {/* ── Click counter bar ── */}
        {clicks > 0 && clicks < 10 && (
          <div className="sixtyseven-bar">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="sixtyseven-bar__seg"
                style={{
                  background: i < clicks
                    ? "var(--cyan)"
                    : "var(--surface-2)",
                  boxShadow: i < clicks
                    ? "0 0 8px var(--cyan-mid)"
                    : "none",
                }}
              />
            ))}
          </div>
        )}

        {phase === 2 && (
          <button
            className="btn btn--ghost"
            style={{ marginTop: 32 }}
            onClick={() => { setClicks(0); setPhase(0); }}
          >
            reset
          </button>
        )}
      </div>

      <style>{`
        .page--67 {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
        }

        .sixtyseven-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          text-align: center;
          padding: 60px 40px;
          user-select: none;
        }

        .sixtyseven-scanlines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0,229,255,0.012) 3px,
            rgba(0,229,255,0.012) 4px
          );
          z-index: 0;
        }

        .sixtyseven-corner {
          position: fixed;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .sixtyseven-corner--tl { top: calc(var(--nav-height) + 20px); left: 40px; }
        .sixtyseven-corner--br { bottom: 80px; right: 40px; }

        .sixtyseven-btn {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          border: 1px solid var(--border-glow);
          background: var(--cyan-dim);
          transition: background 0.3s, border-color 0.3s;
        }

        .sixtyseven-btn:hover {
          background: rgba(0,229,255,0.12);
        }

        .sixtyseven-num {
          font-size: clamp(120px, 20vw, 200px);
          line-height: 1;
          letter-spacing: -0.02em;
          display: block;
          transform-origin: center;
          will-change: transform;
        }

        .sixtyseven-caption {
          font-size: 13px;
          letter-spacing: 0.06em;
          min-height: 20px;
          animation: fadeCaption 0.25s ease;
        }

        .sixtyseven-hint {
          font-size: 11px;
          letter-spacing: 0.1em;
          margin-top: 4px;
          animation: blink 1.4s ease-in-out infinite;
        }

        .sixtyseven-bar {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }
        .sixtyseven-bar__seg {
          width: 20px;
          height: 3px;
          border-radius: 2px;
          transition: background 0.2s, box-shadow 0.2s;
        }

        @keyframes fadeCaption {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}
