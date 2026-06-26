"use client";
import { useState, useEffect } from "react";

const API             = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED             = "#DC143C";
const VENDOR_PAGE_SIZE = 10;

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=400&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400&auto=format&fit=crop",
  "Other Local Services":             "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop",
};

function catImg(category: string) {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Other Local Services"];
}

type AdminTab = "vendors" | "services" | "password";

interface VendorRow {
  id: string;
  email: string;
  displayName?: string;
  accountStatus: string;
  revenueEarned?: number;
  totalBookings?: number;
  vendorProfile?: { id?: string; businessName?: string; phone?: string; locationText?: string; isVerified?: boolean };
}

interface ServiceRow {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  vendorProfile?: { businessName?: string; locationText?: string };
}

export default function AdminDashboard() {
  const [tab,        setTab]        = useState<AdminTab>("vendors");
  const [vendors,    setVendors]    = useState<VendorRow[]>([]);
  const [services,   setServices]   = useState<ServiceRow[]>([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [actionId,   setActionId]   = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [vendorPage,   setVendorPage]   = useState(1);
  const [pwForm,       setPwForm]       = useState({ current: "", next: "", confirm: "" });
  const [pwMsg,        setPwMsg]        = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy,       setPwBusy]       = useState(false);

  // Metrics derived from vendors
  const metrics = {
    total:      vendors.length,
    pending:    vendors.filter(v => v.accountStatus === "PENDING").length,
    active:     vendors.filter(v => v.accountStatus === "ACTIVE").length,
    verified:   vendors.filter(v => v.vendorProfile?.isVerified).length,
    commission: vendors.reduce((s, v) => s + (v.revenueEarned ?? 0) * 0.15, 0),
  };

  const svcMetrics = {
    total:   services.length,
    pending: services.filter(s => !s.isActive).length,
    live:    services.filter(s => s.isActive).length,
  };

  // Load vendors
  useEffect(() => {
    if (tab !== "vendors") return;
    setLoading(true);
    fetch(`${API}/admin/vendors`, { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.status === "success") setVendors(j.data?.vendors || []); else setError(j.message); })
      .catch(() => setError("Failed to load vendors."))
      .finally(() => setLoading(false));
  }, [tab]);

  // Load services
  useEffect(() => {
    if (tab !== "services") return;
    setLoading(true);
    fetch(`${API}/admin/services`, { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.status === "success") setServices(j.data?.services || []); else setError(j.message); })
      .catch(() => setError("Failed to load services."))
      .finally(() => setLoading(false));
  }, [tab]);

  const updateVendorStatus = async (id: string, status: "ACTIVE" | "SUSPENDED") => {
    setActionId(id);
    const res = await fetch(`${API}/admin/vendors/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus: status }),
      credentials: "include",
    });
    if (res.ok) {
      setVendors(prev => prev.map(v => v.id === id ? { ...v, accountStatus: status } : v));
    }
    setActionId(null);
  };

  const toggleVerify = async (vendor: VendorRow) => {
    const profileId = vendor.vendorProfile?.id;
    if (!profileId) return;
    setActionId(profileId);
    const res = await fetch(`${API}/admin/vendors/${profileId}/verify`, {
      method: "PATCH",
      credentials: "include",
    });
    if (res.ok) {
      setVendors(prev => prev.map(v =>
        v.id === vendor.id
          ? { ...v, vendorProfile: { ...v.vendorProfile, isVerified: !v.vendorProfile?.isVerified } }
          : v
      ));
    }
    setActionId(null);
  };

  const updateServiceStatus = async (id: string, action: "approve" | "reject") => {
    setActionId(id);
    const res = await fetch(`${API}/admin/services/${id}/${action}`, {
      method: "PATCH",
      credentials: "include",
    });
    if (res.ok) {
      setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: action === "approve" } : s));
    }
    setActionId(null);
  };

  const filteredVendors = vendors.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.vendorProfile?.businessName?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.displayName?.toLowerCase().includes(q) ||
      v.vendorProfile?.locationText?.toLowerCase().includes(q)
    );
  });

  const vendorTotalPages  = Math.max(1, Math.ceil(filteredVendors.length / VENDOR_PAGE_SIZE));
  const vendorPageClamped = Math.min(vendorPage, vendorTotalPages);
  const paginatedVendors  = filteredVendors.slice(
    (vendorPageClamped - 1) * VENDOR_PAGE_SIZE,
    vendorPageClamped * VENDOR_PAGE_SIZE,
  );

  const filteredServices = services.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.vendorProfile?.businessName?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <style>{`
        .adm              { display:flex; min-height:100vh; font-family:sans-serif; }
        .adm-side         { width:260px; background:#0f172a; color:#f8fafc; display:flex; flex-direction:column; flex-shrink:0; }
        .adm-logo         { padding:28px 24px 20px; font-size:22px; font-weight:900; color:${RED}; border-bottom:1px solid #1e293b; }
        .adm-nav          { flex:1; padding:16px 12px; display:flex; flex-direction:column; gap:4px; }
        .adm-nav-btn      { all:unset; display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:8px; cursor:pointer; font-weight:600; font-size:14px; color:#94a3b8; }
        .adm-nav-btn.on   { background:#1e293b; color:#38bdf8; }
        .adm-foot         { padding:18px 16px; border-top:1px solid #1e293b; }
        .adm-logout       { width:100%; padding:11px; border-radius:8px; border:1px solid #ef4444; background:transparent; color:#ef4444; font-weight:700; cursor:pointer; font-size:14px; }

        .adm-main         { flex:1; background:#f8fafc; overflow-y:auto; }

        /* Mobile top bar */
        .adm-topbar       { display:none; align-items:center; justify-content:space-between; padding:14px 16px; background:#0f172a; position:sticky; top:0; z-index:50; }
        .adm-topbar-logo  { color:${RED}; font-size:20px; font-weight:900; }

        .adm-content      { padding:36px 40px; }
        .adm-title        { font-size:26px; font-weight:900; color:#1e293b; margin:0 0 4px; }
        .adm-sub          { color:#64748b; margin:0 0 28px; font-size:14px; }

        /* Tabs */
        .adm-tabs         { display:flex; border-bottom:2px solid #e2e8f0; margin-bottom:28px; }
        .adm-tab          { padding:10px 22px; border:none; background:none; cursor:pointer; font-size:14px; font-weight:600; color:#64748b; border-bottom:3px solid transparent; margin-bottom:-2px; }
        .adm-tab.on       { color:${RED}; border-bottom-color:${RED}; }

        /* Metrics */
        .metrics          { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:20px; margin-bottom:32px; }
        .metric           { background:#fff; border-radius:14px; padding:20px 24px; border-left:4px solid #e2e8f0; }
        .metric.red       { border-left-color:${RED}; }
        .metric.green     { border-left-color:#10b981; }
        .metric.amber     { border-left-color:#f59e0b; }
        .metric.blue      { border-left-color:#0284c7; }
        .metric-label     { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.6px; margin-bottom:8px; }
        .metric-val       { font-size:30px; font-weight:900; color:#1e293b; }

        /* Search bar */
        .adm-search       { margin-bottom:20px; }
        .adm-search input { width:100%; max-width:360px; padding:10px 16px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:14px; outline:none; }
        .adm-search input:focus { border-color:${RED}; }

        /* Table */
        .adm-table-wrap   { background:#fff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0; overflow-x:auto; }
        .adm-table        { width:100%; border-collapse:collapse; font-size:14px; }
        .adm-table th     { padding:14px 16px; color:#64748b; font-weight:600; text-align:left; background:#f8fafc; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        .adm-table td     { padding:14px 16px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
        .adm-table tr:last-child td { border-bottom:none; }
        .adm-table tr:hover td { background:#fafafa; }

        .badge            { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
        .badge-green      { background:#d1fae5; color:#065f46; }
        .badge-amber      { background:#fef3c7; color:#92400e; }
        .badge-red        { background:#fee2e2; color:#991b1b; }
        .badge-blue       { background:#dbeafe; color:#1e40af; }

        .act-btn          { padding:6px 14px; border:none; border-radius:6px; font-weight:700; cursor:pointer; font-size:12px; }
        .act-approve      { background:#10b981; color:#fff; }
        .act-suspend      { background:#ef4444; color:#fff; }
        .act-reject       { background:#f97316; color:#fff; }
        .act-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* Service cards grid */
        .svc-grid         { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:20px; }
        .svc-card         { background:#fff; border-radius:14px; overflow:hidden; border:1.5px solid #e2e8f0; }
        .svc-card-img     { height:150px; position:relative; overflow:hidden; background:#f1f5f9; }
        .svc-card-img img { width:100%; height:100%; object-fit:cover; display:block; }
        .svc-card-status  { position:absolute; top:10px; right:10px; padding:3px 10px; border-radius:4px; font-size:10px; font-weight:800; }
        .svc-card-body    { padding:16px; }
        .svc-card-cat     { font-size:11px; font-weight:700; color:${RED}; margin-bottom:6px; text-transform:uppercase; letter-spacing:.5px; }
        .svc-card-name    { font-size:15px; font-weight:800; color:#1e293b; margin-bottom:4px; }
        .svc-card-vendor  { font-size:12px; color:#64748b; margin-bottom:4px; }
        .svc-card-loc     { font-size:12px; color:#64748b; margin-bottom:12px; }
        .svc-card-price   { font-size:20px; font-weight:900; color:${RED}; margin-bottom:14px; }
        .svc-card-actions { display:flex; gap:8px; }

        @media (max-width:900px) {
          .adm-side   { display:none; }
          .adm-topbar { display:flex; }
          .adm-content{ padding:20px 16px; }
          .metrics    { grid-template-columns:1fr 1fr; }
          .svc-grid   { grid-template-columns:1fr 1fr; }
        }
        @media (max-width:480px) {
          .metrics  { grid-template-columns:1fr; }
          .svc-grid { grid-template-columns:1fr; }
          .adm-table th:nth-child(3),
          .adm-table td:nth-child(3),
          .adm-table th:nth-child(6),
          .adm-table td:nth-child(6) { display:none; }
        }
      `}</style>

      <div className="adm">
        {/* Sidebar */}
        <aside className="adm-side">
          <div className="adm-logo">kasiFix Admin</div>
          <nav className="adm-nav">
            <button className={`adm-nav-btn${tab === "vendors" ? " on" : ""}`} onClick={() => { setTab("vendors"); setSearch(""); }}>
              🏪 Service Providers
            </button>
            <button className={`adm-nav-btn${tab === "services" ? " on" : ""}`} onClick={() => { setTab("services"); setSearch(""); }}>
              🛠 Service Listings
            </button>
            <button className={`adm-nav-btn${tab === "password" ? " on" : ""}`} onClick={() => { setTab("password"); setSearch(""); setPwMsg(null); }}>
              🔑 Change Password
            </button>
          </nav>
          <div className="adm-foot">
            <button className="adm-logout" onClick={async () => {
              try { await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }); } catch { /* swallow */ }
              window.location.href = "/login";
            }}>Sign Out</button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div style={{ display: "none", flexDirection: "column", flex: 1 }}>
          <header className="adm-topbar">
            <span className="adm-topbar-logo">kasiFix Admin</span>
            <div style={{ display: "flex", gap: "12px" }}>
              <button style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px", fontWeight: 600 }} onClick={() => setTab("vendors")}>Vendors</button>
              <button style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px", fontWeight: 600 }} onClick={() => setTab("services")}>Services</button>
            </div>
          </header>
        </div>

        <main className="adm-main">
          {/* Mobile top bar inside main */}
          <header style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#0f172a", position: "sticky", top: 0, zIndex: 50 }} id="adm-mob-hdr">
            <span style={{ color: RED, fontSize: "18px", fontWeight: 900 }}>kasiFix Admin</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => { setTab("vendors"); setSearch(""); }} style={{ background: "none", border: "none", color: tab === "vendors" ? RED : "#94a3b8", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>Vendors</button>
              <button onClick={() => { setTab("services"); setSearch(""); }} style={{ background: "none", border: "none", color: tab === "services" ? RED : "#94a3b8", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>Services</button>
              <button
                onClick={async () => {
                  try { await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }); } catch { /* swallow */ }
                  window.location.href = "/login";
                }}
                style={{ background: "#ef4444", border: "none", borderRadius: "6px", color: "#fff", fontWeight: 700, fontSize: "12px", padding: "7px 12px", cursor: "pointer" }}
              >
                Sign Out
              </button>
            </div>
          </header>
          <style>{`@media(max-width:900px){#adm-mob-hdr{display:flex!important}}`}</style>

          <div className="adm-content">
            <h1 className="adm-title">
              {tab === "vendors" ? "Service Providers" : tab === "services" ? "Service Listings" : "Change Password"}
            </h1>
            <p className="adm-sub">
              {tab === "vendors"
                ? "Approve, suspend, or manage all registered service providers"
                : tab === "services"
                ? "Review and approve service listings submitted by vendors"
                : "Update your admin account password"}
            </p>

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "14px 16px", borderRadius: "10px", marginBottom: "24px", fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Tabs */}
            <div className="adm-tabs">
              <button className={`adm-tab${tab === "vendors" ? " on" : ""}`} onClick={() => { setTab("vendors"); setSearch(""); }}>
                🏪 Service Providers {vendors.length > 0 && `(${vendors.length})`}
              </button>
              <button className={`adm-tab${tab === "services" ? " on" : ""}`} onClick={() => { setTab("services"); setSearch(""); }}>
                🛠 Service Listings {svcMetrics.pending > 0 && <span style={{ marginLeft: "6px", background: RED, color: "#fff", borderRadius: "10px", padding: "1px 7px", fontSize: "11px" }}>{svcMetrics.pending}</span>}
              </button>
              <button className={`adm-tab${tab === "password" ? " on" : ""}`} onClick={() => { setTab("password"); setSearch(""); setPwMsg(null); }}>
                🔑 Change Password
              </button>
            </div>

            {/* ── VENDORS TAB ──────────────────────────────────────── */}
            {tab === "vendors" && (
              <>
                <div className="metrics">
                  <div className="metric red">
                    <div className="metric-label">Total Vendors</div>
                    <div className="metric-val">{metrics.total}</div>
                  </div>
                  <div className="metric amber">
                    <div className="metric-label">Pending Approval</div>
                    <div className="metric-val">{metrics.pending}</div>
                  </div>
                  <div className="metric green">
                    <div className="metric-label">Active Vendors</div>
                    <div className="metric-val">{metrics.active}</div>
                  </div>
                  <div className="metric blue">
                    <div className="metric-label">Verified Providers</div>
                    <div className="metric-val">{metrics.verified}</div>
                  </div>
                  <div className="metric blue">
                    <div className="metric-label">Platform Commission (15%)</div>
                    <div className="metric-val">R {metrics.commission.toFixed(0)}</div>
                  </div>
                </div>

                <div className="adm-search">
                  <input
                    type="text"
                    placeholder="Search by name, email or location..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setVendorPage(1); }}
                  />
                </div>

                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Verified</th>
                        <th>Revenue</th>
                        <th>Bookings</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading vendors...</td></tr>
                      ) : filteredVendors.length === 0 ? (
                        <tr><td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No vendors found.</td></tr>
                      ) : paginatedVendors.map(v => (
                        <tr key={v.id}>
                          <td style={{ fontWeight: 700 }}>{v.vendorProfile?.businessName || v.displayName || "—"}</td>
                          <td style={{ color: "#64748b" }}>{v.email}</td>
                          <td style={{ color: "#64748b" }}>{v.vendorProfile?.phone || "—"}</td>
                          <td style={{ color: "#64748b" }}>{v.vendorProfile?.locationText || "—"}</td>
                          <td>
                            <span className={`badge ${v.accountStatus === "ACTIVE" ? "badge-green" : v.accountStatus === "PENDING" ? "badge-amber" : "badge-red"}`}>
                              {v.accountStatus}
                            </span>
                          </td>
                          <td>
                            {v.vendorProfile?.isVerified
                              ? <span className="badge badge-green">✓ Verified</span>
                              : <span className="badge badge-amber">Unverified</span>}
                          </td>
                          <td style={{ fontWeight: 700, color: RED }}>R {(v.revenueEarned ?? 0).toFixed(2)}</td>
                          <td style={{ color: "#64748b" }}>{v.totalBookings ?? 0}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className={`act-btn ${v.accountStatus === "ACTIVE" ? "act-suspend" : "act-approve"}`}
                                disabled={actionId === v.id || actionId === v.vendorProfile?.id}
                                onClick={() => updateVendorStatus(v.id, v.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                              >
                                {actionId === v.id ? "..." : v.accountStatus === "ACTIVE" ? "Suspend" : "Approve"}
                              </button>
                              {v.vendorProfile?.id && (
                                <button
                                  className="act-btn"
                                  style={{ background: v.vendorProfile.isVerified ? "#64748b" : "#0284c7", color: "#fff" }}
                                  disabled={actionId === v.vendorProfile.id}
                                  onClick={() => toggleVerify(v)}
                                >
                                  {actionId === v.vendorProfile.id ? "..." : v.vendorProfile.isVerified ? "Unverify" : "Verify"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {vendorTotalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      Showing {(vendorPageClamped - 1) * VENDOR_PAGE_SIZE + 1}–{Math.min(vendorPageClamped * VENDOR_PAGE_SIZE, filteredVendors.length)} of {filteredVendors.length} vendors
                    </span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        onClick={() => setVendorPage(p => Math.max(1, p - 1))}
                        disabled={vendorPageClamped === 1}
                        style={{ padding: "6px 14px", borderRadius: "6px", border: "1.5px solid #e2e8f0", background: vendorPageClamped === 1 ? "#f8fafc" : "#fff", color: vendorPageClamped === 1 ? "#94a3b8" : "#1e293b", fontWeight: 700, cursor: vendorPageClamped === 1 ? "not-allowed" : "pointer", fontSize: "13px" }}
                      >← Prev</button>
                      {Array.from({ length: vendorTotalPages }, (_, i) => i + 1).map(pg => (
                        <button
                          key={pg}
                          onClick={() => setVendorPage(pg)}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: `1.5px solid ${pg === vendorPageClamped ? RED : "#e2e8f0"}`, background: pg === vendorPageClamped ? RED : "#fff", color: pg === vendorPageClamped ? "#fff" : "#1e293b", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
                        >{pg}</button>
                      ))}
                      <button
                        onClick={() => setVendorPage(p => Math.min(vendorTotalPages, p + 1))}
                        disabled={vendorPageClamped === vendorTotalPages}
                        style={{ padding: "6px 14px", borderRadius: "6px", border: "1.5px solid #e2e8f0", background: vendorPageClamped === vendorTotalPages ? "#f8fafc" : "#fff", color: vendorPageClamped === vendorTotalPages ? "#94a3b8" : "#1e293b", fontWeight: 700, cursor: vendorPageClamped === vendorTotalPages ? "not-allowed" : "pointer", fontSize: "13px" }}
                      >Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── SERVICES TAB ─────────────────────────────────────── */}
            {tab === "services" && (
              <>
                <div className="metrics">
                  <div className="metric red">
                    <div className="metric-label">Total Listings</div>
                    <div className="metric-val">{svcMetrics.total}</div>
                  </div>
                  <div className="metric amber">
                    <div className="metric-label">Pending Review</div>
                    <div className="metric-val">{svcMetrics.pending}</div>
                  </div>
                  <div className="metric green">
                    <div className="metric-label">Live Listings</div>
                    <div className="metric-val">{svcMetrics.live}</div>
                  </div>
                </div>

                {/* Filter: show pending first */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Search by service name or vendor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: "10px 16px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", outline: "none", width: "280px" }}
                  />
                  {svcMetrics.pending > 0 && (
                    <div style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
                      ⚠️ {svcMetrics.pending} service{svcMetrics.pending !== 1 ? "s" : ""} pending your approval
                    </div>
                  )}
                </div>

                {loading ? (
                  <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading service listings...</div>
                ) : filteredServices.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>No service listings found.</div>
                ) : (
                  <div className="svc-grid">
                    {/* Show pending first */}
                    {[...filteredServices].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1)).map(svc => (
                      <div key={svc.id} className="svc-card">
                        <div className="svc-card-img">
                          <img
                            src={svc.imageUrl || catImg(svc.category)}
                            alt={svc.name}
                            onError={e => { (e.target as HTMLImageElement).src = catImg(svc.category); }}
                          />
                          <span
                            className="svc-card-status"
                            style={{
                              background: svc.isActive ? "#10b981" : "#f59e0b",
                              color: "#fff"
                            }}
                          >
                            {svc.isActive ? "✓ LIVE" : "⏳ PENDING"}
                          </span>
                        </div>
                        <div className="svc-card-body">
                          <div className="svc-card-cat">{svc.category}</div>
                          <div className="svc-card-name">{svc.name}</div>
                          <div className="svc-card-vendor">
                            🏪 {svc.vendorProfile?.businessName || "Unknown Vendor"}
                          </div>
                          {svc.vendorProfile?.locationText && (
                            <div className="svc-card-loc">📍 {svc.vendorProfile.locationText}</div>
                          )}
                          <div className="svc-card-price">R {Number(svc.price).toFixed(2)}</div>
                          {svc.description && (
                            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {svc.description}
                            </p>
                          )}
                          <div className="svc-card-actions">
                            {!svc.isActive ? (
                              <button
                                className="act-btn act-approve"
                                disabled={actionId === svc.id}
                                onClick={() => updateServiceStatus(svc.id, "approve")}
                                style={{ flex: 1, padding: "10px" }}
                              >
                                {actionId === svc.id ? "..." : "✓ Approve & Go Live"}
                              </button>
                            ) : (
                              <button
                                className="act-btn act-suspend"
                                disabled={actionId === svc.id}
                                onClick={() => updateServiceStatus(svc.id, "reject")}
                                style={{ flex: 1, padding: "10px" }}
                              >
                                {actionId === svc.id ? "..." : "✗ Take Offline"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── CHANGE PASSWORD TAB ───────────────────────────────── */}
            {tab === "password" && (
              <div style={{ maxWidth: 480 }}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (pwForm.next !== pwForm.confirm) {
                      setPwMsg({ ok: false, text: "New passwords do not match." });
                      return;
                    }
                    if (pwForm.next.length < 8) {
                      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
                      return;
                    }
                    setPwBusy(true);
                    setPwMsg(null);
                    try {
                      const res  = await fetch(`${API}/auth/change-password`, {
                        method:      "PATCH",
                        headers:     { "Content-Type": "application/json" },
                        credentials: "include",
                        body:        JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
                      });
                      const json = await res.json();
                      if (json.status === "success") {
                        setPwMsg({ ok: true, text: "Password changed successfully." });
                        setPwForm({ current: "", next: "", confirm: "" });
                      } else {
                        setPwMsg({ ok: false, text: json.message || "Failed to change password." });
                      }
                    } catch {
                      setPwMsg({ ok: false, text: "Network error. Please try again." });
                    }
                    setPwBusy(false);
                  }}
                  style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}
                >
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>Change Password</h2>

                  {pwMsg && (
                    <div style={{ background: pwMsg.ok ? "#d1fae5" : "#fee2e2", color: pwMsg.ok ? "#065f46" : "#991b1b", border: `1px solid ${pwMsg.ok ? "#6ee7b7" : "#fca5a5"}`, borderRadius: 8, padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>
                      {pwMsg.ok ? "✓ " : "✗ "}{pwMsg.text}
                    </div>
                  )}

                  {(["current", "next", "confirm"] as const).map((field) => (
                    <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
                        {field === "current" ? "Current Password" : field === "next" ? "New Password" : "Confirm New Password"}
                      </label>
                      <input
                        type="password"
                        required
                        value={pwForm[field]}
                        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                        placeholder={field === "current" ? "Enter your current password" : field === "next" ? "At least 8 characters" : "Repeat new password"}
                        style={{ padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={pwBusy}
                    style={{ background: RED, color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontWeight: 800, fontSize: 15, cursor: pwBusy ? "not-allowed" : "pointer", opacity: pwBusy ? 0.7 : 1 }}
                  >
                    {pwBusy ? "Saving..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
