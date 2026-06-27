import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppState, IngestResponse, AuditCertificate, HealthResponse } from '../types';
import { getQueueCount } from '../api/repair';
import { getHealth } from '../api/health';

interface AppContextType extends AppState {
  setSidebarCollapsed: (v: boolean) => void;
  setPendingCount: (v: number) => void;
  setSession: (docId: string, sessionId: string) => void;
  setAnalysis: (docId: string, data: IngestResponse) => void;
  setCertificate: (sessionId: string, cert: AuditCertificate) => void;
  refreshPendingCount: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [sessions, setSessions] = useState<Record<string, string>>({});
  const [analyses, setAnalyses] = useState<Record<string, IngestResponse>>({});
  const [certificates, setCertificates] = useState<Record<string, AuditCertificate>>({});

  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await getQueueCount();
      setPendingCount(res.count);
    } catch {
      // silently fail — badge stays at current value
    }
  }, []);

  // Poll pending count every 30 seconds
  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 30000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // Poll health every 60 seconds
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const h = await getHealth();
        setHealthStatus(h);
      } catch {
        setHealthStatus(null);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const setSession = (docId: string, sessionId: string) => {
    setSessions((prev) => ({ ...prev, [docId]: sessionId }));
  };

  const setAnalysis = (docId: string, data: IngestResponse) => {
    setAnalyses((prev) => ({ ...prev, [docId]: data }));
  };

  const setCertificate = (sessionId: string, cert: AuditCertificate) => {
    setCertificates((prev) => ({ ...prev, [sessionId]: cert }));
  };

  return (
    <AppContext.Provider
      value={{
        sessions,
        analyses,
        certificates,
        pendingCount,
        healthStatus,
        currentUser: 'compliance_officer',
        sidebarCollapsed,
        setSidebarCollapsed,
        setPendingCount,
        setSession,
        setAnalysis,
        setCertificate,
        refreshPendingCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
