import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppState } from '../../context/AppContext';

export default function Layout() {
  const { sidebarCollapsed } = useAppState();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}
