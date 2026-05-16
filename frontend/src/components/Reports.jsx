import { useState, useEffect, useRef } from 'react';

export default function Reports({ role, tenant }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reportName, setReportName] = useState('');
  const [file, setFile] = useState(null);
  const [alert, setAlert] = useState(null);
  const fileInputRef = useRef();

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = role === 'company'
        ? `/api/reports?tenant_name=${encodeURIComponent(tenant)}`
        : '/api/reports';
      const res = await fetch(url);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [role, tenant]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('report', file);
      form.append('tenant_name', tenant);
      form.append('report_name', reportName || file.name);

      const res = await fetch('/api/reports/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      showAlert('success', 'Report uploaded successfully!');
      setFile(null);
      setReportName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchReports();
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      const res = await fetch(`/api/reports/${report.id}/download`);
      if (!res.ok) {
        const d = await res.json();
        showAlert('error', d.error || 'Download failed (demo data has no file)');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showAlert('error', 'Download failed');
    }
  };

  return (
    <div>
      <div className="section-title">
        <span className="icon" style={{ background: 'var(--success-light)' }}>📊</span>
        {role === 'accountant' ? 'Upload & Manage Reports' : 'View Reports'}
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.message}
        </div>
      )}

      {/* Accountant: upload form */}
      {role === 'accountant' && (
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 16,
          marginBottom: 20,
        }}>
          <div className="form-label" style={{ marginBottom: 10, fontSize: 13, fontWeight: 600 }}>
            Upload New Report
          </div>
          <div className="upload-form-row">
            <div className="form-group">
              <label className="form-label">Report Name</label>
              <input
                className="input"
                placeholder="e.g. Q2 Financial Summary"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tenant</label>
              <select
                className="input"
                value={tenant}
                style={{ height: 38 }}
                readOnly
              >
                <option>{tenant}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.csv"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
            >
              📎 {file ? file.name : 'Choose File'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Uploading...</>
              ) : '⬆️ Upload Report'}
            </button>
          </div>
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="loader-wrap">
          <div className="spinner" />
          <span>Loading reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No reports available{role === 'company' ? ' for your organization' : ''}.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Tenant</th>
                <th>File</th>
                <th>Uploaded</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>
                    <span style={{ marginRight: 6 }}>📊</span>
                    {r.report_name}
                  </td>
                  <td>
                    <span style={{
                      background: 'var(--purple-light)',
                      color: 'var(--purple)',
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {r.tenant_name}
                    </span>
                  </td>
                  <td>
                    <span className="file-chip">📄 {r.filename}</span>
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(r.uploaded_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: '2-digit',
                    })}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDownload(r)}
                    >
                      ⬇️ Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
