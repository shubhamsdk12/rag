import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { KnowledgeEntry } from '../types';
import { getKnowledgeEntries, searchKnowledge } from '../api/knowledge';
import TopBar from '../components/layout/TopBar';
import ErrorState from '../components/shared/ErrorState';
import { SkeletonCard } from '../components/shared/SkeletonLoader';

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [autoLearned, setAutoLearned] = useState(0);
  const [lastIndexed, setLastIndexed] = useState('');
  const [modelName, setModelName] = useState('text-embedding-3-small');

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  // Debounced search query
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        executeSearch(query);
      } else {
        fetchEntries(activeCategory === 'All' ? undefined : activeCategory);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchEntries = async (categoryFilter?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await getKnowledgeEntries(categoryFilter);
      setEntries(res.entries);
      setTotal(res.total);
      setAutoLearned(res.auto_learned);
      setLastIndexed(res.last_indexed || '2024-06-25');
      setModelName(res.model || 'text-embedding-3-small');
    } catch (e: any) {
      setError(e.message || 'Failed to fetch knowledge entries.');
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (q: string) => {
    setSearchLoading(true);
    setError('');
    try {
      const res = await searchKnowledge(q);
      setEntries(res.entries);
      setTotal(res.total);
      setAutoLearned(res.auto_learned);
    } catch (e: any) {
      setError(e.message || 'Knowledge semantic search failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setQuery(''); // clear query when switching categories
    fetchEntries(cat === 'All' ? undefined : cat);
  };

  // Mock static category counts (normally fetched or aggregated)
  const categories = [
    { name: 'All', count: total },
    { name: 'SNIP Rules', count: 12 },
    { name: 'EDI Mapping', count: 8 },
    { name: 'GST Rules', count: 5 },
    { name: 'SWIFT Rules', count: 9 },
    { name: 'Denial Codes', count: 18 },
    { name: 'Learned Correction', count: autoLearned },
  ];

  // Recently learned human approved corrections (top section)
  const recentlyLearned = entries.filter((e) => e.category === 'Learned Correction').slice(0, 2);

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <TopBar breadcrumbs={[{ label: 'IntelliFix' }, { label: 'Knowledge Base' }]} />

      {/* Stats bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          alignItems: 'center',
        }}
      >
        <span>📄 {total} documents indexed</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>🗂 Knowledge Graph Entries: 1,847</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>✨ Auto-learned: {autoLearned}</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>🕐 Last indexed: {lastIndexed}</span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>🔲 Model: {modelName}</span>
      </div>

      {/* Recently Learned section */}
      {recentlyLearned.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔁 Recently Learned — From Human-Approved Corrections
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              These entries were written back to the Knowledge Graph from verified decisions.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {recentlyLearned.map((e) => (
              <div
                key={e.id}
                className="card card-hover"
                onClick={() => setSelectedEntry(e)}
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Learned from: {e.source_file || 'claim_batch_837P.edi'}
                  </span>
                  <span className="badge badge-certified">Learned Correction</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{e.title}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  {e.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="🔍 Search knowledge base semantically..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingLeft: '40px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <div style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }}>
          {searchLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Category sidebar */}
        <div className="card" style={{ padding: '16px' }}>
          <span className="section-header" style={{ display: 'block', marginBottom: '12px', fontSize: '11px' }}>
            CATEGORIES
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {categories.map((cat) => {
              const active = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                    color: active ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left',
                  }}
                >
                  <span>{cat.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({cat.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Cards grid */}
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchEntries(activeCategory === 'All' ? undefined : activeCategory)} />
          ) : entries.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No rulesets or learned corrections matching filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="card card-hover"
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '160px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                        {entry.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                      {entry.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {entry.description}
                    </p>
                  </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {entry.tags.map((t: string, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10px',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              color: 'var(--text-muted)',
                              background: 'var(--bg-secondary)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Used {entry.used_count} times
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-over or Modal view detail */}
      {selectedEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-purple">{selectedEntry.category}</span>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{selectedEntry.title}</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
              <span>ID: {selectedEntry.id}</span>
              <span>Used: {selectedEntry.used_count} times</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {selectedEntry.description}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {selectedEntry.tags.map((t: string, i: number) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
