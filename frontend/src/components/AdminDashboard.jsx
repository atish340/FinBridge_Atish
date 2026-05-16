import { useState, useEffect, useCallback, useRef } from 'react';

/* ── Styles ───────────────────────────────────────────────────────────────── */
const ADMIN_STYLES = `
@keyframes ad-banner  { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
@keyframes ad-card-up { from { opacity:0; transform:translateY(22px) scale(.97); filter:blur(3px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }
@keyframes ad-fadein  { from { opacity:0; } to { opacity:1; } }
@keyframes ad-row-in  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmt(n) { return (parseFloat(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'; }

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon, gradient, delay = '0s' }) {
  return (
    <div style={{
      background: gradient, borderRadius: 16, padding: '18px 20px',
      color: '#fff', animation: `ad-card-up .9s cubic-bezier(0.34,1.56,0.64,1) ${delay} both`,
      boxShadow: '0 4px 18px rgba(0,0,0,.18)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.75 }}>{label}</span>
        <span style={{ fontSize: 22, opacity: 0.85 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>{value}</div>
    </div>
  );
}

/* ── Section header ────────────────────────────────────────────────────────── */
function SectionTitle({ children, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{children}</h3>
      {action}
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
function Badge({ label, color }) {
  const colors = {
    green:  { bg:'#dcfce7', text:'#16a34a' },
    yellow: { bg:'#fef3c7', text:'#d97706' },
    red:    { bg:'#fee2e2', text:'#dc2626' },
    blue:   { bg:'#dbeafe', text:'#2563eb' },
    gray:   { bg:'#f1f5f9', text:'#64748b' },
    purple: { bg:'#ede9fe', text:'#7c3aed' },
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', animation:'ad-fadein .2s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'28px 28px 24px', width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,.25)', maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#94a3b8', lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Form field ───────────────────────────────────────────────────────────── */
const inputStyle = { width:'100%', fontSize:13, borderRadius:9, border:'1.5px solid #e2e8f0', padding:'9px 12px', outline:'none', background:'#fafafa', color:'#0f172a', boxSizing:'border-box', transition:'border-color .15s', fontFamily:'inherit' };
function FormField({ label, value, onChange, type='text', placeholder, as, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
      {as === 'select'
        ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle }}
            onFocus={e => (e.target.style.borderColor='#2563eb')} onBlur={e => (e.target.style.borderColor='#e2e8f0')}>{children}</select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...inputStyle }}
            onFocus={e => (e.target.style.borderColor='#2563eb')} onBlur={e => (e.target.style.borderColor='#e2e8f0')} />
      }
    </div>
  );
}

/* ── Confirm dialog ───────────────────────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm" onClose={onCancel}>
      <p style={{ fontSize:14, color:'#475569', marginBottom:24 }}>{message}</p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onCancel} style={{ padding:'9px 20px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569' }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding:'9px 20px', borderRadius:9, border:'none', background:'#dc2626', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>Delete</button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AdminDashboard
══════════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard({ session }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [stats,         setStats]         = useState(null);
  const [users,         setUsers]         = useState([]);
  const [tenants,       setTenants]       = useState([]);
  const [invoices,      setInvoices]      = useState([]);
  const [auditLogs,     setAuditLogs]     = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [toast,         setToast]         = useState(null);

  /* user modal state */
  const [userModal,  setUserModal]  = useState(null);  // null | 'add' | { ...user }
  const [userForm,   setUserForm]   = useState({ username:'', password:'', role:'company', tenant:'', display_name:'', email:'' });
  const [deleteTarget, setDeleteTarget] = useState(null); // { type:'user'|'tenant', id, name }

  /* tenant modal */
  const [tenantModal, setTenantModal] = useState(false);
  const [newTenant,   setNewTenant]   = useState('');

  /* filters */
  const [invoiceFilter, setInvoiceFilter] = useState({ tenant:'', status:'', search:'' });
  const [userSearch,    setUserSearch]    = useState('');
  const [userRoleF,     setUserRoleF]     = useState('');
  const [userStatusF,   setUserStatusF]   = useState('');
  const [auditSearch,   setAuditSearch]   = useState('');
  const [auditActionF,  setAuditActionF]  = useState('');

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, t, inv, al] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/tenants').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/admin/audit').then(r => r.json()),
      ]);
      setStats(s);
      setUsers(Array.isArray(u) ? u : []);
      setTenants(Array.isArray(t) ? t : []);
      setInvoices(Array.isArray(inv) ? inv : []);
      setAuditLogs(Array.isArray(al) ? al : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 8000); return () => clearInterval(t); }, [fetchAll]);

  /* ── User CRUD ── */
  const openAddUser = () => {
    setUserForm({ username:'', password:'', role:'company', tenant: tenants[0]?.name || '', display_name:'', email:'' });
    setUserModal('add');
  };
  const openEditUser = (u) => {
    setUserForm({ username: u.username, password:'', role: u.role, tenant: u.tenant || '', display_name: u.display_name || '', email: u.email || '' });
    setUserModal(u);
  };

  const saveUser = async () => {
    if (!userForm.username || !userForm.role) { showToast('err', 'Username and role are required'); return; }
    if (userModal === 'add' && !userForm.password) { showToast('err', 'Password is required for new users'); return; }
    const isAdd = userModal === 'add';
    const body  = { ...userForm };
    if (!body.password) delete body.password;
    if (body.role !== 'company') body.tenant = null;

    try {
      const url    = isAdd ? '/api/admin/users' : `/api/admin/users/${userModal.id}`;
      const method = isAdd ? 'POST' : 'PATCH';
      const res    = await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) { showToast('err', data.error || 'Failed'); return; }
      showToast('ok', isAdd ? 'User created' : 'User updated');
      setUserModal(null);
      fetchAll();
    } catch { showToast('err', 'Server error'); }
  };

  const toggleUserActive = async (u) => {
    try {
      await fetch(`/api/admin/users/${u.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: !u.active }) });
      fetchAll();
    } catch { showToast('err', 'Failed to update user'); }
  };

  const deleteUser = async (id) => {
    try {
      await fetch(`/api/admin/users/${id}`, { method:'DELETE' });
      showToast('ok', 'User deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch { showToast('err', 'Failed to delete user'); }
  };

  /* ── Tenant CRUD ── */
  const addTenant = async () => {
    if (!newTenant.trim()) { showToast('err', 'Tenant name required'); return; }
    try {
      const res  = await fetch('/api/admin/tenants', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: newTenant.trim() }) });
      const data = await res.json();
      if (!res.ok) { showToast('err', data.error || 'Failed'); return; }
      showToast('ok', 'Tenant added');
      setNewTenant('');
      setTenantModal(false);
      fetchAll();
    } catch { showToast('err', 'Server error'); }
  };

  const deleteTenant = async (id) => {
    try {
      await fetch(`/api/admin/tenants/${id}`, { method:'DELETE' });
      showToast('ok', 'Tenant removed');
      setDeleteTarget(null);
      fetchAll();
    } catch { showToast('err', 'Failed'); }
  };

  /* ── Derived data ── */
  const filteredInvoices = invoices.filter(inv => {
    if (invoiceFilter.tenant && inv.tenant_name !== invoiceFilter.tenant) return false;
    if (invoiceFilter.status && inv.status !== invoiceFilter.status) return false;
    const q = (invoiceFilter.search || '').toLowerCase();
    if (q && !(inv.extracted_data?.vendor||'').toLowerCase().includes(q) && !(inv.extracted_data?.invoice_number||'').toLowerCase().includes(q) && !(inv.tenant_name||'').toLowerCase().includes(q)) return false;
    return true;
  });

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    if (q && !u.username?.toLowerCase().includes(q) && !(u.display_name||'').toLowerCase().includes(q) && !(u.email||'').toLowerCase().includes(q)) return false;
    if (userRoleF && u.role !== userRoleF) return false;
    if (userStatusF === 'active' && !u.active) return false;
    if (userStatusF === 'inactive' && u.active) return false;
    return true;
  });

  const filteredAudit = auditLogs.filter(log => {
    const q = auditSearch.toLowerCase();
    if (q && !(log.performed_by||'').toLowerCase().includes(q) && !(log.tenant_name||'').toLowerCase().includes(q) && !(log.invoice_number||'').toLowerCase().includes(q)) return false;
    if (auditActionF && log.action !== auditActionF) return false;
    return true;
  });

  const statusBadge = (s) => ({ approved:'green', extracted:'yellow', processing:'blue', error:'red' }[s] || 'gray');
  const roleBadge   = (r) => ({ admin:'purple', accountant:'blue', company:'green' }[r] || 'gray');

  const navItems = [
    { key:'overview', label:'Overview',     icon:'📊' },
    { key:'users',    label:'Users',        icon:'👥' },
    { key:'tenants',  label:'Companies',    icon:'🏢' },
    { key:'invoices', label:'All Invoices', icon:'📄' },
    { key:'audit',    label:'Audit Log',    icon:'📋' },
  ];

  const KPI_DEFS = stats ? [
    { label:'Total Invoices',  value: fmt(stats.totalInvoices),  icon:'📄', gradient:'linear-gradient(135deg,#4f46e5,#6366f1)', delay:'0.20s' },
    { label:'Pending Review',  value: fmt(stats.pendingInvoices),icon:'⏳', gradient:'linear-gradient(135deg,#d97706,#f59e0b)', delay:'0.33s' },
    { label:'Approved',        value: fmt(stats.approvedInvoices),icon:'✅', gradient:'linear-gradient(135deg,#059669,#10b981)', delay:'0.46s' },
    { label:'Active Users',    value: fmt(stats.totalUsers),     icon:'👥', gradient:'linear-gradient(135deg,#1d4ed8,#3b82f6)', delay:'0.59s' },
    { label:'Companies',       value: fmt(stats.totalTenants),   icon:'🏢', gradient:'linear-gradient(135deg,#be185d,#ec4899)', delay:'0.72s' },
    { label:'Total Value (₹)', value: `₹${fmt(stats.totalValue)}`, icon:'💰', gradient:'linear-gradient(135deg,#7c3aed,#8b5cf6)', delay:'0.85s' },
  ] : [];

  return (
    <div style={{ animation:'ad-fadein .5s ease both' }}>
      <style>{ADMIN_STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:24, right:24, background: toast.type === 'ok' ? '#16a34a' : '#dc2626', color:'#fff', padding:'10px 22px', borderRadius:10, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,.18)', zIndex:9999, animation:'ad-fadein .2s ease' }}>
          {toast.type === 'ok' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete ${deleteTarget.type} "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={() => deleteTarget.type === 'user' ? deleteUser(deleteTarget.id) : deleteTenant(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* User modal */}
      {userModal && (
        <Modal title={userModal === 'add' ? 'Add New User' : `Edit User — ${userModal.username}`} onClose={() => setUserModal(null)}>
          <FormField label="Username *" value={userForm.username} onChange={v => setUserForm(p => ({ ...p, username:v }))} placeholder="john_doe" />
          <FormField label={userModal === 'add' ? 'Password *' : 'New Password (leave blank to keep)'} value={userForm.password} onChange={v => setUserForm(p => ({ ...p, password:v }))} type="password" placeholder="••••••••" />
          <FormField label="Role *" value={userForm.role} onChange={v => setUserForm(p => ({ ...p, role:v }))} as="select">
            <option value="company">Company</option>
            <option value="accountant">Accountant</option>
            <option value="admin">Admin</option>
          </FormField>
          {userForm.role === 'company' && (
            <FormField label="Company (Tenant)" value={userForm.tenant} onChange={v => setUserForm(p => ({ ...p, tenant:v }))} as="select">
              {tenants.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </FormField>
          )}
          <FormField label="Display Name" value={userForm.display_name} onChange={v => setUserForm(p => ({ ...p, display_name:v }))} placeholder="Full name" />
          <FormField label="Email" value={userForm.email} onChange={v => setUserForm(p => ({ ...p, email:v }))} type="email" placeholder="user@example.com" />
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={() => setUserModal(null)} style={{ flex:1, padding:'10px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569' }}>Cancel</button>
            <button onClick={saveUser} style={{ flex:2, padding:'10px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>
              {userModal === 'add' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Tenant modal */}
      {tenantModal && (
        <Modal title="Add Company" onClose={() => setTenantModal(false)}>
          <FormField label="Company Name *" value={newTenant} onChange={setNewTenant} placeholder="Acme Corp" />
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={() => setTenantModal(false)} style={{ flex:1, padding:'10px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569' }}>Cancel</button>
            <button onClick={addTenant} style={{ flex:2, padding:'10px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>Add Company</button>
          </div>
        </Modal>
      )}

      {/* ── Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #4f46e5 100%)',
        borderRadius: 18, padding: '22px 28px', marginBottom: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(37,99,235,.3)', animation: 'ad-banner 1.0s ease both',
        color: '#fff',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>Admin Console</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Platform Management</h2>
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 3 }}>Logged in as {session?.display_name || session?.username || 'Admin'}</div>
        </div>
        <button onClick={fetchAll} disabled={loading}
          style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'8px 18px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, backdropFilter:'blur(8px)' }}>
          {loading ? '⟳' : '↺ Refresh'}
        </button>
      </div>

      {/* ── Nav tabs ── */}
      <div style={{ display:'flex', gap:6, marginBottom:22, flexWrap:'wrap' }}>
        {navItems.map(n => (
          <button key={n.key} onClick={() => setActiveSection(n.key)}
            style={{ padding:'8px 16px', borderRadius:10, border:`1.5px solid ${activeSection === n.key ? '#2563eb' : '#e2e8f0'}`, background: activeSection === n.key ? '#eff6ff' : '#fff', color: activeSection === n.key ? '#2563eb' : '#475569', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all .15s' }}>
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════ */}
      {activeSection === 'overview' && (
        <div>
          {/* KPI grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:24 }}>
            {KPI_DEFS.map(k => <KpiCard key={k.label} {...k} />)}
          </div>

          {/* Tenant breakdown */}
          <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.07)', border:'1px solid #f1f5f9', marginBottom:20 }}>
            <SectionTitle>Company Breakdown</SectionTitle>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                    {['Company','Total Invoices','Approved','Pending','Total Value (₹)'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats?.tenantBreakdown || []).map((t, i) => (
                    <tr key={t.name} style={{ borderBottom:'1px solid #f8fafc', animation:`ad-row-in .5s ease ${i * 0.07}s both` }}>
                      <td style={{ padding:'10px 10px', fontWeight:700, color:'#0f172a' }}>{t.name}</td>
                      <td style={{ padding:'10px 10px', color:'#475569' }}>{t.total}</td>
                      <td style={{ padding:'10px 10px' }}><Badge label={t.approved} color="green" /></td>
                      <td style={{ padding:'10px 10px' }}><Badge label={t.pending} color={t.pending > 0 ? 'yellow' : 'gray'} /></td>
                      <td style={{ padding:'10px 10px', color:'#0f172a', fontWeight:600 }}>₹{fmt(t.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ USERS ══════════════ */}
      {activeSection === 'users' && (
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.07)', border:'1px solid #f1f5f9' }}>
          <SectionTitle action={
            <button onClick={openAddUser}
              style={{ padding:'8px 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              + Add User
            </button>
          }>User Management</SectionTitle>

          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:'1 1 200px', minWidth:170 }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#94a3b8', pointerEvents:'none' }}>🔍</span>
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search username, name, email…"
                style={{ width:'100%', padding:'8px 10px 8px 32px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, outline:'none', background:'#fafafa', color:'#0f172a', boxSizing:'border-box' }}
                onFocus={e => (e.target.style.borderColor='#2563eb')} onBlur={e => (e.target.style.borderColor='#e2e8f0')} />
            </div>
            <select value={userRoleF} onChange={e => setUserRoleF(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, background:'#fafafa', color: userRoleF ? '#0f172a' : '#94a3b8', outline:'none', cursor:'pointer', minWidth:130 }}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="accountant">Accountant</option>
              <option value="company">Company</option>
            </select>
            <select value={userStatusF} onChange={e => setUserStatusF(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, background:'#fafafa', color: userStatusF ? '#0f172a' : '#94a3b8', outline:'none', cursor:'pointer', minWidth:120 }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(userSearch || userRoleF || userStatusF) && (
              <button onClick={() => { setUserSearch(''); setUserRoleF(''); setUserStatusF(''); }}
                style={{ padding:'8px 14px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:12, fontWeight:600, color:'#64748b', cursor:'pointer', whiteSpace:'nowrap' }}>
                ✕ Clear
              </button>
            )}
            <span style={{ fontSize:12, color:'#94a3b8', marginLeft:'auto', whiteSpace:'nowrap' }}>{filteredUsers.length} of {users.length}</span>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                  {['User','Role','Company','Email','Status','Actions'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom:'1px solid #f8fafc', animation:`ad-row-in .5s ease ${i * 0.05}s both` }}>
                    <td style={{ padding:'10px 10px' }}>
                      <div style={{ fontWeight:700, color:'#0f172a' }}>{u.display_name || u.username}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>@{u.username}</div>
                    </td>
                    <td style={{ padding:'10px 10px' }}><Badge label={u.role} color={roleBadge(u.role)} /></td>
                    <td style={{ padding:'10px 10px', color:'#475569' }}>{u.tenant || '—'}</td>
                    <td style={{ padding:'10px 10px', color:'#64748b', fontSize:12 }}>{u.email || '—'}</td>
                    <td style={{ padding:'10px 10px' }}>
                      <button onClick={() => toggleUserActive(u)}
                        style={{ padding:'3px 10px', borderRadius:99, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background: u.active ? '#dcfce7' : '#fee2e2', color: u.active ? '#16a34a' : '#dc2626' }}>
                        {u.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td style={{ padding:'10px 10px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => openEditUser(u)}
                          style={{ padding:'5px 12px', borderRadius:7, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#2563eb' }}>Edit</button>
                        <button onClick={() => setDeleteTarget({ type:'user', id: u.id, name: u.username })}
                          style={{ padding:'5px 12px', borderRadius:7, border:'1.5px solid #fee2e2', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#dc2626' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════ TENANTS / COMPANIES ══════════════ */}
      {activeSection === 'tenants' && (
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.07)', border:'1px solid #f1f5f9' }}>
          <SectionTitle action={
            <button onClick={() => setTenantModal(true)}
              style={{ padding:'8px 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              + Add Company
            </button>
          }>Company Management</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
            {tenants.map((t, i) => {
              const breakdown = stats?.tenantBreakdown?.find(b => b.name === t.name) || {};
              return (
                <div key={t.id} style={{ background:'#f8fafc', borderRadius:14, padding:'16px 18px', border:'1.5px solid #e2e8f0', animation:`ad-card-up .7s ease ${i * 0.1}s both` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:2 }}>🏢 {t.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>Added {fmtDate(t.created_at)}</div>
                    </div>
                    <button onClick={() => setDeleteTarget({ type:'tenant', id: t.id, name: t.name })}
                      style={{ background:'#fee2e2', border:'none', borderRadius:7, padding:'4px 8px', cursor:'pointer', fontSize:12, color:'#dc2626', fontWeight:600 }}>✕</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { l:'Invoices', v: breakdown.total ?? 0 },
                      { l:'Approved', v: breakdown.approved ?? 0 },
                      { l:'Pending',  v: breakdown.pending ?? 0 },
                      { l:'Value',    v: `₹${fmt(breakdown.total_value ?? 0)}` },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ background:'#fff', borderRadius:9, padding:'8px 10px', border:'1px solid #f1f5f9' }}>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:.5 }}>{l}</div>
                        <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginTop:2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ ALL INVOICES ══════════════ */}
      {activeSection === 'invoices' && (
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.07)', border:'1px solid #f1f5f9' }}>
          <SectionTitle>Live Invoice Monitor</SectionTitle>
          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:'1 1 190px', minWidth:160 }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#94a3b8', pointerEvents:'none' }}>🔍</span>
              <input type="text" value={invoiceFilter.search} onChange={e => setInvoiceFilter(p => ({ ...p, search:e.target.value }))} placeholder="Search vendor, invoice#…"
                style={{ width:'100%', padding:'8px 10px 8px 32px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, outline:'none', background:'#fafafa', color:'#0f172a', boxSizing:'border-box' }}
                onFocus={e => (e.target.style.borderColor='#2563eb')} onBlur={e => (e.target.style.borderColor='#e2e8f0')} />
            </div>
            <select value={invoiceFilter.tenant} onChange={e => setInvoiceFilter(p => ({ ...p, tenant:e.target.value }))}
              style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, background:'#fafafa', color: invoiceFilter.tenant ? '#0f172a' : '#94a3b8', outline:'none', cursor:'pointer', minWidth:160 }}>
              <option value="">All Companies</option>
              {tenants.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <select value={invoiceFilter.status} onChange={e => setInvoiceFilter(p => ({ ...p, status:e.target.value }))}
              style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, background:'#fafafa', color: invoiceFilter.status ? '#0f172a' : '#94a3b8', outline:'none', cursor:'pointer', minWidth:140 }}>
              <option value="">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="extracted">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="error">Error</option>
            </select>
            {(invoiceFilter.search || invoiceFilter.tenant || invoiceFilter.status) && (
              <button onClick={() => setInvoiceFilter({ tenant:'', status:'', search:'' })}
                style={{ padding:'8px 14px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:12, fontWeight:600, color:'#64748b', cursor:'pointer', whiteSpace:'nowrap' }}>
                ✕ Clear
              </button>
            )}
            <span style={{ fontSize:12, color:'#94a3b8', marginLeft:'auto', whiteSpace:'nowrap' }}>Showing {filteredInvoices.length} of {invoices.length}</span>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                  {['Invoice #','Company','Vendor','Date','Amount (₹)','Tax (₹)','Status','Uploaded'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.5, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom:'1px solid #f8fafc', animation:`ad-row-in .4s ease ${Math.min(i, 20) * 0.04}s both` }}>
                    <td style={{ padding:'9px 10px', fontWeight:700, color:'#0f172a', fontSize:12 }}>{inv.extracted_data?.invoice_number || '—'}</td>
                    <td style={{ padding:'9px 10px', color:'#475569' }}>{inv.tenant_name}</td>
                    <td style={{ padding:'9px 10px', color:'#475569' }}>{inv.extracted_data?.vendor || '—'}</td>
                    <td style={{ padding:'9px 10px', color:'#64748b', fontSize:12 }}>{inv.extracted_data?.invoice_date || '—'}</td>
                    <td style={{ padding:'9px 10px', fontWeight:600, color:'#0f172a' }}>₹{fmt(inv.extracted_data?.total_amount)}</td>
                    <td style={{ padding:'9px 10px', color:'#64748b' }}>₹{fmt(inv.extracted_data?.tax_amount)}</td>
                    <td style={{ padding:'9px 10px' }}><Badge label={{ processing:'Processing', extracted:'Pending', approved:'Approved', error:'Error' }[inv.status] || inv.status} color={statusBadge(inv.status)} /></td>
                    <td style={{ padding:'9px 10px', color:'#94a3b8', fontSize:11 }}>{fmtDate(inv.uploaded_at)}</td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr><td colSpan={8} style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No invoices match the selected filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════ AUDIT LOG ══════════════ */}
      {activeSection === 'audit' && (
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,.07)', border:'1px solid #f1f5f9' }}>
          <SectionTitle>Audit Log</SectionTitle>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:'1 1 200px', minWidth:170 }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#94a3b8', pointerEvents:'none' }}>🔍</span>
              <input type="text" value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search user, company, invoice…"
                style={{ width:'100%', padding:'8px 10px 8px 32px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, outline:'none', background:'#fafafa', color:'#0f172a', boxSizing:'border-box' }}
                onFocus={e => (e.target.style.borderColor='#2563eb')} onBlur={e => (e.target.style.borderColor='#e2e8f0')} />
            </div>
            <select value={auditActionF} onChange={e => setAuditActionF(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:13, background:'#fafafa', color: auditActionF ? '#0f172a' : '#94a3b8', outline:'none', cursor:'pointer', minWidth:140 }}>
              <option value="">All Actions</option>
              {['approved','rejected','uploaded','edited','deleted'].map(a => (
                <option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>
              ))}
            </select>
            {(auditSearch || auditActionF) && (
              <button onClick={() => { setAuditSearch(''); setAuditActionF(''); }}
                style={{ padding:'8px 14px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:12, fontWeight:600, color:'#64748b', cursor:'pointer', whiteSpace:'nowrap' }}>
                ✕ Clear
              </button>
            )}
            <span style={{ fontSize:12, color:'#94a3b8', marginLeft:'auto', whiteSpace:'nowrap' }}>{filteredAudit.length} of {auditLogs.length}</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                  {['Invoice #','Company','Action','Performed By','Role','When'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.5, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((log, i) => (
                  <tr key={log.id} style={{ borderBottom:'1px solid #f8fafc', animation:`ad-row-in .4s ease ${Math.min(i, 20) * 0.04}s both` }}>
                    <td style={{ padding:'9px 10px', fontWeight:700, color:'#0f172a', fontSize:12 }}>{log.invoice_number || '—'}</td>
                    <td style={{ padding:'9px 10px', color:'#475569' }}>{log.tenant_name || '—'}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <Badge label={log.action}
                        color={{ approved:'green', rejected:'red', uploaded:'blue', edited:'yellow', deleted:'red' }[log.action] || 'gray'} />
                    </td>
                    <td style={{ padding:'9px 10px', color:'#475569' }}>{log.performed_by}</td>
                    <td style={{ padding:'9px 10px' }}><Badge label={log.performed_role || '—'} color={roleBadge(log.performed_role)} /></td>
                    <td style={{ padding:'9px 10px', color:'#94a3b8', fontSize:11 }}>{fmtDate(log.performed_at)}</td>
                  </tr>
                ))}
                {filteredAudit.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
                    {auditLogs.length === 0 ? 'No audit events recorded yet' : 'No events match your filters'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
