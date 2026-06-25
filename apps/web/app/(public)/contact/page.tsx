"use client";
import { useState } from "react";

const RED  = "#DC143C";
const DARK = "#0A0A0A";

const SUBJECTS = [
  "General Enquiry",
  "I Want to Become a Vendor",
  "My Booking / Order Issue",
  "Payment & Billing",
  "Technical Problem",
  "Vendor Verification",
  "Report a Problem",
  "Other",
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    // Simulate submission — replace with real API call when backend is ready
    await new Promise(r => setTimeout(r, 1400));
    setStatus("sent");
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <style>{`
        /* ── Hero ── */
        .ct-hero          { position:relative; background:${DARK}; padding:80px 24px 72px; text-align:center; overflow:hidden; }
        .ct-hero-bg       { position:absolute; inset:0; background:url("https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1400&auto=format&fit=crop") center/cover no-repeat; opacity:.18; }
        .ct-hero-pill     { display:inline-block; background:rgba(220,20,60,.15); border:1px solid rgba(220,20,60,.35); color:${RED}; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:6px 16px; border-radius:20px; margin-bottom:20px; }
        .ct-hero h1       { font-size:clamp(32px,5vw,52px); font-weight:900; color:#fff; margin:0 0 16px; letter-spacing:-1px; }
        .ct-hero p        { font-size:clamp(15px,2vw,18px); color:rgba(255,255,255,.65); max-width:520px; margin:0 auto; line-height:1.7; }

        /* ── Info strip ── */
        .ct-strip         { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:0; background:#fff; border-bottom:1px solid #eaeaea; }
        .ct-strip-item    { display:flex; align-items:center; gap:14px; padding:24px 28px; border-right:1px solid #eaeaea; }
        .ct-strip-item:last-child { border-right:none; }
        .ct-strip-icon    { width:44px; height:44px; border-radius:10px; background:#fff1f2; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .ct-strip-label   { font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
        .ct-strip-val     { font-size:14px; font-weight:700; color:${DARK}; }

        /* ── Main content ── */
        .ct-body          { max-width:1100px; margin:0 auto; padding:64px 24px; display:grid; grid-template-columns:1fr 1.4fr; gap:48px; align-items:start; }

        /* ── Left: contact cards ── */
        .ct-left h2       { font-size:26px; font-weight:900; color:${DARK}; margin:0 0 8px; }
        .ct-left p        { font-size:14px; color:#71717A; line-height:1.7; margin:0 0 32px; }
        .ct-card          { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:22px 24px; margin-bottom:16px; display:flex; gap:16px; align-items:flex-start; transition:box-shadow .2s; }
        .ct-card:hover    { box-shadow:0 4px 20px rgba(0,0,0,.07); }
        .ct-card-icon     { width:48px; height:48px; border-radius:12px; background:${RED}; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .ct-card-title    { font-size:13px; font-weight:800; color:${DARK}; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px; }
        .ct-card-line     { font-size:14px; color:#374151; font-weight:500; line-height:1.6; }
        .ct-card-link     { color:${RED}; text-decoration:none; font-weight:700; }
        .ct-card-link:hover { text-decoration:underline; }

        /* Social row */
        .ct-social        { display:flex; gap:10px; margin-top:28px; }
        .ct-soc-btn       { width:40px; height:40px; border-radius:10px; border:1.5px solid #eaeaea; background:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; cursor:pointer; transition:all .15s; text-decoration:none; }
        .ct-soc-btn:hover { background:${RED}; border-color:${RED}; filter:grayscale(0) brightness(1.1); transform:translateY(-2px); }

        /* ── Right: form ── */
        .ct-form-card     { background:#fff; border:1.5px solid #eaeaea; border-radius:16px; padding:36px; }
        .ct-form-title    { font-size:22px; font-weight:900; color:${DARK}; margin:0 0 6px; }
        .ct-form-sub      { font-size:14px; color:#71717A; margin:0 0 28px; }
        .ct-row           { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .ct-group         { margin-bottom:18px; }
        .ct-label         { display:block; font-size:12px; font-weight:700; color:#374151; margin-bottom:6px; text-transform:uppercase; letter-spacing:.4px; }
        .ct-input         { width:100%; padding:13px 16px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; font-family:inherit; outline:none; box-sizing:border-box; background:#fafafa; transition:border-color .15s,background .15s; }
        .ct-input:focus   { border-color:${RED}; background:#fff; }
        .ct-textarea      { width:100%; padding:13px 16px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; font-family:inherit; outline:none; box-sizing:border-box; resize:vertical; min-height:130px; background:#fafafa; transition:border-color .15s,background .15s; }
        .ct-textarea:focus { border-color:${RED}; background:#fff; }
        .ct-select        { width:100%; padding:13px 16px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; font-family:inherit; outline:none; box-sizing:border-box; background:#fafafa; appearance:none; cursor:pointer; }
        .ct-select:focus  { border-color:${RED}; background:#fff; }
        .ct-submit        { width:100%; padding:15px; background:${RED}; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:800; cursor:pointer; font-family:inherit; letter-spacing:.3px; transition:opacity .15s,transform .1s; margin-top:8px; }
        .ct-submit:hover  { opacity:.9; }
        .ct-submit:active { transform:scale(.99); }
        .ct-submit:disabled { opacity:.6; cursor:not-allowed; }

        /* Success / error states */
        .ct-sent          { text-align:center; padding:40px 20px; }
        .ct-sent-icon     { font-size:56px; margin-bottom:16px; }
        .ct-sent h3       { font-size:22px; font-weight:900; color:${DARK}; margin:0 0 10px; }
        .ct-sent p        { font-size:14px; color:#71717A; line-height:1.7; margin:0; }

        /* ── FAQ ── */
        .ct-faq           { background:#f9fafb; border-top:1px solid #eaeaea; padding:72px 24px; }
        .ct-faq-inner     { max-width:760px; margin:0 auto; }
        .ct-faq h2        { font-size:clamp(24px,3.5vw,34px); font-weight:900; color:${DARK}; text-align:center; margin:0 0 10px; }
        .ct-faq-sub       { text-align:center; color:#71717A; font-size:15px; margin:0 0 40px; }
        .ct-faq-item      { border:1.5px solid #eaeaea; border-radius:12px; margin-bottom:10px; background:#fff; overflow:hidden; }
        .ct-faq-q         { width:100%; padding:20px 24px; background:none; border:none; text-align:left; font-size:15px; font-weight:700; color:${DARK}; cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-family:inherit; gap:12px; }
        .ct-faq-q:hover   { background:#fafafa; }
        .ct-faq-arrow     { font-size:12px; color:#9ca3af; transition:transform .2s; flex-shrink:0; }
        .ct-faq-a         { padding:0 24px 20px; font-size:14px; color:#4b5563; line-height:1.75; }

        /* ── CTA banner ── */
        .ct-cta           { background:${RED}; padding:64px 24px; text-align:center; }
        .ct-cta h2        { font-size:clamp(24px,3.5vw,36px); font-weight:900; color:#fff; margin:0 0 12px; }
        .ct-cta p         { font-size:16px; color:rgba(255,255,255,.75); margin:0 0 28px; }
        .ct-cta-btn       { display:inline-block; background:#fff; color:${RED}; padding:14px 32px; border-radius:10px; font-weight:800; font-size:15px; text-decoration:none; letter-spacing:.3px; }

        @media (max-width:900px) {
          .ct-body         { grid-template-columns:1fr; gap:32px; }
          .ct-strip        { grid-template-columns:1fr 1fr; }
        }
        @media (max-width:600px) {
          .ct-hero         { padding:60px 16px 52px; }
          .ct-body         { padding:40px 16px; }
          .ct-row          { grid-template-columns:1fr; }
          .ct-strip        { grid-template-columns:1fr; }
          .ct-strip-item   { border-right:none; border-bottom:1px solid #eaeaea; }
          .ct-strip-item:last-child { border-bottom:none; }
          .ct-form-card    { padding:24px 20px; }
          .ct-faq          { padding:48px 16px; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="ct-hero">
        <div className="ct-hero-bg" />
        <div style={{ position: "relative" }}>
          <div className="ct-hero-pill">Get In Touch</div>
          <h1>We're Here to Help</h1>
          <p>
            Whether you're a client with a booking question or a service provider needing support —
            our team is ready to assist you.
          </p>
        </div>
      </section>

      {/* ── INFO STRIP ── */}
      <div className="ct-strip">
        {[
          { icon: "📞", label: "Phone", val: "+27 10 123 4567" },
          { icon: "✉️", label: "Email", val: "support@kasifix.com" },
          { icon: "📍", label: "Location", val: "Johannesburg, South Africa" },
          { icon: "🕐", label: "Support Hours", val: "Mon–Fri  8am – 6pm" },
        ].map(item => (
          <div key={item.label} className="ct-strip-item">
            <div className="ct-strip-icon">{item.icon}</div>
            <div>
              <div className="ct-strip-label">{item.label}</div>
              <div className="ct-strip-val">{item.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN BODY ── */}
      <div className="ct-body">

        {/* Left: info */}
        <div>
          <h2>Contact Our Team</h2>
          <p>
            Have a question, complaint, or just want to say hello? Fill in the form or reach us
            directly through any of the channels below. We usually respond within 2 business hours.
          </p>

          {[
            {
              icon: "📞",
              title: "Call Us",
              lines: ["+27 10 123 4567", "Mon–Fri  8am – 6pm SAST"],
            },
            {
              icon: "✉️",
              title: "Email Support",
              lines: ["support@kasifix.com", "vendors@kasifix.com"],
              link: "mailto:support@kasifix.com",
            },
            {
              icon: "📍",
              title: "Office Address",
              lines: ["1 Sandton Drive, Sandton", "Johannesburg, 2196"],
            },
            {
              icon: "💬",
              title: "WhatsApp Business",
              lines: ["Chat with us on WhatsApp", "+27 82 000 0000"],
              link: "https://wa.me/27820000000",
              linkLabel: "Open WhatsApp →",
            },
          ].map(card => (
            <div key={card.title} className="ct-card">
              <div className="ct-card-icon">{card.icon}</div>
              <div>
                <div className="ct-card-title">{card.title}</div>
                {card.lines.map(l => (
                  <div key={l} className="ct-card-line">{l}</div>
                ))}
                {card.link && card.linkLabel && (
                  <a href={card.link} className="ct-card-link" style={{ display: "inline-block", marginTop: "6px", fontSize: "13px" }}>
                    {card.linkLabel}
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Social */}
          <div style={{ marginTop: "28px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "12px" }}>
              Follow Us
            </div>
            <div className="ct-social">
              {["🐦", "📘", "📸", "▶️"].map((icon, i) => (
                <a key={i} href="#" className="ct-soc-btn">{icon}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="ct-form-card">
          {status === "sent" ? (
            <div className="ct-sent">
              <div className="ct-sent-icon">✅</div>
              <h3>Message Received!</h3>
              <p>
                Thanks for reaching out. Our support team will get back to you at{" "}
                <strong>{form.email}</strong> within 2 business hours.
              </p>
              <button
                onClick={() => { setStatus("idle"); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                style={{ marginTop: "24px", padding: "12px 28px", background: RED, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <div className="ct-form-title">Send Us a Message</div>
              <div className="ct-form-sub">We read every message and respond quickly.</div>

              <form onSubmit={handleSubmit}>
                <div className="ct-row">
                  <div className="ct-group">
                    <label className="ct-label">Full Name *</label>
                    <input
                      className="ct-input"
                      placeholder="Thabo Nkosi"
                      value={form.name}
                      onChange={set("name")}
                      required
                    />
                  </div>
                  <div className="ct-group">
                    <label className="ct-label">Email Address *</label>
                    <input
                      className="ct-input"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={set("email")}
                      required
                    />
                  </div>
                </div>

                <div className="ct-group">
                  <label className="ct-label">Subject *</label>
                  <select className="ct-select" value={form.subject} onChange={set("subject")} required>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="ct-group">
                  <label className="ct-label">Your Message *</label>
                  <textarea
                    className="ct-textarea"
                    placeholder="Describe your question or issue in detail so we can help you faster..."
                    value={form.message}
                    onChange={set("message")}
                    required
                    minLength={20}
                  />
                </div>

                {status === "error" && (
                  <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
                    Something went wrong. Please try again.
                  </div>
                )}

                <button className="ct-submit" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send Message →"}
                </button>

                <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: "12px 0 0", lineHeight: 1.6 }}>
                  By submitting this form you agree to our{" "}
                  <a href="#" style={{ color: RED }}>Privacy Policy</a>.
                  We never share your data.
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      {/* ── FAQ ── */}
      <section className="ct-faq">
        <div className="ct-faq-inner">
          <h2>Frequently Asked Questions</h2>
          <p className="ct-faq-sub">Quick answers to the questions we get most often.</p>
          {[
            {
              q: "How long does it take to get a response?",
              a: "Our support team is available Monday to Friday, 8am–6pm SAST. We aim to respond to all messages within 2 business hours. For urgent matters, please call us directly.",
            },
            {
              q: "I'm a vendor — how do I get approved faster?",
              a: "Make sure your application is complete with all required documents, a valid phone number, and your bank details. Incomplete applications are placed in a longer review queue. Once submitted, approvals typically take 24–48 hours.",
            },
            {
              q: "There's a problem with my booking — what do I do?",
              a: "Select 'My Booking / Order Issue' in the subject dropdown and describe the problem in detail, including your booking ID if you have it. We'll investigate and follow up within the same business day.",
            },
            {
              q: "How do I report a vendor or a fraudulent listing?",
              a: "Choose 'Report a Problem' from the subject list and give us as much detail as possible. We take safety seriously and review all reports within 4 hours during business hours.",
            },
          ].map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="ct-cta">
        <h2>Ready to List Your Services?</h2>
        <p>Join hundreds of South African service providers already earning on kasiFix.</p>
        <a href="/apply" className="ct-cta-btn">Apply as a Vendor →</a>
      </section>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ct-faq-item">
      <button className="ct-faq-q" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span className="ct-faq-arrow" style={{ transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && <div className="ct-faq-a">{a}</div>}
    </div>
  );
}
