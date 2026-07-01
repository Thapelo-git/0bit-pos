"use client";
import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const STATS = [
  { val: "500+",  label: "Active Vendors" },
  { val: "10K+",  label: "Monthly Clients" },
  { val: "R5M+",  label: "Paid Out to Date" },
  { val: "48hr",  label: "Avg Approval Time" },
];

const BENEFITS = [
  {
    icon: "📣",
    title: "Reach New Clients",
    desc: "Get discovered by thousands of buyers actively searching for services near them — no marketing budget needed.",
  },
  {
    icon: "💳",
    title: "Get Paid Reliably",
    desc: "Bookings come with secured payments. We handle the flow — you focus on delivering great service.",
  },
  {
    icon: "📊",
    title: "Track Your Growth",
    desc: "Monitor views, bookings, and revenue from your personal vendor dashboard in real time.",
  },
  {
    icon: "🛡",
    title: "Build Credibility",
    desc: "Get verified badges and collect client reviews to stand out and earn trust in your community.",
  },
];

const TESTIMONIALS = [
  {
    name:  "Thandi M.",
    biz:   "Thandi's Cleaning Co.",
    city:  "Soweto, JHB",
    quote: "Within my first month on kasiFix I had 14 new bookings. I can't believe I wasn't on here sooner!",
    avatar: "T",
    color:  "#0ea5e9",
  },
  {
    name:  "Sipho D.",
    biz:   "FitLife Coaching",
    city:  "Khayelitsha, Cape Town",
    quote: "The dashboard makes tracking revenue so easy. kasiFix is built for people like us — real businesses.",
    avatar: "S",
    color:  "#8b5cf6",
  },
  {
    name:  "Nomsa K.",
    biz:   "NK Beauty & Nails",
    city:  "Umlazi, Durban",
    quote: "Clients find me without me even advertising. Listing is free and the approval was fast.",
    avatar: "N",
    color:  RED,
  },
];

const STEPS = [
  { n: "01", icon: "✍️", label: "Apply Online",    desc: "Complete the form below — it takes less than 5 minutes." },
  { n: "02", icon: "🔍", label: "Team Review",     desc: "Our team reviews every application within 24–48 hours." },
  { n: "03", icon: "🚀", label: "Go Live & Earn",  desc: "Once approved, list services and start receiving bookings." },
];

const NEED_LIST = [
  "Your full name and valid email address",
  "Business / trading name",
  "South African phone number",
  "City or township you operate in",
  "Brief description of your services",
  "Banking details for payouts (encrypted)",
];

const CATEGORIES = [
  "Home Cleaning",
  "Fitness & Wellness",
  "Beauty & Grooming",
  "Home Maintenance & Trades",
  "Professional Training & Coaching",
  "Other Local Services",
];

const CAT_ICONS: Record<string, string> = {
  "Home Cleaning":                    "🧹",
  "Fitness & Wellness":               "🏋️",
  "Beauty & Grooming":               "💅",
  "Home Maintenance & Trades":        "🔧",
  "Professional Training & Coaching": "🎓",
  "Other Local Services":             "🌍",
};

const FAQ = [
  { q: "Is it free to list on kasiFix?",      a: "Yes — creating an account and listing your first service is completely free." },
  { q: "How long does approval take?",          a: "Most applications are reviewed within 24–48 hours. You will be notified by email." },
  { q: "How do I receive payments?",            a: "Once approved, payouts are made to your linked bank account after each completed booking." },
  { q: "Can I list multiple services?",         a: "Absolutely. You can add as many services as you offer from your vendor dashboard." },
];

type Step = "info" | "business" | "done";

export default function ApplyPage() {
  const [step, setStep] = useState<Step>("info");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [firstName,      setFirstName]      = useState("");
  const [lastName,       setLastName]       = useState("");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [businessName,   setBusinessName]   = useState("");
  const [phone,          setPhone]          = useState("");
  const [locationText,   setLocationText]   = useState("");
  const [category,       setCategory]       = useState(CATEGORIES[0]);
  const [servicesOffered,setServicesOffered]= useState("");
  const [bankDetails,    setBankDetails]    = useState("");

  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPass,   setShowPass]   = useState(false);

  const goToBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firstName || !email || !password) { setError("Please fill in all required fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setStep("business");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!businessName || !phone || !locationText || !servicesOffered || !bankDetails) {
      setError("Please fill in all required business fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/vendors/signup`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email, password,
          businessName, phone, locationText,
          servicesOffered: `[${category}] ${servicesOffered}`,
          bankDetails,
          proofDocs: "Submitted via web application form",
          firstName, lastName,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setStep("done");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(data.message || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setSubmitting(false);
  };

  return (
    <>
      <style>{`
        /* ── RESET ── */
        * { box-sizing:border-box; }

        /* ── HERO ── */
        .ap-hero {
          position:relative; border-radius:16px; overflow:hidden; margin-bottom:0;
          min-height:420px; display:flex; align-items:center;
        }
        .ap-hero-bg {
          position:absolute; inset:0;
          background-image:url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1470&auto=format&fit=crop);
          background-size:cover; background-position:center 30%;
        }
        .ap-hero-ov {
          position:absolute; inset:0;
          background:linear-gradient(110deg,rgba(10,10,10,.7) 0%,rgba(10,10,10,.3) 55%,rgba(220,20,60,.1) 100%);
        }
        .ap-hero-body { position:relative; z-index:1; padding:60px 48px; max-width:600px; }
        .ap-tag       { display:inline-block; background:${RED}; color:#fff; padding:5px 14px; border-radius:4px; font-size:11px; font-weight:800; letter-spacing:1.2px; margin-bottom:20px; }
        .ap-h1        { color:#fff; font-size:clamp(30px,4.5vw,52px); font-weight:900; margin:0 0 16px; line-height:1.05; }
        .ap-sub       { color:rgba(255,255,255,.8); font-size:16px; margin:0 0 30px; line-height:1.7; max-width:460px; }
        .ap-hero-cta  {
          display:inline-block; background:#fff; color:${RED}; padding:14px 32px;
          border-radius:8px; font-weight:800; font-size:15px; text-decoration:none; margin-right:12px;
        }
        .ap-hero-cta2 {
          display:inline-block; border:2px solid rgba(255,255,255,.4); color:#fff; padding:13px 24px;
          border-radius:8px; font-weight:700; font-size:14px; text-decoration:none;
        }
        .ap-hero-btns { display:flex; flex-wrap:wrap; gap:12px; }

        /* ── STAT STRIP ── */
        .ap-stats {
          display:grid; grid-template-columns:repeat(4,1fr);
          background:#0A0A0A; border-radius:0 0 16px 16px;
          margin-bottom:48px; overflow:hidden;
        }
        .ap-stat {
          padding:22px 20px; text-align:center; border-right:1px solid rgba(255,255,255,.08);
          transition:background .2s;
        }
        .ap-stat:last-child { border-right:none; }
        .ap-stat-val   { font-size:28px; font-weight:900; color:${RED}; }
        .ap-stat-label { font-size:12px; color:rgba(255,255,255,.5); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }

        /* ── SECTION LABEL ── */
        .ap-section-label { font-size:11px; font-weight:800; letter-spacing:1.5px; color:${RED}; text-transform:uppercase; margin-bottom:10px; }
        .ap-section-title { font-size:24px; font-weight:900; color:#0A0A0A; margin:0 0 8px; }
        .ap-section-sub   { font-size:14px; color:#71717A; margin:0 0 32px; line-height:1.65; }

        /* ── BENEFITS ── */
        .benefits-grid {
          display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:18px; margin-bottom:56px;
        }
        .benefit-card {
          background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px;
          transition:box-shadow .2s, transform .2s;
        }
        .benefit-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.08); transform:translateY(-2px); }
        .benefit-icon  { font-size:30px; margin-bottom:14px; display:block; }
        .benefit-title { font-weight:800; font-size:15px; color:#0A0A0A; margin-bottom:8px; }
        .benefit-desc  { font-size:13px; color:#71717A; line-height:1.65; margin:0; }

        /* ── HOW IT WORKS ── */
        .steps-row    { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-bottom:56px; }
        .step-card    { background:#f9fafb; border-radius:14px; padding:28px 24px; position:relative; }
        .step-num-bg  { position:absolute; top:16px; right:16px; font-size:48px; font-weight:900; color:rgba(220,20,60,.06); line-height:1; }
        .step-icon    { font-size:28px; margin-bottom:14px; }
        .step-label   { font-size:16px; font-weight:800; color:#0A0A0A; margin-bottom:8px; }
        .step-desc    { font-size:13px; color:#71717A; line-height:1.65; margin:0; }
        .step-n       { display:inline-block; background:${RED}; color:#fff; font-size:11px; font-weight:800; padding:3px 8px; border-radius:4px; margin-bottom:12px; letter-spacing:.5px; }

        /* ── CATEGORY PILLS ── */
        .cat-pills      { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:56px; }
        .cat-pill       { display:flex; align-items:center; gap:8px; background:#fff; border:1.5px solid #eaeaea; border-radius:30px; padding:10px 18px; font-size:13px; font-weight:600; color:#0A0A0A; }
        .cat-pill-icon  { font-size:18px; }

        /* ── TESTIMONIALS ── */
        .testi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:18px; margin-bottom:56px; }
        .testi-card { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px; }
        .testi-quote { font-size:14px; color:#374151; line-height:1.7; margin:0 0 20px; font-style:italic; }
        .testi-meta  { display:flex; align-items:center; gap:12px; }
        .testi-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:16px; flex-shrink:0; }
        .testi-name  { font-weight:800; font-size:14px; color:#0A0A0A; margin-bottom:2px; }
        .testi-biz   { font-size:12px; color:#71717A; }

        /* ── FORM LAYOUT ── */
        .apply-layout  { display:grid; grid-template-columns:1fr 340px; gap:28px; align-items:start; margin-bottom:56px; }

        /* Form card */
        .form-card     { border-radius:16px; overflow:hidden; border:1.5px solid #eaeaea; background:#fff; }
        .form-card-hdr { display:grid; grid-template-columns:auto 1fr; }
        .form-hdr-side { background:${RED}; padding:24px 22px; display:flex; flex-direction:column; justify-content:space-between; }
        .form-hdr-logo { font-size:22px; font-weight:900; color:#fff; letter-spacing:-0.5px; }
        .form-hdr-step { color:rgba(255,255,255,.7); font-size:11px; font-weight:700; margin-top:auto; text-transform:uppercase; letter-spacing:1px; }
        .form-hdr-main { background:#0A0A0A; padding:20px 24px; display:flex; flex-direction:column; justify-content:center; }
        .form-hdr-h3   { color:#fff; font-size:17px; font-weight:800; margin:0 0 4px; }
        .form-hdr-sub  { color:rgba(255,255,255,.45); font-size:13px; margin:0; }
        .form-card-body { padding:28px; }

        /* Progress dots */
        .form-prog { display:flex; gap:8px; margin-bottom:24px; align-items:center; }
        .prog-dot  { width:10px; height:10px; border-radius:50%; background:#eaeaea; transition:background .2s; }
        .prog-dot.on { background:${RED}; width:28px; border-radius:5px; }
        .prog-label { margin-left:8px; font-size:12px; color:#71717A; font-weight:600; }

        /* Field */
        .field-grp    { margin-bottom:18px; }
        .field-label  { display:block; font-size:13px; font-weight:700; color:#1a1a1a; margin-bottom:7px; }
        .field-req    { color:${RED}; }
        .field-input  { width:100%; padding:12px 14px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:14px; outline:none; transition:border-color .15s; font-family:inherit; background:#fff; }
        .field-input:focus { border-color:${RED}; box-shadow:0 0 0 3px rgba(220,20,60,.08); }
        .field-hint   { font-size:12px; color:#9ca3af; margin:6px 0 0; line-height:1.5; }
        .form-row2    { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .pass-wrap    { position:relative; }
        .pass-toggle  { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:13px; color:#9ca3af; padding:0; }

        .apply-alert  { padding:12px 14px; border-radius:8px; font-size:13px; font-weight:600; margin-bottom:16px; background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }
        .apply-btn    { width:100%; padding:14px; background:${RED}; color:#fff; border:none; border-radius:8px; font-weight:800; font-size:15px; cursor:pointer; font-family:inherit; transition:opacity .2s; }
        .apply-btn:hover:not(:disabled) { opacity:.88; }
        .apply-btn:disabled { opacity:.6; cursor:not-allowed; }
        .apply-btn-back { width:100%; padding:13px; background:#f9fafb; color:#374151; border:1.5px solid #e5e7eb; border-radius:8px; font-weight:700; font-size:14px; cursor:pointer; margin-bottom:12px; font-family:inherit; }

        /* Side panel */
        .ap-side        { background:#0A0A0A; border-radius:16px; padding:28px; position:sticky; top:88px; }
        .ap-side-h3     { color:#fff; font-size:16px; font-weight:800; margin:0 0 22px; }
        .ap-side-item   { display:flex; gap:12px; margin-bottom:20px; }
        .ap-side-icon   { font-size:20px; flex-shrink:0; }
        .ap-side-text   { font-size:13px; color:rgba(255,255,255,.6); line-height:1.6; }
        .ap-side-text strong { color:#fff; display:block; margin-bottom:2px; font-size:14px; }
        .ap-side-need   { margin-top:24px; padding:16px; background:rgba(220,20,60,.1); border:1px solid rgba(220,20,60,.25); border-radius:10px; }
        .ap-side-need p { color:rgba(255,255,255,.75); font-size:13px; margin:0 0 10px; font-weight:700; }
        .ap-need-item   { display:flex; align-items:flex-start; gap:8px; font-size:12px; color:rgba(255,255,255,.55); margin-bottom:7px; line-height:1.5; }
        .ap-need-item::before { content:"✓"; color:${RED}; font-weight:900; flex-shrink:0; }
        .ap-side-div    { border-top:1px solid rgba(255,255,255,.06); margin:22px 0 18px; }
        .ap-side-login  { color:rgba(255,255,255,.45); font-size:12px; }

        /* ── FAQ ── */
        .faq-list { border:1.5px solid #eaeaea; border-radius:14px; overflow:hidden; margin-bottom:56px; }
        .faq-item { border-bottom:1px solid #f1f5f9; }
        .faq-item:last-child { border-bottom:none; }
        .faq-q    { width:100%; background:none; border:none; text-align:left; padding:18px 20px; font-size:14px; font-weight:700; color:#0A0A0A; cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-family:inherit; }
        .faq-q:hover { background:#fafafa; }
        .faq-icon { color:${RED}; font-size:18px; font-weight:400; transition:transform .2s; }
        .faq-a    { padding:0 20px 18px; font-size:13px; color:#71717A; line-height:1.7; }

        /* ── BOTTOM CTA ── */
        .ap-bottom-cta { background:linear-gradient(135deg,#0A0A0A 0%,#1a0505 100%); border-radius:16px; padding:48px; text-align:center; margin-bottom:8px; }
        .ap-bc-tag { display:inline-block; background:rgba(220,20,60,.15); border:1px solid rgba(220,20,60,.3); color:${RED}; padding:5px 16px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:1px; margin-bottom:18px; }
        .ap-bc-h2  { color:#fff; font-size:28px; font-weight:900; margin:0 0 12px; }
        .ap-bc-p   { color:rgba(255,255,255,.55); font-size:14px; margin:0 0 28px; line-height:1.7; max-width:480px; margin-left:auto; margin-right:auto; }
        .ap-bc-btn { display:inline-block; background:${RED}; color:#fff; padding:15px 36px; border-radius:8px; font-weight:800; font-size:15px; text-decoration:none; }

        /* ── SUCCESS ── */
        .ap-success-wrap { display:flex; align-items:center; justify-content:center; min-height:60vh; }
        .ap-success      { background:#fff; border-radius:20px; border:1.5px solid #eaeaea; padding:60px 40px; text-align:center; max-width:500px; width:100%; }
        .success-check   { width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,${RED},#ff4d6d); display:flex; align-items:center; justify-content:center; margin:0 auto 24px; font-size:32px; }
        .success-h2      { font-size:26px; font-weight:900; color:#0A0A0A; margin:0 0 12px; }
        .success-p       { font-size:15px; color:#71717A; line-height:1.7; max-width:380px; margin:0 auto 28px; }
        .success-timeline { display:flex; flex-direction:column; gap:12px; margin-bottom:28px; text-align:left; }
        .success-tl-item { display:flex; gap:12px; align-items:flex-start; }
        .success-tl-dot  { width:24px; height:24px; border-radius:50%; background:${RED}; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .success-tl-text { font-size:13px; color:#374151; line-height:1.6; }
        .success-tl-text strong { color:#0A0A0A; display:block; }
        .success-btns    { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }

        /* ── RESPONSIVE ── */
        @media (max-width:900px) {
          .apply-layout  { grid-template-columns:1fr; }
          .ap-side        { position:static; order:-1; }
          .steps-row      { grid-template-columns:1fr; gap:12px; }
          .ap-stats       { grid-template-columns:1fr 1fr; }
          .ap-stats .ap-stat:nth-child(2) { border-right:none; }
        }
        @media (max-width:640px) {
          .ap-hero-body  { padding:36px 20px; }
          .form-card-body{ padding:20px; }
          .form-row2     { grid-template-columns:1fr; }
          .benefits-grid { grid-template-columns:1fr 1fr; }
          .testi-grid    { grid-template-columns:1fr; }
          .ap-bottom-cta { padding:36px 20px; }
          .ap-success    { padding:40px 20px; }
          .form-hdr-side { display:none; }
        }
        @media (max-width:420px) {
          .benefits-grid { grid-template-columns:1fr; }
          .ap-stats      { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════
          SUCCESS SCREEN
      ══════════════════════════════════════════════════ */}
      {step === "done" && (
        <div className="ap-success-wrap">
          <div className="ap-success">
            <div className="success-check">✓</div>
            <h2 className="success-h2">Application Received!</h2>
            <p className="success-p">
              Thank you for applying to sell on kasiFix. Our team reviews every application
              personally — you&apos;ll hear from us within <strong>24–48 hours</strong>.
            </p>
            <div className="success-timeline">
              {[
                { step:"1", title:"Application Submitted", text:"We've received your details and will begin reviewing shortly." },
                { step:"2", title:"Team Review (24–48 hrs)", text:"Our team will verify your information and contact you by email." },
                { step:"3", title:"Go Live & Start Earning", text:"Once approved, log in to list services and receive your first booking." },
              ].map(t => (
                <div key={t.step} className="success-tl-item">
                  <div className="success-tl-dot">{t.step}</div>
                  <div className="success-tl-text"><strong>{t.title}</strong>{t.text}</div>
                </div>
              ))}
            </div>
            <div className="success-btns">
              <Link href="/login" style={{ display:"inline-block", background:RED, color:"#fff", padding:"13px 28px", borderRadius:"8px", fontWeight:800, textDecoration:"none", fontSize:"14px" }}>
                Sign In to Your Account →
              </Link>
              <Link href="/" style={{ display:"inline-block", border:"1.5px solid #e5e7eb", color:"#374151", padding:"12px 20px", borderRadius:"8px", fontWeight:700, textDecoration:"none", fontSize:"14px" }}>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}

      {step !== "done" && (
        <>
          {/* ══════════════════════════════════════════════════
              HERO
          ══════════════════════════════════════════════════ */}
          <div className="ap-hero">
            <div className="ap-hero-bg" />
            <div className="ap-hero-ov" />
            <div className="ap-hero-body">
              <span className="ap-tag">FOR SERVICE PROVIDERS · SOUTH AFRICA</span>
              <h1 className="ap-h1">Grow Your Business.<br />Reach More Clients.</h1>
              <p className="ap-sub">
                Join thousands of South African entrepreneurs listing services, getting booked,
                and earning more — on a marketplace built for kasi businesses.
              </p>
              <div className="ap-hero-btns">
                <a href="#apply-form" className="ap-hero-cta">Apply Free — 5 Minutes →</a>
                <Link href="/services" className="ap-hero-cta2">Browse the Market</Link>
              </div>
            </div>
          </div>

          {/* ── STATS STRIP ── */}
          <div className="ap-stats">
            {STATS.map(s => (
              <div key={s.label} className="ap-stat">
                <div className="ap-stat-val">{s.val}</div>
                <div className="ap-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════
              WHY JOIN
          ══════════════════════════════════════════════════ */}
          <div style={{ margin: "56px 0 0" }}>
            <div className="ap-section-label">Why kasiFix</div>
            <div className="ap-section-title">Everything You Need to Run Your Business</div>
            <p className="ap-section-sub">
              We handle discovery, payments, and trust — so you can focus on what you do best.
            </p>
          </div>
          <div className="benefits-grid">
            {BENEFITS.map(b => (
              <div key={b.title} className="benefit-card">
                <span className="benefit-icon">{b.icon}</span>
                <div className="benefit-title">{b.title}</div>
                <p className="benefit-desc">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════
              CATEGORIES
          ══════════════════════════════════════════════════ */}
          <div className="ap-section-label">Available Categories</div>
          <div className="ap-section-title" style={{ marginBottom: "20px" }}>Which Category Do You Fall Under?</div>
          <div className="cat-pills">
            {CATEGORIES.map(c => (
              <div key={c} className="cat-pill">
                <span className="cat-pill-icon">{CAT_ICONS[c]}</span>
                {c}
              </div>
            ))}
            <div className="cat-pill" style={{ background: "rgba(220,20,60,.05)", borderColor: "rgba(220,20,60,.2)", color: RED }}>
              + More coming soon
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              HOW IT WORKS
          ══════════════════════════════════════════════════ */}
          <div className="ap-section-label">The Process</div>
          <div className="ap-section-title" style={{ marginBottom: "28px" }}>How It Works</div>
          <div className="steps-row">
            {STEPS.map(s => (
              <div key={s.n} className="step-card">
                <div className="step-num-bg">{s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <span className="step-n">Step {s.n}</span>
                <div className="step-label">{s.label}</div>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════
              TESTIMONIALS
          ══════════════════════════════════════════════════ */}
          <div className="ap-section-label">Vendor Stories</div>
          <div className="ap-section-title" style={{ marginBottom: "28px" }}>Hear From Other Vendors</div>
          <div className="testi-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testi-card">
                <p className="testi-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testi-meta">
                  <div className="testi-avatar" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-biz">{t.biz} · {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════
              APPLICATION FORM
          ══════════════════════════════════════════════════ */}
          <div id="apply-form" className="ap-section-label">Vendor Application</div>
          <div className="ap-section-title" style={{ marginBottom: "8px" }}>Apply to Sell on kasiFix</div>
          <p className="ap-section-sub">Complete the form below — approvals typically take 24–48 hours.</p>

          <div className="apply-layout">
            {/* Form card */}
            <div className="form-card">
              <div className="form-card-hdr">
                <div className="form-hdr-side">
                  <div className="form-hdr-logo">kasi<span style={{ color:"rgba(255,255,255,.45)" }}>Fix</span></div>
                  <div className="form-hdr-step">{step === "info" ? "Step 1 of 2" : "Step 2 of 2"}</div>
                </div>
                <div className="form-hdr-main">
                  <h3 className="form-hdr-h3">
                    {step === "info" ? "Personal Details" : "Business Details"}
                  </h3>
                  <p className="form-hdr-sub">
                    {step === "info" ? "Tell us a bit about yourself" : "Tell us about your business and services"}
                  </p>
                </div>
              </div>

              <div className="form-card-body">
                {/* Progress */}
                <div className="form-prog">
                  <div className="prog-dot on" />
                  <div className={`prog-dot${step === "business" ? " on" : ""}`} />
                  <span className="prog-label">{step === "info" ? "Personal info" : "Business info"}</span>
                </div>

                {error && <div className="apply-alert">⚠️ {error}</div>}

                {/* ── STEP 1 ── */}
                {step === "info" && (
                  <form onSubmit={goToBusiness}>
                    <div className="form-row2">
                      <div className="field-grp">
                        <label className="field-label">First Name <span className="field-req">*</span></label>
                        <input className="field-input" type="text" placeholder="Thabo" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                      </div>
                      <div className="field-grp">
                        <label className="field-label">Last Name</label>
                        <input className="field-input" type="text" placeholder="Nkosi" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="field-grp">
                      <label className="field-label">Email Address <span className="field-req">*</span></label>
                      <input className="field-input" type="email" placeholder="thabo@example.co.za" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="field-grp">
                      <label className="field-label">Create a Password <span className="field-req">*</span></label>
                      <div className="pass-wrap">
                        <input
                          className="field-input"
                          type={showPass ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          style={{ paddingRight: "44px" }}
                          required
                        />
                        <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                          {showPass ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p className="field-hint">Use at least 8 characters with a mix of letters and numbers.</p>
                    </div>
                    <button type="submit" className="apply-btn">Continue to Business Details →</button>
                    <p style={{ textAlign:"center", marginTop:"16px", fontSize:"13px", color:"#71717A" }}>
                      Already have an account?{" "}
                      <Link href="/login" style={{ color:RED, fontWeight:700, textDecoration:"none" }}>Sign In</Link>
                    </p>
                  </form>
                )}

                {/* ── STEP 2 ── */}
                {step === "business" && (
                  <form onSubmit={handleSubmit}>
                    <div className="field-grp">
                      <label className="field-label">Business / Trading Name <span className="field-req">*</span></label>
                      <input className="field-input" type="text" placeholder="e.g. Nkosi Cleaning Services" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
                    </div>
                    <div className="form-row2">
                      <div className="field-grp">
                        <label className="field-label">Business Phone <span className="field-req">*</span></label>
                        <input className="field-input" type="tel" placeholder="071 234 5678" value={phone} onChange={e => setPhone(e.target.value)} required />
                      </div>
                      <div className="field-grp">
                        <label className="field-label">City / Township <span className="field-req">*</span></label>
                        <input className="field-input" type="text" placeholder="Soweto, Johannesburg" value={locationText} onChange={e => setLocationText(e.target.value)} required />
                      </div>
                    </div>
                    <div className="field-grp">
                      <label className="field-label">Primary Service Category <span className="field-req">*</span></label>
                      <select className="field-input" value={category} onChange={e => setCategory(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                      </select>
                    </div>
                    <div className="field-grp">
                      <label className="field-label">Describe Your Services <span className="field-req">*</span></label>
                      <textarea
                        className="field-input"
                        style={{ minHeight: "88px", resize: "vertical" }}
                        placeholder="e.g. Full home deep clean, office cleaning, move-in/out cleaning. Serving Johannesburg and Soweto areas."
                        value={servicesOffered}
                        onChange={e => setServicesOffered(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field-grp">
                      <label className="field-label">Banking Details <span className="field-req">*</span></label>
                      <input className="field-input" type="text" placeholder="e.g. FNB – Savings – 62XXXXXXXX" value={bankDetails} onChange={e => setBankDetails(e.target.value)} required />
                      <p className="field-hint">🔒 Your banking details are encrypted and only used for payouts.</p>
                    </div>
                    <button type="submit" className="apply-btn" disabled={submitting} style={{ marginBottom: "10px" }}>
                      {submitting ? "Submitting Application..." : "Submit Application →"}
                    </button>
                    <button type="button" className="apply-btn-back" onClick={() => { setStep("info"); setError(""); }}>
                      ← Back
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ── Side panel ── */}
            <aside className="ap-side">
              <h3 className="ap-side-h3">What Happens Next?</h3>
              {[
                { icon:"📋", title:"Application Review",  text:"Our team personally reviews every application to maintain quality. Takes 24–48 hrs." },
                { icon:"📧", title:"Email Notification",  text:"You'll receive an email with your approval status and a link to your vendor dashboard." },
                { icon:"🚀", title:"List Services & Earn",text:"Once approved, add services, set your prices, and start receiving bookings instantly." },
              ].map(item => (
                <div key={item.title} className="ap-side-item">
                  <span className="ap-side-icon">{item.icon}</span>
                  <div className="ap-side-text">
                    <strong>{item.title}</strong>
                    {item.text}
                  </div>
                </div>
              ))}

              <div className="ap-side-need">
                <p>What you&apos;ll need to apply:</p>
                {NEED_LIST.map(n => (
                  <div key={n} className="ap-need-item">{n}</div>
                ))}
              </div>

              <div className="ap-side-div" />
              <div className="ap-side-login">
                Already applied?{" "}
                <Link href="/login" style={{ color: RED, fontWeight: 700, textDecoration: "none" }}>Sign in here →</Link>
              </div>
            </aside>
          </div>

          {/* ══════════════════════════════════════════════════
              FAQ
          ══════════════════════════════════════════════════ */}
          <div className="ap-section-label">Got Questions?</div>
          <div className="ap-section-title" style={{ marginBottom: "24px" }}>Frequently Asked Questions</div>
          <div className="faq-list">
            {FAQ.map((f, i) => (
              <div key={i} className="faq-item">
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="faq-icon" style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════
              BOTTOM CTA
          ══════════════════════════════════════════════════ */}
          <div className="ap-bottom-cta">
            <div className="ap-bc-tag">READY TO START?</div>
            <h2 className="ap-bc-h2">Your Next Client Is Already Searching</h2>
            <p className="ap-bc-p">
              Don&apos;t let them find someone else first. Apply in 5 minutes and start building
              your client base on South Africa&apos;s fastest-growing service marketplace.
            </p>
            <a href="#apply-form" className="ap-bc-btn">Apply Now — It&apos;s Free →</a>
          </div>
        </>
      )}
    </>
  );
}
