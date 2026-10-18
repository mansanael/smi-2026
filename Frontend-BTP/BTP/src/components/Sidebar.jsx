import { NavLink, useLocation } from 'react-router-dom';
import { Home, HardHat, Mic, Banknote, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES_ADMINISTRATION, ROLES_LECTURE_PAIEMENTS, estLectureSeule } from '../roles';

// 5 entrées au plus : le planning, le budget, le suivi, les documents, les achats
// et la facturation sont des onglets de la fiche chantier.
// roles : si absent, visible pour tout utilisateur connecté
const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/projets', icon: HardHat, label: 'Chantiers', labelClient: 'Mon chantier' },
  { to: '/assistant', icon: Mic, label: 'Assistant IA' },
  { to: '/paiements', icon: Banknote, label: 'Paiements', roles: ROLES_LECTURE_PAIEMENTS },
  { to: '/admin/utilisateurs', icon: Settings, label: 'Administration', roles: ROLES_ADMINISTRATION },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const client = estLectureSeule(user);

  const visibleItems = navItems
    .filter(item => !item.roles || item.roles.includes(user?.role))
    .map(item => ({ ...item, label: client && item.labelClient ? item.labelClient : item.label }));

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
          background: var(--menu-bg);
          display: flex; flex-direction: column;
          z-index: 100;
          overflow-y: auto;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-close-btn {
          display: none;
          background: none;
          border: none;
          color: var(--menu-text);
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-sm);
          margin-left: auto;
          transition: all var(--transition-fast);
        }
        .sidebar-close-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: none;
          }
          .sidebar.open {
            transform: translateX(0);
            box-shadow: 8px 0 32px rgba(15, 23, 42, 0.35);
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          position: relative;
          overflow: hidden;
        }

        .logo-icon {
          width: 44px; height: 44px;
          background: var(--brand);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          position: relative;
          overflow: hidden;
          transition: all var(--transition-normal);
          flex-shrink: 0;
        }

        .logo-icon:hover {
          transform: scale(1.05);
        }

        .logo-inner {
          font-size: 22px; font-weight: 800; color: #fff;
          position: relative; z-index: 1;
        }

        .sidebar-logo h2 {
          font-size: 17px; font-weight: 700;
          letter-spacing: -0.5px;
          color: #fff;
        }

        .sidebar-logo span {
          font-size: 11px; color: var(--menu-text);
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
          color: var(--menu-text);
          font-size: 15px; font-weight: 500;
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
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .nav-item.active {
          color: var(--menu-active);
          background: var(--menu-active-bg);
          font-weight: 600;
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
        
        /* Barre claire à gauche de l'entrée active : repérable d'un coup d'œil */
        .nav-indicator {
          position: absolute;
          left: 0; top: 10px; bottom: 10px;
          width: 4px;
          background: var(--menu-indicator);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .sidebar-footer span {
          font-size: 11px; color: var(--menu-text);
          font-weight: 500;
        }

        .footer-version {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
        }
      `}</style>
    </aside>
  );
}