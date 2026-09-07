import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, User, ChevronDown, Search, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertesBadge from './AlertesBadge';

const roleLabels = {
  directeur_general: 'Directeur Général',
  directeur_technique: 'Directeur Technique',
  chef_projet: 'Chef de Projet',
  conducteur_travaux: 'Conducteur de Travaux',
  responsable_admin_fin: 'Resp. Admin & Finance',
  magasinier: 'Magasinier',
  maitre_ouvrage_externe: 'Maître d\'Ouvrage',
};

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-btn hamburger-btn" onClick={onToggleSidebar} aria-label="Menu">
          <Menu size={22} />
        </button>
        <div className={`search-wrapper ${showMobileSearch ? 'mobile-visible' : ''}`}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher projets, documents..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="topbar-btn search-toggle-btn" onClick={() => setShowMobileSearch(!showMobileSearch)} aria-label="Rechercher">
          <Search size={20} />
        </button>
      </div>

      <div className="topbar-right">
        {/* Alertes proactives IA */}
        <AlertesBadge />

        {/* User Dropdown */}
        <div className="user-wrapper" ref={userDropdownRef}>
          <button
            className="user-btn"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <div className="user-avatar">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">{roleLabels[user?.role] || user?.role}</span>
            </div>
            <ChevronDown size={16} className={`chevron ${showUserDropdown ? 'open' : ''}`} />
          </button>

          {showUserDropdown && (
            <div className="dropdown user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{user?.prenom} {user?.nom}</div>
                  <div className="dropdown-user-email">{user?.email}</div>
                </div>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { setShowUserDropdown(false); navigate('/profil'); }}>
                  <User size={18} />
                  <span>Mon Profil</span>
                </button>
                <button className="dropdown-item" onClick={() => { setShowUserDropdown(false); navigate('/parametres'); }}>
                  <Settings size={18} />
                  <span>Paramètres</span>
                </button>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .topbar {
          position: fixed; top: 0; right: 0;
          left: var(--sidebar-width);
          height: var(--topbar-height);
          background: rgba(15,23,42,0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--surface-border);
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 24px; z-index: 99;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hamburger-btn {
          display: none !important;
        }

        .search-toggle-btn {
          display: none !important;
        }
        
        .topbar-left {
          flex: 1;
          max-width: 400px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .search-wrapper {
          position: relative;
          width: 100%;
          max-width: 320px;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        
        .search-input {
          width: 100%;
          padding: 10px 12px 10px 40px;
          background: var(--bg-tertiary);
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: all var(--transition-fast);
        }
        
        .search-input:focus {
          outline: none;
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        
        .search-input::placeholder {
          color: var(--text-muted);
        }
        
        .topbar-right { 
          display: flex; 
          align-items: center; 
          gap: 8px;
        }
        
        .topbar-btn {
          background: none; 
          border: none; 
          color: var(--text-secondary);
          cursor: pointer; 
          padding: 10px; 
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .topbar-btn:hover { 
          color: var(--text-primary); 
          background: var(--bg-tertiary);
        }
        
        .notif-btn {
          position: relative;
        }
        
        .notif-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: var(--gradient-red);
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-secondary);
        }
        
        .notif-wrapper,
        .user-wrapper {
          position: relative;
        }
        
        .dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-lg);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
          min-width: 280px;
          max-width: 360px;
          z-index: 1000;
          animation: slideDown 0.2s ease;
          backdrop-filter: blur(20px);
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .notif-dropdown {
          width: 380px;
        }
        
        .dropdown-header {
          padding: 16px;
          border-bottom: 1px solid var(--surface-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .dropdown-header h4 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }
        
        .notif-count {
          background: var(--accent-blue);
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .notif-list {
          max-height: 320px;
          overflow-y: auto;
          padding: 8px;
        }
        
        .notif-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
          cursor: pointer;
        }
        
        .notif-item:hover {
          background: var(--bg-tertiary);
        }
        
        .notif-item.unread {
          background: rgba(59,130,246,0.05);
        }
        
        .notif-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-blue);
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }
        
        .notif-content {
          flex: 1;
        }
        
        .notif-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .notif-message {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .notif-time {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .dropdown-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--surface-border);
        }
        
        .view-all-btn {
          width: 100%;
          padding: 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .view-all-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        
        .user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px 6px 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--surface-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .user-btn:hover {
          background: var(--bg-hover);
          border-color: var(--text-muted);
        }
        
        .user-avatar {
          width: 36px; height: 36px;
          background: var(--gradient-blue);
          border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white;
          flex-shrink: 0;
        }
        
        .user-info { 
          display: flex; 
          flex-direction: column;
          text-align: left;
        }
        
        .user-name { 
          font-size: 13px; 
          font-weight: 600;
          line-height: 1.2;
        }
        
        .user-role { 
          font-size: 11px; 
          color: var(--text-muted);
          line-height: 1.2;
        }
        
        .chevron {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }
        
        .chevron.open {
          transform: rotate(180deg);
        }
        
        .user-dropdown {
          width: 280px;
        }
        
        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }
        
        .dropdown-avatar {
          width: 44px;
          height: 44px;
          background: var(--gradient-blue);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: white;
        }
        
        .dropdown-user-info {
          flex: 1;
        }
        
        .dropdown-user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .dropdown-user-email {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .dropdown-divider {
          height: 1px;
          background: var(--surface-border);
          margin: 0 8px;
        }
        
        .dropdown-menu {
          padding: 8px;
        }
        
        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: none;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        
        .dropdown-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        
        .dropdown-item.danger {
          color: var(--accent-red);
        }
        
        .dropdown-item.danger:hover {
          background: rgba(239,68,68,0.1);
        }

        /* ═══ TOPBAR MOBILE ═══ */
        @media (max-width: 768px) {
          .topbar {
            left: 0;
            padding: 0 12px;
          }

          .hamburger-btn {
            display: flex !important;
          }

          .search-wrapper {
            display: none;
          }
          .search-wrapper.mobile-visible {
            display: block;
            position: absolute;
            top: var(--topbar-height);
            left: 0;
            right: 0;
            max-width: 100%;
            padding: 12px;
            background: rgba(15,23,42,0.95);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--surface-border);
            z-index: 98;
            animation: slideDown 0.2s ease;
          }
          .search-wrapper.mobile-visible .search-input {
            max-width: 100%;
          }

          .search-toggle-btn {
            display: flex !important;
          }

          .user-info {
            display: none;
          }

          .user-btn {
            padding: 4px;
            background: transparent;
            border: none;
          }

          .chevron {
            display: none;
          }

          .notif-dropdown {
            width: calc(100vw - 24px);
            right: -60px;
          }

          .user-dropdown {
            width: calc(100vw - 24px);
            right: -8px;
          }

          .topbar-right {
            gap: 4px;
          }
        }

        @media (max-width: 480px) {
          .topbar {
            padding: 0 8px;
          }
        }
      `}</style>
    </header>
  );
}
