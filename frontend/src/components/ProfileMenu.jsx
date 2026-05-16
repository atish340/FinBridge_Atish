import { useState, useRef, useEffect } from 'react';

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CFG = {
  platform_admin: { label: 'Platform Admin', color: '#7c3aed', light: '#f5f3ff' },
  firm_admin:     { label: 'Firm Admin',      color: '#2563eb', light: '#eff6ff' },
  accountant:     { label: 'Accountant',      color: '#0891b2', light: '#ecfeff' },
  company_admin:  { label: 'Company Admin',   color: '#0f766e', light: '#f0fdfa' },
  company_user:   { label: 'Company User',    color: '#059669', light: '#f0fdf4' },
};

function roleCfg(role) {
  return ROLE_CFG[role] || { label: role, color: '#6366f1', light: '#eef2ff' };
}

function getDisplayName(session) {
  return session.display_name || session.username || 'User';
}

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return '';
}

function getSubtitle(session) {
  if (session.company_name) return session.company_name;
  if (session.firm_name)    return session.firm_name;
  if (session.role === 'platform_admin') return 'InvoSmart Platform';
  return '';
}

// ─── Default person-icon SVG ─────────────────────────────────────────────────

function PersonIcon({ size }) {
  const s = Math.round(size * 0.54);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7.5" r="4" fill="rgba(255,255,255,0.92)" />
      <path d="M3.5 20.5c0-4.14 3.81-7.5 8.5-7.5s8.5 3.36 8.5 7.5"
        stroke="rgba(255,255,255,0.92)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// ─── Avatar circle ────────────────────────────────────────────────────────────

function AvatarCircle({ session, size = 36, src }) {
  const cfg      = roleCfg(session?.role);
  const name     = getDisplayName(session);
  const initials = getInitials(name);

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: src ? 'transparent' : `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color}bb 100%)`,
      boxShadow: `0 2px 8px ${cfg.color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', userSelect: 'none',
    }}>
      {src ? (
        <img src={src} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : initials ? (
        <span style={{ color: '#fff', fontWeight: 800, fontSize: Math.round(size * 0.36), lineHeight: 1 }}>
          {initials}
        </span>
      ) : (
        <PersonIcon size={size} />
      )}
    </div>
  );
}

// ─── Change Password modal ────────────────────────────────────────────────────

function ChangePasswordModal({ session, onClose }) {
  const [form,     setForm]     = useState({ current: '', next: '', confirm: '' });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [apiErr,   setApiErr]   = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const score = () => {
    const p = form.next;
    return [p.length >= 6, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  };
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score()];
  const strColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#16a34a'][score()];

  const save = async () => {
    const e = {};
    if (!form.current)               e.current = 'Required';
    if (form.next.length < 6)        e.next    = 'Minimum 6 characters';
    if (form.next !== form.confirm)  e.confirm = 'Passwords do not match';
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const verify = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: session.username, password: form.current }),
      });
      if (!verify.ok) { setErrors({ current: 'Current password is incorrect' }); setSaving(false); return; }
      const r = await fetch(`/api/firm/users/${session.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.next }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setApiErr(err.message);
    }
    setSaving(false);
  };

  const cfg = roleCfg(session?.role);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 28px 64px rgba(0,0,0,.22)' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />
        <div style={{ padding: '26px 28px 28px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>Password Updated!</div>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Your password has been changed successfully.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>🔑 Change Password</div>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Update your account password</p>
                </div>
                <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#64748b' }}>✕</button>
              </div>

              {[
                { key: 'current', label: 'Current Password',  icon: '🔒', ph: 'Enter current password'  },
                { key: 'next',    label: 'New Password',       icon: '🔑', ph: 'Minimum 6 characters'    },
                { key: 'confirm', label: 'Confirm Password',   icon: '✅', ph: 'Repeat new password'      },
              ].map(({ key, label, icon, ph }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>{icon}</span>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="input"
                      placeholder={ph}
                      value={form[key]}
                      onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
                      style={{ paddingLeft: 36, borderColor: errors[key] ? '#fca5a5' : undefined, background: errors[key] ? '#fff5f5' : undefined }}
                    />
                  </div>
                  {errors[key] && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>⚠ {errors[key]}</p>}
                  {key === 'next' && form.next && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#94a3b8' }}>
                        <span>Password strength</span>
                        <span style={{ color: strColor, fontWeight: 600 }}>{strLabel}</span>
                      </div>
                      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${score() * 25}%`, height: '100%', background: strColor, borderRadius: 2, transition: 'all .3s' }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={() => setShowPwd(p => !p)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                {showPwd ? '🙈 Hide' : '👁 Show'} passwords
              </button>

              {apiErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 14 }}>
                  ❌ {apiErr}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                <button
                  disabled={saving}
                  onClick={save}
                  style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}
                >
                  {saving ? '⏳ Saving…' : 'Update Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Account Settings modal ───────────────────────────────────────────────────

function AccountModal({ session, onClose, avatarSrc, onAvatarChange }) {
  const fileRef               = useRef(null);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');
  const [name,    setName]    = useState(session.display_name || session.username || '');
  const cfg                   = roleCfg(session.role);
  const subtitle              = getSubtitle(session);

  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handlePhoto = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => onAvatarChange(ev.target.result);
    r.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true); setApiErr('');
    try {
      const r = await fetch(`/api/firm/users/${session.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setApiErr(err.message);
    }
    setSaving(false);
  };

  const fields = [
    { label: 'Full Name',     value: name,                    onChange: setName, editable: true  },
    { label: 'Username',      value: session.username || '—', onChange: null,    editable: false },
    { label: 'Email Address', value: session.email    || '—', onChange: null,    editable: false },
    { label: 'Role',          value: cfg.label,               onChange: null,    editable: false },
    ...(subtitle ? [{ label: session.company_name ? 'Company' : 'Firm', value: subtitle, onChange: null, editable: false }] : []),
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 28px 64px rgba(0,0,0,.22)' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }} />

        {/* Profile banner */}
        <div style={{ background: `linear-gradient(135deg, ${cfg.color}14, ${cfg.color}06)`, padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 13, color: '#64748b' }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ position: 'relative', cursor: 'pointer', borderRadius: '50%' }} onClick={() => fileRef.current?.click()} title="Click to change photo">
              <AvatarCircle session={session} size={68} src={avatarSrc} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '.18s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <span style={{ fontSize: 20 }}>📷</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{name || session.username}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{cfg.label}</div>
              {subtitle && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{subtitle}</div>}
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>📷 Click avatar to upload a profile photo</p>
        </div>

        {/* Form fields */}
        <div style={{ padding: '20px 28px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: .6 }}>Account Information</div>
          {fields.map(({ label, value, onChange, editable }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>{label}</label>
              <input
                className="input"
                value={value}
                readOnly={!editable}
                onChange={editable ? e => onChange(e.target.value) : undefined}
                style={{ background: editable ? '#fff' : '#f8fafc', color: editable ? '#0f172a' : '#64748b', cursor: editable ? 'text' : 'default' }}
              />
            </div>
          ))}

          {apiErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 10 }}>
              ❌ {apiErr}
            </div>
          )}

          {saved ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#16a34a', fontWeight: 600, textAlign: 'center', marginTop: 18 }}>
              ✅ Changes saved successfully!
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button
                disabled={saving}
                onClick={handleSave}
                style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}
              >
                {saving ? '⏳ Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ProfileMenu ─────────────────────────────────────────────────────────

export default function ProfileMenu({ session, onLogout }) {
  const [open,        setOpen]        = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [avatarSrc,   setAvatarSrc]   = useState(() => {
    try { return localStorage.getItem(`fb_avatar_${session.id || session.username}`) || ''; } catch { return ''; }
  });
  const ref = useRef(null);

  const saveAvatar = src => {
    setAvatarSrc(src);
    try { localStorage.setItem(`fb_avatar_${session.id || session.username}`, src); } catch {}
  };

  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const cfg         = roleCfg(session.role);
  const displayName = getDisplayName(session);
  const subtitle    = getSubtitle(session);

  const menuItems = [
    { icon: '👤', label: 'Account Settings', action: () => { setShowAccount(true); setOpen(false); } },
    { icon: '🔑', label: 'Change Password',  action: () => { setShowPass(true);    setOpen(false); } },
  ];

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>

        {/* ── Trigger button ── */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '4px 10px 4px 4px',
            background: '#fff', border: `1.5px solid ${open ? cfg.color : '#e2e8f0'}`,
            borderRadius: 99, cursor: 'pointer', transition: 'all .15s',
            boxShadow: open ? `0 0 0 3px ${cfg.color}20` : 'none',
          }}
        >
          <AvatarCircle session={session} size={32} src={avatarSrc} />
          <div style={{ lineHeight: 1.3, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{cfg.label}</div>
          </div>
          <span style={{ fontSize: 9, color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 9px)', right: 0,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 17,
            boxShadow: '0 16px 44px rgba(0,0,0,.13)', minWidth: 248, zIndex: 600, overflow: 'hidden',
          }}>
            {/* Profile header */}
            <div style={{ padding: '16px 18px', background: `linear-gradient(135deg, ${cfg.color}14, transparent)`, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AvatarCircle session={session} size={46} src={avatarSrc} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{cfg.label}</div>
                  {subtitle && (
                    <div style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4, background: cfg.light, color: cfg.color, borderRadius: 99, padding: '2px 9px', fontSize: 10, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🏢 {subtitle}
                    </div>
                  )}
                  {session.email && (
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {session.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: '6px 0' }}>
              {menuItems.map(item => (
                <button key={item.label} onClick={item.action} style={{
                  width: '100%', padding: '10px 18px', border: 'none', background: 'none',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11,
                  fontSize: 13, cursor: 'pointer', color: '#374151', transition: 'background .1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 10px' }} />

              <button
                onClick={() => { setOpen(false); onLogout(); }}
                style={{
                  width: '100%', padding: '10px 18px', border: 'none', background: 'none',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11,
                  fontSize: 13, cursor: 'pointer', color: '#dc2626', transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>🚪</span>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {showPass    && <ChangePasswordModal session={session} onClose={() => setShowPass(false)} />}
      {showAccount && (
        <AccountModal
          session={session}
          avatarSrc={avatarSrc}
          onAvatarChange={saveAvatar}
          onClose={() => setShowAccount(false)}
        />
      )}
    </>
  );
}
