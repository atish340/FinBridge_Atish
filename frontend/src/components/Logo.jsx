// Reusable InvoSmart brand components
// LogoIcon  – just the SVG mark
// LogoBrand – icon + wordmark side by side (use in header)

export function LogoIcon({ size = 36, uid = 'a' }) {
  // uid keeps gradient IDs unique when multiple instances render simultaneously
  const g = `isg_${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* Background tile */}
      <rect width="36" height="36" rx="9" fill={`url(#${g})`} />

      {/* White document / invoice */}
      <rect x="6" y="9" width="15" height="19" rx="2.5" fill="white" opacity="0.95" />

      {/* Invoice ruled lines */}
      <rect x="9"  y="14"   width="9" height="1.5" rx="0.75" fill="#3b82f6" opacity="0.55" />
      <rect x="9"  y="17.5" width="7" height="1.5" rx="0.75" fill="#3b82f6" opacity="0.55" />
      <rect x="9"  y="21"   width="8" height="1.5" rx="0.75" fill="#3b82f6" opacity="0.55" />

      {/* Amber lightning bolt — "Smart" signal, overlaps doc top-right */}
      <path d="M24 4 L19 14 L23 14 L21 21 L29 11 L25 11 Z" fill="#fbbf24" />

      {/* Sparkle accents */}
      <circle cx="30" cy="5"  r="1.8" fill="#fde68a" opacity="0.75" />
      <circle cx="33" cy="10" r="1.1" fill="#fde68a" opacity="0.45" />
      <circle cx="27" cy="3"  r="1"   fill="#fde68a" opacity="0.50" />
    </svg>
  );
}

export default function LogoBrand({ size = 'md', uid = 'hdr' }) {
  const cfg = {
    sm: { icon: 28, text: 16, gap: 8  },
    md: { icon: 34, text: 20, gap: 10 },
    lg: { icon: 52, text: 28, gap: 14 },
  }[size] || { icon: 34, text: 20, gap: 10 };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cfg.gap }}>
      <LogoIcon size={cfg.icon} uid={uid} />
      <span style={{
        fontSize:      cfg.text,
        fontWeight:    800,
        letterSpacing: -0.5,
        lineHeight:    1,
      }}>
        <span style={{ color: '#2563eb' }}>Invo</span>
        <span style={{ color: '#0f172a' }}>Smart</span>
      </span>
    </div>
  );
}
