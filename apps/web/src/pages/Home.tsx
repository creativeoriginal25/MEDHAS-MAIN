import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { attendanceApi } from '../api/client';
import { 
  Sparkles, 
  CalendarCheck, 
  BookOpen, 
  Compass, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  Coffee,
  CheckCircle2
} from 'lucide-react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [todayBlocks, setTodayBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [dashRes, todayRes] = await Promise.allSettled([
          attendanceApi.getDashboard(),
          attendanceApi.getToday(),
        ]);
        if (dashRes.status === 'fulfilled') setDashboard(dashRes.value);
        if (todayRes.status === 'fulfilled') setTodayBlocks(todayRes.value.blocks || []);
      } catch (err) {
        console.error('Failed to load home widgets', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const overallPct = dashboard?.overall_percentage ?? 0;
  const isSafe = overallPct >= 75;

  return (
    <div>
      {/* Welcome Hero Banner */}
      <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-ruled">
          <div>
            <div className="card-header-title font-serif" style={{ fontSize: '1.25rem' }}>
              Academic Ledger Portal
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              SRKR Engineering College · {user?.branch || 'CSE'} Department
            </div>
          </div>
          <span className={`card-header-badge ${isSafe ? 'good' : 'bad'}`}>
            {isSafe ? 'Aggregate Safe' : 'Below 75%'}
          </span>
        </div>

        <div style={{ padding: '0.5rem 0 1rem' }}>
          <h2 className="font-serif" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)' }}>
            Welcome, {user?.display_name || user?.register_number}
          </h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Section {user?.section_label || 'A'} ledger is active. Mark today's periods, verify your 75% baseline requirement, and explore syllabus roadmaps.
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('attendance')}
            >
              <CalendarCheck size={14} />
              <span>Mark Today</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('learn')}
            >
              <BookOpen size={14} />
              <span>Academic Notes</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('grow')}
            >
              <Sparkles size={14} color="var(--accent-gold)" />
              <span>Growth Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}>
        {/* Attendance Widget */}
        <div className="ledger-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-ruled">
              <span className="card-header-title">75% Aggregate</span>
              <span className={`card-header-badge ${isSafe ? 'good' : 'bad'}`}>
                {isSafe ? 'Safe' : 'Alert'}
              </span>
            </div>

            <div className="hero-figure-group" style={{ margin: '0.5rem 0' }}>
              <div>
                <div className={`hero-number ${!isSafe ? 'below-threshold' : ''}`} style={{ fontSize: '2.5rem' }}>
                  {loading ? '—' : overallPct.toFixed(2)}
                  <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>%</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                  {dashboard?.total_attended || 0} / {dashboard?.total_periods || 0} periods attended
                </div>
              </div>
            </div>

            {isSafe ? (
              <div className="bunk-banner good" style={{ fontSize: '0.78rem', padding: '0.5rem 0.65rem' }}>
                <CheckCircle2 size={15} />
                <span>Can safely miss <strong>{dashboard?.bunkable_periods || 0}</strong> periods.</span>
              </div>
            ) : (
              <div className="bunk-banner bad" style={{ fontSize: '0.78rem', padding: '0.5rem 0.65rem' }}>
                <AlertTriangle size={15} />
                <span>Must attend <strong>{dashboard?.needed_for_75 || 0}</strong> next periods.</span>
              </div>
            )}
          </div>

          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('attendance')}
            style={{ width: '100%', justifyContent: 'space-between', marginTop: '1rem' }}
          >
            <span>Attendance Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Today's Schedule Quick Peek */}
        <div className="ledger-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-ruled">
              <span className="card-header-title">Today's Schedule</span>
              <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                {todayBlocks.length} Periods
              </span>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {todayBlocks.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', padding: '0.75rem 0', textAlign: 'center' }}>
                  No classes scheduled for today.
                </div>
              ) : (
                todayBlocks.slice(0, 3).map((block: any) => (
                  <div key={block.block_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.35rem 0.5rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{block.subject}</span>
                    <span className="mono-num" style={{ color: 'var(--ink-soft)', fontSize: '0.75rem' }}>{block.periods} periods</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('attendance')}
            style={{ width: '100%', justifyContent: 'space-between', marginTop: '1rem' }}
          >
            <span>Mark Daily Log</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Quick Launch Categories */}
      <div className="ledger-card">
        <div className="card-header-ruled">
          <span className="card-header-title">Explore Academic Hub</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.5rem',
        }}>
          <div 
            style={{
              padding: '1rem',
              background: 'var(--surface-alt)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('learn')}
          >
            <BookOpen size={20} color="var(--accent-gold)" style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>Academic Notes</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>
              8 subjects, 40 unit-wise resources & syllabus.
            </div>
          </div>

          <div 
            style={{
              padding: '1rem',
              background: 'var(--surface-alt)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('grow')}
          >
            <Sparkles size={20} color="var(--accent-gold)" style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>AI Study Engine</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>
              19 prompt templates for exams & coding.
            </div>
          </div>

          <div 
            style={{
              padding: '1rem',
              background: 'var(--surface-alt)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('grow')}
          >
            <Compass size={20} color="var(--good)" style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>Career Pathways</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>
              50 career pathways & 4-year roadmaps.
            </div>
          </div>

          <div 
            style={{
              padding: '1rem',
              background: 'var(--surface-alt)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('campus')}
          >
            <Coffee size={20} color="#b45309" style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>Campus Services</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.15rem' }}>
              NutriDelight cafeteria catalog & helplines.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
