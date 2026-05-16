import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LabelList,
} from 'recharts';
import InvoiceUpload from './InvoiceUpload';

/* ─── Count-up hook ──────────────────────────────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target === 0) return;
    if (started.current) { setVal(target); return; }
    started.current = true;
    let t0 = null;
    const raf = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target]);
  return val;
}

const IC_STYLES = `
@keyframes ic-banner   { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
@keyframes ic-upload   { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
@keyframes ic-card-up  { from{opacity:0;transform:translateY(34px) scale(.93);filter:blur(2px)} to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)} }
@keyframes ic-filter   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes ic-chart-in { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
`;

const COLORS = {
  approved:   '#16a34a',
  extracted:  '#2563eb',
  processing: '#d97706',
  error:      '#dc2626',
};

const CHART_PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#14b8a6'];

function getRange(filter, custom) {
  const now = new Date();
  const start = new Date();
  if (filter === 'week')   { start.setDate(now.getDate() - 6); }
  else if (filter === 'month') { start.setDate(now.getDate() - 29); }
  else if (filter === 'year')  { start.setMonth(now.getMonth() - 11); start.setDate(1); }
  else if (filter === 'custom' && custom.from && custom.to) {
    return { start: new Date(custom.from), end: new Date(custom.to + 'T23:59:59') };
  }
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

function buildBarData(invoices, filter) {
  const { start, end } = getRange(filter, {});
  const filtered = invoices.filter(i => {
    const d = new Date(i.uploaded_at);
    return d >= start && d <= end;
  });

  if (filter === 'week') {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      const dayInvoices = filtered.filter(inv => {
        const id = new Date(inv.uploaded_at); id.setHours(0,0,0,0);
        return id.getTime() === d.getTime();
      });
      days.push({
        label,
        amount: dayInvoices.reduce((s, inv) => s + parseFloat(inv.extracted_data?.total_amount || 0), 0),
        count: dayInvoices.length,
      });
    }
    return days;
  }

  if (filter === 'month') {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const wStart = new Date(); wStart.setDate(wStart.getDate() - i * 7 - 6); wStart.setHours(0,0,0,0);
      const wEnd   = new Date(); wEnd.setDate(wEnd.getDate() - i * 7); wEnd.setHours(23,59,59,999);
      const label  = `Week ${4 - i}`;
      const wInv   = filtered.filter(inv => { const d = new Date(inv.uploaded_at); return d >= wStart && d <= wEnd; });
      weeks.push({
        label,
        amount: wInv.reduce((s, inv) => s + parseFloat(inv.extracted_data?.total_amount || 0), 0),
        count: wInv.length,
      });
    }
    return weeks;
  }

  // year — 12 months
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0,0,0,0);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const mInv = filtered.filter(inv => { const id = new Date(inv.uploaded_at); return id >= d && id <= mEnd; });
    months.push({
      label,
      amount: mInv.reduce((s, inv) => s + parseFloat(inv.extracted_data?.total_amount || 0), 0),
      count: mInv.length,
    });
  }
  return months;
}

function buildCustomBarData(invoices, from, to) {
  if (!from || !to) return [];
  const start = new Date(from);
  const end   = new Date(to + 'T23:59:59');
  const filtered = invoices.filter(i => { const d = new Date(i.uploaded_at); return d >= start && d <= end; });
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const result = [];

  for (let i = 0; i <= diff; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i); d.setHours(0,0,0,0);
    const dEnd = new Date(d); dEnd.setHours(23,59,59,999);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const dInv = filtered.filter(inv => { const id = new Date(inv.uploaded_at); return id >= d && id <= dEnd; });
    result.push({
      label,
      amount: dInv.reduce((s, inv) => s + parseFloat(inv.extracted_data?.total_amount || 0), 0),
      count: dInv.length,
    });
  }
  return result;
}

function buildVendorData(invoices, filter, custom) {
  const { start, end } = filter === 'custom' ? getRange('custom', custom) : getRange(filter, {});
  const filtered = invoices.filter(i => { const d = new Date(i.uploaded_at); return d >= start && d <= end && i.extracted_data?.vendor; });
  const map = {};
  filtered.forEach(inv => {
    const v = inv.extracted_data.vendor;
    map[v] = (map[v] || 0) + parseFloat(inv.extracted_data?.total_amount || 0);
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: '#0f172a' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name === 'amount' ? `₹${Number(p.value).toLocaleString('en-IN')}` : p.value}
        </p>
      ))}
    </div>
  );
};

const FILTERS = [
  { key: 'week',   label: 'Week' },
  { key: 'month',  label: 'Month' },
  { key: 'year',   label: 'Year' },
  { key: 'custom', label: 'Custom' },
];

/* ─── Accent-line chart card wrapper ─────────────────────────────────── */
function ChartCard({ accentA, accentB, title, children, delay = '0s' }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,.07)',
      border: '1px solid #f1f5f9',
      animation: `ic-chart-in 0.85s ease ${delay} both`,
    }}>
      {/* coloured top-accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${accentA},${accentB})` }} />
      {/* card body */}
      <div style={{ padding: '16px 16px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function InvoiceCharts({ invoices, tenant, onUploaded }) {
  const [filter, setFilter]   = useState('month');
  const [custom, setCustom]   = useState({ from: '', to: '' });

  const statusData = useMemo(() => [
    { name: 'Approved',   value: invoices.filter(i => i.status === 'approved').length,   color: COLORS.approved },
    { name: 'Extracted',  value: invoices.filter(i => i.status === 'extracted').length,  color: COLORS.extracted },
    { name: 'Processing', value: invoices.filter(i => i.status === 'processing').length, color: COLORS.processing },
    { name: 'Error',      value: invoices.filter(i => i.status === 'error').length,      color: COLORS.error },
  ].filter(d => d.value > 0), [invoices]);

  const barData    = useMemo(() => filter === 'custom' ? buildCustomBarData(invoices, custom.from, custom.to) : buildBarData(invoices, filter), [invoices, filter, custom]);
  const vendorData = useMemo(() => buildVendorData(invoices, filter, custom), [invoices, filter, custom]);

  const totalAmount = useMemo(() => invoices.reduce((s, i) => s + parseFloat(i.extracted_data?.total_amount || 0), 0), [invoices]);
  const totalTax    = useMemo(() => invoices.reduce((s, i) => s + parseFloat(i.extracted_data?.tax_amount || 0), 0), [invoices]);

  const approved     = invoices.filter(i => i.status === 'approved').length;
  const approvalRate = invoices.length > 0 ? Math.round(approved / invoices.length * 100) : 0;
  const companyName  = invoices[0]?.tenant_name;
  const todayLabel   = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  /* count-up animated values */
  const cInvoices = useCountUp(invoices.length);
  const cAmount   = useCountUp(Math.round(totalAmount));
  const cTax      = useCountUp(Math.round(totalTax));
  const cRate     = useCountUp(approvalRate);

  return (
    <div>
      <style>{IC_STYLES}</style>

      {/* ── 1. Gradient Welcome Banner ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #4f46e5 100%)',
        borderRadius: 18,
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        marginBottom: 24,
        boxShadow: '0 4px 24px rgba(37,99,235,.3)',
        animation: 'ic-banner 1.0s ease both',
      }}>
        {/* decorative blurred circles */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200,
          background: 'rgba(255,255,255,.15)',
          borderRadius: '50%',
          filter: 'blur(52px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: 120,
          width: 160, height: 160,
          background: 'rgba(255,255,255,.1)',
          borderRadius: '50%',
          filter: 'blur(44px)',
          pointerEvents: 'none',
        }} />

        {/* dot-grid SVG overlay */}
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .04, pointerEvents: 'none' }}
        >
          <defs>
            <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" />
        </svg>

        {/* content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,.7)', marginBottom: 6 }}>
            COMPANY OVERVIEW
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, color: '#fff' }}>
              📊 Financial Dashboard
            </span>
            {companyName && (
              <span style={{
                background: 'rgba(255,255,255,.15)',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: 20,
                padding: '3px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap',
              }}>
                {companyName}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>{todayLabel}</div>
        </div>
      </div>

      {/* ── 2. Upload Strip ────────────────────────────────────────────── */}
      {tenant && onUploaded && (
        <div style={{
          background: '#fff',
          borderRadius: 14,
          padding: '14px 20px',
          marginBottom: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          border: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          animation: 'ic-upload 0.8s ease 0.25s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>📤</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Upload Invoice</span>
            <span style={{
              fontSize: 11,
              background: '#eff6ff',
              color: '#2563eb',
              padding: '2px 10px',
              borderRadius: 99,
              fontWeight: 600,
            }}>{tenant}</span>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <InvoiceUpload tenant={tenant} onUploaded={onUploaded} />
          </div>
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            icon: '📄',
            label: 'Total Invoices',
            value: cInvoices,
            bg: 'linear-gradient(135deg,#4f46e5,#6366f1)',
            shadow: 'rgba(79,70,229,.28)',
          },
          {
            icon: '💰',
            label: 'Total Amount',
            value: `₹${cAmount.toLocaleString('en-IN')}`,
            bg: 'linear-gradient(135deg,#059669,#10b981)',
            shadow: 'rgba(5,150,105,.28)',
          },
          {
            icon: '🧾',
            label: 'Total Tax',
            value: `₹${cTax.toLocaleString('en-IN')}`,
            bg: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
            shadow: 'rgba(124,58,237,.28)',
          },
          {
            icon: '✅',
            label: 'Approval Rate',
            value: `${cRate}%`,
            bg: 'linear-gradient(135deg,#d97706,#f59e0b)',
            shadow: 'rgba(217,119,6,.28)',
          },
        ].map((card, idx) => (
          <div key={card.label} style={{
            background: card.bg,
            borderRadius: 14,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
            color: '#fff',
            boxShadow: `0 6px 20px ${card.shadow}`,
            border: '1px solid rgba(255,255,255,.15)',
            animation: `ic-card-up 0.9s cubic-bezier(0.34,1.56,0.64,1) ${0.35 + idx * 0.14}s both`,
          }}>
            {/* watermark icon */}
            <span style={{
              position: 'absolute', bottom: -4, right: 8,
              fontSize: 52, opacity: .1, lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none',
            }}>
              {card.icon}
            </span>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, color: '#fff' }}>{card.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', marginTop: 4, fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── 3. Filter Bar ──────────────────────────────────────────────── */}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: '14px 20px',
        marginBottom: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        animation: 'ic-filter 0.8s ease 0.85s both',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8' }}>
          PERIOD
        </span>

        {/* segmented pill group */}
        <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 10, padding: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 16px',
                border: 'none',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all .15s',
                background: filter === f.key
                  ? 'linear-gradient(135deg,#2563eb,#7c3aed)'
                  : 'transparent',
                color: filter === f.key ? '#fff' : '#64748b',
                boxShadow: filter === f.key ? '0 2px 8px rgba(37,99,235,.3)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="date"
              className="input"
              style={{ height: 32, fontSize: 12, padding: '0 8px', width: 130, borderRadius: 8 }}
              value={custom.from}
              onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
            />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
            <input
              type="date"
              className="input"
              style={{ height: 32, fontSize: 12, padding: '0 8px', width: 130, borderRadius: 8 }}
              value={custom.to}
              onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
            />
          </div>
        )}
      </div>

      {/* ── 4. Charts Grid ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* Bar chart — invoice amounts over time */}
        <ChartCard accentA="#6366f1" accentB="#8b5cf6" title="💰 Invoice Amount by Period" delay="1.05s">
          {barData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13 }}>No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Donut — status breakdown */}
        <ChartCard accentA="#ec4899" accentB="#f43f5e" title="🍩 Invoice Status Breakdown" delay="1.2s">
          {statusData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13 }}>No invoices yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                  <LabelList dataKey="value" position="outside" style={{ fontSize: 11, fill: '#475569' }} />
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: '#475569' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Area — invoice count trend */}
        <ChartCard accentA="#10b981" accentB="#14b8a6" title="📈 Invoice Count Trend" delay="1.35s">
          {barData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13 }}>No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="count" stroke="#10b981" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Vendor bar */}
        <ChartCard accentA="#f59e0b" accentB="#f97316" title="🏢 Top Vendors by Amount" delay="1.5s">
          {vendorData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13 }}>No vendor data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendorData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="amount" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {vendorData.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
