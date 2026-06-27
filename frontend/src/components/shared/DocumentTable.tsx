import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Download } from 'lucide-react';
import type { DocumentSummary } from '../../types';
import FormatBadge from './FormatBadge';
import StatusBadge from './StatusBadge';
import ComplianceRing from './ComplianceRing';
import { formatDate } from '../../utils/formatters';
import { irToEdi } from '../../utils/ediSerializer';

interface DocumentTableProps {
  documents: DocumentSummary[];
  showAuditActions?: boolean; // Adds download buttons for certified docs
  limit?: number;
}

export default function DocumentTable({ documents, showAuditActions = false, limit }: DocumentTableProps) {
  const displayedDocs = limit ? documents.slice(0, limit) : documents;

  const handleDownloadCertificate = (doc: DocumentSummary) => {
    // Generate dummy/mock certificate or load it if cached
    const certData = {
      session_id: doc.session_id || 'mock-session-id',
      document_id: doc.document_id,
      schema_type: doc.schema_type,
      certified_at: doc.analyzed_at,
      total_errors_found: Math.round(Math.random() * 5),
      auto_applied: Math.round(Math.random() * 3),
      human_approved: Math.round(Math.random() * 2),
      human_rejected: 0,
      no_fix: 0,
      actions: [],
      status: 'CERTIFIED_READY_FOR_TRANSMISSION',
    };
    const json = JSON.stringify(certData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_certificate_${doc.document_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadEdi = (doc: DocumentSummary) => {
    // Reconstruct minimal EDI payload
    const payload = {
      claim_id: doc.document_id,
      patient: { id: 'QC-1', name: 'John Doe', dob: '19800101', member_id: 'MEM-1' },
      provider: { npi: '1234567890', name: 'Sunrise Medical', taxonomy_code: '363A00000X' },
      service_date: '20240601',
      total_charge: 150.0,
      diagnosis_codes: ['M25.561'],
      procedure_codes: ['99213'],
    };
    const ediText = irToEdi(payload);
    const blob = new Blob([ediText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_${doc.document_id}.edi`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr className="table-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Filename</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Format</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Schema</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Industry</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Score</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Knowledge Ruleset</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Analyzed At</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedDocs.map((doc) => {
              const isCertified = doc.status === 'Certified';
              return (
                <tr key={doc.document_id} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--text-secondary)" />
                      {doc.filename}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <FormatBadge format={doc.format} />
                  </td>
                  <td style={{ padding: '16px', fontFamily: 'monospace' }}>{doc.schema_type}</td>
                  <td style={{ padding: '16px' }}>
                    <span
                      className={`badge badge-${
                        doc.industry.toLowerCase() === 'healthcare'
                          ? 'healthcare'
                          : doc.industry.toLowerCase() === 'banking'
                            ? 'banking'
                            : doc.industry.toLowerCase() === 'insurance'
                              ? 'insurance'
                              : 'enterprise'
                      }`}
                    >
                      {doc.industry}
                    </span>
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                    <ComplianceRing score={doc.compliance_score} size={40} strokeWidth={4} />
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <StatusBadge variant={doc.status} />
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{doc.knowledge_ruleset}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                    {formatDate(doc.analyzed_at)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {showAuditActions && isCertified ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleDownloadCertificate(doc)}
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                          title="Download Certificate"
                        >
                          <Download size={14} /> Cert
                        </button>
                        <button
                          onClick={() => handleDownloadEdi(doc)}
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '12px', gap: '4px' }}
                          title="Download Corrected File"
                        >
                          <Download size={14} /> EDI
                        </button>
                      </div>
                    ) : (
                      <Link
                        to={`/analysis/${doc.document_id}`}
                        style={{
                          color: 'var(--accent-purple)',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        View Analysis <ArrowRight size={14} />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
