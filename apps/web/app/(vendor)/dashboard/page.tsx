"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

function getCategoryImage(category: string) {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Other Local Services"];
}

const CATEGORIES = [
  "Home Cleaning",
  "Fitness & Wellness",
  "Personal Services",
  "Home Maintenance & Trades",
  "Professional Training & Coaching",
  "Other Local Services",
];

type Tab = "overview" | "services" | "profile";

export default function VendorDashboard() {
  const [tab,      setTab]      = useState<Tab>("overview");
  const [data,     setData]     = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [svcLoading, setSvcLoading] = useState(false);

  // Per-booking action loading (accept/reject/complete)
  const [bookingBusy, setBookingBusy] = useState<Record<string, boolean>>({});

  // Delete service
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Business profile edit
  const [profile,      setProfile]      = useState<any>(null);
  const [profileForm,  setProfileForm]  = useState({ businessName: "", phone: "", locationText: "", bankDetails: "", description: "" });
  const [profileMsg,   setProfileMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Create / Edit service form
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState({ name: "", description: "", price: "", category: CATEGORIES[0], imageUrl: "", isDeal: false, originalPrice: "" });
  const [imageMode,  setImageMode]  = useState<"file" | "url">("file");
  const [formMsg,    setFormMsg]    = useState<{ text: string; ok: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiDescBusy, setAiDescBusy] = useState(false);

  const openEdit = (svc: any) => {
    setEditingId(svc.id);
    setForm({
      name:          svc.name          || "",
      description:   svc.description   || "",
      price:         String(svc.price  || ""),
      category:      svc.category      || CATEGORIES[0],
      imageUrl:      svc.imageUrl      || "",
      isDeal:        svc.isDeal        || false,
      originalPrice: svc.originalPrice ? String(svc.originalPrice) : "",
    });
    setImageMode(svc.imageUrl?.startsWith("data:") ? "file" : "url");
    setFormMsg(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", description: "", price: "", category: CATEGORIES[0], imageUrl: "", isDeal: false, originalPrice: "" });
    setFormMsg(null);
  };

  const generateDescription = async () => {
    if (!form.name.trim() || !form.category) return;
    setAiDescBusy(true);
    try {
      const res  = await fetch(`${API}/ai/describe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name.trim(), category: form.category, price: form.price ? parseFloat(form.price) : undefined }) });
      const json = await res.json();
      if (json.status === "success" && json.data?.description) {
        setForm(p => ({ ...p, description: json.data.description }));
      }
    } catch { /* swallow */ }
    finally { setAiDescBusy(false); }
  };

  const handleLocalImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormMsg({ text: "Image must be smaller than 3 MB.", ok: false });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, imageUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const [dashRefresh, setDashRefresh] = useState(0);

  // Load dashboard data
  useEffect(() => {
    fetch(`${API}/vendors/dashboard`, { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.status === "success") setData(j.data); })
      .catch(() => {});
  }, [dashRefresh]);

  // Load profile when tab activates
  useEffect(() => {
    if (tab !== "profile" || profile) return;
    fetch(`${API}/vendors/profile`, { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.status === "success") {
          const p = j.data.profile || {};
          setProfile(p);
          setProfileForm({
            businessName: p.businessName || "",
            phone:        p.phone        || "",
            locationText: p.locationText || "",
            bankDetails:  p.bankDetails  || "",
            description:  p.description  || "",
          });
        }
      })
      .catch(() => {});
  }, [tab, profile]);

  const [svcRefresh, setSvcRefresh] = useState(0);

  // Load services when tab activates or refresh is triggered
  useEffect(() => {
    if (tab !== "services") return;
    setSvcLoading(true);
    fetch(`${API}/vendors/services`, { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.status === "success") setServices(j.data?.services || []); })
      .catch(() => {})
      .finally(() => setSvcLoading(false));
  }, [tab, svcRefresh]);

  // Accept / Reject / Complete a booking
  const handleBookingAction = async (id: string, action: "accept" | "reject" | "complete") => {
    setBookingBusy(p => ({ ...p, [id]: true }));
    try {
      const res  = await fetch(`${API}/vendors/bookings/${id}/${action}`, { method: "PATCH", credentials: "include" });
      const json = await res.json();
      if (json.status === "success") {
        setData((prev: any) => ({
          ...prev,
          transactions: prev.transactions.map((t: any) =>
            t.id === id ? { ...t, status: json.data.status } : t
          ),
        }));
      }
    } catch {}
    setBookingBusy(p => ({ ...p, [id]: false }));
  };

  // Delete a service
  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res  = await fetch(`${API}/vendors/services/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (json.status === "success") {
        setServices(prev => prev.filter(s => s.id !== id));
      } else {
        alert(json.message || "Could not delete service.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setDeletingId(null);
  };

  // Save business profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res  = await fetch(`${API}/vendors/profile`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(profileForm),
        credentials: "include",
      });
      const json = await res.json();
      if (json.status === "success") {
        setProfileMsg({ text: "Business details updated successfully!", ok: true });
        setProfile(json.data.profile);
      } else {
        setProfileMsg({ text: json.message || "Update failed.", ok: false });
      }
    } catch {
      setProfileMsg({ text: "Network error. Please try again.", ok: false });
    }
    setProfileSaving(false);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    const body = {
      ...form,
      price:         parseFloat(form.price),
      imageUrl:      form.imageUrl || undefined,
      isDeal:        form.isDeal,
      originalPrice: form.isDeal && form.originalPrice ? parseFloat(form.originalPrice) : undefined,
    };
    try {
      const isEdit = !!editingId;
      const res = await fetch(
        isEdit ? `${API}/vendors/services/${editingId}` : `${API}/vendors/services`,
        {
          method:  isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
          credentials: "include",
        }
      );
      const json = await res.json();
      if (json.status === "success") {
        setFormMsg({ text: isEdit ? "Service updated!" : "Service created successfully!", ok: true });
        if (isEdit) {
          setServices(prev => prev.map(s => s.id === editingId ? { ...s, ...json.data } : s));
        } else {
          setServices(prev => [json.data, ...prev]);
        }
        setTimeout(() => closeForm(), 1500);
      } else {
        setFormMsg({ text: json.message || "Failed to save service.", ok: false });
      }
    } catch {
      setFormMsg({ text: "Network error. Please try again.", ok: false });
    }
    setSubmitting(false);
  };

  const refreshServices = () => setSvcRefresh(n => n + 1);

  const isPending = data?.pending;

  return (
    <>
      <style>{`
        .vd              { padding:28px 32px; max-width:1100px; }
        .vd-header       { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .vd-title        { font-size:clamp(20px,3vw,26px); font-weight:900; color:#0A0A0A; margin:0 0 4px; }
        .vd-sub          { font-size:14px; color:#71717A; margin:0; }

        .vd-tabs         { display:flex; gap:0; margin-bottom:28px; border-bottom:2px solid #eaeaea; }
        .vd-tab          { padding:10px 20px; border:none; background:none; cursor:pointer; font-size:14px; font-weight:600; color:#71717A; border-bottom:3px solid transparent; margin-bottom:-2px; }
        .vd-tab.active   { color:${RED}; border-bottom-color:${RED}; }

        .vd-stats        { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin-bottom:32px; }
        .stat-card       { background:#fff; border:1.5px solid #eaeaea; border-radius:12px; padding:20px; }
        .stat-card.hi    { background:${RED}; border-color:${RED}; }
        .stat-label      { font-size:12px; color:#71717A; font-weight:600; margin-bottom:10px; text-transform:uppercase; letter-spacing:.5px; }
        .stat-card.hi .stat-label { color:rgba(255,255,255,.7); }
        .stat-value      { font-size:28px; font-weight:900; color:#0A0A0A; }
        .stat-card.hi .stat-value { color:#fff; }

        .vd-section-hdr  { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
        .vd-section-title{ font-size:16px; font-weight:800; margin:0; }
        .btn-primary     { background:${RED}; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:700; font-size:14px; cursor:pointer; }
        .btn-outline     { background:#fff; color:${RED}; border:1.5px solid ${RED}; padding:8px 16px; border-radius:6px; font-weight:700; font-size:13px; cursor:pointer; }

        .svc-list        { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
        .svc-item        { background:#fff; border:1.5px solid #eaeaea; border-radius:12px; padding:18px; }
        .svc-item-name   { font-weight:700; font-size:15px; color:#0A0A0A; margin-bottom:4px; }
        .svc-item-cat    { font-size:12px; color:${RED}; font-weight:600; margin-bottom:8px; }
        .svc-item-price  { font-size:20px; font-weight:900; color:${RED}; margin-bottom:12px; }
        .svc-item-desc   { font-size:13px; color:#71717A; margin-bottom:14px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .svc-toggle      { width:100%; padding:9px; border-radius:6px; font-weight:700; font-size:13px; cursor:pointer; border:none; }
        .svc-toggle.on   { background:#d1fae5; color:#065f46; }
        .svc-toggle.off  { background:#fee2e2; color:#991b1b; }

        .tx-table        { width:100%; border-collapse:collapse; font-size:13px; }
        .tx-table th     { padding:12px 10px; color:#71717A; font-weight:600; text-align:left; border-bottom:2px solid #f0f0f0; }
        .tx-table td     { padding:14px 10px; border-bottom:1px solid #f8f8f8; }
        .status-badge    { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; display:inline-block; white-space:nowrap; }
        .status-COMPLETED { background:#d1fae5; color:#065f46; }
        .status-PENDING   { background:#fef3c7; color:#92400e; }
        .status-ACCEPTED  { background:#dbeafe; color:#1e40af; }
        .status-REJECTED  { background:#fee2e2; color:#991b1b; }
        .status-CANCELLED { background:#f3f4f6; color:#6b7280; }

        .pay-badge       { padding:3px 9px; border-radius:10px; font-size:11px; font-weight:700; background:#f8fafc; color:#374151; white-space:nowrap; }
        .action-btn      { padding:5px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; border:none; font-family:sans-serif; transition:opacity .15s; }
        .action-btn:disabled { opacity:.5; cursor:not-allowed; }
        .btn-accept      { background:#dbeafe; color:#1e40af; }
        .btn-accept:hover:not(:disabled) { background:#bfdbfe; }
        .btn-reject      { background:#fee2e2; color:#991b1b; }
        .btn-reject:hover:not(:disabled) { background:#fecaca; }
        .btn-complete    { background:#d1fae5; color:#065f46; }
        .btn-complete:hover:not(:disabled) { background:#a7f3d0; }
        .btn-delete      { background:#fee2e2; color:#991b1b; border:none; padding:7px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; font-family:sans-serif; }
        .btn-delete:hover { background:#fecaca; }
        .btn-delete:disabled { opacity:.5; cursor:not-allowed; }

        .profile-form    { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:28px; max-width:540px; }
        .profile-section { font-size:12px; font-weight:700; color:${RED}; text-transform:uppercase; letter-spacing:.5px; margin:0 0 16px; }
        .bank-note       { font-size:12px; color:#71717A; background:#f8fafc; border:1px solid #e5e7eb; border-radius:6px; padding:10px 14px; margin-bottom:16px; }

        .pending-box     { background:#fef3c7; border:1px solid #fde68a; border-radius:12px; padding:32px; text-align:center; }
        .pending-box h2  { color:#92400e; margin:0 0 10px; }
        .pending-box p   { color:#78350f; margin:0; font-size:15px; line-height:1.6; }

        .form-overlay    { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
        .form-modal      { background:#fff; border-radius:16px; padding:32px; width:100%; max-width:480px; max-height:90vh; overflow-y:auto; }
        .form-modal h3   { margin:0 0 24px; font-size:20px; font-weight:900; }
        .form-group      { margin-bottom:16px; }
        .form-label      { display:block; font-size:13px; font-weight:700; margin-bottom:6px; color:#333; }
        .form-input      { width:100%; padding:11px 14px; border:1.5px solid #eaeaea; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; }
        .form-input:focus{ border-color:${RED}; }
        .form-textarea   { width:100%; padding:11px 14px; border:1.5px solid #eaeaea; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; resize:vertical; min-height:90px; }
        .form-textarea:focus { border-color:${RED}; }
        .form-row        { display:flex; gap:12px; }
        .form-actions    { display:flex; gap:12px; margin-top:24px; }

        @media (max-width:640px) {
          .vd            { padding:16px; }
          .vd-header     { flex-direction:column; }
          /* On mobile keep: Client, Service, Amount, Status, Actions — hide Phone, Payment, Date */
          .tx-table th:nth-child(3),
          .tx-table td:nth-child(3),
          .tx-table th:nth-child(4),
          .tx-table td:nth-child(4),
          .tx-table th:nth-child(8),
          .tx-table td:nth-child(8) { display:none; }
          .vd-stats { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      <div className="vd">
        {/* Header */}
        <div className="vd-header">
          <div>
            <h1 className="vd-title">Vendor Dashboard</h1>
            <p className="vd-sub">
              {isPending
                ? "Your account is pending approval — you cannot list services yet."
                : "Manage your services and track your earnings"}
            </p>
          </div>
          {!isPending && (
            <button className="btn-primary" onClick={() => { setTab("services"); setShowForm(true); }}>
              + Add New Service
            </button>
          )}
        </div>

        {isPending ? (
          <div className="pending-box">
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
            <h2>Pending Admin Approval</h2>
            <p>
              Your vendor application is under review. Once approved, you will receive an email
              and gain full access to list services and accept bookings.
            </p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="vd-tabs">
              <button className={`vd-tab${tab === "overview"  ? " active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
              <button className={`vd-tab${tab === "services"  ? " active" : ""}`} onClick={() => setTab("services")}>My Services</button>
              <button className={`vd-tab${tab === "profile"   ? " active" : ""}`} onClick={() => setTab("profile")}>Business Profile</button>
            </div>

            {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
            {tab === "overview" && (
              <>
                {/* Stats */}
                <div className="vd-stats">
                  <div className="stat-card hi">
                    <div className="stat-label">Earned Revenue</div>
                    <div className="stat-value">R {(data?.totalRevenue || 0).toFixed(2)}</div>
                  </div>
                  <div className="stat-card" style={{ borderColor: "#bfdbfe" }}>
                    <div className="stat-label">Accepted (in progress)</div>
                    <div className="stat-value" style={{ color: "#1e40af" }}>R {(data?.acceptedRevenue || 0).toFixed(2)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Total Bookings</div>
                    <div className="stat-value">{data?.numberOfDeals || 0}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Pending / Completed</div>
                    <div className="stat-value">{data?.pendingCount || 0} / {data?.fulfilledDeals || 0}</div>
                  </div>
                </div>

                {/* Transactions */}
                <div>
                  <div className="vd-section-hdr">
                    <h3 className="vd-section-title">Bookings</h3>
                    <button
                      onClick={() => setDashRefresh(n => n + 1)}
                      style={{ background: "none", border: "1.5px solid #eaeaea", borderRadius: "6px", padding: "7px 14px", fontWeight: 700, fontSize: "13px", cursor: "pointer", color: "#374151" }}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                  <div style={{ background: "#fff", borderRadius: "12px", border: "1.5px solid #eaeaea", overflowX: "auto" }}>
                    <table className="tx-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Service</th>
                          <th>Phone</th>
                          <th>Payment</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.transactions?.length ? data.transactions.map((t: any) => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 600 }}>{t.name}</td>
                            <td style={{ color: "#71717A", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.deal}</td>
                            <td style={{ color: "#71717A", whiteSpace: "nowrap" }}>{t.phoneNumber || "—"}</td>
                            <td>
                              <span className="pay-badge">
                                {t.paymentMethod === "CARD" ? "💳 Card" : t.paymentMethod === "EFT" ? "🏦 EFT" : t.paymentMethod === "CASH" ? "💵 Cash" : t.paymentMethod || "—"}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: RED, whiteSpace: "nowrap" }}>R {Number(t.amount).toFixed(2)}</td>
                            <td>
                              <span className={`status-badge status-${t.status || "PENDING"}`}>
                                {t.status || "PENDING"}
                              </span>
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              {t.status === "PENDING" && (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button className="action-btn btn-accept"   disabled={!!bookingBusy[t.id]} onClick={() => handleBookingAction(t.id, "accept")}>
                                    {bookingBusy[t.id] ? "…" : "✓ Accept"}
                                  </button>
                                  <button className="action-btn btn-reject"   disabled={!!bookingBusy[t.id]} onClick={() => handleBookingAction(t.id, "reject")}>
                                    {bookingBusy[t.id] ? "…" : "✕ Reject"}
                                  </button>
                                </div>
                              )}
                              {t.status === "ACCEPTED" && (
                                <button className="action-btn btn-complete" disabled={!!bookingBusy[t.id]} onClick={() => handleBookingAction(t.id, "complete")}>
                                  {bookingBusy[t.id] ? "…" : "✓ Mark Done"}
                                </button>
                              )}
                              {(t.status === "COMPLETED" || t.status === "REJECTED" || t.status === "CANCELLED") && (
                                <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>
                              )}
                            </td>
                            <td style={{ color: "#71717A", whiteSpace: "nowrap" }}>{new Date(t.date).toLocaleDateString("en-ZA")}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#71717A" }}>
                              No bookings yet. Add services to start receiving bookings.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── SERVICES TAB ─────────────────────────────────────────── */}
            {tab === "services" && (
              <>
                <div className="vd-section-hdr">
                  <h3 className="vd-section-title">My Services ({services.length})</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={refreshServices} style={{ background: "none", border: "1.5px solid #eaeaea", borderRadius: "6px", padding: "8px 14px", fontWeight: 700, fontSize: "13px", cursor: "pointer", color: "#374151" }}>
                      ↻ Refresh
                    </button>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Service</button>
                  </div>
                </div>

                {svcLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#71717A" }}>Loading services...</div>
                ) : services.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "12px", border: "1.5px solid #eaeaea" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛠</div>
                    <h3 style={{ margin: "0 0 8px" }}>No services yet</h3>
                    <p style={{ color: "#71717A", margin: "0 0 20px" }}>Create your first service to start receiving bookings.</p>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create Service</button>
                  </div>
                ) : (
                  <div className="svc-list">
                    {services.map(svc => (
                      <div key={svc.id} className="svc-item" style={{ padding: 0, overflow: "hidden" }}>
                        {/* Image */}
                        <div style={{ height: "130px", position: "relative", background: "#f1f5f9" }}>
                          <img
                            src={svc.imageUrl || getCategoryImage(svc.category)}
                            alt={svc.name}
                            onError={e => { (e.target as HTMLImageElement).src = getCategoryImage(svc.category); }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          <span style={{
                            position: "absolute", top: "10px", right: "10px",
                            background: svc.isActive ? "#16a34a" : "#f59e0b",
                            color: "#fff", fontSize: "10px", fontWeight: 800,
                            padding: "3px 8px", borderRadius: "4px", letterSpacing: "0.5px"
                          }}>
                            {svc.isActive ? "✓ LIVE" : "⏳ PENDING APPROVAL"}
                          </span>
                        </div>
                        <div style={{ padding: "14px" }}>
                          <div className="svc-item-cat">{svc.category}</div>
                          <div className="svc-item-name">{svc.name}</div>
                          <div className="svc-item-price">R {Number(svc.price).toFixed(2)}</div>
                          <div className="svc-item-desc">{svc.description}</div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Link href={`/services/${svc.id}`} style={{
                              padding: "9px 12px", background: "#f8f8f8", border: "1px solid #eaeaea",
                              borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "#333",
                              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center",
                            }}>
                              👁 Preview
                            </Link>
                            <button
                              style={{ padding: "9px 12px", background: "#dbeafe", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, color: "#1e40af", cursor: "pointer" }}
                              onClick={() => openEdit(svc)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-delete"
                              disabled={deletingId === svc.id}
                              onClick={() => handleDeleteService(svc.id, svc.name)}
                            >
                              {deletingId === svc.id ? "…" : "🗑"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── BUSINESS PROFILE TAB ──────────────────────────────────── */}
            {tab === "profile" && (
              <div className="profile-form">
                <p className="profile-section">Business Details</p>
                <form onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input className="form-input" type="text" value={profileForm.businessName}
                      onChange={e => setProfileForm(p => ({ ...p, businessName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Phone</label>
                    <input className="form-input" type="tel" placeholder="011 234 5678" value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location (Town / City)</label>
                    <input className="form-input" type="text" placeholder="Soweto, Johannesburg" value={profileForm.locationText}
                      onChange={e => setProfileForm(p => ({ ...p, locationText: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Description</label>
                    <textarea className="form-textarea" rows={3} placeholder="Describe your business and the services you offer…" value={profileForm.description}
                      onChange={e => setProfileForm(p => ({ ...p, description: e.target.value }))} />
                  </div>

                  <p className="profile-section" style={{ marginTop: 24 }}>Banking Details</p>
                  <div className="bank-note">
                    💡 Your banking details are only used by kasiFix admin for payouts. They are never shared with customers.
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Account Details</label>
                    <textarea className="form-textarea" rows={3}
                      placeholder={"Bank: FNB\nAccount No: 62XXXXXXXXX\nBranch Code: 250655\nAccount Type: Cheque"}
                      value={profileForm.bankDetails}
                      onChange={e => setProfileForm(p => ({ ...p, bankDetails: e.target.value }))} />
                  </div>

                  {profileMsg && (
                    <div style={{ padding: "12px 14px", borderRadius: "8px", marginBottom: "14px", fontWeight: 600, fontSize: "13px",
                      background: profileMsg.ok ? "#d1fae5" : "#fee2e2", color: profileMsg.ok ? "#065f46" : "#991b1b" }}>
                      {profileMsg.text}
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={profileSaving} style={{ width: "100%", padding: "13px" }}>
                    {profileSaving ? "Saving…" : "Save Business Details"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Service Modal */}
      {showForm && (
        <div className="form-overlay" onClick={e => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="form-modal">
            <h3>{editingId ? "Edit Service" : "Create New Service"}</h3>
            <form onSubmit={handleCreateService}>
              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Full Home Deep Clean"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price (ZAR) *</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 450"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Description *</label>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={aiDescBusy || !form.name.trim()}
                    style={{ background: aiDescBusy ? "#e5e7eb" : "#f59e0b", color: aiDescBusy ? "#9ca3af" : "#0A0A0A", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "12px", fontWeight: 800, cursor: aiDescBusy || !form.name.trim() ? "not-allowed" : "pointer", fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 5 }}
                    title={!form.name.trim() ? "Enter a service name first" : "Generate a professional description with AI"}
                  >
                    {aiDescBusy ? "✦ Writing…" : "✨ AI Write"}
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder="Describe what this service includes, what clients can expect, and any requirements…  or click ✨ AI Write to generate one"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  required
                />
              </div>

              {/* ── Image section ── */}
              <div className="form-group">
                <label className="form-label">
                  Service Image <span style={{ fontWeight: 400, color: "#71717A" }}>(optional)</span>
                </label>

                {/* Mode toggle */}
                <div style={{ display: "flex", gap: "0", marginBottom: "10px", border: "1.5px solid #eaeaea", borderRadius: "8px", overflow: "hidden" }}>
                  {(["file", "url"] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setImageMode(mode); setForm(p => ({ ...p, imageUrl: "" })); }}
                      style={{
                        flex: 1, padding: "9px", border: "none", cursor: "pointer",
                        fontWeight: 700, fontSize: "13px", fontFamily: "inherit",
                        background: imageMode === mode ? RED : "#fff",
                        color: imageMode === mode ? "#fff" : "#555",
                        transition: "background .15s",
                      }}
                    >
                      {mode === "file" ? "📁 Upload from Device" : "🔗 Image URL"}
                    </button>
                  ))}
                </div>

                {imageMode === "file" ? (
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: "8px", padding: "24px", border: "2px dashed #eaeaea", borderRadius: "10px",
                    cursor: "pointer", background: "#fafafa", transition: "border-color .15s",
                  }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        if (file.size > 3 * 1024 * 1024) { setFormMsg({ text: "Image must be smaller than 3 MB.", ok: false }); return; }
                        const reader = new FileReader();
                        reader.onload = ev => setForm(p => ({ ...p, imageUrl: ev.target?.result as string }));
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleLocalImage}
                    />
                    {form.imageUrl ? (
                      <div style={{ width: "100%", position: "relative" }}>
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px" }}
                        />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); e.preventDefault(); setForm(p => ({ ...p, imageUrl: "" })); }}
                          style={{
                            position: "absolute", top: "6px", right: "6px",
                            background: "rgba(0,0,0,.6)", color: "#fff", border: "none",
                            borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer",
                            fontSize: "14px", fontWeight: 700, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center"
                          }}
                        >×</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: "32px" }}>🖼️</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Click to choose or drag &amp; drop</span>
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>JPG, PNG, WEBP — max 3 MB</span>
                      </>
                    )}
                  </label>
                ) : (
                  <>
                    <input
                      className="form-input"
                      type="url"
                      placeholder="https://example.com/my-service-photo.jpg"
                      value={form.imageUrl}
                      onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                    />
                    {form.imageUrl && (
                      <div style={{ marginTop: "10px", borderRadius: "8px", overflow: "hidden", height: "120px" }}>
                        <img
                          src={form.imageUrl}
                          alt="Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                  </>
                )}

                {!form.imageUrl && (
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: "6px 0 0" }}>
                    If left blank, a default category image will be used.
                  </p>
                )}
              </div>

              {/* Deal toggle */}
              <div className="form-group" style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px 16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isDeal}
                    onChange={e => setForm(p => ({ ...p, isDeal: e.target.checked, originalPrice: e.target.checked ? p.originalPrice : "" }))}
                    style={{ width: 18, height: 18, accentColor: "#f59e0b", cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>🔥 Mark as Deal</div>
                    <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>This service will appear on the Deals page with a discount badge</div>
                  </div>
                </label>
                {form.isDeal && (
                  <div style={{ marginTop: 12 }}>
                    <label className="form-label" style={{ color: "#92400e" }}>Original Price (R) — before discount</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 850"
                      value={form.originalPrice}
                      onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))}
                      style={{ borderColor: "#fde68a" }}
                    />
                    {form.originalPrice && form.price && parseFloat(form.originalPrice) <= parseFloat(form.price) && (
                      <p style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>Original price must be higher than the deal price.</p>
                    )}
                  </div>
                )}
              </div>

              {formMsg && (
                <div style={{
                  padding: "12px", borderRadius: "8px", marginBottom: "12px",
                  background: formMsg.ok ? "#d1fae5" : "#fee2e2",
                  color: formMsg.ok ? "#065f46" : "#991b1b",
                  fontWeight: 600, fontSize: "13px"
                }}>
                  {formMsg.text}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1, padding: "13px" }}>
                  {submitting ? "Saving..." : editingId ? "Update Service" : "Create Service"}
                </button>
                <button type="button" className="btn-outline" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
