import { useState, useEffect, useCallback, useRef } from 'react';
import Pagination from './Pagination';

// ─── Keyframe styles ──────────────────────────────────────────────────────────

const COMPANY_STYLES = `
@keyframes cd-banner   { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
@keyframes cd-card-up  { from{opacity:0;transform:translateY(30px) scale(.94);filter:blur(2px)} to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)} }
@keyframes cd-fadein   { from{opacity:0} to{opacity:1} }
@keyframes cd-row-in   { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes cd-upload-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(13,148,136,.35)} 50%{box-shadow:0 0 0 10px rgba(13,148,136,0)} }
.cd-kpi { transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease; cursor: default; will-change: transform; }
.cd-kpi:hover { transform: scale(1.07) translateY(-4px) !important; box-shadow: 0 16px 40px rgba(0,0,0,.22) !important; }
`;

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
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
  }, [target, duration]);
  return val;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRANSACTION_TYPES = [
  { value: 'invoice_purchase', label: 'Purchase Invoice', icon: '📄' },
  { value: 'invoice_sales',    label: 'Sales Invoice',    icon: '🧾' },
  { value: 'payment',          label: 'Payment',          icon: '💸' },
  { value: 'salary_register',  label: 'Salary Register',  icon: '👥' },
  { value: 'ledger',           label: 'Ledger',           icon: '📒' },
  { value: 'bank_statement',   label: 'Bank Statement',   icon: '🏦' },
];

const TYPE_BADGE = {
  invoice_purchase: { label: 'Purchase Inv.',  color: '#4338ca', bg: '#eef2ff' },
  invoice_sales:    { label: 'Sales Inv.',      color: '#16a34a', bg: '#f0fdf4' },
  payment:          { label: 'Payment',         color: '#1d4ed8', bg: '#eff6ff' },
  salary_register:  { label: 'Salary Register', color: '#7c3aed', bg: '#f5f3ff' },
  ledger:           { label: 'Ledger',          color: '#d97706', bg: '#fffbeb' },
  bank_statement:   { label: 'Bank Statement',  color: '#0f766e', bg: '#f0fdfa' },
};

const STATUS_META = {
  processing:   { label: 'Processing',    color: '#1d4ed8', bg: '#eff6ff' },
  extracted:    { label: 'Pending Review',color: '#d97706', bg: '#fffbeb' },
  reviewed:     { label: 'Under Review',  color: '#7c3aed', bg: '#f5f3ff' },
  approved:     { label: 'Approved',      color: '#16a34a', bg: '#f0fdf4' },
  rejected:     { label: 'Rejected',      color: '#dc2626', bg: '#fef2f2' },
};

const INVOICE_TYPES = new Set(['invoice_purchase', 'invoice_sales']);

const TABS = [
  { key: 'upload',       label: 'Upload',       icon: '📤' },
  { key: 'transactions', label: 'Transactions', icon: '📄' },
  { key: 'reports',      label: 'Reports',      icon: '📋' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(val) {
  if (val == null || val === '' || val === undefined) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function vendorDisplay(tx) {
  return tx.extracted_data?.vendor || tx.file_name || tx.filename || '—';
}

function invoiceNumber(tx) {
  return tx.extracted_data?.invoice_number || '—';
}

function paymentHeadDisplay(tx) {
  if (!tx.payment_head_name && !tx.sub_head_name) return null;
  const head = tx.payment_head_name || '';
  const sub  = tx.sub_head_name || '';
  if (head && sub) return `${head} → ${sub}`;
  return head || sub || null;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? '#f0fdf4' : t.type === 'error' ? '#fef2f2' : '#eff6ff',
          border: `1.5px solid ${t.type === 'success' ? '#86efac' : t.type === 'error' ? '#fca5a5' : '#93c5fd'}`,
          color: t.type === 'success' ? '#15803d' : t.type === 'error' ? '#b91c1c' : '#1d4ed8',
          borderRadius: 10, padding: '12px 18px', fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,.08)',
          animation: 'cd-fadein .25s ease',
          minWidth: 260, maxWidth: 360,
        }}>
          {t.type === 'success' ? '✅ ' : t.type === 'error' ? '❌ ' : 'ℹ️ '}{t.message}
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, gradient, delay = 0 }) {
  const num = typeof value === 'number' ? value : 0;
  const animated = useCountUp(num);
  const display = typeof value === 'string' ? value : animated;

  return (
    <div className="cd-kpi" style={{
      background: `linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),${gradient}`,
      borderRadius: 14,
      padding: '16px 16px',
      color: '#fff',
      boxShadow: '0 4px 18px rgba(0,0,0,.11)',
      animation: `cd-card-up .6s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both`,
      position: 'relative',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>{display}</div>
      <div style={{ fontSize: 11, marginTop: 5, opacity: .88, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{
        position: 'absolute', right: -14, bottom: -14,
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(255,255,255,.08)',
      }} />
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, rejectReason }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
  const [showTip, setShowTip] = useState(false);
  return (
    <span
      style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
        fontSize: 12, fontWeight: 700,
        color: meta.color, background: meta.bg,
        border: `1px solid ${meta.color}33`,
        position: 'relative', cursor: status === 'rejected' && rejectReason ? 'help' : 'default',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={() => status === 'rejected' && rejectReason && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {meta.label}
      {showTip && rejectReason && (
        <span style={{
          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#fff', borderRadius: 8, padding: '6px 12px',
          fontSize: 12, whiteSpace: 'normal', minWidth: 180, maxWidth: 260,
          boxShadow: '0 4px 16px rgba(0,0,0,.2)', zIndex: 100, lineHeight: 1.4,
          pointerEvents: 'none',
        }}>
          {rejectReason}
          <span style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            borderWidth: '5px 5px 0', borderStyle: 'solid',
            borderColor: '#1e293b transparent transparent',
          }} />
        </span>
      )}
    </span>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const meta = TYPE_BADGE[type] || { label: type, color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      color: meta.color, background: meta.bg,
      border: `1px solid ${meta.color}33`,
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

// ─── Upload Tab ───────────────────────────────────────────────────────────────

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';

function isValidFile(f) {
  return ['application/pdf','image/jpeg','image/png','image/webp'].includes(f.type)
    || /\.(pdf|jpg|jpeg|png|webp)$/i.test(f.name);
}

function UploadTab({ session, onUploadSuccess, addToast }) {
  const [selectedType, setSelectedType] = useState('');
  // single-file mode
  const [file,      setFile]      = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success,   setSuccess]   = useState(false);
  // bulk mode (bank_statement)
  const [bulkFiles,   setBulkFiles]   = useState([]);
  const [bulkProgress,setBulkProgress]= useState(null); // { done, total }
  const [bulkResults, setBulkResults] = useState(null); // { count, errors }

  const inputRef     = useRef(null);
  const bulkInputRef = useRef(null);

  const isBulk      = selectedType === 'bank_statement';
  const isInvoice   = INVOICE_TYPES.has(selectedType);
  const canUpload   = selectedType && !uploading && (isBulk ? bulkFiles.length > 0 : !!file);

  // ── single file handlers ──
  const handleFile = (f) => {
    if (!isValidFile(f)) { addToast('Only PDF, JPG, PNG, WEBP accepted.', 'error'); return; }
    setFile(f); setSuccess(false);
  };
  const onDrop      = useCallback((e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }, []);
  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);

  // ── bulk file handlers ──
  const addBulkFiles = (fileList) => {
    const valid = Array.from(fileList).filter(f => {
      if (!isValidFile(f)) { addToast(`${f.name}: not a supported format`, 'error'); return false; }
      return true;
    });
    setBulkFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))];
    });
    setBulkResults(null);
  };
  const onBulkDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    addBulkFiles(e.dataTransfer.files);
  }, []);
  const removeBulkFile = (idx) => setBulkFiles(prev => prev.filter((_, i) => i !== idx));

  // ── single upload ──
  const handleUpload = async () => {
    if (!canUpload || isBulk) return;
    setUploading(true); setSuccess(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('company_id', session.company_id);
      fd.append('firm_id',    session.firm_id);
      fd.append('type',       selectedType);
      fd.append('uploaded_by', session.display_name || session.username);
      const res = await fetch('/api/transactions/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || `Upload failed (${res.status})`);
      setSuccess(true); setFile(null); setSelectedType('');
      if (inputRef.current) inputRef.current.value = '';
      addToast('File uploaded successfully!', 'success');
      onUploadSuccess();
    } catch (err) { addToast(err.message || 'Upload failed.', 'error'); }
    setUploading(false);
  };

  // ── bulk upload ──
  const handleBulkUpload = async () => {
    if (!canUpload || !isBulk || bulkFiles.length === 0) return;
    setUploading(true); setBulkResults(null);
    setBulkProgress({ done: 0, total: bulkFiles.length });
    try {
      const fd = new FormData();
      bulkFiles.forEach(f => fd.append('files', f));
      fd.append('company_id', session.company_id);
      fd.append('firm_id',    session.firm_id);
      fd.append('type',       'bank_statement');
      fd.append('uploaded_by', session.display_name || session.username);
      setBulkProgress({ done: bulkFiles.length, total: bulkFiles.length });
      const res = await fetch('/api/transactions/bulk-upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Bulk upload failed');
      setBulkResults({ count: data.count, success: true });
      setBulkFiles([]);
      addToast(`${data.count} bank statement${data.count !== 1 ? 's' : ''} uploaded — AI is processing…`, 'success');
      onUploadSuccess();
    } catch (err) {
      addToast(err.message, 'error');
      setBulkResults({ success: false, error: err.message });
    }
    setUploading(false); setBulkProgress(null);
  };

  const onTypeSelect = (val) => {
    setSelectedType(val); setSuccess(false);
    setFile(null); setBulkFiles([]); setBulkResults(null);
  };

  const TEAL_BTN = 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#0f766e 0%,#0d9488 55%,#14b8a6 100%)';

  return (
    <div style={{ animation: 'cd-fadein .4s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

        {/* ── Left: Type selector ── */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 14 }}>Select Transaction Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {TRANSACTION_TYPES.map(t => {
              const active = selectedType === t.value;
              const isBs   = t.value === 'bank_statement';
              return (
                <button key={t.value} onClick={() => onTypeSelect(t.value)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                  padding: '11px 14px',
                  border: active ? `1.5px solid ${isBs ? '#1d4ed8' : '#0d9488'}` : '1.5px solid #e2e8f0',
                  borderRadius: 12,
                  background: active ? (isBs ? '#eff6ff' : '#f0fdfa') : '#fff',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  color: active ? (isBs ? '#1e40af' : '#0f766e') : '#475569',
                  transition: 'all .18s', textAlign: 'left',
                  boxShadow: active ? `0 0 0 3px ${isBs ? 'rgba(37,99,235,.12)' : 'rgba(13,148,136,.15)'}` : 'none',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    {t.label}
                  </div>
                  {isBs && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '1px 7px', letterSpacing: .3 }}>
                      BULK SUPPORTED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: Upload zone ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── BULK MODE ── */}
          {isBulk ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                  🏦 Bulk Bank Statement Upload
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Max 30 files · 15 MB each</span>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => bulkInputRef.current?.click()}
                onDrop={onBulkDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                style={{
                  border: dragOver ? '2px dashed #1d4ed8' : '2px dashed #bfdbfe',
                  borderRadius: 16, padding: '28px 24px',
                  background: dragOver ? '#eff6ff' : '#f8faff',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'all .2s',
                }}
              >
                <input ref={bulkInputRef} type="file" multiple accept={ACCEPT} style={{ display: 'none' }}
                  onChange={e => { addBulkFiles(e.target.files); e.target.value = ''; }} />
                <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
                <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 14, marginBottom: 4 }}>
                  Click or drag &amp; drop multiple files
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>PDF, JPG, PNG, WEBP — select as many as needed</div>
              </div>

              {/* File list */}
              {bulkFiles.length > 0 && (
                <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      {bulkFiles.length} file{bulkFiles.length !== 1 ? 's' : ''} selected
                    </span>
                    <button onClick={() => setBulkFiles([])} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Clear all</button>
                  </div>
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {bulkFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < bulkFiles.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <span style={{ fontSize: 16 }}>📄</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{(f.size / 1024).toFixed(0)} KB</div>
                        </div>
                        <button onClick={() => removeBulkFile(i)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: '2px 4px', borderRadius: 4, flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 14px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b' }}>
                    Total: {(bulkFiles.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0)} KB
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {bulkProgress && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 6 }}>
                    <span>⏳ Uploading {bulkFiles.length} file{bulkFiles.length !== 1 ? 's' : ''}…</span>
                    <span>{bulkProgress.done}/{bulkProgress.total}</span>
                  </div>
                  <div style={{ background: '#bfdbfe', borderRadius: 99, height: 6 }}>
                    <div style={{ background: '#2563eb', height: 6, borderRadius: 99, width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )}

              {/* Result */}
              {bulkResults && (
                <div style={{
                  background: bulkResults.success ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${bulkResults.success ? '#86efac' : '#fca5a5'}`,
                  borderRadius: 12, padding: '14px 18px',
                  color: bulkResults.success ? '#15803d' : '#b91c1c',
                  fontWeight: 600, fontSize: 14, animation: 'cd-fadein .3s ease',
                }}>
                  {bulkResults.success
                    ? `✅ ${bulkResults.count} file${bulkResults.count !== 1 ? 's' : ''} uploaded — AI is extracting data in the background`
                    : `❌ ${bulkResults.error}`}
                </div>
              )}

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1e40af', fontWeight: 500 }}>
                🤖 AI will extract transaction details from each statement automatically
              </div>

              <button onClick={handleBulkUpload} disabled={!canUpload} style={{
                width: '100%', padding: '13px 0',
                background: canUpload ? 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#1e40af,#2563eb,#3b82f6)' : '#e2e8f0',
                color: canUpload ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
                cursor: canUpload ? 'pointer' : 'not-allowed',
                boxShadow: canUpload ? '0 4px 20px rgba(37,99,235,.35)' : 'none',
                transition: 'all .2s',
              }}>
                {uploading ? '⏳ Uploading…' : `📤 Upload ${bulkFiles.length > 0 ? `${bulkFiles.length} File${bulkFiles.length !== 1 ? 's' : ''}` : 'Files'}`}
              </button>
            </>
          ) : (
            /* ── SINGLE MODE ── */
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Upload File</div>

              <div onClick={() => inputRef.current?.click()} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                style={{ border: dragOver ? '2px dashed #0d9488' : '2px dashed #e2e8f0', borderRadius: 16, padding: '36px 24px', background: dragOver ? '#f0fdfa' : '#fafafa', textAlign: 'center', cursor: 'pointer', transition: 'all .2s', animation: file ? 'cd-upload-pulse 2s ease infinite' : 'none', flex: 1 }}>
                <input ref={inputRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                {file ? (
                  <div>
                    <div style={{ fontSize: 34, marginBottom: 8 }}>📎</div>
                    <div style={{ fontWeight: 700, color: '#0f766e', fontSize: 14, wordBreak: 'break-all' }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{(file.size/1024).toFixed(1)} KB — click or drop to replace</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>☁️</div>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: 14, marginBottom: 4 }}>Click to browse or drag &amp; drop</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>PDF, JPG, PNG, WEBP accepted</div>
                  </div>
                )}
              </div>

              {selectedType && (
                <div style={{ background: isInvoice ? '#f0fdfa' : '#f8fafc', border: `1px solid ${isInvoice ? '#99f6e4' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: isInvoice ? '#0f766e' : '#64748b', fontWeight: 500 }}>
                  {isInvoice ? '🤖 AI will automatically extract vendor, amount, tax details' : '📋 File will be reviewed by your accountant'}
                </div>
              )}

              <button onClick={handleUpload} disabled={!canUpload} style={{
                width: '100%', padding: '13px 0',
                background: canUpload ? TEAL_BTN : '#e2e8f0',
                color: canUpload ? '#fff' : '#94a3b8',
                border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
                cursor: canUpload ? 'pointer' : 'not-allowed',
                boxShadow: canUpload ? '0 4px 20px rgba(13,148,136,.35)' : 'none',
                transition: 'all .2s',
              }}>
                {uploading ? '⏳ Uploading…' : '📤 Upload & Process'}
              </button>

              {success && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 18px', color: '#15803d', fontWeight: 600, fontSize: 14, animation: 'cd-fadein .3s ease' }}>
                  ✅ Upload successful! AI is extracting data…
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab({ transactions, loading, onRefresh, session }) {
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [txSearch,     setTxSearch]     = useState('');
  const [scanning,     setScanning]     = useState(new Set());
  const [editModal,    setEditModal]    = useState(null);   // txn being edited
  const [editForm,     setEditForm]     = useState({});
  const [editSaving,   setEditSaving]   = useState(false);
  const [reuploadId,   setReuploadId]   = useState(null);   // txn id for re-upload
  const [reuploading,  setReuploading]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);   // txn to confirm-delete
  const [deleting,     setDeleting]     = useState(false);
  const [txPage,       setTxPage]       = useState(0);
  const reuploadRef = useRef(null);

  const handleRescan = async (tx) => {
    setScanning(prev => new Set(prev).add(tx.id));
    try {
      const res = await fetch(`/api/transactions/${tx.id}/reextract`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Rescan failed');
      onRefresh?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setScanning(prev => { const s = new Set(prev); s.delete(tx.id); return s; });
    }
  };

  const openEdit = (tx) => {
    const d = tx.extracted_data || {};
    setEditForm({
      vendor: d.vendor || '',
      invoice_number: d.invoice_number || '',
      invoice_date: d.invoice_date || '',
      total_amount: d.total_amount || '',
      tax_amount: d.tax_amount || '',
      notes: d.notes || '',
    });
    setEditModal(tx);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/transactions/${editModal.id}/company-edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: { ...(editModal.extracted_data || {}), ...editForm },
          performed_by: session?.username || 'company_user',
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setEditModal(null);
      onRefresh?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleReuploadFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !reuploadId) return;
    setReuploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('uploaded_by', session?.username || 'company_user');
      const res = await fetch(`/api/transactions/${reuploadId}/reupload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error || 'Re-upload failed');
      onRefresh?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setReuploading(false);
      setReuploadId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Delete failed');
      setDeleteTarget(null);
      onRefresh?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = transactions.filter(tx => {
    const typeOk   = typeFilter   === 'all' || tx.type   === typeFilter;
    const statusOk = statusFilter === 'all' || tx.status === statusFilter;
    const q = txSearch.toLowerCase();
    const searchOk = !q ||
      (tx.extracted_data?.vendor || '').toLowerCase().includes(q) ||
      (tx.extracted_data?.invoice_number || '').toLowerCase().includes(q) ||
      (tx.file_name || tx.filename || '').toLowerCase().includes(q);
    return typeOk && statusOk && searchOk;
  });

  const TX_PAGE_SIZE = 20;
  const safeTxPage = Math.min(txPage, Math.max(0, Math.ceil(filtered.length / TX_PAGE_SIZE) - 1));
  const pagedTx = filtered.slice(safeTxPage * TX_PAGE_SIZE, (safeTxPage + 1) * TX_PAGE_SIZE);

  const selectStyle = {
    padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    fontSize: 13, fontWeight: 600, color: '#334155', background: '#fff',
    cursor: 'pointer', outline: 'none',
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0',
    fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ animation: 'cd-fadein .4s ease' }}>

      {/* Hidden file input for re-upload */}
      <input ref={reuploadRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleReuploadFile} />

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>Delete Document?</div>
            <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#0f172a' }}>{deleteTarget.filename || deleteTarget.file_name}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', marginBottom: 24 }}>
              This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '9px 22px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: deleting ? '#fca5a5' : '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? 'Deleting…' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 520, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>✏️ Edit Document</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Update extracted data and resubmit for review</div>
              </div>
              <button onClick={() => setEditModal(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            {editModal.reject_reason && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
                ❌ Rejected: {editModal.reject_reason}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Vendor / Party Name', key: 'vendor', type: 'text' },
                { label: 'Invoice Number',      key: 'invoice_number', type: 'text' },
                { label: 'Invoice Date',        key: 'invoice_date', type: 'date' },
                { label: 'Total Amount (₹)',    key: 'total_amount', type: 'number' },
                { label: 'Tax Amount (₹)',      key: 'tax_amount', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 }}>{label}</label>
                  <input
                    type={type}
                    style={inputStyle}
                    value={editForm[key] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 }}>Notes</label>
                <textarea
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={editForm.notes || ''}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditModal(null)} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={editSaving} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: editSaving ? .7 : 1 }}>
                {editSaving ? 'Saving…' : '✓ Save & Resubmit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 170 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
          <input type="text" value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="Search vendor, invoice#, file…"
            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#334155', boxSizing: 'border-box', fontWeight: 500 }}
            onFocus={e => (e.target.style.borderColor = '#0d9488')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Types</option>
          {TRANSACTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="processing">Processing</option>
          <option value="extracted">Pending Review</option>
          <option value="reviewed">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8', alignSelf: 'center', fontWeight: 500 }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 15 }}>
          ⏳ Loading transactions…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'cd-fadein .4s ease' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#334155', marginBottom: 8 }}>
            No transactions yet.
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>
            Upload your first document above.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                {['#','Type','File Name','Vendor / Desc','Invoice #','Invoice Date','Amount ₹','Payment Head','Status','Uploaded',''].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 14px', textAlign: 'left',
                    fontSize: 12, fontWeight: 700, color: '#64748b',
                    whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedTx.map((tx, idx) => {
                const head = paymentHeadDisplay(tx);
                const rowNum = safeTxPage * TX_PAGE_SIZE + idx + 1;
                return (
                  <tr key={tx.id || idx} style={{
                    borderBottom: '1px solid #f1f5f9',
                    animation: `cd-row-in .35s ease ${Math.min(idx * 0.04, 0.4)}s both`,
                    transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                      {rowNum}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <TypeBadge type={tx.type} />
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.file_name || tx.filename || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vendorDisplay(tx)}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
                      {invoiceNumber(tx)}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {tx.extracted_data?.invoice_date || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#0f766e', whiteSpace: 'nowrap' }}>
                      {formatAmount(tx.extracted_data?.total_amount)}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: head ? '#475569' : '#cbd5e1', whiteSpace: 'nowrap' }}>
                      {head || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <StatusBadge status={tx.status} rejectReason={tx.reject_reason} />
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {shortDate(tx.uploaded_at || tx.created_at)}
                    </td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const locked  = ['reviewed', 'approved'].includes(tx.status);
                        const editable = ['uploaded', 'extracted', 'rejected'].includes(tx.status);
                        const deletable = !locked;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {editable && (
                              <button
                                onClick={() => openEdit(tx)}
                                style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {tx.status === 'rejected' && (
                              <button
                                onClick={() => { setReuploadId(tx.id); reuploadRef.current?.click(); }}
                                disabled={reuploading && reuploadId === tx.id}
                                style={{ background: '#fdf4ff', color: '#9333ea', border: '1px solid #e9d5ff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                {reuploading && reuploadId === tx.id ? '⏳ Uploading…' : '📎 Re-upload'}
                              </button>
                            )}
                            {!locked && tx.filepath && tx.status !== 'rejected' && (
                              <button
                                onClick={() => !scanning.has(tx.id) && handleRescan(tx)}
                                disabled={scanning.has(tx.id)}
                                title="Re-extract data from file"
                                style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: scanning.has(tx.id) ? 'wait' : 'pointer', opacity: scanning.has(tx.id) ? 0.6 : 1 }}
                              >
                                {scanning.has(tx.id) ? '⏳' : '🔄'} Rescan
                              </button>
                            )}
                            {deletable && (
                              <button
                                onClick={() => setDeleteTarget(tx)}
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={safeTxPage} total={filtered.length} pageSize={TX_PAGE_SIZE} onPageChange={setTxPage} />
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab({ reports, loading }) {
  const handleDownload = (report) => {
    window.open(`/api/reports/${report.id}/download`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 15, animation: 'cd-fadein .4s ease' }}>
        ⏳ Loading reports…
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'cd-fadein .4s ease' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#334155', marginBottom: 8 }}>
          No reports yet.
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>
          Your accountant will upload MIS reports here.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 18,
      animation: 'cd-fadein .4s ease',
    }}>
      {reports.map((report, idx) => (
        <div key={report.id || idx} style={{
          background: '#fff',
          borderRadius: 16,
          border: '1.5px solid #e2e8f0',
          padding: '20px 22px',
          boxShadow: '0 2px 12px rgba(0,0,0,.05)',
          animation: `cd-card-up .45s cubic-bezier(0.34,1.56,0.64,1) ${Math.min(idx * 0.07, 0.5)}s both`,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontSize: 32, lineHeight: 1 }}>📊</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', lineHeight: 1.35 }}>
            {report.name || report.report_name || 'MIS Report'}
          </div>
          {report.report_type && (
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 700,
              color: '#0f766e', background: '#f0fdfa',
              border: '1px solid #99f6e4',
              alignSelf: 'flex-start',
            }}>
              {report.report_type}
            </span>
          )}
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            {report.uploaded_by_name || report.uploaded_by || 'Accountant'}
            {' · '}{shortDate(report.uploaded_at || report.created_at)}
          </div>
          <button
            onClick={() => handleDownload(report)}
            style={{
              marginTop: 4, padding: '9px 0',
              background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(13,148,136,.25)',
              transition: 'opacity .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ⬇️ Download
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompanyDashboard({ session }) {
  const [activeTab,    setActiveTab]    = useState('upload');
  const [transactions, setTransactions] = useState([]);
  const [reports,      setReports]      = useState([]);
  const [txLoading,    setTxLoading]    = useState(false);
  const [rpLoading,    setRpLoading]    = useState(false);
  const [toasts,       setToasts]       = useState([]);
  const toastIdRef = useRef(0);

  // ── Toast helpers ──
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  // ── Fetch transactions ──
  const fetchTransactions = useCallback(async () => {
    if (!session?.company_id) return;
    setTxLoading(true);
    try {
      const res = await fetch(`/api/transactions?company_id=${session.company_id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : (data.transactions || []));
    } catch (err) {
      addToast(`Failed to load transactions: ${err.message}`, 'error');
    } finally {
      setTxLoading(false);
    }
  }, [session?.company_id, addToast]);

  // ── Fetch reports ──
  const fetchReports = useCallback(async () => {
    if (!session?.company_id) return;
    setRpLoading(true);
    try {
      const res = await fetch(`/api/reports?company_id=${session.company_id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : (data.reports || []));
    } catch (err) {
      addToast(`Failed to load reports: ${err.message}`, 'error');
    } finally {
      setRpLoading(false);
    }
  }, [session?.company_id, addToast]);

  // ── Initial load ──
  useEffect(() => {
    fetchTransactions();
    fetchReports();
  }, [fetchTransactions, fetchReports]);

  // ── Refresh all ──
  const handleRefresh = () => {
    fetchTransactions();
    fetchReports();
    addToast('Data refreshed.', 'info', 2500);
  };

  // ── KPI derivations ──
  const totalUploaded  = transactions.length;
  const pendingReview  = transactions.filter(t => t.status === 'extracted').length;
  const reviewed       = transactions.filter(t => t.status === 'reviewed').length;
  const approved       = transactions.filter(t => t.status === 'approved').length;
  const rejected       = transactions.filter(t => t.status === 'rejected').length;

  return (
    <>
      {/* Inject keyframes once */}
      <style>{COMPANY_STYLES}</style>

      {/* Toast container */}
      <Toast toasts={toasts} />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0fdfa 0%, #f8fafc 60%, #e0f2fe 100%)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}>

        {/* ── Banner ── */}
        <div style={{
          background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)',
          padding: '28px 0',
          color: '#fff',
          boxShadow: '0 4px 32px rgba(13,148,136,.3)',
          animation: 'cd-banner .55s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', lineHeight: 1.2 }}>
                {session?.company_name || 'Company'}
              </div>
              <div style={{ fontSize: 14, opacity: .85, marginTop: 5, fontWeight: 500 }}>
                Welcome, {session?.display_name || session?.username}
                {session?.role === 'company_admin' && (
                  <span style={{
                    marginLeft: 10, background: 'rgba(255,255,255,.2)',
                    borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
                  }}>Admin</span>
                )}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              style={{
                background: 'rgba(255,255,255,.18)',
                border: '1.5px solid rgba(255,255,255,.35)',
                color: '#fff', borderRadius: 10,
                padding: '9px 18px', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', transition: 'background .2s',
                backdropFilter: 'blur(6px)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ padding: '24px 0' }}>

          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 12,
            marginBottom: 32,
          }}>
            <KpiCard
              icon="📤"
              label="Total Uploaded"
              value={totalUploaded}
              gradient="linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
              delay={0}
            />
            <KpiCard
              icon="⏳"
              label="Pending Review"
              value={pendingReview}
              gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
              delay={0.08}
            />
            <KpiCard
              icon="📝"
              label="Under Review"
              value={reviewed}
              gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
              delay={0.16}
            />
            <KpiCard
              icon="✅"
              label="Approved"
              value={approved}
              gradient="linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
              delay={0.24}
            />
            <KpiCard
              icon="❌"
              label="Rejected"
              value={rejected}
              gradient="linear-gradient(135deg, #dc2626 0%, #f87171 100%)"
              delay={0.32}
            />
          </div>

          {/* Tab Nav */}
          <div style={{
            display: 'flex', gap: 4,
            background: '#fff',
            borderRadius: 14, padding: 5,
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
            marginBottom: 28,
            width: 'fit-content',
            border: '1.5px solid #f1f5f9',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 22px', borderRadius: 10, border: 'none',
                  fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', transition: 'all .2s',
                  background: activeTab === tab.key
                    ? 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)'
                    : 'transparent',
                  color: activeTab === tab.key ? '#fff' : '#64748b',
                  boxShadow: activeTab === tab.key ? '0 2px 10px rgba(13,148,136,.3)' : 'none',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            background: '#fff',
            borderRadius: 18,
            padding: '28px 28px',
            boxShadow: '0 2px 20px rgba(0,0,0,.06)',
            border: '1.5px solid #f1f5f9',
            minHeight: 400,
          }}>
            {activeTab === 'upload' && (
              <UploadTab
                session={session}
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
              />
            )}
            {activeTab === 'reports' && (
              <ReportsTab
                reports={reports}
                loading={rpLoading}
              />
            )}
          </div>

        </div>
      </div>
    </>
  );
}
