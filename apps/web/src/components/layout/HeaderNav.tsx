import React, { useState } from 'react';
import { 
  Home, 
  CalendarCheck, 
  BookOpen, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  GraduationCap,
  LogOut,
  User as UserIcon,
  Settings,
  Bell,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
  onOpenSettings?: (tab?: 'profile' | 'reminders' | 'security' | 'privacy' | 'server' | 'about') => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
}) => {
  const { user, logout, hasRole } = useAuth();
  const isAdmin = hasRole('attendance_admin') || hasRole('platform_admin');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  return (
    <>
      <header className="ledger-header">
        <div className="brand-section" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-crest" title="SRKR PLATFORM — MEDHAS">
            <GraduationCap size={22} className="brand-icon-glyph" />
          </div>
          <div>
            <div className="brand-heading font-serif">MEDHAS</div>
            <div className="brand-subline">
              {user ? `${user.branch || 'CSE'} — Sec ${user.section_label || 'A'} · ${user.register_number}` : 'SRKR Engineering College'}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links (Home, Attendance, Learn, Grow, Campus, Admin) */}
        <div className="desktop-nav-links">
          <button
            type="button"
            className={`desktop-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={16} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`desktop-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <CalendarCheck size={16} />
            <span>Attendance</span>
          </button>

          <button
            type="button"
            className={`desktop-tab-btn ${activeTab === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveTab('learn')}
          >
            <BookOpen size={16} />
            <span>Learn</span>
          </button>

          <button
            type="button"
            className={`desktop-tab-btn ${activeTab === 'grow' ? 'active' : ''}`}
            onClick={() => setActiveTab('grow')}
          >
            <Sparkles size={16} />
            <span>Grow</span>
          </button>

          <button
            type="button"
            className={`desktop-tab-btn ${activeTab === 'campus' ? 'active' : ''}`}
            onClick={() => setActiveTab('campus')}
          >
            <Building2 size={16} />
            <span>Campus</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`desktop-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              style={{
                color: 'var(--accent-gold, #d97706)',
                fontWeight: 700,
                background: 'rgba(217, 119, 6, 0.08)',
                border: '1px solid var(--accent-gold, #d97706)',
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Header Actions: Reminders, Settings (beside Reminders), Profile, Logout */}
        <div className="header-actions">
          {isAdmin && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => setActiveTab('admin')}
              title="Admin PIN Reset Panel"
              style={{
                color: 'var(--accent-gold, #d97706)',
                background: 'rgba(217, 119, 6, 0.15)',
                borderColor: 'var(--accent-gold, #d97706)',
                borderWidth: '1.5px',
              }}
            >
              <ShieldCheck size={18} />
            </button>
          )}

          {/* Reminders Notification Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={() => onOpenSettings?.('reminders')}
            title="Daily Attendance Reminders"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--accent-gold, #d97706)'
            }} />
          </button>

          {/* Settings Button (Placed directly beside Reminders) */}
          <button
            type="button"
            className="btn-icon"
            onClick={() => onOpenSettings?.('profile')}
            title="Settings (Profile, Reminders, Security, Privacy DPDP, Server, About)"
            style={{ position: 'relative' }}
          >
            <Settings size={18} />
          </button>

          {/* Profile Tab Switcher */}
          {user && (
            <button
              type="button"
              className={`btn-icon ${activeTab === 'profile' ? 'active-icon' : ''}`}
              onClick={() => setActiveTab('profile')}
              title={`Student Profile (${user.register_number})`}
              style={{
                background: activeTab === 'profile' ? 'rgba(36, 27, 78, 0.1)' : undefined,
                borderColor: activeTab === 'profile' ? 'var(--ink)' : undefined,
              }}
            >
              <UserIcon size={18} />
            </button>
          )}

          {/* Logout with Confirmation Prompt */}
          <button
            type="button"
            className="btn-icon"
            onClick={() => setShowLogoutConfirm(true)}
            title="Log Out of MEDHAS"
            style={{ color: 'var(--bad, #b8332a)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000,
        }}>
          <div className="ledger-card" style={{ maxWidth: '420px', width: '100%', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)' }}>
            <div className="card-header-ruled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--accent-gold)' }} />
                <span className="card-header-title font-serif" style={{ fontSize: '1.05rem' }}>Confirm Sign Out</span>
              </div>
              <button 
                type="button"
                className="btn-icon"
                onClick={() => setShowLogoutConfirm(false)}
                style={{ width: '28px', height: '28px' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '1rem 0' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                Are you sure you want to end your MEDHAS session for <strong>{user?.register_number}</strong>?
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                Your marked attendance, baseline settings, and calculations will remain securely saved on this device.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--bad, #b8332a)', borderColor: 'var(--bad, #b8332a)', color: '#FFFFFF' }}
                onClick={handleConfirmLogout}
              >
                <LogOut size={14} />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default HeaderNav;
