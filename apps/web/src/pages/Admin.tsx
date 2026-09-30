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
  Laptop
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

  const isPlatformAdmin = hasRole('platform_admin');

  // Fetch overview metrics once
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
    <div>
      {/* Admin Header with KPI Summary */}
      <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-ruled">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={22} color="var(--accent-gold, #d97706)" />
            <div>
              <span className="card-header-title font-serif" style={{ fontSize: '1.2rem' }}>
                Administrative Roster & Control Suite
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                College-wide student registry, active session tracking & role management
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-text" 
            onClick={() => { fetchOverview(); if (adminTab === 'students') fetchStudents(); if (adminTab === 'sessions') fetchSessions(); }}
            title="Refresh Data"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
          >
            <RefreshCw size={13} className={overviewLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* High-level KPI Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginTop: '1rem',
          marginBottom: '1rem'
        }}>
          <div className="summary-stat-box" style={{ background: 'var(--card-bg-subtle, rgba(0,0,0,0.02))', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Users size={14} color="var(--primary)" />
              <span>Registered</span>
            </div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
              {overview?.total_students ?? '—'}
            </div>
          </div>

          <div className="summary-stat-box" style={{ background: 'var(--card-bg-subtle, rgba(0,0,0,0.02))', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Activity size={14} color="var(--good, #16a34a)" />
              <span>Sign-in Sessions</span>
            </div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--good, #16a34a)' }}>
              {overview?.total_sessions ?? '—'}
            </div>
          </div>

          <div className="summary-stat-box" style={{ background: 'var(--card-bg-subtle, rgba(0,0,0,0.02))', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <CalendarCheck size={14} color="var(--accent-gold, #d97706)" />
              <span>Attendance Logs</span>
            </div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
              {overview?.total_attendance_logs ?? '—'}
            </div>
          </div>

          <div className="summary-stat-box" style={{ background: 'var(--card-bg-subtle, rgba(0,0,0,0.02))', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Building2 size={14} color="var(--ink-soft)" />
              <span>Sections</span>
            </div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
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
            <span>Students Roster ({students.length || overview?.total_students || 0})</span>
          </button>

          <button
            type="button"
            className={`forecast-view-btn ${adminTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setAdminTab('sessions')}
          >
            <Activity size={15} />
            <span>Sign-in Activity</span>
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
              <span>Role Permissions</span>
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
              <span className="card-header-title font-serif" style={{ fontSize: '1.1rem' }}>
                Registered Students Directory
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Showing enrolled students, department sections, and live calculated attendance.
              </div>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }} />
                <input
                  type="text"
                  placeholder="Search register no. or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ledger-input"
                  style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.8rem', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.75rem 0 1rem' }}>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                className={`tag-pill ${selectedBranch === dept ? 'active' : ''}`}
                onClick={() => setSelectedBranch(dept)}
                style={{
                  fontSize: '0.725rem',
                  padding: '0.2rem 0.6rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: selectedBranch === dept ? 'var(--primary)' : 'transparent',
                  color: selectedBranch === dept ? '#fff' : 'var(--ink-soft)',
                  fontWeight: selectedBranch === dept ? 700 : 500,
                }}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Table */}
          {studentsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              Loading students directory...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              No students found matching your criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--ink-soft)' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Register No.</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Display Name</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Branch / Sec</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Year / Sem</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Attendance</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Periods (Att / Tot)</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Roles</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.06))' }}>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {s.register_number}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: 'var(--ink)' }}>
                        {s.display_name || s.register_number}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span className="card-header-badge" style={{ fontSize: '0.7rem' }}>
                          {s.branch} - Sec {s.section_label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                        Y{s.academic_year} · S{s.current_semester}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span 
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: s.attendance_percentage >= 75 ? 'var(--good, #16a34a)' : 'var(--warn, #dc2626)'
                          }}
                        >
                          {s.attendance_percentage}%
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                        {s.total_attended} / {s.total_periods}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {s.roles.map((r: string) => (
                            <span 
                              key={r} 
                              style={{ 
                                fontSize: '0.65rem', 
                                padding: '0.1rem 0.4rem', 
                                borderRadius: '4px',
                                background: r === 'platform_admin' ? 'rgba(217,119,6,0.15)' : 'var(--card-bg-subtle, rgba(0,0,0,0.04))',
                                color: r === 'platform_admin' ? 'var(--accent-gold, #d97706)' : 'var(--ink-soft)',
                                fontWeight: r === 'platform_admin' ? 700 : 500,
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-text"
                          onClick={() => openResetForStudent(s.register_number)}
                          style={{ fontSize: '0.75rem', color: 'var(--primary)' }}
                        >
                          Reset PIN
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIGN-IN ACTIVITY */}
      {adminTab === 'sessions' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <div>
              <span className="card-header-title font-serif" style={{ fontSize: '1.1rem' }}>
                Recent Student Sign-in Sessions
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                Real-time log of student and administrator logins across web and mobile.
              </div>
            </div>
            <button 
              type="button" 
              className="btn-text" 
              onClick={fetchSessions}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={13} className={sessionsLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {sessionsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              Loading login sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              No recent sign-in activity recorded.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
              <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--ink-soft)' }}>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Student Register No.</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Student Name</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Branch & Section</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Platform</th>
                    <th style={{ padding: '0.6rem 0.5rem' }}>Login Timestamp</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess) => (
                    <tr key={sess.id} style={{ borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.06))' }}>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {sess.register_number}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: 'var(--ink)' }}>
                        {sess.display_name}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <span className="card-header-badge" style={{ fontSize: '0.7rem' }}>
                          {sess.branch} - Sec {sess.section_label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--ink-soft)' }}>
                          <Laptop size={13} />
                          <span style={{ textTransform: 'capitalize' }}>{sess.platform}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', fontSize: '0.775rem' }}>
                        {sess.created_at ? new Date(sess.created_at).toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        <span style={{ color: 'var(--good, #16a34a)', fontWeight: 600, fontSize: '0.75rem' }}>
                          ● Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PIN RESET */}
      {adminTab === 'reset' && (
        <div className="ledger-card" style={{ maxWidth: '520px' }}>
          <div className="card-header-ruled">
            <span className="card-header-title">Emergency Student PIN Reset</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '0.5rem 0 1rem' }}>
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
                className="ledger-input"
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
                className="ledger-input"
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
              className="ledger-btn primary"
              disabled={resetLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {resetLoading ? 'Resetting PIN...' : 'Reset PIN'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ROLES ASSIGNMENT */}
      {adminTab === 'roles' && isPlatformAdmin && (
        <div className="ledger-card" style={{ maxWidth: '520px' }}>
          <div className="card-header-ruled">
            <span className="card-header-title">Role & Privilege Assignment</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '0.5rem 0 1rem' }}>
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
                className="ledger-input"
                placeholder="e.g. 25B91A05D8"
                value={roleReg}
                onChange={(e) => setRoleReg(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Select Role</label>
              <select
                className="ledger-input"
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
              className="ledger-btn primary"
              disabled={roleLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {roleLoading ? 'Assigning Role...' : 'Assign Role'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <span className="card-header-title">Security & Action Audit Logs</span>
            <button
              type="button"
              className="btn-text"
              onClick={fetchAuditLogs}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <RefreshCw size={13} className={logsLoading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)' }}>
              Loading audit records...
            </div>
          ) : auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--ink-soft)' }}>
                    <th style={{ padding: '0.5rem' }}>Timestamp</th>
                    <th style={{ padding: '0.5rem' }}>Actor</th>
                    <th style={{ padding: '0.5rem' }}>Action</th>
                    <th style={{ padding: '0.5rem' }}>Target</th>
                    <th style={{ padding: '0.5rem' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.06))' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{log.register_number}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span className="card-header-badge" style={{ fontSize: '0.7rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{log.target || '—'}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--ink-soft)' }}>{log.details || '—'}</td>
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
