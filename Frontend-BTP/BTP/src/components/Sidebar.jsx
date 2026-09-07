import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CalendarDays, Wallet,
  Users, ClipboardCheck, FileText, Truck, Receipt, ShieldCheck, X, Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// roles: si absent, visible pour tout utilisateur connecté
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projets', icon: FolderKanban, label: 'Projets' },
  { to: '/planning', icon: CalendarDays, label: 'Planning' },
  { to: '/budget', icon: Wallet, label: 'Budget', roles: ['directeur_general', 'directeur_technique', 'responsable_admin_fin'] },
  { to: '/ressources', icon: Users, label: 'Ressources' },
  { to: '/suivi', icon: ClipboardCheck, label: 'Suivi Chantier' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/approvisionnement', icon: Truck, label: 'Approvisionnement', roles: ['directeur_general', 'directeur_technique', 'responsable_admin_fin', 'magasinier'] },
  { to: '/facturation', icon: Receipt, label: 'Facturation', roles: ['directeur_general', 'directeur_technique', 'responsable_admin_fin'] },
  { to: '/admin/utilisateurs', icon: ShieldCheck, label: 'Utilisateurs', roles: ['directeur_general', 'directeur_technique'] },
  { to: '/assistant', icon: Bot, label: 'Assistant IA' },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <div className="logo-inner">B</div>
        </div>
        <div>
          <h2>BATIPME-SN</h2>
          <span>Gestion BTP</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Fermer le menu">
          <X size={22} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={onClose}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
              </div>
              <span>{item.label}</span>
              {isActive && <div className="nav-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-content">
          <span>© 2026 BATIPME-SN</span>
          <span className="footer-version">v1.0.0</span>
        </div>
      </div>

      <style>{`
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: var(--sidebar-width);
          background: linear-gradient(180deg, var(--bg-secondary) 0%, rgba(30, 41, 59, 0.95) 100%);
          border-right: 1px solid var(--surface-border);
          display: flex; flex-direction: column;
          z-index: 100;
          overflow-y: auto;
          backdrop-filter: blur(20px);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-close-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-sm);
          margin-left: auto;
          transition: all var(--transition-fast);
        }
        .sidebar-close-btn:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: none;
          }
          .sidebar.open {
            transform: translateX(0);
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.5);
          }
          .sidebar-close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        
        .sidebar-logo {
          display: flex; align-items: center; gap: 14px;
          padding: 24px;
          border-bottom: 1px solid var(--surface-border);
          position: relative;
          overflow: hidden;
        }
        
        .sidebar-logo::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
        }
        
        .logo-icon {
          width: 44px; height: 44px;
          background: var(--gradient-blue);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
          transition: all var(--transition-normal);
          flex-shrink: 0;
        }
        
        .logo-icon:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
        }
        
        .logo-icon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
        }
        
        .logo-inner {
          font-size: 22px; font-weight: 800; color: white;
          position: relative; z-index: 1;
        }
        
        .sidebar-logo h2 { 
          font-size: 17px; font-weight: 700; 
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .sidebar-logo span { 
          font-size: 11px; color: var(--text-muted); 
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .sidebar-nav { 
          flex: 1; 
          padding: 16px 12px;
          display: flex; flex-direction: column;
          gap: 4px;
        }
        
        .nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; 
          border-radius: var(--radius-md);
          color: var(--text-secondary); 
          font-size: 14px; font-weight: 500;
          transition: all var(--transition-normal);
          text-decoration: none;
          position: relative;
          opacity: 0;
          animation: slideInLeft 0.3s ease forwards;
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .nav-item:hover { 
          color: var(--text-primary); 
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }
        
        .nav-item.active {
          color: var(--accent-blue-light);
          background: rgba(59, 130, 246, 0.12);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .nav-icon-wrapper {
          width: 36px; height: 36px;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-normal);
        }
        
        .nav-item:hover .nav-icon-wrapper {
          background: rgba(255, 255, 255, 0.08);
        }
        
        .nav-item.active .nav-icon-wrapper {
          background: rgba(59, 130, 246, 0.2);
        }
        
        .nav-indicator {
          position: absolute;
          right: 12px;
          width: 6px;
          height: 6px;
          background: var(--accent-blue);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-blue);
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        
        .sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--surface-border);
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sidebar-footer span { 
          font-size: 11px; color: var(--text-muted); 
          font-weight: 500;
        }
        
        .footer-version {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-blue-light);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
        }
      `}</style>
    </aside>
  );
}