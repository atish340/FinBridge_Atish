import { useState, useRef } from 'react';

export default function InvoiceUpload({ tenant, onUploaded }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef();

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) { showAlert('error', 'Only PDF, JPG, PNG or WEBP allowed.'); return; }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('invoice', file);
      form.append('tenant_name', tenant);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      showAlert('success', `Uploaded! AI extracting data... (ID: ${data.invoice_id})`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(onUploaded, 1000);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 10, padding: '8px 14px', fontSize: 12 }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.message}
        </div>
      )}

      {/* Compact inline upload bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border2)'}`,
          borderRadius: 10,
          background: dragging ? 'var(--primary-light)' : 'var(--surface2)',
          transition: 'all .2s',
          cursor: 'pointer',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <span style={{ fontSize: 20 }}>{file ? '📄' : '☁️'}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {file ? (
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {file.name}
              <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text3)' }}>{(file.size / 1024).toFixed(0)} KB</span>
            </span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>
              Drop invoice or <span style={{ color: 'var(--primary)', fontWeight: 500 }}>browse</span>
              <span style={{ marginLeft: 8, fontSize: 11 }}>PDF · JPG · PNG · max 15 MB</span>
            </span>
          )}
        </div>

        {file && (
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
          >
            ✕
          </button>
        )}

        {!file && (
          <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Browse
          </button>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={(e) => { e.stopPropagation(); handleUpload(); }}
          disabled={!file || uploading}
          style={{ whiteSpace: 'nowrap' }}
        >
          {uploading
            ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Processing...</>
            : '🚀 Upload & Extract'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
