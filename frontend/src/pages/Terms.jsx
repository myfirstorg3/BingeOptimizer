const SECTIONS = [
  {
    id:    "01",
    title: "Acceptance of Terms",
    body:  "By accessing or using Blastoise, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the platform. We reserve the right to modify these terms at any time — continued use constitutes acceptance.",
  },
  {
    id:    "02",
    title: "Use of the Platform",
    body:  "Blastoise is a personal binge optimizer. You agree not to misuse the platform, attempt to reverse-engineer its systems, scrape data at scale, or use it in any way that disrupts other users' experience. One account per person.",
  },
  {
    id:    "03",
    title: "Your Data",
    body:  "We collect only what's necessary: your watchlist, ratings, and preferences. We do not sell your data. You can export or delete your data at any time from Settings. We store data securely and will notify you of any breach within 72 hours.",
  },
  {
    id:    "04",
    title: "Content & Ratings",
    body:  "Ratings and reviews you submit remain yours. By submitting them you grant Blastoise a non-exclusive license to display them publicly on the platform. We reserve the right to remove content that violates community guidelines.",
  },
  {
    id:    "05",
    title: "Third-Party Services",
    body:  "Blastoise integrates with third-party APIs for metadata (titles, posters, descriptions). We are not responsible for the accuracy of third-party content. Links to external sites are provided for convenience only.",
  },
  {
    id:    "06",
    title: "Limitation of Liability",
    body:  "Blastoise is provided 'as is' without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to lost data or service interruptions.",
  },
  {
    id:    "07",
    title: "Termination",
    body:  "We reserve the right to suspend or terminate your account at our discretion if you violate these terms. You may delete your account at any time from the Settings page. All your data will be permanently removed within 30 days.",
  },
];

export default function Terms() {
  return (
    <main className="page grid-bg">
      <div className="container section">

        {/* ── Header ── */}
        <div className="terms-header">
          <span className="tag tag--gold">Legal</span>
          <h1 className="font-display terms-title">
            TERMS OF <span className="text-gold" style={{ textShadow: "0 0 20px rgba(255,184,0,0.4), 0 0 60px rgba(255,184,0,0.08)" }}>SERVICE</span>
          </h1>
          <div className="terms-meta font-mono">
            <span className="text-muted" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
              LAST UPDATED — <span style={{ color: "var(--gold)" }}>JANUARY 2026</span>
            </span>
          </div>
        </div>

        <hr className="divider" style={{ margin: "48px 0" }} />

        {/* ── Sections ── */}
        <div className="terms-body">
          {SECTIONS.map((sec) => (
            <div key={sec.id} className="terms-section">
              <div className="terms-section__id font-display text-muted">
                {sec.id}
              </div>
              <div className="terms-section__content">
                <h2 className="terms-section__title">{sec.title}</h2>
                <p className="terms-section__body text-secondary">{sec.body}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="divider" style={{ margin: "64px 0 40px" }} />

        {/* ── Footer note ── */}
        <p className="font-mono text-muted" style={{ fontSize: 11, letterSpacing: "0.06em", maxWidth: 560 }}>
          // questions about these terms? reach us at{" "}
          <a href="/contact" style={{ color: "var(--cyan)" }}>contact</a>.
          &nbsp;by using blastoise you acknowledge that you've read and understood all of the above.
        </p>

      </div>

      <style>{`
        .terms-header { max-width: 680px; }
        .terms-title {
          font-size: clamp(56px, 8vw, 96px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          margin: 16px 0 16px;
        }

        .terms-body {
          display: flex;
          flex-direction: column;
          gap: 0;
          max-width: 860px;
        }

        .terms-section {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 32px;
          padding: 32px 0;
          border-bottom: 1px solid var(--border);
          transition: background 0.2s;
        }
        .terms-section:first-child { padding-top: 0; }

        .terms-section__id {
          font-size: 32px;
          line-height: 1;
          padding-top: 4px;
          opacity: 0.4;
          transition: opacity 0.2s;
        }
        .terms-section:hover .terms-section__id { opacity: 0.9; }

        .terms-section__content { display: flex; flex-direction: column; gap: 10px; }

        .terms-section__title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 0.01em;
        }

        .terms-section__body {
          font-size: 14px;
          line-height: 1.75;
        }

        @media (max-width: 600px) {
          .terms-section { grid-template-columns: 48px 1fr; gap: 16px; }
          .terms-section__id { font-size: 22px; }
        }
      `}</style>
    </main>
  );
}
