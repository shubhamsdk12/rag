import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Ingest from './pages/Ingest';
import Analysis from './pages/Analysis';
import TriageQueue from './pages/TriageQueue';
import AuditReports from './pages/AuditReports';
import KnowledgeBase from './pages/KnowledgeBase';
import KnowledgeInit from './pages/KnowledgeInit';
import Analytics from './pages/Analytics';
import GraphExplorer from './pages/GraphExplorer';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ingest" element={<Ingest />} />
          <Route path="/analysis/:documentId" element={<Analysis />} />
          <Route path="/triage" element={<TriageQueue />} />
          <Route path="/audit" element={<AuditReports />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/knowledge-init" element={<KnowledgeInit />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/graph/:documentId" element={<GraphExplorer />} />
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
