import { useState, useRef, useEffect } from 'react';
import { exportToTally, exportToZoho, exportToQuickBooks } from '../utils/exportUtils';

export default function ExportMenu({ invoice }) {
  const [open,  setOpen]  = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const run = (fn) => {
    try { fn(invoice); setOpen(false); }
    catch (err) { setError(err.message); setTimeout(() => setError(''), 3000); setOpen(false); }
  };

  const options = [
    { fn: exportToTally,      icon: '📊', label: 'Tally XML',     sub: 'Purchase/Sales Voucher', hover: '#f0fdf4', color: '#15803d' },
    { fn: exportToZoho,       icon: '📋', label: 'Zoho Books',    sub: 'JSON format',            hover: '#eff6ff', color: '#2563eb' },
    { fn: exportToQuickBooks, icon: '💼', label: 'QuickBooks',    sub: 'IIF format',             hover: '#fff7ed', color: '#ea580c' },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => setOpen(o => !o)}
        style={{ fontSize: 11, gap: 4, display: 'flex', alignItems: 'center' }}
      >
        ⬇ Export
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.13)', zIndex: 300, minWidth: 180, overflow: 'hidden',
        }}>
          {options.map(({ fn, icon, label, sub, hover, color }, i) => (
            <button
              key={label}
              onClick={() => run(fn)}
              style={{
                width: '100%', padding: '10px 14px', border: 'none',
                borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                background: 'none', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = hover}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color }}>{label}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          borderRadius: 6, padding: '6px 10px', fontSize: 11, whiteSpace: 'nowrap', zIndex: 301,
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}
