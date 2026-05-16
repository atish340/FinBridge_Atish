import { useState, useEffect } from 'react';
import { LogoIcon } from './Logo';

const FEATURES = [
  { icon: '⚡', title: 'AI Extraction'   },
  { icon: '📊', title: 'Smart Analytics' },
  { icon: '🔐', title: 'Multi-Tenant'    },
  { icon: '📤', title: 'Export Ready'    },
];

const ANIM_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --sat: env(safe-area-inset-top,    0px);
    --sab: env(safe-area-inset-bottom, 0px);
    --sal: env(safe-area-inset-left,   0px);
    --sar: env(safe-area-inset-right,  0px);
  }

  @keyframes lp-fadein  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lp-slidein { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lp-blob1   { 0%,100%{transform:scale(1) translate(0,0);}       50%{transform:scale(1.25) translate(-28px,16px);} }
  @keyframes lp-blob2   { 0%,100%{transform:scale(1) translate(0,0);}       50%{transform:scale(1.2)  translate(22px,-18px);} }
  @keyframes lp-blob3   { 0%,100%{transform:scale(1) translate(0,0);}       50%{transform:scale(1.35) translate(-12px,10px);} }
  @keyframes lp-float-a { 0%,100%{transform:rotate(8deg)  translateY(0);}   50%{transform:rotate(11deg) translateY(-18px);} }
  @keyframes lp-float-b { 0%,100%{transform:rotate(-6deg) translateY(0);}   50%{transform:rotate(-4deg) translateY(16px);} }
  @keyframes lp-ring1   { 0%,100%{transform:translate(-50%,-50%) scale(1);    opacity:.55;} 50%{transform:translate(-50%,-50%) scale(1.14); opacity:.15;} }
  @keyframes lp-ring2   { 0%,100%{transform:translate(-50%,-50%) scale(1);    opacity:.35;} 50%{transform:translate(-50%,-50%) scale(1.2);  opacity:.08;} }
  @keyframes lp-ring3   { 0%,100%{transform:translate(-50%,-50%) scale(1);    opacity:.2;}  50%{transform:translate(-50%,-50%) scale(1.28); opacity:.04;} }
  @keyframes lp-spin-r  { to { transform:translate(-50%,-50%) rotate(360deg); } }
  @keyframes lp-spin-rev{ to { transform:translate(-50%,-50%) rotate(-360deg); } }
  @keyframes lp-orbit   { from{transform:rotate(0deg);}  to{transform:rotate(360deg);} }
  @keyframes lp-deorbit { from{transform:translateY(-108px) rotate(0deg);} to{transform:translateY(-108px) rotate(-360deg);} }
  @keyframes lp-glow    { 0%,100%{box-shadow:0 0 40px rgba(99,102,241,.6),0 0 80px rgba(99,102,241,.3);} 50%{box-shadow:0 0 70px rgba(99,102,241,.85),0 0 130px rgba(99,102,241,.5);} }
  @keyframes lp-shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
  @keyframes lp-toast   { 0%{opacity:0;transform:translateY(10px);} 12%{opacity:1;transform:translateY(0);} 80%{opacity:1;} 100%{opacity:0;} }

  .lp-input {
    width: 100%; border-radius: 10px;
    border: 1.5px solid #e2e8f0;
    padding: 12px 14px;
    outline: none;
    background: #fafafa;
    color: #0f172a;
    font-size: 16px;
    font-family: inherit;
    transition: border-color .15s;
    -webkit-appearance: none;
  }
  .lp-input:focus { border-color: #2563eb; }
  .lp-input.has-right { padding-right: 46px; }

  .lp-demo-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; cursor:pointer; border-bottom:1px solid #f8fafc; gap:8px; }
  .lp-demo-row:last-of-type { border-bottom:none; }
  .lp-demo-row:active { opacity:.7; }

  @media (max-width: 640px) {
    .lp-demo-cred { display:none; }
    .lp-demo-role { font-size:13px !important; }
  }
`;

/* ── Shared input ── */
function Field({ label, value, onChange, type = 'text', placeholder, rightEl, required, autoComplete }) {
  const hasAsterisk = required || (typeof label === 'string' && label.trimEnd().endsWith('*'));
  const cleanLabel  = hasAsterisk ? label.replace(/\s*\*\s*$/, '') : label;
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .6 }}>
        {cleanLabel}{hasAsterisk && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className={`lp-input${rightEl ? ' has-right' : ''}`}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {rightEl && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 17, color: '#94a3b8' }}>
            {rightEl}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Mini orbit pieces ── */
function MiniCard() {
  return (
    <div style={{ width:46, height:34, background:'rgba(255,255,255,.14)', border:'1px solid rgba(255,255,255,.28)', borderRadius:8, padding:'6px 7px', backdropFilter:'blur(4px)' }}>
      <div style={{ height:4, width:'60%', background:'rgba(255,255,255,.55)', borderRadius:2, marginBottom:5 }} />
      <div style={{ height:3, width:'80%', background:'rgba(255,255,255,.28)', borderRadius:2, marginBottom:3 }} />
      <div style={{ height:3, width:'50%', background:'rgba(96,165,250,.7)',   borderRadius:2 }} />
    </div>
  );
}
function MiniChip({ color, children }) {
  return (
    <div style={{ width:36, height:36, borderRadius:10, background:color, border:'1px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, backdropFilter:'blur(4px)' }}>
      {children}
    </div>
  );
}

/* ── Animated logo ── */
function AnimatedLogo() {
  const items = [
    { delay:'0s',   content:<MiniCard /> },
    { delay:'-5s',  content:<MiniChip color="rgba(99,102,241,.5)">₹</MiniChip> },
    { delay:'-10s', content:<MiniChip color="rgba(16,185,129,.45)">✅</MiniChip> },
  ];
  return (
    <div style={{ position:'relative', width:240, height:240, margin:'0 auto' }}>
      <div style={{ position:'absolute', top:'50%', left:'50%', width:220, height:220, borderRadius:'50%', border:'1.5px solid rgba(99,102,241,.22)', animation:'lp-ring3 4s ease-in-out infinite 1.2s', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'50%', left:'50%', width:182, height:182, borderRadius:'50%', border:'1.5px solid rgba(99,102,241,.38)', animation:'lp-ring2 4s ease-in-out infinite .6s',  pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'50%', left:'50%', width:148, height:148, borderRadius:'50%', border:'2px solid rgba(99,102,241,.55)',   animation:'lp-ring1 4s ease-in-out infinite',      pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'50%', left:'50%', width:182, height:182, borderRadius:'50%', border:'1.5px dashed rgba(255,255,255,.18)', animation:'lp-spin-r  28s linear infinite',       pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'50%', left:'50%', width:128, height:128, borderRadius:'50%', border:'1px dashed rgba(255,255,255,.1)',    animation:'lp-spin-rev 18s linear infinite',       pointerEvents:'none' }} />
      {items.map((item, i) => (
        <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:0, height:0, animation:`lp-orbit 15s linear infinite ${item.delay}` }}>
          <div style={{ animation:`lp-deorbit 15s linear infinite ${item.delay}` }}>{item.content}</div>
        </div>
      ))}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:84, height:84, borderRadius:22, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', animation:'lp-glow 3s ease-in-out infinite' }}>
        <LogoIcon size={50} uid="anim_c" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main LoginPage
══════════════════════════════════════════════════════════ */
export default function LoginPage({ onLogin }) {
  const [view,      setView]      = useState('login');
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [toast,     setToast]     = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);

  /* signup fields */
  const [su, setSu] = useState({ name:'', email:'', cell:'', company:'', username:'', password:'', confirm:'', role:'' });
  const setSuF = (k, v) => setSu(p => ({ ...p, [k]: v }));

  /* forgot-password fields */
  const [fp, setFp] = useState({ email:'', password:'', confirm:'' });
  const setFpF = (k, v) => setFp(p => ({ ...p, [k]: v }));

  /* track viewport width */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSignIn = async () => {
    if (!username.trim()) { showToast('err', 'Please enter your username.'); return; }
    if (!password)        { showToast('err', 'Please enter your password.'); return; }
    setSigningIn(true);
    try {
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) });
      const data = await res.json();
      if (!res.ok) { showToast('err', data.error || 'Invalid credentials'); return; }
      onLogin(data);
    } catch {
      showToast('err', 'Server unavailable. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignup = () => {
    if (!su.name || !su.email || !su.cell || !su.username || !su.password) {
      showToast('err', 'Please fill in all required fields.'); return;
    }
    if (su.password !== su.confirm) { showToast('err', 'Passwords do not match.'); return; }
    showToast('ok', 'Account created! You can now sign in.');
    setTimeout(() => { setView('login'); setSu({ name:'', email:'', cell:'', company:'', username:'', password:'', confirm:'', role:'' }); }, 1800);
  };

  const handleForgot = () => {
    if (!fp.email)    { showToast('err', 'Please enter your email.'); return; }
    if (!fp.password) { showToast('err', 'Please enter a new password.'); return; }
    if (fp.password !== fp.confirm) { showToast('err', 'Passwords do not match.'); return; }
    showToast('ok', 'Password reset! You can now sign in.');
    setTimeout(() => { setView('login'); setFp({ email:'', password:'', confirm:'' }); }, 1800);
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: 18,
    padding: isMobile ? '22px 18px 18px' : '26px 26px 22px',
    boxShadow: '0 4px 28px rgba(0,0,0,.09)',
    border: '1px solid #e2e8f0',
  };

  const primaryBtn = (disabled) => ({
    width: '100%',
    padding: '14px',
    borderRadius: 12,
    border: 'none',
    background: disabled ? '#e2e8f0' : 'linear-gradient(270deg,#2563eb,#7c3aed,#2563eb)',
    backgroundSize: disabled ? 'auto' : '300% 100%',
    animation: disabled ? 'none' : 'lp-shimmer 3s linear infinite',
    color: disabled ? '#94a3b8' : '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: .2,
    boxShadow: disabled ? 'none' : '0 4px 18px rgba(37,99,235,.3)',
    minHeight: 52,
    WebkitTapHighlightColor: 'transparent',
  });

  const BackLink = () => (
    <button
      onClick={() => setView('login')}
      style={{ background:'none', border:'none', color:'#2563eb', fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:16, padding:'8px 0', display:'flex', alignItems:'center', gap:4, minHeight:44, WebkitTapHighlightColor:'transparent' }}
    >
      ← Back to sign in
    </button>
  );

  const DEMO_CREDS = [
    { role:'Platform Admin', user:'platform_admin', pwd:'platform123', color:'#7c3aed' },
    { role:'Firm Admin',     user:'firm_admin',     pwd:'firm123',     color:'#2563eb' },
    { role:'Accountant',     user:'accountant1',    pwd:'acc123',      color:'#0891b2' },
    { role:'Company Admin',  user:'acme_admin',     pwd:'comp123',     color:'#059669' },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100dvh', fontFamily:"'Inter', system-ui, sans-serif", background:'#f8fafc' }}>
      <style>{ANIM_CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top: isMobile ? 16 : 24, right: isMobile ? 16 : 24, left: isMobile ? 16 : 'auto',
          background: toast.type === 'ok' ? '#16a34a' : '#dc2626',
          color:'#fff', padding:'12px 18px', borderRadius:12, fontSize:14, fontWeight:600,
          boxShadow:'0 4px 20px rgba(0,0,0,.2)', zIndex:9999,
          animation:'lp-toast 3.2s ease forwards',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          {toast.type === 'ok' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* ── Left brand panel (desktop only) ── */}
      {!isMobile && (
        <div style={{
          flex: '0 0 50%',
          background: 'linear-gradient(155deg, #0f172a 0%, #1e3a8a 48%, #2d1b69 100%)',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '52px 48px',
        }}>
          <div style={{ position:'absolute', top:-100, left:-80,   width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,.42) 0%, transparent 70%)',  pointerEvents:'none', animation:'lp-blob1 9s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:-80, right:-60, width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,.45) 0%, transparent 70%)', pointerEvents:'none', animation:'lp-blob2 11s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'38%', left:'10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,.32) 0%, transparent 70%)',  pointerEvents:'none', animation:'lp-blob3 7s ease-in-out infinite' }} />
          <svg aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.09, pointerEvents:'none' }}>
            <defs><pattern id="dotslp" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="white" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#dotslp)" />
          </svg>
          <div style={{ position:'absolute', left:30, top:80,     opacity:.42, pointerEvents:'none', animation:'lp-float-a 5s ease-in-out infinite' }}><MiniCard /></div>
          <div style={{ position:'absolute', right:22, bottom:65, opacity:.32, pointerEvents:'none', animation:'lp-float-b 6.5s ease-in-out infinite' }}><MiniCard /></div>
          <div style={{ position:'relative', zIndex:1, textAlign:'center', animation:'lp-fadein .8s ease both' }}>
            <AnimatedLogo />
            <div style={{ marginTop:18, fontSize:36, fontWeight:800, color:'#fff', letterSpacing:-1.2, lineHeight:1.1 }}>
              <span style={{ color:'#60a5fa' }}>Invo</span>Smart
            </div>
            <p style={{ marginTop:8, fontSize:13, color:'#94a3b8', lineHeight:1.65, maxWidth:300, margin:'8px auto 0' }}>
              AI-powered invoice processing for modern finance teams.
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:22 }}>
              {FEATURES.map(f => (
                <div key={f.icon} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.14)', borderRadius:20, padding:'5px 13px', fontSize:12, color:'#cbd5e1', fontWeight:600 }}>
                  <span>{f.icon}</span><span>{f.title}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:24, fontSize:12, color:'#475569' }}>Powered by Claude AI · Built for finance teams</div>
          </div>
        </div>
      )}

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isMobile ? 'flex-start' : 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingTop:    isMobile ? 'calc(0px + var(--sat))' : 32,
        paddingBottom: isMobile ? 'calc(24px + var(--sab))' : 32,
        paddingLeft:   isMobile ? 'calc(16px + var(--sal))' : 28,
        paddingRight:  isMobile ? 'calc(16px + var(--sar))' : 28,
      }}>

        {/* ── Mobile top banner ── */}
        {isMobile && (
          <div style={{
            width: '100%',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2d1b69 100%)',
            padding: 'calc(22px + var(--sat)) 24px 28px',
            textAlign: 'center',
            marginBottom: 24,
            borderRadius: '0 0 28px 28px',
            boxShadow: '0 4px 24px rgba(15,23,42,.28)',
          }}>
            <div style={{ width:64, height:64, borderRadius:18, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 4px 18px rgba(99,102,241,.5)', animation:'lp-glow 3s ease-in-out infinite' }}>
              <LogoIcon size={38} uid="mob_top" />
            </div>
            <div style={{ fontSize:24, fontWeight:800, color:'#fff', letterSpacing:-.5, lineHeight:1.1 }}>
              <span style={{ color:'#60a5fa' }}>Invo</span>Smart
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginTop:5 }}>
              AI-powered invoice processing
            </div>
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:14, flexWrap:'wrap' }}>
              {FEATURES.map(f => (
                <div key={f.icon} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:16, padding:'4px 10px', fontSize:11, color:'rgba(255,255,255,.8)', fontWeight:600 }}>
                  <span>{f.icon}</span><span>{f.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Form area ── */}
        <div style={{ width:'100%', maxWidth: isMobile ? 480 : 400, animation:'lp-fadein .6s ease .1s both' }}>

          {/* ── LOGIN ── */}
          {view === 'login' && (
            <>
              {!isMobile && (
                <div style={{ marginBottom:24, textAlign:'center' }}>
                  <h1 style={{ fontSize:26, fontWeight:800, color:'#0f172a', marginBottom:5, letterSpacing:-.5 }}>Welcome back 👋</h1>
                  <p style={{ fontSize:13, color:'#64748b' }}>Sign in to your InvoSmart account</p>
                </div>
              )}
              {isMobile && (
                <div style={{ marginBottom:20 }}>
                  <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', marginBottom:4, letterSpacing:-.4 }}>Welcome back 👋</h1>
                  <p style={{ fontSize:13, color:'#64748b' }}>Sign in to continue</p>
                </div>
              )}

              <div style={cardStyle}>
                <Field label="Username" required value={username} onChange={setUsername} placeholder="Enter your username" autoComplete="username" />
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.6 }}>
                    Password<span style={{ color:'#ef4444', marginLeft:2 }}>*</span>
                  </label>
                  <div style={{ position:'relative' }}>
                    <input
                      className="lp-input has-right"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      onKeyDown={e => { if (e.key === 'Enter') handleSignIn(); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(p => !p)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:17, color:'#94a3b8', padding:4, minWidth:36, minHeight:36, display:'flex', alignItems:'center', justifyContent:'center' }}
                    >
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign:'right', marginBottom:18 }}>
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    style={{ background:'none', border:'none', color:'#2563eb', fontSize:12, fontWeight:600, cursor:'pointer', padding:'4px 0', minHeight:36, WebkitTapHighlightColor:'transparent' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <button onClick={handleSignIn} disabled={signingIn} style={primaryBtn(signingIn)}>
                  {signingIn ? 'Signing in…' : 'Sign in →'}
                </button>
              </div>

              {/* Demo credentials — desktop only */}
              {!isMobile && (
                <div style={{ marginTop:16, background:'#fff', borderRadius:14, padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:10, textTransform:'uppercase', letterSpacing:.6 }}>
                    Demo Credentials — click to fill
                  </p>
                  {DEMO_CREDS.map(c => (
                    <div key={c.user} className="lp-demo-row" onClick={() => { setUsername(c.user); setPassword(c.pwd); }}>
                      <span style={{ fontSize:12, color:c.color, fontWeight:700, flexShrink:0 }}>{c.role}</span>
                      <span style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', textAlign:'right' }}>{c.user} / {c.pwd}</span>
                    </div>
                  ))}
                  <p style={{ fontSize:10, color:'#cbd5e1', marginTop:8, marginBottom:0 }}>Click any row to auto-fill credentials</p>
                </div>
              )}
            </>
          )}

          {/* ── SIGN UP ── */}
          {view === 'signup' && (
            <>
              <BackLink />
              <div style={{ marginBottom:18, textAlign: isMobile ? 'left' : 'center' }}>
                <h1 style={{ fontSize: isMobile ? 21 : 24, fontWeight:800, color:'#0f172a', marginBottom:4, letterSpacing:-.4 }}>Create account 🚀</h1>
                <p style={{ fontSize:13, color:'#64748b' }}>Join InvoSmart to get started</p>
              </div>

              <div style={cardStyle}>
                <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:8, textTransform:'uppercase', letterSpacing:.8 }}>Account type</p>
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {[{ role:'company', icon:'🏢', label:'Company' }, { role:'accountant', icon:'🧮', label:'Accountant' }].map(({ role, icon, label }) => {
                    const active = su.role === role;
                    return (
                      <button key={role} onClick={() => setSuF('role', role)} style={{ flex:1, padding:'12px 8px', borderRadius:12, border:`2px solid ${active ? '#2563eb' : '#e2e8f0'}`, background: active ? '#eff6ff' : '#fafafa', cursor:'pointer', textAlign:'center', transition:'all .15s', outline:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6, minHeight:52, WebkitTapHighlightColor:'transparent' }}>
                        <span style={{ fontSize:18 }}>{icon}</span>
                        <span style={{ fontSize:13, fontWeight:700, color: active ? '#2563eb' : '#0f172a' }}>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Single column on mobile, 2-col on desktop */}
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : '0 12px' }}>
                  <Field label="Full Name *"  value={su.name}     onChange={v => setSuF('name',  v)}    placeholder="Atish Jadhav"     autoComplete="name" />
                  <Field label="Email *"      value={su.email}    onChange={v => setSuF('email', v)}    placeholder="you@example.com"  type="email" autoComplete="email" />
                  <Field label="Mobile No. *" value={su.cell}     onChange={v => setSuF('cell',  v)}    placeholder="+91 98765 43210" type="tel" autoComplete="tel" />
                  <Field label="Username *"   value={su.username} onChange={v => setSuF('username', v)} placeholder="your_username"    autoComplete="username" />
                </div>

                {su.role === 'company' && (
                  <Field label="Company Name" value={su.company} onChange={v => setSuF('company', v)} placeholder="Acme Corp" />
                )}

                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : '0 12px' }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>
                      Password<span style={{ color:'#ef4444', marginLeft:2 }}>*</span>
                    </label>
                    <div style={{ position:'relative', marginBottom:14 }}>
                      <input className="lp-input has-right" type={showPwd ? 'text' : 'password'} value={su.password} onChange={e => setSuF('password', e.target.value)} placeholder="Min 8 chars" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:17, color:'#94a3b8', padding:4, minWidth:36, minHeight:36 }}>{showPwd ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <Field label="Confirm Pwd *" value={su.confirm} onChange={v => setSuF('confirm', v)} type={showPwd ? 'text' : 'password'} placeholder="Repeat password" autoComplete="new-password" />
                </div>

                <button onClick={handleSignup} style={primaryBtn(false)}>Create Account →</button>
              </div>

              <p style={{ textAlign:'center', fontSize:13, color:'#64748b', marginTop:16 }}>
                Already have an account?{' '}
                <button onClick={() => setView('login')} style={{ background:'none', border:'none', color:'#2563eb', fontWeight:700, cursor:'pointer', fontSize:13, padding:0, WebkitTapHighlightColor:'transparent' }}>Sign in</button>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {view === 'forgot' && (
            <>
              <BackLink />
              <div style={{ marginBottom:18, textAlign: isMobile ? 'left' : 'center' }}>
                <h1 style={{ fontSize: isMobile ? 21 : 24, fontWeight:800, color:'#0f172a', marginBottom:4, letterSpacing:-.4 }}>Reset password 🔑</h1>
                <p style={{ fontSize:13, color:'#64748b' }}>Enter your email to reset your password</p>
              </div>

              <div style={cardStyle}>
                <Field label="Email Address *" value={fp.email} onChange={v => setFpF('email', v)} placeholder="you@example.com" type="email" autoComplete="email" />

                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:'#94a3b8', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }}>
                    New Password<span style={{ color:'#ef4444', marginLeft:2 }}>*</span>
                  </label>
                  <div style={{ position:'relative' }}>
                    <input className="lp-input has-right" type={showPwd ? 'text' : 'password'} value={fp.password} onChange={e => setFpF('password', e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:17, color:'#94a3b8', padding:4, minWidth:36, minHeight:36 }}>{showPwd ? '🙈' : '👁️'}</button>
                  </div>
                </div>

                <Field label="Confirm New Password *" value={fp.confirm} onChange={v => setFpF('confirm', v)} type={showPwd ? 'text' : 'password'} placeholder="Repeat new password" autoComplete="new-password" />

                {fp.password && (() => {
                  const score  = [fp.password.length >= 8, /[A-Z]/.test(fp.password), /[0-9]/.test(fp.password), /[^A-Za-z0-9]/.test(fp.password)].filter(Boolean).length;
                  const colors = ['#ef4444','#f59e0b','#3b82f6','#16a34a'];
                  const labels = ['Weak','Fair','Good','Strong'];
                  return (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                        {[0,1,2,3].map(i => <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i < score ? colors[score-1] : '#e2e8f0', transition:'background .2s' }} />)}
                      </div>
                      <div style={{ fontSize:11, color: colors[score-1] ?? '#94a3b8', fontWeight:600 }}>{labels[score-1] ?? 'Enter password'}</div>
                    </div>
                  );
                })()}

                <button onClick={handleForgot} style={primaryBtn(false)}>Reset Password →</button>
              </div>

              <p style={{ textAlign:'center', fontSize:13, color:'#64748b', marginTop:16 }}>
                Remembered it?{' '}
                <button onClick={() => setView('login')} style={{ background:'none', border:'none', color:'#2563eb', fontWeight:700, cursor:'pointer', fontSize:13, padding:0, WebkitTapHighlightColor:'transparent' }}>Sign in</button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
