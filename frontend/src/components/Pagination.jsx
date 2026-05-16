export default function Pagination({ page, total, pageSize, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = page * pageSize + 1;
  const end   = Math.min((page + 1) * pageSize, total);

  const btn = (disabled) => ({
    padding: '5px 11px',
    borderRadius: 8,
    border: '1.5px solid #e2e8f0',
    background: disabled ? '#f8fafc' : '#fff',
    color: disabled ? '#cbd5e1' : '#374151',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
    transition: 'all .15s',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 2px 4px', flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>
        Showing {start}–{end} of {total} entries
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => onPageChange(0)} disabled={page === 0} style={btn(page === 0)}>«</button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 0} style={btn(page === 0)}>‹ Prev</button>
        <span style={{ padding: '5px 14px', background: '#f0f7ff', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#2563eb', border: '1px solid #dbeafe', minWidth: 56, textAlign: 'center', display: 'inline-block' }}>
          {page + 1} / {totalPages}
        </span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} style={btn(page >= totalPages - 1)}>Next ›</button>
        <button onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} style={btn(page >= totalPages - 1)}>»</button>
      </div>
    </div>
  );
}
