import { useState, useEffect, useCallback } from 'react';
import Pagination from './Pagination';

/* ── Styles ───────────────────────────────────────────────────────────────── */
const ADMIN_STYLES = `
@keyframes pd-banner  { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
@keyframes pd-card-up { from { opacity:0; transform:translateY(22px) scale(.97); filter:blur(3px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }
@keyframes pd-fadein  { from { opacity:0; } to { opacity:1; } }
@keyframes pd-row-in  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(n) { return (parseFloat(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon, gradient, delay = '0s' }) {
  return (
    <div style={{
      background: `linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),${gradient}`,
      borderRadius: 14, padding: '14px 16px',
      color: '#fff', animation: `pd-card-up .9s cubic-bezier(0.34,1.56,0.64,1) ${delay} both`,
      boxShadow: '0 4px 14px rgba(0,0,0,.14)', minWidth: 0, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.9 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 5, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ position: 'absolute', right: -12, bottom: -12, width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
    </div>
  );
}

/* ── Section title ────────────────────────────────────────────────────────── */
function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{children}</h3>
      {action}
    </div>
  );
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
    indigo: { bg: '#e0e7ff', text: '#4338ca' },
    teal:   { bg: '#ccfbf1', text: '#0d9488' },
    amber:  { bg: '#fef3c7', text: '#b45309' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  );
}

/* ── Modal wrapper ────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pd-fadein .2s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,.25)', maxHeight: '88vh', overflowY: 'auto' }}>
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

function FormField({ label, value, onChange, type = 'text', placeholder, as, children, required }) {
  const hasAsterisk = required || (typeof label === 'string' && label.trimEnd().endsWith('*'));
  const cleanLabel  = typeof label === 'string' ? label.replace(/\s*\*\s*$/, '') : label;
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>
        {cleanLabel}{hasAsterisk && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {as === 'select'
        ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle }}
            onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')}>{children}</select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...inputStyle }}
            onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
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
        <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Delete</button>
      </div>
    </Modal>
  );
}

/* ── Primary button style ─────────────────────────────────────────────────── */
const primaryBtn = {
  padding: '8px 16px', borderRadius: 9, border: 'none',
  background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)',
  color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
};

/* ══════════════════════════════════════════════════════════════════════════
   PlatformAdminDashboard
══════════════════════════════════════════════════════════════════════════ */
export default function PlatformAdminDashboard({ session }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [stats,         setStats]         = useState(null);
  const [firms,         setFirms]         = useState([]);
  const [users,         setUsers]         = useState([]);
  const [allCompanies,  setAllCompanies]  = useState([]);
  const [auditLogs,     setAuditLogs]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [toast,         setToast]         = useState(null);

  /* ── Firm modal ── */
  const FIRM_BLANK = { name: '', email: '', phone: '', address: '', city: '', gst_number: '', registration_number: '' };
  const [firmModal,    setFirmModal]    = useState(null); // null | 'add' | { ...firm }
  const [firmForm,     setFirmForm]     = useState(FIRM_BLANK);

  /* ── Add-admin modal ── */
  const ADMIN_BLANK = { username: '', password: '', display_name: '', email: '', phone: '' };
  const [adminModal,   setAdminModal]   = useState(null); // null | firmId
  const [adminForm,    setAdminForm]    = useState(ADMIN_BLANK);

  /* ── Company filters ── */
  const [companySearch,     setCompanySearch]     = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState('');
  const [companyFirmFilter, setCompanyFirmFilter] = useState('');

  /* ── Firm filters ── */
  const [firmSearch,   setFirmSearch]   = useState('');
  const [firmStatusF,  setFirmStatusF]  = useState('');

  /* ── User filters ── */
  const [userSearch,   setUserSearch]   = useState('');
  const [userRoleF,    setUserRoleF]    = useState('');
  const [userStatusF,  setUserStatusF]  = useState('');

  /* ── Audit filters ── */
  const [auditSearch,  setAuditSearch]  = useState('');
  const [auditActionF, setAuditActionF] = useState('');

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind:'firm'|'user'|'company', id, name }

  const [ffPage,   setFfPage]   = useState(0);
  const [compPage, setCompPage] = useState(0);
  const [fuPage,   setFuPage]   = useState(0);
  const [faPage,   setFaPage]   = useState(0);
  const PD_PAGE_SIZE = 20;

  /* ── Toast helper ── */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Fetch ── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        fetch('/api/platform/stats').then(r => r.json()),
        fetch('/api/platform/firms').then(r => r.json()),
      ]);
      setStats(s);
      setFirms(Array.isArray(f) ? f : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const u = await fetch('/api/platform/users').then(r => r.json());
      setUsers(Array.isArray(u) ? u : []);
    } catch { /* silent */ }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const c = await fetch('/api/platform/companies').then(r => r.json());
      setAllCompanies(Array.isArray(c) ? c : []);
    } catch { /* silent */ }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const a = await fetch('/api/audit').then(r => r.json());
      setAuditLogs(Array.isArray(a) ? a : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchUsers();
    fetchCompanies();
    fetchAudit();
    const t = setInterval(() => {
      fetchAll();
      fetchUsers();
      fetchCompanies();
      fetchAudit();
    }, 8000);
    return () => clearInterval(t);
  }, [fetchAll, fetchUsers, fetchCompanies, fetchAudit]);

  /* ── Firm CRUD ── */
  const openAddFirm = () => {
    setFirmForm(FIRM_BLANK);
    setFirmModal('add');
  };

  const openEditFirm = (firm) => {
    setFirmForm({ name: firm.name || '', email: firm.email || '', phone: firm.phone || '', address: firm.address || '', city: firm.city || '', gst_number: firm.gst_number || '', registration_number: firm.registration_number || '' });
    setFirmModal(firm);
  };

  const saveFirm = async () => {
    if (!firmForm.name.trim()) { showToast('err', 'Firm name is required'); return; }
    const isAdd = firmModal === 'add';
    try {
      const url    = isAdd ? '/api/platform/firms' : `/api/platform/firms/${firmModal.id}`;
      const method = isAdd ? 'POST' : 'PATCH';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(firmForm) });
      const data   = await res.json();
      if (!res.ok) { showToast('err', data.error || 'Failed to save firm'); return; }
      showToast('ok', isAdd ? 'Firm created successfully' : 'Firm updated successfully');
      setFirmModal(null);
      fetchAll();
    } catch { showToast('err', 'Server error'); }
  };

  const deleteFirm = async (id) => {
    try {
      const res = await fetch(`/api/platform/firms/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast('err', d.error || 'Delete failed'); return; }
      showToast('ok', 'Firm deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch { showToast('err', 'Server error'); }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`/api/platform/users/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast('err', d.error || 'Delete failed'); return; }
      showToast('ok', 'User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch { showToast('err', 'Server error'); }
  };

  const deletePlatformCompany = async (id) => {
    try {
      const res = await fetch(`/api/platform/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast('err', d.error || 'Delete failed'); return; }
      showToast('ok', 'Company deleted');
      setDeleteTarget(null);
      fetchCompanies();
      fetchAll();
    } catch { showToast('err', 'Server error'); }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'firm')    deleteFirm(deleteTarget.id);
    if (deleteTarget.kind === 'user')    deleteUser(deleteTarget.id);
    if (deleteTarget.kind === 'company') deletePlatformCompany(deleteTarget.id);
  };

  /* ── Add firm admin ── */
  const openAddAdmin = (firmId) => {
    setAdminForm(ADMIN_BLANK);
    setAdminModal(firmId);
  };

  const saveAdmin = async () => {
    if (!adminForm.username.trim() || !adminForm.password) { showToast('err', 'Username and password are required'); return; }
    if (!adminForm.email.trim())  { showToast('err', 'Email is required'); return; }
    if (!adminForm.phone.trim())  { showToast('err', 'Phone number is required'); return; }
    try {
      const res  = await fetch(`/api/platform/firms/${adminModal}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (!res.ok) { showToast('err', data.error || 'Failed to create admin'); return; }
      showToast('ok', 'Firm admin created successfully');
      setAdminModal(null);
      fetchUsers();
    } catch { showToast('err', 'Server error'); }
  };

  /* ── Toggle user active ── */
  const toggleUserActive = async (u) => {
    try {
      await fetch(`/api/platform/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      });
      fetchUsers();
    } catch { showToast('err', 'Failed to update user'); }
  };

  /* ── Derived stats ── */
  // Backend returns: { firms, companies, users, totalValue, pending, approved }
  const totalFirms       = stats?.firms      ?? firms.length;
  const totalCompanies   = stats?.companies  ?? 0;
  const activeUsers      = stats?.users      ?? users.filter(u => u.active !== false).length;
  const approvedValue    = stats?.totalValue ?? 0;
  const pendingReview    = stats?.pending    ?? 0;
  const approvedTx       = stats?.approved   ?? 0;
  const totalTx          = approvedTx + pendingReview;
  const approvalRate     = totalTx > 0 ? ((approvedTx / totalTx) * 100).toFixed(1) : '0.0';
  const revenueProcessed = approvedValue;
  const mostActiveFirm   = firms[0]?.name ?? '—';

  const KPI_DEFS = [
    { label: 'Total Firms',      value: fmt(totalFirms),          icon: '🏛️', gradient: 'linear-gradient(135deg,#4338ca,#6366f1)', delay: '0.10s' },
    { label: 'Companies',        value: fmt(totalCompanies),       icon: '🏢', gradient: 'linear-gradient(135deg,#059669,#10b981)', delay: '0.20s' },
    { label: 'Active Users',     value: fmt(activeUsers),          icon: '👥', gradient: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', delay: '0.30s' },
    { label: 'Pending Review',   value: fmt(pendingReview),        icon: '⏳', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', delay: '0.40s' },
    { label: 'Approved Txns',    value: fmt(approvedTx),           icon: '✅', gradient: 'linear-gradient(135deg,#0f766e,#14b8a6)', delay: '0.50s' },
    { label: 'Approved Value ₹', value: `₹${fmt(approvedValue)}`,  icon: '💰', gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', delay: '0.60s' },
  ];

  const roleBadgeColor = (r) => ({
    platform_admin: 'purple',
    firm_admin:     'indigo',
    accountant:     'blue',
    company_admin:  'green',
    company_user:   'teal',
  }[r] || 'gray');

  const navItems = [
    { key: 'overview',  label: 'Overview',  icon: '📊' },
    { key: 'firms',     label: 'Firms',     icon: '🏛️' },
    { key: 'companies', label: 'Companies', icon: '🏢' },
    { key: 'users',     label: 'Users',     icon: '👥' },
    { key: 'audit',     label: 'Audit',     icon: '📋' },
  ];

  return (
    <div style={{ animation: 'pd-fadein .5s ease both' }}>
      <style>{ADMIN_STYLES}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          background: toast.type === 'ok' ? '#16a34a' : '#dc2626',
          color: '#fff', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,.18)', zIndex: 9999, animation: 'pd-fadein .2s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.type === 'ok' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete ${deleteTarget.kind} "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Firm modal ── */}
      {firmModal && (
        <Modal title={firmModal === 'add' ? 'Add New Firm' : `Edit Firm — ${firmModal.name}`} onClose={() => setFirmModal(null)}>
          <FormField label="Firm Name" required value={firmForm.name} onChange={v => setFirmForm(p => ({ ...p, name: v }))} placeholder="Acme Accounting LLP" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <FormField label="Email" required value={firmForm.email} onChange={v => setFirmForm(p => ({ ...p, email: v }))} type="email" placeholder="contact@firm.com" />
            <FormField label="Contact No" required value={firmForm.phone} onChange={v => setFirmForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile number" />
            <FormField label="GST Number" value={firmForm.gst_number} onChange={v => setFirmForm(p => ({ ...p, gst_number: v }))} placeholder="22AAAAA0000A1Z5" />
            <FormField label="Registration No" value={firmForm.registration_number} onChange={v => setFirmForm(p => ({ ...p, registration_number: v }))} placeholder="AAC-1234" />
            <FormField label="City" value={firmForm.city} onChange={v => setFirmForm(p => ({ ...p, city: v }))} placeholder="Mumbai" />
            <FormField label="Address" value={firmForm.address} onChange={v => setFirmForm(p => ({ ...p, address: v }))} placeholder="123 Main St" />
          </div>
          {(() => { const ok = firmForm.name.trim() && firmForm.email.trim() && firmForm.phone.trim(); return (
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setFirmModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <button onClick={saveFirm} disabled={!ok} style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', background: ok ? 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)' : '#cbd5e1', color: '#fff', cursor: ok ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, opacity: ok ? 1 : 0.45, transition: 'opacity .2s' }}>
              {firmModal === 'add' ? 'Create Firm' : 'Save Changes'}
            </button>
          </div>
          ); })()}
        </Modal>
      )}

      {/* ── Add admin modal ── */}
      {adminModal && (
        <Modal title="Add Firm Admin" onClose={() => setAdminModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <FormField label="Username *" value={adminForm.username} onChange={v => setAdminForm(p => ({ ...p, username: v }))} placeholder="firm_admin" />
            <FormField label="Password *" value={adminForm.password} onChange={v => setAdminForm(p => ({ ...p, password: v }))} type="password" placeholder="••••••••" />
            <FormField label="Email *" value={adminForm.email} onChange={v => setAdminForm(p => ({ ...p, email: v }))} type="email" placeholder="admin@firm.com" />
            <FormField label="Phone *" value={adminForm.phone} onChange={v => setAdminForm(p => ({ ...p, phone: v.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile number" />
            <FormField label="Display Name" value={adminForm.display_name} onChange={v => setAdminForm(p => ({ ...p, display_name: v }))} placeholder="Full Name" />
          </div>
          {(() => { const ok = adminForm.username.trim() && adminForm.password.trim() && adminForm.email.trim() && adminForm.phone.trim(); return (
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setAdminModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cancel</button>
            <button onClick={saveAdmin} disabled={!ok} style={{ flex: 2, padding: '10px', borderRadius: 9, border: 'none', background: ok ? 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#2563eb,#7c3aed)' : '#cbd5e1', color: '#fff', cursor: ok ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, opacity: ok ? 1 : 0.45, transition: 'opacity .2s' }}>Create Admin</button>
          </div>
          ); })()}
        </Modal>
      )}

      {/* ── Banner ── */}
      <div style={{
        background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #4f46e5 100%)',
        borderRadius: 18, padding: '22px 28px', marginBottom: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(37,99,235,.3)',
        animation: 'pd-banner 1s ease both',
        color: '#fff',
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Platform Administration</h2>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
            {session?.display_name || session?.username}
          </div>
        </div>
        <button
          onClick={() => { fetchAll(); fetchUsers(); fetchAudit(); }}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
            color: '#fff', padding: '8px 18px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, backdropFilter: 'blur(8px)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '⟳ Refreshing…' : '↺ Refresh'}
        </button>
      </div>

      {/* ── Nav tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {navItems.map(n => (
          <button key={n.key} onClick={() => setActiveSection(n.key)}
            style={{
              padding: '8px 16px', borderRadius: 10,
              border: `1.5px solid ${activeSection === n.key ? '#2563eb' : '#e2e8f0'}`,
              background: activeSection === n.key ? '#eff6ff' : '#fff',
              color: activeSection === n.key ? '#2563eb' : '#475569',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
            }}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'overview' && (
        <div>
          {/* Firms summary table */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f1f5f9' }}>
            <SectionTitle>Firms Summary</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Name', 'Active', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {firms.map((firm, i) => (
                    <tr key={firm.id} style={{ borderBottom: '1px solid #f8fafc', animation: `pd-row-in .5s ease ${i * 0.07}s both` }}>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>🏛️ {firm.name}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <Badge label={firm.active !== false ? 'Active' : 'Inactive'} color={firm.active !== false ? 'green' : 'red'} />
                      </td>
                      <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{fmtDate(firm.created_at)}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <button onClick={() => { setActiveSection('firms'); openEditFirm(firm); }}
                          style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {firms.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No firms registered yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          FIRMS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'firms' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f1f5f9' }}>
          <SectionTitle action={
            <button onClick={openAddFirm} style={primaryBtn}>+ Add Firm</button>
          }>
            Accounting Firms
          </SectionTitle>
          {(() => {
            const q = firmSearch.toLowerCase();
            const ff = firms.filter(f => {
              if (q && !f.name?.toLowerCase().includes(q) && !(f.email||'').toLowerCase().includes(q)) return false;
              if (firmStatusF === 'active' && f.active === false) return false;
              if (firmStatusF === 'inactive' && f.active !== false) return false;
              return true;
            });
            const safeFfPage = Math.min(ffPage, Math.max(0, Math.ceil(ff.length / PD_PAGE_SIZE) - 1));
            const pagedFf = ff.slice(safeFfPage * PD_PAGE_SIZE, (safeFfPage + 1) * PD_PAGE_SIZE);
            return (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 170 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
                    <input type="text" value={firmSearch} onChange={e => setFirmSearch(e.target.value)} placeholder="Search firm name, email…"
                      style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                      onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                  </div>
                  <select value={firmStatusF} onChange={e => setFirmStatusF(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: firmStatusF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 120 }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {(firmSearch || firmStatusF) && (
                    <button onClick={() => { setFirmSearch(''); setFirmStatusF(''); }}
                      style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      ✕ Clear
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{ff.length} of {firms.length}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        {['Firm Name', 'Email', 'Phone', 'Status', 'Created', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedFf.map((firm, i) => (
                  <tr key={firm.id} style={{ borderBottom: '1px solid #f8fafc', animation: `pd-row-in .5s ease ${i * 0.06}s both` }}>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>
                      <div>🏛️ {firm.name}</div>
                      {firm.firm_code && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>#{firm.firm_code}</div>}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{firm.email || '—'}</td>
                    <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{firm.phone || '—'}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <Badge label={firm.active !== false ? 'Active' : 'Inactive'} color={firm.active !== false ? 'green' : 'red'} />
                    </td>
                    <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{fmtDate(firm.created_at)}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                        <button onClick={() => openEditFirm(firm)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteTarget({ kind: 'firm', id: firm.id, name: firm.name })}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>
                          Delete
                        </button>
                        <button onClick={() => openAddAdmin(firm.id)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.4)),linear-gradient(135deg,#4338ca,#6366f1)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                          Add Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                      ))}
                      {ff.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                          {firms.length === 0 ? 'No firms registered. Click "+ Add Firm" to get started.' : 'No firms match your filters.'}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination page={safeFfPage} total={ff.length} pageSize={PD_PAGE_SIZE} onPageChange={setFfPage} />
              </>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          COMPANIES
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'companies' && (() => {
        const q = companySearch.toLowerCase();
        const filtered = allCompanies.filter(c => {
          const matchText = !q ||
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.gst_number?.toLowerCase().includes(q);
          const matchType = !companyTypeFilter || c.business_type === companyTypeFilter;
          const matchFirm = !companyFirmFilter || c.firm_name === companyFirmFilter;
          return matchText && matchType && matchFirm;
        });
        const safeCompPage = Math.min(compPage, Math.max(0, Math.ceil(filtered.length / PD_PAGE_SIZE) - 1));
        const pagedComp = filtered.slice(safeCompPage * PD_PAGE_SIZE, (safeCompPage + 1) * PD_PAGE_SIZE);
        const uniqueTypes = [...new Set(allCompanies.map(c => c.business_type).filter(Boolean))];
        const uniqueFirms = [...new Set(allCompanies.map(c => c.firm_name).filter(f => f && f !== '—'))];
        return (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f1f5f9' }}>
            <SectionTitle>All Companies</SectionTitle>

            {/* ── Filter bar ── */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
                <input
                  type="text"
                  value={companySearch}
                  onChange={e => setCompanySearch(e.target.value)}
                  placeholder="Search companies…"
                  style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#2563eb')}
                  onBlur={e  => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>

              {/* Type filter */}
              <select
                value={companyTypeFilter}
                onChange={e => setCompanyTypeFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: companyTypeFilter ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 140 }}
              >
                <option value="">All Types</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {/* Firm filter */}
              <select
                value={companyFirmFilter}
                onChange={e => setCompanyFirmFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: companyFirmFilter ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 160 }}
              >
                <option value="">All Firms</option>
                {uniqueFirms.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Clear filters */}
              {(companySearch || companyTypeFilter || companyFirmFilter) && (
                <button
                  onClick={() => { setCompanySearch(''); setCompanyTypeFilter(''); setCompanyFirmFilter(''); }}
                  style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  ✕ Clear
                </button>
              )}

              {/* Result count */}
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {filtered.length} of {allCompanies.length} companies
              </span>
            </div>

            {/* ── Table ── */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Company', 'Firm', 'Type', 'Email', 'Phone', 'GST', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedComp.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc', animation: `pd-row-in .5s ease ${Math.min(i, 30) * 0.05}s both` }}>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>🏢 {c.name}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{c.firm_name || '—'}</td>
                      <td style={{ padding: '10px 10px' }}><Badge label={c.business_type || 'Services'} color="blue" /></td>
                      <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{c.email || '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{c.phone || '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{c.gst_number || '—'}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <Badge label={c.active !== false ? 'Active' : 'Inactive'} color={c.active !== false ? 'green' : 'red'} />
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <button
                          onClick={() => setDeleteTarget({ kind: 'company', id: c.id, name: c.name })}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      {allCompanies.length === 0 ? 'No companies found' : 'No companies match your filters'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={safeCompPage} total={filtered.length} pageSize={PD_PAGE_SIZE} onPageChange={setCompPage} />
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          USERS
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'users' && (() => {
        const q = userSearch.toLowerCase();
        const fu = users.filter(u => {
          if (q && !u.username?.toLowerCase().includes(q) && !(u.display_name||'').toLowerCase().includes(q) && !(u.email||'').toLowerCase().includes(q)) return false;
          if (userRoleF && u.role !== userRoleF) return false;
          if (userStatusF === 'active' && u.active === false) return false;
          if (userStatusF === 'inactive' && u.active !== false) return false;
          return true;
        });
        const safeFuPage = Math.min(fuPage, Math.max(0, Math.ceil(fu.length / PD_PAGE_SIZE) - 1));
        const pagedFu = fu.slice(safeFuPage * PD_PAGE_SIZE, (safeFuPage + 1) * PD_PAGE_SIZE);
        return (
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f1f5f9' }}>
          <SectionTitle>All Platform Users</SectionTitle>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 170 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search username, name, email…"
                style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </div>
            <select value={userRoleF} onChange={e => setUserRoleF(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: userRoleF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 150 }}>
              <option value="">All Roles</option>
              <option value="platform_admin">Platform Admin</option>
              <option value="firm_admin">Firm Admin</option>
              <option value="accountant">Accountant</option>
              <option value="company_admin">Company Admin</option>
              <option value="company_user">Company User</option>
            </select>
            <select value={userStatusF} onChange={e => setUserStatusF(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: userStatusF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 120 }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(userSearch || userRoleF || userStatusF) && (
              <button onClick={() => { setUserSearch(''); setUserRoleF(''); setUserStatusF(''); }}
                style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                ✕ Clear
              </button>
            )}
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{fu.length} of {users.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Username', 'Display Name', 'Role', 'Firm', 'Email', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedFu.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc', animation: `pd-row-in .5s ease ${Math.min(i, 30) * 0.05}s both` }}>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>@{u.username}</td>
                    <td style={{ padding: '10px 10px', color: '#475569' }}>{u.display_name || '—'}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <Badge label={(u.role || 'user').replace(/_/g, ' ')} color={roleBadgeColor(u.role)} />
                    </td>
                    <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{u.firm_name || u.firm || '—'}</td>
                    <td style={{ padding: '10px 10px', color: '#64748b', fontSize: 12 }}>{u.email || '—'}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <button onClick={() => toggleUserActive(u)}
                        style={{
                          padding: '3px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                          fontSize: 11, fontWeight: 700,
                          background: u.active !== false ? '#dcfce7' : '#fee2e2',
                          color: u.active !== false ? '#16a34a' : '#dc2626',
                        }}>
                        {u.active !== false ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      {u.role !== 'platform_admin' && (
                        <button
                          onClick={() => setDeleteTarget({ kind: 'user', id: u.id, name: u.username })}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {fu.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    {users.length === 0 ? 'No users found' : 'No users match your filters'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={safeFuPage} total={fu.length} pageSize={PD_PAGE_SIZE} onPageChange={setFuPage} />
        </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          AUDIT
      ══════════════════════════════════════════════════════════════ */}
      {activeSection === 'audit' && (() => {
        const q = auditSearch.toLowerCase();
        const fa = auditLogs.filter(log => {
          if (q && !(log.performed_by||'').toLowerCase().includes(q) && !(log.company_name||log.tenant_name||log.firm_name||'').toLowerCase().includes(q)) return false;
          if (auditActionF && log.action !== auditActionF) return false;
          return true;
        });
        const safeFaPage = Math.min(faPage, Math.max(0, Math.ceil(fa.length / PD_PAGE_SIZE) - 1));
        const pagedFa = fa.slice(safeFaPage * PD_PAGE_SIZE, (safeFaPage + 1) * PD_PAGE_SIZE);
        return (
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: '1px solid #f1f5f9' }}>
          <SectionTitle>Audit Log</SectionTitle>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 170 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
              <input type="text" value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search user, company…"
                style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fafafa', color: '#0f172a', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </div>
            <select value={auditActionF} onChange={e => setAuditActionF(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, background: '#fafafa', color: auditActionF ? '#0f172a' : '#94a3b8', outline: 'none', cursor: 'pointer', minWidth: 140 }}>
              <option value="">All Actions</option>
              {['approved','rejected','uploaded','edited','deleted','created','login'].map(a => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>
              ))}
            </select>
            {(auditSearch || auditActionF) && (
              <button onClick={() => { setAuditSearch(''); setAuditActionF(''); }}
                style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                ✕ Clear
              </button>
            )}
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{fa.length} of {auditLogs.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Action', 'Performed By', 'Role', 'Company', 'When'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedFa.map((log, i) => (
                  <tr key={log.id || i} style={{ borderBottom: '1px solid #f8fafc', animation: `pd-row-in .4s ease ${Math.min(i, 25) * 0.04}s both` }}>
                    <td style={{ padding: '9px 10px' }}>
                      <Badge
                        label={log.action === 'reviewed' ? 'Under Review' : log.action || '—'}
                        color={{
                          approved: 'green', rejected: 'red', uploaded: 'blue',
                          edited: 'yellow', deleted: 'red', created: 'teal',
                          login: 'indigo', reviewed: 'purple',
                        }[log.action] || 'gray'}
                      />
                    </td>
                    <td style={{ padding: '9px 10px', fontWeight: 600, color: '#0f172a' }}>{log.performed_by || log.username || '—'}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <Badge
                        label={(log.performed_role || log.role || 'user').replace(/_/g, ' ')}
                        color={roleBadgeColor(log.performed_role || log.role)}
                      />
                    </td>
                    <td style={{ padding: '9px 10px', color: '#475569' }}>{log.company_name || log.tenant_name || log.firm_name || '—'}</td>
                    <td style={{ padding: '9px 10px', color: '#94a3b8', fontSize: 11 }}>{fmtDate(log.performed_at || log.created_at)}</td>
                  </tr>
                ))}
                {fa.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    {auditLogs.length === 0 ? 'No audit events recorded yet' : 'No events match your filters'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={safeFaPage} total={fa.length} pageSize={PD_PAGE_SIZE} onPageChange={setFaPage} />
        </div>
        );
      })()}
    </div>
  );
}
