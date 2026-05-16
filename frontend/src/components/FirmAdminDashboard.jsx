import { useState, useEffect, useCallback } from 'react';
import Pagination from './Pagination';

/* ── Keyframe styles ─────────────────────────────────────────────────────── */
const FIRM_STYLES = `
@keyframes fd-banner  { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
@keyframes fd-card-up { from { opacity:0; transform:translateY(22px) scale(.97); filter:blur(3px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }
@keyframes fd-fadein  { from { opacity:0; } to { opacity:1; } }
@keyframes fd-row-in  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(n) {
  return (parseFloat(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
function Badge({ label, color }) {
  const colors = {
    green:  { bg: '#dcfce7', text: '#16a34a' },
    yellow: { bg: '#fef3c7', text: '#d97706' },
    red:    { bg: '#fee2e2', text: '#dc2626' },
    blue:   { bg: '#dbeafe', text: '#2563eb' },
    gray:   { bg: '#f1f5f9', text: '#64748b' },
    purple: { bg: '#ede9fe', text: '#7c3aed' },
    amber:  { bg: '#fef3c7', text: '#d97706' },
    orange: { bg: '#ffedd5', text: '#ea580c' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}

/* ── Modal wrapper ────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children, wide }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fd-fadein .2s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: wide ? 640 : 500, boxShadow: '0 20px 60px rgba(0,0,0,.25)', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Form field ───────────────────────────────────────────────────────────── */
const inputStyle = {
  width: '100%', fontSize: 13, borderRadius: 9, border: '1.5px solid #e2e8f0',
  padding: '9px 12px', outline: 'none', background: '#fafafa', color: '#0f172a',
  boxSizing: 'border-box', transition: 'border-color .15s', fontFamily: 'inherit',
};
function FormField({ label, value, onChange, type = 'text', placeholder, as, children, readOnly }) {
  const hasAsterisk = typeof label === 'string' && label.trimEnd().endsWith('*');
  const cleanLabel  = hasAsterisk ? label.replace(/\s*\*\s*$/, '') : label;
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
        {cleanLabel}{hasAsterisk && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {as === 'select'
        ? (
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ ...inputStyle }}
            onFocus={e => (e.target.style.borderColor = '#2563eb')}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          >
            {children}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => !readOnly && onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{ ...inputStyle, background: readOnly ? '#f1f5f9' : '#fafafa', cursor: readOnly ? 'not-allowed' : 'text' }}
            onFocus={e => { if (!readOnly) e.target.style.borderColor = '#2563eb'; }}
            onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
          />
        )
      }
    </div>
  );
}

/* ── Confirm dialog ───────────────────────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm" onClose={onCancel}>
      <p style={{ fontSize: 14, color: '#475569', marginBottom: 24 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon, gradient, delay = '0s' }) {
  return (
    <div style={{
      background: `linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),${gradient}`, borderRadius: 16, padding: '14px 16px',
      color: '#fff', animation: `fd-card-up .9s cubic-bezier(0.34,1.56,0.64,1) ${delay} both`,
      boxShadow: '0 4px 18px rgba(0,0,0,.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.75 }}>{label}</span>
        <span style={{ fontSize: 20, opacity: 0.85 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{value}</div>
    </div>
  );
}

/* ── Primary button ───────────────────────────────────────────────────────── */
function PrimaryBtn({ children, onClick, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#cbd5e1' : 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)',
        color: '#fff', border: 'none', borderRadius: 9,
        padding: small ? '7px 14px' : '10px 20px',
        fontSize: small ? 12 : 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'opacity .2s',
      }}
    >
      {children}
    </button>
  );
}

/* ── Toggle ───────────────────────────────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, background: on ? '#2563eb' : '#cbd5e1',
        position: 'relative', cursor: 'pointer', transition: 'background .2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 18 : 3, width: 14, height: 14,
        borderRadius: 7, background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 4px rgba(0,0,0,.2)',
      }} />
    </div>
  );
}

/* ── Table wrapper ────────────────────────────────────────────────────────── */
function Table({ headers, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: .5, borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Tr({ children, delay }) {
  return (
    <tr style={{ animation: `fd-row-in .35s ease ${delay || '0s'} both`, borderBottom: '1px solid #f1f5f9' }}>
      {children}
    </tr>
  );
}

function Td({ children, muted }) {
  return (
    <td style={{ padding: '10px 12px', color: muted ? '#94a3b8' : '#0f172a', verticalAlign: 'middle' }}>
      {children}
    </td>
  );
}

/* ── Icon button ──────────────────────────────────────────────────────────── */
function IconBtn({ children, onClick, color, title }) {
  const colorMap = {
    blue: { bg: '#eff6ff', text: '#2563eb', hover: '#dbeafe' },
    red:  { bg: '#fef2f2', text: '#dc2626', hover: '#fee2e2' },
    green:{ bg: '#f0fdf4', text: '#16a34a', hover: '#dcfce7' },
    gray: { bg: '#f8fafc', text: '#64748b', hover: '#f1f5f9' },
    purple:{ bg: '#faf5ff', text: '#7c3aed', hover: '#ede9fe' },
  };
  const c = colorMap[color] || colorMap.gray;
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: c.bg, color: c.text, border: 'none', borderRadius: 7,
        padding: '5px 9px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
        transition: 'background .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = c.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = c.bg)}
    >
      {children}
    </button>
  );
}

/* ── Business type badge color ────────────────────────────────────────────── */
function bizColor(type) {
  const m = { Manufacturing: 'blue', IT: 'purple', Services: 'green', Trading: 'amber', Retail: 'orange' };
  return m[type] || 'gray';
}

/* ── Head type badge ──────────────────────────────────────────────────────── */
function headTypeBadge(type) {
  const m = { expense: 'red', revenue: 'green', asset: 'blue', liability: 'amber' };
  return <Badge label={type} color={m[type] || 'gray'} />;
}

/* ══════════════════════════════════════════════════════════════════════════
   PaymentHeadsPanel — shown when user clicks "Heads" on a company row
══════════════════════════════════════════════════════════════════════════ */
function PaymentHeadsPanel({ company, firmId, onClose, showToast }) {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addHeadModal, setAddHeadModal] = useState(false);
  const [addHeadForm, setAddHeadForm] = useState({ name: '', type: 'expense' });
  const [editHeadModal, setEditHeadModal] = useState(null); // head object
  const [editHeadForm, setEditHeadForm] = useState({ name: '', type: 'expense' });
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind:'head'|'sub', id, name }
  const [subInputs, setSubInputs] = useState({}); // headId -> string
  const [savingHead, setSavingHead] = useState(false);
  const [savingSub, setSavingSub] = useState(null);

  const fetchHeads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/firm/companies/${company.id}/payment-heads`);
      const d = await r.json();
      setHeads(Array.isArray(d) ? d : []);
    } catch { showToast('err', 'Failed to load payment heads'); }
    finally { setLoading(false); }
  }, [company.id]);

  useEffect(() => { fetchHeads(); }, [fetchHeads]);

  const addHead = async () => {
    if (!addHeadForm.name.trim()) { showToast('err', 'Head name required'); return; }
    setSavingHead(true);
    try {
      const res = await fetch(`/api/firm/companies/${company.id}/payment-heads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: firmId, name: addHeadForm.name.trim(), type: addHeadForm.type }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'Payment head added');
      setAddHeadModal(false);
      setAddHeadForm({ name: '', type: 'expense' });
      fetchHeads();
    } catch { showToast('err', 'Server error'); }
    finally { setSavingHead(false); }
  };

  const saveEditHead = async () => {
    if (!editHeadForm.name.trim()) { showToast('err', 'Head name required'); return; }
    setSavingHead(true);
    try {
      const res = await fetch(`/api/firm/payment-heads/${editHeadModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editHeadForm.name.trim(), type: editHeadForm.type }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'Payment head updated');
      setEditHeadModal(null);
      fetchHeads();
    } catch { showToast('err', 'Server error'); }
    finally { setSavingHead(false); }
  };

  const deleteHead = async (id) => {
    try {
      await fetch(`/api/firm/payment-heads/${id}`, { method: 'DELETE' });
      showToast('ok', 'Payment head deleted');
      setDeleteTarget(null);
      fetchHeads();
    } catch { showToast('err', 'Failed'); }
  };

  const addSubHead = async (headId) => {
    const name = (subInputs[headId] || '').trim();
    if (!name) { showToast('err', 'Sub-head name required'); return; }
    setSavingSub(headId);
    try {
      const res = await fetch(`/api/firm/payment-heads/${headId}/sub-heads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id, name }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'Sub-head added');
      setSubInputs(prev => ({ ...prev, [headId]: '' }));
      fetchHeads();
    } catch { showToast('err', 'Server error'); }
    finally { setSavingSub(null); }
  };

  const deleteSubHead = async (id) => {
    try {
      await fetch(`/api/firm/sub-heads/${id}`, { method: 'DELETE' });
      showToast('ok', 'Sub-head deleted');
      setDeleteTarget(null);
      fetchHeads();
    } catch { showToast('err', 'Failed'); }
  };

  return (
    <Modal title={`Payment Heads — ${company.name}`} onClose={onClose} wide>
      {/* Add head button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <PrimaryBtn small onClick={() => { setAddHeadForm({ name: '', type: 'expense' }); setAddHeadModal(true); }}>
          + Add Head
        </PrimaryBtn>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>Loading…</p>
      ) : heads.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No payment heads yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {heads.map(head => (
            <div key={head.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
              {/* Head header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', flex: 1 }}>{head.name}</span>
                {headTypeBadge(head.type)}
                <div style={{ display: 'flex', gap: 6 }}>
                  <IconBtn color="blue" title="Edit" onClick={() => { setEditHeadModal(head); setEditHeadForm({ name: head.name, type: head.type }); }}>
                    ✏️
                  </IconBtn>
                  <IconBtn color="red" title="Delete" onClick={() => setDeleteTarget({ kind: 'head', id: head.id, name: head.name })}>
                    🗑️
                  </IconBtn>
                </div>
              </div>

              {/* Sub-heads chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {(head.sub_heads || []).map(sh => (
                  <span key={sh.id} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 99, fontSize: 12, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {sh.name}
                    <button
                      onClick={() => setDeleteTarget({ kind: 'sub', id: sh.id, name: sh.name })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 11, lineHeight: 1, padding: 0 }}
                      title="Remove sub-head"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {(!head.sub_heads || head.sub_heads.length === 0) && (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>No sub-heads yet</span>
                )}
              </div>

              {/* Add sub-head inline */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={subInputs[head.id] || ''}
                  onChange={e => setSubInputs(prev => ({ ...prev, [head.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addSubHead(head.id)}
                  placeholder="New sub-head name…"
                  style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12 }}
                />
                <PrimaryBtn small onClick={() => addSubHead(head.id)} disabled={savingSub === head.id}>
                  {savingSub === head.id ? '…' : '+ Add'}
                </PrimaryBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Head Modal */}
      {addHeadModal && (
        <Modal title="Add Payment Head" onClose={() => setAddHeadModal(false)}>
          <FormField label="Head Name *" value={addHeadForm.name} onChange={v => setAddHeadForm(p => ({ ...p, name: v }))} placeholder="e.g. Office Supplies" />
          <FormField label="Type *" value={addHeadForm.type} onChange={v => setAddHeadForm(p => ({ ...p, type: v }))} as="select">
            <option value="expense">Expense</option>
            <option value="revenue">Revenue</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setAddHeadModal(false)} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <PrimaryBtn onClick={addHead} disabled={savingHead || !addHeadForm.name.trim()}>{savingHead ? 'Saving…' : 'Add Head'}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Edit Head Modal */}
      {editHeadModal && (
        <Modal title="Edit Payment Head" onClose={() => setEditHeadModal(null)}>
          <FormField label="Head Name *" value={editHeadForm.name} onChange={v => setEditHeadForm(p => ({ ...p, name: v }))} placeholder="Head name" />
          <FormField label="Type *" value={editHeadForm.type} onChange={v => setEditHeadForm(p => ({ ...p, type: v }))} as="select">
            <option value="expense">Expense</option>
            <option value="revenue">Revenue</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setEditHeadModal(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <PrimaryBtn onClick={saveEditHead} disabled={savingHead || !editHeadForm.name.trim()}>{savingHead ? 'Saving…' : 'Save Changes'}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete ${deleteTarget.kind === 'head' ? 'payment head' : 'sub-head'} "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={() => deleteTarget.kind === 'head' ? deleteHead(deleteTarget.id) : deleteSubHead(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FirmAdminDashboard
══════════════════════════════════════════════════════════════════════════ */
export default function FirmAdminDashboard({ session }) {
  /* ── State ── */
  const [activeTab, setActiveTab]         = useState('companies');
  const [stats, setStats]                 = useState(null);
  const [fcPage,  setFcPage]  = useState(0);
  const [faPage,  setFaPage]  = useState(0);
  const [fcuPage, setFcuPage] = useState(0);
  const FA_PAGE_SIZE = 20;
  const [companies, setCompanies]         = useState([]);
  const [accountants, setAccountants]     = useState([]);
  const [companyUsers, setCompanyUsers]   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [toast, setToast]                 = useState(null);

  /* company modal */
  const [companyModal, setCompanyModal]   = useState(null); // null | 'add' | company object
  const [companyForm, setCompanyForm]     = useState({ name: '', business_type: 'IT', email: '', phone: '', gst_number: '', address: '' });
  const [savingCompany, setSavingCompany] = useState(false);

  /* accountant modal */
  const [acctModal, setAcctModal]         = useState(false);
  const [acctForm, setAcctForm]           = useState({ username: '', password: '', display_name: '', email: '', phone: '' });
  const [savingAcct, setSavingAcct]       = useState(false);

  /* company user modal */
  const [cuModal, setCuModal]             = useState(null); // null | company object
  const [cuForm, setCuForm]               = useState({ username: '', password: '', display_name: '', email: '', phone: '', role: 'company_user' });
  const [savingCu, setSavingCu]           = useState(false);

  /* payment heads panel */
  const [headsCompany, setHeadsCompany]   = useState(null); // company object or null

  /* payment heads tab selector */
  const [headsTabCompany, setHeadsTabCompany] = useState('');
  const [headsTabData, setHeadsTabData]       = useState([]);
  const [headsTabLoading, setHeadsTabLoading] = useState(false);
  const [addHeadTabModal, setAddHeadTabModal] = useState(false);
  const [addHeadTabForm, setAddHeadTabForm]   = useState({ name: '', type: 'expense' });
  const [savingHeadTab, setSavingHeadTab]     = useState(false);
  const [editHeadTabModal, setEditHeadTabModal] = useState(null);
  const [editHeadTabForm, setEditHeadTabForm]   = useState({ name: '', type: 'expense' });
  const [deleteHeadTarget, setDeleteHeadTarget] = useState(null);
  const [subTabInputs, setSubTabInputs]         = useState({});
  const [savingSubTab, setSavingSubTab]         = useState(null);

  /* confirm dialog */
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }

  /* search / filter */
  const [companyQ,       setCompanyQ]       = useState('');
  const [companyTypeF,   setCompanyTypeF]   = useState('');
  const [companyStatusF, setCompanyStatusF] = useState('');
  const [acctQ,          setAcctQ]          = useState('');
  const [acctStatusF,    setAcctStatusF]    = useState('');
  const [cuQ,            setCuQ]            = useState('');
  const [cuRoleF,        setCuRoleF]        = useState('');
  const [cuCompanyF,     setCuCompanyF]     = useState('');
  const [cuStatusF,      setCuStatusF]      = useState('');

  /* transactions tab */
  const [transactions,  setTransactions]  = useState([]);
  const [txLoading,     setTxLoading]     = useState(false);
  const [txSearch,      setTxSearch]      = useState('');
  const [txCompanyF,    setTxCompanyF]    = useState('');
  const [txStatusF,     setTxStatusF]     = useState('');
  const [txTypeF,       setTxTypeF]       = useState('');
  const [txPage,        setTxPage]        = useState(0);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch all data ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, a, cu] = await Promise.all([
        fetch(`/api/firm/stats?firm_id=${session.firm_id}`).then(r => r.json()),
        fetch(`/api/firm/companies?firm_id=${session.firm_id}`).then(r => r.json()),
        fetch(`/api/firm/accountants?firm_id=${session.firm_id}`).then(r => r.json()),
        fetch(`/api/firm/company-users?firm_id=${session.firm_id}`).then(r => r.json()),
      ]);
      setStats(s && !s.error ? s : null);
      setCompanies(Array.isArray(c) ? c : []);
      const acctUsers = Array.isArray(a) ? a : [];
      setAccountants(acctUsers.filter(u => u.role === 'accountant'));
      setCompanyUsers(Array.isArray(cu) ? cu : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [session.firm_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Fetch payment heads for the Heads tab ── */
  const fetchHeadsTab = useCallback(async (companyId) => {
    if (!companyId) { setHeadsTabData([]); return; }
    setHeadsTabLoading(true);
    try {
      const r = await fetch(`/api/firm/companies/${companyId}/payment-heads`);
      const d = await r.json();
      setHeadsTabData(Array.isArray(d) ? d : []);
    } catch { showToast('err', 'Failed to load payment heads'); }
    finally { setHeadsTabLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'heads' && headsTabCompany) {
      fetchHeadsTab(headsTabCompany);
    }
  }, [activeTab, headsTabCompany, fetchHeadsTab]);

  /* ── Transactions tab ── */
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await fetch(`/api/transactions?firm_id=${session.firm_id}`);
      if (res.ok) { const d = await res.json(); setTransactions(Array.isArray(d) ? d : []); }
    } catch { /* silent */ }
    finally { setTxLoading(false); }
  }, [session.firm_id]);

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, fetchTransactions]);

  /* ── Companies CRUD ── */
  const openAddCompany = () => {
    setCompanyForm({ name: '', business_type: 'IT', email: '', phone: '', gst_number: '', address: '' });
    setCompanyModal('add');
  };

  const openEditCompany = (c) => {
    setCompanyForm({ name: c.name || '', business_type: c.business_type || 'IT', email: c.email || '', phone: c.phone || '', gst_number: c.gst_number || '', address: c.address || '' });
    setCompanyModal(c);
  };

  const saveCompany = async () => {
    if (!companyForm.name.trim()) { showToast('err', 'Company name is required'); return; }
    const isAdd = companyModal === 'add';
    setSavingCompany(true);
    try {
      const url    = isAdd ? '/api/firm/companies' : `/api/firm/companies/${companyModal.id}`;
      const method = isAdd ? 'POST' : 'PATCH';
      const body   = isAdd
        ? { firm_id: session.firm_id, ...companyForm, created_by: session.id }
        : { ...companyForm };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d   = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', isAdd ? 'Company created' : 'Company updated');
      setCompanyModal(null);
      fetchAll();
    } catch { showToast('err', 'Server error'); }
    finally { setSavingCompany(false); }
  };

  const deleteCompany = async (id) => {
    try {
      await fetch(`/api/firm/companies/${id}`, { method: 'DELETE' });
      showToast('ok', 'Company deleted');
      setConfirmDialog(null);
      fetchAll();
    } catch { showToast('err', 'Failed'); }
  };

  /* ── Accountants CRUD ── */
  const saveAccountant = async () => {
    if (!acctForm.username || !acctForm.password) { showToast('err', 'Username and password are required'); return; }
    if (!acctForm.email.trim())  { showToast('err', 'Email is required'); return; }
    if (!acctForm.phone.trim())  { showToast('err', 'Phone number is required'); return; }
    setSavingAcct(true);
    try {
      const res = await fetch('/api/firm/accountants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: session.firm_id, role: 'accountant', ...acctForm }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'Accountant added');
      setAcctModal(false);
      setAcctForm({ username: '', password: '', display_name: '', email: '', phone: '' });
      fetchAll();
    } catch { showToast('err', 'Server error'); }
    finally { setSavingAcct(false); }
  };

  const toggleUserActive = async (user) => {
    try {
      await fetch(`/api/firm/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });
      fetchAll();
    } catch { showToast('err', 'Failed to update user'); }
  };

  const deleteUser = async (id) => {
    try {
      await fetch(`/api/firm/users/${id}`, { method: 'DELETE' });
      showToast('ok', 'User deleted');
      setConfirmDialog(null);
      fetchAll();
    } catch { showToast('err', 'Failed'); }
  };

  /* ── Company Users CRUD ── */
  const saveCompanyUser = async () => {
    if (!cuForm.username || !cuForm.password) { showToast('err', 'Username and password are required'); return; }
    if (!cuForm.email.trim())  { showToast('err', 'Email is required'); return; }
    if (!cuForm.phone.trim())  { showToast('err', 'Phone number is required'); return; }
    setSavingCu(true);
    try {
      const res = await fetch('/api/firm/company-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: session.firm_id, company_id: cuModal.id, ...cuForm }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'User created');
      setCuModal(null);
      setCuForm({ username: '', password: '', display_name: '', email: '', phone: '', role: 'company_user' });
      fetchAll();
    } catch { showToast('err', 'Server error'); }
    finally { setSavingCu(false); }
  };

  /* ── Payment Heads Tab actions ── */
  const addHeadTab = async () => {
    if (!addHeadTabForm.name.trim()) { showToast('err', 'Head name required'); return; }
    setSavingHeadTab(true);
    try {
      const res = await fetch(`/api/firm/companies/${headsTabCompany}/payment-heads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: session.firm_id, name: addHeadTabForm.name.trim(), type: addHeadTabForm.type }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'Payment head added');
      setAddHeadTabModal(false);
      setAddHeadTabForm({ name: '', type: 'expense' });
      fetchHeadsTab(headsTabCompany);
    } catch { showToast('err', 'Server error'); }
    finally { setSavingHeadTab(false); }
  };

  const saveEditHeadTab = async () => {
    if (!editHeadTabForm.name.trim()) { showToast('err', 'Head name required'); return; }
    setSavingHeadTab(true);
    try {
      const res = await fetch(`/api/firm/payment-heads/${editHeadTabModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editHeadTabForm.name.trim(), type: editHeadTabForm.type }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'Payment head updated');
      setEditHeadTabModal(null);
      fetchHeadsTab(headsTabCompany);
    } catch { showToast('err', 'Server error'); }
    finally { setSavingHeadTab(false); }
  };

  const deleteHeadTab = async (id) => {
    try {
      await fetch(`/api/firm/payment-heads/${id}`, { method: 'DELETE' });
      showToast('ok', 'Head deleted');
      setConfirmDialog(null);
      fetchHeadsTab(headsTabCompany);
    } catch { showToast('err', 'Failed'); }
  };

  const addSubHeadTab = async (headId) => {
    const name = (subTabInputs[headId] || '').trim();
    if (!name) { showToast('err', 'Sub-head name required'); return; }
    setSavingSubTab(headId);
    try {
      const res = await fetch(`/api/firm/payment-heads/${headId}/sub-heads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: headsTabCompany, name }),
      });
      const d = await res.json();
      if (!res.ok) { showToast('err', d.error || 'Failed'); return; }
      showToast('ok', 'Sub-head added');
      setSubTabInputs(prev => ({ ...prev, [headId]: '' }));
      fetchHeadsTab(headsTabCompany);
    } catch { showToast('err', 'Server error'); }
    finally { setSavingSubTab(null); }
  };

  const deleteSubHeadTab = async (id) => {
    try {
      await fetch(`/api/firm/sub-heads/${id}`, { method: 'DELETE' });
      showToast('ok', 'Sub-head deleted');
      setConfirmDialog(null);
      fetchHeadsTab(headsTabCompany);
    } catch { showToast('err', 'Failed'); }
  };

  /* ── Company lookup for users tab ── */
  const companyNameById = (id) => {
    const c = companies.find(x => String(x.id) === String(id));
    return c ? c.name : '—';
  };

  /* ── Tab definitions ── */
  const TABS = [
    { key: 'companies',    label: '🏢 Companies' },
    { key: 'accountants',  label: '🧮 Accountants' },
    { key: 'heads',        label: '💳 Payment Heads' },
    { key: 'cusers',       label: '👤 Company Users' },
    { key: 'transactions', label: '📋 Transactions' },
  ];

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{FIRM_STYLES}</style>

      {/* ── Banner ── */}
      <div style={{
        background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #4f46e5 100%)',
        padding: '22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fd-banner .7s cubic-bezier(0.34,1.56,0.64,1) both',
        boxShadow: '0 4px 24px rgba(37,99,235,.25)',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            {session.firm_name}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 3 }}>
            {session.display_name || session.username}
          </div>
        </div>
        <button
          onClick={fetchAll}
          style={{
            background: 'rgba(255,255,255,.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,.45)',
            borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(6px)', transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{ padding: '24px 0' }}>

        {/* ── Section Nav Tabs ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22, background: '#fff', borderRadius: 12, padding: 5, boxShadow: '0 2px 12px rgba(0,0,0,.07)', width: 'fit-content' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '9px 18px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === t.key ? 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)' : 'transparent',
                color: activeTab === t.key ? '#fff' : '#64748b',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════ COMPANIES TAB ════════════════════════════ */}
        {activeTab === 'companies' && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: '22px 24px', animation: 'fd-fadein .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>🏢 Companies</h3>
              <PrimaryBtn onClick={openAddCompany}>+ Add Company</PrimaryBtn>
            </div>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Loading…</p>
            ) : (() => {
              const q = companyQ.toLowerCase();
              const fc = companies.filter(c => {
                if (q && !c.name?.toLowerCase().includes(q) && !(c.gst_number||'').toLowerCase().includes(q) && !(c.email||'').toLowerCase().includes(q)) return false;
                if (companyTypeF && c.business_type !== companyTypeF) return false;
                if (companyStatusF === 'active' && c.active === false) return false;
                if (companyStatusF === 'inactive' && c.active !== false) return false;
                return true;
              });
              const safeFcPage = Math.min(fcPage, Math.max(0, Math.ceil(fc.length / FA_PAGE_SIZE) - 1));
              const pagedFc = fc.slice(safeFcPage * FA_PAGE_SIZE, (safeFcPage + 1) * FA_PAGE_SIZE);
              return (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 170px', minWidth: 150 }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
                      <input type="text" value={companyQ} onChange={e => setCompanyQ(e.target.value)} placeholder="Search name, GST…"
                        style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                        onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                    </div>
                    <select value={companyTypeF} onChange={e => setCompanyTypeF(e.target.value)}
                      style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: companyTypeF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 130 }}>
                      <option value="">All Types</option>
                      {['Manufacturing','IT','Services','Trading','Retail'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={companyStatusF} onChange={e => setCompanyStatusF(e.target.value)}
                      style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: companyStatusF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 115 }}>
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {(companyQ || companyTypeF || companyStatusF) && (
                      <button onClick={() => { setCompanyQ(''); setCompanyTypeF(''); setCompanyStatusF(''); }}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✕ Clear
                      </button>
                    )}
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{fc.length} of {companies.length}</span>
                  </div>
                  {companies.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No companies yet. Add one to get started.</p>
                  ) : fc.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No companies match your filters.</p>
                  ) : (
                    <>
                    <Table headers={['Company Name', 'Business Type', 'GST', 'Status', 'Created', 'Actions']}>
                      {pagedFc.map((c, i) => (
                        <Tr key={c.id} delay={`${i * 0.04}s`}>
                          <Td><span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span></Td>
                          <Td><Badge label={c.business_type || '—'} color={bizColor(c.business_type)} /></Td>
                          <Td muted>{c.gst_number || '—'}</Td>
                          <Td><Badge label={c.active === false ? 'Inactive' : 'Active'} color={c.active === false ? 'gray' : 'green'} /></Td>
                          <Td muted>{fmtDate(c.created_at)}</Td>
                          <Td>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              <IconBtn color="blue" title="Edit" onClick={() => openEditCompany(c)}>✏️ Edit</IconBtn>
                              <IconBtn color="red" title="Delete" onClick={() => setConfirmDialog({ message: `Delete company "${c.name}"?`, onConfirm: () => deleteCompany(c.id) })}>🗑️</IconBtn>
                              <IconBtn color="purple" title="Payment Heads" onClick={() => setHeadsCompany(c)}>💳 Heads</IconBtn>
                              <IconBtn color="green" title="Add User" onClick={() => { setCuForm({ username: '', password: '', display_name: '', email: '', phone: '', role: 'company_user' }); setCuModal(c); }}>👤 Add User</IconBtn>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Table>
                    <Pagination page={safeFcPage} total={fc.length} pageSize={FA_PAGE_SIZE} onPageChange={setFcPage} />
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ════════════════════════════ ACCOUNTANTS TAB ════════════════════════════ */}
        {activeTab === 'accountants' && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: '22px 24px', animation: 'fd-fadein .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>🧮 Accountants</h3>
              <PrimaryBtn onClick={() => { setAcctForm({ username: '', password: '', display_name: '', email: '', phone: '' }); setAcctModal(true); }}>+ Add Accountant</PrimaryBtn>
            </div>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Loading…</p>
            ) : (() => {
              const q = acctQ.toLowerCase();
              const fa = accountants.filter(a => {
                if (q && !a.username?.toLowerCase().includes(q) && !(a.display_name||'').toLowerCase().includes(q) && !(a.email||'').toLowerCase().includes(q)) return false;
                if (acctStatusF === 'active' && a.active === false) return false;
                if (acctStatusF === 'inactive' && a.active !== false) return false;
                return true;
              });
              const safeFaPage = Math.min(faPage, Math.max(0, Math.ceil(fa.length / FA_PAGE_SIZE) - 1));
              const pagedFa = fa.slice(safeFaPage * FA_PAGE_SIZE, (safeFaPage + 1) * FA_PAGE_SIZE);
              return (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 150 }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
                      <input type="text" value={acctQ} onChange={e => setAcctQ(e.target.value)} placeholder="Search username, email…"
                        style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                        onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                    </div>
                    <select value={acctStatusF} onChange={e => setAcctStatusF(e.target.value)}
                      style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: acctStatusF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 115 }}>
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {(acctQ || acctStatusF) && (
                      <button onClick={() => { setAcctQ(''); setAcctStatusF(''); }}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✕ Clear
                      </button>
                    )}
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{fa.length} of {accountants.length}</span>
                  </div>
                  {accountants.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No accountants yet.</p>
                  ) : fa.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No accountants match your filters.</p>
                  ) : (
                    <>
                    <Table headers={['Username', 'Display Name', 'Email', 'Status', 'Actions']}>
                      {pagedFa.map((a, i) => (
                        <Tr key={a.id} delay={`${i * 0.04}s`}>
                          <Td><span style={{ fontWeight: 600 }}>{a.username}</span></Td>
                          <Td>{a.display_name || '—'}</Td>
                          <Td muted>{a.email || '—'}</Td>
                          <Td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Toggle on={a.active !== false} onChange={() => toggleUserActive(a)} />
                              <span style={{ fontSize: 12, color: '#64748b' }}>{a.active !== false ? 'Active' : 'Inactive'}</span>
                            </div>
                          </Td>
                          <Td>
                            <IconBtn color="red" title="Delete" onClick={() => setConfirmDialog({ message: `Delete accountant "${a.username}"?`, onConfirm: () => deleteUser(a.id) })}>🗑️ Delete</IconBtn>
                          </Td>
                        </Tr>
                      ))}
                    </Table>
                    <Pagination page={safeFaPage} total={fa.length} pageSize={FA_PAGE_SIZE} onPageChange={setFaPage} />
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ════════════════════════════ PAYMENT HEADS TAB ════════════════════════════ */}
        {activeTab === 'heads' && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: '22px 24px', animation: 'fd-fadein .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>💳 Payment Heads</h3>
              {headsTabCompany && (
                <PrimaryBtn onClick={() => { setAddHeadTabForm({ name: '', type: 'expense' }); setAddHeadTabModal(true); }}>+ Add Head</PrimaryBtn>
              )}
            </div>

            {/* Company selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
                Select Company
              </label>
              <select
                value={headsTabCompany}
                onChange={e => { setHeadsTabCompany(e.target.value); fetchHeadsTab(e.target.value); }}
                style={{ ...inputStyle, maxWidth: 320 }}
              >
                <option value="">— Choose a company —</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {!headsTabCompany ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Select a company to view its payment heads.</p>
            ) : headsTabLoading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Loading…</p>
            ) : headsTabData.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No payment heads for this company.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {headsTabData.map(head => (
                  <div key={head.id} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
                    {/* Head row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', flex: 1 }}>{head.name}</span>
                      {headTypeBadge(head.type)}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <IconBtn color="blue" title="Edit" onClick={() => { setEditHeadTabModal(head); setEditHeadTabForm({ name: head.name, type: head.type }); }}>
                          ✏️ Edit
                        </IconBtn>
                        <IconBtn color="red" title="Delete" onClick={() => setConfirmDialog({ message: `Delete payment head "${head.name}"?`, onConfirm: () => deleteHeadTab(head.id) })}>
                          🗑️
                        </IconBtn>
                      </div>
                    </div>

                    {/* Sub-heads chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {(head.sub_heads || []).map(sh => (
                        <span key={sh.id} style={{ background: '#eff6ff', color: '#2563eb', borderRadius: 99, fontSize: 12, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {sh.name}
                          <button
                            onClick={() => setConfirmDialog({ message: `Delete sub-head "${sh.name}"?`, onConfirm: () => deleteSubHeadTab(sh.id) })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 11, lineHeight: 1, padding: 0 }}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {(!head.sub_heads || head.sub_heads.length === 0) && (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>No sub-heads yet</span>
                      )}
                    </div>

                    {/* Add sub-head inline */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={subTabInputs[head.id] || ''}
                        onChange={e => setSubTabInputs(prev => ({ ...prev, [head.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addSubHeadTab(head.id)}
                        placeholder="New sub-head name…"
                        style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12 }}
                      />
                      <PrimaryBtn small onClick={() => addSubHeadTab(head.id)} disabled={savingSubTab === head.id}>
                        {savingSubTab === head.id ? '…' : '+ Add'}
                      </PrimaryBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════ COMPANY USERS TAB ════════════════════════════ */}
        {activeTab === 'cusers' && (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: '22px 24px', animation: 'fd-fadein .3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>👤 Company Users</h3>
            </div>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Loading…</p>
            ) : (() => {
              const q = cuQ.toLowerCase();
              const fcu = companyUsers.filter(u => {
                if (q && !u.username?.toLowerCase().includes(q) && !(u.display_name||'').toLowerCase().includes(q) && !(u.email||'').toLowerCase().includes(q)) return false;
                if (cuRoleF && u.role !== cuRoleF) return false;
                if (cuCompanyF && String(u.company_id) !== String(cuCompanyF)) return false;
                if (cuStatusF === 'active' && u.active === false) return false;
                if (cuStatusF === 'inactive' && u.active !== false) return false;
                return true;
              });
              const safeFcuPage = Math.min(fcuPage, Math.max(0, Math.ceil(fcu.length / FA_PAGE_SIZE) - 1));
              const pagedFcu = fcu.slice(safeFcuPage * FA_PAGE_SIZE, (safeFcuPage + 1) * FA_PAGE_SIZE);
              return (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 170px', minWidth: 150 }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
                      <input type="text" value={cuQ} onChange={e => setCuQ(e.target.value)} placeholder="Search username, name…"
                        style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                        onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                    </div>
                    <select value={cuRoleF} onChange={e => setCuRoleF(e.target.value)}
                      style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: cuRoleF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 140 }}>
                      <option value="">All Roles</option>
                      <option value="company_admin">Company Admin</option>
                      <option value="company_user">Company User</option>
                    </select>
                    <select value={cuCompanyF} onChange={e => setCuCompanyF(e.target.value)}
                      style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: cuCompanyF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 150 }}>
                      <option value="">All Companies</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={cuStatusF} onChange={e => setCuStatusF(e.target.value)}
                      style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: cuStatusF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 115 }}>
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {(cuQ || cuRoleF || cuCompanyF || cuStatusF) && (
                      <button onClick={() => { setCuQ(''); setCuRoleF(''); setCuCompanyF(''); setCuStatusF(''); }}
                        style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✕ Clear
                      </button>
                    )}
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{fcu.length} of {companyUsers.length}</span>
                  </div>
                  {companyUsers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No company users yet. Use the Companies tab to add users to a company.</p>
                  ) : fcu.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No users match your filters.</p>
                  ) : (
                    <>
                    <Table headers={['Username', 'Display Name', 'Role', 'Company', 'Status', 'Actions']}>
                      {pagedFcu.map((u, i) => (
                        <Tr key={u.id} delay={`${i * 0.04}s`}>
                          <Td><span style={{ fontWeight: 600 }}>{u.username}</span></Td>
                          <Td>{u.display_name || '—'}</Td>
                          <Td><Badge label={u.role === 'company_admin' ? 'Company Admin' : 'Company User'} color={u.role === 'company_admin' ? 'purple' : 'blue'} /></Td>
                          <Td muted>{companyNameById(u.company_id)}</Td>
                          <Td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Toggle on={u.active !== false} onChange={() => toggleUserActive(u)} />
                              <span style={{ fontSize: 12, color: '#64748b' }}>{u.active !== false ? 'Active' : 'Inactive'}</span>
                            </div>
                          </Td>
                          <Td>
                            <IconBtn color="red" title="Delete" onClick={() => setConfirmDialog({ message: `Delete user "${u.username}"?`, onConfirm: () => deleteUser(u.id) })}>🗑️ Delete</IconBtn>
                          </Td>
                        </Tr>
                      ))}
                    </Table>
                    <Pagination page={safeFcuPage} total={fcu.length} pageSize={FA_PAGE_SIZE} onPageChange={setFcuPage} />
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
        {/* ════════════════════════════ TRANSACTIONS TAB ════════════════════════════ */}
        {activeTab === 'transactions' && (() => {
          const STATUS_LABEL = { uploaded:'Uploaded', extracted:'Extracted', reviewed:'Under Review', approved:'Approved', rejected:'Rejected', processing:'Processing' };
          const STATUS_COLOR = { uploaded:'#2563eb', extracted:'#16a34a', reviewed:'#7c3aed', approved:'#059669', rejected:'#dc2626', processing:'#d97706' };
          const STATUS_BG    = { uploaded:'#eff6ff', extracted:'#f0fdf4', reviewed:'#f5f3ff', approved:'#dcfce7', rejected:'#fef2f2', processing:'#fffbeb' };
          const TYPE_LABEL   = { invoice_purchase:'Purchase', invoice_sales:'Sales', payment:'Payment', salary_register:'Salary', mis:'MIS', bank_statement:'Bank Stmt' };
          const TYPE_COLOR   = { invoice_purchase:'#2563eb', invoice_sales:'#16a34a', payment:'#d97706', salary_register:'#7c3aed', mis:'#0891b2', bank_statement:'#ea580c' };
          const TYPE_BG      = { invoice_purchase:'#eff6ff', invoice_sales:'#f0fdf4', payment:'#fefce8', salary_register:'#f5f3ff', mis:'#ecfeff', bank_statement:'#fff7ed' };

          const q = txSearch.toLowerCase();
          const filtered = transactions.filter(tx => {
            if (txCompanyF && String(tx.company_id) !== String(txCompanyF)) return false;
            if (txStatusF  && tx.status !== txStatusF) return false;
            if (txTypeF    && tx.type   !== txTypeF)   return false;
            if (q && !(tx.extracted_data?.vendor||'').toLowerCase().includes(q) &&
                     !(tx.extracted_data?.invoice_number||'').toLowerCase().includes(q) &&
                     !(tx.file_name||tx.filename||'').toLowerCase().includes(q)) return false;
            return true;
          });
          const safeTxP = Math.min(txPage, Math.max(0, Math.ceil(filtered.length / FA_PAGE_SIZE) - 1));
          const pagedTx = filtered.slice(safeTxP * FA_PAGE_SIZE, (safeTxP + 1) * FA_PAGE_SIZE);

          return (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.07)', padding: '22px 24px', animation: 'fd-fadein .3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>📋 Transactions</h3>
                <button onClick={fetchTransactions} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>🔄 Refresh</button>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 150 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
                  <input type="text" value={txSearch} onChange={e => { setTxSearch(e.target.value); setTxPage(0); }} placeholder="Search vendor, invoice#…"
                    style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                </div>
                <select value={txCompanyF} onChange={e => { setTxCompanyF(e.target.value); setTxPage(0); }}
                  style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: txCompanyF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 150 }}>
                  <option value="">All Companies</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={txStatusF} onChange={e => { setTxStatusF(e.target.value); setTxPage(0); }}
                  style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: txStatusF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 140 }}>
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={txTypeF} onChange={e => { setTxTypeF(e.target.value); setTxPage(0); }}
                  style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: txTypeF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 130 }}>
                  <option value="">All Types</option>
                  {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {(txSearch || txCompanyF || txStatusF || txTypeF) && (
                  <button onClick={() => { setTxSearch(''); setTxCompanyF(''); setTxStatusF(''); setTxTypeF(''); setTxPage(0); }}
                    style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ✕ Clear
                  </button>
                )}
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{filtered.length} of {transactions.length}</span>
              </div>

              {txLoading ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading…</p>
              ) : filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>
                  {transactions.length === 0 ? 'No transactions yet.' : 'No transactions match your filters.'}
                </p>
              ) : (
                <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        {['#','Type','Company','File Name','Vendor','Invoice #','Date','Amount ₹','Payment Head','Status','Uploaded'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTx.map((tx, idx) => {
                        const d = tx.extracted_data || {};
                        const comp = companies.find(c => String(c.id) === String(tx.company_id));
                        const rowNum = safeTxP * FA_PAGE_SIZE + idx + 1;
                        const tLabel = TYPE_LABEL[tx.type] || tx.type;
                        const sLabel = STATUS_LABEL[tx.status] || tx.status;
                        return (
                          <tr key={tx.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 600 }}>{rowNum}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ background: TYPE_BG[tx.type]||'#f1f5f9', color: TYPE_COLOR[tx.type]||'#64748b', borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{tLabel}</span>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{comp?.name || '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.file_name || tx.filename || '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.vendor || '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#475569', fontFamily: 'monospace', fontSize: 12 }}>{d.invoice_number || '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.invoice_date || '—'}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                              {d.total_amount ? `₹${Number(d.total_amount).toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
                              {tx.payment_head_name ? (
                                <span style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                                  {tx.payment_head_name}{tx.sub_head_name ? ` → ${tx.sub_head_name}` : ''}
                                </span>
                              ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ background: STATUS_BG[tx.status]||'#f1f5f9', color: STATUS_COLOR[tx.status]||'#64748b', borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{sLabel}</span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(tx.uploaded_at || tx.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={safeTxP} total={filtered.length} pageSize={FA_PAGE_SIZE} onPageChange={setTxPage} />
                </>
              )}
            </div>
          );
        })()}

      </div>

      {/* ════════════════════════════ MODALS ════════════════════════════ */}

      {/* Add / Edit Company Modal */}
      {companyModal && (
        <Modal title={companyModal === 'add' ? 'Add Company' : `Edit — ${companyModal.name}`} onClose={() => setCompanyModal(null)}>
          <FormField label="Company Name *" value={companyForm.name} onChange={v => setCompanyForm(p => ({ ...p, name: v }))} placeholder="e.g. Acme Private Ltd" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <FormField label="Business Type" value={companyForm.business_type} onChange={v => setCompanyForm(p => ({ ...p, business_type: v }))} as="select">
              <option value="Manufacturing">Manufacturing</option>
              <option value="IT">IT</option>
              <option value="Services">Services</option>
              <option value="Trading">Trading</option>
              <option value="Retail">Retail</option>
            </FormField>
            <FormField label="Email" type="email" value={companyForm.email} onChange={v => setCompanyForm(p => ({ ...p, email: v }))} placeholder="billing@company.com" />
            <FormField label="Phone" value={companyForm.phone} onChange={v => setCompanyForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile number" />
            <FormField label="GST Number" value={companyForm.gst_number} onChange={v => setCompanyForm(p => ({ ...p, gst_number: v }))} placeholder="22AAAAA0000A1Z5" />
          </div>
          <FormField label="Address" value={companyForm.address} onChange={v => setCompanyForm(p => ({ ...p, address: v }))} placeholder="123 Main St, City" />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setCompanyModal(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <PrimaryBtn onClick={saveCompany} disabled={savingCompany || !companyForm.name.trim()}>{savingCompany ? 'Saving…' : companyModal === 'add' ? 'Create Company' : 'Save Changes'}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Add Accountant Modal */}
      {acctModal && (
        <Modal title="Add Accountant" onClose={() => setAcctModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <FormField label="Username *" value={acctForm.username} onChange={v => setAcctForm(p => ({ ...p, username: v }))} placeholder="john_accountant" />
            <FormField label="Password *" type="password" value={acctForm.password} onChange={v => setAcctForm(p => ({ ...p, password: v }))} placeholder="Min. 8 characters" />
            <FormField label="Email *" type="email" value={acctForm.email} onChange={v => setAcctForm(p => ({ ...p, email: v }))} placeholder="john@firm.com" />
            <FormField label="Phone *" value={acctForm.phone} onChange={v => setAcctForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile number" />
            <FormField label="Display Name" value={acctForm.display_name} onChange={v => setAcctForm(p => ({ ...p, display_name: v }))} placeholder="John Doe" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setAcctModal(false)} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <PrimaryBtn onClick={saveAccountant} disabled={savingAcct || !acctForm.username.trim() || !acctForm.password.trim() || !acctForm.email.trim() || !acctForm.phone.trim()}>{savingAcct ? 'Saving…' : 'Add Accountant'}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Create Company User Modal */}
      {cuModal && (
        <Modal title={`Add User to ${cuModal.name}`} onClose={() => setCuModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <FormField label="Company" value={cuModal.name} onChange={() => {}} readOnly />
            <FormField label="Role" value={cuForm.role} onChange={v => setCuForm(p => ({ ...p, role: v }))} as="select">
              <option value="company_admin">Company Admin</option>
              <option value="company_user">Company User</option>
            </FormField>
            <FormField label="Username *" value={cuForm.username} onChange={v => setCuForm(p => ({ ...p, username: v }))} placeholder="username" />
            <FormField label="Password *" type="password" value={cuForm.password} onChange={v => setCuForm(p => ({ ...p, password: v }))} placeholder="Min. 8 characters" />
            <FormField label="Email *" type="email" value={cuForm.email} onChange={v => setCuForm(p => ({ ...p, email: v }))} placeholder="user@company.com" />
            <FormField label="Phone *" value={cuForm.phone} onChange={v => setCuForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile number" />
            <FormField label="Display Name" value={cuForm.display_name} onChange={v => setCuForm(p => ({ ...p, display_name: v }))} placeholder="Full Name" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setCuModal(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <PrimaryBtn onClick={saveCompanyUser} disabled={savingCu || !cuForm.username.trim() || !cuForm.password.trim() || !cuForm.email.trim() || !cuForm.phone.trim()}>{savingCu ? 'Saving…' : 'Create User'}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Payment Heads Panel (from Companies tab) */}
      {headsCompany && (
        <PaymentHeadsPanel
          company={headsCompany}
          firmId={session.firm_id}
          onClose={() => setHeadsCompany(null)}
          showToast={showToast}
        />
      )}

      {/* Add Head (Heads tab) Modal */}
      {addHeadTabModal && (
        <Modal title="Add Payment Head" onClose={() => setAddHeadTabModal(false)}>
          <FormField label="Head Name *" value={addHeadTabForm.name} onChange={v => setAddHeadTabForm(p => ({ ...p, name: v }))} placeholder="e.g. Office Supplies" />
          <FormField label="Type *" value={addHeadTabForm.type} onChange={v => setAddHeadTabForm(p => ({ ...p, type: v }))} as="select">
            <option value="expense">Expense</option>
            <option value="revenue">Revenue</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setAddHeadTabModal(false)} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <PrimaryBtn onClick={addHeadTab} disabled={savingHeadTab || !addHeadTabForm.name.trim()}>{savingHeadTab ? 'Saving…' : 'Add Head'}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Edit Head (Heads tab) Modal */}
      {editHeadTabModal && (
        <Modal title="Edit Payment Head" onClose={() => setEditHeadTabModal(null)}>
          <FormField label="Head Name *" value={editHeadTabForm.name} onChange={v => setEditHeadTabForm(p => ({ ...p, name: v }))} placeholder="Head name" />
          <FormField label="Type *" value={editHeadTabForm.type} onChange={v => setEditHeadTabForm(p => ({ ...p, type: v }))} as="select">
            <option value="expense">Expense</option>
            <option value="revenue">Revenue</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </FormField>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setEditHeadTabModal(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <PrimaryBtn onClick={saveEditHeadTab} disabled={savingHeadTab || !editHeadTabForm.name.trim()}>{savingHeadTab ? 'Saving…' : 'Save Changes'}</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* Global Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          background: toast.type === 'ok' ? '#16a34a' : '#dc2626',
          color: '#fff', borderRadius: 10, padding: '12px 22px', fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 28px rgba(0,0,0,.22)', zIndex: 9999,
          animation: 'fd-fadein .25s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.type === 'ok' ? '✅ ' : '❌ '}{toast.msg}
        </div>
      )}
    </div>
  );
}
