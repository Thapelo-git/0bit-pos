"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED = "#DC143C";

interface ProfileData {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    avatarUrl?: string;
    accountStatus: string;
    createdAt: string;
  };
  profile: {
    businessName: string;
    description?: string;
    phone?: string;
    locationText?: string;
    bankDetails?: string;
    isActive: boolean;
    createdAt: string;
  } | null;
}

export default function VendorProfilePage() {
  const router = useRouter();
  const [data,    setData]    = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    businessName: "",
    description:  "",
    phone:        "",
    locationText: "",
    bankDetails:  "",
  });

  useEffect(() => {
    fetch(`${API}/vendors/profile`, { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.status === "success") {
          setData(j.data);
          const p = j.data.profile;
          const u = j.data.user;
          setForm({
            businessName: p?.businessName || u.displayName || "",
            description:  p?.description  || "",
            phone:        p?.phone        || u.phone || "",
            locationText: p?.locationText || "",
            bankDetails:  p?.bankDetails  || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res  = await fetch(`${API}/vendors/profile`, {
        method:      "PATCH",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(form),
      });
      const json = await res.json();
      if (json.status === "success") {
        setMsg({ text: "Profile updated successfully!", ok: true });
        setEditing(false);
        setData(prev => prev ? {
          ...prev,
          profile: json.data.profile,
          user:    { ...prev.user, ...json.data.user },
        } : prev);
      } else {
        setMsg({ text: json.message || "Update failed.", ok: false });
      }
    } catch {
      setMsg({ text: "Network error.", ok: false });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/login");
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#71717A" }}>Loading profile...</div>;
  }

  if (!data) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#71717A" }}>Could not load profile.</div>;
  }

  const { user, profile } = data;
  const initials = (user.displayName || user.email).slice(0, 2).toUpperCase();
  const statusColor = user.accountStatus === "ACTIVE" ? "#10b981" : "#f59e0b";

  return (
    <>
      <style>{`
        .vp             { padding:28px 32px; max-width:780px; }
        .vp-card        { background:#fff; border:1.5px solid #eaeaea; border-radius:16px; padding:28px; margin-bottom:20px; }
        .vp-avatar      { width:72px; height:72px; border-radius:50%; background:${RED}; color:#fff; font-size:28px; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vp-name        { font-size:22px; font-weight:900; color:#0A0A0A; margin:0 0 4px; }
        .vp-email       { font-size:14px; color:#71717A; margin:0 0 12px; }
        .vp-badge       { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
        .vp-section-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .vp-section-ttl { font-size:16px; font-weight:800; color:#0A0A0A; margin:0; }
        .vp-row         { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
        .vp-field       { display:flex; flex-direction:column; gap:4px; }
        .vp-field label { font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; }
        .vp-field span  { font-size:14px; font-weight:600; color:#374151; }
        .vp-input       { padding:11px 14px; border:1.5px solid #eaeaea; border-radius:8px; font-size:14px; font-family:inherit; outline:none; width:100%; box-sizing:border-box; }
        .vp-input:focus { border-color:${RED}; }
        .vp-textarea    { padding:11px 14px; border:1.5px solid #eaeaea; border-radius:8px; font-size:14px; font-family:inherit; outline:none; width:100%; box-sizing:border-box; resize:vertical; min-height:80px; }
        .vp-textarea:focus { border-color:${RED}; }
        .btn-primary    { background:${RED}; color:#fff; border:none; padding:10px 22px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
        .btn-outline    { background:#fff; color:#374151; border:1.5px solid #eaeaea; padding:10px 22px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
        .btn-danger     { background:#fff; color:#dc2626; border:1.5px solid #fecaca; padding:10px 22px; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
        .msg-box        { padding:12px 16px; border-radius:8px; font-size:13px; font-weight:600; margin-bottom:16px; }
        .msg-ok         { background:#d1fae5; color:#065f46; }
        .msg-err        { background:#fee2e2; color:#991b1b; }

        @media (max-width:640px) {
          .vp          { padding:16px; }
          .vp-row      { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="vp">
        <h1 style={{ fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, color: "#0A0A0A", margin: "0 0 24px" }}>
          My Profile
        </h1>

        {/* Identity card */}
        <div className="vp-card">
          <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="vp-avatar">{initials}</div>
            <div style={{ flex: 1 }}>
              <h2 className="vp-name">{profile?.businessName || user.displayName || "—"}</h2>
              <p className="vp-email">{user.email}</p>
              <span
                className="vp-badge"
                style={{ background: user.accountStatus === "ACTIVE" ? "#d1fae5" : "#fef3c7", color: statusColor }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                {user.accountStatus}
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button className="btn-outline" onClick={() => { setEditing(e => !e); setMsg(null); }}>
                {editing ? "Cancel" : "✏ Edit Profile"}
              </button>
              <button className="btn-danger" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </div>
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", fontSize: "12px", color: "#9ca3af" }}>
            Member since {new Date(user.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long" })}
          </div>
        </div>

        {/* Business details */}
        <div className="vp-card">
          <div className="vp-section-hdr">
            <h3 className="vp-section-ttl">Business Details</h3>
            {!editing && profile?.isActive && (
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>✓ Profile Active</span>
            )}
          </div>

          {msg && (
            <div className={`msg-box ${msg.ok ? "msg-ok" : "msg-err"}`}>{msg.text}</div>
          )}

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="vp-row">
                <div className="vp-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Business Name</label>
                  <input
                    className="vp-input"
                    value={form.businessName}
                    onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="vp-row">
                <div className="vp-field">
                  <label>Phone Number</label>
                  <input
                    className="vp-input"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>
                <div className="vp-field">
                  <label>Location / Area</label>
                  <input
                    className="vp-input"
                    value={form.locationText}
                    onChange={e => setForm(p => ({ ...p, locationText: e.target.value }))}
                    placeholder="e.g. Soweto, Johannesburg"
                  />
                </div>
              </div>
              <div className="vp-row">
                <div className="vp-field" style={{ gridColumn: "1 / -1" }}>
                  <label>About Your Business</label>
                  <textarea
                    className="vp-textarea"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe your services and experience..."
                  />
                </div>
              </div>
              <div className="vp-row">
                <div className="vp-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Bank Details (for payouts)</label>
                  <input
                    className="vp-input"
                    value={form.bankDetails}
                    onChange={e => setForm(p => ({ ...p, bankDetails: e.target.value }))}
                    placeholder="Bank name · Account number · Branch code"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn-outline" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="vp-row">
                <div className="vp-field">
                  <label>Business Name</label>
                  <span>{profile?.businessName || "—"}</span>
                </div>
                <div className="vp-field">
                  <label>Phone</label>
                  <span>{profile?.phone || user.phone || "—"}</span>
                </div>
              </div>
              <div className="vp-row">
                <div className="vp-field">
                  <label>Location</label>
                  <span>{profile?.locationText || "—"}</span>
                </div>
                <div className="vp-field">
                  <label>Bank Details</label>
                  <span>{profile?.bankDetails ? "••••••• (saved)" : "—"}</span>
                </div>
              </div>
              {profile?.description && (
                <div className="vp-field" style={{ marginTop: "4px" }}>
                  <label>About</label>
                  <span style={{ lineHeight: 1.6 }}>{profile.description}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="vp-card">
          <h3 className="vp-section-ttl" style={{ marginBottom: "16px" }}>Account</h3>
          <div className="vp-row">
            <div className="vp-field">
              <label>Email Address</label>
              <span>{user.email}</span>
            </div>
            <div className="vp-field">
              <label>Account Status</label>
              <span style={{ color: statusColor, fontWeight: 700 }}>{user.accountStatus}</span>
            </div>
          </div>
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
            <button className="btn-danger" onClick={handleLogout} style={{ width: "100%" }}>
              Sign Out of kasiFix
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
