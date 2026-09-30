import React from 'react';
import { Home, CalendarCheck, BookOpen, Sparkles, Building2 } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bottom-tab-bar">
      <button 
        type="button"
        className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}
      >
        <Home size={19} />
        <span>Home</span>
        {activeTab === 'home' && <span className="tab-indicator" />}
      </button>

      <button 
        type="button"
        className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
        onClick={() => setActiveTab('attendance')}
      >
        <CalendarCheck size={19} />
        <span>Attendance</span>
        {activeTab === 'attendance' && <span className="tab-indicator" />}
      </button>

      <button 
        type="button"
        className={`tab-btn ${activeTab === 'learn' ? 'active' : ''}`}
        onClick={() => setActiveTab('learn')}
      >
        <BookOpen size={19} />
        <span>Learn</span>
        {activeTab === 'learn' && <span className="tab-indicator" />}
      </button>

      <button 
        type="button"
        className={`tab-btn ${activeTab === 'grow' ? 'active' : ''}`}
        onClick={() => setActiveTab('grow')}
      >
        <Sparkles size={19} />
        <span>Grow</span>
        {activeTab === 'grow' && <span className="tab-indicator" />}
      </button>

      <button 
        type="button"
        className={`tab-btn ${activeTab === 'campus' ? 'active' : ''}`}
        onClick={() => setActiveTab('campus')}
      >
        <Building2 size={19} />
        <span>Campus</span>
        {activeTab === 'campus' && <span className="tab-indicator" />}
      </button>
    </nav>
  );
};
export default BottomNav;
