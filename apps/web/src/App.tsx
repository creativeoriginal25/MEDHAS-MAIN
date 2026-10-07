import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HeaderNav } from './components/layout/HeaderNav';
import { BottomNav } from './components/layout/BottomNav';
import { SettingsModal } from './components/layout/SettingsModal';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Attendance } from './pages/Attendance';
import { Learn } from './pages/Learn';
import { Grow } from './pages/Grow';
import { Campus } from './pages/Campus';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';

import { FacultyPortal } from './pages/FacultyPortal';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'reminders' | 'security' | 'privacy' | 'server' | 'about'>('profile');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-crest" style={{ margin: '0 auto 1rem', width: '48px', height: '48px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹</span>
          </div>
          <div className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
            MEDHAS
          </div>
          <div style={{ marginTop: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
            Loading Academic Portal...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Pure isolated Faculty Resource Portal — ZERO student navigation
  const isFacultyOnly = user?.roles?.some(r => r.toLowerCase() === 'faculty_admin') && !user?.roles?.includes('platform_admin');
  if (isFacultyOnly) {
    return <FacultyPortal />;
  }

  return (
    <div className="app-viewport">
      {/* Top Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={(tab) => {
          if (tab) setSettingsTab(tab);
          setIsSettingsOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main style={{ minHeight: 'calc(100vh - 140px)' }}>
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
        {activeTab === 'attendance' && <Attendance />}
        {activeTab === 'learn' && <Learn />}
        {activeTab === 'grow' && <Grow />}
        {activeTab === 'campus' && <Campus />}
        {activeTab === 'profile' && (
          <Profile
            onOpenSettings={(tab) => {
              if (tab) setSettingsTab(tab);
              setIsSettingsOpen(true);
            }}
            onOpenAdmin={() => setActiveTab('admin')}
          />
        )}
        {activeTab === 'admin' && <Admin />}
      </main>

      {/* Settings Modal (Profile, Reminders, Security, Privacy DPDP, Server, About) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        onOpenAdmin={() => {
          setIsSettingsOpen(false);
          setActiveTab('admin');
        }}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
