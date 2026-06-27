import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  AlertTriangle,
  FileCheck,
  BookOpen,
  Database,
  BarChart3,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAppState } from '../../context/AppContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ingest', label: 'Ingest', icon: Upload },
  { path: '/analysis', label: 'Analysis', icon: FileSearch },
  { path: '/triage', label: 'Triage Queue', icon: AlertTriangle, showBadge: true },
  { path: '/audit', label: 'Audit Reports', icon: FileCheck },
  { path: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { path: '/knowledge-init', label: 'Knowledge Init', icon: Database },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/graph', label: 'Graph Explorer', icon: GitBranch },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, pendingCount } = useAppState();
  const location = useLocation();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={20} color="#fff" />
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                IntelliFix
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-purple)', marginLeft: 4 }}>
                AI
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/analysis'
              ? location.pathname.startsWith('/analysis')
              : item.path === '/graph'
                ? location.pathname.startsWith('/graph')
                : location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && (
                <>
                  <span>{item.label}</span>
                  {item.showBadge && pendingCount > 0 && (
                    <span className="nav-badge">{pendingCount}</span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.showBadge && pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent-orange)',
                  }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: 8,
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
        {!sidebarCollapsed && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 8,
              paddingBottom: 4,
            }}
          >
            IntelliFix AI · v2.0 · Phase 2
          </div>
        )}
      </div>
    </aside>
  );
}
