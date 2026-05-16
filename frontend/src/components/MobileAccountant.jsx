import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE_GLASS = 'linear-gradient(rgba(255,255,255,.3),rgba(255,255,255,.3)),linear-gradient(135deg,#1e40af 0%,#2563eb 55%,#3b82f6 100%)';

const STATUS_META = {
  processing: { label:'Processing',     color:'#1d4ed8', bg:'#eff6ff', icon:'⏳' },
  extracted:  { label:'Pending Review', color:'#d97706', bg:'#fffbeb', icon:'👁' },
  reviewed:   { label:'Under Review',    color:'#7c3aed', bg:'#f5f3ff', icon:'✓'  },
  approved:   { label:'Approved',       color:'#16a34a', bg:'#f0fdf4', icon:'✅' },
  rejected:   { label:'Rejected',       color:'#dc2626', bg:'#fef2f2', icon:'❌' },
};

const TX_TYPES = [
  { value:'invoice_purchase', label:'Purchase Invoice', short:'Purchase', icon:'📄' },
  { value:'invoice_sales',    label:'Sales Invoice',    short:'Sales',    icon:'🧾' },
  { value:'payment',          label:'Payment',          short:'Payment',  icon:'💸' },
  { value:'salary_register',  label:'Salary Register',  short:'Salary',   icon:'👥' },
  { value:'ledger',           label:'Ledger',           short:'Ledger',   icon:'📒' },
  { value:'bank_statement',   label:'Bank Statement',   short:'Bank',     icon:'🏦' },
];

const NAV_TABS = [
  { key:'dashboard', label:'Dashboard', icon:'🏠' },
  { key:'queue',     label:'Queue',     icon:'📥' },
  { key:'all',       label:'All',       icon:'📄' },
  { key:'profile',   label:'Profile',   icon:'👤' },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --sat: env(safe-area-inset-top,    0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left,   0px);
    --sar: env(safe-area-inset-right,  0px);
  }
  html,body,#root { margin:0; padding:0; height:100%; background:#f0f4ff; overscroll-behavior-y:none; }
  body { font-family:system-ui,-apple-system,'Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:transparent; }

  @keyframes ma-fadein  { from{opacity:0} to{opacity:1} }
  @keyframes ma-slideup { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ma-pop     { from{opacity:0;transform:scale(.93)} to{opacity:1;transform:scale(1)} }
  @keyframes ma-slidein { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes ma-spin    { to{transform:rotate(360deg)} }

  .ma-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; }
  .ma-scroll::-webkit-scrollbar { display:none; }

  .ma-card { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.07); }
  .ma-input { width:100%; padding:13px 14px; border-radius:12px; border:1.5px solid #e2e8f0; font-size:16px; font-family:inherit; background:#fafafa; color:#0f172a; outline:none; transition:border-color .15s; -webkit-appearance:none; }
  .ma-input:focus { border-color:#2563eb; background:#fff; }
  .ma-textarea { width:100%; padding:12px 14px; border-radius:12px; border:1.5px solid #e2e8f0; font-size:15px; font-family:inherit; background:#fafafa; color:#0f172a; outline:none; resize:vertical; min-height:80px; transition:border-color .15s; }
  .ma-textarea:focus { border-color:#2563eb; background:#fff; }

  .ma-btn-primary { width:100%; padding:15px; border-radius:14px; border:none; background:${BLUE_GLASS}; color:#fff; font-size:15px; font-weight:700; cursor:pointer; min-height:52px; box-shadow:0 4px 18px rgba(37,99,235,.3); transition:opacity .15s; }
  .ma-btn-primary:disabled { background:#e2e8f0; color:#94a3b8; box-shadow:none; cursor:not-allowed; }
  .ma-btn-approve { flex:1; padding:12px 0; border-radius:12px; border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; font-size:14px; font-weight:700; cursor:pointer; min-height:48px; box-shadow:0 3px 10px rgba(22,163,74,.3); }
  .ma-btn-reject  { flex:1; padding:12px 0; border-radius:12px; border:none; background:linear-gradient(135deg,#dc2626,#ef4444); color:#fff; font-size:14px; font-weight:700; cursor:pointer; min-height:48px; box-shadow:0 3px 10px rgba(220,38,38,.3); }
  .ma-btn-ghost   { background:none; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 18px; font-size:14px; font-weight:600; color:#475569; cursor:pointer; min-height:44px; transition:all .15s; }
  .ma-btn-ghost:active { background:#f8fafc; }

  .ma-nav-btn { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:8px 4px; flex:1; transition:color .15s; position:relative; }

  .ma-toast-wrap { position:fixed; top:calc(14px + var(--sat)); left:16px; right:16px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
  .ma-toast { padding:13px 16px; border-radius:14px; font-size:14px; font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,.18); animation:ma-slideup .25s ease; }

  .ma-badge { display:inline-flex; align-items:center; gap:3px; padding:3px 9px; border-radius:99px; font-size:10px; font-weight:700; white-space:nowrap; }
  .ma-section-title { font-size:13px; font-weight:800; color:#0f172a; margin-bottom:12px; }
  .ma-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.6px; display:block; margin-bottom:5px; }
  .ma-field { margin-bottom:14px; }

  .ma-sheet-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:400; display:flex; align-items:flex-end; animation:ma-fadein .2s ease; }
  .ma-sheet { background:#fff; width:100%; border-radius:24px 24px 0 0; padding-bottom:calc(20px + var(--sab)); animation:ma-slidein .3s cubic-bezier(0.34,1.2,0.64,1); }
  .ma-sheet-handle { width:40px; height:5px; background:#e2e8f0; border-radius:99px; margin:14px auto 0; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmt(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toasts({ toasts }) {
  return (
    <div className="ma-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="ma-toast" style={{
          background: t.type==='success' ? '#f0fdf4' : t.type==='error' ? '#fef2f2' : '#eff6ff',
          border: `1.5px solid ${t.type==='success' ? '#86efac' : t.type==='error' ? '#fca5a5' : '#93c5fd'}`,
          color:  t.type==='success' ? '#15803d'  : t.type==='error' ? '#b91c1c'  : '#1d4ed8',
        }}>
          {t.type==='success' ? '✅ ' : t.type==='error' ? '❌ ' : 'ℹ️ '}{t.msg}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label:status, color:'#64748b', bg:'#f1f5f9', icon:'•' };
  return <span className="ma-badge" style={{ background:m.bg, color:m.color }}>{m.icon} {m.label}</span>;
}

// ─── Reject sheet ─────────────────────────────────────────────────────────────

function RejectSheet({ onConfirm, onCancel, saving }) {
  const [reason, setReason] = useState('');
  return (
    <div className="ma-sheet-overlay" onClick={e => { if (e.target===e.currentTarget) onCancel(); }}>
      <div className="ma-sheet" style={{ padding:'0 18px' }}>
        <div className="ma-sheet-handle" />
        <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:'16px 0 4px' }}>Reject Transaction</div>
        <div style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>Provide a reason — the company user will see this.</div>
        <div className="ma-field">
          <label className="ma-label">Rejection Reason *</label>
          <textarea className="ma-textarea" value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Invoice date is missing, incorrect vendor name…" />
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:8 }}>
          <button className="ma-btn-ghost" style={{ flex:1 }} onClick={onCancel}>Cancel</button>
          <button
            style={{ flex:2, padding:'14px', borderRadius:14, border:'none', background: reason.trim() ? 'linear-gradient(135deg,#dc2626,#ef4444)' : '#e2e8f0', color: reason.trim() ? '#fff' : '#94a3b8', fontWeight:700, fontSize:15, cursor: reason.trim() ? 'pointer' : 'not-allowed', minHeight:52, opacity: saving ? .7 : 1 }}
            disabled={!reason.trim() || saving}
            onClick={() => onConfirm(reason.trim())}
          >
            {saving ? 'Rejecting…' : '❌ Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Queue Card ───────────────────────────────────────────────────────────────

function QueueCard({ tx, idx, onApprove, onReject, saving, companies }) {
  const [expanded, setExpanded] = useState(false);
  const d        = tx.extracted_data || {};
  const typeInfo = TX_TYPES.find(t => t.value === tx.type);
  const company  = companies.find(c => c.id === tx.company_id || c._id === tx.company_id);
  const title    = d.vendor || d.invoice_number || tx.filename || tx.file_name || `${typeInfo?.short||'Doc'} #${idx+1}`;
  const amount   = fmtAmt(d.total_amount);
  const date     = fmtDate(d.invoice_date || tx.uploaded_at);
  const isBusy   = saving === tx.id;

  return (
    <div className="ma-card" style={{ padding:'14px', marginBottom:10, animation:`ma-slideup .35s ease ${Math.min(idx*.06,.4)}s both` }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }} onClick={() => setExpanded(e=>!e)}>
        <div style={{ width:44, height:44, borderRadius:12, background:BLUE_GLASS, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
          {typeInfo?.icon || '📄'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
            {company?.name || 'Unknown Co.'}{[date, amount].some(Boolean) ? ' · ' : ''}{[date, amount].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
          <StatusBadge status={tx.status} />
          <span style={{ fontSize:10, color:'#cbd5e1' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9', animation:'ma-fadeIn .2s ease' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { label:'Company',    value: company?.name || '—' },
              { label:'Type',       value: typeInfo?.label || tx.type || '—' },
              { label:'Invoice #',  value: d.invoice_number || '—' },
              { label:'Date',       value: fmtDate(d.invoice_date) || '—' },
              { label:'Amount',     value: fmtAmt(d.total_amount)  || '—' },
              { label:'Tax',        value: fmtAmt(d.tax_amount)    || '—' },
              { label:'Uploaded by',value: tx.uploaded_by || '—' },
              { label:'File',       value: tx.filename || tx.file_name || '—' },
            ].map(row => (
              <div key={row.label} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.4, marginBottom:2 }}>{row.label}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#334155', wordBreak:'break-all', lineHeight:1.4 }}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <button className="ma-btn-reject" disabled={isBusy} onClick={() => onReject(tx)}>
              {isBusy ? '…' : '❌ Reject'}
            </button>
            <button className="ma-btn-approve" disabled={isBusy} onClick={() => onApprove(tx)}>
              {isBusy ? '…' : '✅ Approve'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── All Transactions Card ────────────────────────────────────────────────────

function AllTxCard({ tx, idx, companies }) {
  const [expanded, setExpanded] = useState(false);
  const d        = tx.extracted_data || {};
  const typeInfo = TX_TYPES.find(t => t.value === tx.type);
  const company  = companies.find(c => c.id === tx.company_id || c._id === tx.company_id);
  const title    = d.vendor || d.invoice_number || tx.filename || tx.file_name || `${typeInfo?.short||'Doc'} #${idx+1}`;
  const amount   = fmtAmt(d.total_amount);
  const date     = fmtDate(d.invoice_date || tx.uploaded_at);

  return (
    <div className="ma-card" style={{ padding:'14px', marginBottom:10, animation:`ma-slideup .35s ease ${Math.min(idx*.04,.4)}s both` }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }} onClick={() => setExpanded(e=>!e)}>
        <div style={{ width:42, height:42, borderRadius:12, background:BLUE_GLASS, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
          {typeInfo?.icon || '📄'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
            {company?.name || '—'}{amount ? ` · ${amount}` : ''}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
          <StatusBadge status={tx.status} />
          <span style={{ fontSize:10, color:'#cbd5e1' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Company',   value: company?.name || '—' },
              { label:'Type',      value: typeInfo?.label || tx.type || '—' },
              { label:'Invoice #', value: d.invoice_number || '—' },
              { label:'Date',      value: fmtDate(d.invoice_date) || '—' },
              { label:'Amount',    value: fmtAmt(d.total_amount) || '—' },
              { label:'Uploaded',  value: fmtDate(tx.uploaded_at || tx.created_at) || '—' },
            ].map(row => (
              <div key={row.label} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.4, marginBottom:2 }}>{row.label}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#334155', wordBreak:'break-all' }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ transactions, companies, onRefresh }) {
  const total    = transactions.length;
  const queue    = transactions.filter(t => t.status === 'extracted').length;
  const reviewed = transactions.filter(t => t.status === 'reviewed').length;
  const approved = transactions.filter(t => t.status === 'approved').length;
  const rejected = transactions.filter(t => t.status === 'rejected').length;
  const recent   = transactions.slice(0, 6);

  return (
    <div>
      {/* KPI grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:18 }}>
        {[
          { label:'Total',    value:total,    bg:'linear-gradient(135deg,#1e40af,#3b82f6)', icon:'📊' },
          { label:'In Queue', value:queue,    bg:'linear-gradient(135deg,#d97706,#f59e0b)', icon:'📥' },
          { label:'Under Review', value:reviewed, bg:'linear-gradient(135deg,#7c3aed,#8b5cf6)', icon:'✓'  },
          { label:'Approved', value:approved, bg:'linear-gradient(135deg,#059669,#10b981)', icon:'✅' },
        ].map(k => (
          <div key={k.label} style={{
            background:`linear-gradient(rgba(255,255,255,.3),rgba(255,255,255,.3)),${k.bg}`,
            borderRadius:14, padding:'14px 16px',
            boxShadow:'0 3px 12px rgba(0,0,0,.1)',
            animation:'ma-slideup .4s ease both',
          }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.8)', fontWeight:600, marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="ma-card" style={{ padding:'14px 16px', marginBottom:18, display:'flex', gap:0 }}>
        {[
          { label:'Rejected', value:rejected, color:'#dc2626' },
          { label:'Companies', value:companies.length, color:'#2563eb' },
        ].map((s,i,arr) => (
          <div key={s.label} style={{ flex:1, textAlign:'center', borderRight: i < arr.length-1 ? '1px solid #f1f5f9' : 'none', padding:'4px 0' }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="ma-section-title">Recent Activity</div>
      {recent.length === 0 ? (
        <div className="ma-card" style={{ padding:'36px 20px', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:10 }}>📭</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>No transactions yet</div>
        </div>
      ) : recent.map((tx, i) => (
        <AllTxCard key={tx.id || i} tx={tx} idx={i} companies={companies} />
      ))}
    </div>
  );
}

// ─── Queue Tab ────────────────────────────────────────────────────────────────

function QueueTab({ transactions, companies, onRefresh, session, addToast }) {
  const [saving,     setSaving]     = useState(null);
  const [rejectTx,   setRejectTx]   = useState(null);
  const [companyF,   setCompanyF]   = useState('');

  const queue = transactions.filter(t => ['extracted','reviewed'].includes(t.status));
  const filtered = queue.filter(tx => !companyF || tx.company_id === companyF);

  const handleApprove = async (tx) => {
    setSaving(tx.id);
    try {
      const r = await fetch(`/api/transactions/${tx.id}/approve`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ performed_by: session.display_name || session.username, notes:'' }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Approve failed');
      addToast('Transaction approved', 'success');
      onRefresh();
    } catch (err) { addToast(err.message, 'error'); }
    setSaving(null);
  };

  const handleReject = async (reason) => {
    if (!rejectTx) return;
    setSaving(rejectTx.id);
    try {
      const r = await fetch(`/api/transactions/${rejectTx.id}/reject`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ performed_by: session.display_name || session.username, reason }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Reject failed');
      addToast('Transaction rejected', 'success');
      setRejectTx(null);
      onRefresh();
    } catch (err) { addToast(err.message, 'error'); }
    setSaving(null);
  };

  return (
    <div>
      {rejectTx && <RejectSheet onConfirm={handleReject} onCancel={() => setRejectTx(null)} saving={saving === rejectTx?.id} />}

      {/* Company filter */}
      <div style={{ marginBottom:14 }}>
        <select className="ma-input" style={{ padding:'11px 14px', fontSize:14 }} value={companyF} onChange={e=>setCompanyF(e.target.value)}>
          <option value="">All Companies ({queue.length})</option>
          {companies.map(c => {
            const cnt = queue.filter(t => t.company_id === c.id).length;
            return <option key={c.id} value={c.id}>{c.name} ({cnt})</option>;
          })}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="ma-card" style={{ padding:'52px 20px', textAlign:'center', animation:'ma-slideup .35s ease' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#0f172a', marginBottom:6 }}>Queue is clear!</div>
          <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.5 }}>No transactions pending review</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginBottom:12 }}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} pending · tap to expand &amp; act
          </div>
          {filtered.map((tx, i) => (
            <QueueCard
              key={tx.id || i} tx={tx} idx={i}
              companies={companies}
              onApprove={handleApprove}
              onReject={(tx) => setRejectTx(tx)}
              saving={saving}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── All Transactions Tab ─────────────────────────────────────────────────────

function AllTab({ transactions, companies }) {
  const [search,  setSearch]  = useState('');
  const [typeF,   setTypeF]   = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [companyF,setCompanyF]= useState('');

  const filtered = transactions.filter(tx => {
    if (typeF !== 'all' && tx.type !== typeF) return false;
    if (statusF !== 'all' && tx.status !== statusF) return false;
    if (companyF && tx.company_id !== companyF) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (tx.extracted_data?.vendor||'').toLowerCase().includes(q)
      || (tx.extracted_data?.invoice_number||'').toLowerCase().includes(q)
      || (tx.filename||tx.file_name||'').toLowerCase().includes(q);
  });

  const anyFilter = search || typeF !== 'all' || statusF !== 'all' || companyF;

  return (
    <div>
      {/* Search */}
      <div style={{ position:'relative', marginBottom:10 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:15, pointerEvents:'none' }}>🔍</span>
        <input className="ma-input" style={{ paddingLeft:40, paddingTop:11, paddingBottom:11 }} type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor, invoice#, file…" />
      </div>

      {/* Filters row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        <select className="ma-input" style={{ padding:'10px 12px', fontSize:14 }} value={typeF} onChange={e=>setTypeF(e.target.value)}>
          <option value="all">All Types</option>
          {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.short}</option>)}
        </select>
        <select className="ma-input" style={{ padding:'10px 12px', fontSize:14 }} value={statusF} onChange={e=>setStatusF(e.target.value)}>
          <option value="all">All Status</option>
          <option value="extracted">Pending</option>
          <option value="reviewed">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="ma-input" style={{ padding:'10px 12px', fontSize:14, gridColumn:'1/-1' }} value={companyF} onChange={e=>setCompanyF(e.target.value)}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {anyFilter && (
        <button className="ma-btn-ghost" style={{ fontSize:13, padding:'8px 14px', marginBottom:10 }} onClick={() => { setSearch(''); setTypeF('all'); setStatusF('all'); setCompanyF(''); }}>✕ Clear filters</button>
      )}

      <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginBottom:12 }}>{filtered.length} of {transactions.length} records</div>

      {filtered.length === 0 ? (
        <div className="ma-card" style={{ padding:'48px 20px', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:6 }}>No transactions found</div>
          <div style={{ fontSize:13, color:'#94a3b8' }}>{transactions.length ? 'Try adjusting filters' : 'No transactions yet'}</div>
        </div>
      ) : filtered.map((tx, i) => (
        <AllTxCard key={tx.id || i} tx={tx} idx={i} companies={companies} />
      ))}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ session, onLogout, onSessionUpdate, addToast }) {
  const [editMode, setEditMode] = useState(false);
  const [pwdMode,  setPwdMode]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({ display_name: session.display_name||'', email: session.email||'', phone: session.phone||'' });
  const [pwd,  setPwd]  = useState({ current:'', newPwd:'', confirm:'' });
  const [showPwd, setShowPwd] = useState(false);
  const setF = (k,v) => setForm(p=>({...p,[k]:v}));
  const setP = (k,v) => setPwd(p=>({...p,[k]:v}));

  const saveProfile = async () => {
    if (!form.display_name.trim()) { addToast('Name cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/firm/users/${session.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ display_name:form.display_name.trim(), email:form.email.trim(), phone:form.phone.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
      onSessionUpdate({ ...session, ...form });
      setEditMode(false);
      addToast('Profile updated', 'success');
    } catch (err) { addToast(err.message, 'error'); }
    setSaving(false);
  };

  const savePassword = async () => {
    if (!pwd.current)              { addToast('Enter current password', 'error'); return; }
    if (pwd.newPwd.length < 6)     { addToast('New password needs 6+ characters', 'error'); return; }
    if (pwd.newPwd !== pwd.confirm) { addToast('Passwords do not match', 'error'); return; }
    setSaving(true);
    try {
      const verify = await fetch('/api/auth/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username:session.username, password:pwd.current }),
      });
      if (!verify.ok) { addToast('Current password is incorrect', 'error'); setSaving(false); return; }
      const r = await fetch(`/api/firm/users/${session.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ password:pwd.newPwd }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
      setPwd({ current:'', newPwd:'', confirm:'' });
      setPwdMode(false);
      addToast('Password changed', 'success');
    } catch (err) { addToast(err.message, 'error'); }
    setSaving(false);
  };

  const avatar    = (session.display_name || session.username || 'A').charAt(0).toUpperCase();
  const roleLabel = 'Accountant';

  return (
    <div>
      {/* Avatar */}
      <div className="ma-card" style={{ padding:'24px 20px', marginBottom:16, textAlign:'center', animation:'ma-slideup .35s ease' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:BLUE_GLASS, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:800, color:'#fff', margin:'0 auto 12px', boxShadow:'0 4px 16px rgba(37,99,235,.3)' }}>
          {avatar}
        </div>
        <div style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>{session.display_name || session.username}</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginTop:3 }}>{session.firm_name || 'Accounting Firm'}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8, background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:99, padding:'4px 12px' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#2563eb', display:'inline-block' }} />
          <span style={{ fontSize:12, fontWeight:700, color:'#1d4ed8' }}>{roleLabel}</span>
        </div>
      </div>

      {!editMode && !pwdMode && (
        <div style={{ animation:'ma-slideup .35s ease .05s both' }}>
          <div className="ma-section-title">Account Details</div>
          <div className="ma-card" style={{ padding:'4px 0', marginBottom:16 }}>
            {[
              { icon:'👤', label:'Username',     value:session.username },
              { icon:'✏️', label:'Display Name', value:session.display_name||'—' },
              { icon:'📧', label:'Email',         value:session.email||'—' },
              { icon:'📞', label:'Phone',         value:session.phone||'—' },
              { icon:'🏢', label:'Firm',          value:session.firm_name||'—' },
              { icon:'🔑', label:'Role',          value:roleLabel },
            ].map((row,i,arr) => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:i<arr.length-1?'1px solid #f1f5f9':'none' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{row.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.4 }}>{row.label}</div>
                  <div style={{ fontSize:14, color:'#0f172a', fontWeight:600, marginTop:1, wordBreak:'break-all' }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button className="ma-btn-primary" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
            <button className="ma-btn-ghost" style={{ width:'100%' }} onClick={() => setPwdMode(true)}>🔒 Change Password</button>
            <button onClick={onLogout} style={{ width:'100%', padding:'14px', borderRadius:14, border:'1.5px solid #fca5a5', background:'#fef2f2', color:'#dc2626', fontWeight:700, fontSize:15, cursor:'pointer', minHeight:52 }}>
              🚪 Log Out
            </button>
          </div>
        </div>
      )}

      {editMode && (
        <div style={{ animation:'ma-slideup .3s ease' }}>
          <div className="ma-section-title">Edit Profile</div>
          <div className="ma-card" style={{ padding:'18px', marginBottom:16 }}>
            {[
              { key:'display_name', label:'Display Name', placeholder:'Your full name',   type:'text'  },
              { key:'email',        label:'Email',         placeholder:'you@example.com',  type:'email' },
              { key:'phone',        label:'Phone',         placeholder:'+91 98765 43210', type:'tel'   },
            ].map(f => (
              <div key={f.key} className="ma-field">
                <label className="ma-label">{f.label}</label>
                <input className="ma-input" type={f.type} value={form[f.key]} onChange={e=>setF(f.key,e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="ma-btn-ghost" style={{ flex:1 }} onClick={() => { setEditMode(false); setForm({ display_name:session.display_name||'', email:session.email||'', phone:session.phone||'' }); }}>Cancel</button>
            <button className="ma-btn-primary" style={{ flex:2 }} disabled={saving} onClick={saveProfile}>{saving ? 'Saving…' : '✓ Save Changes'}</button>
          </div>
        </div>
      )}

      {pwdMode && (
        <div style={{ animation:'ma-slideup .3s ease' }}>
          <div className="ma-section-title">Change Password</div>
          <div className="ma-card" style={{ padding:'18px', marginBottom:16 }}>
            {[
              { key:'current', label:'Current Password',      placeholder:'Current password',  auto:'current-password' },
              { key:'newPwd',  label:'New Password',           placeholder:'Min 6 characters',  auto:'new-password' },
              { key:'confirm', label:'Confirm New Password',   placeholder:'Repeat new password', auto:'new-password' },
            ].map(f => (
              <div key={f.key} className="ma-field">
                <label className="ma-label">{f.label}</label>
                <input className="ma-input" type={showPwd?'text':'password'} value={pwd[f.key]} onChange={e=>setP(f.key,e.target.value)} placeholder={f.placeholder} autoComplete={f.auto} />
              </div>
            ))}
            <button type="button" onClick={()=>setShowPwd(p=>!p)} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:13, cursor:'pointer', padding:0, marginTop:-8 }}>
              {showPwd ? '🙈 Hide' : '👁 Show'} passwords
            </button>
            {pwd.newPwd && (() => {
              const score = [pwd.newPwd.length>=6,/[A-Z]/.test(pwd.newPwd),/[0-9]/.test(pwd.newPwd),/[^A-Za-z0-9]/.test(pwd.newPwd)].filter(Boolean).length;
              const cols  = ['#ef4444','#f59e0b','#3b82f6','#16a34a'];
              const labs  = ['Weak','Fair','Good','Strong'];
              return (
                <div style={{ marginTop:12 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[0,1,2,3].map(i=><div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<score?cols[score-1]:'#e2e8f0', transition:'background .2s' }} />)}
                  </div>
                  <div style={{ fontSize:11, color:cols[score-1]??'#94a3b8', fontWeight:600 }}>{labs[score-1]??'Enter password'}</div>
                </div>
              );
            })()}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="ma-btn-ghost" style={{ flex:1 }} onClick={()=>{ setPwdMode(false); setPwd({current:'',newPwd:'',confirm:''}); }}>Cancel</button>
            <button className="ma-btn-primary" style={{ flex:2 }} disabled={saving} onClick={savePassword}>{saving?'Saving…':'🔒 Update Password'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MobileAccountant({ session: initialSession, onLogout, onSessionUpdate: pushUp }) {
  const [session,      setSession]      = useState(initialSession);
  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [companies,    setCompanies]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toasts,       setToasts]       = useState([]);
  const toastId = useRef(0);

  const addToast = useCallback((msg, type='success') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!session?.firm_id) return;
    setLoading(true);
    try {
      const [txRes, coRes] = await Promise.all([
        fetch(`/api/transactions?firm_id=${session.firm_id}`),
        fetch(`/api/firm/companies?firm_id=${session.firm_id}`),
      ]);
      const txData = await txRes.json();
      const coData = await coRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
      setCompanies(Array.isArray(coData) ? coData : []);
    } catch { addToast('Failed to load data', 'error'); }
    setLoading(false);
  }, [session?.firm_id, addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const queueCount = transactions.filter(t => ['extracted','reviewed'].includes(t.status)).length;

  const headerTitle = {
    dashboard: `Hi, ${session?.display_name || session?.username} 👋`,
    queue:     'Review Queue',
    all:       'All Transactions',
    profile:   'My Profile',
  }[activeTab];

  return (
    <>
      <style>{CSS}</style>
      <Toasts toasts={toasts} />

      <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#f0f4ff', overflow:'hidden' }}>

        {/* Header */}
        <div style={{
          background: BLUE_GLASS,
          paddingTop:    'calc(14px + var(--sat))',
          paddingBottom: 14,
          paddingLeft:   'calc(16px + var(--sal))',
          paddingRight:  'calc(16px + var(--sar))',
          boxShadow: '0 2px 16px rgba(30,64,175,.25)',
          flexShrink: 0,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:1.8, marginBottom:2 }}>InvoSmart</div>
              <div style={{ fontSize:'clamp(15px,4.5vw,20px)', fontWeight:800, color:'#fff', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{headerTitle}</div>
              {activeTab === 'dashboard' && session?.firm_name && (
                <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:2 }}>{session.firm_name}</div>
              )}
            </div>
            <button
              onClick={() => { fetchAll(); addToast('Refreshed', 'info'); }}
              style={{ background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'9px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', minHeight:40, flexShrink:0 }}
            >
              ↻
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && transactions.length === 0 ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, color:'#94a3b8' }}>
            <div style={{ fontSize:36, animation:'ma-spin 1s linear infinite', display:'inline-block' }}>⏳</div>
            <div style={{ fontSize:14 }}>Loading…</div>
          </div>
        ) : (
          <div className="ma-scroll" style={{ flex:1, padding:'16px calc(14px + var(--sal)) 16px calc(14px + var(--sar))' }}>
            {activeTab === 'dashboard' && <DashboardTab transactions={transactions} companies={companies} onRefresh={fetchAll} />}
            {activeTab === 'queue'     && <QueueTab transactions={transactions} companies={companies} onRefresh={fetchAll} session={session} addToast={addToast} />}
            {activeTab === 'all'       && <AllTab transactions={transactions} companies={companies} />}
            {activeTab === 'profile'   && (
              <ProfileTab
                session={session}
                onLogout={onLogout}
                onSessionUpdate={(s) => { setSession(s); pushUp?.(s); }}
                addToast={addToast}
              />
            )}
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ background:'#fff', borderTop:'1px solid #f1f5f9', display:'flex', paddingBottom:'var(--sab)', boxShadow:'0 -4px 20px rgba(0,0,0,.08)', flexShrink:0 }}>
          {NAV_TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className="ma-nav-btn"
                onClick={() => setActiveTab(tab.key)}
                style={{ color: active ? '#2563eb' : '#94a3b8' }}
              >
                <span style={{ fontSize:22, lineHeight:1, display:'block', transition:'transform .15s', transform: active ? 'scale(1.15)' : 'scale(1)' }}>
                  {tab.icon}
                  {tab.key === 'queue' && queueCount > 0 && (
                    <span style={{ position:'absolute', top:-2, right:6, background:'#dc2626', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
                      {queueCount > 9 ? '9+' : queueCount}
                    </span>
                  )}
                </span>
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                {active && <span style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:32, height:3, background:'#2563eb', borderRadius:'0 0 4px 4px' }} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
