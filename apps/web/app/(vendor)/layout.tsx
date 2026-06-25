"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const RED = "#DC143C";

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",              icon: "📊" },
  { label: "Transactions", href: "/dashboard/transactions", icon: "💳" },
  { label: "Reports",      href: "/dashboard/reports",      icon: "📈" },
  { label: "Profile",      href: "/dashboard/profile",      icon: "👤" },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    window.location.href = "/login";
  };

  const sidebarContent = (
    <>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0" }}>
        <Link href="/" style={{ textDecoration: "none", color: RED, fontSize: "22px", fontWeight: 900, letterSpacing: "-0.5px" }}>
          kasiFix
        </Link>
        <div style={{ fontSize: "11px", color: "#71717A", marginTop: "2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Vendor Portal
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 14px", borderRadius: "8px", marginBottom: "4px",
                textDecoration: "none", fontWeight: isActive ? 700 : 500,
                fontSize: "14px",
                backgroundColor: isActive ? "#fff1f2" : "transparent",
                color: isActive ? RED : "#333",
                borderLeft: isActive ? `3px solid ${RED}` : "3px solid transparent",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0" }}>
        <Link
          href="/dashboard/profile"
          onClick={() => setMobileOpen(false)}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            textDecoration: "none", color: "#71717A", fontSize: "13px",
            padding: "8px", borderRadius: "8px", marginBottom: "8px",
          }}
        >
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: RED, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
            V
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#0A0A0A", fontSize: "13px" }}>Vendor Account</div>
            <div style={{ fontSize: "11px", color: RED }}>View Profile →</div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "11px",
            background: "#dc2626", border: "none",
            borderRadius: "8px", color: "#fff", fontWeight: 800,
            fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          <span>⎋</span> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .vendor-shell      { display:flex; min-height:100vh; background:#f8f9fa; font-family:sans-serif; }
        .vendor-sidebar    { width:240px; background:#fff; border-right:1px solid #eaeaea; display:flex; flex-direction:column; flex-shrink:0; position:sticky; top:0; height:100vh; overflow-y:auto; }
        .vendor-main       { flex:1; min-width:0; overflow-y:auto; }

        /* Mobile top bar */
        .vendor-topbar     { display:none; align-items:center; justify-content:space-between; padding:14px 16px; background:#fff; border-bottom:1px solid #eaeaea; position:sticky; top:0; z-index:50; }
        .vendor-topbar-logo{ color:${RED}; font-size:20px; font-weight:900; text-decoration:none; }
        .vendor-hamburger  { background:none; border:none; font-size:22px; cursor:pointer; color:#0A0A0A; }

        /* Mobile drawer */
        .vendor-drawer-wrap  { display:none; position:fixed; inset:0; z-index:200; }
        .vendor-drawer-wrap.open { display:block; }
        .vendor-drawer-overlay   { position:absolute; inset:0; background:rgba(0,0,0,.45); }
        .vendor-drawer           { position:absolute; left:0; top:0; bottom:0; width:260px; background:#fff; display:flex; flex-direction:column; }

        @media (max-width:768px) {
          .vendor-sidebar  { display:none; }
          .vendor-topbar   { display:flex; }
        }
      `}</style>

      <div className="vendor-shell">
        {/* Desktop sidebar */}
        <aside className="vendor-sidebar">
          {sidebarContent}
        </aside>

        {/* Mobile top bar */}
        <div style={{ display: "none", flexDirection: "column", flex: 1 }} className="vendor-mobile-col">
          <header className="vendor-topbar">
            <Link href="/" className="vendor-topbar-logo">kasiFix</Link>
            <button className="vendor-hamburger" onClick={() => setMobileOpen(true)}>☰</button>
          </header>
        </div>

        {/* Mobile drawer */}
        <div className={`vendor-drawer-wrap${mobileOpen ? " open" : ""}`}>
          <div className="vendor-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="vendor-drawer">
            {sidebarContent}
          </div>
        </div>

        {/* Main content */}
        <main className="vendor-main">
          {/* Mobile header shown inside main */}
          <header style={{
            display: "none", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: "#fff", borderBottom: "1px solid #eaeaea",
            position: "sticky", top: 0, zIndex: 50
          }} id="vendor-mobile-header">
            <Link href="/" style={{ color: RED, fontSize: "20px", fontWeight: 900, textDecoration: "none" }}>kasiFix</Link>
            <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer" }}>☰</button>
          </header>

          <style>{`
            @media (max-width:768px) {
              #vendor-mobile-header { display:flex !important; }
            }
          `}</style>

          {children}
        </main>
      </div>
    </>
  );
}
