import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL       = 'linear-gradient(135deg,#0f766e 0%,#0d9488 55%,#14b8a6 100%)';
const TEAL_GLASS = 'linear-gradient(rgba(255,255,255,.32),rgba(255,255,255,.32)),linear-gradient(135deg,#0f766e 0%,#0d9488 55%,#14b8a6 100%)';

const TX_TYPES = [
  { value:'invoice_purchase', label:'Purchase Invoice', icon:'📄' },
  { value:'invoice_sales',    label:'Sales Invoice',    icon:'🧾' },
  { value:'payment',          label:'Payment',          icon:'💸' },
  { value:'salary_register',  label:'Salary Register',  icon:'👥' },
  { value:'ledger',           label:'Ledger',           icon:'📒' },
  { value:'bank_statement',   label:'Bank Statement',   icon:'🏦' },
];

const STATUS_META = {
  processing: { label:'Processing',     color:'#1d4ed8', bg:'#eff6ff', icon:'⏳' },
  extracted:  { label:'Pending Review', color:'#d97706', bg:'#fffbeb', icon:'👁' },
  reviewed:   { label:'Under Review',    color:'#7c3aed', bg:'#f5f3ff', icon:'✓'  },
  approved:   { label:'Approved',       color:'#16a34a', bg:'#f0fdf4', icon:'✅' },
  rejected:   { label:'Rejected',       color:'#dc2626', bg:'#fef2f2', icon:'❌' },
};

const NAV_TABS = [
  { key:'dashboard',    label:'Dashboard',    icon:'🏠' },
  { key:'transactions', label:'Transactions', icon:'📄' },
  { key:'reports',      label:'Reports',      icon:'📋' },
  { key:'profile',      label:'Profile',      icon:'👤' },
];

// ─── Global CSS ───────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --sat: env(safe-area-inset-top,    0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left,   0px);
    --sar: env(safe-area-inset-right,  0px);
  }
  html,body,#root { margin:0; padding:0; height:100%; background:#f0faf9; overscroll-behavior-y:none; }
  body { font-family: system-ui,-apple-system,'Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:transparent; }

  @keyframes mu-fadein  { from{opacity:0}                        to{opacity:1} }
  @keyframes mu-slidein { from{transform:translateY(100%)}       to{transform:translateY(0)} }
  @keyframes mu-slideup { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mu-pop     { from{opacity:0;transform:scale(.92)}   to{opacity:1;transform:scale(1)} }
  @keyframes mu-spin    { to{transform:rotate(360deg)} }
  @keyframes mu-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }

  .mu-scroll::-webkit-scrollbar { display:none; }
  .mu-scroll { -ms-overflow-style:none; scrollbar-width:none; -webkit-overflow-scrolling:touch; }

  .mu-nav-btn { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:8px 4px; flex:1; transition:all .15s; }
  .mu-nav-btn.active .mu-nav-icon { transform:scale(1.2); }

  .mu-card { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.07); }
  .mu-input { width:100%; padding:13px 14px; border-radius:12px; border:1.5px solid #e2e8f0; font-size:16px; font-family:inherit; background:#fafafa; color:#0f172a; outline:none; transition:border-color .15s; -webkit-appearance:none; }
  .mu-input:focus { border-color:#0d9488; background:#fff; }
  .mu-btn-primary { width:100%; padding:15px; border-radius:14px; border:none; background:${TEAL_GLASS}; color:#fff; font-size:15px; font-weight:700; cursor:pointer; min-height:52px; box-shadow:0 4px 18px rgba(13,148,136,.35); transition:opacity .15s; }
  .mu-btn-primary:disabled { background:#e2e8f0; color:#94a3b8; box-shadow:none; cursor:not-allowed; }
  .mu-btn-primary:active:not(:disabled) { opacity:.85; }
  .mu-btn-ghost { background:none; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 18px; font-size:14px; font-weight:600; color:#475569; cursor:pointer; min-height:44px; transition:all .15s; }
  .mu-btn-ghost:active { background:#f8fafc; }

  .mu-tx-card { background:#fff; border-radius:14px; padding:14px; box-shadow:0 1px 8px rgba(0,0,0,.06); margin-bottom:10px; animation:mu-slideup .35s ease both; }
  .mu-tx-card:active { background:#f8fafc; }

  .mu-sheet-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:400; display:flex; align-items:flex-end; animation:mu-fadein .2s ease; }
  .mu-sheet { background:#fff; width:100%; border-radius:24px 24px 0 0; padding-bottom:calc(20px + var(--sab)); animation:mu-slidein .3s cubic-bezier(0.34,1.2,0.64,1); }
  .mu-sheet-handle { width:40px; height:5px; background:#e2e8f0; border-radius:99px; margin:14px auto 0; }

  .mu-toast-wrap { position:fixed; top:calc(14px + var(--sat)); left:16px; right:16px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
  .mu-toast { padding:13px 16px; border-radius:14px; font-size:14px; font-weight:600; box-shadow:0 4px 20px rgba(0,0,0,.18); animation:mu-slideup .25s ease; }

  .mu-section-title { font-size:13px; font-weight:800; color:#0f172a; margin-bottom:12px; }
  .mu-label { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.6px; display:block; margin-bottom:5px; }
  .mu-field { margin-bottom:14px; }

  .mu-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:99px; font-size:10px; font-weight:700; white-space:nowrap; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ─── Toast system ─────────────────────────────────────────────────────────────

function Toasts({ toasts }) {
  return (
    <div className="mu-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="mu-toast" style={{
          background: t.type === 'success' ? '#f0fdf4' : t.type === 'error' ? '#fef2f2' : '#eff6ff',
          border: `1.5px solid ${t.type === 'success' ? '#86efac' : t.type === 'error' ? '#fca5a5' : '#93c5fd'}`,
          color:  t.type === 'success' ? '#15803d'  : t.type === 'error' ? '#b91c1c'  : '#1d4ed8',
        }}>
          {t.type === 'success' ? '✅ ' : t.type === 'error' ? '❌ ' : 'ℹ️ '}{t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Status / Type badge ──────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color:'#64748b', bg:'#f1f5f9', icon:'•' };
  return <span className="mu-badge" style={{ background:m.bg, color:m.color }}>{m.icon} {m.label}</span>;
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ session, transactions, reports, onUploadSuccess, addToast }) {
  const [showSheet,      setShowSheet]      = useState(false);
  const [selType,        setSelType]        = useState('');
  const [selFile,        setSelFile]        = useState(null);
  const [preview,        setPreview]        = useState(null);
  const [bulkFiles,      setBulkFiles]      = useState([]);
  const [uploading,      setUploading]      = useState(false);
  const [bulkProgress,   setBulkProgress]   = useState(null);
  const [successMsg,     setSuccessMsg]     = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const fileRef = useRef(null);
  const bulkRef = useRef(null);

  useEffect(() => {
    const h = e => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const pickType = (type) => {
    setSelType(type);
    setSelFile(null); setPreview(null);
    setBulkFiles([]); setBulkProgress(null);
    setShowSheet(false);
    setTimeout(() => {
      if (type === 'bank_statement') bulkRef.current?.click();
      else fileRef.current?.click();
    }, 150);
  };

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSelFile(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    e.target.value = '';
  };

  const onBulkChange = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    if (!newFiles.length) return;
    setBulkFiles(prev => {
      const seen = new Set(prev.map(f => `${f.name}|${f.size}`));
      return [...prev, ...newFiles.filter(f => !seen.has(`${f.name}|${f.size}`))];
    });
  };

  const removeBulkFile = (idx) => setBulkFiles(prev => prev.filter((_, i) => i !== idx));

  const fmtSize = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const totalBulkSize = bulkFiles.reduce((s, f) => s + f.size, 0);

  const doUpload = async () => {
    if (!selFile || !selType || uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selFile);
      fd.append('type', selType);
      fd.append('company_id', session.company_id);
      fd.append('uploaded_by', session.username);
      const r = await fetch('/api/company/upload', { method:'POST', body:fd });
      const d = await r.json();
      if (r.ok) {
        setSelFile(null); setPreview(null);
        setSuccessMsg('AI is processing\nyour document');
        setTimeout(() => setSuccessMsg(''), 2500);
        onUploadSuccess();
        addToast('Uploaded! AI is processing your document.', 'success');
      } else {
        addToast(d.error || 'Upload failed', 'error');
      }
    } catch {
      addToast('Network error — check your connection', 'error');
    }
    setUploading(false);
  };

  const doBulkUpload = async () => {
    if (!bulkFiles.length || uploading) return;
    setUploading(true);
    setBulkProgress({ done:0, total:bulkFiles.length });
    try {
      const fd = new FormData();
      bulkFiles.forEach(f => fd.append('files', f));
      fd.append('type',        selType);
      fd.append('company_id',  String(session.company_id  || ''));
      fd.append('firm_id',     String(session.firm_id     || ''));
      fd.append('uploaded_by', String(session.username    || ''));
      const r = await fetch('/api/transactions/bulk-upload', { method:'POST', body:fd });
      const d = await r.json();
      if (r.ok) {
        setBulkProgress({ done:d.count, total:bulkFiles.length });
        const cnt = d.count;
        setBulkFiles([]); setSelType('');
        setSuccessMsg(`${cnt} statement${cnt > 1 ? 's' : ''} uploaded!\nAI is extracting data.`);
        setTimeout(() => { setSuccessMsg(''); setBulkProgress(null); }, 3000);
        onUploadSuccess();
        addToast(`${cnt} files uploaded! AI is extracting data.`, 'success');
      } else {
        addToast(d.error || 'Bulk upload failed', 'error');
        setBulkProgress(null);
      }
    } catch {
      addToast('Network error — check your connection', 'error');
      setBulkProgress(null);
    }
    setUploading(false);
  };

  const total    = transactions.length;
  const pending  = transactions.filter(t => ['processing','extracted'].includes(t.status)).length;
  const approved = transactions.filter(t => t.status === 'approved').length;
  const rejected = transactions.filter(t => t.status === 'rejected').length;
  const recent   = transactions.slice(0, 5);

  const isBulk      = selType === 'bank_statement';
  const hasBulk     = isBulk && bulkFiles.length > 0;
  const hasSingle   = !isBulk && selFile;
  const showUploadBtn = !hasBulk && !hasSingle;

  return (
    <div>
      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:18 }}>
        {[
          { label:'Total',    value:total,    bg:'linear-gradient(135deg,#2563eb,#3b82f6)',  icon:'📊' },
          { label:'Pending',  value:pending,  bg:'linear-gradient(135deg,#d97706,#f59e0b)',  icon:'👁' },
          { label:'Approved', value:approved, bg:'linear-gradient(135deg,#059669,#10b981)',  icon:'✅' },
          { label:'Rejected', value:rejected, bg:'linear-gradient(135deg,#dc2626,#ef4444)',  icon:'❌' },
        ].map(k => (
          <div key={k.label} style={{
            background: `linear-gradient(rgba(255,255,255,.3),rgba(255,255,255,.3)),${k.bg}`,
            borderRadius:14, padding:'14px 16px',
            boxShadow:'0 3px 12px rgba(0,0,0,.1)',
            animation:'mu-slideup .4s ease both',
          }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{k.icon}</div>
            <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.8)', fontWeight:600, marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* PWA install */}
      {deferredPrompt && (
        <div style={{ background:TEAL_GLASS, borderRadius:14, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:12, animation:'mu-slideup .3s ease' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#fff' }}>📱 Install App</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', marginTop:2 }}>Add to home screen</div>
          </div>
          <button onClick={() => { deferredPrompt.prompt(); setDeferredPrompt(null); }} style={{ background:'#fff', border:'none', borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700, color:'#0f766e', cursor:'pointer' }}>Install</button>
          <button onClick={() => setDeferredPrompt(null)} style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:10, padding:'8px 10px', fontSize:12, color:'#fff', cursor:'pointer' }}>✕</button>
        </div>
      )}

      {/* Upload trigger button */}
      {showUploadBtn && (
        <button onClick={() => setShowSheet(true)} style={{
          width:'100%', padding:'18px', borderRadius:18, border:'none',
          background:TEAL_GLASS, color:'#fff', fontSize:16, fontWeight:800,
          cursor:'pointer', boxShadow:'0 6px 28px rgba(13,148,136,.45)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:12,
          marginBottom:20, minHeight:60,
        }}>
          <span style={{ fontSize:26 }}>📷</span> Upload Document
        </button>
      )}

      {/* Bulk file list card (bank statement) */}
      {hasBulk && (
        <div className="mu-card" style={{ padding:'16px', marginBottom:18, animation:'mu-pop .3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>🏦 Bank Statements</div>
            <span style={{ fontSize:11, fontWeight:700, background:'#dbeafe', color:'#1d4ed8', padding:'3px 10px', borderRadius:6 }}>
              {bulkFiles.length} file{bulkFiles.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Scrollable file list */}
          <div className="mu-scroll" style={{ maxHeight:200, overflowY:'auto', marginBottom:10 }}>
            {bulkFiles.map((f, i) => (
              <div key={`${f.name}${f.size}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background:'#f8fafc', marginBottom:6 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{f.type === 'application/pdf' ? '📄' : '🖼'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#334155', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.name}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{fmtSize(f.size)}</div>
                </div>
                <button
                  onClick={() => removeBulkFile(i)}
                  style={{ background:'#fee2e2', border:'none', borderRadius:8, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:12, color:'#dc2626', fontWeight:800 }}
                >✕</button>
              </div>
            ))}
          </div>

          {/* Total + add more row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>Total: {fmtSize(totalBulkSize)}</span>
            <button
              onClick={() => bulkRef.current?.click()}
              style={{ background:'none', border:'1.5px solid #0d9488', borderRadius:8, padding:'5px 14px', fontSize:12, fontWeight:700, color:'#0d9488', cursor:'pointer' }}
            >+ Add More</button>
          </div>

          {/* Progress bar */}
          {bulkProgress && (
            <div style={{ marginBottom:12 }}>
              <div style={{ background:'#f1f5f9', borderRadius:99, height:6, overflow:'hidden', marginBottom:4 }}>
                <div style={{
                  height:'100%', borderRadius:99,
                  background:'linear-gradient(90deg,#0d9488,#14b8a6)',
                  width:`${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%`,
                  transition:'width .4s',
                }} />
              </div>
              <div style={{ fontSize:11, color:'#64748b', textAlign:'center' }}>
                {uploading ? `Uploading ${bulkFiles.length} files…` : `${bulkProgress.done} / ${bulkProgress.total} processed`}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button className="mu-btn-ghost" style={{ flex:1 }} onClick={() => { setBulkFiles([]); setSelType(''); setBulkProgress(null); }}>Cancel</button>
            <button className="mu-btn-primary" style={{ flex:2 }} disabled={uploading} onClick={doBulkUpload}>
              {uploading
                ? <><span style={{ display:'inline-block', animation:'mu-spin .8s linear infinite' }}>⏳</span> Uploading…</>
                : `⬆ Upload ${bulkFiles.length} File${bulkFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Single file preview card */}
      {hasSingle && (
        <div className="mu-card" style={{ padding:'16px', marginBottom:18, animation:'mu-pop .3s ease' }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:12 }}>Ready to Upload</div>
          {preview && <img src={preview} alt="" style={{ width:'100%', maxHeight:160, objectFit:'contain', borderRadius:10, marginBottom:10, background:'#f8fafc' }} />}
          <div style={{ background:'#f8fafc', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#334155', wordBreak:'break-all' }}>📎 {selFile.name}</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>
              {fmtSize(selFile.size)} · {TX_TYPES.find(t => t.value === selType)?.label}
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="mu-btn-ghost" style={{ flex:1 }} onClick={() => { setSelFile(null); setPreview(null); }}>Cancel</button>
            <button className="mu-btn-primary" style={{ flex:2 }} disabled={uploading} onClick={doUpload}>
              {uploading ? <><span style={{ display:'inline-block', animation:'mu-spin .8s linear infinite' }}>⏳</span> Uploading…</> : '⬆ Upload Now'}
            </button>
          </div>
        </div>
      )}

      {/* Recent uploads */}
      <div className="mu-section-title">Recent Uploads</div>
      {recent.length === 0 ? (
        <div className="mu-card" style={{ padding:'32px 20px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📂</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:6 }}>No uploads yet</div>
          <div style={{ fontSize:13, color:'#94a3b8' }}>Tap Upload Document to get started</div>
        </div>
      ) : recent.map((tx, i) => (
        <TxCard key={tx.id || i} tx={tx} idx={i} />
      ))}

      {/* Type sheet */}
      {showSheet && (
        <div className="mu-sheet-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSheet(false); }}>
          <div className="mu-sheet" style={{ padding:'0 18px' }}>
            <div className="mu-sheet-handle" />
            <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:'16px 0 14px' }}>What are you uploading?</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingBottom:8 }}>
              {TX_TYPES.map(t => (
                <button key={t.value} onClick={() => pickType(t.value)} style={{
                  padding:'15px 12px', borderRadius:14, border:'1.5px solid #e2e8f0',
                  background:'#fff', cursor:'pointer', textAlign:'left',
                  display:'flex', alignItems:'flex-start', gap:10, minHeight:60,
                }} onTouchStart={e=>(e.currentTarget.style.background='#f0fdfa')} onTouchEnd={e=>(e.currentTarget.style.background='#fff')}>
                  <span style={{ fontSize:24, flexShrink:0 }}>{t.icon}</span>
                  <div>
                    <span style={{ fontSize:12, fontWeight:700, color:'#0f172a', lineHeight:1.3, display:'block' }}>{t.label}</span>
                    {t.value === 'bank_statement' && (
                      <span style={{ fontSize:9, fontWeight:800, background:'#dbeafe', color:'#1d4ed8', padding:'2px 7px', borderRadius:4, display:'inline-block', marginTop:4 }}>BULK</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" style={{ display:'none' }} onChange={onFileChange} />
      <input ref={bulkRef} type="file" accept="image/*,application/pdf" multiple style={{ display:'none' }} onChange={onBulkChange} />

      {/* Success overlay */}
      {successMsg !== '' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', animation:'mu-fadein .2s ease' }}>
          <div style={{ background:'#fff', borderRadius:24, padding:'36px 44px', textAlign:'center', animation:'mu-pop .3s ease', boxShadow:'0 20px 60px rgba(0,0,0,.25)', margin:'0 24px' }}>
            <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>Uploaded!</div>
            <div style={{ fontSize:13, color:'#64748b', marginTop:8, lineHeight:1.6, whiteSpace:'pre-line' }}>{successMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transaction Card (shared) ────────────────────────────────────────────────

function TxCard({ tx, idx, onReupload }) {
  const [expanded, setExpanded] = useState(false);
  const d        = tx.extracted_data || {};
  const typeInfo = TX_TYPES.find(t => t.value === tx.type);
  const title    = d.vendor || d.invoice_number || tx.filename || tx.file_name || `${typeInfo?.label || 'Document'} #${idx+1}`;
  const amount   = fmtAmount(d.total_amount);
  const date     = fmtDate(d.invoice_date || tx.created_at || tx.uploaded_at);
  const sm       = STATUS_META[tx.status] || { label:tx.status, color:'#64748b', bg:'#f1f5f9', icon:'•' };

  return (
    <div className="mu-tx-card" style={{ animationDelay:`${Math.min(idx*0.05,0.4)}s` }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }} onClick={() => setExpanded(e => !e)}>
        <div style={{ width:44, height:44, borderRadius:12, background:TEAL_GLASS, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
          {typeInfo?.icon || '📄'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{[date, amount].filter(Boolean).join(' · ') || '—'}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
          <StatusBadge status={tx.status} />
          <span style={{ fontSize:10, color:'#cbd5e1' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9', animation:'mu-fadeIn .2s ease' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Type',     value: typeInfo?.label || tx.type },
              { label:'Invoice #', value: d.invoice_number || '—' },
              { label:'Date',     value: fmtDate(d.invoice_date) || '—' },
              { label:'Amount',   value: fmtAmount(d.total_amount) || '—' },
              { label:'Tax',      value: fmtAmount(d.tax_amount)   || '—' },
              { label:'File',     value: tx.filename || tx.file_name || '—' },
              ...(tx.payment_head_name ? [{ label:'Payment Head', value: tx.payment_head_name }] : []),
              ...(tx.sub_head_name     ? [{ label:'Sub-Head',     value: tx.sub_head_name     }] : []),
            ].map(row => (
              <div key={row.label} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.4, marginBottom:2 }}>{row.label}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'#334155', wordBreak:'break-all' }}>{row.value}</div>
              </div>
            ))}
          </div>
          {tx.status === 'rejected' && tx.reject_reason && (
            <div style={{ marginTop:8, background:'#fef2f2', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#dc2626', fontWeight:600 }}>
              ❌ Reason: {tx.reject_reason}
            </div>
          )}
          {tx.status === 'rejected' && onReupload && (
            <button onClick={() => onReupload(tx.id)} style={{ marginTop:10, width:'100%', padding:'11px', borderRadius:10, border:'1.5px solid #dc2626', background:'#fef2f2', color:'#dc2626', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              🔄 Re-upload Document
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab({ transactions, loading, onRefresh, session, addToast }) {
  const [search,  setSearch]  = useState('');
  const [typeF,   setTypeF]   = useState('all');
  const [statusF, setStatusF] = useState('all');
  const reuploadRef = useRef(null);
  const [reuploadId, setReuploadId] = useState(null);

  const filtered = transactions.filter(tx => {
    if (typeF !== 'all' && tx.type !== typeF) return false;
    if (statusF !== 'all' && tx.status !== statusF) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (tx.extracted_data?.vendor||'').toLowerCase().includes(q)
      || (tx.extracted_data?.invoice_number||'').toLowerCase().includes(q)
      || (tx.filename||tx.file_name||'').toLowerCase().includes(q);
  });

  const handleReupload = (id) => {
    setReuploadId(id);
    reuploadRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !reuploadId) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('uploaded_by', session?.username || 'company_user');
      const r = await fetch(`/api/transactions/${reuploadId}/reupload`, { method:'POST', body:fd });
      if (!r.ok) throw new Error((await r.json()).error || 'Re-upload failed');
      addToast('Document re-uploaded successfully!', 'success');
      onRefresh?.();
    } catch (err) {
      addToast(err.message, 'error');
    }
    setReuploadId(null);
  };

  return (
    <div>
      <input ref={reuploadRef} type="file" accept="image/*,application/pdf" style={{ display:'none' }} onChange={onFileChange} />

      {/* Search + filters */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 100%' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14, pointerEvents:'none' }}>🔍</span>
          <input className="mu-input" style={{ paddingLeft:36, paddingTop:11, paddingBottom:11 }} type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor, invoice#, file…" />
        </div>
        <div style={{ display:'flex', gap:8, flex:'1 1 100%' }}>
          <select className="mu-input" style={{ flex:1, padding:'10px 12px', fontSize:14 }} value={typeF} onChange={e=>setTypeF(e.target.value)}>
            <option value="all">All Types</option>
            {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
          <select className="mu-input" style={{ flex:1, padding:'10px 12px', fontSize:14 }} value={statusF} onChange={e=>setStatusF(e.target.value)}>
            <option value="all">All Status</option>
            <option value="processing">Processing</option>
            <option value="extracted">Pending Review</option>
            <option value="reviewed">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {(search || typeF !== 'all' || statusF !== 'all') && (
          <button className="mu-btn-ghost" style={{ flex:'0 0 auto', padding:'9px 14px', fontSize:13 }} onClick={() => { setSearch(''); setTypeF('all'); setStatusF('all'); }}>✕ Clear</button>
        )}
      </div>
      <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginBottom:12 }}>{filtered.length} of {transactions.length} records</div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'52px 20px', color:'#94a3b8' }}>
          <div style={{ fontSize:32, animation:'mu-spin 1s linear infinite', display:'inline-block' }}>⏳</div>
          <div style={{ marginTop:10, fontSize:14 }}>Loading transactions…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mu-card" style={{ padding:'48px 20px', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>📭</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:6 }}>No transactions found</div>
          <div style={{ fontSize:13, color:'#94a3b8' }}>{transactions.length ? 'Try adjusting your filters' : 'Upload your first document'}</div>
        </div>
      ) : filtered.map((tx, i) => (
        <TxCard key={tx.id || i} tx={tx} idx={i} onReupload={handleReupload} />
      ))}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab({ reports, loading }) {
  if (loading) return (
    <div style={{ textAlign:'center', padding:'52px 20px', color:'#94a3b8' }}>
      <div style={{ fontSize:32, animation:'mu-spin 1s linear infinite', display:'inline-block' }}>⏳</div>
      <div style={{ marginTop:10, fontSize:14 }}>Loading reports…</div>
    </div>
  );

  if (!reports.length) return (
    <div className="mu-card" style={{ padding:'52px 20px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
      <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:6 }}>No reports yet</div>
      <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.5 }}>Your accountant will upload MIS reports here</div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {reports.map((r, i) => (
        <div key={r.id || i} className="mu-card" style={{ padding:'16px', animation:`mu-slideup .35s ease ${i*0.06}s both` }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:TEAL_GLASS, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>📊</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:4, lineHeight:1.35 }}>{r.report_name || r.name || 'MIS Report'}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:8 }}>
                {r.report_type && (
                  <span className="mu-badge" style={{ background:'#f0fdfa', color:'#0f766e', border:'1px solid #99f6e4' }}>{r.report_type}</span>
                )}
                <span style={{ fontSize:11, color:'#94a3b8' }}>
                  {r.uploaded_by || 'Accountant'}
                  {r.uploaded_at ? ` · ${fmtDate(r.uploaded_at)}` : ''}
                </span>
              </div>
              <button
                onClick={() => window.open(`/api/reports/${r.id}/download`, '_blank')}
                style={{ padding:'9px 18px', borderRadius:10, border:'none', background:TEAL_GLASS, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', boxShadow:'0 2px 10px rgba(13,148,136,.25)' }}
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ session, onLogout, onSessionUpdate, addToast }) {
  const [editMode,  setEditMode]  = useState(false);
  const [pwdMode,   setPwdMode]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  const [form, setForm] = useState({
    display_name: session.display_name || '',
    email:        session.email        || '',
    phone:        session.phone        || '',
  });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const [pwd, setPwd] = useState({ current:'', newPwd:'', confirm:'' });
  const setP = (k, v) => setPwd(p => ({ ...p, [k]: v }));
  const [showPwd, setShowPwd] = useState(false);

  const saveProfile = async () => {
    if (!form.display_name.trim()) { addToast('Name cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/firm/users/${session.id}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ display_name: form.display_name.trim(), email: form.email.trim(), phone: form.phone.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
      onSessionUpdate({ ...session, ...form });
      setEditMode(false);
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
    setSaving(false);
  };

  const savePassword = async () => {
    if (!pwd.current)             { addToast('Enter your current password', 'error'); return; }
    if (pwd.newPwd.length < 6)    { addToast('New password must be at least 6 characters', 'error'); return; }
    if (pwd.newPwd !== pwd.confirm){ addToast('Passwords do not match', 'error'); return; }
    setSaving(true);
    try {
      // Verify current password by attempting login, then update
      const verify = await fetch('/api/auth/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username: session.username, password: pwd.current }),
      });
      if (!verify.ok) { addToast('Current password is incorrect', 'error'); setSaving(false); return; }
      const r = await fetch(`/api/firm/users/${session.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ password: pwd.newPwd }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
      setPwd({ current:'', newPwd:'', confirm:'' });
      setPwdMode(false);
      addToast('Password changed successfully', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
    setSaving(false);
  };

  const avatar = (session.display_name || session.username || 'U').charAt(0).toUpperCase();
  const roleLabel = {
    company_admin: 'Company Admin',
    company_user:  'Company User',
  }[session.role] || session.role;

  return (
    <div>
      {/* Avatar card */}
      <div className="mu-card" style={{ padding:'24px 20px', marginBottom:16, textAlign:'center', animation:'mu-slideup .35s ease' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:TEAL_GLASS, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:800, color:'#fff', margin:'0 auto 12px', boxShadow:'0 4px 16px rgba(13,148,136,.3)' }}>
          {avatar}
        </div>
        <div style={{ fontSize:18, fontWeight:800, color:'#0f172a' }}>{session.display_name || session.username}</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginTop:3 }}>{session.company_name || 'Company'}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8, background:'#f0fdfa', border:'1px solid #99f6e4', borderRadius:99, padding:'4px 12px' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#0d9488', display:'inline-block' }} />
          <span style={{ fontSize:12, fontWeight:700, color:'#0f766e' }}>{roleLabel}</span>
        </div>
      </div>

      {/* Info section */}
      {!editMode && !pwdMode && (
        <div style={{ animation:'mu-slideup .35s ease .05s both' }}>
          <div className="mu-section-title">Account Details</div>
          <div className="mu-card" style={{ padding:'4px 0', marginBottom:16 }}>
            {[
              { icon:'👤', label:'Username',     value: session.username },
              { icon:'✏️', label:'Display Name', value: session.display_name || '—' },
              { icon:'📧', label:'Email',         value: session.email || '—' },
              { icon:'📞', label:'Phone',         value: session.phone || '—' },
              { icon:'🏢', label:'Company',       value: session.company_name || '—' },
              { icon:'🔑', label:'Role',          value: roleLabel },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom: i < arr.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{row.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.4 }}>{row.label}</div>
                  <div style={{ fontSize:14, color:'#0f172a', fontWeight:600, marginTop:1, wordBreak:'break-all' }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button className="mu-btn-primary" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>
            <button className="mu-btn-ghost" style={{ width:'100%' }} onClick={() => setPwdMode(true)}>🔒 Change Password</button>
            <button
              onClick={onLogout}
              style={{ width:'100%', padding:'14px', borderRadius:14, border:'1.5px solid #fca5a5', background:'#fef2f2', color:'#dc2626', fontWeight:700, fontSize:15, cursor:'pointer', minHeight:52 }}
            >
              🚪 Log Out
            </button>
          </div>
        </div>
      )}

      {/* Edit profile form */}
      {editMode && (
        <div style={{ animation:'mu-slideup .3s ease' }}>
          <div className="mu-section-title">Edit Profile</div>
          <div className="mu-card" style={{ padding:'18px', marginBottom:16 }}>
            {[
              { key:'display_name', label:'Display Name', placeholder:'Your full name',  type:'text'  },
              { key:'email',        label:'Email Address', placeholder:'you@example.com', type:'email' },
              { key:'phone',        label:'Phone Number',  placeholder:'+91 98765 43210', type:'tel'   },
            ].map(f => (
              <div key={f.key} className="mu-field">
                <label className="mu-label">{f.label}</label>
                <input className="mu-input" type={f.type} value={form[f.key]} onChange={e=>setF(f.key,e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="mu-btn-ghost" style={{ flex:1 }} onClick={() => { setEditMode(false); setForm({ display_name:session.display_name||'', email:session.email||'', phone:session.phone||'' }); }}>Cancel</button>
            <button className="mu-btn-primary" style={{ flex:2 }} disabled={saving} onClick={saveProfile}>{saving ? 'Saving…' : '✓ Save Changes'}</button>
          </div>
        </div>
      )}

      {/* Change password form */}
      {pwdMode && (
        <div style={{ animation:'mu-slideup .3s ease' }}>
          <div className="mu-section-title">Change Password</div>
          <div className="mu-card" style={{ padding:'18px', marginBottom:16 }}>
            {[
              { key:'current', label:'Current Password',  placeholder:'Enter current password',  auto:'current-password' },
              { key:'newPwd',  label:'New Password',       placeholder:'Min 6 characters',         auto:'new-password'     },
              { key:'confirm', label:'Confirm New Password', placeholder:'Repeat new password',    auto:'new-password'     },
            ].map(f => (
              <div key={f.key} className="mu-field">
                <label className="mu-label">{f.label}</label>
                <div style={{ position:'relative' }}>
                  <input className="mu-input has-right" style={{ paddingRight:46 }} type={showPwd ? 'text' : 'password'} value={pwd[f.key]} onChange={e=>setP(f.key,e.target.value)} placeholder={f.placeholder} autoComplete={f.auto} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setShowPwd(p=>!p)} style={{ background:'none', border:'none', color:'#94a3b8', fontSize:13, cursor:'pointer', padding:0, marginTop:-8 }}>
              {showPwd ? '🙈 Hide' : '👁 Show'} passwords
            </button>
            {/* Strength bar */}
            {pwd.newPwd && (() => {
              const score = [pwd.newPwd.length>=6, /[A-Z]/.test(pwd.newPwd), /[0-9]/.test(pwd.newPwd), /[^A-Za-z0-9]/.test(pwd.newPwd)].filter(Boolean).length;
              const cols  = ['#ef4444','#f59e0b','#3b82f6','#16a34a'];
              const labs  = ['Weak','Fair','Good','Strong'];
              return (
                <div style={{ marginTop:12 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[0,1,2,3].map(i => <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<score ? cols[score-1] : '#e2e8f0', transition:'background .2s' }} />)}
                  </div>
                  <div style={{ fontSize:11, color:cols[score-1]??'#94a3b8', fontWeight:600 }}>{labs[score-1]??'Enter password'}</div>
                </div>
              );
            })()}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="mu-btn-ghost" style={{ flex:1 }} onClick={() => { setPwdMode(false); setPwd({ current:'', newPwd:'', confirm:'' }); }}>Cancel</button>
            <button className="mu-btn-primary" style={{ flex:2 }} disabled={saving} onClick={savePassword}>{saving ? 'Saving…' : '🔒 Update Password'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileUpload({ session: initialSession, onLogout, onSessionUpdate: pushSessionUp }) {
  const [session,       setSession]       = useState(initialSession);
  const [activeTab,     setActiveTab]     = useState('dashboard');
  const [transactions,  setTransactions]  = useState([]);
  const [reports,       setReports]       = useState([]);
  const [txLoading,     setTxLoading]     = useState(true);
  const [rpLoading,     setRpLoading]     = useState(true);
  const [toasts,        setToasts]        = useState([]);
  const toastId = useRef(0);

  const addToast = useCallback((msg, type = 'success') => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!session?.company_id) return;
    setTxLoading(true);
    try {
      const r = await fetch(`/api/company/invoices?company_id=${session.company_id}`);
      const d = await r.json();
      setTransactions(Array.isArray(d) ? d : []);
    } catch { addToast('Failed to load transactions', 'error'); }
    setTxLoading(false);
  }, [session?.company_id, addToast]);

  const fetchReports = useCallback(async () => {
    if (!session?.company_id) return;
    setRpLoading(true);
    try {
      const r = await fetch(`/api/reports?company_id=${session.company_id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setReports(Array.isArray(d) ? d : []);
    } catch { addToast('Failed to load reports', 'error'); }
    setRpLoading(false);
  }, [session?.company_id, addToast]);

  useEffect(() => { fetchTransactions(); fetchReports(); }, [fetchTransactions, fetchReports]);

  // Refresh reports when switching to reports tab
  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, fetchReports]);

  const headerTitle = {
    dashboard:    `Hi, ${session?.display_name || session?.username} 👋`,
    transactions: 'Transactions',
    reports:      'Reports',
    profile:      'My Profile',
  }[activeTab];

  return (
    <>
      <style>{CSS}</style>
      <Toasts toasts={toasts} />

      <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#f0faf9', overflow:'hidden' }}>

        {/* ── Header ── */}
        <div style={{
          background: TEAL_GLASS,
          paddingTop:    'calc(14px + var(--sat))',
          paddingBottom: 14,
          paddingLeft:   'calc(16px + var(--sal))',
          paddingRight:  'calc(16px + var(--sar))',
          boxShadow: '0 2px 16px rgba(15,118,110,.25)',
          flexShrink: 0,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:1.8, marginBottom:2 }}>InvoSmart</div>
              <div style={{ fontSize:'clamp(16px,4.5vw,20px)', fontWeight:800, color:'#fff', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{headerTitle}</div>
              {activeTab === 'dashboard' && (
                <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:2 }}>{session?.company_name || 'Company Portal'}</div>
              )}
            </div>
            {activeTab === 'dashboard' && (
              <button
                onClick={() => { fetchTransactions(); fetchReports(); addToast('Refreshed', 'info'); }}
                style={{ background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'9px 14px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', minHeight:40, flexShrink:0 }}
              >
                ↻ Refresh
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="mu-scroll" style={{ flex:1, overflowY:'auto', padding:'16px calc(14px + var(--sal)) 16px calc(14px + var(--sar))' }}>
          {activeTab === 'dashboard' && (
            <DashboardTab
              session={session}
              transactions={transactions}
              reports={reports}
              onUploadSuccess={fetchTransactions}
              addToast={addToast}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab
              transactions={transactions}
              loading={txLoading}
              onRefresh={fetchTransactions}
              session={session}
              addToast={addToast}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsTab reports={reports} loading={rpLoading} />
          )}
          {activeTab === 'profile' && (
            <ProfileTab
              session={session}
              onLogout={onLogout}
              onSessionUpdate={(s) => { setSession(s); pushSessionUp?.(s); }}
              addToast={addToast}
            />
          )}
        </div>

        {/* ── Bottom navigation ── */}
        <div style={{
          background: '#fff',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          paddingBottom: 'var(--sab)',
          boxShadow: '0 -4px 20px rgba(0,0,0,.08)',
          flexShrink: 0,
        }}>
          {NAV_TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                className={`mu-nav-btn${active ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{ color: active ? '#0d9488' : '#94a3b8' }}
              >
                <span className="mu-nav-icon" style={{ fontSize:22, lineHeight:1, display:'block' }}>{tab.icon}</span>
                <span style={{ fontSize:10, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                {active && <span style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:32, height:3, background:'#0d9488', borderRadius:'0 0 4px 4px' }} />}
              </button>
            );
          })}
        </div>

      </div>
    </>
  );
}
