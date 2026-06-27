import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, AlertCircle, Loader2 } from 'lucide-react';
import { ingestDocument } from '../api/documents';
import { startRepair } from '../api/repair';
import { useAppState } from '../context/AppContext';
import TopBar from '../components/layout/TopBar';
import FormatBadge from '../components/shared/FormatBadge';

export default function Ingest() {
  const navigate = useNavigate();
  const { setSession, setAnalysis, refreshPendingCount } = useAppState();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const triggerInput = () => {
    inputRef.current?.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      // Ingest document
      const result = await ingestDocument(file);

      // Cache raw analysis response
      setAnalysis(result.document_id, result);

      // Immediately start the repair session
      const session = await startRepair(result.document_id);
      setSession(result.document_id, session.session_id);

      // Refresh triage queue badge count
      refreshPendingCount();

      // Navigate directly to analysis workspace
      navigate(`/analysis/${result.document_id}`);
    } catch (e: any) {
      setError(e.message || 'An error occurred during file upload and parsing.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Ingest Document' }]} showStatus={false} />

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Ingest Document
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 32px 0' }}>
            Upload a file for automated compliance analysis, semantic validation, and AI repair simulation.
          </p>

          {/* Upload Drop Zone */}
          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerInput}
            style={{
              padding: '48px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              minHeight: '280px',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              onChange={handleChange}
              style={{ display: 'none' }}
              accept=".edi,.xml,.json,.csv,.txt"
            />
            <UploadCloud size={48} color="var(--accent-blue)" />
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Drop your file here or click to browse
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Supports .edi, .xml, .json, .csv, .txt
            </span>
          </div>

          {/* Upload Details */}
          {file && (
            <div
              className="card"
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <File size={24} color="var(--accent-purple)" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatBytes(file.size)}</span>
                </div>
              </div>
              <div>
                <FormatBadge format={file.name.split('.').pop() || 'EDI'} />
              </div>
            </div>
          )}

          {/* Submit / Loading Button */}
          {file && (
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px', padding: '14px', fontSize: '15px', gap: '8px' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing document...
                </>
              ) : (
                'Run Compliance Analysis & Repair'
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="card"
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.04)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                color: 'var(--accent-red)',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{error}</div>
            </div>
          )}
        </div>

        {/* Info badges lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <span className="section-header" style={{ display: 'block', marginBottom: '10px', fontSize: '11px' }}>
              SUPPORTED FORMATS
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-edi" style={{ border: '1px solid var(--border)' }}>EDI X12</span>
              <span className="badge badge-xml" style={{ border: '1px solid var(--border)' }}>XML</span>
              <span className="badge badge-json" style={{ border: '1px solid var(--border)' }}>JSON</span>
              <span className="badge badge-csv" style={{ border: '1px solid var(--border)' }}>CSV</span>
            </div>
          </div>

          <div className="card" style={{ padding: '16px' }}>
            <span className="section-header" style={{ display: 'block', marginBottom: '10px', fontSize: '11px' }}>
              SUPPORTED SCHEMAS
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ border: '1px solid var(--border)' }}>837P Healthcare Claim</span>
              <span className="badge badge-purple" style={{ border: '1px solid var(--border)' }}>837I Healthcare Claim</span>
              <span className="badge badge-purple" style={{ border: '1px solid var(--border)' }}>835 Remittance Advice</span>
              <span className="badge badge-purple" style={{ border: '1px solid var(--border)' }}>834 Enrollment Benefit</span>
              <span className="badge badge-purple" style={{ border: '1px solid var(--border)' }}>SWIFT ISO 20022</span>
              <span className="badge badge-purple" style={{ border: '1px solid var(--border)' }}>Generic Invoice</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
