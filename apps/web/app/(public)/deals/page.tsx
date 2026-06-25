"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useCart } from "../../../src/shared/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=600&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
  "Other Local Services":             "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
};
function getImg(category: string) {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Other Local Services"];
}

function Stars({ rating }: { rating: number | null }) {
  const r = Math.round(rating ?? 0);
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 12, color: i <= r ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

function DealsContent() {
  const { addItem, isInCart } = useCart();
  const [deals,   setDeals]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/clients/services/search?deals=true`)
      .then(r => r.json())
      .then(j => { if (j.status === "success") setDeals(j.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        .deals-hero     { background:linear-gradient(135deg,#0A0A0A 0%,#1a0a00 100%); border-radius:14px; padding:36px 32px; margin-bottom:28px; position:relative; overflow:hidden; }
        .deals-hero::before { content:"🔥"; position:absolute; right:24px; top:50%; transform:translateY(-50%); font-size:80px; opacity:.15; }
        .deals-badge    { display:inline-block; background:#f59e0b; color:#fff; font-size:11px; font-weight:800; padding:4px 12px; border-radius:20px; margin-bottom:12px; letter-spacing:.5px; text-transform:uppercase; }
        .deals-h1       { color:#fff; margin:0 0 8px; font-size:clamp(24px,5vw,38px); font-weight:900; }
        .deals-sub      { color:rgba(255,255,255,.6); margin:0; font-size:14px; }

        .deals-grid     { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:20px; }
        .deal-card      { background:#fff; border:2px solid #fde68a; border-radius:14px; overflow:hidden; transition:box-shadow .15s,border-color .15s; }
        .deal-card:hover{ box-shadow:0 6px 24px rgba(245,158,11,.2); border-color:#f59e0b; }
        .deal-img-wrap  { position:relative; height:170px; overflow:hidden; background:#f1f5f9; }
        .deal-img-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
        .deal-badge     { position:absolute; top:10px; right:10px; background:#f59e0b; color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; }
        .deal-savings   { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent,rgba(0,0,0,.7)); padding:14px 14px 10px; color:#fff; font-size:12px; font-weight:700; }
        .deal-body      { padding:16px; }
        .deal-cat       { display:inline-block; background:#fef3c7; color:#92400e; border-radius:4px; padding:2px 8px; font-size:11px; font-weight:700; margin-bottom:8px; }
        .deal-name      { font-size:15px; font-weight:800; color:#0A0A0A; margin-bottom:4px; }
        .deal-vendor    { font-size:12px; color:#71717A; margin-bottom:8px; }
        .deal-price-row { display:flex; align-items:baseline; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
        .deal-price     { font-size:24px; font-weight:900; color:${RED}; }
        .deal-original  { font-size:14px; color:#9ca3af; text-decoration:line-through; }
        .deal-pct       { font-size:12px; font-weight:800; color:#16a34a; background:#dcfce7; padding:2px 7px; border-radius:20px; }
        .deal-actions   { display:flex; gap:8px; }
        .deal-book-now  { flex:1; padding:10px; background:#0A0A0A; color:#fff; border:none; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer; font-family:sans-serif; text-decoration:none; text-align:center; display:flex; align-items:center; justify-content:center; }
        .deal-book-now:hover { opacity:.85; }
        .deal-add-btn   { flex:1; padding:10px; background:${RED}; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; font-family:sans-serif; }
        .deal-add-btn:hover  { opacity:.9; }
        .deal-add-btn.added  { background:#16a34a; }

        .deals-empty    { text-align:center; padding:80px 20px; font-family:sans-serif; }
        .deals-skeleton { background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200%; animation:shimmer 1.4s infinite; border-radius:14px; height:320px; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        @media (max-width:640px) {
          .deals-hero   { padding:24px 20px; }
          .deals-grid   { grid-template-columns:1fr 1fr; gap:12px; }
        }
        @media (max-width:400px) {
          .deals-grid   { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="deals-hero">
        <div className="deals-badge">🔥 Limited Time Deals</div>
        <h1 className="deals-h1">Today&apos;s Best Deals</h1>
        <p className="deals-sub">Exclusive discounts from verified service providers across South Africa</p>
      </div>

      {!loading && deals.length > 0 && (
        <p style={{ fontSize: 13, color: "#71717A", marginBottom: 20, fontFamily: "sans-serif" }}>
          {deals.length} deal{deals.length !== 1 ? "s" : ""} available
        </p>
      )}

      {loading ? (
        <div className="deals-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="deals-skeleton" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="deals-empty">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontWeight: 900, color: "#0A0A0A", margin: "0 0 8px" }}>No deals right now</h2>
          <p style={{ color: "#71717A", marginBottom: 28 }}>Check back soon — vendors post new deals daily.</p>
          <Link href="/services" style={{ background: RED, color: "#fff", padding: "13px 28px", borderRadius: 8, fontWeight: 800, textDecoration: "none" }}>
            Browse All Services
          </Link>
        </div>
      ) : (
        <div className="deals-grid">
          {deals.map(deal => {
            const saving = deal.originalPrice ? Number(deal.originalPrice) - Number(deal.price) : 0;
            const pct    = deal.originalPrice && saving > 0 ? Math.round((saving / Number(deal.originalPrice)) * 100) : 0;
            return (
              <div key={deal.id} className="deal-card">
                <div className="deal-img-wrap">
                  <img
                    src={deal.imageUrl || getImg(deal.category)}
                    alt={deal.name}
                    onError={e => { (e.target as HTMLImageElement).src = getImg(deal.category); }}
                  />
                  <span className="deal-badge">🔥 DEAL</span>
                  {saving > 0 && <div className="deal-savings">Save R {saving.toFixed(2)}</div>}
                </div>
                <div className="deal-body">
                  <span className="deal-cat">{deal.category}</span>
                  <div className="deal-name">{deal.name}</div>
                  {deal.vendorProfile?.businessName && (
                    <div className="deal-vendor">by {deal.vendorProfile.businessName}</div>
                  )}
                  {deal.reviewCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      <Stars rating={deal.avgRating} />
                      <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{Number(deal.avgRating).toFixed(1)}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>({deal.reviewCount})</span>
                    </div>
                  )}
                  <div className="deal-price-row">
                    <span className="deal-price">R {Number(deal.price).toFixed(2)}</span>
                    {deal.originalPrice && (
                      <>
                        <span className="deal-original">R {Number(deal.originalPrice).toFixed(2)}</span>
                        {pct > 0 && <span className="deal-pct">{pct}% off</span>}
                      </>
                    )}
                  </div>
                  <div className="deal-actions">
                    <Link href={`/services/${deal.id}`} className="deal-book-now">⚡ Book Now</Link>
                    <button
                      className={`deal-add-btn${isInCart(deal.id) ? " added" : ""}`}
                      onClick={() => addItem({
                        id: deal.id, name: deal.name, price: Number(deal.price),
                        category: deal.category, imageUrl: deal.imageUrl,
                        vendorName: deal.vendorProfile?.businessName,
                      })}
                    >
                      {isInCart(deal.id) ? "✓ Added" : "+ Booking"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={null}>
      <DealsContent />
    </Suspense>
  );
}
