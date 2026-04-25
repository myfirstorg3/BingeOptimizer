import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",          label: "Dashboard",  short: "DASH" },
  { to: "/collection",label: "Collection", short: "COLL" },
  { to: "/tierlist",  label: "Tier List",  short: "TIER" },
  { to: "/search",    label: "Search",     short: "SRCH" },
  { to: "/settings",  label: "Settings",   short: "SETT" },
];

export default function Navbar() {
  const navRef = useRef(null);
  const logoRef = useRef(null);
  const linksRef = useRef(null);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(logoRef.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }
    ).fromTo(linksRef.current?.querySelectorAll(".nav-link"),
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: "power2.out" },
      "-=0.3"
    );
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={navRef} className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <NavLink to="/" className="navbar__logo" ref={logoRef}>
          <span className="logo-bracket">[</span>
          <span className="logo-text">BLASTOISE</span>
          <span className="logo-bracket">]</span>
          <span className="logo-dot" />
        </NavLink>

        {/* Links */}
        <nav ref={linksRef} className="navbar__links">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
            >
              <span className="nav-link__text">{link.label}</span>
              <span className="nav-link__underline" />
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="navbar__right">
          <div className="nav-status">
            <span className="status-dot" />
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-secondary)" }}>LIVE</span>
          </div>
          <button className="nav-connect btn btn--primary">
            CONNECT_
          </button>
        </div>
      </div>

      {/* Bottom line that shimmers */}
      <div className="navbar__line" />
    </header>
  );
}
