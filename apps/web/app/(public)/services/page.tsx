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
  const [localSearch, setLocalSearch] = useState(initSearch);
  const [minPrice,    setMinPrice]    = useState(Number(searchParams.get("minPrice") || 0));
  const [maxPrice,    setMaxPrice]    = useState(Number(searchParams.get("maxPrice") || 0));
  const [page,        setPage]        = useState(1);

  const PER_PAGE = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", encodeURIComponent(category));
    fetch(`${API}/clients/services/search${params.size ? `?${params}` : ""}`)
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
    setLocalSearch(s);
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
    router.push(`/services${params.size ? `?${params}` : ""}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(localSearch);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (localSearch) params.set("search", localSearch);
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));
    router.push(`/services${params.size ? `?${params}` : ""}`);
  };

  return (
    <>
      <style>{`
        .svc-page         { }
        .svc-hero         { background:#0A0A0A; border-radius:12px; padding:32px; margin-bottom:28px; }
        .svc-hero-h1      { color:#fff; margin:0 0 8px; font-size:clamp(22px,4vw,32px); font-weight:900; }
        .svc-hero-sub     { color:rgba(255,255,255,.6); margin:0 0 20px; font-size:14px; }
        .svc-search-row   { display:flex; gap:0; max-width:520px; }
        .svc-search-input { flex:1; padding:12px 16px; border:none; border-radius:6px 0 0 6px; font-size:14px; outline:none; }
        .svc-search-btn   { background:${RED}; color:#fff; border:none; padding:12px 20px; border-radius:0 6px 6px 0; font-weight:700; cursor:pointer; }

        .svc-filter-row   { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:28px; }
        .svc-filter-btn   { padding:8px 16px; border-radius:20px; border:1.5px solid #eaeaea; background:#fff; font-size:13px; font-weight:600; cursor:pointer; color:#0A0A0A; transition:all .15s; white-space:nowrap; }
        .svc-filter-btn:hover  { border-color:${RED}; color:${RED}; }
        .svc-filter-btn.active { background:${RED}; color:#fff; border-color:${RED}; }

        .svc-count        { font-size:13px; color:#71717A; margin-bottom:16px; }

        .svc-grid         { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
        .svc-card         { background:#fff; border:1.5px solid #eaeaea; border-radius:12px; overflow:hidden; cursor:pointer; transition:border-color .15s, box-shadow .15s; text-decoration:none; color:inherit; display:block; }
        .svc-card:hover   { border-color:${RED}; box-shadow:0 4px 20px rgba(220,20,60,.1); }
        .svc-card-img     { height:160px; background-size:cover; background-position:center; }
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
          .svc-hero         { padding:24px 20px; }
          .svc-search-row   { max-width:100%; }
          .svc-grid         { grid-template-columns:1fr 1fr; gap:12px; }
          .svc-card-img     { height:120px; }
          .svc-card-body    { padding:12px; }
          .svc-card-price   { font-size:16px; }
          .svc-card-book    { display:none; }
        }
        @media (max-width:400px) {
          .svc-grid         { grid-template-columns:1fr; }
        }
      `}</style>

      {/* Hero + Search */}
      <div className="svc-hero">
        <h1 className="svc-hero-h1">Browse All Services</h1>
        <p className="svc-hero-sub">Find trusted local professionals across South Africa</p>
        <form className="svc-search-row" onSubmit={handleSearch}>
          <input
            className="svc-search-input"
            type="text"
            placeholder="Search by service name or provider..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
          />
          <button className="svc-search-btn" type="submit">Search</button>
        </form>
      </div>

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

      {/* Count */}
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

      {/* Grid */}
      {loading ? (
        <div className="svc-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="svc-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="svc-empty">
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 className="svc-empty-h3">No services found</h3>
          <p>Try a different category or search term.</p>
          <button
            onClick={() => { setCategory("All"); setSearch(""); setLocalSearch(""); setMinPrice(0); setMaxPrice(0); setPage(1); router.push("/services"); }}
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
                <div className="svc-card-img" style={{ backgroundImage: `url(${svc.imageUrl || getImage(svc.category)})` }} />
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
                  <span className="svc-card-price">R {Number(svc.price).toFixed(2)}</span>
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
                    {isInCart(svc.id) ? "✓ In Cart" : "Add to Cart"}
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
