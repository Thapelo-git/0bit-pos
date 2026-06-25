"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CartProvider, useCart } from "../../src/shared/context/CartContext";

const RED = "#DC143C";

const CATEGORIES = [
  "Home Cleaning",
  "Fitness & Wellness",
  "Personal Services",
  "Home Maintenance & Trades",
  "Professional Training & Coaching",
  "Other Local Services",
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <PublicLayoutInner>{children}</PublicLayoutInner>
    </CartProvider>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

function PriceFilter() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [min, setMin] = useState(searchParams.get("minPrice") || "");
  const [max, setMax] = useState(searchParams.get("maxPrice") || "");

  useEffect(() => {
    setMin(searchParams.get("minPrice") || "");
    setMax(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (min && Number(min) > 0) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max && Number(max) > 0) params.set("maxPrice", max);
    else params.delete("maxPrice");
    router.push(`/services?${params.toString()}`);
  };

  const clear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    setMin(""); setMax("");
    router.push(`/services?${params.toString()}`);
  };

  const hasFilter = !!(searchParams.get("minPrice") || searchParams.get("maxPrice"));

  return (
    <div className="sidebar-price">
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", color: "#71717A", fontWeight: 600, display: "block", marginBottom: "4px" }}>Min (R)</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={min}
            onChange={e => setMin(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #eaeaea", borderRadius: "6px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "12px", color: "#71717A", fontWeight: 600, display: "block", marginBottom: "4px" }}>Max (R)</label>
          <input
            type="number"
            min={0}
            placeholder="Any"
            value={max}
            onChange={e => setMax(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #eaeaea", borderRadius: "6px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>
      <button className="sidebar-filter-btn" onClick={apply} style={{ marginTop: "10px" }}>Apply Filter</button>
      {hasFilter && (
        <button onClick={clear} style={{ marginTop: "6px", width: "100%", padding: "7px", background: "none", border: "1px solid #eaeaea", borderRadius: "6px", fontSize: "12px", color: "#71717A", cursor: "pointer", fontWeight: 600 }}>
          ✕ Clear Price Filter
        </button>
      )}
    </div>
  );
}

function PublicLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue]       = useState("");
  const router   = useRouter();
  const pathname = usePathname();
  const { count: cartCount } = useCart();

  const [authUser,     setAuthUser]     = useState<{ role: string; displayName?: string; firstName?: string } | null>(null);
  const [acctDropOpen, setAcctDropOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      fetch(`${API}/auth/me`, { credentials: "include" })
        .then(r => r.json())
        .then(j => { setAuthUser(j.status === "success" && j.data?.user ? j.data.user : null); })
        .catch(() => setAuthUser(null));
    };
    checkAuth();
    const onVisible = () => { if (document.visibilityState === "visible") checkAuth(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!acctDropOpen) return;
    const handler = () => setAcctDropOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [acctDropOpen]);

  const handleLogout = async () => {
    setAcctDropOpen(false);
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    setAuthUser(null);
    router.push("/login");
  };

  const isHome = pathname === "/";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        .pub-layout       { min-height:100vh; background:#fff; font-family:sans-serif; }
        .top-banner       { background:${RED}; color:#fff; text-align:center; font-size:12px; padding:7px 16px; font-weight:600; }

        /* ── Header ──────────────────────────────────────────────────── */
        .pub-header       { border-bottom:1px solid #eaeaea; position:sticky; top:0; background:#fff; z-index:100; }

        /* Main row: logo | search | actions — always visible */
        .header-row       { display:flex; align-items:center; height:64px; padding:0 40px; gap:20px; }

        /* Logo */
        .pub-logo         { text-decoration:none; color:${RED}; font-size:26px; font-weight:900; letter-spacing:-1px; flex-shrink:0; line-height:1; }

        /* Search (desktop) */
        .pub-search-form  { flex:1; max-width:500px; display:flex; align-items:center; }
        .pub-search-input { flex:1; min-width:0; height:42px; padding:0 16px; border:1.5px solid #e5e7eb; border-right:none; border-radius:8px 0 0 8px; font-size:14px; outline:none; }
        .pub-search-input:focus { border-color:${RED}; }
        .pub-search-btn   { height:42px; padding:0 18px; background:${RED}; color:#fff; border:none; border-radius:0 8px 8px 0; cursor:pointer; font-weight:700; font-size:14px; white-space:nowrap; flex-shrink:0; }

        /* Right actions */
        .header-actions   { display:flex; align-items:center; gap:4px; margin-left:auto; flex-shrink:0; }
        .pub-sign-in      { text-decoration:none; display:flex; flex-direction:column; justify-content:center; cursor:pointer; padding:6px 10px; border-radius:8px; position:relative; }
        .pub-sign-in:hover{ background:#f9fafb; }
        .pub-sign-in-top  { font-size:10px; color:#9ca3af; font-weight:600; line-height:1.2; }
        .pub-sign-in-btm  { font-size:13px; font-weight:800; color:#0A0A0A; line-height:1.3; max-width:110px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        /* Account dropdown */
        .acct-wrap        { position:relative; }
        .acct-btn         { display:flex; flex-direction:column; justify-content:center; cursor:pointer; padding:6px 10px; border-radius:8px; border:none; background:none; text-align:left; }
        .acct-btn:hover   { background:#f9fafb; }
        .acct-drop        { position:absolute; top:calc(100% + 6px); right:0; background:#fff; border:1.5px solid #eaeaea; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.1); min-width:180px; z-index:300; overflow:hidden; }
        .acct-drop-item   { display:flex; align-items:center; gap:10px; padding:11px 16px; font-size:13px; font-weight:600; color:#374151; cursor:pointer; text-decoration:none; border:none; background:none; width:100%; text-align:left; font-family:sans-serif; }
        .acct-drop-item:hover { background:#f9fafb; color:#0A0A0A; }
        .acct-drop-item.danger { color:#dc2626; }
        .acct-drop-item.danger:hover { background:#fef2f2; }
        .acct-drop-div    { border-top:1px solid #eaeaea; margin:4px 0; }
        .pub-icon-btn     { position:relative; cursor:pointer; color:#374151; text-decoration:none; font-size:22px; padding:8px 10px; border-radius:8px; display:flex; align-items:center; }
        .pub-icon-btn:hover { background:#f9fafb; }
        .pub-icon-badge   { position:absolute; top:2px; right:2px; background:${RED}; color:#fff; border-radius:50%; min-width:18px; height:18px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; padding:0 3px; }
        .hamburger        { display:none; background:none; border:none; cursor:pointer; font-size:22px; color:#374151; padding:8px; border-radius:8px; }
        .hamburger:hover  { background:#f9fafb; }

        /* Mobile search row (below header-row) */
        .mob-search       { display:none; padding:0 14px 10px; }
        .mob-search form  { display:flex; width:100%; }
        .mob-search input { flex:1; min-width:0; height:42px; padding:0 14px; border:1.5px solid #e5e7eb; border-right:none; border-radius:8px 0 0 8px; font-size:16px; outline:none; }
        .mob-search input:focus { border-color:${RED}; }
        .mob-search button{ height:42px; padding:0 16px; background:${RED}; color:#fff; border:none; border-radius:0 8px 8px 0; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; font-family:sans-serif; }

        /* ── Main container ──────────────────────────────────────────── */
        .pub-container    { display:flex; max-width:1400px; margin:0 auto; padding:20px; gap:30px; }
        .pub-sidebar      { width:240px; flex-shrink:0; }
        .pub-main         { flex:1; min-width:0; }

        /* Sidebar */
        .sidebar-box      { border:1px solid #eaeaea; border-radius:8px; margin-bottom:20px; overflow:hidden; }
        .sidebar-heading  { padding:14px 16px; font-weight:700; font-size:14px; border-bottom:1px solid #eaeaea; background:#fdfdfd; }
        .sidebar-price    { padding:16px; }
        .sidebar-price label { font-size:11px; color:#71717A; display:block; margin-bottom:4px; }
        .sidebar-price input { width:100%; padding:8px; border:1px solid #eaeaea; border-radius:4px; font-size:13px; }
        .sidebar-filter-btn { width:100%; padding:9px; background:#eaeaea; border:none; border-radius:4px; font-weight:700; cursor:pointer; margin-top:12px; font-size:13px; }

        /* Sub-nav */
        .sub-nav          { display:flex; gap:24px; margin-bottom:20px; font-weight:700; font-size:14px; border-bottom:1px solid #eaeaea; }
        .sub-nav a        { text-decoration:none; padding-bottom:12px; color:#71717A; border-bottom:2px solid transparent; white-space:nowrap; }
        .sub-nav a.active { color:${RED}; border-bottom-color:${RED}; }

        /* Mobile drawer */
        .mobile-menu      { display:none; position:fixed; inset:0; z-index:200; }
        .mobile-menu.open { display:block; }
        .mobile-overlay   { position:absolute; inset:0; background:rgba(0,0,0,.5); }
        .mobile-drawer    { position:absolute; left:0; top:0; bottom:0; width:280px; background:#fff; padding:24px; overflow-y:auto; }
        .mobile-close     { float:right; background:none; border:none; font-size:22px; cursor:pointer; color:#0A0A0A; }
        .mobile-logo      { color:${RED}; font-size:24px; font-weight:900; margin-bottom:24px; display:block; }

        @media (max-width:900px) {
          .pub-sidebar    { display:none; }
          .header-row     { padding:0 20px; }
        }
        @media (max-width:640px) {
          .header-row       { height:54px; padding:0 14px; gap:4px; }
          .pub-logo         { font-size:22px; }
          .pub-search-form  { display:none; }
          .mob-search       { display:block; }
          .hamburger        { display:flex; align-items:center; }
          .pub-sign-in      { display:none; }
          .header-actions   { gap:0; }
          .pub-container    { padding:12px 14px; }
          .sub-nav          { gap:10px; font-size:12px; overflow-x:auto; }
          .sub-nav::-webkit-scrollbar { display:none; }
        }
        @media (max-width:360px) {
          .mob-search button { padding:0 12px; font-size:13px; }
        }
      `}</style>

      <div className="pub-layout">
        {/* Top banner */}
        <div className="top-banner">
          🇿🇦 South Africa&apos;s trusted service marketplace — find verified pros near you
        </div>

        {/* Header */}
        <header className="pub-header">
          {/* ── Main row ── */}
          <div className="header-row">
            <Link href="/" className="pub-logo">kasiFix</Link>

            {/* Desktop search */}
            <form className="pub-search-form" onSubmit={handleSearch}>
              <input
                className="pub-search-input"
                type="text"
                placeholder="Search for a service…"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
              <button className="pub-search-btn" type="submit">Search</button>
            </form>

            {/* Right actions */}
            <div className="header-actions">
              {authUser ? (
                /* ── Logged-in account dropdown ── */
                <div className="acct-wrap" onClick={e => e.stopPropagation()}>
                  <button
                    className="acct-btn"
                    onClick={() => setAcctDropOpen(o => !o)}
                    aria-label="Account menu"
                  >
                    <span className="pub-sign-in-top">
                      {authUser.role === "VENDOR" ? "Vendor" : authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN" ? "Admin" : "Hi,"}
                    </span>
                    <span className="pub-sign-in-btm">
                      {authUser.displayName || authUser.firstName || "Account"} ▾
                    </span>
                  </button>

                  {acctDropOpen && (
                    <div className="acct-drop">
                      {/* Role-based portal link */}
                      {authUser.role === "VENDOR" && (
                        <Link href="/dashboard" className="acct-drop-item" onClick={() => setAcctDropOpen(false)}>
                          🏪 Vendor Dashboard
                        </Link>
                      )}
                      {(authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN") && (
                        <Link href="/vendors" className="acct-drop-item" onClick={() => setAcctDropOpen(false)}>
                          ⚙️ Admin Panel
                        </Link>
                      )}
                      {(authUser.role === "USER" || authUser.role === "CLIENT") && (
                        <>
                          <Link href="/my-orders" className="acct-drop-item" onClick={() => setAcctDropOpen(false)}>
                            📋 My Orders
                          </Link>
                          <Link href="/favorites" className="acct-drop-item" onClick={() => setAcctDropOpen(false)}>
                            ♡ My Favourites
                          </Link>
                        </>
                      )}
                      <div className="acct-drop-div" />
                      <button className="acct-drop-item danger" onClick={handleLogout}>
                        ↩ Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="pub-sign-in">
                  <span className="pub-sign-in-top">Welcome</span>
                  <span className="pub-sign-in-btm">Sign In</span>
                </Link>
              )}

              <Link href="/favorites" className="pub-icon-btn" title="Favourites">♡</Link>

              <Link href="/cart" className="pub-icon-btn" title="My Booking">
                📋{cartCount > 0 && <span className="pub-icon-badge">{cartCount}</span>}
              </Link>

              <button className="hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">☰</button>
            </div>
          </div>

          {/* ── Mobile search row (below header-row on small screens) ── */}
          <div className="mob-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search services…"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>
        </header>

        {/* Main layout */}
        <div className="pub-container">
          {/* Sidebar (desktop only) */}
          {!isHome && (
            <aside className="pub-sidebar">
              <div className="sidebar-box">
                <div className="sidebar-heading">
                  <Link href="/services" style={{ textDecoration: "none", color: "inherit" }}>All Categories</Link>
                </div>
                <Suspense fallback={<div style={{ padding: "12px 16px", color: "#71717A", fontSize: "13px" }}>Loading...</div>}>
                  <CategoryList />
                </Suspense>
              </div>
              <div className="sidebar-box">
                <div className="sidebar-heading">Price Filter</div>
                <Suspense fallback={<div style={{ padding: "12px 16px", fontSize: "13px", color: "#71717A" }}>Loading…</div>}>
                  <PriceFilter />
                </Suspense>
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="pub-main">
            {/* Sub-nav */}
            <Suspense fallback={null}>
              <SubNav pathname={pathname} />
            </Suspense>
            {children}
          </main>
        </div>

        {/* Mobile drawer */}
        <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-drawer">
            <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
            <Link href="/" className="mobile-logo">kasiFix</Link>

            {/* Mobile search */}
            <form onSubmit={e => { handleSearch(e); setMobileMenuOpen(false); }} style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", border: "1.5px solid #eaeaea", borderRadius: "6px", overflow: "hidden" }}>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  style={{ flex: 1, padding: "10px 12px", border: "none", fontSize: "14px", outline: "none" }}
                />
                <button type="submit" style={{ background: RED, color: "#fff", border: "none", padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
                  →
                </button>
              </div>
            </form>

            <div style={{ fontWeight: 700, fontSize: "13px", color: "#71717A", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Categories
            </div>
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/services?category=${encodeURIComponent(cat)}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "block", padding: "12px 0", borderBottom: "1px solid #f0f0f0", fontSize: "15px", color: "#0A0A0A", textDecoration: "none", fontWeight: 500 }}
              >
                {cat}
              </Link>
            ))}

            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {authUser ? (
                <>
                  {/* Logged-in user info */}
                  <div style={{ padding: "12px 14px", background: "#f9fafb", borderRadius: "10px", marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Signed in as</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0A0A0A", marginTop: 2 }}>
                      {authUser.displayName || authUser.firstName || "Account"}
                    </div>
                    <div style={{ fontSize: 11, color: "#71717A", marginTop: 1, textTransform: "capitalize" }}>
                      {authUser.role === "SUPER_ADMIN" ? "Super Admin" : authUser.role.toLowerCase()} account
                    </div>
                  </div>

                  {(authUser.role === "USER" || authUser.role === "CLIENT") && (
                    <>
                      <Link href="/my-orders" onClick={() => setMobileMenuOpen(false)} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                        background: "#fff", border: "1.5px solid #eaeaea", borderRadius: "8px",
                        fontWeight: 700, fontSize: 14, color: "#374151", textDecoration: "none"
                      }}>
                        📋 My Orders
                      </Link>
                      <Link href="/favorites" onClick={() => setMobileMenuOpen(false)} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                        background: "#fff", border: "1.5px solid #eaeaea", borderRadius: "8px",
                        fontWeight: 700, fontSize: 14, color: "#374151", textDecoration: "none"
                      }}>
                        ♡ My Favourites
                      </Link>
                    </>
                  )}

                  {authUser.role === "VENDOR" && (
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{
                      display: "block", background: "#0A0A0A", color: "#fff", textAlign: "center",
                      padding: "13px", borderRadius: "8px", fontWeight: 700, textDecoration: "none"
                    }}>
                      🏪 Vendor Dashboard
                    </Link>
                  )}

                  {(authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN") && (
                    <Link href="/vendors" onClick={() => setMobileMenuOpen(false)} style={{
                      display: "block", background: "#0A0A0A", color: "#fff", textAlign: "center",
                      padding: "13px", borderRadius: "8px", fontWeight: 700, textDecoration: "none"
                    }}>
                      ⚙️ Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    style={{
                      display: "block", width: "100%", background: "#fee2e2", color: "#dc2626",
                      textAlign: "center", padding: "13px", borderRadius: "8px",
                      fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "sans-serif"
                    }}
                  >
                    ↩ Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{
                    display: "block", background: RED, color: "#fff", textAlign: "center",
                    padding: "13px", borderRadius: "8px", fontWeight: 700, textDecoration: "none"
                  }}>
                    Sign In / Register
                  </Link>
                  <Link href="/services" onClick={() => setMobileMenuOpen(false)} style={{
                    display: "block", border: `1px solid ${RED}`, color: RED, textAlign: "center",
                    padding: "12px", borderRadius: "8px", fontWeight: 700, textDecoration: "none"
                  }}>
                    Browse All Services
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SubNav({ pathname }: { pathname: string }) {
  const isHome     = pathname === "/";
  const isServices = pathname.startsWith("/services");
  const isDeals    = pathname.startsWith("/deals");
  const isContact  = pathname.startsWith("/contact");

  return (
    <nav className="sub-nav">
      <Link href="/"         className={isHome     ? "active" : ""}>Home</Link>
      <Link href="/services" className={isServices ? "active" : ""}>Services</Link>
      <Link href="/deals"    className={isDeals    ? "active" : ""}>🔥 Deals</Link>
      <Link href="/contact"  className={isContact  ? "active" : ""}>Contact</Link>
    </nav>
  );
}

function CategoryList() {
  const searchParams = useSearchParams();
  const cat = searchParams.get("category");

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
      {CATEGORIES.map(label => (
        <CategoryItem key={label} label={label} active={cat === label} />
      ))}
    </ul>
  );
}

function CategoryItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <li>
      <Link
        href={`/services?category=${encodeURIComponent(label)}`}
        style={{
          padding: "10px 16px",
          fontSize: "14px",
          color: active ? RED : "#333",
          fontWeight: active ? 700 : 400,
          textDecoration: "none",
          display: "flex",
          justifyContent: "space-between",
          backgroundColor: active ? "#fff1f2" : "transparent",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#ccc" }}>›</span>
      </Link>
    </li>
  );
}
