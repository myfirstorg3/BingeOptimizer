import { useRef } from "react";
import { Link } from "react-router-dom";

export default function Footer() {

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* ── Brand ── */}
        <div className="footer__brand">
          <span className="footer__logo font-display">BLAST<span className="text-cyan">OISE</span></span>
          <span className="footer__tagline font-mono">// binge smarter, not harder</span>
        </div>

        {/* ── Divider ── */}
        <hr className="divider footer__divider" />

        {/* ── Nav + Copy row ── */}
        <div className="footer__bottom">
          <p className="footer__copy font-mono">
            &copy; {new Date().getFullYear()} Blastoise — All rights reserved.
          </p>

          <nav className="footer__links">
            <Link to="/contact" className="footer__link font-mono">Contact</Link>
            <span className="footer__sep" aria-hidden="true" />
            <Link to="/members" className="footer__link font-mono">Members</Link>
            <span className="footer__sep" aria-hidden="true" />
            <Link to="/terms"   className="footer__link font-mono">Terms</Link>
            <span className="footer__sep" aria-hidden="true" />
            <Link
              to="/67"
              className="footer__link footer__67 font-mono text-cyan glow-cyan"
            >
              67
            </Link>
          </nav>
        </div>

      </div>
    </footer>
  );
}
