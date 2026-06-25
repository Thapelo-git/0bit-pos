"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../../src/shared/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "Northern Cape", "North West",
];

const PAYMENT_METHODS = [
  { id: "EFT",  label: "EFT / Bank Transfer", icon: "🏦", desc: "Pay via internet banking after booking" },
  { id: "CARD", label: "Credit / Debit Card",  icon: "💳", desc: "Visa, Mastercard — secure checkout" },
  { id: "CASH", label: "Cash on Delivery",      icon: "💵", desc: "Pay the provider directly on the day" },
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=120&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=120&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=120&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=120&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=120&auto=format&fit=crop",
};
const fallback = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=120&auto=format&fit=crop";

interface User { displayName?: string; firstName?: string; email: string; }

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();

  const [user,    setUser]    = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Address form
  const [fullName,   setFullName]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [address,    setAddress]    = useState("");
  const [city,       setCity]       = useState("");
  const [province,   setProvince]   = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes,      setNotes]      = useState("");
  const [payment,    setPayment]    = useState("EFT");

  const [placing,   setPlacing]   = useState(false);
  const [error,     setError]     = useState("");
  const [confirmed, setConfirmed] = useState<{ bookings: any[]; total: number } | null>(null);

  const SERVICE_FEE = items.length > 0 ? 30 : 0;
  const grandTotal  = total + SERVICE_FEE;

  // Check auth on mount
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.status === "success" && j.data?.user) {
          const u = j.data.user;
          setUser(u);
          setFullName(u.displayName || `${u.firstName || ""}`.trim() || "");
        } else {
          router.push(`/login?redirect=/checkout`);
        }
      })
      .catch(() => router.push("/login?redirect=/checkout"))
      .finally(() => setAuthLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phone.trim())    { setError("Phone number is required."); return; }
    if (!address.trim())  { setError("Street address is required."); return; }
    if (!city.trim())     { setError("City is required."); return; }
    if (!province)        { setError("Please select your province."); return; }

    const fullAddress = `${address.trim()}, ${city.trim()}, ${province}, ${postalCode.trim()}, South Africa`;

    setPlacing(true);
    try {
      const res  = await fetch(`${API}/bookings/checkout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items:         items.map(i => ({ serviceId: i.id })),
          address:       fullAddress,
          paymentMethod: payment,
          notes:         notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        clearCart();
        setConfirmed({ bookings: json.data.bookings, total: json.data.total });
      } else {
        setError(json.message || "Checkout failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }
    setPlacing(false);
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "sans-serif", color: "#71717A" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>Checking your account…
    </div>
  );

  // ── Order confirmed ──────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <>
        <style>{`
          .confirm-wrap { max-width:600px; margin:0 auto; padding:40px 20px; font-family:sans-serif; text-align:center; }
          .confirm-icon { font-size:72px; margin-bottom:20px; }
          .confirm-h1   { font-size:28px; font-weight:900; color:#0A0A0A; margin:0 0 10px; }
          .confirm-sub  { font-size:15px; color:#71717A; margin:0 0 32px; line-height:1.7; }
          .confirm-card { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px; margin-bottom:20px; text-align:left; }
          .order-row    { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:14px; }
          .order-row:last-child { border-bottom:none; }
          .conf-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:28px; }
          .conf-btn     { padding:13px 28px; border-radius:8px; font-weight:800; font-size:14px; text-decoration:none; display:inline-block; }
        `}</style>
        <div className="confirm-wrap">
          <div className="confirm-icon">🎉</div>
          <h1 className="confirm-h1">Order Confirmed!</h1>
          <p className="confirm-sub">
            Thank you{user?.firstName ? `, ${user.firstName}` : ""}! Your{" "}
            {confirmed.bookings.length} booking{confirmed.bookings.length !== 1 ? "s have" : " has"} been placed.
            The service provider{confirmed.bookings.length !== 1 ? "s" : ""} will contact you shortly to confirm the time.
          </p>

          <div className="confirm-card">
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Your Bookings</div>
            {confirmed.bookings.map((b: any) => (
              <div key={b.id} className="order-row">
                <div>
                  <div style={{ fontWeight: 700, color: "#0A0A0A" }}>{b.service?.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Booking #{b.id.slice(-8).toUpperCase()}</div>
                </div>
                <span style={{ fontWeight: 800, color: RED }}>R {Number(b.totalAmount).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: "2px solid #eaeaea", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 16 }}>
              <span>Total Paid</span>
              <span style={{ color: RED }}>R {(confirmed.total + SERVICE_FEE).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 12, padding: "14px 20px", fontSize: 14, color: "#065f46", fontWeight: 600, marginBottom: 24 }}>
            📧 A confirmation has been sent to <strong>{user?.email}</strong>
          </div>

          <div className="conf-actions">
            <Link href="/services" className="conf-btn" style={{ background: RED, color: "#fff" }}>
              Browse More Services
            </Link>
            <Link href="/" className="conf-btn" style={{ background: "#f1f5f9", color: "#0A0A0A" }}>
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🛒</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Your cart is empty</h2>
        <p style={{ color: "#71717A", marginBottom: 24 }}>Add services to your cart before checking out.</p>
        <Link href="/services" style={{ background: RED, color: "#fff", padding: "13px 28px", borderRadius: 8, fontWeight: 800, textDecoration: "none" }}>
          Browse Services
        </Link>
      </div>
    );
  }

  // ── Main checkout ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .co-wrap       { font-family:sans-serif; }
        .co-title      { font-size:clamp(22px,4vw,30px); font-weight:900; color:#0A0A0A; margin:0 0 6px; }
        .co-sub        { font-size:14px; color:#71717A; margin:0 0 32px; }
        .co-layout     { display:flex; gap:32px; align-items:flex-start; }
        .co-left       { flex:1; min-width:0; }
        .co-right      { width:320px; flex-shrink:0; position:sticky; top:100px; }

        /* Section card */
        .co-section    { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px; margin-bottom:20px; }
        .co-sec-title  { font-size:15px; font-weight:800; color:#0A0A0A; margin:0 0 18px; display:flex; align-items:center; gap:8px; }
        .co-sec-num    { width:24px; height:24px; background:${RED}; color:#fff; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:900; flex-shrink:0; }

        /* Form fields */
        .co-grid       { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .co-field      { display:flex; flex-direction:column; gap:5px; }
        .co-field.full { grid-column:1/-1; }
        .co-label      { font-size:12px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:.4px; }
        .co-input      { padding:11px 14px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:14px; font-family:sans-serif; outline:none; width:100%; box-sizing:border-box; }
        .co-input:focus{ border-color:${RED}; }
        .co-select     { padding:11px 14px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:14px; font-family:sans-serif; outline:none; width:100%; box-sizing:border-box; background:#fff; appearance:auto; }
        .co-select:focus{ border-color:${RED}; }
        .co-textarea   { padding:11px 14px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:14px; font-family:sans-serif; outline:none; width:100%; box-sizing:border-box; resize:vertical; min-height:72px; }
        .co-textarea:focus{ border-color:${RED}; }

        /* Payment options */
        .pay-options   { display:flex; flex-direction:column; gap:10px; }
        .pay-opt       { display:flex; align-items:center; gap:14px; padding:14px 16px; border:1.5px solid #e5e7eb; border-radius:10px; cursor:pointer; transition:border-color .15s; }
        .pay-opt.sel   { border-color:${RED}; background:#fff5f5; }
        .pay-opt-icon  { font-size:24px; flex-shrink:0; }
        .pay-opt-label { font-weight:700; font-size:14px; color:#0A0A0A; }
        .pay-opt-desc  { font-size:12px; color:#71717A; }

        /* Error */
        .co-error      { background:#fee2e2; border:1px solid #fca5a5; color:#991b1b; padding:12px 16px; border-radius:8px; font-size:13px; font-weight:600; margin-bottom:16px; }

        /* Order summary (right) */
        .sum-card      { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:22px; }
        .sum-title     { font-size:15px; font-weight:800; margin:0 0 16px; }
        .sum-item      { display:flex; gap:12px; margin-bottom:12px; align-items:center; }
        .sum-img       { width:48px; height:48px; border-radius:8px; object-fit:cover; flex-shrink:0; }
        .sum-name      { font-size:13px; font-weight:700; color:#0A0A0A; line-height:1.3; }
        .sum-price     { font-size:13px; font-weight:700; color:${RED}; margin-top:2px; }
        .sum-div       { border-top:1px solid #eaeaea; margin:14px 0; }
        .sum-row       { display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px; }
        .sum-total     { display:flex; justify-content:space-between; font-size:17px; font-weight:900; }

        .place-btn     { width:100%; padding:15px; background:${RED}; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:16px; cursor:pointer; font-family:sans-serif; margin-top:18px; }
        .place-btn:disabled { opacity:.6; cursor:not-allowed; }
        .place-btn:not(:disabled):hover { opacity:.92; }

        .back-cart     { display:flex; align-items:center; gap:6px; color:${RED}; text-decoration:none; font-weight:700; font-size:14px; margin-bottom:24px; }

        @media (max-width:700px) {
          .co-layout   { flex-direction:column; }
          .co-right    { width:100%; position:static; order:-1; }
          .co-grid     { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="co-wrap">
        <Link href="/cart" className="back-cart">← Back to Cart</Link>
        <h1 className="co-title">Checkout</h1>
        <p className="co-sub">Signed in as <strong>{user?.email}</strong></p>

        <div className="co-layout">
          {/* Left — form */}
          <form className="co-left" onSubmit={handleSubmit}>
            {error && <div className="co-error">{error}</div>}

            {/* Section 1: Contact details */}
            <div className="co-section">
              <div className="co-sec-title">
                <span className="co-sec-num">1</span>
                Contact Details
              </div>
              <div className="co-grid">
                <div className="co-field">
                  <label className="co-label">Full Name *</label>
                  <input className="co-input" type="text" placeholder="e.g. Naledi Dlamini" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="co-field">
                  <label className="co-label">Phone Number *</label>
                  <input className="co-input" type="tel" placeholder="071 234 5678" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
              </div>
            </div>

            {/* Section 2: Service address */}
            <div className="co-section">
              <div className="co-sec-title">
                <span className="co-sec-num">2</span>
                Service Address
                <span style={{ fontSize: 12, color: "#71717A", fontWeight: 400 }}>Where must the provider come to?</span>
              </div>
              <div className="co-grid">
                <div className="co-field full">
                  <label className="co-label">Street Address *</label>
                  <input className="co-input" type="text" placeholder="12 Vilakazi Street, Orlando West" value={address} onChange={e => setAddress(e.target.value)} required />
                </div>
                <div className="co-field">
                  <label className="co-label">City / Town *</label>
                  <input className="co-input" type="text" placeholder="Soweto" value={city} onChange={e => setCity(e.target.value)} required />
                </div>
                <div className="co-field">
                  <label className="co-label">Province *</label>
                  <select className="co-select" value={province} onChange={e => setProvince(e.target.value)} required>
                    <option value="">Select province</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="co-field">
                  <label className="co-label">Postal Code</label>
                  <input className="co-input" type="text" placeholder="1804" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                </div>
                <div className="co-field full">
                  <label className="co-label">Special Instructions (optional)</label>
                  <textarea className="co-textarea" placeholder="e.g. Gate code is 1234, use the side entrance…" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 3: Payment */}
            <div className="co-section">
              <div className="co-sec-title">
                <span className="co-sec-num">3</span>
                Payment Method
              </div>
              <div className="pay-options">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.id} className={`pay-opt${payment === pm.id ? " sel" : ""}`} onClick={() => setPayment(pm.id)}>
                    <input type="radio" name="payment" value={pm.id} checked={payment === pm.id} onChange={() => setPayment(pm.id)} style={{ display: "none" }} />
                    <span className="pay-opt-icon">{pm.icon}</span>
                    <div>
                      <div className="pay-opt-label">{pm.label}</div>
                      <div className="pay-opt-desc">{pm.desc}</div>
                    </div>
                    {payment === pm.id && <span style={{ marginLeft: "auto", color: RED, fontSize: 18, fontWeight: 900 }}>✓</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Mobile place order */}
            <button type="submit" className="place-btn" disabled={placing} style={{ display: "none" }} id="mobile-place-btn">
              {placing ? "Placing Order…" : `Place Order — R ${grandTotal.toFixed(2)}`}
            </button>
            <style>{`@media(max-width:700px){#mobile-place-btn{display:block!important}}`}</style>
          </form>

          {/* Right — summary */}
          <div className="co-right">
            <div className="sum-card">
              <div className="sum-title">Order Summary ({items.length} item{items.length !== 1 ? "s" : ""})</div>

              {items.map(item => (
                <div key={item.id} className="sum-item">
                  <img
                    className="sum-img"
                    src={item.imageUrl || CATEGORY_IMAGES[item.category] || fallback}
                    alt={item.name}
                    onError={e => { (e.target as HTMLImageElement).src = fallback; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sum-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                    </div>
                    {item.vendorName && <div style={{ fontSize: 11, color: "#9ca3af" }}>by {item.vendorName}</div>}
                    <div className="sum-price">R {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              ))}

              <div className="sum-div" />
              <div className="sum-row"><span style={{ color: "#71717A" }}>Subtotal</span><span style={{ fontWeight: 600 }}>R {total.toFixed(2)}</span></div>
              <div className="sum-row"><span style={{ color: "#71717A" }}>Platform fee</span><span style={{ fontWeight: 600 }}>R {SERVICE_FEE.toFixed(2)}</span></div>
              <div className="sum-div" />
              <div className="sum-total">
                <span>Total</span>
                <span style={{ color: RED }}>R {grandTotal.toFixed(2)}</span>
              </div>

              <button type="submit" form="" className="place-btn" disabled={placing} onClick={handleSubmit}>
                {placing ? "Placing Order…" : `Place Order — R ${grandTotal.toFixed(2)}`}
              </button>

              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "🛡 256-bit secure checkout",
                  "✅ All providers are verified",
                  "🔄 Free rebooking guarantee",
                ].map(t => (
                  <div key={t} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
