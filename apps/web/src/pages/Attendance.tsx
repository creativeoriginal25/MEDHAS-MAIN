import React, { useState } from 'react';
import { TodayTab } from '../components/attendance/TodayTab';
import { DashboardTab } from '../components/attendance/DashboardTab';
import { TimetableTab } from '../components/attendance/TimetableTab';
import { ForecastTab } from '../components/attendance/ForecastTab';
import { CalendarCheck, PieChart, Calendar, TrendingUp } from 'lucide-react';

export const Attendance: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'dashboard' | 'timetable' | 'forecast'>('today');

  return (
    <div>
      {/* Sub-navigation bar using APY view switch styling */}
      <div className="forecast-view-switch" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={`forecast-view-btn ${activeSubTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('today')}
        >
          <CalendarCheck size={15} />
          <span>Today</span>
        </button>

        <button
          type="button"
          className={`forecast-view-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('dashboard')}
        >
          <PieChart size={15} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`forecast-view-btn ${activeSubTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('timetable')}
        >
          <Calendar size={15} />
          <span>Timetable</span>
        </button>

        <button
          type="button"
          className={`forecast-view-btn ${activeSubTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('forecast')}
        >
          <TrendingUp size={15} />
          <span>Forecast</span>
        </button>
      </div>

      {/* Active Sub-Tab View */}
      {activeSubTab === 'today' && <TodayTab />}
      {activeSubTab === 'dashboard' && <DashboardTab />}
      {activeSubTab === 'timetable' && <TimetableTab />}
      {activeSubTab === 'forecast' && <ForecastTab />}
    </div>
  );
};
