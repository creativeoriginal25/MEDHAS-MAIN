import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, 
  KeyRound, 
  UserCheck, 
  ListFilter, 
  AlertCircle, 
  Check, 
  RefreshCw,
  Clock,
  Users,
  Search,
  Activity,
  CalendarCheck,
  Building2,
  Laptop,
  Smartphone,
  ChevronRight
} from 'lucide-react';

const DEPARTMENTS = ['ALL', 'CSE', 'AIDS', 'AIML', 'ECE', 'IT', 'MECH', 'CIVIL', 'EEE', 'CSD', 'CSBS'];
const ALL_ROLES = [
  'student',
  'attendance_admin',
  'content_editor',
  'campus_operator',
  'platform_admin',
];

export const Admin: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [adminTab, setAdminTab] = useState<'students' | 'sessions' | 'reset' | 'roles' | 'audit'>('students');

  // Overview Metrics
  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Students Directory
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Sign-in Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Reset PIN form
  const [targetReg, setTargetReg] = useState('');
  const [newPin, setNewPin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Role Assignment form
  const [roleReg, setRoleReg] = useState('');
  const [selectedRole, setSelectedRole] = useState('attendance_admin');
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const isPlatformAdmin = hasRole('platform_admin') || user?.register_number === '25B91A05D8' || (user as any)?.is_admin;

  // Fetch overview metrics
  const fetchOverview = async () => {
    setOverviewLoading(true);
    try {
      const data = await adminApi.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to fetch admin overview', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const data = await adminApi.getStudents(selectedBranch, searchQuery);
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students roster', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await adminApi.getSessions(60);
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch login sessions', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await adminApi.getAuditLogs(50);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (adminTab === 'students') {
      const timer = setTimeout(() => {
        fetchStudents();
      }, 250);
      return () => clearTimeout(timer);
    } else if (adminTab === 'sessions') {
      fetchSessions();
    } else if (adminTab === 'audit') {
      fetchAuditLogs();
    }
  }, [adminTab, selectedBranch, searchQuery]);

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess(null);
    setResetError(null);

    setResetLoading(true);
    try {
      await adminApi.resetPin(targetReg.trim().toUpperCase(), newPin.trim());
      setResetSuccess(`PIN for ${targetReg.toUpperCase()} has been reset successfully!`);
      setTargetReg('');
      setNewPin('');
      fetchStudents();
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset PIN.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleSuccess(null);
    setRoleError(null);

    setRoleLoading(true);
    try {
      await adminApi.assignRole(roleReg.trim().toUpperCase(), selectedRole);
      setRoleSuccess(`Assigned ${selectedRole} to ${roleReg.toUpperCase()}`);
      setRoleReg('');
      fetchStudents();
    } catch (err: any) {
      setRoleError(err.message || 'Failed to assign role.');
    } finally {
      setRoleLoading(false);
    }
  };

  const openResetForStudent = (reg: string) => {
    setTargetReg(reg);
    setNewPin('');
    setResetSuccess(null);
    setResetError(null);
    setAdminTab('reset');
  };

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Admin Header with KPI Summary */}
      <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-ruled">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: 38, 
              height: 38, 
              borderRadius: '8px', 
              background: 'rgba(227, 168, 59, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid var(--accent-gold)'
            }}>
              <ShieldCheck size={22} color="var(--accent-gold)" />
            </div>
            <div>
              <span className="card-header-title font-serif" style={{ fontSize: '1.25rem' }}>
                Administrative Control Suite
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                SRKR College Registry, live student roster & access management
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => { fetchOverview(); if (adminTab === 'students') fetchStudents(); if (adminTab === 'sessions') fetchSessions(); }}
            title="Refresh Data"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
          >
            <RefreshCw size={13} className={overviewLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* High-level KPI Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: '0.75rem',
          marginTop: '1rem',
          marginBottom: '1rem'
        }}>
          <div className="admin-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Users size={14} color="var(--ink)" />
              <span>Registered</span>
            </div>
            <div className="mono-num" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)' }}>
              {overview?.total_students ?? '—'}
            </div>
          </div>

          <div className="admin-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Activity size={14} color="var(--good)" />
              <span>Sign-ins</span>
            </div>
            <div className="mono-num" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--good)' }}>
              {overview?.total_sessions ?? '—'}
            </div>
          </div>

          <div className="admin-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <CalendarCheck size={14} color="var(--accent-gold)" />
              <span>Ledger Logs</span>
            </div>
            <div className="mono-num" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)' }}>
              {overview?.total_attendance_logs ?? '—'}
            </div>
          </div>

          <div className="admin-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Building2 size={14} color="var(--ink-soft)" />
              <span>Sections</span>
            </div>
            <div className="mono-num" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ink)' }}>
              {overview?.total_sections ?? '—'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="forecast-view-switch" style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            className={`forecast-view-btn ${adminTab === 'students' ? 'active' : ''}`}
            onClick={() => setAdminTab('students')}
          >
            <Users size={15} />
            <span>Students ({students.length || overview?.total_students || 0})</span>
          </button>

          <button
            type="button"
            className={`forecast-view-btn ${adminTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setAdminTab('sessions')}
          >
            <Activity size={15} />
            <span>Activity</span>
          </button>

          <button
            type="button"
            className={`forecast-view-btn ${adminTab === 'reset' ? 'active' : ''}`}
            onClick={() => setAdminTab('reset')}
          >
            <KeyRound size={15} />
            <span>PIN Reset</span>
          </button>

          {isPlatformAdmin && (
            <button
              type="button"
              className={`forecast-view-btn ${adminTab === 'roles' ? 'active' : ''}`}
              onClick={() => setAdminTab('roles')}
            >
              <UserCheck size={15} />
              <span>Roles</span>
            </button>
          )}

          <button
            type="button"
            className={`forecast-view-btn ${adminTab === 'audit' ? 'active' : ''}`}
            onClick={() => setAdminTab('audit')}
          >
            <ListFilter size={15} />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENTS ROSTER */}
      {adminTab === 'students' && (
        <div className="ledger-card">
          <div className="card-header-ruled" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span className="card-header-title font-serif" style={{ fontSize: '1.15rem' }}>
                Registered Students Directory
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Showing enrolled students, department sections, and live calculated attendance.
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 200px', maxWidth: '360px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
              <input
                type="text"
                placeholder="Search register no. or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-control font-mono"
                style={{ paddingLeft: '2.2rem', minHeight: '38px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Department Filter Pills */}
          <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', padding: '0.75rem 0 1rem', scrollbarWidth: 'none' }}>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                className={`admin-branch-chip ${selectedBranch === dept ? 'active' : ''}`}
                onClick={() => setSelectedBranch(dept)}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Student Content */}
          {studentsLoading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              Loading students directory...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              No students found matching your criteria.
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="admin-desktop-only" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Register No.</th>
                      <th>Display Name</th>
                      <th>Branch & Sec</th>
                      <th>Year / Sem</th>
                      <th>Attendance</th>
                      <th>Periods (Att / Tot)</th>
                      <th>Roles</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => {
                      const isGood = (s.attendance_percentage || 0) >= 75;
                      return (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {s.register_number}
                          </td>
                          <td style={{ color: 'var(--ink)', fontWeight: 600 }}>
                            {s.display_name || s.register_number}
                          </td>
                          <td>
                            <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                              {s.branch} - Sec {s.section_label || 'A'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                            Y{s.academic_year || 1} · S{s.current_semester || 1}
                          </td>
                          <td>
                            <span 
                              className={`badge ${isGood ? 'badge-good' : 'badge-danger'} mono-num`}
                              style={{ fontWeight: 800, fontSize: '0.78rem' }}
                            >
                              {s.attendance_percentage}%
                            </span>
                          </td>
                          <td className="mono-num" style={{ color: 'var(--ink-soft)' }}>
                            {s.total_attended} / {s.total_periods}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                              {(s.roles || ['student']).map((r: string) => (
                                <span 
                                  key={r} 
                                  className="badge"
                                  style={{ 
                                    fontSize: '0.65rem', 
                                    background: r === 'platform_admin' ? 'rgba(217,119,6,0.15)' : 'var(--surface-alt)',
                                    color: r === 'platform_admin' ? 'var(--accent-gold)' : 'var(--ink-soft)',
                                    border: '1px solid var(--rule)',
                                    fontWeight: r === 'platform_admin' ? 800 : 600,
                                  }}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openResetForStudent(s.register_number)}
                              style={{ fontSize: '0.75rem', padding: '0.28rem 0.6rem' }}
                            >
                              Reset PIN
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW (Clean responsive stack) */}
              <div className="admin-mobile-only">
                {students.map((s) => {
                  const isGood = (s.attendance_percentage || 0) >= 75;
                  return (
                    <div key={s.id} className="admin-student-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono-num" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>
                          {s.register_number}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {s.branch} - Sec {s.section_label || 'A'}
                          </span>
                          <span className={`badge ${isGood ? 'badge-good' : 'badge-danger'} mono-num`} style={{ fontWeight: 800, fontSize: '0.72rem' }}>
                            {s.attendance_percentage}%
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)' }}>
                          {s.display_name || s.register_number}
                        </div>
                        <div className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                          Y{s.academic_year || 1} · S{s.current_semester || 1}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid var(--rule)', marginTop: '0.2rem' }}>
                        <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                          Periods: {s.total_attended} / {s.total_periods}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openResetForStudent(s.register_number)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          Reset PIN
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: SIGN-IN ACTIVITY */}
      {adminTab === 'sessions' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <div>
              <span className="card-header-title font-serif" style={{ fontSize: '1.15rem' }}>
                Recent Student Sign-in Sessions
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Real-time log of student and administrator logins across web and mobile.
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={fetchSessions}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={13} className={sessionsLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {sessionsLoading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              Loading login sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              No recent sign-in activity recorded.
            </div>
          ) : (
            <>
              {/* DESKTOP SESSIONS TABLE */}
              <div className="admin-desktop-only" style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Register No.</th>
                      <th>Name</th>
                      <th>Branch & Section</th>
                      <th>Platform</th>
                      <th>Login Timestamp</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((sess) => (
                      <tr key={sess.id}>
                        <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {sess.register_number}
                        </td>
                        <td style={{ color: 'var(--ink)', fontWeight: 600 }}>
                          {sess.display_name}
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                            {sess.branch} - Sec {sess.section_label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ink-soft)', fontSize: '0.8rem' }}>
                            {sess.platform === 'mobile' ? <Smartphone size={14} /> : <Laptop size={14} />}
                            <span style={{ textTransform: 'capitalize' }}>{sess.platform || 'web'}</span>
                          </div>
                        </td>
                        <td className="mono-num" style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>
                          {sess.created_at ? new Date(sess.created_at).toLocaleString('en-IN') : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge badge-good" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE SESSIONS CARDS */}
              <div className="admin-mobile-only" style={{ marginTop: '0.5rem' }}>
                {sessions.map((sess) => (
                  <div key={sess.id} className="admin-student-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono-num" style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {sess.register_number}
                      </span>
                      <span className="badge badge-good" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                        Active
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 600 }}>
                        {sess.display_name}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                        {sess.branch} - Sec {sess.section_label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid var(--rule)', marginTop: '0.2rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                        {sess.platform === 'mobile' ? <Smartphone size={13} /> : <Laptop size={13} />}
                        <span style={{ textTransform: 'capitalize' }}>{sess.platform || 'web'}</span>
                      </span>
                      <span className="mono-num" style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                        {sess.created_at ? new Date(sess.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PIN RESET */}
      {adminTab === 'reset' && (
        <div className="ledger-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div className="card-header-ruled">
            <span className="card-header-title font-serif" style={{ fontSize: '1.15rem' }}>
              Emergency Student PIN Reset
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--ink-soft)', margin: '0.5rem 0 1rem', lineHeight: 1.45 }}>
            Allows authorized administrators to reset a student's forgotten PIN. All actions are logged to the permanent audit trail.
          </p>

          {resetSuccess && (
            <div className="alert-callout success" style={{ marginBottom: '1rem' }}>
              <Check size={16} />
              <span>{resetSuccess}</span>
            </div>
          )}

          {resetError && (
            <div className="alert-callout error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{resetError}</span>
            </div>
          )}

          <form onSubmit={handleResetPin}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Student Register Number</label>
              <input
                type="text"
                className="input-control font-mono"
                placeholder="e.g. 25B91A0501"
                value={targetReg}
                onChange={(e) => setTargetReg(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">New PIN (4–6 digits)</label>
              <input
                type="password"
                className="input-control font-mono"
                placeholder="Enter new PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                minLength={4}
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={resetLoading}
              style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}
            >
              {resetLoading ? 'Resetting PIN...' : 'Reset Student PIN'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ROLES ASSIGNMENT */}
      {adminTab === 'roles' && isPlatformAdmin && (
        <div className="ledger-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div className="card-header-ruled">
            <span className="card-header-title font-serif" style={{ fontSize: '1.15rem' }}>
              Role & Privilege Assignment
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--ink-soft)', margin: '0.5rem 0 1rem', lineHeight: 1.45 }}>
            Elevate or assign administrative capabilities to student or faculty accounts.
          </p>

          {roleSuccess && (
            <div className="alert-callout success" style={{ marginBottom: '1rem' }}>
              <Check size={16} />
              <span>{roleSuccess}</span>
            </div>
          )}

          {roleError && (
            <div className="alert-callout error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{roleError}</span>
            </div>
          )}

          <form onSubmit={handleAssignRole}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Register Number</label>
              <input
                type="text"
                className="input-control font-mono"
                placeholder="e.g. 25B91A05D8"
                value={roleReg}
                onChange={(e) => setRoleReg(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Select Role</label>
              <select
                className="input-control font-mono"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={roleLoading}
              style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}
            >
              {roleLoading ? 'Assigning Role...' : 'Assign Privilege Role'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <div>
              <span className="card-header-title font-serif" style={{ fontSize: '1.15rem' }}>
                Security & Action Audit Logs
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Immutable ledger of administrative actions, role assignments, and resets.
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchAuditLogs}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={13} className={logsLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-soft)' }}>
              <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              Loading audit records...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-soft)' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="mono-num" style={{ color: 'var(--ink-soft)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {log.actor_register || 'SYSTEM'}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                        {log.target_register || '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--ink)' }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
