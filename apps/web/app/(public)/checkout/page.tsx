"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../../src/shared/context/CartContext";
import { Clock, PartyPopper, Mail, ShoppingCart, Banknote, CreditCard, Wallet, Lock, Shield, CheckCircle2, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "Northern Cape", "North West",
];

const PAYMENT_METHODS = [
  { id: "EFT",  label: "EFT / Bank Transfer", icon: <Banknote size={24}/>, desc: "Pay via internet banking after booking" },
  { id: "CARD", label: "Credit / Debit Card",  icon: <CreditCard size={24}/>, desc: "Visa, Mastercard — secure checkout" },
  { id: "CASH", label: "Cash on Delivery",      icon: <Wallet size={24}/>, desc: "Pay the provider directly on the day" },
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=120&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=120&auto=format&fit=crop",
  "Beauty & Grooming":               "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=120&auto=format&fit=crop",
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

  // Card detail fields (UI capture — connect to Yoco/Peach/Stripe for live charges)
  const [cardName,   setCardName]   = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv,    setCardCvv]    = useState("");
  const [saveAddr,   setSaveAddr]   = useState(false);

  const [placing,    setPlacing]    = useState(false);
  const [error,      setError]      = useState("");
  const [confirmed,  setConfirmed]  = useState<{ bookings: any[]; total: number } | null>(null);

  interface SavedAddr { id: string; label: string; phone: string; address: string; city: string; province: string; postalCode: string; isDefault: boolean; }
  const [savedAddrs, setSavedAddrs] = useState<SavedAddr[]>([]);
  const [addrLabel,  setAddrLabel]  = useState("Home");

  const ADDRS_KEY   = "kasifix_addrs";
  const SERVICE_FEE = items.length > 0 ? 30 : 0;
  const grandTotal  = total + SERVICE_FEE;

  const fillFromAddr = (a: SavedAddr) => {
    setPhone(a.phone);
    setAddress(a.address);
    setCity(a.city);
    setProvince(a.province);
    setPostalCode(a.postalCode);
  };

  // Check auth on mount + load saved addresses
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.status === "success" && j.data?.user) {
          const u = j.data.user;
          setUser(u);
          setFullName(u.displayName || `${u.firstName || ""}`.trim() || "");
          try {
            const raw = localStorage.getItem(`${ADDRS_KEY}_${u.email}`);
            if (raw) {
              const addrs: SavedAddr[] = JSON.parse(raw);
              setSavedAddrs(addrs);
              const def = addrs.find(a => a.isDefault) || addrs[0];
              if (def) fillFromAddr(def);
            }
          } catch {}
        } else {
          router.push(`/login?redirect=/checkout`);
        }
      })
      .catch(() => router.push("/login?redirect=/checkout"))
      .finally(() => setAuthLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phone.trim())    { setError("Phone number is required."); return; }
    if (!address.trim())  { setError("Street address is required."); return; }
    if (!city.trim())     { setError("City is required."); return; }
    if (!province)        { setError("Please select your province."); return; }
    if (payment === "CARD") {
      if (!cardName.trim())   { setError("Cardholder name is required."); return; }
      if (cardNumber.replace(/\s/g, "").length < 13) { setError("Enter a valid card number."); return; }
      if (!cardExpiry.trim()) { setError("Card expiry date is required."); return; }
      if (!cardCvv.trim())    { setError("CVV is required."); return; }
    }

    // Save address for future use
    if (saveAddr && user) {
      try {
        const newEntry = { id: Date.now().toString(36), label: addrLabel || "Home", phone: phone.trim(), address: address.trim(), city: city.trim(), province, postalCode: postalCode.trim(), isDefault: savedAddrs.length === 0 };
        const updated  = [...savedAddrs.map(a => ({ ...a, isDefault: savedAddrs.length === 0 ? false : a.isDefault })), newEntry];
        localStorage.setItem(`${ADDRS_KEY}_${user.email}`, JSON.stringify(updated));
        setSavedAddrs(updated);
      } catch {}
    }

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
          phone:         phone.trim() || undefined,
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
      <div style={{ marginBottom: "12px", display:"flex", justifyContent:"center" }}><Clock size={32}/></div>Checking your account…
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
          <div className="confirm-icon" style={{display:"flex",justifyContent:"center"}}><PartyPopper size={72} color="#f59e0b"/></div>
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

          <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 12, padding: "14px 20px", fontSize: 14, color: "#065f46", fontWeight: 600, marginBottom: 24, display:"flex", alignItems:"center", gap:8 }}>
            <Mail size={16}/>A confirmation has been sent to <strong>{user?.email}</strong>
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
        <div style={{ marginBottom: "16px", display:"flex", justifyContent:"center" }}><ShoppingCart size={48} color="#9ca3af"/></div>
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
        /* Card fields */
        .card-fields   { margin-top:16px; display:grid; grid-template-columns:1fr 1fr; gap:14px; padding:16px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; }
        .card-field    { display:flex; flex-direction:column; gap:5px; }
        .card-field.full { grid-column:1/-1; }
        /* Saved addresses picker */
        .saved-addrs    { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; }
        .saved-addr-card { padding:10px 14px; border:1.5px solid #e5e7eb; border-radius:10px; cursor:pointer; min-width:140px; transition:border-color .15s,background .15s; background:#fff; }
        .saved-addr-card:hover { border-color:${RED}; }
        .saved-addr-card.active { border-color:${RED}; background:#fff5f5; }
        .sac-label      { font-size:12px; font-weight:800; color:#0A0A0A; margin-bottom:3px; display:flex; align-items:center; gap:5px; }
        .sac-detail     { font-size:11px; color:#71717A; line-height:1.5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
        .sac-default    { font-size:10px; font-weight:700; background:#fef3c7; color:#92400e; padding:1px 6px; border-radius:8px; }
        /* Save address */
        .save-addr      { display:flex; align-items:flex-start; gap:10px; padding:14px 16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; margin-top:14px; cursor:pointer; flex-wrap:wrap; }
        .save-addr input { cursor:pointer; width:16px; height:16px; accent-color:#16a34a; flex-shrink:0; margin-top:2px; }
        .save-addr-txt  { font-size:13px; font-weight:600; color:#15803d; }
        .addr-label-sel { display:flex; gap:8px; margin-top:8px; width:100%; }
        .addr-label-btn { padding:5px 14px; border-radius:20px; border:1.5px solid #bbf7d0; background:#fff; font-size:12px; font-weight:700; cursor:pointer; color:#15803d; transition:background .15s; }
        .addr-label-btn.sel { background:#15803d; color:#fff; border-color:#15803d; }

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

              {savedAddrs.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".4px" }}>Saved Addresses</div>
                  <div className="saved-addrs">
                    {savedAddrs.map(a => {
                      const active = a.address === address && a.city === city && a.province === province;
                      return (
                        <div key={a.id} className={`saved-addr-card${active ? " active" : ""}`} onClick={() => fillFromAddr(a)}>
                          <div className="sac-label">
                            {a.label}
                            {a.isDefault && <span className="sac-default">Default</span>}
                          </div>
                          <div className="sac-detail">{a.address}</div>
                          <div className="sac-detail">{a.city}, {a.province}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>or enter a different address below</div>
                </div>
              )}

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
                    {payment === pm.id && <CheckCircle2 size={18} color={RED} style={{ marginLeft: "auto", flexShrink: 0 }}/>}
                  </label>
                ))}
              </div>

              {/* Card detail fields — shown when CARD is selected */}
              {payment === "CARD" && (
                <div className="card-fields">
                  <div className="card-field full">
                    <label className="co-label">Cardholder Name *</label>
                    <input className="co-input" type="text" placeholder="Name as on card" value={cardName} onChange={e => setCardName(e.target.value)} />
                  </div>
                  <div className="card-field full">
                    <label className="co-label">Card Number *</label>
                    <input
                      className="co-input"
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardNumber}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
                      }}
                    />
                  </div>
                  <div className="card-field">
                    <label className="co-label">Expiry (MM/YY) *</label>
                    <input
                      className="co-input"
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCardExpiry(v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v);
                      }}
                    />
                  </div>
                  <div className="card-field">
                    <label className="co-label">CVV *</label>
                    <input className="co-input" type="password" placeholder="•••" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                  </div>
                  <div className="card-field full" style={{ marginTop: 4 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                      <Lock size={11}/>Your card details are encrypted and secure. Live card processing powered by Yoco / Peach Payments (integration required for production).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Save address */}
            <div className="save-addr">
              <input type="checkbox" id="save-addr-chk" checked={saveAddr} onChange={e => setSaveAddr(e.target.checked)} />
              <div style={{ flex: 1 }}>
                <label htmlFor="save-addr-chk" className="save-addr-txt" style={{ cursor: "pointer" }}>
                  Save this address for next time
                </label>
                {saveAddr && (
                  <div className="addr-label-sel">
                    {["Home", "Work", "Other"].map(lbl => (
                      <button key={lbl} type="button" className={`addr-label-btn${addrLabel === lbl ? " sel" : ""}`} onClick={() => setAddrLabel(lbl)}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                )}
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

              <button type="button" className="place-btn" disabled={placing} onClick={handleSubmit}>
                {placing ? "Placing Order…" : `Place Order — R ${grandTotal.toFixed(2)}`}
              </button>

              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: <Shield size={13}/>, text: "256-bit secure checkout" },
                  { icon: <CheckCircle2 size={13}/>, text: "All providers are verified" },
                  { icon: <RefreshCw size={13}/>, text: "Free rebooking guarantee" },
                ].map(t => (
                  <div key={t.text} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>{t.icon}{t.text}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
