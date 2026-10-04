import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, GraduationCap, AlertCircle, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'AIDS', 'AIML', 'ECE', 'IT', 'MECH', 'CIVIL', 'EEE', 'CSD', 'CSBS'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const BRANCH_CODE_MAP: Record<string, string> = {
  '05': 'CSE',
  '44': 'AIDS',
  '42': 'AIML',
  '04': 'ECE',
  '12': 'IT',
  '03': 'MECH',
  '01': 'CIVIL',
  '02': 'EEE',
  'CSD': 'CSD',
  'CSBS': 'CSBS',
};

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [registerNumber, setRegisterNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState('1');
  const [semester, setSemester] = useState('1');
  const [baselineAttended, setBaselineAttended] = useState('');
  const [baselineTotal, setBaselineTotal] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegisterNumberChange = (val: string) => {
    const upper = val.toUpperCase();
    setRegisterNumber(upper);

    // Auto-detect year and branch if registering
    if (isRegister && upper.length >= 2) {
      const yrPrefix = upper.slice(0, 2);
      if (yrPrefix === '25') {
        setAcademicYear('1');
        setSemester('1');
      } else if (yrPrefix === '24') {
        setAcademicYear('2');
        setSemester('3');
      } else if (yrPrefix === '23') {
        setAcademicYear('3');
        setSemester('5');
      } else if (yrPrefix === '22') {
        setAcademicYear('4');
        setSemester('7');
      }

      // Check standard JNTUK format like 25B91A05...
      if (upper.length >= 8) {
        const branchCode = upper.slice(6, 8);
        if (BRANCH_CODE_MAP[branchCode]) {
          setBranch(BRANCH_CODE_MAP[branchCode]);
        }
      }
    }
  };

  const handleYearChange = (newYear: string) => {
    setAcademicYear(newYear);
    const yr = parseInt(newYear, 10);
    setSemester(String(yr * 2 - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const reg = registerNumber.trim().toUpperCase();
    if (!reg) {
      setError('Please enter your register number.');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setError('PIN / Password must be at least 4 characters.');
      return;
    }

    const bAtt = parseInt(baselineAttended) || 0;
    const bTot = parseInt(baselineTotal) || 0;

    if (isRegister) {
      if (bTot < bAtt) {
        setError('Baseline total cannot be less than attended.');
        return;
      }
      if (!dpdpConsent) {
        setError('You must agree to the DPDP Act 2023 notice to register.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({
          register_number: reg,
          pin,
          display_name: displayName.trim() || undefined,
          branch,
          section,
          academic_year: parseInt(academicYear, 10),
          semester: parseInt(semester, 10),
          baseline_attended: bAtt,
          baseline_total: bTot,
        });
      } else {
        await login(reg, pin);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg)',
    }}>
      <div className="ledger-card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2rem',
        boxShadow: '0 16px 36px rgba(36, 27, 78, 0.14)',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-crest" style={{ margin: '0 auto 0.75rem', width: '48px', height: '48px' }}>
            <GraduationCap size={24} className="brand-icon-glyph" />
          </div>
          <h1 className="font-serif" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--ink)' }}>
            MEDHAS
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
            SRKR Engineering College Academic Portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="forecast-view-switch" style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`forecast-view-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(null); }}
          >
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`forecast-view-btn ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(null); }}
          >
            <span>Register / Activate</span>
          </button>
        </div>

        {error && (
          <div className="alert-callout error" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--bad, #dc2626)' }} />
              <span style={{ fontSize: '0.85rem', lineHeight: 1.45, fontWeight: 500 }}>{error}</span>
            </div>
            {error.toLowerCase().includes('not registered') && !isRegister && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <span>Register / Activate {registerNumber ? `'${registerNumber}'` : 'Now'} →</span>
              </button>
            )}
            {error.toLowerCase().includes('already exists') && isRegister && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <span>Switch to Sign In →</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Register Number</label>
            <input
              type="text"
              className="form-control mono"
              placeholder="e.g. 25B91A05D8"
              value={registerNumber}
              onChange={(e) => handleRegisterNumberChange(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Security PIN (4–6 Digits)</label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  padding: '0 0.2rem'
                }}
              >
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPin ? 'text' : 'password'}
                className="form-control mono"
                placeholder={showPin ? 'PIN / Password' : '••••'}
                maxLength={20}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                style={{ letterSpacing: '0.15em', fontWeight: 600, paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                tabIndex={-1}
                title={showPin ? 'Hide PIN' : 'Show PIN'}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                {showPin ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <>
              <div className="form-field">
                <label className="form-label">Student Name (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              {/* Academic Year & Semester */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Academic Year *</label>
                  <select
                    className="form-control mono"
                    value={academicYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    required
                  >
                    <option value="1">Year 1 (Freshman)</option>
                    <option value="2">Year 2 (Sophomore)</option>
                    <option value="3">Year 3 (Pre-Final)</option>
                    <option value="4">Year 4 (Final Year)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Semester *</label>
                  <select
                    className="form-control mono"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    required
                  >
                    {academicYear === '1' && (
                      <>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </>
                    )}
                    {academicYear === '2' && (
                      <>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                      </>
                    )}
                    {academicYear === '3' && (
                      <>
                        <option value="5">Semester 5</option>
                        <option value="6">Semester 6</option>
                      </>
                    )}
                    {academicYear === '4' && (
                      <>
                        <option value="7">Semester 7</option>
                        <option value="8">Semester 8</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Department & Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Department *</label>
                  <select
                    className="form-control mono"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Section *</label>
                  <select
                    className="form-control mono"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Baseline Attended</label>
                  <input
                    type="number"
                    className="form-control mono"
                    placeholder="0"
                    min="0"
                    value={baselineAttended}
                    onChange={(e) => setBaselineAttended(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Baseline Total</label>
                  <input
                    type="number"
                    className="form-control mono"
                    placeholder="0"
                    min="0"
                    value={baselineTotal}
                    onChange={(e) => setBaselineTotal(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dpdpConsent}
                    onChange={(e) => setDpdpConsent(e.target.checked)}
                    style={{ marginTop: '0.15rem' }}
                  />
                  <span>
                    I consent to the processing of academic attendance data in accordance with DPDP Act 2023.
                  </span>
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : isRegister ? 'Register / Activate Account' : 'Access Attendance Ledger'}
          </button>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid var(--rule)', paddingTop: '1rem' }}>
            {!isRegister ? (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '0 0 0.4rem 0' }}>
                  First time using Medhas?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setError(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-gold, #d97706)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Register or activate your Roll Number here
                  </button>
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', margin: 0, opacity: 0.8 }}>
                  Forgot your PIN? Contact Platform Admin (<span style={{ fontFamily: 'var(--font-mono)' }}>ADMIN01</span>) to reset it.
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: 0 }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-gold, #d97706)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Sign in to your account
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;
