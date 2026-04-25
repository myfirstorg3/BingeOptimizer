import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import anime from "animejs";
import "./Settings.css";

const MENU_ITEMS = [
  { id: "profile",    icon: "◈", label: "Profile" },
  { id: "security",   icon: "◉", label: "Security & Privacy" },
  { id: "notifs",     icon: "◎", label: "Notifications" },
  { id: "wallet",     icon: "◇", label: "Wallet Connections" },
  { id: "disconnect", icon: "⊘", label: "Disconnect",  danger: true },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [username,  setUsername]  = useState("Neon_Striker_3D");
  const [email,     setEmail]     = useState("striker@cybernet.io");
  const [bio,       setBio]       = useState("Traversing the cinematic multiverse, one arc at a time.");
  const [pubProfile,  setPubProfile]  = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs,  setPushNotifs]  = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    gsap.fromTo(".settings-sidebar",
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }
    );
    gsap.fromTo(".settings-content",
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, delay: 0.15, duration: 0.6, ease: "power3.out" }
    );
    gsap.fromTo(".settings-title span",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, delay: 0.2, ease: "power2.out" }
    );
  }, []);

  const handleSave = () => {
    const btn = document.querySelector(".save-btn");
    anime({
      targets: btn,
      scale: [1, 0.93, 1],
      duration: 250,
      easing: "easeInOutQuad",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page settings-page">
      <div className="noise-overlay" />

      <div className="container settings-wrap">
        {/* Title */}
        <div className="settings-title font-display">
          {"Profile Identity".split("").map((c, i) => (
            <span key={i}>{c === " " ? "\u00A0" : c}</span>
          ))}
        </div>
        <p className="settings-subtitle">
          Manage your public persona and contact details within the ecosystem.
        </p>

        <div className="settings-layout">
          {/* Sidebar */}
          <aside className="settings-sidebar glass">
            <div className="sidebar-header">
              <div className="sidebar-avatar">
                <img
                  src="https://picsum.photos/seed/avatar/100/100"
                  alt="Avatar"
                />
                <div className="avatar-status-dot" />
              </div>
              <div>
                <div className="sidebar-name font-ui">{username}</div>
                <div className="sidebar-email font-mono">{email}</div>
              </div>
            </div>

            <nav className="sidebar-nav">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar-item ${activeSection === item.id ? "active" : ""} ${item.danger ? "danger" : ""}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className="sidebar-item__icon font-mono">{item.icon}</span>
                  <span className="sidebar-item__label">{item.label}</span>
                  {activeSection === item.id && <span className="sidebar-item__arrow">→</span>}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="settings-content">
            {activeSection === "profile" && (
              <ProfileSection
                username={username} setUsername={setUsername}
                email={email} setEmail={setEmail}
                bio={bio} setBio={setBio}
              />
            )}
            {activeSection === "security" && <SecuritySection />}
            {activeSection === "notifs" && (
              <NotifsSection
                emailNotifs={emailNotifs} setEmailNotifs={setEmailNotifs}
                pushNotifs={pushNotifs} setPushNotifs={setPushNotifs}
              />
            )}
            {activeSection === "wallet" && <WalletSection />}
            {activeSection === "disconnect" && <DisconnectSection />}

            {/* Visibility (only on profile) */}
            {activeSection === "profile" && (
              <div className="settings-card glass" style={{ marginTop: 20 }}>
                <h3 className="card-title">Visibility Settings</h3>
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Public Profile</div>
                    <div className="toggle-desc">Allow other users to view your collection and tier lists.</div>
                  </div>
                  <Toggle checked={pubProfile} onChange={setPubProfile} />
                </div>
                <hr className="divider" />
                <div className="toggle-row">
                  <div>
                    <div className="toggle-label">Show Online Status</div>
                    <div className="toggle-desc">Display a green indicator when you are active on the platform.</div>
                  </div>
                  <Toggle checked={onlineStatus} onChange={setOnlineStatus} />
                </div>
              </div>
            )}

            {/* Save / Discard */}
            {(activeSection === "profile" || activeSection === "notifs") && (
              <div className="settings-actions">
                <button className="btn btn--ghost" style={{ fontSize: 11 }}>
                  DISCARD CHANGES
                </button>
                <button className="save-btn btn btn--primary" onClick={handleSave} style={{ fontSize: 11 }}>
                  {saved ? "✓ SAVED" : "SAVE PROFILE"}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ username, setUsername, email, setEmail, bio, setBio }) {
  return (
    <>
      {/* Avatar */}
      <div className="settings-card glass">
        <h3 className="card-title">Avatar Image</h3>
        <div className="avatar-section">
          <div className="avatar-preview">
            <img src="https://picsum.photos/seed/avatar/120/120" alt="Avatar" />
          </div>
          <div className="avatar-actions">
            <p className="font-mono text-muted" style={{ fontSize: 11, lineHeight: 1.6 }}>
              Upload a square image. Recommended 400×400px.<br/>
              PNG, JPG, or GIF · Max 4MB.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn--ghost" style={{ fontSize: 10 }}>UPLOAD NEW</button>
              <button className="btn btn--danger" style={{ fontSize: 10 }}>REMOVE</button>
            </div>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="settings-card glass" style={{ marginTop: 20 }}>
        <h3 className="card-title">Basic Information</h3>

        <div className="form-group">
          <label className="form-label">DISPLAY NAME</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">EMAIL ADDRESS</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">BIO</label>
          <textarea
            className="input"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
      </div>
    </>
  );
}

function SecuritySection() {
  return (
    <div className="settings-card glass">
      <h3 className="card-title">Security & Privacy</h3>
      <div className="form-group">
        <label className="form-label">CURRENT PASSWORD</label>
        <input className="input" type="password" placeholder="••••••••••" />
      </div>
      <div className="form-group">
        <label className="form-label">NEW PASSWORD</label>
        <input className="input" type="password" placeholder="••••••••••" />
      </div>
      <div className="form-group">
        <label className="form-label">CONFIRM PASSWORD</label>
        <input className="input" type="password" placeholder="••••••••••" />
      </div>
      <button className="btn btn--primary" style={{ fontSize: 11 }}>UPDATE PASSWORD</button>
    </div>
  );
}

function NotifsSection({ emailNotifs, setEmailNotifs, pushNotifs, setPushNotifs }) {
  return (
    <div className="settings-card glass">
      <h3 className="card-title">Notifications</h3>
      <div className="toggle-row">
        <div>
          <div className="toggle-label">Email Notifications</div>
          <div className="toggle-desc">Receive weekly digest and release alerts via email.</div>
        </div>
        <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
      </div>
      <hr className="divider" style={{ margin: "16px 0" }} />
      <div className="toggle-row">
        <div>
          <div className="toggle-label">Push Notifications</div>
          <div className="toggle-desc">Browser notifications for new episodes and rankings.</div>
        </div>
        <Toggle checked={pushNotifs} onChange={setPushNotifs} />
      </div>
    </div>
  );
}

function WalletSection() {
  return (
    <div className="settings-card glass">
      <h3 className="card-title">Wallet Connections</h3>
      <p className="font-mono text-muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
        Connect a Web3 wallet to unlock premium features,<br/>
        purchase collectible media, and participate in<br/>
        community rankings.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {["MetaMask", "WalletConnect", "Coinbase"].map((w) => (
          <button key={w} className="btn btn--ghost" style={{ fontSize: 11 }}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

function DisconnectSection() {
  return (
    <div className="settings-card glass">
      <h3 className="card-title" style={{ color: "var(--pink)" }}>Danger Zone</h3>
      <p className="font-mono text-muted" style={{ fontSize: 12, lineHeight: 1.7 }}>
        Permanently disconnect and delete your account.<br/>
        This action cannot be undone.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
        <button className="btn btn--danger" style={{ fontSize: 11 }}>
          DISCONNECT ACCOUNT
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle" style={{ flexShrink: 0 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="toggle__track" />
      <div className="toggle__thumb" />
    </label>
  );
}
