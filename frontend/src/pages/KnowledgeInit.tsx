import { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw } from 'lucide-react';
import type { KnowledgeInitStatus } from '../types';
import { getKnowledgeInitStatus, initializeRuleset } from '../api/knowledge';
import TopBar from '../components/layout/TopBar';
import ErrorState from '../components/shared/ErrorState';

interface RulesetCard {
  id: string;
  name: string;
  industry: 'Healthcare' | 'Banking' | 'Enterprise SaaS' | 'Insurance';
  rulesCount: number;
  regsCount: number;
  masterDataCount: number;
  regulations: string[];
  masterData: string[];
  lastUpdated: string;
}

const RULESETS: RulesetCard[] = [
  {
    id: 'hipaa_5010',
    name: 'HIPAA 5010 Healthcare',
    industry: 'Healthcare',
    rulesCount: 147,
    regsCount: 3,
    masterDataCount: 4,
    regulations: ['ASC X12N 005010X222A2', 'HIPAA §5010A1', 'CMS NPI Registry'],
    masterData: ['ICD-10-CM', 'CPT-4', 'NPI Registry', 'Place of Service Codes'],
    lastUpdated: '2024-06-25',
  },
  {
    id: 'swift_iso20022',
    name: 'SWIFT ISO 20022 Banking',
    industry: 'Banking',
    rulesCount: 96,
    regsCount: 3,
    masterDataCount: 3,
    regulations: ['ISO 20022 pain.001.001.09', 'SWIFT gpi Guidelines', 'RBI RTGS Rules'],
    masterData: ['BIC Directory', 'IBAN Validator', 'Currency Codes ISO 4217'],
    lastUpdated: '2024-06-25',
  },
  {
    id: 'invoice_b2b',
    name: 'Enterprise Invoice B2B',
    industry: 'Enterprise SaaS',
    rulesCount: 83,
    regsCount: 3,
    masterDataCount: 3,
    regulations: ['GST Rule 46A', 'e-Invoice Schema GSTIN', 'PEPPOL BIS 3.0'],
    masterData: ['GSTIN Registry', 'HSN Codes', 'State Codes'],
    lastUpdated: '2024-06-25',
  },
  {
    id: 'insurance_pc',
    name: 'Insurance Claims P&C',
    industry: 'Insurance',
    rulesCount: 47,
    regsCount: 3,
    masterDataCount: 3,
    regulations: ['ACORD AL3', 'ISO P&C Standards', 'State DOI Requirements'],
    masterData: ['Policy Registry', 'Coverage Codes', 'Adjuster Codes'],
    lastUpdated: '2024-06-25',
  },
];

export default function KnowledgeInit() {
  const [status, setStatus] = useState<KnowledgeInitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initingCardId, setInitingCardId] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<RulesetCard | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getKnowledgeInitStatus();
      setStatus(res);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch ruleset status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleInitialize = async (rulesetId: string) => {
    setInitingCardId(rulesetId);
    try {
      await initializeRuleset(rulesetId);
      // reload status
      const res = await getKnowledgeInitStatus();
      setStatus(res);
    } catch (e: any) {
      setError(e.message || 'Failed to initialize ruleset.');
    } finally {
      setInitingCardId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Knowledge Init' }]} showStatus={false} />
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--accent-purple)" />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="page-content">
        <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Knowledge Init' }]} showStatus={false} />
        <ErrorState message={error} onRetry={fetchStatus} />
      </div>
    );
  }

  const isInitialized = status?.initialized ?? false;
  const industryColors: Record<string, string> = {
    Healthcare: 'badge-healthcare',
    Banking: 'badge-banking',
    Insurance: 'badge-insurance',
    'Enterprise SaaS': 'badge-enterprise',
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Enterprise Knowledge Repository
        </span>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Step 0 — Loaded before every validation run
        </h2>
      </div>

      {/* Status banner */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          background: isInitialized ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
          borderColor: isInitialized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          color: isInitialized ? 'var(--accent-green)' : 'var(--accent-orange)',
        }}
      >
        <CheckCircle size={18} />
        <span style={{ fontWeight: 600 }}>
          {isInitialized ? '✓ Initialized' : 'Initializing...'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: 'var(--text-primary)' }}>{status?.rulesets_loaded ?? 4} rulesets loaded</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: 'var(--text-primary)' }}>{status?.total_rules ?? 373} total rules</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: 'var(--text-primary)' }}>{status?.historical_corrections ?? 197} historical corrections</span>
      </div>

      {/* Ruleset grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {RULESETS.map((card) => (
          <div
            key={card.id}
            className="card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {card.name}
              </h3>
              <span className={`badge ${industryColors[card.industry] || 'badge-info'}`}>
                {card.industry}
              </span>
            </div>

            {/* Config stats */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
              <span>{card.rulesCount} Rules</span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>{card.regsCount} Regulations</span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>{card.masterDataCount} Master Data Sources</span>
            </div>

            {/* Details lists */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              {/* Regulations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>REGULATIONS</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {card.regulations.map((reg, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        padding: '2px 8px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Master Data */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>MASTER DATA</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {card.masterData.map((data, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        padding: '2px 8px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {data}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                marginTop: '8px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Last Updated: {card.lastUpdated}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isInitialized && (
                  <button
                    onClick={() => handleInitialize(card.id)}
                    disabled={initingCardId !== null}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    {initingCardId === card.id ? 'Initializing...' : 'Initialize Now'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedCatalog(card)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent-purple)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  View Full Rule Catalog →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Catalog modal view */}
      {selectedCatalog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setSelectedCatalog(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '24px',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{selectedCatalog.name} — Rules list</h3>
              <button
                onClick={() => setSelectedCatalog(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedCatalog.regulations.map((reg, i) => (
                <div key={i} className="card" style={{ padding: '12px', background: 'var(--bg-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{reg}</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Semantic validation logic and compliance rules indexing for validation schema checks.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
