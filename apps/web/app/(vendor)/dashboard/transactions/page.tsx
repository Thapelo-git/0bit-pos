"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: "#d1fae5", color: "#065f46" },
  PENDING:   { bg: "#fef3c7", color: "#92400e" },
  ACCEPTED:  { bg: "#dbeafe", color: "#1e40af" },
  REJECTED:  { bg: "#fee2e2", color: "#991b1b" },
  CANCELLED: { bg: "#f3f4f6", color: "#374151" },
};

interface Tx {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  category: string;
  amount: number;
  status: string;
  notes?: string;
  date: string;
}

export default function TransactionsPage() {
  const [txs,        setTxs]        = useState<Tx[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [statusFilt, setStatusFilt] = useState("ALL");
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [total,      setTotal]      = useState(0);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilt !== "ALL") params.set("status", statusFilt);
    fetch(`${API}/vendors/transactions?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(j => {
        if (j.status === "success") {
          setTxs(j.data.transactions);
          setTotal(j.data.total);
          setPages(j.data.pages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilt]);

  const downloadCSV = () => {
    const headers = ["Date", "Client", "Email", "Phone", "Service", "Category", "Amount (ZAR)", "Status"];
    const rows = txs.map(t => [
      new Date(t.date).toLocaleDateString("en-ZA"),
      t.clientName, t.clientEmail, t.clientPhone,
      t.service, t.category,
      Number(t.amount).toFixed(2), t.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = txs.filter(t => t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <style>{`
        .tx-page        { padding:28px 32px; max-width:1100px; }
        .tx-header      { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; flex-wrap:wrap; gap:12px; }
        .tx-title       { font-size:24px; font-weight:900; color:#0A0A0A; margin:0 0 4px; }
        .tx-sub         { font-size:14px; color:#71717A; margin:0; }
        .tx-actions     { display:flex; gap:10px; flex-wrap:wrap; }
        .btn-outline    { padding:9px 18px; border:1.5px solid #eaeaea; background:#fff; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; color:#374151; font-family:inherit; }
        .btn-primary    { padding:9px 18px; background:${RED}; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }

        .tx-summary     { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:16px; margin-bottom:24px; }
        .tx-stat        { background:#fff; border:1.5px solid #eaeaea; border-radius:12px; padding:18px 20px; }
        .tx-stat.hi     { background:${RED}; border-color:${RED}; }
        .tx-stat-label  { font-size:11px; font-weight:700; color:#71717A; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
        .tx-stat.hi .tx-stat-label { color:rgba(255,255,255,.7); }
        .tx-stat-val    { font-size:24px; font-weight:900; color:#0A0A0A; }
        .tx-stat.hi .tx-stat-val   { color:#fff; }

        .filter-row     { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
        .filter-chip    { padding:7px 16px; border:1.5px solid #eaeaea; background:#fff; border-radius:20px; font-size:13px; font-weight:600; cursor:pointer; color:#374151; font-family:inherit; transition:all .15s; }
        .filter-chip.on { background:${RED}; border-color:${RED}; color:#fff; }

        .tx-card        { background:#fff; border-radius:14px; border:1.5px solid #eaeaea; overflow:hidden; margin-bottom:8px; }
        .tx-row         { display:grid; grid-template-columns:1fr 1fr auto auto auto; gap:16px; align-items:center; padding:16px 20px; cursor:pointer; }
        .tx-row:hover   { background:#fafafa; }
        .tx-client      { font-weight:700; font-size:14px; color:#0A0A0A; }
        .tx-service     { font-size:13px; color:#71717A; margin-top:2px; }
        .tx-amount      { font-size:17px; font-weight:900; color:${RED}; white-space:nowrap; }
        .tx-date        { font-size:12px; color:#9ca3af; white-space:nowrap; }
        .status-badge   { padding:4px 10px; border-radius:20px; font-size:11px; font-weight:800; white-space:nowrap; }
        .tx-expand-icon { font-size:16px; color:#9ca3af; transition:transform .2s; }

        .tx-detail      { padding:16px 20px; border-top:1px solid #f1f5f9; background:#f9fafb; }
        .tx-detail-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
        .tx-detail-item label { display:block; font-size:11px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
        .tx-detail-item span  { font-size:13px; color:#374151; font-weight:600; }

        .tx-empty       { text-align:center; padding:60px 20px; color:#71717A; }
        .tx-pagination  { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:24px; }
        .pg-btn         { padding:8px 18px; border:1.5px solid #eaeaea; background:#fff; border-radius:8px; cursor:pointer; font-weight:700; font-size:13px; font-family:inherit; }
        .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
        .pg-info        { font-size:13px; color:#71717A; }

        @media (max-width:768px) {
          .tx-page { padding:16px; }
          .tx-row  { grid-template-columns:1fr auto; gap:10px; }
          .tx-date, .tx-expand-icon { display:none; }
        }
        @media (max-width:480px) {
          .tx-summary { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      <div className="tx-page">
        {/* Header */}
        <div className="tx-header">
          <div>
            <h1 className="tx-title">Transactions</h1>
            <p className="tx-sub">{total} booking{total !== 1 ? "s" : ""} total</p>
          </div>
          <div className="tx-actions">
            <button className="btn-outline" onClick={downloadCSV}>⬇ Export CSV</button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="tx-summary">
          <div className="tx-stat hi">
            <div className="tx-stat-label">Revenue Earned</div>
            <div className="tx-stat-val">R {totalRevenue.toFixed(2)}</div>
          </div>
          <div className="tx-stat">
            <div className="tx-stat-label">This Page</div>
            <div className="tx-stat-val">{txs.length}</div>
          </div>
          <div className="tx-stat">
            <div className="tx-stat-label">Completed</div>
            <div className="tx-stat-val">{txs.filter(t => t.status === "COMPLETED").length}</div>
          </div>
          <div className="tx-stat">
            <div className="tx-stat-label">Pending</div>
            <div className="tx-stat-val">{txs.filter(t => t.status === "PENDING").length}</div>
          </div>
        </div>

        {/* Status filter chips */}
        <div className="filter-row">
          {["ALL", "PENDING", "ACCEPTED", "COMPLETED", "REJECTED", "CANCELLED"].map(s => (
            <button
              key={s}
              className={`filter-chip${statusFilt === s ? " on" : ""}`}
              onClick={() => { setStatusFilt(s); setPage(1); }}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="tx-empty">Loading transactions...</div>
        ) : txs.length === 0 ? (
          <div className="tx-empty">
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💳</div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#374151", marginBottom: "8px" }}>No transactions yet</div>
            <div>Once clients book your services, their payments will appear here.</div>
          </div>
        ) : (
          txs.map(t => {
            const style = STATUS_STYLES[t.status] || STATUS_STYLES.PENDING;
            const isOpen = expanded === t.id;
            return (
              <div key={t.id} className="tx-card">
                <div className="tx-row" onClick={() => setExpanded(isOpen ? null : t.id)}>
                  <div>
                    <div className="tx-client">{t.clientName}</div>
                    <div className="tx-service">{t.service} · {t.category}</div>
                  </div>
                  <div className="tx-amount">R {Number(t.amount).toFixed(2)}</div>
                  <span className="status-badge" style={{ background: style.bg, color: style.color }}>
                    {t.status}
                  </span>
                  <div className="tx-date">{new Date(t.date).toLocaleDateString("en-ZA")}</div>
                  <div className="tx-expand-icon" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>▼</div>
                </div>
                {isOpen && (
                  <div className="tx-detail">
                    <div className="tx-detail-grid">
                      <div className="tx-detail-item"><label>Client Email</label><span>{t.clientEmail}</span></div>
                      <div className="tx-detail-item"><label>Client Phone</label><span>{t.clientPhone}</span></div>
                      <div className="tx-detail-item"><label>Service</label><span>{t.service}</span></div>
                      <div className="tx-detail-item"><label>Category</label><span>{t.category}</span></div>
                      <div className="tx-detail-item"><label>Amount</label><span style={{ color: RED, fontWeight: 900 }}>R {Number(t.amount).toFixed(2)}</span></div>
                      <div className="tx-detail-item"><label>Date</label><span>{new Date(t.date).toLocaleString("en-ZA")}</span></div>
                      {t.notes && <div className="tx-detail-item" style={{ gridColumn: "1 / -1" }}><label>Notes</label><span>{t.notes}</span></div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="tx-pagination">
            <button className="pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="pg-info">Page {page} of {pages}</span>
            <button className="pg-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
