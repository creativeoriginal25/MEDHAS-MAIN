import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, attendanceApi } from '../api/client';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Award, 
  Check, 
  AlertCircle,
  BookOpen,
  Sparkles,
  Building2,
  Settings,
  Bus,
  Coffee,
  CheckCircle2,
  Flame,
  ArrowRight
} from 'lucide-react';

interface ProfileProps {
  onOpenSettings?: (tab?: 'profile' | 'reminders' | 'security' | 'privacy' | 'server' | 'about') => void;
}

export const Profile: React.FC<ProfileProps> = ({ onOpenSettings }) => {
  const { user, refreshUser } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    attendanceApi.getDashboard().then(setSummary).catch(console.error);
  }, []);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinSuccess(null);
    setPinError(null);

    if (newPin.length < 4) {
      setPinError('New PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PIN and confirmation do not match.');
      return;
    }

    setPinLoading(true);
    try {
      await authApi.changePin(currentPin, newPin);
      setPinSuccess('PIN updated successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinError(err.message || 'Failed to change PIN. Verify your current PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  if (!user) return null;

  const pct = summary?.overall_percentage ?? 0;
  const isSafe = pct >= 75;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Academic Identity Hero Card */}
      <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--ink)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.25rem',
              border: '2px solid rgba(227, 168, 59, 0.4)',
              boxShadow: '0 2px 8px rgba(36, 27, 78, 0.2)',
            }}>
              {user.register_number.slice(-2)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {user.display_name || `Student ${user.register_number}`}
                </h2>
                <span className="badge badge-neutral mono-num" style={{ fontWeight: 700 }}>
                  {user.register_number}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                SRKR Engineering College · {user.branch || 'CSE'} Department · Section {user.section_label || 'A'}
              </div>
            </div>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenSettings('profile')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Settings size={14} />
              <span>Settings & Preferences</span>
            </button>
          )}
        </div>

        {/* Academic Details Meta Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--rule)',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', fontWeight: 600 }}>
              Academic Standing
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginTop: '0.15rem' }}>
              Year {user.academic_year || 2} · Sem {user.current_semester || 4}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', fontWeight: 600 }}>
              Section Allotment
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginTop: '0.15rem' }}>
              {user.branch || 'CSE'} - Section {user.section_label || 'A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', fontWeight: 600 }}>
              Baseline Records
            </div>
            <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginTop: '0.15rem' }}>
              {user.baseline_attended || 0} / {user.baseline_total || 0} Periods
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', fontWeight: 600 }}>
              Baseline Cutoff
            </div>
            <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginTop: '0.15rem' }}>
              {user.baseline_date || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Profile Sections: Learn & Academics + Grow & Career + Campus & Logistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Learn & Curriculum Profile */}
        <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
          <div className="card-header-ruled" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} color="var(--accent-gold)" />
            <span className="card-header-title font-serif">Learn & Academic Registry</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Enrolled Curriculum:</span>
              <strong style={{ color: 'var(--ink)' }}>Autonomous R20 / R23</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Core Subjects Tracked:</span>
              <strong style={{ color: 'var(--ink)' }}>4 Subjects (20 Units)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Primary Subjects:</span>
              <span style={{ color: 'var(--ink)', fontSize: '0.78rem', textAlign: 'right' }}>
                Applied Physics, Maths, C, English
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Lab Sessions:</span>
              <strong style={{ color: 'var(--ink)' }}>Physics & C Programming Labs</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Semester Exam Weightage:</span>
              <strong style={{ color: 'var(--good)' }}>30 Internal + 70 External</strong>
            </div>
          </div>
        </div>

        {/* Grow & Career Profile */}
        <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
          <div className="card-header-ruled" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--accent-gold)" />
            <span className="card-header-title font-serif">Grow & Career Pathways</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Primary Career Track:</span>
              <strong style={{ color: 'var(--ink)' }}>Full-Stack Software Engineer</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Target Campus Drive:</span>
              <strong style={{ color: 'var(--ink)' }}>Day-1 Dream & Super Dream</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.35rem' }}>
                Skills Profile in Progress:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {['TypeScript', 'React.js', 'FastAPI', 'PostgreSQL', 'Data Structures', 'Docker'].map((s) => (
                  <span key={s} className="mono-num" style={{
                    fontSize: '0.7rem',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--rule)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '3px',
                    fontWeight: 600,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', paddingTop: '0.4rem', borderTop: '1px solid var(--rule)' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Milestones Completed:</span>
              <strong style={{ color: 'var(--good)' }}>Year 1 Foundations (Completed)</strong>
            </div>
          </div>
        </div>

        {/* Campus & Logistics Profile */}
        <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
          <div className="card-header-ruled" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16} color="var(--accent-gold)" />
            <span className="card-header-title font-serif">Campus Logistics & Amenities</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Residency Status:</span>
              <strong style={{ color: 'var(--ink)' }}>Day Scholar (Commuter)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>College Bus Pass:</span>
              <strong className="mono-num" style={{ color: 'var(--ink)' }}>Route #14 (Bhimavaram Town)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Favorite Dining Spot:</span>
              <strong style={{ color: 'var(--ink)' }}>Nutri Delight Canteen</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Library Card ID:</span>
              <strong className="mono-num" style={{ color: 'var(--ink)' }}>LIB-22B91A0501</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--ink-soft)' }}>Digital Gate Pass:</span>
              <strong style={{ color: 'var(--good)' }}>Verified & Active</strong>
            </div>
          </div>
        </div>

        {/* 3. Security & PIN Management */}
        <div className="ledger-card" style={{ border: '1px solid var(--rule)' }}>
          <div className="card-header-ruled" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} color="var(--accent-gold)" />
            <span className="card-header-title font-serif">Security & PIN Change</span>
          </div>

          {pinSuccess && (
            <div className="alert-callout success" style={{ marginBottom: '0.75rem' }}>
              <CheckCircle2 size={15} />
              <span>{pinSuccess}</span>
            </div>
          )}

          {pinError && (
            <div className="alert-callout danger" style={{ marginBottom: '0.75rem' }}>
              <AlertCircle size={15} />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div className="input-group">
              <label className="input-label">Current PIN</label>
              <input
                type="password"
                className="input-control mono-num"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="input-group">
                <label className="input-label">New PIN</label>
                <input
                  type="password"
                  className="input-control mono-num"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm PIN</label>
                <input
                  type="password"
                  className="input-control mono-num"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={pinLoading}
              style={{ marginTop: '0.4rem', justifyContent: 'center' }}
            >
              {pinLoading ? 'Updating PIN...' : 'Update Security PIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Profile;
