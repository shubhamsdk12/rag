import { useState, useEffect } from 'react';
import type { DocumentSummary } from '../types';
import { getRecentDocuments } from '../api/documents';
import TopBar from '../components/layout/TopBar';
import DocumentTable from '../components/shared/DocumentTable';
import { SkeletonTable } from '../components/shared/SkeletonLoader';
import ErrorState from '../components/shared/ErrorState';

export default function AuditReports() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    setError('');
    try {
      const docs = await getRecentDocuments(50);
      setDocuments(docs);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Audit Reports' }]} />

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>Audit Reports Catalog</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
          Retrieve verification certificates, audit reports, and clean transaction EDI payloads for all processed documents.
        </p>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchDocs} />
      ) : documents.length > 0 ? (
        <DocumentTable documents={documents} showAuditActions={true} />
      ) : (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No validation reports available yet. Upload documents in Ingest to trigger audit reports.
        </div>
      )}
    </div>
  );
}
