"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";
const FAV_KEY = "kasifix_favorites";

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=400&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400&auto=format&fit=crop",
};
const fallback = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop";

interface FavItem {
  id: string; name: string; price: number; category: string;
  imageUrl?: string; vendorName?: string;
}

export default function FavoritesPage() {
  const [auth,    setAuth]    = useState<{ userId: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [favs,    setFavs]    = useState<FavItem[]>([]);

  // Auth check
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.status === "success" && j.data?.user) {
          setAuth({ userId: j.data.user.id, email: j.data.user.email });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load favorites from localStorage once auth is known
  useEffect(() => {
    if (!auth) return;
    try {
      const key = `${FAV_KEY}_${auth.userId}`;
      const raw = localStorage.getItem(key);
      setFavs(raw ? JSON.parse(raw) : []);
    } catch {}
  }, [auth]);

  const removeFav = (id: string) => {
    if (!auth) return;
    const next = favs.filter(f => f.id !== id);
    setFavs(next);
    try { localStorage.setItem(`${FAV_KEY}_${auth.userId}`, JSON.stringify(next)); } catch {}
  };

  if (loading) return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "sans-serif", color: "#71717A" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>Loading…
    </div>
  );

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!auth) {
    return (
      <>
        <style>{`
          .fav-gate  { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; font-family:sans-serif; }
          .fav-icon  { font-size:72px; margin-bottom:20px; }
          .fav-h1    { font-size:26px; font-weight:900; color:#0A0A0A; margin:0 0 12px; }
          .fav-p     { font-size:15px; color:#71717A; max-width:380px; margin:0 0 32px; line-height:1.7; }
          .fav-btns  { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
          .fav-btn-p { background:${RED}; color:#fff; padding:13px 28px; border-radius:8px; font-weight:800; font-size:15px; text-decoration:none; }
          .fav-btn-s { border:1.5px solid #eaeaea; color:#374151; padding:13px 28px; border-radius:8px; font-weight:700; font-size:15px; text-decoration:none; }
        `}</style>
        <div className="fav-gate">
          <div className="fav-icon">♡</div>
          <h1 className="fav-h1">Sign in to see your favourites</h1>
          <p className="fav-p">
            Save the services you love and access them from any device.
            Your favourites are waiting for you — just sign in to view them.
          </p>
          <div className="fav-btns">
            <Link href="/login?redirect=/favorites" className="fav-btn-p">Sign In</Link>
            <Link href="/services" className="fav-btn-s">Browse Services</Link>
          </div>
        </div>
      </>
    );
  }

  // ── Empty favourites ─────────────────────────────────────────────────────────
  if (favs.length === 0) {
    return (
      <>
        <style>{`
          .fav-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; font-family:sans-serif; }
        `}</style>
        <div className="fav-empty">
          <div style={{ fontSize: "72px", marginBottom: 20 }}>🤍</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0A0A0A", margin: "0 0 10px" }}>No favourites yet</h1>
          <p style={{ fontSize: 15, color: "#71717A", maxWidth: 360, margin: "0 0 28px", lineHeight: 1.7 }}>
            Tap the ♡ heart on any service to save it here for later.
          </p>
          <Link href="/services" style={{ background: RED, color: "#fff", padding: "13px 28px", borderRadius: 8, fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
            Browse Services
          </Link>
        </div>
      </>
    );
  }

  // ── Favourites list ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .fav-wrap      { font-family:sans-serif; }
        .fav-title     { font-size:clamp(22px,4vw,30px); font-weight:900; color:#0A0A0A; margin:0 0 6px; }
        .fav-sub       { font-size:14px; color:#71717A; margin:0 0 28px; }
        .fav-grid      { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:18px; }
        .fav-card      { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; overflow:hidden; }
        .fav-img       { width:100%; height:160px; object-fit:cover; display:block; }
        .fav-body      { padding:14px; }
        .fav-cat       { display:inline-block; background:#fee2e2; color:${RED}; border-radius:4px; padding:2px 8px; font-size:11px; font-weight:700; margin-bottom:6px; }
        .fav-name      { font-size:14px; font-weight:800; color:#0A0A0A; margin-bottom:4px; }
        .fav-vendor    { font-size:12px; color:#71717A; margin-bottom:12px; }
        .fav-row       { display:flex; align-items:center; justify-content:space-between; }
        .fav-price     { font-size:18px; font-weight:900; color:${RED}; }
        .fav-actions   { display:flex; gap:6px; }
        .fav-book      { background:${RED}; color:#fff; border:none; padding:7px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; text-decoration:none; }
        .fav-remove    { background:#f1f5f9; color:#374151; border:none; padding:7px 10px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; }
        .fav-remove:hover { background:#fee2e2; color:#991b1b; }
      `}</style>

      <div className="fav-wrap">
        <h1 className="fav-title">My Favourites</h1>
        <p className="fav-sub">{favs.length} saved service{favs.length !== 1 ? "s" : ""}</p>
        <div className="fav-grid">
          {favs.map(fav => (
            <div key={fav.id} className="fav-card">
              <img
                className="fav-img"
                src={fav.imageUrl || CATEGORY_IMAGES[fav.category] || fallback}
                alt={fav.name}
                onError={e => { (e.target as HTMLImageElement).src = fallback; }}
              />
              <div className="fav-body">
                <span className="fav-cat">{fav.category}</span>
                <div className="fav-name">{fav.name}</div>
                {fav.vendorName && <div className="fav-vendor">by {fav.vendorName}</div>}
                <div className="fav-row">
                  <span className="fav-price">R {Number(fav.price).toFixed(2)}</span>
                  <div className="fav-actions">
                    <Link href={`/services/${fav.id}`} className="fav-book">Book</Link>
                    <button className="fav-remove" onClick={() => removeFav(fav.id)} title="Remove from favourites">✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
