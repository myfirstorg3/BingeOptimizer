import { useState } from "react";

const MEMBERS = [
  { id: 1,  name: "Aaryan Degama",  role: "Founder",          shows: 412, rating: 9.4, accent: "cyan",  initials: "AD" },
  { id: 2,  name: "Geethika",       role: "Co-founder",       shows: 388, rating: 9.1, accent: "pink",  initials: "G" },
  { id: 3,  name: "Jalendu Pandey", role: "Lead Dev",         shows: 301, rating: 8.8, accent: "gold",  initials: "JP" },
  { id: 4,  name: "Archee Jaiswal", role: "Design",           shows: 275, rating: 9.2, accent: "green", initials: "AJ" },
  { id: 5,  name: "Manas Singh",    role: "Community",        shows: 248, rating: 8.5, accent: "cyan",  initials: "MS" },
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
    <div className="member-card glass" style={{ padding: '40px 24px', alignItems: 'center' }}>
      <div 
        className="member-pic-wrapper" 
        style={{ 
          width: '180px', 
          height: '180px', 
          background: ac.dim, 
          borderRadius: '50%', 
          border: `2px solid ${ac.color}`,
          overflow: 'hidden',
          marginBottom: '24px',
          flexShrink: 0
        }}
      >
        <img 
          src={`/assets/${member.name.split(" ")[0].toLowerCase()}.png`}
          alt={member.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { 
            e.target.style.display = 'none';
            e.target.parentElement.style.display = 'flex';
            e.target.parentElement.style.alignItems = 'center';
            e.target.parentElement.style.justifyContent = 'center';
            e.target.parentElement.innerHTML = `<span class="font-display" style="font-size: 56px; color: ${ac.color}; opacity: 0.5;">${member.initials}</span>`;
          }}
        />
      </div>

      <div className="member-info" style={{ alignItems: 'center', width: '100%' }}>
        <p className="member-name" style={{ textAlign: 'center', fontSize: '22px' }}>{member.name}</p>
      </div>
    </div>
  );
}

export default function Members() {
  return (
    <main className="page grid-bg">
      <div className="container section">

        <div className="members-header">
          <span className="tag tag--pink">Crew</span>
          <h1 className="font-display members-title">
            THE <span className="text-pink glow-pink">MEMBERS</span>
          </h1>
          <p className="font-mono text-secondary" style={{ fontSize: 12, letterSpacing: "0.06em" }}>
            // the people behind the binge
          </p>
        </div>

        <hr className="divider" style={{ margin: "16px 0 32px" }} />

        <div className="members-grid">
          {MEMBERS.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
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
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        @media (max-width: 900px) {
          .members-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .members-grid { grid-template-columns: 1fr; }
        }

        .member-card {
          border-radius: var(--r-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: border-color 0.25s, transform 0.25s;
        }
        .member-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-3px);
        }

        .member-info { display: flex; flex-direction: column; gap: 4px; }
        .member-name { font-size: 16px; font-weight: 600; letter-spacing: 0.01em; }
      `}</style>
    </main>
  );
}
