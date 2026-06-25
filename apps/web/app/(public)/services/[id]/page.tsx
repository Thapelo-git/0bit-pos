"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../../../src/shared/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=1200&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
};

function Stars({ rating, size = 16, interactive = false, onRate }: {
  rating: number | null;
  size?: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const r = rating ?? 0;
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(i)}
          style={{
            fontSize: size,
            color: i <= (interactive ? (hovered || r) : Math.round(r)) ? "#f59e0b" : "#d1d5db",
            lineHeight: 1,
            cursor: interactive ? "pointer" : "default",
            transition: "color .1s",
          }}
        >★</span>
      ))}
    </span>
  );
}

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: "#374151", fontWeight: 600, width: 10 }}>{label}</span>
      <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 20, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${total ? (count / total) * 100 : 0}%`, background: color, borderRadius: 20, transition: "width .5s" }} />
      </div>
      <span style={{ fontSize: 12, color: "#9ca3af", width: 20, textAlign: "right" }}>{count}</span>
    </div>
  );
}

const FAV_KEY = "kasifix_favorites";

export default function ServiceDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { addItem, isInCart } = useCart();

  const [service,    setService]    = useState<any>(null);
  const [bookNowBusy, setBookNowBusy] = useState(false);
  const [isFav,      setIsFav]      = useState(false);
  const [cartToast,  setCartToast]  = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── Get Quote state ─────────────────────────────────────────────────────────
  const [quoteOpen, setQuoteOpen]   = useState(false);
  const [quoteStep, setQuoteStep]   = useState<"form" | "result">("form");
  const [qBeds,     setQBeds]       = useState("2");
  const [qBaths,    setQBaths]      = useState("1");
  const [qClean,    setQClean]      = useState("Standard Clean");
  const [qFreq,     setQFreq]       = useState("Once-off");
  const [qJobSize,  setQJobSize]    = useState("Medium");
  const [qUrgency,  setQUrgency]    = useState("Within a week");
  const [qMaterials,setQMaterials]  = useState("Not included");
  const [quotedPrice, setQuotedPrice] = useState(0);

  // Review form state
  const [myRating,  setMyRating]  = useState(0);
  const [myComment, setMyComment] = useState("");
  const [revMsg,    setRevMsg]    = useState<{ text: string; ok: boolean } | null>(null);
  const [revSaving, setRevSaving] = useState(false);

  // Silently check auth (for the "no account" message and fav button)
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.status === "success" && j.data?.user) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);

  // Derive cartAdded live from the cart — never stale, never double-counts
  const cartAdded = service ? isInCart(service.id) : false;

  useEffect(() => {
    fetch(`${API}/clients/services/${params.id}`)
      .then(r => r.json())
      .then(j => {
        if (j.status === "success" && j.data) setService(j.data);
      });
  }, [params.id]);

  // Load favourite state from localStorage (no login required)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const favs: { id: string }[] = raw ? JSON.parse(raw) : [];
      setIsFav(favs.some(f => f.id === params.id));
    } catch {}
  }, [params.id]);

  const addToBooking = () => {
    if (!service) return;
    if (!cartAdded) {
      addItem({
        id:         service.id,
        name:       service.name,
        price:      Number(service.price),
        category:   service.category,
        imageUrl:   service.imageUrl,
        vendorName: service.vendorProfile?.businessName,
      });
    }
    setCartToast(true);
    setTimeout(() => setCartToast(false), 2800);
  };

  const bookNow = () => {
    if (!service || bookNowBusy) return;
    setBookNowBusy(true);
    // Only add if not already in cart — prevents quantity doubling
    if (!cartAdded) {
      addItem({
        id:         service.id,
        name:       service.name,
        price:      Number(service.price),
        category:   service.category,
        imageUrl:   service.imageUrl,
        vendorName: service.vendorProfile?.businessName,
      });
    }
    router.push("/checkout");
  };

  const toggleFav = () => {
    if (!service) return;
    try {
      const raw  = localStorage.getItem(FAV_KEY);
      const favs: any[] = raw ? JSON.parse(raw) : [];
      if (isFav) {
        localStorage.setItem(FAV_KEY, JSON.stringify(favs.filter(f => f.id !== service.id)));
        setIsFav(false);
      } else {
        favs.push({ id: service.id, name: service.name, price: service.price,
                    category: service.category, imageUrl: service.imageUrl,
                    vendorName: service.vendorProfile?.businessName });
        localStorage.setItem(FAV_KEY, JSON.stringify(favs));
        setIsFav(true);
      }
    } catch {}
  };

  const QUOTE_CATS = ["Home Cleaning", "Home Maintenance & Trades"];
  const isQuotable = service && QUOTE_CATS.includes(service.category);

  const calcQuote = () => {
    if (!service) return;
    const base = Number(service.price);
    let price = base;

    if (service.category === "Home Cleaning") {
      const bedMult: Record<string, number> = { Studio: 0.8, "1": 1.0, "2": 1.35, "3": 1.7, "4+": 2.2 };
      const bathAdd: Record<string, number> = { "1": 0, "2": 90, "3+": 180 };
      const typeMult: Record<string, number> = { "Standard Clean": 1, "Deep Clean": 1.65, "Move In/Out Clean": 2.1 };
      const freqDisc: Record<string, number> = { "Once-off": 0, "Weekly": 0.15, "Bi-weekly": 0.10, "Monthly": 0.05 };
      price = (base * (bedMult[qBeds] || 1) * (typeMult[qClean] || 1)) + (bathAdd[qBaths] || 0);
      price = price * (1 - (freqDisc[qFreq] || 0));
    } else {
      // Home Maintenance & Trades
      const sizeMult: Record<string, number> = { Small: 0.75, Medium: 1.2, Large: 1.9, "Very Large": 2.8 };
      const urgencyAdd: Record<string, number> = { "Not urgent": 0, "Within a week": 0, "Within 48 hours": 250, Emergency: 500 };
      const matMult = qMaterials === "Included" ? 1.35 : 1;
      price = base * (sizeMult[qJobSize] || 1) * matMult + (urgencyAdd[qUrgency] || 0);
    }

    setQuotedPrice(Math.ceil(price / 10) * 10); // round to nearest R10
    setQuoteStep("result");
  };

  const bookWithQuote = () => {
    if (!service) return;
    addItem({
      id: service.id, name: service.name, price: quotedPrice,
      category: service.category, imageUrl: service.imageUrl,
      vendorName: service.vendorProfile?.businessName,
    });
    setQuoteOpen(false);
    router.push("/checkout");
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myRating) { setRevMsg({ text: "Please select a star rating.", ok: false }); return; }
    setRevSaving(true); setRevMsg(null);
    try {
      const res  = await fetch(`${API}/clients/services/${params.id}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: myRating, comment: myComment }),
        credentials: "include",
      });
      const json = await res.json();
      if (json.status === "success") {
        setRevMsg({ text: "Review submitted — thank you!", ok: true });
        // Refresh service to get updated reviews
        fetch(`${API}/clients/services/${params.id}`)
          .then(r => r.json())
          .then(j => { if (j.status === "success") setService(j.data); });
        setMyRating(0); setMyComment("");
      } else {
        setRevMsg({ text: json.message || "Could not submit review. Are you signed in?", ok: false });
      }
    } catch { setRevMsg({ text: "Network error.", ok: false }); }
    setRevSaving(false);
  };

  if (!service) return (
    <div style={{ padding: "60px 20px", textAlign: "center", color: "#71717A" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>Loading service details...
    </div>
  );

  const heroImg    = service.imageUrl || CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES["Home Cleaning"];
  const avgRating  = service.avgRating as number | null;
  const reviews    = (service.reviews || []) as any[];
  const isVerified = service.vendorProfile?.isVerified;

  // Rating histogram
  const hist = [5,4,3,2,1].map(star => ({
    star, count: reviews.filter((r: any) => r.rating === star).length,
  }));

  const clientName = (r: any) =>
    r.client?.displayName || `${r.client?.firstName || ""}`.trim() || "Client";

  return (
    <>
      <style>{`
        .detail-wrap    { max-width:900px; margin:0 auto; padding:0 0 60px; }
        .detail-back    { background:none; border:none; color:${RED}; cursor:pointer; font-weight:700; font-size:14px; margin-bottom:20px; display:flex; align-items:center; gap:6px; padding:0; }
        .detail-hero    { position:relative; height:340px; border-radius:14px; overflow:hidden; margin-bottom:28px; }
        .detail-hero img{ width:100%; height:100%; object-fit:cover; display:block; }
        .detail-layout  { display:flex; gap:28px; align-items:flex-start; }
        .detail-left    { flex:1; min-width:0; }
        .detail-right   { width:268px; flex-shrink:0; }

        /* Vendor trust card */
        .vendor-trust   { background:#f8f9fa; border:1.5px solid #eaeaea; border-radius:14px; padding:20px; margin-bottom:20px; }
        .vt-title       { font-size:13px; font-weight:800; color:#0A0A0A; margin:0 0 14px; text-transform:uppercase; letter-spacing:.5px; }
        .vt-row         { display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:13px; color:#374151; }
        .vt-icon        { width:28px; height:28px; border-radius:6px; background:#fff; border:1px solid #eaeaea; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }

        /* Rating summary */
        .rat-summary    { display:flex; gap:20px; align-items:center; background:#f8f9fa; border:1.5px solid #eaeaea; border-radius:14px; padding:20px; margin-bottom:28px; }
        .rat-big        { text-align:center; flex-shrink:0; }
        .rat-num        { font-size:48px; font-weight:900; color:#0A0A0A; line-height:1; }
        .rat-label      { font-size:12px; color:#9ca3af; margin-top:6px; }
        .rat-bars       { flex:1; }

        /* Review cards */
        .rev-card       { background:#fff; border:1.5px solid #eaeaea; border-radius:12px; padding:18px 20px; margin-bottom:12px; }
        .rev-header     { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
        .rev-name       { font-weight:700; font-size:14px; color:#0A0A0A; }
        .rev-date       { font-size:12px; color:#9ca3af; }
        .rev-comment    { font-size:14px; color:#374151; line-height:1.65; margin-top:6px; }

        /* Review form */
        .rev-form-card  { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px; margin-top:8px; }
        .rev-form-title { font-size:17px; font-weight:800; color:#0A0A0A; margin:0 0 4px; }
        .rev-form-sub   { font-size:13px; color:#71717A; margin:0 0 18px; }
        .rev-textarea   { width:100%; padding:12px 14px; border:1.5px solid #eaeaea; border-radius:8px; font-size:14px; font-family:inherit; resize:vertical; min-height:80px; outline:none; box-sizing:border-box; }
        .rev-textarea:focus { border-color:${RED}; }
        .rev-submit     { background:${RED}; color:#fff; border:none; padding:11px 24px; border-radius:8px; font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; width:100%; margin-top:12px; }
        .rev-submit:disabled { opacity:.6; cursor:not-allowed; }

        /* Badge row */
        .badge-row      { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px; }
        .badge          { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700; border:1px solid; }
        .badge-green    { background:#dcfce7; color:#15803d; border-color:#bbf7d0; }
        .badge-blue     { background:#dbeafe; color:#1d4ed8; border-color:#bfdbfe; }
        .badge-amber    { background:#fef3c7; color:#92400e; border-color:#fde68a; }

        .detail-cat     { display:inline-block; background:#fee2e2; color:${RED}; border-radius:4px; padding:3px 10px; font-size:12px; font-weight:700; margin-bottom:10px; }
        .detail-title   { font-size:clamp(20px,4vw,30px); font-weight:900; color:#0A0A0A; margin:0 0 8px; }
        .detail-vendor  { font-size:14px; color:#71717A; font-weight:600; margin-bottom:14px; }
        .detail-desc    { font-size:15px; line-height:1.8; color:#333; margin-bottom:24px; }

        .booking-card   { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px; position:sticky; top:100px; }
        .booking-price  { font-size:38px; font-weight:900; color:${RED}; margin-bottom:4px; }
        .booking-per    { font-size:12px; color:#71717A; margin-bottom:20px; }
        .booking-row    { display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px; }
        .booking-div    { border-top:1px solid #eaeaea; margin:16px 0; }
        .add-cart-btn   { width:100%; padding:15px; background:${RED}; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:16px; cursor:pointer; transition:opacity .15s; margin-top:16px; font-family:sans-serif; }
        .add-cart-btn:hover { opacity:.9; }
        .in-cart-btn    { width:100%; padding:15px; background:#16a34a; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:16px; cursor:pointer; margin-top:16px; font-family:sans-serif; text-decoration:none; display:block; text-align:center; box-sizing:border-box; }
        .fav-toggle     { width:100%; padding:12px; background:#f1f5f9; color:#374151; border:1.5px solid #eaeaea; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; margin-top:10px; font-family:sans-serif; display:flex; align-items:center; justify-content:center; gap:6px; }
        .fav-toggle.on  { background:#fff1f2; border-color:#fca5a5; color:${RED}; }
        .cart-toast     { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#0A0A0A; color:#fff; padding:14px 28px; border-radius:10px; font-size:14px; font-weight:700; z-index:9999; display:flex; align-items:center; gap:10px; box-shadow:0 8px 32px rgba(0,0,0,.3); animation:slideUp .3s ease; }
        @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

        /* Platform guarantees */
        .guarantees     { border-top:1px solid #eaeaea; margin-top:16px; padding-top:16px; }
        .guarantee-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#374151; margin-bottom:8px; }

        /* ── Get Quote modal ──────────────────────────────────────────── */
        .qt-overlay     { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:400; display:flex; align-items:flex-end; justify-content:center; }
        .qt-sheet       { background:#fff; border-radius:20px 20px 0 0; width:100%; max-width:560px; max-height:92vh; overflow-y:auto; padding:0 0 env(safe-area-inset-bottom,16px); }
        .qt-handle      { width:40px; height:4px; background:#e5e7eb; border-radius:2px; margin:12px auto 0; }
        .qt-hdr         { display:flex; align-items:center; justify-content:space-between; padding:16px 24px 12px; border-bottom:1px solid #f1f5f9; }
        .qt-hdr h3      { font-size:17px; font-weight:900; color:#0A0A0A; margin:0; }
        .qt-close       { background:none; border:none; font-size:20px; cursor:pointer; color:#9ca3af; padding:4px 8px; border-radius:6px; }
        .qt-close:hover { background:#f1f5f9; color:#374151; }
        .qt-body        { padding:0 24px 24px; }
        .qt-label       { font-size:11px; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:.6px; margin:18px 0 8px; display:block; }
        .qt-chips       { display:flex; gap:8px; flex-wrap:wrap; }
        .qt-chip        { padding:8px 14px; border:1.5px solid #e5e7eb; border-radius:20px; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#374151; transition:all .15s; }
        .qt-chip.sel    { border-color:${RED}; background:#fff1f2; color:${RED}; }
        .qt-chips-v     { display:flex; flex-direction:column; gap:8px; }
        .qt-chip-v      { padding:10px 16px; border:1.5px solid #e5e7eb; border-radius:10px; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#374151; text-align:left; display:flex; justify-content:space-between; align-items:center; }
        .qt-chip-v.sel  { border-color:${RED}; background:#fff1f2; color:${RED}; }
        .qt-chip-v .qt-desc { font-size:11px; color:#9ca3af; font-weight:400; }
        .qt-chip-v.sel .qt-desc { color:#f87171; }
        .qt-calc-btn    { width:100%; padding:14px; background:#0A0A0A; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:15px; cursor:pointer; margin-top:22px; font-family:sans-serif; }
        .qt-result      { text-align:center; padding:24px 0 16px; }
        .qt-result-lbl  { font-size:12px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
        .qt-result-price{ font-size:52px; font-weight:900; color:${RED}; line-height:1; }
        .qt-result-sub  { font-size:13px; color:#71717A; margin-top:10px; line-height:1.6; }
        .qt-book-btn    { width:100%; padding:15px; background:${RED}; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:16px; cursor:pointer; margin-top:16px; font-family:sans-serif; }
        .qt-back        { width:100%; padding:11px; background:none; border:1.5px solid #eaeaea; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; margin-top:10px; color:#374151; font-family:sans-serif; }
        .qt-note        { font-size:11px; color:#9ca3af; text-align:center; margin-top:12px; }
        /* Get Quote button in booking card */
        .quote-btn      { width:100%; padding:15px; background:#0A0A0A; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:16px; cursor:pointer; transition:opacity .15s; margin-top:16px; font-family:sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; }
        .quote-btn:hover{ opacity:.88; }
        .booking-per-quote { font-size:11px; color:#9ca3af; margin:2px 0 20px; padding:6px 10px; background:#f8fafc; border-radius:6px; display:flex; align-items:center; gap:5px; }

        @media (max-width:700px) {
          .detail-layout { flex-direction:column; }
          .detail-right  { width:100%; position:static; }
          .booking-card  { position:static; }
          .detail-hero   { height:220px; border-radius:10px; }
          .rat-summary   { flex-direction:column; gap:12px; }
        }
      `}</style>

      <div className="detail-wrap">
        <button className="detail-back" onClick={() => router.back()}>← Back to Services</button>

        {/* Hero */}
        <div className="detail-hero">
          <img
            src={heroImg}
            alt={service.name}
            onError={e => { (e.target as HTMLImageElement).src = CATEGORY_IMAGES["Home Cleaning"]; }}
          />
          {isVerified && (
            <div style={{ position: "absolute", top: 14, left: 14, background: "#15803d", color: "#fff", fontSize: "12px", fontWeight: 800, padding: "5px 12px", borderRadius: "6px", display: "flex", alignItems: "center", gap: 6 }}>
              ✓ kasiFix Verified Provider
            </div>
          )}
        </div>

        <div className="detail-layout">
          {/* Left */}
          <div className="detail-left">
            <span className="detail-cat">{service.category}</span>
            <h1 className="detail-title">{service.name}</h1>

            {/* Vendor + rating */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <span className="detail-vendor" style={{ margin: 0 }}>
                {service.vendorProfile?.businessName || "Verified Provider"}
                {service.vendorProfile?.locationText ? ` · ${service.vendorProfile.locationText}` : ""}
              </span>
              {avgRating !== null && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Stars rating={avgRating} size={14} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{avgRating.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>({service.reviewCount} review{service.reviewCount !== 1 ? "s" : ""})</span>
                </span>
              )}
            </div>

            {/* Trust badges */}
            <div className="badge-row">
              {isVerified && <span className="badge badge-green">✓ kasiFix Verified</span>}
              <span className="badge badge-blue">🛡 Secure Booking</span>
              <span className="badge badge-amber">⏱ Quick Response</span>
              <span className="badge badge-green">✅ Satisfaction Guaranteed</span>
            </div>

            <p className="detail-desc">
              {service.description || "Professional and reliable service delivery. Our provider is experienced, vetted, and committed to delivering quality results every time."}
            </p>

            {/* What's included */}
            <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 800 }}>What&apos;s Included</h3>
              {[
                "Professional service delivery",
                "Experienced & background-checked provider",
                "Customer satisfaction guarantee",
                "Direct communication with the provider",
                "Easy rebooking if needed",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14, color: "#333" }}>
                  <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* About vendor */}
            {service.vendorProfile?.description && (
              <div style={{ border: "1.5px solid #eaeaea", borderRadius: 12, padding: 20, marginBottom: 28 }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800 }}>About the Provider</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{service.vendorProfile.description}</p>
              </div>
            )}

            {/* ── RATINGS & REVIEWS ── */}
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0A0A0A", margin: "0 0 18px" }}>
              Ratings &amp; Reviews
            </h2>

            {reviews.length > 0 ? (
              <>
                {/* Summary */}
                <div className="rat-summary">
                  <div className="rat-big">
                    <div className="rat-num">{avgRating!.toFixed(1)}</div>
                    <Stars rating={avgRating} size={18} />
                    <div className="rat-label">{service.reviewCount} review{service.reviewCount !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="rat-bars">
                    {hist.map(({ star, count }) => (
                      <RatingBar key={star} label={String(star)} count={count} total={reviews.length} color="#f59e0b" />
                    ))}
                  </div>
                </div>

                {/* Individual reviews */}
                {reviews.map((r: any) => (
                  <div key={r.id} className="rev-card">
                    <div className="rev-header">
                      <div>
                        <div className="rev-name">{clientName(r)}</div>
                        <Stars rating={r.rating} size={13} />
                      </div>
                      <div className="rev-date">{new Date(r.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}</div>
                    </div>
                    {r.comment && <p className="rev-comment">{r.comment}</p>}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "32px 20px", textAlign: "center", marginBottom: 24, color: "#71717A" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>No reviews yet</div>
                <div style={{ fontSize: 13 }}>Be the first to review this service after booking.</div>
              </div>
            )}

            {/* Leave a review */}
            <div className="rev-form-card">
              <div className="rev-form-title">Leave a Review</div>
              <div className="rev-form-sub">Booked this service? Share your experience to help others.</div>
              {revMsg && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600, background: revMsg.ok ? "#d1fae5" : "#fee2e2", color: revMsg.ok ? "#065f46" : "#991b1b" }}>
                  {revMsg.text}
                </div>
              )}
              <form onSubmit={handleReview}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".4px" }}>Your Rating *</label>
                  <Stars rating={myRating} size={28} interactive onRate={setMyRating} />
                  {myRating > 0 && (
                    <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>
                      {["","Poor","Fair","Good","Very good","Excellent"][myRating]}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Your Review (optional)</label>
                  <textarea
                    className="rev-textarea"
                    placeholder="Tell others what you experienced — was it clean? Professional? On time?"
                    value={myComment}
                    onChange={e => setMyComment(e.target.value)}
                  />
                </div>
                <button className="rev-submit" type="submit" disabled={revSaving}>
                  {revSaving ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            </div>

            <div style={{ borderTop: "1px solid #eaeaea", paddingTop: 20, marginTop: 24 }}>
              <Link href={`/services?category=${encodeURIComponent(service.category)}`} style={{ color: RED, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                Browse more {service.category} services →
              </Link>
            </div>
          </div>

          {/* Right — booking + trust */}
          <div className="detail-right">
            <div className="booking-card">
              {service.isDeal && (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "8px", padding: "8px 12px", marginBottom: "14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔥</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#92400e" }}>Limited Deal</div>
                    {service.originalPrice && (
                      <div style={{ fontSize: 12, color: "#b45309" }}>
                        Save R {(Number(service.originalPrice) - Number(service.price)).toFixed(2)} off normal price
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="booking-price">
                {isQuotable ? "From " : ""}R {Number(service.price).toFixed(2)}
                {service.isDeal && service.originalPrice && (
                  <span style={{ fontSize: 16, fontWeight: 400, color: "#9ca3af", textDecoration: "line-through", marginLeft: 10 }}>
                    R {Number(service.originalPrice).toFixed(2)}
                  </span>
                )}
              </div>
              {isQuotable ? (
                <div className="booking-per-quote">
                  📐 Price depends on property size — get an instant quote below
                </div>
              ) : (
                <div className="booking-per">Starting price per session</div>
              )}

              {avgRating !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                  <Stars rating={avgRating} size={13} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{avgRating.toFixed(1)}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>({service.reviewCount})</span>
                </div>
              )}

              <div className="booking-row"><span style={{ color: "#71717A" }}>Service</span><span style={{ fontWeight: 600, textAlign: "right", maxWidth: 130 }}>{service.name}</span></div>
              <div className="booking-row"><span style={{ color: "#71717A" }}>Provider</span><span style={{ fontWeight: 600 }}>{service.vendorProfile?.businessName || "Verified"}</span></div>
              {service.vendorProfile?.locationText && (
                <div className="booking-row"><span style={{ color: "#71717A" }}>Location</span><span style={{ fontWeight: 600, textAlign: "right", maxWidth: 130 }}>{service.vendorProfile.locationText}</span></div>
              )}
              <div className="booking-div" />
              <div className="booking-row" style={{ fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: RED }}>R {Number(service.price).toFixed(2)}</span>
              </div>

              {isQuotable ? (
                <>
                  <button className="quote-btn" onClick={() => { setQuoteOpen(true); setQuoteStep("form"); }}>
                    📋 Get My Quote
                  </button>
                  {cartAdded ? (
                    <Link href="/cart" className="in-cart-btn" style={{ marginTop: "10px" }}>✓ Added — View Booking</Link>
                  ) : (
                    <button className="add-cart-btn" onClick={addToBooking} style={{ background: RED, opacity: 0.85, marginTop: "10px" }}>
                      + Add at Base Price
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button className="add-cart-btn" onClick={bookNow} style={{ background: "#0A0A0A", marginTop: "16px" }}>
                    ⚡ Book Now
                  </button>
                  {cartAdded ? (
                    <Link href="/cart" className="in-cart-btn" style={{ marginTop: "10px" }}>✓ Added — View Booking</Link>
                  ) : (
                    <button className="add-cart-btn" onClick={addToBooking} style={{ background: RED, opacity: 0.9 }}>
                      + Add to Booking
                    </button>
                  )}
                </>
              )}

              <button className={`fav-toggle${isFav ? " on" : ""}`} onClick={toggleFav}>
                {isFav ? "♥ Saved to Favourites" : "♡ Save to Favourites"}
              </button>

              {!isLoggedIn && (
                <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", margin: "10px 0 0" }}>
                  <Link href="/login" style={{ color: RED, fontWeight: 700 }}>Sign in</Link> to save your booking history and track orders.
                </p>
              )}

              {cartToast && (
                <div className="cart-toast">
                  ✓ Added to booking!
                  <Link href="/cart" style={{ color: "#f59e0b", fontWeight: 800, textDecoration: "none", fontSize: 13 }}>View Booking →</Link>
                </div>
              )}

              {/* Platform guarantees */}
              <div className="guarantees">
                {[
                  { icon: "🛡", text: "Secure & encrypted payment" },
                  { icon: "✅", text: "Satisfaction guaranteed" },
                  { icon: "📞", text: "24/7 customer support" },
                  { icon: "🔄", text: "Free rebooking if unsatisfied" },
                ].map(g => (
                  <div key={g.text} className="guarantee-item">
                    <span>{g.icon}</span><span>{g.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor trust card */}
            <div className="vendor-trust" style={{ marginTop: 16 }}>
              <div className="vt-title">About the Provider</div>
              {isVerified && (
                <div className="vt-row">
                  <div className="vt-icon">✓</div>
                  <span style={{ color: "#15803d", fontWeight: 700 }}>kasiFix Verified Business</span>
                </div>
              )}
              {[
                { icon: "🪪", text: "ID & credentials verified" },
                { icon: "🔒", text: "Background checked" },
                { icon: "⭐", text: avgRating !== null ? `${avgRating.toFixed(1)} average rating` : "New provider" },
                { icon: "📍", text: service.vendorProfile?.locationText || "South Africa" },
              ].map(item => (
                <div key={item.text} className="vt-row">
                  <div className="vt-icon">{item.icon}</div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Get Quote modal ──────────────────────────────────────────────── */}
      {quoteOpen && (
        <div className="qt-overlay" onClick={() => setQuoteOpen(false)}>
          <div className="qt-sheet" onClick={e => e.stopPropagation()}>
            <div className="qt-handle" />

            <div className="qt-hdr">
              <h3>
                {service?.category === "Home Cleaning" ? "🧹 Get a Cleaning Quote" : "🔧 Get a Trade Quote"}
              </h3>
              <button className="qt-close" onClick={() => setQuoteOpen(false)}>✕</button>
            </div>

            <div className="qt-body">
              {quoteStep === "form" ? (
                <>
                  {service?.category === "Home Cleaning" ? (
                    <>
                      {/* Bedrooms */}
                      <span className="qt-label">Property size</span>
                      <div className="qt-chips">
                        {["Studio", "1", "2", "3", "4+"].map(v => (
                          <button key={v} className={"qt-chip" + (qBeds === v ? " sel" : "")} onClick={() => setQBeds(v)}>
                            {v === "Studio" ? "Studio" : `${v} Bed`}
                          </button>
                        ))}
                      </div>

                      {/* Bathrooms */}
                      <span className="qt-label">Bathrooms</span>
                      <div className="qt-chips">
                        {["1", "2", "3+"].map(v => (
                          <button key={v} className={"qt-chip" + (qBaths === v ? " sel" : "")} onClick={() => setQBaths(v)}>
                            {v} Bath{v !== "1" ? "s" : ""}
                          </button>
                        ))}
                      </div>

                      {/* Clean type */}
                      <span className="qt-label">Type of clean</span>
                      <div className="qt-chips-v">
                        {[
                          { v: "Standard Clean",    d: "Regular dust, sweep & mop" },
                          { v: "Deep Clean",        d: "Full scrub, inside appliances, windows" },
                          { v: "Move In/Out Clean", d: "Thorough end-of-lease or new-home clean" },
                        ].map(({ v, d }) => (
                          <button key={v} className={"qt-chip-v" + (qClean === v ? " sel" : "")} onClick={() => setQClean(v)}>
                            <span>{v}</span>
                            <span className="qt-desc">{d}</span>
                          </button>
                        ))}
                      </div>

                      {/* Frequency */}
                      <span className="qt-label">How often?</span>
                      <div className="qt-chips">
                        {[
                          { v: "Once-off", discount: "" },
                          { v: "Monthly",   discount: "5% off" },
                          { v: "Bi-weekly", discount: "10% off" },
                          { v: "Weekly",    discount: "15% off" },
                        ].map(({ v, discount }) => (
                          <button key={v} className={"qt-chip" + (qFreq === v ? " sel" : "")} onClick={() => setQFreq(v)}>
                            {v}{discount ? ` · ${discount}` : ""}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Job size */}
                      <span className="qt-label">Job size</span>
                      <div className="qt-chips-v">
                        {[
                          { v: "Small",      d: "Quick fix, under 2 hours" },
                          { v: "Medium",     d: "Half day, moderate complexity" },
                          { v: "Large",      d: "Full day, skilled work required" },
                          { v: "Very Large", d: "Multi-day or complex project" },
                        ].map(({ v, d }) => (
                          <button key={v} className={"qt-chip-v" + (qJobSize === v ? " sel" : "")} onClick={() => setQJobSize(v)}>
                            <span>{v}</span>
                            <span className="qt-desc">{d}</span>
                          </button>
                        ))}
                      </div>

                      {/* Urgency */}
                      <span className="qt-label">How urgent?</span>
                      <div className="qt-chips">
                        {[
                          { v: "Not urgent",      extra: "" },
                          { v: "Within a week",   extra: "" },
                          { v: "Within 48 hours", extra: "+R250" },
                          { v: "Emergency",       extra: "+R500" },
                        ].map(({ v, extra }) => (
                          <button key={v} className={"qt-chip" + (qUrgency === v ? " sel" : "")} onClick={() => setQUrgency(v)}>
                            {v}{extra ? ` · ${extra}` : ""}
                          </button>
                        ))}
                      </div>

                      {/* Materials */}
                      <span className="qt-label">Materials</span>
                      <div className="qt-chips">
                        {[
                          { v: "Not included", d: "You supply materials" },
                          { v: "Included",     d: "Provider supplies (+35%)" },
                        ].map(({ v, d }) => (
                          <button key={v} className={"qt-chip" + (qMaterials === v ? " sel" : "")} onClick={() => setQMaterials(v)}>
                            {v} <span style={{ fontSize: 11, color: "inherit", opacity: .7 }}>· {d}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <button className="qt-calc-btn" onClick={calcQuote}>
                    Calculate My Price →
                  </button>
                  <p className="qt-note">Instant estimate — confirm exact price with the provider</p>
                </>
              ) : (
                /* ── Result step ── */
                <>
                  <div className="qt-result">
                    <div className="qt-result-lbl">Your estimated price</div>
                    <div className="qt-result-price">R {quotedPrice.toFixed(2)}</div>
                    <div className="qt-result-sub">
                      {service?.category === "Home Cleaning"
                        ? `${qBeds === "Studio" ? "Studio" : qBeds + " Bed"} · ${qBaths} Bath · ${qClean} · ${qFreq}`
                        : `${qJobSize} job · ${qUrgency} · Materials ${qMaterials}`}
                      <br />
                      <span style={{ fontSize: 11 }}>Final price confirmed at time of booking</span>
                    </div>
                  </div>

                  <button className="qt-book-btn" onClick={bookWithQuote}>
                    ⚡ Book Now — R {quotedPrice.toFixed(2)}
                  </button>
                  <button className="qt-back" onClick={() => setQuoteStep("form")}>
                    ← Change details
                  </button>
                  <p className="qt-note">Adding to booking at quoted price. Provider will confirm on contact.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
