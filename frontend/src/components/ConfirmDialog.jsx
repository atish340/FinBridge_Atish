import { useEffect } from 'react';

const TYPES = {
  approve: {
    icon: '✅',
    iconBg: '#f0fdf4',
    accent: '#16a34a',
    btnBg: '#16a34a',
    btnHover: '#15803d',
    defaultYes: 'Yes, Approve',
    defaultNo: 'No, Cancel',
  },
  save: {
    icon: '💾',
    iconBg: '#eff6ff',
    accent: '#2563eb',
    btnBg: '#2563eb',
    btnHover: '#1d4ed8',
    defaultYes: 'Yes, Save',
    defaultNo: 'No, Cancel',
  },
  delete: {
    icon: '🗑️',
    iconBg: '#fef2f2',
    accent: '#dc2626',
    btnBg: '#dc2626',
    btnHover: '#b91c1c',
    defaultYes: 'Yes, Delete',
    defaultNo: 'No, Keep It',
  },
  warning: {
    icon: '⚠️',
    iconBg: '#fffbeb',
    accent: '#d97706',
    btnBg: '#d97706',
    btnHover: '#b45309',
    defaultYes: 'Yes, Proceed',
    defaultNo: 'No, Cancel',
  },
};

export default function ConfirmDialog({
  type = 'warning',
  title,
  message,
  detail,       // optional JSX rendered in a tinted box
  yesLabel,
  noLabel,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const t = TYPES[type] || TYPES.warning;

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 400, padding: 20,
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn .12s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{
        background: '#fff',
        borderRadius: 18,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,.22)',
        overflow: 'hidden',
        animation: 'modalIn .15s ease',
      }}>
        {/* Accent top bar */}
        <div style={{ height: 4, background: t.btnBg }} />

        <div style={{ padding: '28px 28px 8px' }}>
          {/* Icon badge */}
          <div style={{
            width: 54, height: 54, borderRadius: 15,
            background: t.iconBg,
            border: `1.5px solid ${t.accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, marginBottom: 18,
          }}>
            {t.icon}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>

          {/* Message */}
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{message}</p>

          {/* Detail block */}
          {detail && (
            <div style={{
              background: t.iconBg,
              border: `1px solid ${t.accent}33`,
              borderRadius: 10,
              padding: '10px 14px',
              marginTop: 14,
              fontSize: 12,
              color: '#334155',
              lineHeight: 1.6,
            }}>
              {detail}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 28px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: 10,
              border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#475569',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all .15s',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {noLabel || t.defaultNo}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: 10,
              border: 'none',
              background: t.btnBg, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading && (
              <span style={{
                width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)',
                borderTopColor: '#fff', borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin .6s linear infinite',
              }} />
            )}
            {yesLabel || t.defaultYes}
          </button>
        </div>
      </div>
    </div>
  );
}
