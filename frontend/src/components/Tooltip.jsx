import { useState, useRef } from 'react';

export default function Tooltip({ text, children, position = 'top', delay = 300 }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords]   = useState({ x: 0, y: 0 });
  const timer = useRef(null);

  const show = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    let x = r.left + r.width / 2;
    let y = r.top - 8;

    if (position === 'bottom') y = r.bottom + 8;
    if (position === 'left')   { x = r.left - 8;   y = r.top + r.height / 2; }
    if (position === 'right')  { x = r.right + 8;  y = r.top + r.height / 2; }

    setCoords({ x, y });
    timer.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timer.current);
    setVisible(false);
  };

  const getTransform = () => {
    if (position === 'top')    return 'translate(-50%, -100%)';
    if (position === 'bottom') return 'translate(-50%, 0)';
    if (position === 'left')   return 'translate(-100%, -50%)';
    if (position === 'right')  return 'translate(0, -50%)';
  };

  const arrowStyle = () => {
    const base = {
      position: 'absolute', width: 0, height: 0,
      border: '5px solid transparent',
    };
    if (position === 'top')    return { ...base, bottom: -9, left: '50%', transform: 'translateX(-50%)', borderTopColor: '#1e293b', borderBottom: 'none' };
    if (position === 'bottom') return { ...base, top: -9,    left: '50%', transform: 'translateX(-50%)', borderBottomColor: '#1e293b', borderTop: 'none' };
    if (position === 'left')   return { ...base, right: -9,  top: '50%',  transform: 'translateY(-50%)', borderLeftColor: '#1e293b',  borderRight: 'none' };
    if (position === 'right')  return { ...base, left: -9,   top: '50%',  transform: 'translateY(-50%)', borderRightColor: '#1e293b', borderLeft: 'none' };
  };

  return (
    <span
      style={{ display: 'inline-flex', position: 'relative' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && text && (
        <div style={{
          position: 'fixed',
          left: coords.x,
          top: coords.y,
          transform: getTransform(),
          background: '#1e293b',
          color: '#f8fafc',
          padding: '6px 11px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 6px 20px rgba(0,0,0,.28)',
          lineHeight: 1.4,
          maxWidth: 220,
          textAlign: 'center',
          animation: 'fadeIn .1s ease',
        }}>
          {text}
          <div style={arrowStyle()} />
        </div>
      )}
    </span>
  );
}
