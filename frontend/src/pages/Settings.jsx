import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const API = "http://localhost:5000/api";

const MENU_ITEMS = [
  { id: "profile",    icon: "◈", label: "Profile" },
  { id: "security",   icon: "◉", label: "Security" },
  { id: "friends",    icon: "⬡", label: "Friends" },
  { id: "disconnect", icon: "⊘", label: "Danger Zone", danger: true },
];

function avSrc(user) {
  if (!user) return `https://api.dicebear.com/7.x/identicon/svg?seed=anon`;
  if (user.avatarUrl) return `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${user.avatarUrl}`;
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username || "user"}`;
}

// Custom Image component to fetch images via JavaScript and bypass Ngrok's HTML warning page
function AvatarImage({ user, src, className, alt }) {
  const [blobSrc, setBlobSrc] = useState(null);
  
  useEffect(() => {
    const targetSrc = src || avSrc(user);
    // If it's an external dicebear URL or local preview, just use it directly
    if (!targetSrc.includes("api/users/avatar")) {
      setBlobSrc(targetSrc);
      return;
    }
    
    // If it's an API URL, fetch it using our globally overridden fetch (which adds the ngrok bypass header)
    fetch(targetSrc)
      .then(res => res.blob())
      .then(blob => setBlobSrc(URL.createObjectURL(blob)))
      .catch(() => setBlobSrc(`https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || "fallback"}`));
      
  }, [user, src]);

  return <img src={blobSrc || avSrc(user)} className={className} alt={alt || "Avatar"} />;
}

export default function Settings() {
  const { user: authUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");
  const [searchUser, setSearchUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // Redirect to dashboard if not logged in
  useEffect(() => {
    if (!token && !loading) navigate("/", { replace: true });
  }, [token, loading, navigate]);

  const fetchProfile = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await axios.get(`${API}/users/me`, authHeader);
      setProfile(data);
    } catch { logout(); navigate("/", { replace: true }); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!sidebarRef.current || !contentRef.current) return;
    gsap.fromTo(sidebarRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" });
    gsap.fromTo(contentRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, delay: 0.12, duration: 0.55, ease: "power3.out" });
  }, [loading]);

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(contentRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
  }, [activeSection]);

  if (loading) return (
    <div className="page settings-page">
      <div className="settings-loading"><div className="settings-spinner" /><p>Loading…</p></div>
    </div>
  );

  if (!token) return null;

  return (
    <div className="page settings-page">
      <div className="noise-overlay" />
      <div className="container settings-wrap">
        <ProfileSearch API={API} token={token} onSelectUser={(u) => { setActiveSection("friends"); setSearchUser(u); }} />
        <div className="settings-layout">
          <aside className="settings-sidebar glass" ref={sidebarRef}>
            <div className="sidebar-header">
              <div className="sidebar-avatar">
                <AvatarImage user={profile} />
                {profile?.showOnlineStatus && <div className="avatar-status-dot" />}
              </div>
              <div>
                <div className="sidebar-name font-ui">{profile?.username || "—"}</div>
                <div className="sidebar-email font-mono">{profile?.email || "—"}</div>
              </div>
            </div>
            <nav className="sidebar-nav">
              {MENU_ITEMS.map((item) => (
                <button key={item.id}
                  className={`sidebar-item ${activeSection === item.id ? "active" : ""} ${item.danger ? "danger" : ""}`}
                  onClick={() => setActiveSection(item.id)}>
                  <span className="sidebar-item__icon font-mono">{item.icon}</span>
                  <span className="sidebar-item__label">{item.label}</span>
                  {activeSection === item.id && <span className="sidebar-item__arrow">→</span>}
                </button>
              ))}
            </nav>
          </aside>

          <main className="settings-content" ref={contentRef}>
            {activeSection === "profile"    && <ProfileSection profile={profile} onUpdate={fetchProfile} API={API} authHeader={authHeader} />}
            {activeSection === "security"   && <SecuritySection API={API} authHeader={authHeader} />}
            {activeSection === "friends"    && <FriendsSection API={API} authHeader={authHeader} searchUser={searchUser} onClearSearchUser={() => setSearchUser(null)} />}
            {activeSection === "disconnect" && <DisconnectSection logout={logout} navigate={navigate} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileSearch({ API, token, onSelectUser }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [focused, setFocused] = useState(false);
  const debounce = useRef(null);

  const search = (val) => {
    setQuery(val);
    clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setBusy(true);
      try {
        const { data } = await axios.get(`${API}/users/search?q=${encodeURIComponent(val)}`);
        setResults(data);
      } catch { setResults([]); }
      finally { setBusy(false); }
    }, 380);
  };

  const open = results.length > 0 && focused && !selected;

  return (
    <div className={`psb-wrap ${open ? "psb-open" : ""}`}>
      <div className="psb-glass glass">
        <div className="psb-row">
          <div className="psb-magnify">
            {busy ? <div className="psb-spinner" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
          </div>
          <input
            className="psb-input"
            placeholder="Search profiles by username or name…"
            value={query}
            onChange={e => search(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
          />
          {query && (
            <button className="psb-clear" onClick={() => { setQuery(""); setResults([]); setSelected(null); }}>✕</button>
          )}
        </div>
        {open && (
          <div className="psb-dropdown">
            {results.map(u => (
              <button key={u.id} className="psb-item" onMouseDown={() => { onSelectUser(u); setQuery(""); setResults([]); }}>
                <img src={avSrc(u)} alt={u.username} className="psb-item-av" />
                <div className="psb-item-info">
                  <span className="psb-item-name">{u.username}</span>
                  {(u.firstName || u.lastName) && (
                    <span className="psb-item-sub">{[u.firstName, u.lastName].filter(Boolean).join(" ")}</span>
                  )}
                </div>
                <span className="psb-item-pill">View</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendProfile({ user, API, token, onClose, friendsData, onReqSent }) {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [pubData, setPubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reqStatus, setReqStatus] = useState(null);
  const [tab, setTab] = useState("collections");
  const containerRef = useRef(null);

  // Check relationship status
  const isFriend = friendsData.friends.some(f => f.user?.id === user.id);
  const isPendingOut = friendsData.outgoing.some(r => r.friend?.id === user.id);
  const isPendingIn = friendsData.incoming.some(r => r.user?.id === user.id);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/users/${user.id}/public-data`).then(r => setPubData(r.data)).catch(() => {}).finally(() => setLoading(false));
    if (containerRef.current) gsap.fromTo(containerRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
  }, [user.id]);

  const sendReq = async () => {
    setReqStatus("sending");
    try {
      await axios.post(`${API}/users/friends/request`, { targetUserId: user.id }, authHeader);
      setReqStatus("sent");
      onReqSent(); // Refresh friends list
    } catch (e) { setReqStatus(e.response?.data?.message || "error"); }
  };

  const TIER_COLORS = { S: "#ff2d6b", A: "#ff8c00", B: "#ffb800", C: "#00e5ff", D: "#9b59b6", F: "#444", unranked: "#333" };

  return (
    <div className="friend-profile-inline" ref={containerRef}>
      <button className="btn btn--ghost" onClick={onClose} style={{ marginBottom: 20, fontSize: 11 }}>← BACK TO FRIENDS</button>
      
      <div className="drawer glass" style={{ position: 'relative', width: '100%', height: 'auto', maxHeight: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
        {/* Hero */}
        <div className="drawer-hero" style={{ paddingTop: 30 }}>
          <div className="drawer-av-wrap">
            <img src={avSrc(user)} alt={user.username} className="drawer-av" />
            <div className="drawer-av-ring" />
          </div>
          <div className="drawer-hero-info">
            <h2 className="drawer-username font-ui">{user.username}</h2>
            {(user.firstName || user.lastName) && (
              <p className="drawer-fullname">{[user.firstName, user.lastName].filter(Boolean).join(" ")}</p>
            )}
            {user.bio && <p className="drawer-bio">{user.bio}</p>}
            <p className="drawer-since font-mono">Member since {new Date(user.createdAt).getFullYear()}</p>
          </div>
          
          <div className="drawer-actions-wrap" style={{ display: 'flex', gap: 10, alignSelf: 'flex-start', marginTop: 16 }}>
            {isFriend ? (
              <span className="tag tag--cyan" style={{ padding: '8px 16px' }}>✓ Friends</span>
            ) : isPendingOut ? (
              <span className="tag tag--gold" style={{ padding: '8px 16px' }}>Pending Request</span>
            ) : isPendingIn ? (
              <span className="tag tag--pink" style={{ padding: '8px 16px' }}>Sent you a request</span>
            ) : (
              <button
                className={`btn ${reqStatus === "sent" ? "btn--ghost" : "btn--primary"} drawer-add-btn`}
                onClick={sendReq}
                style={{ position: 'relative', top: 0, right: 0 }}
                disabled={reqStatus === "sending" || reqStatus === "sent"}>
                {reqStatus === "sent" ? "✓ Request Sent" : reqStatus === "sending" ? "…" : "+ Add Friend"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="drawer-tabs">
          {[["collections", "Collections"], ["tierlists", "Tier Lists"]].map(([id, label]) => (
            <button key={id} className={`drawer-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              {label}
              {pubData && <span className="drawer-tab-count">{pubData[id === "collections" ? "collections" : "tierLists"]?.length || 0}</span>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="drawer-body" style={{ minHeight: 300 }}>
          {loading && <div className="settings-spinner" style={{ margin: "40px auto" }} />}
          {!loading && tab === "collections" && (
            pubData?.collections?.length > 0 ? (
              <div className="drawer-collection-grid">
                {pubData.collections.map(c => (
                  <div key={c.id} className="drawer-coll-card glass">
                    <div className="drawer-coll-header">
                      <span className="drawer-coll-name">{c.name}</span>
                      <span className="drawer-coll-count font-mono">{c.items.length} items</span>
                    </div>
                    <div className="drawer-coll-posters">
                      {c.items.slice(0, 4).map(item => (
                        <div key={item.id} className="drawer-poster-wrap">
                          {item.media?.posterUrl
                            ? <img src={item.media.posterUrl} alt={item.media.title} className="drawer-poster" />
                            : <div className="drawer-poster-ph">{item.media?.title?.[0] || "?"}</div>}
                        </div>
                      ))}
                    </div>
                    {c.description && <p className="drawer-coll-desc">{c.description}</p>}
                  </div>
                ))}
              </div>
            ) : <div className="drawer-empty">No public collections yet</div>
          )}
          {!loading && tab === "tierlists" && (
            pubData?.tierLists?.length > 0 ? (
              <div className="drawer-tl-list">
                {pubData.tierLists.map(tl => (
                  <div key={tl.id} className="drawer-tl-card glass">
                    <div className="drawer-tl-header">
                      <span className="drawer-tl-name">{tl.title}</span>
                      <span className="drawer-tl-count font-mono">{tl.items.length} items</span>
                    </div>
                    {tl.description && <p className="drawer-tl-desc">{tl.description}</p>}
                    <div className="drawer-tl-items">
                      {["S","A","B","C","D","F"].map(tier => {
                        const items = tl.items.filter(i => i.tier === tier);
                        if (!items.length) return null;
                        return (
                          <div key={tier} className="drawer-tl-row">
                            <div className="drawer-tl-tier" style={{ background: TIER_COLORS[tier] }}>{tier}</div>
                            <div className="drawer-tl-row-items">
                              {items.slice(0, 6).map(item => (
                                <div key={item.id} className="drawer-tl-item" title={item.media?.title}>
                                  {item.media?.posterUrl
                                    ? <img src={item.media.posterUrl} alt={item.media.title} />
                                    : <div className="drawer-tl-item-ph">{item.media?.title?.[0] || "?"}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="drawer-empty">No public tier lists yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FriendsSection({ API, authHeader, searchUser, onClearSearchUser }) {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const token = authHeader.headers.Authorization?.split(" ")[1];

  const load = useCallback(async () => {
    try {
      const { data: d } = await axios.get(`${API}/users/friends/list`, authHeader);
      setData(d);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchUser) {
      setViewing(searchUser);
      onClearSearchUser();
    }
  }, [searchUser, onClearSearchUser]);

  const respond = async (id, action) => {
    try { await axios.post(`${API}/users/friends/respond`, { friendshipId: id, action }, authHeader); load(); }
    catch (e) { alert(e.response?.data?.message || "Error"); }
  };
  const remove = async (friendId) => {
    if (!confirm("Remove friend?")) return;
    try { await axios.delete(`${API}/users/friends/${friendId}`, authHeader); load(); setViewing(null); }
    catch (e) { alert(e.response?.data?.message || "Error"); }
  };

  if (loading) return <div className="settings-card glass"><div className="settings-spinner" style={{ margin: "40px auto" }} /></div>;

  if (viewing) {
    return (
      <FriendProfile 
        user={viewing} 
        API={API} 
        token={token} 
        onClose={() => setViewing(null)} 
        friendsData={data} 
        onReqSent={load}
      />
    );
  }

  return (
    <div className="friends-wrap">

      {data.incoming.length > 0 && (
        <div className="settings-card glass" style={{ marginBottom: 20 }}>
          <h3 className="card-title"><span className="friends-badge">{data.incoming.length}</span>Incoming Requests</h3>
          <div className="friends-list">
            {data.incoming.map(req => (
              <div key={req.id} className="friend-item incoming">
                <AvatarImage user={req.user} className="friend-avatar" alt={req.user?.username} />
                <div className="friend-info">
                  <div className="friend-name">{req.user?.username}</div>
                  <div className="friend-sub font-mono">{[req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ") || "Wants to be your friend"}</div>
                </div>
                <div className="friend-actions">
                  <button className="btn btn--primary" style={{ fontSize: 10, padding: "7px 14px" }} onClick={() => respond(req.id, "accept")}>Accept</button>
                  <button className="btn btn--danger" style={{ fontSize: 10, padding: "7px 14px" }} onClick={() => respond(req.id, "reject")}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="settings-card glass">
        <h3 className="card-title">Friends <span className="friends-count font-mono">{data.friends.length}</span></h3>
        {data.friends.length === 0 ? (
          <div className="friends-empty">
            <div className="friends-empty-icon">⬡</div>
            <p>No friends yet. Search for users above to send a request.</p>
          </div>
        ) : (
          <div className="friends-list">
            {data.friends.map(f => (
              <div key={f.friendshipId} className="friend-item friend-item--clickable" onClick={() => setViewing(f.user)}>
                <AvatarImage user={f.user} className="friend-avatar" alt={f.user?.username} />
                <div className="friend-info">
                  <div className="friend-name">{f.user?.username}</div>
                  <div className="friend-sub font-mono">Friends since {new Date(f.since).toLocaleDateString()}</div>
                </div>
                <span className="friend-view-hint font-mono">View Profile →</span>
                <button className="btn btn--danger" style={{ fontSize: 10, padding: "7px 14px" }} onClick={e => { e.stopPropagation(); remove(f.user?.id); }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.outgoing.length > 0 && (
        <div className="settings-card glass" style={{ marginTop: 20 }}>
          <h3 className="card-title">Pending Sent</h3>
          <div className="friends-list">
            {data.outgoing.map(req => (
              <div key={req.id} className="friend-item">
                <AvatarImage user={req.friend} className="friend-avatar" alt={req.friend?.username} />
                <div className="friend-info">
                  <div className="friend-name">{req.friend?.username}</div>
                  <div className="friend-sub font-mono text-muted">Awaiting response…</div>
                </div>
                <span className="tag tag--gold">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ profile, onUpdate, API, authHeader }) {
  const [form, setForm] = useState({
    username: profile?.username || "", email: profile?.email || "",
    firstName: profile?.firstName || "", lastName: profile?.lastName || "",
    bio: profile?.bio || "", isPublic: profile?.isPublic ?? true, showOnlineStatus: profile?.showOnlineStatus ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAvatarPick = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("avatar", file);
      await axios.post(`${API}/users/me/avatar`, fd, { headers: { ...authHeader.headers, "Content-Type": "multipart/form-data" } });
      onUpdate();
    } catch (e) { setError(e.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await axios.patch(`${API}/users/me`, form, authHeader);
      setSaved(true); onUpdate(); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const currentAvatar = avatarPreview || avSrc(profile);

  return (
    <>
      <div className="settings-card glass">
        <h3 className="card-title">Avatar</h3>
        <div className="avatar-section">
          <div className="avatar-preview-wrap">
            <AvatarImage src={currentAvatar} user={profile} className="avatar-preview-img" alt="Avatar" />
            {uploading && <div className="avatar-upload-overlay"><div className="settings-spinner sm" /></div>}
          </div>
          <div className="avatar-actions">
            <p className="font-mono text-muted" style={{ fontSize: 11, lineHeight: 1.7 }}>Square image · Max 4 MB<br />PNG · JPG · GIF · WebP</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarPick} />
            <button className="btn btn--ghost" style={{ fontSize: 10, marginTop: 12 }} onClick={() => fileRef.current?.click()}>UPLOAD NEW</button>
          </div>
        </div>
      </div>

      <div className="settings-card glass" style={{ marginTop: 20 }}>
        <h3 className="card-title">Basic Information</h3>
        <div className="form-row">
          <div className="form-group"><label className="form-label">FIRST NAME</label><input className="input" value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">LAST NAME</label><input className="input" value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">DISPLAY NAME</label><input className="input" value={form.username} onChange={e => set("username", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">EMAIL ADDRESS</label><input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">BIO</label><textarea className="input" rows={3} value={form.bio} onChange={e => set("bio", e.target.value)} style={{ resize: "vertical" }} /></div>
      </div>

      <div className="settings-card glass" style={{ marginTop: 20 }}>
        <h3 className="card-title">Visibility</h3>
        <div className="toggle-row">
          <div><div className="toggle-label">Public Profile</div><div className="toggle-desc">Others can find and view your profile.</div></div>
          <Toggle checked={form.isPublic} onChange={v => set("isPublic", v)} />
        </div>
        <hr className="divider" style={{ margin: "16px 0" }} />
        <div className="toggle-row">
          <div><div className="toggle-label">Show Online Status</div><div className="toggle-desc">Show a green dot when active.</div></div>
          <Toggle checked={form.showOnlineStatus} onChange={v => set("showOnlineStatus", v)} />
        </div>
      </div>

      {error && <div className="settings-error">{error}</div>}
      <div className="settings-actions">
        <button className="btn btn--ghost" style={{ fontSize: 11 }} onClick={() => onUpdate()}>DISCARD</button>
        <button className="save-btn btn btn--primary" style={{ fontSize: 11 }} onClick={handleSave} disabled={saving}>
          {saving ? "SAVING…" : saved ? "✓ SAVED" : "SAVE PROFILE"}
        </button>
      </div>
    </>
  );
}

function SecuritySection({ API, authHeader }) {
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [conf, setConf] = useState("");
  const [msg, setMsg] = useState(null); const [err, setErr] = useState(null); const [saving, setSaving] = useState(false);
  const submit = async () => {
    setErr(null); setMsg(null);
    if (next !== conf) { setErr("Passwords don't match"); return; }
    setSaving(true);
    try { await axios.post(`${API}/users/me/password`, { currentPassword: cur, newPassword: next }, authHeader); setMsg("Password updated!"); setCur(""); setNext(""); setConf(""); }
    catch (e) { setErr(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="settings-card glass">
      <h3 className="card-title">Security &amp; Privacy</h3>
      <p className="settings-hint font-mono">Passwords stored as bcrypt hashes — never plain text.</p>
      <div className="form-group" style={{ marginTop: 20 }}><label className="form-label">CURRENT PASSWORD</label><input className="input" type="password" value={cur} onChange={e => setCur(e.target.value)} placeholder="••••••••••" /></div>
      <div className="form-group"><label className="form-label">NEW PASSWORD</label><input className="input" type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="••••••••••" /></div>
      <div className="form-group"><label className="form-label">CONFIRM NEW PASSWORD</label><input className="input" type="password" value={conf} onChange={e => setConf(e.target.value)} placeholder="••••••••••" /></div>
      {err && <div className="settings-error">{err}</div>}
      {msg && <div className="settings-success">{msg}</div>}
      <button className="btn btn--primary" style={{ fontSize: 11, marginTop: 8 }} onClick={submit} disabled={saving}>{saving ? "UPDATING…" : "UPDATE PASSWORD"}</button>
    </div>
  );
}

function DisconnectSection({ logout, navigate }) {
  return (
    <div className="settings-card glass">
      <h3 className="card-title" style={{ color: "var(--pink)" }}>Danger Zone</h3>
      <p className="font-mono text-muted" style={{ fontSize: 12, lineHeight: 1.7 }}>Permanently delete your account. This action cannot be undone.</p>
      <div style={{ marginTop: 24 }}>
        <button className="btn btn--danger" style={{ fontSize: 11 }} onClick={() => { logout(); navigate("/", { replace: true }); }}>DELETE ACCOUNT</button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle" style={{ flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="toggle__track" /><div className="toggle__thumb" />
    </label>
  );
}
