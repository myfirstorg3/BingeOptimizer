import { useState } from "react";

const MEMBERS = [
  { id: 1,  name: "Aria Voss",      role: "Founder",          shows: 412, rating: 9.4, accent: "cyan",  initials: "AV" },
  { id: 2,  name: "Kael Morrow",    role: "Co-founder",       shows: 388, rating: 9.1, accent: "pink",  initials: "KM" },
  { id: 3,  name: "Sena Obi",       role: "Lead Dev",         shows: 301, rating: 8.8, accent: "gold",  initials: "SO" },
  { id: 4,  name: "Riku Tanaka",    role: "Design",           shows: 275, rating: 9.2, accent: "green", initials: "RT" },
  { id: 5,  name: "Demi Hale",      role: "Community",        shows: 248, rating: 8.5, accent: "cyan",  initials: "DH" },
  { id: 6,  name: "Zara Finn",      role: "Content",          shows: 190, rating: 8.9, accent: "pink",  initials: "ZF" },
];

const ACCENT_MAP = {
  cyan:  { color: "var(--cyan)",  dim: "var(--cyan-dim)",  border: "rgba(0,229,255,0.2)"   },
  pink:  { color: "var(--pink)",  dim: "var(--pink-dim)",  border: "rgba(255,45,107,0.2)"  },
  gold:  { color: "var(--gold)",  dim: "var(--gold-dim)",  border: "rgba(255,184,0,0.2)"   },
  green: { color: "var(--green)", dim: "var(--green-dim)", border: "rgba(0,255,136,0.2)"   },
};

function MemberCard({ member }) {
  const ac = ACCENT_MAP[member.accent];

  return (
    <div className="member-card glass">
      {/* Avatar */}
      <div
        className="member-avatar font-display"
        style={{ background: ac.dim, border: `1px solid ${ac.border}`, color: ac.color }}
      >
        {member.initials}
      </div>

      {/* Info */}
      <div className="member-info">
        <p className="member-name">{member.name}</p>
        <p
          className="member-role font-mono"
          style={{ color: ac.color, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}
        >
          {member.role}
        </p>
      </div>

      {/* Stats */}
      <div className="member-stats">
        <div className="member-stat">
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: ac.color }}>
            {member.shows}
          </span>
          <span className="font-mono text-muted" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
            SHOWS
          </span>
        </div>
        <div className="member-stat-divider" />
        <div className="member-stat">
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: ac.color }}>
            {member.rating}
          </span>
          <span className="font-mono text-muted" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
            AVG SCORE
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Members() {
  const [search, setSearch] = useState("");
  const filtered = MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="page grid-bg">
      <div className="container section">

        {/* ── Header ── */}
        <div className="members-header">
          <span className="tag tag--pink">Crew</span>
          <h1 className="font-display members-title">
            THE <span className="text-pink glow-pink">MEMBERS</span>
          </h1>
          <p className="font-mono text-secondary" style={{ fontSize: 12, letterSpacing: "0.06em" }}>
            // the people behind the binge
          </p>
        </div>

        <hr className="divider" style={{ margin: "48px 0 32px" }} />

        {/* ── Search ── */}
        <div style={{ maxWidth: 360, marginBottom: 40 }}>
          <input
            className="input"
            placeholder="search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ── Count tag ── */}
        <div style={{ marginBottom: 24 }}>
          <span className="tag tag--cyan">{filtered.length} members</span>
        </div>

        {/* ── Grid ── */}
        <div className="members-grid">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
          {filtered.length === 0 && (
            <p className="font-mono text-muted" style={{ gridColumn: "1 / -1", padding: "40px 0" }}>
              no members found.
            </p>
          )}
        </div>
      </div>

      <style>{`
        .members-header { max-width: 640px; }
        .members-title {
          font-size: clamp(56px, 8vw, 96px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          margin: 16px 0 12px;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .member-card {
          border-radius: var(--r-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          transition: border-color 0.25s, transform 0.25s;
        }
        .member-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-3px);
        }

        .member-avatar {
          width: 52px; height: 52px;
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          letter-spacing: 0.04em;
        }

        .member-info { display: flex; flex-direction: column; gap: 4px; }
        .member-name { font-size: 16px; font-weight: 600; letter-spacing: 0.01em; }

        .member-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .member-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .member-stat-divider {
          width: 1px;
          height: 32px;
          background: var(--border-bright);
        }
      `}</style>
    </main>
  );
}
