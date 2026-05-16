import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import Tooltip from './Tooltip';

const FIELDS = [
  { key: 'vendor',         label: 'Vendor Name',      placeholder: 'e.g. TechSupplies Ltd',  tip: 'Name of the company that issued this invoice' },
  { key: 'invoice_number', label: 'Invoice Number',   placeholder: 'e.g. INV-2026-001',      tip: 'Unique identifier on the invoice document' },
  { key: 'invoice_date',   label: 'Invoice Date',     placeholder: 'e.g. 2026-05-10', type: 'date', tip: 'Date the invoice was issued by the vendor' },
  { key: 'total_amount',   label: 'Total Amount (₹)', placeholder: 'e.g. 15000.00',   type: 'number', tip: 'Full invoice amount including taxes' },
  { key: 'tax_amount',     label: 'Tax Amount (₹)',   placeholder: 'e.g. 1800.00',    type: 'number', tip: 'GST / tax component of the total amount' },
];

export default function EditModal({ invoice, onClose, onSaved }) {
  const [form, setForm]       = useState({ ...(invoice.extracted_data || {}) });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [confirm, setConfirm] = useState(null); // 'save' | 'approve'

  const doSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setConfirm(null);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const doSaveAndApprove = async () => {
    setSaving(true);
    setError('');
    try {
      const saveRes = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!saveRes.ok) throw new Error('Save failed before approval');

      const approveRes = await fetch(`/api/invoices/${invoice.id}/approve`, { method: 'POST' });
      if (!approveRes.ok) throw new Error((await approveRes.json()).error || 'Approval failed');
      setConfirm(null);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const detailBox = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {form.vendor && <span><strong>Vendor:</strong> {form.vendor}</span>}
      {form.invoice_number && <span><strong>Invoice #:</strong> {form.invoice_number}</span>}
      {form.total_amount && <span><strong>Amount:</strong> ₹{Number(form.total_amount).toLocaleString('en-IN')}</span>}
      <span><strong>Tenant:</strong> {invoice.tenant_name}</span>
    </div>
  );

  return (
    <>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">
              ✏️ Edit Invoice &nbsp;
              <span className="font-mono" style={{ color: 'var(--text3)', fontWeight: 400 }}>#{invoice.id?.slice(-6)}</span>
            </div>
            <Tooltip text="Close">
              <button className="modal-close" onClick={onClose}>✕</button>
            </Tooltip>
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-error">❌ {error}</div>}

            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', marginBottom: 4, fontSize: 13 }}>
              <span className="text-muted">Tenant: </span>
              <strong>{invoice.tenant_name}</strong>
              <span style={{ margin: '0 8px', color: 'var(--border2)' }}>·</span>
              <span className="file-chip" style={{ display: 'inline-flex' }}>
                {invoice.filename?.endsWith('.pdf') ? '📄' : '🖼️'} {invoice.filename}
              </span>
            </div>

            {FIELDS.map(({ key, label, placeholder, type, tip }) => (
              <div className="form-group" key={key}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {label}
                  <Tooltip text={tip} position="right">
                    <span style={{ width: 15, height: 15, background: '#e2e8f0', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#64748b', cursor: 'default', fontWeight: 700 }}>?</span>
                  </Tooltip>
                </label>
                <input
                  className="input"
                  type={type || 'text'}
                  placeholder={placeholder}
                  value={form[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <Tooltip text="Cancel">
              <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
            </Tooltip>
            <Tooltip text="Save">
              <button className="btn btn-primary" onClick={() => setConfirm('save')} disabled={saving}>
                💾 Save
              </button>
            </Tooltip>
            {invoice.status !== 'approved' && (
              <Tooltip text="Save & Approve">
                <button className="btn btn-success" onClick={() => setConfirm('approve')} disabled={saving}>
                  ✅ Save &amp; Approve
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Save confirmation */}
      {confirm === 'save' && (
        <ConfirmDialog
          type="save"
          title="Save Invoice Changes?"
          message="You are about to save the edited invoice data. The extracted fields will be updated permanently."
          detail={detailBox}
          yesLabel="Yes, Save Changes"
          noLabel="No, Go Back"
          loading={saving}
          onConfirm={doSave}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Save & Approve confirmation */}
      {confirm === 'approve' && (
        <ConfirmDialog
          type="approve"
          title="Approve This Invoice?"
          message="This will save your edits and mark the invoice as approved. Approved invoices are locked and cannot be edited."
          detail={detailBox}
          yesLabel="Yes, Save & Approve"
          noLabel="No, Go Back"
          loading={saving}
          onConfirm={doSaveAndApprove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
