import { useState } from 'react';
import EditModal from './EditModal';
import ConfirmDialog from './ConfirmDialog';
import Tooltip from './Tooltip';
import ExportMenu from './ExportMenu';
import Pagination from './Pagination';

function StatusBadge({ status }) {
  const map = {
    processing: { cls: 'badge-processing', label: 'Processing', tip: 'AI is currently extracting data from this invoice' },
    extracted:  { cls: 'badge-extracted',  label: 'Extracted',  tip: 'Data extracted — awaiting accountant approval'  },
    approved:   { cls: 'badge-approved',   label: 'Approved',   tip: 'Invoice reviewed and approved by the accountant' },
    error:      { cls: 'badge-error',      label: 'Error',      tip: 'Extraction failed — please re-upload or edit manually' },
  };
  const s = map[status] || map.error;
  return (
    <Tooltip text={s.tip}>
      <span className={`badge ${s.cls}`}>
        {status === 'processing' && <span className="pulse-dot" />}
        {s.label}
      </span>
    </Tooltip>
  );
}

const PAGE_SIZE = 20;

export default function InvoiceTable({ invoices, role, loading, onRefresh }) {
  const [editing, setEditing]   = useState(null);
  const [confirm, setConfirm]   = useState(null); // { type: 'approve'|'delete', invoice }
  const [acting, setActing]     = useState(null); // invoice id being acted on
  const [page, setPage]         = useState(0);

  const handleApprove = async () => {
    const inv = confirm.invoice;
    setActing(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Approval failed');
      setConfirm(null);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async () => {
    const inv = confirm.invoice;
    setActing(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      setConfirm(null);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <span>Loading invoices...</span>
      </div>
    );
  }

  const detailFor = (inv) => {
    const d = inv.extracted_data || {};
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 }}>
        {d.vendor         && <span><strong>Vendor:</strong> {d.vendor}</span>}
        {d.invoice_number && <span><strong>Invoice #:</strong> {d.invoice_number}</span>}
        {d.total_amount   && <span><strong>Amount:</strong> ₹{Number(d.total_amount).toLocaleString('en-IN')}</span>}
        <span><strong>Tenant:</strong> {inv.tenant_name}</span>
      </div>
    );
  };

  const safePage = Math.min(page, Math.max(0, Math.ceil(invoices.length / PAGE_SIZE) - 1));
  const paged = invoices.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <>
      <div className="flex items-center justify-between mb-4" style={{ marginBottom: 12 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span className="icon" style={{ background: 'var(--primary-light)' }}>📋</span>
          {role === 'accountant' ? 'All Invoices' : 'Your Invoices'}
        </div>
        <Tooltip text="Refresh">
          <button className="btn btn-outline btn-sm" onClick={onRefresh}>🔄 Refresh</button>
        </Tooltip>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No invoices found.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tenant</th>
                <th>File</th>
                <th>Vendor</th>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Total</th>
                <th>Tax</th>
                <th>Status</th>
                <th>Uploaded</th>
                {role === 'accountant' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paged.map((inv) => {
                const d = inv.extracted_data || {};
                return (
                  <tr key={inv.id}>
                    <td className="text-muted font-mono" style={{ fontSize: 10 }}>{inv.id?.slice(-6)}</td>
                    <td>
                      <span style={{ background: 'var(--purple-light)', color: 'var(--purple)', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                        {inv.tenant_name}
                      </span>
                    </td>
                    <td><span className="file-chip">{inv.filename?.endsWith('.pdf') ? '📄' : '🖼️'} {inv.filename}</span></td>
                    <td>{d.vendor ?? <span className="text-muted">—</span>}</td>
                    <td className="font-mono">{d.invoice_number ?? <span className="text-muted">—</span>}</td>
                    <td>{d.invoice_date ?? <span className="text-muted">—</span>}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>
                      {d.total_amount ? `₹${Number(d.total_amount).toLocaleString('en-IN')}` : <span className="text-muted">—</span>}
                    </td>
                    <td style={{ color: '#7c3aed' }}>
                      {d.tax_amount ? `₹${Number(d.tax_amount).toLocaleString('en-IN')}` : <span className="text-muted">—</span>}
                    </td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="text-muted text-sm">
                      {new Date(inv.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>

                    {role === 'accountant' && (
                      <td>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {inv.status !== 'processing' && (
                            <Tooltip text="Edit">
                              <button className="btn btn-outline btn-sm" onClick={() => setEditing(inv)}>✏️</button>
                            </Tooltip>
                          )}
                          {inv.status === 'extracted' && (
                            <Tooltip text="Approve">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => setConfirm({ type: 'approve', invoice: inv })}
                                disabled={acting === inv.id}
                              >
                                ✅
                              </button>
                            </Tooltip>
                          )}
                          {inv.status === 'approved' && (
                            <Tooltip text="Approved"><span className="badge badge-approved">Done</span></Tooltip>
                          )}
                          {inv.status !== 'processing' && (
                            <Tooltip text="Delete">
                              <button
                                className="btn btn-sm"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                                onClick={() => setConfirm({ type: 'delete', invoice: inv })}
                                disabled={acting === inv.id}
                              >
                                🗑️
                              </button>
                            </Tooltip>
                          )}
                          {inv.extracted_data && <ExportMenu invoice={inv} />}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        <Pagination page={safePage} total={invoices.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      {editing && (
        <EditModal
          invoice={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onRefresh(); }}
        />
      )}

      {confirm?.type === 'approve' && (
        <ConfirmDialog
          type="approve"
          title="Approve Invoice?"
          message="You are about to approve this invoice. Once approved, it will be locked and cannot be edited."
          detail={detailFor(confirm.invoice)}
          yesLabel="Yes, Approve"
          noLabel="No, Cancel"
          loading={acting === confirm.invoice.id}
          onConfirm={handleApprove}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === 'delete' && (
        <ConfirmDialog
          type="delete"
          title="Delete Invoice?"
          message="This will permanently remove the invoice and its uploaded file. This action cannot be undone."
          detail={detailFor(confirm.invoice)}
          yesLabel="Yes, Delete"
          noLabel="No, Keep It"
          loading={acting === confirm.invoice.id}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
