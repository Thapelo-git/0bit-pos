"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const HERO_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1470&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1470&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=1470&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1470&auto=format&fit=crop",
  "Other Local Services":             "https://images.unsplash.com/photo-1444653389962-81492d1136b8?q=80&w=1470&auto=format&fit=crop",
};

function getHeroImage(cat: string | null) {
  return HERO_IMAGES[cat || "Home Cleaning"] || HERO_IMAGES["Home Cleaning"];
}

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
          { icon: "✅", title: "Verified Businesses", desc: "Every listed vendor undergoes ID, credential, and business registration verification before going live." },
          { icon: "⭐", title: "Real Customer Reviews", desc: "Only confirmed customers can leave reviews — no fake ratings. Star scores reflect genuine experiences." },
          { icon: "🛡", title: "Secure Bookings", desc: "Your bookings and payments are protected. Dispute resolution is built in if something goes wrong." },
          { icon: "📞", title: "Responsive Support", desc: "Our team is reachable 7 days a week to help with any booking issues or provider concerns." },
          { icon: "🔒", title: "Background Checked", desc: "High-trust categories (home access, childcare, medical) require enhanced background screening." },
          { icon: "💬", title: "Satisfaction Guarantee", desc: "Not happy? We offer free rebooking or a full refund for services that don&apos;t meet your expectations." },
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

export default function LandingPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const cat = searchParams.get("category");

  useEffect(() => {
    const url = cat
      ? `${API}/clients/services/search?category=${encodeURIComponent(cat)}`
      : `${API}/clients/services/search`;
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

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="hero-section" style={{ marginBottom: "40px" }}>
        <div className="hero-image" style={{ backgroundImage: `url(${getHeroImage(cat)})` }} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-badge">
            {cat ? "CATEGORY SPOTLIGHT" : "SOUTH AFRICA'S SERVICE MARKETPLACE"}
          </span>
          <h1 className="hero-title">
            {cat
              ? cat.toUpperCase()
              : <>BOOK LOCAL<br /><span style={{ color: RED }}>PROS TODAY</span></>
            }
          </h1>
          <p className="hero-sub">
            {cat
              ? `Trusted ${cat} professionals near you`
              : "Find vetted service providers across South Africa. Fast, affordable, reliable."}
          </p>
          <Link href="/services" className="hero-cta">Explore Services →</Link>
        </div>
      </div>

      {/* ── TRENDING DEALS ────────────────────────────────────────────────── */}
      <div className="section-header">
        <h3 className="section-title">Trending Deals</h3>
        <Link href="/services" className="view-all-link">View All →</Link>
      </div>
      <div className="deals-grid">
        {deals.length > 0 ? deals.map((deal, i) => (
          <TrendingCard key={deal.id} deal={deal} index={i} />
        )) : (
          <p style={{ color: "#71717A", gridColumn: "1/-1", padding: "12px 0" }}>
            No deals found for this category. Try another!
          </p>
        )}
      </div>

      {/* ── CATEGORY BANNERS ─────────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <span className="section-title" style={{ marginRight: "10px" }}>Get Deals By Category</span>
          <span style={{ fontSize: "12px", color: "#71717A" }}>Don&apos;t miss out — book a professional today</span>
        </div>
        <Link href="/services" style={{
          border: `1px solid ${RED}`, color: RED, backgroundColor: "transparent",
          padding: "5px 15px", borderRadius: "20px", cursor: "pointer",
          fontSize: "12px", fontWeight: 600, textDecoration: "none"
        }}>
          View All →
        </Link>
      </div>

      <div className="category-banners">
        <CategoryBanner
          bg={RED}
          title="Keep Your Home Spotless Without Lifting a Finger"
          desc="Book trusted local cleaning professionals for a cleaner, healthier space."
          btn="Find a Cleaner Today"
          url="Home Cleaning"
          img="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&auto=format&fit=crop"
        />
        <CategoryBanner
          bg="#0A0A0A"
          title="Your Health, Your Schedule — Book Fitness &amp; Wellness Experts"
          desc="Stay active and feel your best with certified trainers and wellness coaches."
          btn="Start Your Wellness Journey"
          url="Fitness & Wellness"
          img="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop"
        />
        <CategoryBanner
          bg="#1a1a2e"
          title="Beauty, Grooming &amp; Personal Care on Your Schedule"
          desc="Feel confident and pampered with top-rated service providers you can trust."
          btn="Book Personal Services"
          url="Personal Services"
          img="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1470&auto=format&fit=crop"
        />
        <CategoryBanner
          bg="#0A0A0A"
          title="Home Maintenance &amp; Skilled Trades"
          desc="Find trusted plumbers, electricians, and handymen to keep your home running."
          btn="Hire a Pro Today"
          url="Home Maintenance & Trades"
          img="https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=1470&auto=format&fit=crop"
        />
      </div>

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

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=600&auto=format&fit=crop",
];

function TrendingCard({ deal, index }: { deal: any; index: number }) {
  return (
    <div className="deal-card">
      <div className="deal-card-bg" style={{ backgroundImage: `url(${BG_IMAGES[index % BG_IMAGES.length]})` }} />
      <div className="deal-card-overlay" />
      <div className="deal-card-body">
        <span className="deal-badge">THIS WEEK</span>
        <div className="deal-title">{deal.name}</div>
        <div className="deal-meta">R {Number(deal.price).toFixed(2)} · {deal.category}</div>
        <Link href={`/services/${deal.id}`} className="deal-btn">Book Now →</Link>
      </div>
    </div>
  );
}

function CategoryBanner({ bg, title, desc, btn, url, img }: {
  bg: string; title: string; desc: string; btn: string; url: string; img: string
}) {
  return (
    <div className="cat-banner" style={{ backgroundColor: bg, color: "#fff" }}>
      <div className="cat-banner-img" style={{ backgroundImage: `url(${img})` }} />
      <div className="cat-banner-grad" style={{ background: `linear-gradient(90deg, ${bg} 42%, transparent 100%)` }} />
      <div className="cat-banner-body">
        <h2 className="cat-banner-h2" dangerouslySetInnerHTML={{ __html: title }} />
        <p className="cat-banner-p">{desc}</p>
        <Link href={`/services?category=${encodeURIComponent(url)}`} className="cat-banner-btn">{btn}</Link>
      </div>
    </div>
  );
}
