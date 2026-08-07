"use client";
import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const RED  = "#DC143C";

interface MonthData { month: string; revenue: number; bookings: number; }
interface TopService { name: string; category: string; bookings: number; revenue: number; }
interface Summary {
  totalRevenue: number;
  totalBookings: number;
  completedOrders: number;
  avgOrderValue: number;
  completionRate: number;
}
interface ReportData {
  summary: Summary;
  revenueByMonth: MonthData[];
  statusBreakdown: Record<string, number>;
  topServices: TopService[];
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "#10b981",
  PENDING:   "#f59e0b",
  ACCEPTED:  "#0284c7",
  REJECTED:  "#ef4444",
  CANCELLED: "#9ca3af",
};

export default function ReportsPage() {
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/vendors/reports`, { credentials: "include" })
      .then(r => r.json())
      .then(j => { if (j.status === "success") setData(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#71717A" }}>
        Loading reports...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#71717A" }}>
        <div style={{ marginBottom: "16px", display:"flex", justifyContent:"center" }}><BarChart2 size={48} color="#9ca3af"/></div>
        <div style={{ fontWeight: 700 }}>No report data available yet</div>
        <p>Start accepting bookings to see your performance reports here.</p>
      </div>
    );
  }

  const { summary, revenueByMonth, statusBreakdown, topServices } = data;
  const maxRevenue  = Math.max(...revenueByMonth.map(m => m.revenue), 1);
  const maxBookings = Math.max(...revenueByMonth.map(m => m.bookings), 1);
  const totalStatuses = Object.values(statusBreakdown).reduce((s, v) => s + v, 0);

  return (
    <>
      <style>{`
        .rp              { padding:28px 32px; max-width:1100px; }
        .rp-title        { font-size:24px; font-weight:900; color:#0A0A0A; margin:0 0 4px; }
        .rp-sub          { font-size:14px; color:#71717A; margin:0 0 28px; }

        /* KPI row */
        .kpi-row         { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:16px; margin-bottom:32px; }
        .kpi             { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:20px 22px; }
        .kpi.hi          { background:${RED}; border-color:${RED}; }
        .kpi-label       { font-size:11px; font-weight:700; color:#71717A; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
        .kpi.hi .kpi-label { color:rgba(255,255,255,.7); }
        .kpi-val         { font-size:26px; font-weight:900; color:#0A0A0A; }
        .kpi.hi .kpi-val { color:#fff; }
        .kpi-sub         { font-size:12px; color:#9ca3af; margin-top:4px; }
        .kpi.hi .kpi-sub { color:rgba(255,255,255,.55); }

        /* Section header */
        .sec-h           { font-size:17px; font-weight:800; color:#0A0A0A; margin:0 0 16px; }

        /* Chart card */
        .chart-card      { background:#fff; border:1.5px solid #eaeaea; border-radius:14px; padding:24px; margin-bottom:24px; }

        /* Bar chart */
        .bar-chart       { display:flex; align-items:flex-end; gap:10px; height:160px; margin-top:8px; }
        .bar-col         { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; }
        .bar-wrap        { width:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; flex:1; }
        .bar             { width:100%; border-radius:6px 6px 0 0; min-height:4px; transition:height .4s; }
        .bar-label       { font-size:10px; color:#9ca3af; font-weight:600; text-align:center; white-space:nowrap; }
        .bar-val         { font-size:11px; font-weight:700; color:#374151; }

        /* Dual bars legend */
        .chart-legend    { display:flex; gap:16px; margin-bottom:12px; }
        .legend-item     { display:flex; align-items:center; gap:6px; font-size:12px; color:#71717A; font-weight:600; }
        .legend-dot      { width:10px; height:10px; border-radius:50%; }

        /* Donut-style status breakdown */
        .status-list     { display:flex; flex-direction:column; gap:12px; }
        .status-row      { display:flex; align-items:center; gap:12px; }
        .status-bar-bg   { flex:1; background:#f1f5f9; border-radius:20px; height:10px; overflow:hidden; }
        .status-bar-fill { height:100%; border-radius:20px; transition:width .5s; }
        .status-name     { font-size:13px; font-weight:700; color:#374151; width:80px; }
        .status-count    { font-size:13px; font-weight:700; color:#374151; width:32px; text-align:right; }
        .status-pct      { font-size:12px; color:#9ca3af; width:38px; text-align:right; }

        /* Top services */
        .top-svc-list    { display:flex; flex-direction:column; gap:10px; }
        .top-svc-item    { display:flex; align-items:center; gap:14px; padding:14px 16px; background:#f9fafb; border-radius:10px; }
        .top-svc-rank    { width:28px; height:28px; border-radius:50%; background:${RED}; color:#fff; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .top-svc-info    { flex:1; }
        .top-svc-name    { font-weight:700; font-size:14px; color:#0A0A0A; }
        .top-svc-cat     { font-size:12px; color:#71717A; }
        .top-svc-stats   { text-align:right; }
        .top-svc-rev     { font-size:15px; font-weight:900; color:${RED}; }
        .top-svc-bk      { font-size:12px; color:#9ca3af; }

        /* Grid layout */
        .rp-grid         { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; }

        /* Empty state */
        .rp-empty        { text-align:center; padding:40px; color:#9ca3af; }

        @media (max-width:900px) { .rp-grid { grid-template-columns:1fr; } }
        @media (max-width:640px) {
          .rp { padding:16px; }
          .kpi-row { grid-template-columns:1fr 1fr; }
          .bar-label { font-size:9px; }
        }
        @media (max-width:420px) {
          .kpi-row { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="rp">
        <h1 className="rp-title">Performance Reports</h1>
        <p className="rp-sub">All-time analytics for your business</p>

        {/* ── KPI CARDS ── */}
        <div className="kpi-row">
          <div className="kpi hi">
            <div className="kpi-label">Total Revenue</div>
            <div className="kpi-val">R {summary.totalRevenue.toFixed(2)}</div>
            <div className="kpi-sub">from completed bookings</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Total Bookings</div>
            <div className="kpi-val">{summary.totalBookings}</div>
            <div className="kpi-sub">all time</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Completed</div>
            <div className="kpi-val">{summary.completedOrders}</div>
            <div className="kpi-sub">{summary.completionRate.toFixed(1)}% completion rate</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Avg Order Value</div>
            <div className="kpi-val">R {summary.avgOrderValue.toFixed(2)}</div>
            <div className="kpi-sub">per completed booking</div>
          </div>
        </div>

        {/* ── REVENUE CHART ── */}
        <div className="chart-card">
          <div className="sec-h">Revenue — Last 6 Months</div>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: RED }} />Revenue (R)</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: "#0284c7" }} />Bookings</div>
          </div>
          <div className="bar-chart">
            {revenueByMonth.map(m => (
              <div key={m.month} className="bar-col">
                <div className="bar-wrap" style={{ position: "relative" }}>
                  {/* Revenue bar */}
                  <div
                    className="bar"
                    style={{
                      height: `${(m.revenue / maxRevenue) * 120}px`,
                      background: RED,
                      width: "40%",
                      position: "absolute",
                      right: "52%",
                      bottom: 0,
                      opacity: m.revenue === 0 ? 0.2 : 1,
                    }}
                    title={`R ${m.revenue.toFixed(2)}`}
                  />
                  {/* Bookings bar */}
                  <div
                    className="bar"
                    style={{
                      height: `${(m.bookings / maxBookings) * 120}px`,
                      background: "#0284c7",
                      width: "40%",
                      position: "absolute",
                      left: "52%",
                      bottom: 0,
                      opacity: m.bookings === 0 ? 0.2 : 1,
                    }}
                    title={`${m.bookings} bookings`}
                  />
                </div>
                <div className="bar-label">{m.month}</div>
              </div>
            ))}
          </div>
          {revenueByMonth.every(m => m.revenue === 0) && (
            <div className="rp-empty">No revenue yet — complete bookings to see data here.</div>
          )}
        </div>

        <div className="rp-grid">
          {/* ── STATUS BREAKDOWN ── */}
          <div className="chart-card">
            <div className="sec-h">Booking Status Breakdown</div>
            {totalStatuses === 0 ? (
              <div className="rp-empty">No bookings yet.</div>
            ) : (
              <div className="status-list">
                {Object.entries(statusBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="status-row">
                      <div className="status-name" style={{ color: STATUS_COLOR[status] || "#374151" }}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </div>
                      <div className="status-bar-bg">
                        <div
                          className="status-bar-fill"
                          style={{
                            width: `${(count / totalStatuses) * 100}%`,
                            background: STATUS_COLOR[status] || "#9ca3af",
                          }}
                        />
                      </div>
                      <div className="status-count">{count}</div>
                      <div className="status-pct">{((count / totalStatuses) * 100).toFixed(0)}%</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* ── MONTH SUMMARY TABLE ── */}
          <div className="chart-card">
            <div className="sec-h">Monthly Breakdown</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 0", color: "#9ca3af", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>Month</th>
                  <th style={{ textAlign: "right", padding: "8px 0", color: "#9ca3af", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>Bookings</th>
                  <th style={{ textAlign: "right", padding: "8px 0", color: "#9ca3af", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...revenueByMonth].reverse().map(m => (
                  <tr key={m.month}>
                    <td style={{ padding: "10px 0", color: "#374151", fontWeight: 600, borderBottom: "1px solid #f9fafb" }}>{m.month}</td>
                    <td style={{ padding: "10px 0", textAlign: "right", color: "#374151", borderBottom: "1px solid #f9fafb" }}>{m.bookings}</td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: RED, borderBottom: "1px solid #f9fafb" }}>
                      R {m.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TOP SERVICES ── */}
        <div className="chart-card">
          <div className="sec-h">Top Performing Services</div>
          {topServices.length === 0 ? (
            <div className="rp-empty">No service data yet.</div>
          ) : (
            <div className="top-svc-list">
              {topServices.map((s, i) => (
                <div key={s.name} className="top-svc-item">
                  <div className="top-svc-rank">{i + 1}</div>
                  <div className="top-svc-info">
                    <div className="top-svc-name">{s.name}</div>
                    <div className="top-svc-cat">{s.category}</div>
                  </div>
                  <div className="top-svc-stats">
                    <div className="top-svc-rev">R {s.revenue.toFixed(2)}</div>
                    <div className="top-svc-bk">{s.bookings} booking{s.bookings !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
