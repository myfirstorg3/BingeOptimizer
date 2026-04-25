import { useRef, useState } from "react";
import { gsap } from "gsap";

export default function Contact() {
  const formRef   = useRef(null);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    gsap.to(formRef.current, {
      opacity: 0, y: -12, duration: 0.3, ease: "power2.in",
      onComplete: () => setSent(true),
    });
  };

  return (
    <main className="page grid-bg">
      <div className="container section">

        {/* ── Header ── */}
        <div className="contact-header">
          <span className="tag tag--cyan">Contact</span>
          <h1 className="font-display contact-title">
            GET IN <span className="text-cyan glow-cyan">TOUCH</span>
          </h1>
          <p className="contact-sub text-secondary font-mono">
            // questions, feedback, or just vibing — we read everything
          </p>
        </div>

        <hr className="divider" style={{ margin: "48px 0" }} />

        <div className="contact-grid">

          {/* ── Form ── */}
          <div className="contact-form-wrap">
            {!sent ? (
              <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
                <div className="form-field">
                  <label className="form-label font-mono">Name</label>
                  <input
                    className="input"
                    name="name"
                    placeholder="your_name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label font-mono">Email</label>
                  <input
                    className="input"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label font-mono">Message</label>
                  <textarea
                    className="input contact-textarea"
                    name="message"
                    placeholder="what's on your mind..."
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn--primary">
                  Send Message →
                </button>
              </form>
            ) : (
              <div className="contact-success glass">
                <span className="contact-success__icon text-cyan font-display">✓</span>
                <p className="font-mono text-secondary">message transmitted.</p>
                <p className="font-mono" style={{ color: "var(--cyan)", fontSize: 13 }}>
                  we'll get back to you soon.
                </p>
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <aside className="contact-info">
            <div className="glass contact-info__card">
              <p className="font-mono contact-info__label text-muted">response time</p>
              <p className="font-mono contact-info__val text-cyan">≤ 48 hours</p>
            </div>
            <div className="glass contact-info__card">
              <p className="font-mono contact-info__label text-muted">email</p>
              <p className="font-mono contact-info__val" style={{ fontSize: 13 }}>
                hello@blastoise.app
              </p>
            </div>
            <div className="glass contact-info__card">
              <p className="font-mono contact-info__label text-muted">status</p>
              <p className="font-mono contact-info__val" style={{ color: "var(--green)" }}>
                ● online
              </p>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .contact-header { max-width: 640px; }
        .contact-title {
          font-size: clamp(56px, 8vw, 96px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          margin: 16px 0 12px;
        }
        .contact-sub { font-size: 12px; letter-spacing: 0.06em; }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 48px;
          align-items: start;
        }

        .contact-form { display: flex; flex-direction: column; gap: 24px; }
        .form-field   { display: flex; flex-direction: column; gap: 8px; }
        .form-label   {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .contact-textarea {
          resize: vertical;
          min-height: 160px;
          line-height: 1.7;
        }

        .contact-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 64px 40px;
          border-radius: var(--r-lg);
          text-align: center;
        }
        .contact-success__icon {
          font-size: 64px;
          line-height: 1;
        }

        .contact-info { display: flex; flex-direction: column; gap: 12px; }
        .contact-info__card {
          padding: 20px;
          border-radius: var(--r-md);
        }
        .contact-info__label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .contact-info__val { font-size: 15px; font-weight: 600; }

        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-info { flex-direction: row; flex-wrap: wrap; }
          .contact-info__card { flex: 1; min-width: 140px; }
        }
      `}</style>
    </main>
  );
}
