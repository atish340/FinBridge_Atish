import { useState, useEffect, useCallback } from 'react';
import Pagination from './Pagination';
import { exportToTallyBulk, exportToZohoCSV, exportToQuickBooks } from '../utils/exportUtils';

// ─── CSS Keyframes ────────────────────────────────────────────────────────────

const ACCT_STYLES = `
@keyframes ac-banner    { from{opacity:0;transform:translateY(-18px)} to{opacity:1;transform:translateY(0)} }
@keyframes ac-card-up   { from{opacity:0;transform:translateY(30px) scale(.94)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes ac-fadein    { from{opacity:0} to{opacity:1} }
@keyframes ac-row-in    { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes ac-slide-down { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
.ac-kpi { transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease; cursor: default; will-change: transform; }
.ac-kpi:hover { transform: scale(1.07) translateY(-4px) !important; box-shadow: 0 16px 40px rgba(0,0,0,.22) !important; }
`;

// ─── Shared input style ───────────────────────────────────────────────────────

const INPUT_STYLE = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1.5px solid #e2e8f0',
  fontSize: 13,
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const SELECT_STYLE = { ...INPUT_STYLE, cursor: 'pointer' };

// ─── Badge helper ─────────────────────────────────────────────────────────────

function Badge({ status }) {
  const MAP = {
    uploaded:   { label: 'Uploaded',   bg: '#eff6ff', color: '#2563eb' },
    extracted:  { label: 'Extracted',  bg: '#f0fdf4', color: '#16a34a' },
    reviewed:   { label: 'Under Review', bg: '#fef9c3', color: '#92400e' },
    approved:   { label: 'Approved',   bg: '#dcfce7', color: '#15803d' },
    rejected:   { label: 'Rejected',   bg: '#fef2f2', color: '#dc2626' },
    processing: { label: 'Processing', bg: '#f5f3ff', color: '#7c3aed' },
  };
  const m = MAP[status] || { label: status, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, background: m.bg, color: m.color,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const MAP = {
    invoice_purchase: { label: 'Purchase',  bg: '#eff6ff', color: '#2563eb' },
    invoice_sales:    { label: 'Sales',     bg: '#f0fdf4', color: '#16a34a' },
    payment:          { label: 'Payment',   bg: '#fef9c3', color: '#92400e' },
    salary_register:  { label: 'Salary',   bg: '#fdf4ff', color: '#9333ea' },
    ledger:           { label: 'Ledger',    bg: '#ecfdf5', color: '#0d9488' },
    bank_statement:   { label: 'Bank',      bg: '#fff7ed', color: '#c2410c' },
  };
  const m = MAP[type] || { label: (type || 'Doc').replace(/_/g, ' '), bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 8px', borderRadius: 6,
      fontSize: 10, fontWeight: 700, background: m.bg, color: m.color,
      textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#16a34a';
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: bg, color: '#fff', padding: '12px 20px',
      borderRadius: 12, fontSize: 13, fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,.2)', animation: 'ac-fadein .25s ease',
      maxWidth: 340,
    }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: 12, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
    </div>
  );
}

// ─── ConfirmDialog (reject reason) ───────────────────────────────────────────

function RejectDialog({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'ac-fadein .2s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 400, maxWidth: '90vw',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Reject Transaction</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Please provide a reason for rejection.</p>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>
          Rejection Reason<span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={3}
          style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0',
            background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: reason.trim() ? '#dc2626' : '#fca5a5', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: reason.trim() ? 'pointer' : 'not-allowed',
            }}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, bg, delay }) {
  return (
    <div className="ac-kpi" style={{
      background: `linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),${bg}`, borderRadius: 14, padding: '18px 20px', color: '#fff',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 6px 20px rgba(0,0,0,.12)',
      animation: `ac-card-up 0.7s cubic-bezier(.34,1.56,.64,1) ${delay} both`,
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 56, opacity: .1 }}>{icon}</div>
    </div>
  );
}

// ─── Section Nav ──────────────────────────────────────────────────────────────

function SectionNav({ active, onChange }) {
  const tabs = [
    { key: 'queue',   label: '🔍 Review Queue'    },
    { key: 'all',     label: '📄 All Transactions' },
    { key: 'upload',  label: '📊 Upload MIS'       },
    { key: 'exports', label: '📤 Exports'          },
    { key: 'audit',   label: '📋 Audit Log'        },
  ];
  return (
    <div style={{
      display: 'flex', gap: 4, background: '#f1f5f9',
      borderRadius: 12, padding: 4, marginBottom: 20,
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
          background: active === t.key
            ? 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)'
            : 'transparent',
          color: active === t.key ? '#fff' : '#64748b',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          transition: 'all .2s',
          boxShadow: active === t.key ? '0 2px 10px rgba(37,99,235,.25)' : 'none',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({
  txn, companies, paymentHeads, expandedId, editState,
  onExpand, onEditChange, onSave, onApprove, onRejectRequest,
  saving, firmId, session,
}) {
  const isOpen = expandedId === txn.id;
  const es = editState[txn.id] || {};
  const d = txn.extracted_data || {};
  const companyName = companies.find(c => c.id === txn.company_id)?.name || txn.company_id || '—';
  const heads = paymentHeads[txn.company_id] || [];

  const selectedHead = heads.find(h => h.id === es.payment_head_id);
  const subHeads = selectedHead?.sub_heads || [];

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0',
      marginBottom: 12, overflow: 'hidden',
      boxShadow: isOpen ? '0 8px 28px rgba(37,99,235,.10)' : '0 2px 8px rgba(0,0,0,.06)',
      transition: 'box-shadow .2s',
    }}>
      {/* ── Card header ── */}
      <div
        onClick={() => onExpand(txn.id)}
        style={{
          padding: '14px 20px', display: 'flex', gap: 0,
          alignItems: 'center', cursor: 'pointer', flexWrap: 'nowrap',
          background: isOpen ? '#f8faff' : '#fff',
          transition: 'background .15s',
        }}
      >
        {/* Col 1: Type badge — fixed 148px */}
        <div style={{ flexShrink: 0, width: 148 }}>
          <TypeBadge type={txn.type} />
        </div>

        {/* Col 2: File name + vendor — flex fill, truncates */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {txn.filename || `TXN-${txn.id}`}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.vendor || '—'}&nbsp;·&nbsp;#{d.invoice_number || '—'}
          </div>
        </div>

        {/* Col 3: Amount — fixed 110px right-aligned */}
        <div style={{ flexShrink: 0, width: 110, textAlign: 'right', paddingRight: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#059669', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            ₹{Number(d.total_amount || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            Tax ₹{Number(d.tax_amount || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Col 4: Status — fixed 100px center */}
        <div style={{ flexShrink: 0, width: 100, display: 'flex', justifyContent: 'center' }}>
          <Badge status={txn.status} />
        </div>

        {/* Col 5: Company — fixed 148px, truncate if long */}
        <div style={{ flexShrink: 0, width: 148, paddingRight: 12 }}>
          <span style={{
            display: 'block', background: '#eff6ff', color: '#2563eb', borderRadius: 99,
            padding: '3px 10px', fontSize: 11, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            {companyName}
          </span>
        </div>

        {/* Col 6: Review button — fixed */}
        <div style={{ flexShrink: 0 }}>
          <button style={{
            padding: '7px 18px', borderRadius: 8,
            background: isOpen ? '#e0e7ff' : 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)',
            color: isOpen ? '#3730a3' : '#fff',
            border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            {isOpen ? 'Close' : 'Review'}
          </button>
        </div>
      </div>

      {/* ── Card body ── */}
      {isOpen && (
        <div style={{
          borderTop: '1px solid #f1f5f9', padding: 20,
          animation: 'ac-slide-down .3s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Vendor</label>
              <input
                style={INPUT_STYLE}
                value={es.vendor ?? d.vendor ?? ''}
                onChange={e => onEditChange(txn.id, 'vendor', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Invoice Number</label>
              <input
                style={INPUT_STYLE}
                value={es.invoice_number ?? d.invoice_number ?? ''}
                onChange={e => onEditChange(txn.id, 'invoice_number', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Invoice Date</label>
              <input
                type="date"
                style={INPUT_STYLE}
                value={es.invoice_date ?? d.invoice_date ?? ''}
                onChange={e => onEditChange(txn.id, 'invoice_date', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Total Amount (₹)</label>
              <input
                type="number"
                style={INPUT_STYLE}
                value={es.total_amount ?? d.total_amount ?? ''}
                onChange={e => onEditChange(txn.id, 'total_amount', e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Tax Amount (₹)</label>
              <input
                type="number"
                style={INPUT_STYLE}
                value={es.tax_amount ?? d.tax_amount ?? ''}
                onChange={e => onEditChange(txn.id, 'tax_amount', e.target.value)}
              />
            </div>

          </div>

          {/* Payment head assignment */}
          <div style={{
            background: '#f8faff', borderRadius: 12, padding: 16, marginBottom: 16,
            border: '1px solid #e0e7ff',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3730a3', marginBottom: 12 }}>Assign Payment Head</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Payment Head</label>
                <select
                  style={SELECT_STYLE}
                  value={es.payment_head_id ?? txn.payment_head_id ?? ''}
                  onChange={e => {
                    onEditChange(txn.id, 'payment_head_id', e.target.value);
                    onEditChange(txn.id, 'sub_head_id', '');
                  }}
                >
                  <option value="">— Select Head —</option>
                  {heads.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Sub-Head</label>
                <select
                  style={SELECT_STYLE}
                  value={es.sub_head_id ?? txn.sub_head_id ?? ''}
                  onChange={e => onEditChange(txn.id, 'sub_head_id', e.target.value)}
                  disabled={subHeads.length === 0}
                >
                  <option value="">— Select Sub-Head —</option>
                  {subHeads.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Review Notes</label>
              <textarea
                rows={2}
                style={{ ...INPUT_STYLE, resize: 'vertical' }}
                placeholder="Optional notes for this review..."
                value={es.review_notes ?? txn.review_notes ?? ''}
                onChange={e => onEditChange(txn.id, 'review_notes', e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => onSave(txn)}
              disabled={saving === txn.id}
              style={{
                padding: '9px 20px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: saving === txn.id ? 'not-allowed' : 'pointer',
                opacity: saving === txn.id ? .7 : 1,
              }}
            >
              {saving === txn.id ? 'Saving…' : '💾 Save & Mark Under Review'}
            </button>

            <button
              onClick={() => onApprove(txn)}
              disabled={saving === txn.id}
              style={{
                padding: '9px 20px', borderRadius: 9, border: 'none',
                background: '#16a34a', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ✅ Approve
            </button>

            <button
              onClick={() => onRejectRequest(txn)}
              disabled={saving === txn.id}
              style={{
                padding: '9px 20px', borderRadius: 9, border: 'none',
                background: '#dc2626', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ❌ Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccountantDashboard({ session }) {
  const { firm_id, firm_name, display_name, username } = session;

  // ── Core data ──
  const [transactions, setTransactions] = useState([]);
  const [companies,    setCompanies]    = useState([]);
  const [paymentHeads, setPaymentHeads] = useState({}); // { [company_id]: [...] }
  const [auditLog,     setAuditLog]     = useState([]);

  // ── UI state ──
  const [activeTab,   setActiveTab]   = useState('queue');
  const [expandedId,  setExpandedId]  = useState(null);
  const [editState,   setEditState]   = useState({});  // { [txn.id]: { vendor, invoice_number, ... } }
  const [saving,      setSaving]      = useState(null);
  const [toast,       setToast]       = useState(null);
  const [rejectTxn,   setRejectTxn]   = useState(null);
  const [loading,     setLoading]     = useState(false);

  // ── Filters ──
  const [queueCompanyF,  setQueueCompanyF]  = useState('');
  const [allCompanyF,    setAllCompanyF]    = useState('');
  const [allStatusF,     setAllStatusF]     = useState('');
  const [allTypeF,       setAllTypeF]       = useState('');
  const [allSearchQ,     setAllSearchQ]     = useState('');

  // ── Upload form ──
  const [uploadCompany,  setUploadCompany]  = useState('');
  const [uploadName,     setUploadName]     = useState('');
  const [uploadType,     setUploadType]     = useState('MIS');
  const [uploadFile,     setUploadFile]     = useState(null);
  const [uploading,      setUploading]      = useState(false);

  // ── Exports ──
  const [expCompany,   setExpCompany]   = useState('');
  const [expFormat,    setExpFormat]    = useState('zoho');
  const [expStatus,    setExpStatus]    = useState('approved');
  const [expDateFrom,  setExpDateFrom]  = useState('');
  const [expDateTo,    setExpDateTo]    = useState('');
  const [expMsg,       setExpMsg]       = useState(null);

  const [reviewPage,  setReviewPage]  = useState(0);
  const [allTxPage,   setAllTxPage]   = useState(0);
  const [auditPage,   setAuditPage]   = useState(0);

  // ── Helpers ──
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ── Fetch transactions ──
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?firm_id=${firm_id}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : data.transactions || []);
      }
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  }, [firm_id, showToast]);

  // ── Fetch companies ──
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`/api/firm/companies?firm_id=${firm_id}`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : data.companies || []);
      }
    } catch {
      showToast('Failed to load companies', 'error');
    }
  }, [firm_id, showToast]);

  // ── Fetch audit log ──
  const fetchAuditLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit?firm_id=${firm_id}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLog(Array.isArray(data) ? data : data.logs || []);
      }
    } catch { /* silent */ }
  }, [firm_id]);

  // ── Fetch payment heads for a company (lazy) ──
  const fetchPaymentHeads = useCallback(async (companyId) => {
    if (!companyId || paymentHeads[companyId]) return;
    try {
      const res = await fetch(`/api/firm/companies/${companyId}/payment-heads`);
      if (res.ok) {
        const data = await res.json();
        const heads = Array.isArray(data) ? data : data.payment_heads || [];
        setPaymentHeads(prev => ({ ...prev, [companyId]: heads }));
      }
    } catch { /* silent */ }
  }, [paymentHeads]);

  // ── Init ──
  useEffect(() => {
    fetchTransactions();
    fetchCompanies();
  }, [fetchTransactions, fetchCompanies]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLog();
  }, [activeTab, fetchAuditLog]);


  // ── Expand / collapse review card ──
  const handleExpand = useCallback((id) => {
    setExpandedId(prev => {
      const next = prev === id ? null : id;
      if (next !== null) {
        const txn = transactions.find(t => t.id === id);
        if (txn?.company_id) fetchPaymentHeads(txn.company_id);
      }
      return next;
    });
  }, [transactions, fetchPaymentHeads]);

  // ── Edit state helpers ──
  const handleEditChange = useCallback((txnId, field, value) => {
    setEditState(prev => ({
      ...prev,
      [txnId]: { ...prev[txnId], [field]: value },
    }));
  }, []);

  // ── Save & Mark Reviewed ──
  const handleSave = useCallback(async (txn) => {
    setSaving(txn.id);
    const es = editState[txn.id] || {};
    const body = {
      extracted_data: {
        ...(txn.extracted_data || {}),
        ...(es.vendor         !== undefined ? { vendor:         es.vendor         } : {}),
        ...(es.invoice_number !== undefined ? { invoice_number: es.invoice_number } : {}),
        ...(es.invoice_date   !== undefined ? { invoice_date:   es.invoice_date   } : {}),
        ...(es.total_amount   !== undefined ? { total_amount:   es.total_amount   } : {}),
        ...(es.tax_amount     !== undefined ? { tax_amount:     es.tax_amount     } : {}),
      },
      ...(es.payment_head_id ? { payment_head_id: es.payment_head_id } : {}),
      ...(es.sub_head_id     ? { sub_head_id:     es.sub_head_id     } : {}),
      ...(es.review_notes    ? { review_notes:    es.review_notes    } : {}),
      performed_by:   display_name || username,
      performed_role: 'accountant',
    };
    try {
      const res = await fetch(`/api/transactions/${txn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast('Saved and marked as under review');
        setExpandedId(null);
        await fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Save failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  }, [editState, display_name, username, fetchTransactions, showToast]);

  // ── Approve ──
  const handleApprove = useCallback(async (txn) => {
    setSaving(txn.id);
    try {
      const res = await fetch(`/api/transactions/${txn.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: display_name || username, notes: '' }),
      });
      if (res.ok) {
        showToast('Transaction approved');
        setExpandedId(null);
        await fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Approve failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  }, [display_name, username, fetchTransactions, showToast]);

  // ── Reject ──
  const handleRejectRequest = useCallback((txn) => {
    setRejectTxn(txn);
  }, []);

  const handleRejectConfirm = useCallback(async (reason) => {
    if (!rejectTxn) return;
    setSaving(rejectTxn.id);
    try {
      const res = await fetch(`/api/transactions/${rejectTxn.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performed_by: display_name || username, reason }),
      });
      if (res.ok) {
        showToast('Transaction rejected');
        setExpandedId(null);
        setRejectTxn(null);
        await fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Reject failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  }, [rejectTxn, display_name, username, fetchTransactions, showToast]);

  // ── Status change (revert / re-approve) ──
  const handleStatusChange = useCallback(async (txnId, newStatus) => {
    setSaving(txnId);
    try {
      const res = await fetch(`/api/transactions/${txnId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, performed_by: display_name || username, performed_role: 'accountant' }),
      });
      if (res.ok) {
        const label = { reviewed: 'Marked as Under Review', approved: 'Approved', rejected: 'Rejected', extracted: 'Re-opened' }[newStatus] || newStatus;
        showToast(label);
        await fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Status change failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  }, [display_name, username, showToast, fetchTransactions]);

  // ── Upload ──
  const handleUpload = useCallback(async () => {
    if (!uploadCompany || !uploadFile) {
      showToast('Select a company and file', 'warning');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('company_id',  uploadCompany);
      fd.append('firm_id',     firm_id);
      fd.append('report_name', uploadName || uploadFile.name);
      fd.append('report_type', uploadType);
      fd.append('uploaded_by', display_name || username);
      fd.append('report',      uploadFile);
      const res = await fetch('/api/reports/upload', { method: 'POST', body: fd });
      if (res.ok) {
        showToast('Report uploaded successfully');
        setUploadFile(null);
        setUploadName('');
        setUploadCompany('');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Upload failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setUploading(false);
    }
  }, [uploadCompany, uploadFile, uploadName, uploadType, firm_id, display_name, username, showToast]);

  // ── Derived data ──
  const pendingQueue = transactions.filter(t => ['extracted', 'uploaded'].includes(t.status));
  const filteredQueue = queueCompanyF
    ? pendingQueue.filter(t => String(t.company_id) === String(queueCompanyF))
    : pendingQueue;

  const AC_PAGE_SIZE = 20;
  const safeReviewPage = Math.min(reviewPage, Math.max(0, Math.ceil(filteredQueue.length / AC_PAGE_SIZE) - 1));
  const pagedQueue = filteredQueue.slice(safeReviewPage * AC_PAGE_SIZE, (safeReviewPage + 1) * AC_PAGE_SIZE);

  const filteredAll = transactions.filter(t => {
    if (allCompanyF && String(t.company_id) !== String(allCompanyF)) return false;
    if (allStatusF  && t.status !== allStatusF) return false;
    if (allTypeF    && (t.transaction_type || t.type) !== allTypeF) return false;
    const q = allSearchQ.toLowerCase();
    if (q && !(t.extracted_data?.vendor||'').toLowerCase().includes(q) && !(t.extracted_data?.invoice_number||'').toLowerCase().includes(q) && !(t.file_name||t.filename||'').toLowerCase().includes(q)) return false;
    return true;
  });

  const safeAllTxPage = Math.min(allTxPage, Math.max(0, Math.ceil(filteredAll.length / AC_PAGE_SIZE) - 1));
  const pagedAll = filteredAll.slice(safeAllTxPage * AC_PAGE_SIZE, (safeAllTxPage + 1) * AC_PAGE_SIZE);

  const safeAuditPage = Math.min(auditPage, Math.max(0, Math.ceil(auditLog.length / AC_PAGE_SIZE) - 1));
  const pagedAudit = auditLog.slice(safeAuditPage * AC_PAGE_SIZE, (safeAuditPage + 1) * AC_PAGE_SIZE);

  const kpiTotal    = transactions.length;
  const kpiPending  = transactions.filter(t => ['extracted', 'uploaded'].includes(t.status)).length;
  const kpiReviewed = transactions.filter(t => t.status === 'reviewed').length;
  const kpiApproved = transactions.filter(t => t.status === 'approved').length;
  const kpiRejected = transactions.filter(t => t.status === 'rejected').length;
  const kpiValue    = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + parseFloat(t.extracted_data?.total_amount || 0), 0);
  const kpiValueFmt = '₹' + kpiValue.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // ── Render ──
  return (
    <div style={{ fontFamily: 'Inter,system-ui,sans-serif', color: '#0f172a' }}>
      <style>{ACCT_STYLES}</style>

      {/* ── Banner ── */}
      <div style={{
        background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#1e40af 0%,#2563eb 55%,#4f46e5 100%)',
        borderRadius: 18, padding: '24px 28px', marginBottom: 20,
        position: 'relative', overflow: 'hidden', color: '#fff',
        boxShadow: '0 4px 24px rgba(37,99,235,.3)',
        animation: 'ac-banner 0.8s ease both',
      }}>
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 240, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />
        {/* dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .04, pointerEvents: 'none' }}>
          <defs><pattern id="acdots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#acdots)" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -.4, marginBottom: 4 }}>
              {firm_name || 'Accountant Dashboard'}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{display_name || username}</p>
          </div>
          <button
            onClick={() => { fetchTransactions(); fetchCompanies(); showToast('Refreshed'); }}
            style={{
              padding: '9px 20px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.3)',
              background: 'rgba(255,255,255,.15)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 22 }}>
        <KpiCard icon="📄" label="Total"          value={kpiTotal}    bg="linear-gradient(135deg,#4f46e5,#6366f1)" delay=".1s" />
        <KpiCard icon="⏳" label="Pending Review"  value={kpiPending}  bg="linear-gradient(135deg,#d97706,#f59e0b)" delay=".2s" />
        <KpiCard icon="🔍" label="Under Review"    value={kpiReviewed} bg="linear-gradient(135deg,#1d4ed8,#3b82f6)" delay=".3s" />
        <KpiCard icon="✅" label="Approved"         value={kpiApproved} bg="linear-gradient(135deg,#059669,#10b981)" delay=".4s" />
        <KpiCard icon="❌" label="Rejected"         value={kpiRejected} bg="linear-gradient(135deg,#b91c1c,#dc2626)" delay=".5s" />
        <KpiCard icon="💰" label="Approved Value"   value={kpiValueFmt} bg="linear-gradient(135deg,#4338ca,#6366f1)" delay=".6s" />
      </div>

      {/* ── Section nav ── */}
      <SectionNav active={activeTab} onChange={setActiveTab} />

      {/* ════════════════════════════════ REVIEW QUEUE ════════════════════════ */}
      {activeTab === 'queue' && (
        <div style={{ animation: 'ac-fadein .3s ease' }}>
          {/* Filter bar */}
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Filter by Company:</span>
            <select
              style={{ ...SELECT_STYLE, width: 220 }}
              value={queueCompanyF}
              onChange={e => setQueueCompanyF(e.target.value)}
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
              {filteredQueue.length} transaction{filteredQueue.length !== 1 ? 's' : ''} pending
            </span>
          </div>

          {/* Empty state */}
          {filteredQueue.length === 0 && !loading && (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: '#fff', borderRadius: 16, border: '1.5px dashed #e2e8f0',
              animation: 'ac-fadein .4s ease',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No Pending Reviews</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>All transactions have been processed. Great work!</div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Loading transactions…</div>
          )}

          {/* Review cards */}
          {pagedQueue.map(txn => (
            <ReviewCard
              key={txn.id}
              txn={txn}
              companies={companies}
              paymentHeads={paymentHeads}
              expandedId={expandedId}
              editState={editState}
              onExpand={handleExpand}
              onEditChange={handleEditChange}
              onSave={handleSave}
              onApprove={handleApprove}
              onRejectRequest={handleRejectRequest}
              saving={saving}
              firmId={firm_id}
              session={session}
            />
          ))}
          <Pagination page={safeReviewPage} total={filteredQueue.length} pageSize={AC_PAGE_SIZE} onPageChange={setReviewPage} />
        </div>
      )}

      {/* ════════════════════════════════ ALL TRANSACTIONS ════════════════════ */}
      {activeTab === 'all' && (
        <div style={{ animation: 'ac-fadein .3s ease' }}>
          {/* Filters */}
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 150 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
              <input type="text" value={allSearchQ} onChange={e => setAllSearchQ(e.target.value)} placeholder="Search vendor, invoice#…"
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#334155', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </div>
            <select style={{ ...SELECT_STYLE, width: 180 }} value={allCompanyF} onChange={e => setAllCompanyF(e.target.value)}>
              <option value="">All Companies</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select style={{ ...SELECT_STYLE, width: 150 }} value={allStatusF} onChange={e => setAllStatusF(e.target.value)}>
              <option value="">All Statuses</option>
              {['uploaded','extracted','reviewed','approved','rejected','processing'].map(s => (
                <option key={s} value={s}>{s === 'reviewed' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select style={{ ...SELECT_STYLE, width: 140 }} value={allTypeF} onChange={e => setAllTypeF(e.target.value)}>
              <option value="">All Types</option>
              {['invoice','bill','receipt','mis'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            {(allCompanyF || allStatusF || allTypeF || allSearchQ) && (
              <button
                onClick={() => { setAllCompanyF(''); setAllStatusF(''); setAllTypeF(''); setAllSearchQ(''); }}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}
              >
                ✕ Clear
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
              {filteredAll.length} result{filteredAll.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
            {filteredAll.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                No transactions match your filters.
              </div>
            ) : (
              <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse', fontSize: 13 }}>
                  <colgroup>
                    <col style={{ width: 90  }} />{/* Type */}
                    <col style={{ width: 120 }} />{/* Company */}
                    <col style={{ width: 130 }} />{/* Vendor */}
                    <col style={{ width: 110 }} />{/* Invoice # */}
                    <col style={{ width: 100 }} />{/* Invoice Date */}
                    <col style={{ width: 100 }} />{/* Amount */}
                    <col style={{ width: 120 }} />{/* Payment Head */}
                    <col style={{ width: 100 }} />{/* Sub-Head */}
                    <col style={{ width: 120 }} />{/* Status */}
                    <col style={{ width: 90  }} />{/* Uploaded */}
                  </colgroup>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#f8faff,#f0f4ff)', borderBottom: '2px solid #e0e7ff' }}>
                      {[
                        { h: 'Type',         align: 'left'   },
                        { h: 'Company',      align: 'left'   },
                        { h: 'Vendor',       align: 'left'   },
                        { h: 'Invoice #',    align: 'left'   },
                        { h: 'Invoice Date', align: 'left'   },
                        { h: 'Amount ₹',     align: 'right'  },
                        { h: 'Payment Head', align: 'left'   },
                        { h: 'Sub-Head',     align: 'left'   },
                        { h: 'Status',       align: 'center' },
                        { h: 'Uploaded',     align: 'right'  },
                      ].map(({ h, align }) => (
                        <th key={h} style={{ padding: '10px 10px', textAlign: align, fontWeight: 700, fontSize: 11, color: '#3730a3', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAll.map((txn, idx) => {
                      const d = txn.extracted_data || {};
                      const company = companies.find(c => c.id === txn.company_id);
                      const heads = paymentHeads[txn.company_id] || [];
                      const head = heads.find(h => h.id === txn.payment_head_id);
                      const subHead = head?.sub_heads?.find(s => s.id === txn.sub_head_id);
                      const headName = txn.payment_head_name || head?.name;
                      const subName  = txn.sub_head_name    || subHead?.name;
                      return (
                        <tr key={txn.id} style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#fff' : '#fafbff',
                          animation: `ac-row-in 0.4s ease ${Math.min(idx * 0.04, 0.6)}s both`,
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbff'; }}
                        >
                          {/* Type */}
                          <td style={{ padding: '9px 10px', textAlign: 'left' }}>
                            <TypeBadge type={txn.type} />
                          </td>
                          {/* Company */}
                          <td style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {company?.name || '—'}
                          </td>
                          {/* Vendor */}
                          <td style={{ padding: '9px 10px', textAlign: 'left', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.vendor || '—'}
                          </td>
                          {/* Invoice # */}
                          <td style={{ padding: '9px 10px', textAlign: 'left', fontFamily: 'monospace', fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.invoice_number || '—'}
                          </td>
                          {/* Invoice Date */}
                          <td style={{ padding: '9px 10px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                            {d.invoice_date || '—'}
                          </td>
                          {/* Amount */}
                          <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap' }}>
                            {d.total_amount ? `₹ ${Number(d.total_amount).toLocaleString('en-IN')}` : '—'}
                          </td>
                          {/* Payment Head */}
                          <td style={{ padding: '9px 10px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {headName
                              ? <span style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{headName}</span>
                              : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                          {/* Sub-Head */}
                          <td style={{ padding: '9px 10px', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {subName
                              ? <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{subName}</span>
                              : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                          {/* Status + action buttons for reviewed/approved only */}
                          <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                              <Badge status={txn.status} />
                              {txn.status === 'reviewed' && (
                                <button
                                  onClick={() => handleStatusChange(txn.id, 'approved')}
                                  disabled={saving === txn.id}
                                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {txn.status === 'approved' && (
                                <button
                                  onClick={() => handleStatusChange(txn.id, 'reviewed')}
                                  disabled={saving === txn.id}
                                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
                                >
                                  ↩ Revert
                                </button>
                              )}
                            </div>
                          </td>
                          {/* Uploaded date */}
                          <td style={{ padding: '9px 10px', textAlign: 'right', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {txn.uploaded_at || txn.created_at
                              ? new Date(txn.uploaded_at || txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={safeAllTxPage} total={filteredAll.length} pageSize={AC_PAGE_SIZE} onPageChange={setAllTxPage} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════ UPLOAD MIS ══════════════════════════ */}
      {activeTab === 'upload' && (
        <div style={{ animation: 'ac-fadein .3s ease' }}>
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
            padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,.07)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>📊 Upload MIS Report</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 22 }}>Upload financial reports for any company under your firm.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'stretch' }}>

              {/* Left column: form fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Company <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select style={SELECT_STYLE} value={uploadCompany} onChange={e => setUploadCompany(e.target.value)}>
                    <option value="">— Select Company —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Report Name</label>
                  <input style={INPUT_STYLE} placeholder="e.g. April 2025 MIS" value={uploadName} onChange={e => setUploadName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Report Type</label>
                  <select style={SELECT_STYLE} value={uploadType} onChange={e => setUploadType(e.target.value)}>
                    {['MIS','Balance Sheet','P&L','Tax Return'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadCompany || !uploadFile}
                  style={{
                    marginTop: 'auto', padding: '11px 0', borderRadius: 10, border: 'none',
                    background: (uploading || !uploadCompany || !uploadFile)
                      ? '#e2e8f0'
                      : 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)',
                    color: (uploading || !uploadCompany || !uploadFile) ? '#94a3b8' : '#fff',
                    fontSize: 14, fontWeight: 700,
                    cursor: (uploading || !uploadCompany || !uploadFile) ? 'not-allowed' : 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {uploading ? 'Uploading…' : '📤 Upload Report'}
                </button>
              </div>

              {/* Right column: file drop zone */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  File <span style={{ color: '#dc2626' }}>*</span>
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(PDF recommended)</span>
                </label>
                <div style={{
                  flex: 1, border: '2px dashed #e2e8f0', borderRadius: 10, padding: '28px 16px',
                  textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s',
                  background: uploadFile ? '#f0fdf4' : '#fafbff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563eb'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    const f = e.dataTransfer.files[0];
                    if (f) setUploadFile(f);
                  }}
                >
                  {uploadFile ? (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>{uploadFile.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{(uploadFile.size / 1024).toFixed(1)} KB</div>
                      <button onClick={() => setUploadFile(null)} style={{ marginTop: 8, fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>Drop file here or <span style={{ color: '#2563eb', fontWeight: 600 }}>click to browse</span></div>
                      <input type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) setUploadFile(e.target.files[0]); }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════ EXPORTS ════════════════════════════ */}
      {activeTab === 'exports' && (() => {
        const FORMATS = [
          { key: 'zoho',        label: 'Zoho Books',  icon: '📋', desc: 'CSV (Bills import)',   color: '#2563eb', bg: '#eff6ff' },
          { key: 'quickbooks',  label: 'QuickBooks',  icon: '💼', desc: 'IIF format',           color: '#ea580c', bg: '#fff7ed' },
          { key: 'tally',       label: 'Tally',       icon: '📊', desc: 'XML (Vouchers import)',color: '#16a34a', bg: '#f0fdf4' },
        ];

        const handleExport = () => {
          let data = transactions.filter(t => {
            if (expCompany && t.company_id !== expCompany) return false;
            if (expStatus  && t.status    !== expStatus)   return false;
            const d = t.extracted_data;
            if (!d) return false;
            if (expDateFrom && d.invoice_date && d.invoice_date < expDateFrom) return false;
            if (expDateTo   && d.invoice_date && d.invoice_date > expDateTo)   return false;
            return true;
          });

          if (!data.length) {
            setExpMsg({ type: 'error', text: 'No transactions match the selected filters.' });
            setTimeout(() => setExpMsg(null), 4000);
            return;
          }

          try {
            if (expFormat === 'zoho')       exportToZohoCSV(data);
            if (expFormat === 'quickbooks') exportToQuickBooks(data);
            if (expFormat === 'tally')      exportToTallyBulk(data);
            setExpMsg({ type: 'ok', text: `✅ Exported ${data.length} transaction${data.length > 1 ? 's' : ''} successfully.` });
            setTimeout(() => setExpMsg(null), 4000);
          } catch (e) {
            setExpMsg({ type: 'error', text: `Export failed: ${e.message}` });
            setTimeout(() => setExpMsg(null), 4000);
          }
        };

        const selStyle = { height: 38, padding: '0 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', background: '#fafafa', outline: 'none', width: '100%', fontFamily: 'inherit' };
        const labelStyle = { fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 };

        return (
          <div style={{ animation: 'ac-fadein .3s ease' }}>
            {/* Header */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>📤 Export to Accounting Software</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Export approved transactions directly into Zoho Books, QuickBooks, or Tally.</div>
            </div>

            {/* Format cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
              {FORMATS.map(f => (
                <div
                  key={f.key}
                  onClick={() => setExpFormat(f.key)}
                  style={{
                    background: expFormat === f.key ? f.bg : '#fff',
                    border: `2px solid ${expFormat === f.key ? f.color : '#e2e8f0'}`,
                    borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
                    transition: 'all .15s', boxShadow: expFormat === f.key ? `0 0 0 3px ${f.color}22` : 'none',
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: expFormat === f.key ? f.color : '#0f172a' }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.desc}</div>
                  {expFormat === f.key && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: f.color }}>✓ Selected</div>}
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Filter Transactions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Company</label>
                  <select value={expCompany} onChange={e => setExpCompany(e.target.value)} style={selStyle}>
                    <option value="">All Companies</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={expStatus} onChange={e => setExpStatus(e.target.value)} style={selStyle}>
                    <option value="approved">Approved only</option>
                    <option value="reviewed">Under Review</option>
                    <option value="">All statuses</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date From</label>
                  <input type="date" value={expDateFrom} onChange={e => setExpDateFrom(e.target.value)} style={selStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Date To</label>
                  <input type="date" value={expDateTo} onChange={e => setExpDateTo(e.target.value)} style={selStyle} />
                </div>
              </div>

              {/* Preview count */}
              {(() => {
                const count = transactions.filter(t => {
                  if (expCompany && t.company_id !== expCompany) return false;
                  if (expStatus  && t.status    !== expStatus)   return false;
                  const d = t.extracted_data;
                  if (!d) return false;
                  if (expDateFrom && d.invoice_date && d.invoice_date < expDateFrom) return false;
                  if (expDateTo   && d.invoice_date && d.invoice_date > expDateTo)   return false;
                  return true;
                }).length;
                return (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: count > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, fontSize: 13, color: count > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {count > 0 ? `✅ ${count} transaction${count > 1 ? 's' : ''} ready to export` : '⚠️ No transactions match current filters'}
                  </div>
                );
              })()}
            </div>

            {/* Alert */}
            {expMsg && (
              <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: expMsg.type === 'ok' ? '#f0fdf4' : '#fef2f2', color: expMsg.type === 'ok' ? '#16a34a' : '#dc2626', border: `1px solid ${expMsg.type === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
                {expMsg.text}
              </div>
            )}

            {/* Format info + export button */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
              <div>
                {expFormat === 'zoho' && <>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#2563eb', marginBottom: 4 }}>Zoho Books — CSV Import</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>In Zoho Books: <strong>Purchases → Bills → Import Bills</strong> → upload the CSV file.</div>
                </>}
                {expFormat === 'quickbooks' && <>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#ea580c', marginBottom: 4 }}>QuickBooks — IIF Import</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>In QuickBooks Desktop: <strong>File → Utilities → Import → IIF Files</strong> → select the downloaded file.</div>
                </>}
                {expFormat === 'tally' && <>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', marginBottom: 4 }}>Tally ERP / Prime — XML Import</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>In Tally: <strong>Gateway → Import Data → Vouchers</strong> → browse and select the XML file.</div>
                </>}
              </div>
              <button
                onClick={handleExport}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none', flexShrink: 0,
                  background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)',
                  color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,.25)',
                }}
              >
                ⬇ Download {FORMATS.find(f => f.key === expFormat)?.label} File
              </button>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════ AUDIT LOG ═══════════════════════════ */}
      {activeTab === 'audit' && (
        <div style={{ animation: 'ac-fadein .3s ease' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg,#f8faff,#f0f4ff)',
              borderBottom: '2px solid #e0e7ff', padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e1b4b' }}>
                📋 Audit Log
                <span style={{ marginLeft: 8, background: '#6366f1', color: '#fff', borderRadius: 99, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>
                  {auditLog.length}
                </span>
              </span>
              <button
                onClick={fetchAuditLog}
                style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                🔄 Reload
              </button>
            </div>

            {auditLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                No audit entries found.
              </div>
            ) : (
              <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#f8faff,#f0f4ff)', borderBottom: '2px solid #e0e7ff' }}>
                      {['Action','Company','Transaction ID','Performed By','Role','Date'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#3730a3', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAudit.map((entry, idx) => (
                      <tr key={entry.id || idx} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#fff' : '#fafbff',
                        animation: `ac-row-in 0.4s ease ${Math.min(idx * 0.03, 0.5)}s both`,
                      }}>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                            background: entry.action === 'approved' ? '#dcfce7' : entry.action === 'rejected' ? '#fef2f2' : '#eff6ff',
                            color:      entry.action === 'approved' ? '#15803d' : entry.action === 'rejected' ? '#dc2626' : '#2563eb',
                            textTransform: 'capitalize',
                          }}>
                            {entry.action === 'reviewed' ? 'Under Review' : entry.action || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {entry.company_name || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                          {entry.transaction_id || entry.invoice_id || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', fontWeight: 500 }}>{entry.performed_by || entry.user || '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#7c3aed', textTransform: 'capitalize' }}>
                          {entry.performed_role || entry.role || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {(entry.performed_at || entry.created_at)
                            ? new Date(entry.performed_at || entry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={safeAuditPage} total={auditLog.length} pageSize={AC_PAGE_SIZE} onPageChange={setAuditPage} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Reject dialog ── */}
      {rejectTxn && (
        <RejectDialog
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTxn(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
