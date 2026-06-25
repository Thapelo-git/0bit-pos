"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../../src/shared/context/CartContext";

const RED = "#DC143C";

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning":                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop",
  "Fitness & Wellness":               "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=200&auto=format&fit=crop",
  "Personal Services":                "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200&auto=format&fit=crop",
  "Home Maintenance & Trades":        "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?q=80&w=200&auto=format&fit=crop",
  "Professional Training & Coaching": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=200&auto=format&fit=crop",
};
const fallback = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=200&auto=format&fit=crop";

export default function CartPage() {
  const { items, total, removeItem, updateQty, clearCart } = useCart();
  const router = useRouter();

  const SERVICE_FEE = items.length > 0 ? 30 : 0;
  const grandTotal  = total + SERVICE_FEE;

  if (items.length === 0) {
    return (
      <>
        <style>{`
          .empty-cart { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; text-align:center; font-family:sans-serif; }
          .empty-icon { font-size:72px; margin-bottom:20px; }
          .empty-title{ font-size:24px; font-weight:900; color:#0A0A0A; margin-bottom:10px; }
          .empty-sub  { font-size:15px; color:#71717A; max-width:360px; margin-bottom:32px; line-height:1.6; }
          .empty-btn  { background:${RED}; color:#fff; padding:14px 32px; border-radius:8px; font-weight:800; font-size:15px; text-decoration:none; }
        `}</style>
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h1 className="empty-title">Your cart is empty</h1>
          <p className="empty-sub">Browse our services and add something to your cart — no account needed to get started.</p>
          <Link href="/services" className="empty-btn">Browse Services</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .cart-wrap       { font-family:sans-serif; }
        .cart-title      { font-size:clamp(22px,4vw,30px); font-weight:900; color:#0A0A0A; margin:0 0 6px; }
        .cart-sub        { font-size:14px; color:#71717A; margin:0 0 28px; }
        .cart-layout     { display:flex; gap:28px; align-items:flex-start; }
        .cart-items      { flex:1; min-width:0; }
        .cart-summary    { width:300px; flex-shrink:0; position:sticky; top:100px; }

        .cart-item       { display:flex; gap:14px; background:#fff; border:1.5px solid #eaeaea; border-radius:12px; padding:16px; margin-bottom:12px; align-items:flex-start; }
        .cart-item-img   { width:80px; height:80px; border-radius:8px; object-fit:cover; flex-shrink:0; }
        .cart-item-info  { flex:1; min-width:0; }
        .cart-item-cat   { font-size:11px; font-weight:700; color:${RED}; text-transform:uppercase; letter-spacing:.4px; margin-bottom:4px; }
        .cart-item-name  { font-size:15px; font-weight:800; color:#0A0A0A; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cart-item-vendor{ font-size:13px; color:#71717A; margin-bottom:10px; }
        .cart-item-row   { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .cart-item-price { font-size:18px; font-weight:900; color:${RED}; }
        .qty-ctrl        { display:flex; align-items:center; gap:0; border:1.5px solid #eaeaea; border-radius:6px; overflow:hidden; }
        .qty-btn         { width:30px; height:30px; border:none; background:#f8f9fa; cursor:pointer; font-size:16px; font-weight:700; color:#374151; display:flex; align-items:center; justify-content:center; }
        .qty-btn:hover   { background:#eaeaea; }
        .qty-val         { width:36px; text-align:center; font-size:14px; font-weight:700; color:#0A0A0A; border:none; border-left:1.5px solid #eaeaea; border-right:1.5px solid #eaeaea; background:#fff; height:30px; line-height:30px; }
        .remove-btn      { background:none; border:none; color:#9ca3af; cursor:pointer; font-size:12px; font-weight:600; padding:4px; }
        .remove-btn:hover{ color:#ef4444; }

        /* Summary */
        .summary-card    { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px; }
        .summary-title   { font-size:16px; font-weight:800; color:#0A0A0A; margin:0 0 20px; }
        .summary-row     { display:flex; justify-content:space-between; font-size:14px; margin-bottom:12px; }
        .summary-div     { border-top:1px solid #eaeaea; margin:16px 0; }
        .summary-total   { display:flex; justify-content:space-between; font-size:18px; font-weight:900; color:#0A0A0A; }
        .checkout-btn    { width:100%; padding:15px; background:${RED}; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:16px; cursor:pointer; font-family:sans-serif; margin-top:16px; }
        .checkout-btn:hover { opacity:.92; }
        .continue-link   { display:block; text-align:center; color:#71717A; text-decoration:none; font-size:13px; font-weight:600; margin-top:12px; }
        .continue-link:hover { color:${RED}; }

        .clear-btn       { background:none; border:none; color:#9ca3af; font-size:12px; font-weight:600; cursor:pointer; padding:0; margin-bottom:20px; }
        .clear-btn:hover { color:#ef4444; }

        /* Trust strip */
        .cart-trust      { display:flex; gap:12px; background:#f8f9fa; border-radius:12px; padding:16px; margin-top:16px; }
        .ct-item         { flex:1; text-align:center; font-size:11px; color:#374151; font-weight:600; line-height:1.4; }
        .ct-icon         { font-size:18px; display:block; margin-bottom:4px; }

        @media (max-width:700px) {
          .cart-layout  { flex-direction:column; }
          .cart-summary { width:100%; position:static; }
        }
      `}</style>

      <div className="cart-wrap">
        <h1 className="cart-title">Shopping Cart</h1>
        <p className="cart-sub">{items.length} service{items.length !== 1 ? "s" : ""} in your cart — no account needed to browse</p>

        <button className="clear-btn" onClick={clearCart}>✕ Clear all items</button>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <img
                  className="cart-item-img"
                  src={item.imageUrl || CATEGORY_IMAGES[item.category] || fallback}
                  alt={item.name}
                  onError={e => { (e.target as HTMLImageElement).src = fallback; }}
                />
                <div className="cart-item-info">
                  <div className="cart-item-cat">{item.category}</div>
                  <div className="cart-item-name" title={item.name}>{item.name}</div>
                  {item.vendorName && <div className="cart-item-vendor">by {item.vendorName}</div>}
                  <div className="cart-item-row">
                    <span className="cart-item-price">R {(item.price * item.quantity).toFixed(2)}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="qty-ctrl">
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                        <span className="qty-val">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeItem(item.id)}>✕ Remove</button>
                    </div>
                  </div>
                  {item.quantity > 1 && (
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                      R {item.price.toFixed(2)} × {item.quantity}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <div className="summary-card">
              <div className="summary-title">Order Summary</div>
              {items.map(item => (
                <div key={item.id} className="summary-row">
                  <span style={{ color: "#374151", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
                  </span>
                  <span style={{ fontWeight: 600 }}>R {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="summary-div" />
              <div className="summary-row">
                <span style={{ color: "#71717A" }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>R {total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: "#71717A" }}>Platform fee</span>
                <span style={{ fontWeight: 600 }}>R {SERVICE_FEE.toFixed(2)}</span>
              </div>
              <div className="summary-div" />
              <div className="summary-total">
                <span>Total</span>
                <span style={{ color: RED }}>R {grandTotal.toFixed(2)}</span>
              </div>

              <button className="checkout-btn" onClick={() => router.push("/checkout")}>
                Proceed to Checkout →
              </button>
              <Link href="/services" className="continue-link">← Continue Shopping</Link>
            </div>

            {/* Trust strip */}
            <div className="cart-trust">
              {[
                { icon: "🛡", text: "Secure checkout" },
                { icon: "✅", text: "Verified providers" },
                { icon: "🔄", text: "Free rebooking" },
              ].map(t => (
                <div key={t.text} className="ct-item">
                  <span className="ct-icon">{t.icon}</span>
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
