"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=120&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=120&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=120&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=120&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=120&auto=format&fit=crop",
};
const fallback = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=120&auto=format&fit=crop";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  ACCEPTED:  { bg: "#dbeafe", color: "#1e40af", label: "Accepted" },
  REJECTED:  { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
  COMPLETED: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
  CANCELLED: { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
};

const PAY_ICON: Record<string, string> = {
  CARD: "💳", EFT: "🏦", CASH: "💵",
};

interface Booking {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  service: {
    name: string;
    category: string;
    price: number;
    imageUrl: string | null;
    vendorProfile: { businessName: string; phone: string | null } | null;
  };
}

export default function MyOrdersPage() {
  const router  = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("ALL");

  useEffect(() => {
    fetch(`${API}/bookings/my-orders`, { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.status === "success") {
          setBookings(j.data.bookings || []);
        } else {
          router.push("/login?redirect=/my-orders");
        }
      })
      .catch(() => router.push("/login?redirect=/my-orders"))
      .finally(() => setLoading(false));
  }, [router]);

  const FILTERS = ["ALL", "PENDING", "ACCEPTED", "COMPLETED", "REJECTED"];
  const shown   = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "sans-serif", color: "#71717A" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>Loading your orders…
    </div>
  );

  return (
    <>
      <style>{`
        .mo-wrap      { font-family:sans-serif; max-width:860px; }
        .mo-title     { font-size:clamp(22px,4vw,28px); font-weight:900; color:#0A0A0A; margin:0 0 4px; }
        .mo-sub       { font-size:14px; color:#71717A; margin:0 0 20px; }
        .mo-filters   { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
        .mo-filter    { padding:7px 16px; border-radius:20px; border:1.5px solid #eaeaea; background:#fff; font-size:13px; font-weight:700; cursor:pointer; color:#374151; transition:all .15s; }
        .mo-filter.active { background:${RED}; border-color:${RED}; color:#fff; }
        .mo-list      { display:flex; flex-direction:column; gap:14px; }
        .mo-card      { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; overflow:hidden; }
        .mo-card-top  { display:flex; gap:14px; padding:16px; }
        .mo-img       { width:72px; height:72px; border-radius:10px; object-fit:cover; flex-shrink:0; }
        .mo-info      { flex:1; min-width:0; }
        .mo-svc       { font-size:16px; font-weight:800; color:#0A0A0A; margin:0 0 3px; }
        .mo-vendor    { font-size:13px; color:#71717A; margin:0 0 6px; }
        .mo-meta      { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
        .mo-badge     { padding:3px 10px; border-radius:12px; font-size:11px; font-weight:800; }
        .mo-pay       { font-size:12px; color:#374151; font-weight:600; background:#f9fafb; padding:3px 10px; border-radius:12px; }
        .mo-amount    { font-size:18px; font-weight:900; color:${RED}; flex-shrink:0; }
        .mo-card-foot { background:#fafafa; border-top:1px solid #f0f0f0; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
        .mo-date      { font-size:12px; color:#9ca3af; }
        .mo-addr      { font-size:12px; color:#71717A; max-width:360px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mo-status-info { font-size:12px; color:#6b7280; }
        .mo-empty     { text-align:center; padding:60px 20px; }
        @media (max-width:500px) {
          .mo-card-top { flex-direction:column; }
          .mo-img      { width:100%; height:160px; border-radius:8px; }
        }
      `}</style>

      <div className="mo-wrap">
        <h1 className="mo-title">My Orders</h1>
        <p className="mo-sub">{bookings.length} order{bookings.length !== 1 ? "s" : ""} total</p>

        {/* Filter chips */}
        <div className="mo-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`mo-filter${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "All" : (STATUS_STYLE[f]?.label || f)}{" "}
              <span style={{ fontWeight: 400, opacity: 0.75 }}>
                ({f === "ALL" ? bookings.length : bookings.filter(b => b.status === f).length})
              </span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="mo-empty">
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📋</div>
            <h2 style={{ fontWeight: 900, color: "#0A0A0A", margin: "0 0 8px" }}>
              {filter === "ALL" ? "No orders yet" : `No ${STATUS_STYLE[filter]?.label || filter.toLowerCase()} orders`}
            </h2>
            <p style={{ color: "#71717A", margin: "0 0 24px" }}>
              {filter === "ALL"
                ? "Browse services and book your first appointment."
                : "Try a different filter."}
            </p>
            {filter === "ALL" && (
              <Link href="/services" style={{ background: RED, color: "#fff", padding: "13px 28px", borderRadius: "8px", fontWeight: 800, textDecoration: "none" }}>
                Browse Services
              </Link>
            )}
          </div>
        ) : (
          <div className="mo-list">
            {shown.map(b => {
              const st    = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
              const img   = b.service.imageUrl || CATEGORY_IMAGES[b.service.category] || fallback;
              const pm    = (b.paymentMethod || "").toUpperCase();
              const pmIcon = PAY_ICON[pm] || "💰";
              return (
                <div key={b.id} className="mo-card">
                  <div className="mo-card-top">
                    <img
                      className="mo-img"
                      src={img}
                      alt={b.service.name}
                      onError={e => { (e.target as HTMLImageElement).src = fallback; }}
                    />
                    <div className="mo-info">
                      <div className="mo-svc">{b.service.name}</div>
                      {b.service.vendorProfile && (
                        <div className="mo-vendor">
                          by {b.service.vendorProfile.businessName}
                          {b.service.vendorProfile.phone && (
                            <span style={{ marginLeft: 8, color: "#374151" }}>· {b.service.vendorProfile.phone}</span>
                          )}
                        </div>
                      )}
                      <div className="mo-meta">
                        <span className="mo-badge" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        {pm && (
                          <span className="mo-pay">{pmIcon} {pm === "EFT" ? "EFT / Bank Transfer" : pm === "CARD" ? "Credit/Debit Card" : "Cash on Delivery"}</span>
                        )}
                      </div>
                    </div>
                    <div className="mo-amount">R {Number(b.totalAmount).toFixed(2)}</div>
                  </div>
                  <div className="mo-card-foot">
                    <div>
                      <div className="mo-date">Booked {new Date(b.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</div>
                      {b.address && <div className="mo-addr" title={b.address}>📍 {b.address}</div>}
                    </div>
                    <div className="mo-status-info">
                      {b.status === "PENDING"   && "⏳ Awaiting vendor confirmation"}
                      {b.status === "ACCEPTED"  && "✅ Vendor accepted — await service"}
                      {b.status === "COMPLETED" && "🎉 Service completed"}
                      {b.status === "REJECTED"  && "❌ Vendor could not fulfil this booking"}
                      {b.status === "CANCELLED" && "🚫 Booking cancelled"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
