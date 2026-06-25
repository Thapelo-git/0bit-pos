"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "../../../src/shared/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const CATEGORIES = [
  "All",
  "Home Cleaning",
  "Fitness & Wellness",
  "Personal Services",
  "Home Maintenance & Trades",
  "Professional Training & Coaching",
  "Other Local Services",
];

const PLACEHOLDER_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=600&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop",
  "Other Local Services":             "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
};

function getImage(category: string) {
  return PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES["Other Local Services"];
}

function Stars({ rating, size = 14 }: { rating: number | null; size?: number }) {
  const r = rating ?? 0;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(r) ? "#f59e0b" : "#d1d5db", lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

function ServicesContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { addItem, isInCart } = useCart();
  const initCategory  = searchParams.get("category") || "All";
  const initSearch    = searchParams.get("search")   || "";

  const [services,    setServices]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [category,    setCategory]    = useState(initCategory);
  const [search,      setSearch]      = useState(initSearch);
  const [minPrice,    setMinPrice]    = useState(Number(searchParams.get("minPrice") || 0));
  const [maxPrice,    setMaxPrice]    = useState(Number(searchParams.get("maxPrice") || 0));
  const [page,        setPage]        = useState(1);

  // AI Smart Search
  const [aiOpen,      setAiOpen]      = useState(false);
  const [aiQuery,     setAiQuery]     = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiResults,   setAiResults]   = useState<{ data: any[]; meta: { category: string; interpretation: string; keywords: string[] } } | null>(null);

  const runAiSearch = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResults(null);
    try {
      const res  = await fetch(`${API}/ai/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: aiQuery.trim() }) });
      const json = await res.json();
      if (json.status === "success") setAiResults({ data: json.data || [], meta: json.meta });
    } catch { /* swallow */ }
    finally { setAiLoading(false); }
  };

  const PER_PAGE = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    const qs = params.toString();
    fetch(`${API}/clients/services/search${qs ? `?${qs}` : ""}`)
      .then(r => r.json())
      .then(j => { if (j.status === "success") setServices(j.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  // Keep state in sync when searchParams change externally (e.g. from layout search / price filter)
  useEffect(() => {
    const c   = searchParams.get("category") || "All";
    const s   = searchParams.get("search")   || "";
    const min = Number(searchParams.get("minPrice") || 0);
    const max = Number(searchParams.get("maxPrice") || 0);
    setCategory(c);
    setSearch(s);
    setMinPrice(min);
    setMaxPrice(max);
    setPage(1);
  }, [searchParams]);

  const filtered = services.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      const match = s.name?.toLowerCase().includes(q) ||
                    s.description?.toLowerCase().includes(q) ||
                    s.vendorProfile?.businessName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (minPrice > 0 && Number(s.price) < minPrice) return false;
    if (maxPrice > 0 && Number(s.price) > maxPrice) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleCategoryChange = (cat: string) => {
    setPage(1);
    setCategory(cat);
    const params = new URLSearchParams();
    if (cat !== "All") params.set("category", cat);
    if (search) params.set("search", search);
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    const qs = params.toString();
    router.push(`/services${qs ? `?${qs}` : ""}`);
  };


  return (
    <>
      <style>{`
        .svc-page         { }
        .svc-hero         { background:#0A0A0A; border-radius:12px; padding:32px; margin-bottom:28px; }
        .svc-hero-h1      { color:#fff; margin:0 0 8px; font-size:clamp(22px,4vw,32px); font-weight:900; }
        .svc-hero-sub     { color:rgba(255,255,255,.6); margin:0 0 16px; font-size:14px; }

        .svc-filter-row   { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:28px; }
        .svc-filter-btn   { padding:8px 16px; border-radius:20px; border:1.5px solid #eaeaea; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#0A0A0A; transition:all .15s; white-space:nowrap; }
        .svc-filter-btn:hover  { border-color:${RED}; color:${RED}; }
        .svc-filter-btn.active { background:${RED}; color:#fff; border-color:${RED}; }

        .svc-count        { font-size:13px; color:#71717A; margin-bottom:16px; }

        .svc-grid         { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
        .svc-card         { background:#fff; border:1.5px solid #eaeaea; border-radius:12px; overflow:hidden; cursor:pointer; transition:border-color .15s, box-shadow .15s; text-decoration:none; color:inherit; display:block; }
        .svc-card:hover   { border-color:${RED}; box-shadow:0 4px 20px rgba(220,20,60,.1); }
        .svc-card-img     { height:160px; overflow:hidden; background:#f1f5f9; }
        .svc-card-img img { width:100%; height:100%; object-fit:cover; display:block; }
        .svc-card-body    { padding:16px; }
        .svc-card-cat     { display:inline-block; background:#fee2e2; color:${RED}; border-radius:4px; padding:2px 8px; font-size:11px; font-weight:700; margin-bottom:8px; }
        .svc-card-name    { font-weight:700; font-size:15px; color:#0A0A0A; margin-bottom:4px; }
        .svc-card-vendor  { font-size:12px; color:#71717A; margin-bottom:6px; display:flex; align-items:center; gap:5px; }
        .svc-verified     { background:#dcfce7; color:#15803d; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; }
        .svc-stars        { display:flex; align-items:center; gap:4px; margin-bottom:10px; }
        .svc-star-val     { font-size:12px; font-weight:700; color:#374151; }
        .svc-star-count   { font-size:11px; color:#9ca3af; }
        .svc-card-price   { font-weight:800; font-size:20px; color:${RED}; }
        .svc-card-book    { float:right; background:${RED}; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; text-decoration:none; }

        /* AI search */
        .ai-toggle      { display:inline-flex; align-items:center; gap:6px; margin-top:16px; padding:9px 18px; border-radius:20px; border:1.5px solid rgba(255,255,255,.25); background:rgba(255,255,255,.07); color:#fff; font-size:13px; font-weight:700; cursor:pointer; transition:background .15s; }
        .ai-toggle:hover{ background:rgba(255,255,255,.14); }
        .ai-toggle.open { background:#f59e0b; border-color:#f59e0b; color:#0A0A0A; }
        .ai-box         { margin-top:14px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); border-radius:10px; padding:16px; }
        .ai-textarea    { width:100%; box-sizing:border-box; background:rgba(255,255,255,.95); border:none; border-radius:7px; padding:12px 14px; font-size:14px; font-family:sans-serif; resize:none; outline:none; color:#0A0A0A; }
        .ai-actions     { display:flex; align-items:center; gap:10px; margin-top:10px; }
        .ai-submit      { padding:10px 22px; background:#f59e0b; border:none; border-radius:7px; font-weight:800; font-size:13px; cursor:pointer; color:#0A0A0A; font-family:sans-serif; }
        .ai-submit:disabled { opacity:.6; cursor:not-allowed; }
        .ai-hint        { font-size:11px; color:rgba(255,255,255,.5); flex:1; }
        .ai-banner      { background:#fef3c7; border:1px solid #fde68a; border-radius:10px; padding:14px 16px; margin-bottom:20px; display:flex; align-items:flex-start; gap:10px; }
        .ai-banner-icon { font-size:22px; flex-shrink:0; }
        .ai-banner-body { font-family:sans-serif; }
        .ai-banner-title{ font-weight:800; font-size:14px; color:#92400e; margin-bottom:3px; }
        .ai-banner-sub  { font-size:12px; color:#b45309; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .ai-chip        { background:#fde68a; color:#92400e; border-radius:20px; padding:2px 10px; font-weight:700; font-size:11px; }
        .ai-clear       { background:none; border:none; color:#b45309; font-size:12px; font-weight:600; cursor:pointer; padding:0; text-decoration:underline; margin-left:auto; }

        .svc-empty        { text-align:center; padding:60px 20px; color:#71717A; }
        .svc-empty-h3     { font-size:18px; font-weight:700; margin-bottom:8px; color:#0A0A0A; }
        .svc-skeleton     { background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px; height:280px; }
        @keyframes shimmer { to { background-position:-200% 0; } }

        .svc-pagination   { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:36px; flex-wrap:wrap; }
        .pg-btn           { padding:8px 14px; border:1.5px solid #eaeaea; background:#fff; border-radius:7px; font-size:13px; font-weight:700; cursor:pointer; color:#374151; transition:all .15s; min-width:38px; }
        .pg-btn:hover     { border-color:${RED}; color:${RED}; }
        .pg-btn.active    { background:${RED}; color:#fff; border-color:${RED}; }
        .pg-btn:disabled  { opacity:.4; cursor:not-allowed; }
        .pg-info          { font-size:13px; color:#71717A; font-weight:600; padding:0 6px; }

        @media (max-width:640px) {
          .svc-hero         { padding:20px 16px; }
          .svc-grid         { grid-template-columns:1fr 1fr; gap:12px; }
          .svc-card-img     { height:120px; }
          .svc-card-body    { padding:12px; }
          .svc-card-price   { font-size:16px; }
          .svc-card-book    { display:none; }
          .ai-toggle        { font-size:12px; padding:7px 14px; }
        }
        @media (max-width:400px) {
          .svc-grid         { grid-template-columns:1fr; }
        }
      `}</style>

      {/* Hero */}
      <div className="svc-hero">
        <h1 className="svc-hero-h1">Browse All Services</h1>
        <p className="svc-hero-sub">Find trusted professionals across South Africa</p>

        {search && (
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, margin: "0 0 4px" }}>
            Results for &ldquo;<strong style={{ color: "#fff" }}>{search}</strong>&rdquo;
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(1); const p = new URLSearchParams(); if (category !== "All") p.set("category", category); const q = p.toString(); router.push("/services" + (q ? "?" + q : "")); }}
              style={{ marginLeft: 10, background: "none", border: "none", color: "rgba(255,255,255,.55)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >✕ clear</button>
          </p>
        )}

        <button
          className={`ai-toggle${aiOpen ? " open" : ""}`}
          onClick={() => { setAiOpen(o => !o); setAiResults(null); }}
        >
          {aiOpen ? "✕ Close" : "✨ Smart Search"}
        </button>

        {aiOpen && (
          <div className="ai-box">
            <textarea
              className="ai-textarea"
              rows={2}
              placeholder='Describe what you need — e.g. "I want a personal trainer" or "my roof is leaking"'
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAiSearch(); } }}
            />
            <div className="ai-actions">
              <button className="ai-submit" onClick={runAiSearch} disabled={aiLoading || !aiQuery.trim()}>
                {aiLoading ? "Thinking…" : "🔍 Search with AI"}
              </button>
              <span className="ai-hint">Detects category from your words</span>
            </div>
          </div>
        )}
      </div>

      {/* AI result banner */}
      {aiResults && (
        <div className="ai-banner">
          <span className="ai-banner-icon">🤖</span>
          <div className="ai-banner-body">
            <div className="ai-banner-title">AI understood: &ldquo;{aiResults.meta.interpretation}&rdquo;</div>
            <div className="ai-banner-sub">
              {aiResults.meta.category && <span className="ai-chip">📂 {aiResults.meta.category}</span>}
              {aiResults.meta.keywords.map(k => <span key={k} className="ai-chip">{k}</span>)}
              <span>{aiResults.data.length} service{aiResults.data.length !== 1 ? "s" : ""} found</span>
            </div>
          </div>
          <button className="ai-clear" onClick={() => setAiResults(null)}>✕ Clear</button>
        </div>
      )}

      {/* Category filters */}
      <div className="svc-filter-row">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`svc-filter-btn${category === cat ? " active" : ""}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count — hides when AI results are active */}
      {!aiResults && (
        <p className="svc-count">
          {loading ? "Loading..." : (
            <>
              {filtered.length} service{filtered.length !== 1 ? "s" : ""} found
              {category !== "All" ? ` in "${category}"` : ""}
              {search ? ` for "${search}"` : ""}
              {(minPrice > 0 || maxPrice > 0) ? ` · Price: R${minPrice || 0}–${maxPrice || "∞"}` : ""}
              {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
            </>
          )}
        </p>
      )}

      {/* Grid — AI results take priority when active */}
      {aiLoading ? (
        <div className="svc-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="svc-skeleton" />)}
        </div>
      ) : aiResults ? (
        aiResults.data.length === 0 ? (
          <div className="svc-empty">
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
            <h3 className="svc-empty-h3">No {aiResults.meta.category || "matching"} services yet</h3>
            <p style={{ marginBottom: 8 }}>
              AI matched your search to <strong>{aiResults.meta.category || "a category"}</strong> but no providers have listed services there yet.
            </p>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>Try browsing all services or a different category.</p>
            <button onClick={() => setAiResults(null)} style={{ background: RED, color: "#fff", border: "none", padding: "10px 24px", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>
              Browse All Services
            </button>
          </div>
        ) : (
          <div className="svc-grid">
            {aiResults.data.map((svc: any) => (
              <Link key={svc.id} href={`/services/${svc.id}`} className="svc-card">
                <div className="svc-card-img" style={{ position: "relative" }}>
                  <img src={svc.imageUrl || getImage(svc.category)} alt={svc.name} onError={e => { (e.target as HTMLImageElement).src = getImage(svc.category); }} />
                  {svc.isDeal && <span style={{ position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px" }}>🔥 DEAL</span>}
                </div>
                <div className="svc-card-body">
                  <span className="svc-card-cat">{svc.category}</span>
                  <div className="svc-card-name">{svc.name}</div>
                  <div className="svc-card-vendor">
                    {svc.vendorProfile?.businessName}
                    {svc.vendorProfile?.isVerified && <span className="svc-verified">✓ Verified</span>}
                  </div>
                  {svc.reviewCount > 0 && (
                    <div className="svc-stars">
                      <Stars rating={svc.avgRating} />
                      <span className="svc-star-val">{Number(svc.avgRating).toFixed(1)}</span>
                      <span className="svc-star-count">({svc.reviewCount})</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="svc-card-price">R {Number(svc.price).toFixed(2)}</span>
                    <button className="svc-card-book" onClick={e => { e.preventDefault(); addItem({ id: svc.id, name: svc.name, price: Number(svc.price), category: svc.category, imageUrl: svc.imageUrl, vendorName: svc.vendorProfile?.businessName }); }}>
                      {isInCart(svc.id) ? "✓ Added" : "+ Booking"}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : loading ? (
        <div className="svc-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="svc-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="svc-empty">
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 className="svc-empty-h3">No services found</h3>
          <p>Try a different category or search term.</p>
          <button
            onClick={() => { setCategory("All"); setSearch(""); setMinPrice(0); setMaxPrice(0); setPage(1); router.push("/services"); }}
            style={{ marginTop: "16px", background: RED, color: "#fff", border: "none", padding: "10px 24px", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="svc-grid">
          {paged.map(svc => (
            <Link key={svc.id} href={`/services/${svc.id}`} className="svc-card">
              <div style={{ position: "relative" }}>
                <div className="svc-card-img">
                  <img
                    src={svc.imageUrl || getImage(svc.category)}
                    alt={svc.name}
                    onError={e => { (e.target as HTMLImageElement).src = getImage(svc.category); }}
                  />
                </div>
                {svc.isDeal && (
                  <span style={{ position: "absolute", top: 8, right: 8, background: "#f59e0b", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px" }}>
                    🔥 DEAL
                  </span>
                )}
                {svc.vendorProfile?.isVerified && (
                  <span style={{ position: "absolute", top: 8, left: 8, background: "#15803d", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "4px", display: "flex", alignItems: "center", gap: 4 }}>
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="svc-card-body">
                <span className="svc-card-cat">{svc.category}</span>
                <div className="svc-card-name">{svc.name}</div>
                <div className="svc-card-vendor">
                  {svc.vendorProfile?.businessName || "Verified Provider"}
                  {svc.vendorProfile?.isVerified && <span className="svc-verified">✓ Verified</span>}
                </div>
                {svc.reviewCount > 0 ? (
                  <div className="svc-stars">
                    <Stars rating={svc.avgRating} size={12} />
                    <span className="svc-star-val">{Number(svc.avgRating).toFixed(1)}</span>
                    <span className="svc-star-count">({svc.reviewCount})</span>
                  </div>
                ) : (
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "10px" }}>No reviews yet</div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span className="svc-card-price">R {Number(svc.price).toFixed(2)}</span>
                    {svc.isDeal && svc.originalPrice && (
                      <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through", marginLeft: 5 }}>
                        R {Number(svc.originalPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    className="svc-card-book"
                    style={{ background: isInCart(svc.id) ? "#16a34a" : undefined }}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      addItem({
                        id: svc.id, name: svc.name, price: Number(svc.price),
                        category: svc.category, imageUrl: svc.imageUrl,
                        vendorName: svc.vendorProfile?.businessName,
                      });
                    }}
                  >
                    {isInCart(svc.id) ? "✓ Added" : "Add to Booking"}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="svc-pagination">
          <button
            className="pg-btn"
            disabled={page === 1}
            onClick={() => { setPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >«</button>
          <button
            className="pg-btn"
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >‹ Prev</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
            .reduce<(number | "…")[]>((acc, n, i, arr) => {
              if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(n);
              return acc;
            }, [])
            .map((item, i) =>
              item === "…"
                ? <span key={`ellipsis-${i}`} className="pg-info">…</span>
                : <button key={item} className={`pg-btn${page === item ? " active" : ""}`} onClick={() => { setPage(item as number); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{item}</button>
            )
          }

          <button
            className="pg-btn"
            disabled={page === totalPages}
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >Next ›</button>
          <button
            className="pg-btn"
            disabled={page === totalPages}
            onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >»</button>
        </div>
      )}
    </>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#71717A" }}>Loading services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
