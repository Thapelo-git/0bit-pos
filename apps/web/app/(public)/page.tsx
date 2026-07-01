"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Star, Shield, Phone, Lock, MessageCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const SLIDER_ITEMS = [
  { category: "Home Cleaning",                    badge: "TRENDING DEAL",    sub: "Find a pro today",          img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1470&auto=format&fit=crop",  accent: RED },
  { category: "Beauty & Grooming",               badge: "BEAUTY & GROOMING", sub: "Book your stylist",         img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1470&auto=format&fit=crop",  accent: "#1a1a2e" },
  { category: "Fitness & Wellness",               badge: "WELLNESS",          sub: "Start your journey",        img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop",  accent: RED },
  { category: "Home Maintenance & Trades",        badge: "HIRE A PRO",        sub: "Fix it fast",               img: "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=1470&auto=format&fit=crop",  accent: "#0A0A0A" },
  { category: "Professional Training & Coaching", badge: "COACHING",          sub: "Learn from experts",        img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1470&auto=format&fit=crop",  accent: "#1a0a0a" },
  { category: "Other Local Services",             badge: "LOCAL SERVICES",    sub: "Explore what's near you",   img: "https://images.unsplash.com/photo-1444653389962-81492d1136b8?q=80&w=1470&auto=format&fit=crop",  accent: "#0A0A0A" },
];

const TESTIMONIALS = [
  { text: "I found an amazing cleaner through kasiFix. She was on time, thorough, and my house has never looked better. I feel safe booking because of the verification badges.", name: "Naledi M.", location: "Soweto, GP" },
  { text: "As someone new to Johannesburg, I was worried about finding trustworthy tradespeople. kasiFix's verification system gave me the confidence to book without hesitation.", name: "Thabo K.", location: "Sandton, GP" },
  { text: "The reviews on kasiFix are genuine — I checked three providers, read their reviews, and booked the highest-rated one. Got exactly what I expected. Will use again!", name: "Ayanda D.", location: "Cape Town, WC" },
];

function TrustSection() {
  return (
    <div className="trust-section">
      <div className="trust-header">
        <div className="trust-label">WHY TRUST KASIFIX</div>
        <h2 className="trust-title">Built on Trust, Powered by<br /><span style={{ color: "#DC143C" }}>African Excellence</span></h2>
        <p className="trust-sub">Every provider on kasiFix is vetted, background-checked, and rated by real customers — so you always know who you&apos;re inviting into your home or business.</p>
      </div>

      <div className="trust-stats">
        {[
          { num: "5 000+", label: "Verified Providers" },
          { num: "50 000+", label: "Bookings Completed" },
          { num: "4.8★",   label: "Average Rating" },
          { num: "9 Provinces", label: "Nationwide Coverage" },
        ].map(s => (
          <div key={s.label} className="trust-stat">
            <div className="trust-stat-num">{s.num}</div>
            <div className="trust-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="trust-grid">
        {[
          { icon: <CheckCircle2 size={32} color="#DC143C"/>, title: "Verified Businesses", desc: "Every listed vendor undergoes ID, credential, and business registration verification before going live." },
          { icon: <Star size={32} color="#DC143C"/>, title: "Real Customer Reviews", desc: "Only confirmed customers can leave reviews — no fake ratings. Star scores reflect genuine experiences." },
          { icon: <Shield size={32} color="#DC143C"/>, title: "Secure Bookings", desc: "Your bookings and payments are protected. Dispute resolution is built in if something goes wrong." },
          { icon: <Phone size={32} color="#DC143C"/>, title: "Responsive Support", desc: "Our team is reachable 7 days a week to help with any booking issues or provider concerns." },
          { icon: <Lock size={32} color="#DC143C"/>, title: "Background Checked", desc: "High-trust categories (home access, childcare, medical) require enhanced background screening." },
          { icon: <MessageCircle size={32} color="#DC143C"/>, title: "Satisfaction Guarantee", desc: "Not happy? We offer free rebooking or a full refund for services that don&apos;t meet your expectations." },
        ].map(c => (
          <div key={c.title} className="trust-card">
            <div className="trust-icon">{c.icon}</div>
            <div className="trust-card-title">{c.title}</div>
            <div className="trust-card-desc">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="section-header" style={{ marginBottom: 16 }}>
        <h3 className="section-title" style={{ fontSize: 16 }}>What Customers Say</h3>
      </div>
      <div className="trust-reviews">
        {TESTIMONIALS.map(t => (
          <div key={t.name} className="trust-review-card">
            <div className="tr-stars">{[1,2,3,4,5].map(i => <span key={i} className="tr-star">★</span>)}</div>
            <p className="tr-text">&ldquo;{t.text}&rdquo;</p>
            <div className="tr-author">
              <div className="tr-avatar">{t.name[0]}</div>
              <div>
                <div className="tr-name">{t.name}</div>
                <div className="tr-location">{t.location}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const cat = searchParams.get("category");

  useEffect(() => {
    const url = cat
      ? `${API}/clients/services/search?deals=true&category=${encodeURIComponent(cat)}`
      : `${API}/clients/services/search?deals=true`;
    fetch(url)
      .then(r => r.json())
      .then(j => { if (j.status === "success" && j.data) setDeals(j.data.slice(0, 3)); })
      .catch(() => {});
  }, [cat]);

  return (
    <>
      <style>{`
        .hero-section      { position:relative; width:100%; height:350px; background:#0A0A0A; border-radius:12px; overflow:hidden; margin-bottom:40px; display:flex; align-items:center; }
        .hero-image        { position:absolute; right:0; top:0; bottom:0; width:60%; background-size:cover; background-position:center; border-top-left-radius:50%; opacity:1; }
        .hero-overlay      { position:absolute; inset:0; background:linear-gradient(90deg,rgba(10,10,10,.82) 28%,rgba(10,10,10,.3) 62%,transparent 100%); }
        .hero-content      { position:relative; left:40px; z-index:10; max-width:380px; }
        .hero-badge        { display:inline-block; background:${RED}; color:#fff; padding:5px 12px; font-size:11px; font-weight:800; border-radius:4px; margin-bottom:16px; letter-spacing:1px; }
        .hero-title        { font-size:clamp(28px,5vw,54px); font-weight:900; color:#fff; margin:0 0 14px; line-height:1.05; }
        .hero-sub          { font-size:14px; color:rgba(255,255,255,.65); margin-bottom:24px; line-height:1.6; }
        .hero-cta          { text-decoration:none; background:${RED}; color:#fff; padding:12px 24px; border-radius:6px; font-weight:700; font-size:14px; }

        .section-header    { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:8px; }
        .section-title     { font-size:18px; font-weight:800; margin:0; }
        .view-all-link     { color:${RED}; text-decoration:none; font-weight:600; font-size:13px; }

        .deals-grid        { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; margin-bottom:40px; }
        .deal-card         { height:200px; border-radius:12px; padding:20px; position:relative; color:#fff; display:flex; flex-direction:column; justify-content:flex-end; overflow:hidden; }
        .deal-card-bg      { position:absolute; inset:0; background-size:cover; background-position:center; }
        .deal-card-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.72) 0%,rgba(0,0,0,.08) 60%,transparent 100%); }
        .deal-card-body    { position:relative; }
        .deal-badge        { background:${RED}; color:#fff; padding:3px 8px; border-radius:4px; font-size:10px; font-weight:800; display:inline-block; margin-bottom:8px; }
        .deal-title        { font-size:16px; font-weight:700; margin-bottom:4px; }
        .deal-meta         { font-size:13px; color:rgba(255,255,255,.75); margin-bottom:12px; }
        .deal-btn          { text-decoration:none; background:#fff; color:#0A0A0A; padding:7px 16px; border-radius:20px; font-size:12px; font-weight:700; display:inline-block; }

        .category-banners  { display:flex; flex-direction:column; gap:16px; margin-bottom:40px; }
        .cat-banner        { width:100%; border-radius:12px; padding:32px 40px; display:flex; align-items:center; position:relative; overflow:hidden; box-sizing:border-box; }
        .cat-banner-img    { position:absolute; right:0; top:0; bottom:0; width:45%; background-size:cover; background-position:center; opacity:.55; }
        .cat-banner-grad   { position:absolute; inset:0; }
        .cat-banner-body   { position:relative; z-index:1; max-width:480px; }
        .cat-banner-h2     { font-size:20px; font-weight:800; margin-bottom:8px; line-height:1.3; }
        .cat-banner-p      { font-size:14px; margin-bottom:20px; opacity:.85; line-height:1.6; }
        .cat-banner-btn    { text-decoration:none; background:#fff; color:${RED}; padding:10px 20px; border-radius:6px; font-weight:700; font-size:13px; display:inline-block; }

        .vendor-cta        { background:linear-gradient(135deg,#0A0A0A 0%,#1a0505 100%); border-radius:12px; padding:40px 48px; display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; }
        .vendor-cta-badge  { display:inline-block; background:rgba(220,20,60,.15); border:1px solid rgba(220,20,60,.4); border-radius:20px; padding:4px 14px; font-size:11px; font-weight:700; color:${RED}; margin-bottom:14px; letter-spacing:1px; }
        .vendor-cta-h2     { color:#fff; margin:0 0 10px; font-size:24px; font-weight:900; }
        .vendor-cta-p      { color:rgba(255,255,255,.65); margin:0; font-size:14px; max-width:420px; line-height:1.7; }
        .vendor-cta-btn    { text-decoration:none; background:${RED}; color:#fff; padding:14px 28px; border-radius:8px; font-weight:800; font-size:14px; white-space:nowrap; flex-shrink:0; }

        /* Trust section */
        .trust-section     { margin-bottom:48px; }
        .trust-header      { text-align:center; margin-bottom:32px; }
        .trust-label       { display:inline-block; background:#fee2e2; color:${RED}; border-radius:20px; padding:5px 16px; font-size:11px; font-weight:800; letter-spacing:1px; margin-bottom:12px; }
        .trust-title       { font-size:clamp(22px,4vw,34px); font-weight:900; color:#0A0A0A; margin:0 0 10px; }
        .trust-sub         { font-size:15px; color:#71717A; max-width:520px; margin:0 auto; line-height:1.7; }
        .trust-grid        { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:20px; margin-bottom:32px; }
        .trust-card        { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px 20px; text-align:center; transition:box-shadow .2s; }
        .trust-card:hover  { box-shadow:0 4px 24px rgba(0,0,0,.06); }
        .trust-icon        { font-size:32px; margin-bottom:12px; }
        .trust-card-title  { font-size:15px; font-weight:800; color:#0A0A0A; margin-bottom:6px; }
        .trust-card-desc   { font-size:13px; color:#71717A; line-height:1.6; }
        .trust-stats       { display:flex; flex-wrap:wrap; justify-content:center; gap:0; border:1.5px solid #eaeaea; border-radius:14px; overflow:hidden; margin-bottom:36px; }
        .trust-stat        { flex:1; min-width:120px; padding:24px 16px; text-align:center; border-right:1px solid #eaeaea; }
        .trust-stat:last-child { border-right:none; }
        .trust-stat-num    { font-size:clamp(24px,4vw,36px); font-weight:900; color:${RED}; margin-bottom:4px; }
        .trust-stat-label  { font-size:12px; color:#71717A; font-weight:600; }
        .trust-reviews     { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
        .trust-review-card { background:#f8f9fa; border-radius:12px; padding:20px; }
        .tr-stars          { display:flex; gap:2px; margin-bottom:10px; }
        .tr-star           { font-size:14px; color:#f59e0b; }
        .tr-text           { font-size:14px; color:#374151; line-height:1.65; font-style:italic; margin-bottom:12px; }
        .tr-author         { display:flex; align-items:center; gap:8px; }
        .tr-avatar         { width:34px; height:34px; border-radius:50%; background:${RED}; color:#fff; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .tr-name           { font-size:13px; font-weight:700; color:#0A0A0A; }
        .tr-location       { font-size:11px; color:#9ca3af; }
        @media(max-width:640px) { .trust-stat { border-right:none; border-bottom:1px solid #eaeaea; } .trust-stat:last-child { border-bottom:none; } }

        @media (max-width: 640px) {
          .hero-section   { height:auto; min-height:280px; padding:32px 0 32px 0; }
          .hero-image     { width:100%; opacity:.45; border-top-left-radius:0; }
          .hero-overlay   { background:linear-gradient(180deg,rgba(10,10,10,.55) 0%,rgba(10,10,10,.8) 100%); }
          .hero-content   { left:0; padding:0 20px; max-width:100%; }
          .hero-title     { font-size:30px; }
          .cat-banner     { padding:24px 20px; }
          .cat-banner-img { width:100%; opacity:.32; }
          .vendor-cta     { padding:28px 20px; flex-direction:column; text-align:center; align-items:center; }
          .vendor-cta-p   { max-width:100%; }
        }
      `}</style>

      {/* ── CATEGORY SLIDER ──────────────────────────────────────────────── */}
      <CategorySlider />

      {/* ── TRENDING DEALS ────────────────────────────────────────────────── */}
      <div className="section-header">
        <h3 className="section-title">🔥 Trending Deals</h3>
        <Link href="/deals" className="view-all-link">View All Deals →</Link>
      </div>
      <div className="deals-grid">
        {deals.length > 0 ? deals.map((deal, i) => (
          <TrendingCard key={deal.id} deal={deal} index={i} />
        )) : (
          <p style={{ color: "#71717A", gridColumn: "1/-1", padding: "12px 0" }}>
            No active deals right now — check back soon!
          </p>
        )}
      </div>


      {/* ── CATEGORY BANNERS ─────────────────────────────────────────────── */}
      <CategoryBanners />

      {/* ── TRUST & CREDIBILITY ──────────────────────────────────────────── */}
      <TrustSection />

      {/* ── VENDOR CTA ───────────────────────────────────────────────────── */}
      <div className="vendor-cta">
        <div>
          <div className="vendor-cta-badge">FOR SERVICE PROVIDERS</div>
          <h2 className="vendor-cta-h2">Grow Your Business on kasiFix</h2>
          <p className="vendor-cta-p">
            Join thousands of African entrepreneurs listing services, reaching new clients,
            and building their brand — all in one marketplace built for you.
          </p>
        </div>
        <Link href="/login" className="vendor-cta-btn">Start Listing Free →</Link>
      </div>
    </>
  );
}

export default function LandingPageWrapper() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=900&auto=format&fit=crop",
];

function dealExpiryLabel(expiresAt?: string | null): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (diff < 0)   return null;
  if (diff === 0) return { label: "Expires today",    urgent: true };
  if (diff === 1) return { label: "Expires tomorrow", urgent: true };
  if (diff <= 3)  return { label: `Expires in ${diff} days`, urgent: true };
  return { label: `Expires ${new Date(expiresAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`, urgent: false };
}

function TrendingCard({ deal, index }: { deal: any; index: number }) {
  const expiry = dealExpiryLabel(deal.dealExpiresAt);
  const img    = deal.imageUrl || BG_IMAGES[index % BG_IMAGES.length];
  return (
    <div className="deal-card">
      <img src={img} alt={deal.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
      <div className="deal-card-overlay" />
      <div className="deal-card-body">
        <span className="deal-badge">🔥 THIS WEEK</span>
        <div className="deal-title">{deal.name}</div>
        <div className="deal-meta">R {Number(deal.price).toFixed(2)} · {deal.category}</div>
        {expiry && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: expiry.urgent ? "#ef4444" : "rgba(255,255,255,.18)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, marginBottom: 8 }}>
            <Clock size={11} /> {expiry.label}
          </div>
        )}
        <div><Link href={`/services/${deal.id}`} className="deal-btn">Book Now →</Link></div>
      </div>
    </div>
  );
}

function CategorySlider() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restart = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActive((idx + SLIDER_ITEMS.length) % SLIDER_ITEMS.length);
    timerRef.current = setInterval(() => setActive(a => (a + 1) % SLIDER_ITEMS.length), 4500);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setActive(a => (a + 1) % SLIDER_ITEMS.length), 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const item = SLIDER_ITEMS[active];

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginBottom: 40, height: 340, background: "#0A0A0A", userSelect: "none" }}>

      {/* Images — fade between slides */}
      {SLIDER_ITEMS.map((s, i) => (
        <img
          key={s.category}
          src={s.img}
          alt={s.category}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            objectPosition: s.category.includes("Training") || s.category.includes("Personal") ? "center 20%" : "center 40%",
            opacity: i === active ? 1 : 0,
            transition: "opacity 0.75s ease",
            display: "block",
          }}
        />
      ))}

      {/* Dark left-to-right gradient so text is readable */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(0,0,0,.85) 0%,rgba(0,0,0,.5) 50%,rgba(0,0,0,.15) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.45) 0%,transparent 60%)" }} />

      {/* Accent colour strip on right */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "26%", background: item.accent, opacity: 0.88, transition: "background 0.75s" }} />
      <div style={{ position: "absolute", top: 0, right: "26%", bottom: 0, width: 70, background: `linear-gradient(90deg,transparent,${item.accent}dd)`, transition: "background 0.75s" }} />

      {/* Slide content */}
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px", maxWidth: "60%" }}>
        <span style={{ display: "inline-block", background: RED, color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 1.5, padding: "4px 12px", borderRadius: 4, marginBottom: 14, width: "fit-content" }}>
          {item.badge}
        </span>
        <h2 style={{ color: "#fff", fontSize: "clamp(24px,3.5vw,48px)", fontWeight: 900, margin: "0 0 10px", lineHeight: 1.05, textTransform: "uppercase" }}>
          {item.category}
        </h2>
        <p style={{ color: "rgba(255,255,255,.65)", fontSize: 14, margin: "0 0 22px" }}>{item.sub}</p>
        <Link
          href={`/services?category=${encodeURIComponent(item.category)}`}
          style={{ display: "inline-block", background: "#fff", color: "#0A0A0A", padding: "10px 22px", borderRadius: 6, fontWeight: 800, fontSize: 13, textDecoration: "none", width: "fit-content" }}
        >
          Find a Pro Today →
        </Link>
      </div>

      {/* Category list on right accent panel */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "26%", zIndex: 11, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 18px", gap: 4 }}>
        {SLIDER_ITEMS.map((s, i) => (
          <button
            key={s.category}
            onClick={() => restart(i)}
            style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "7px 10px", borderRadius: 6, borderLeft: `3px solid ${i === active ? "#fff" : "rgba(255,255,255,.3)"}`, transition: "all .25s" }}
          >
            <div style={{ color: i === active ? "#fff" : "rgba(255,255,255,.5)", fontSize: 11, fontWeight: i === active ? 800 : 500, lineHeight: 1.35, transition: "color .25s" }}>
              {s.category}
            </div>
          </button>
        ))}
      </div>

      {/* Prev / Next */}
      <button onClick={() => restart(active - 1)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 12, background: "rgba(0,0,0,.5)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
        <ChevronLeft size={20} />
      </button>
      <button onClick={() => restart(active + 1)} style={{ position: "absolute", left: 54, top: "50%", transform: "translateY(-50%)", zIndex: 12, background: "rgba(0,0,0,.5)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
        <ChevronRight size={20} />
      </button>

      {/* Progress dots */}
      <div style={{ position: "absolute", bottom: 14, left: 48, zIndex: 12, display: "flex", gap: 6, alignItems: "center" }}>
        {SLIDER_ITEMS.map((_, i) => (
          <button key={i} onClick={() => restart(i)} style={{ width: i === active ? 22 : 7, height: 7, borderRadius: 4, background: i === active ? "#fff" : "rgba(255,255,255,.4)", border: "none", cursor: "pointer", padding: 0, transition: "all .35s" }} />
        ))}
      </div>
    </div>
  );
}

const CAT_BANNERS = [
  {
    bg: "#1565C0", textColor: "#fff",
    heading: "Keep Your Home Spotless\nWithout Lifting a Finger",
    sub: "Book trusted local cleaning professionals for a cleaner, healthier space.",
    cta: "Find a Cleaner Today",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=700&auto=format&fit=crop",
    imgLeft: true,
    href: "/services?category=Home+Cleaning",
  },
  {
    bg: "#2E7D32", textColor: "#fff",
    heading: "Your Health, Your Schedule\nBook Fitness & Wellness Experts",
    sub: "Stay active and feel your best with certified trainers and wellness coaches.",
    cta: "Start Your Wellness Journey",
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=700&auto=format&fit=crop",
    imgLeft: false,
    href: "/services?category=Fitness+%26+Wellness",
  },
  {
    bg: "#F9A825", textColor: "#0A0A0A",
    heading: "Beauty, Grooming & Self-Care\nOn Your Schedule",
    sub: "Feel confident and pampered with top-rated beauty services you can trust.",
    cta: "Book Beauty & Care",
    img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=700&auto=format&fit=crop",
    imgLeft: true,
    href: "/services?category=Beauty+%26+Grooming",
  },
  {
    bg: "#00838F", textColor: "#fff",
    heading: "Home Maintenance & Trades",
    sub: "Find trusted professionals to keep your home running smoothly.",
    cta: "Hire a Pro Today",
    img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=700&auto=format&fit=crop",
    imgLeft: false,
    href: "/services?category=Home+Maintenance+%26+Trades",
  },
  {
    bg: "#E65100", textColor: "#fff",
    heading: "Professional Training,\nTutoring & Coaching",
    sub: "Learn, Grow, and Succeed — With Expert Guidance.",
    cta: "Find a Trainer or Tutor",
    img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=700&auto=format&fit=crop",
    imgLeft: true,
    href: "/services?category=Professional+Training+%26+Coaching",
  },
];

function CategoryBanners() {
  return (
    <div style={{ margin: "40px 0" }}>
      <style>{`
        .cat-banners     { display:flex; flex-direction:column; gap:12px; }
        .cat-banner      { border-radius:14px; overflow:hidden; display:flex; min-height:180px; }
        .cat-banner.flip { flex-direction:row-reverse; }
        .cb-img-side     { width:38%; flex-shrink:0; overflow:hidden; position:relative; }
        .cb-img-side img { width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }
        .cb-text-side    { flex:1; display:flex; flex-direction:column; justify-content:center; padding:28px 32px; }
        .cb-heading      { margin:0 0 8px; font-size:clamp(15px,2.2vw,22px); font-weight:900; line-height:1.25; white-space:pre-line; font-family:sans-serif; }
        .cb-sub          { margin:0 0 18px; font-size:clamp(12px,1.4vw,14px); line-height:1.6; opacity:.88; font-family:sans-serif; max-width:380px; }
        .cb-btn          { display:inline-block; padding:9px 20px; border-radius:8px; font-weight:800; font-size:13px; text-decoration:none; align-self:flex-start; font-family:sans-serif; transition:opacity .15s; }
        .cb-btn:hover    { opacity:.88; }
        @media(max-width:640px) {
          .cat-banner, .cat-banner.flip { flex-direction:column; }
          .cb-img-side    { width:100%; height:160px; }
          .cb-text-side   { padding:20px; }
          .cb-btn         { align-self:stretch; text-align:center; }
        }
      `}</style>
      <div className="cat-banners">
        {CAT_BANNERS.map((b, i) => {
          const btnBg    = b.textColor === "#fff" ? "rgba(255,255,255,.95)" : "#0A0A0A";
          const btnColor = b.textColor === "#fff" ? b.bg : "#fff";
          return (
            <div key={i} className={`cat-banner${b.imgLeft ? "" : " flip"}`} style={{ background: b.bg }}>
              <div className="cb-img-side">
                <img src={b.img} alt={b.cta} />
              </div>
              <div className="cb-text-side" style={{ color: b.textColor }}>
                <h3 className="cb-heading">{b.heading}</h3>
                <p className="cb-sub">{b.sub}</p>
                <Link href={b.href} className="cb-btn" style={{ background: btnBg, color: btnColor }}>
                  {b.cta}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
