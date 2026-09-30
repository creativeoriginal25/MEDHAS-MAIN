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
  Clock
} from 'lucide-react';

const ALL_ROLES = [
  'student',
  'attendance_admin',
  'content_editor',
  'campus_operator',
  'platform_admin',
];

export const Admin: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [adminTab, setAdminTab] = useState<'reset' | 'roles' | 'audit'>('reset');

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

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await adminApi.getAuditLogs(30);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'audit') {
      fetchAuditLogs();
    }
  }, [adminTab]);

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
    } catch (err: any) {
      setRoleError(err.message || 'Failed to assign role.');
    } finally {
      setRoleLoading(false);
    }
  };

  return (
    <div>
      {/* Admin Header */}
      <div className="ledger-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header-ruled">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={20} color="var(--accent-gold)" />
            <span className="card-header-title font-serif" style={{ fontSize: '1.15rem' }}>
              Administrative Suite
            </span>
          </div>
          <span className="card-header-badge good">Audit Active</span>
        </div>

        {/* Admin Sub Navigation */}
        <div className="forecast-view-switch" style={{ marginTop: '0.75rem' }}>
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

      {/* SUB-VIEW 1: PIN RESET */}
      {adminTab === 'reset' && (
        <div className="ledger-card" style={{ maxWidth: '520px' }}>
          <div className="card-header-ruled">
            <span className="card-header-title">Emergency Student PIN Reset</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '0.5rem 0 1rem' }}>
            Allows attendance administrators to reset a student's forgotten PIN. All actions are logged.
          </p>

          {resetSuccess && (
            <div className="alert-callout success">
              <Check size={16} />
              <span>{resetSuccess}</span>
            </div>
          )}

          {resetError && (
            <div className="alert-callout error">
              <AlertCircle size={16} />
              <span>{resetError}</span>
            </div>
          )}

          <form onSubmit={handleResetPin}>
            <div className="form-field">
              <label className="form-label">Student Register Number</label>
              <input
                type="text"
                className="form-control mono"
                placeholder="e.g. 22B91A0501"
                value={targetReg}
                onChange={(e) => setTargetReg(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">New PIN (4–6 Digits)</label>
              <input
                type="password"
                className="form-control mono"
                placeholder="••••"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={resetLoading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {resetLoading ? 'Resetting...' : 'Execute PIN Reset'}
            </button>
          </form>
        </div>
      )}

      {/* SUB-VIEW 2: ROLE ASSIGNMENT */}
      {adminTab === 'roles' && isPlatformAdmin && (
        <div className="ledger-card" style={{ maxWidth: '520px' }}>
          <div className="card-header-ruled">
            <span className="card-header-title">Privileged Role Assignment</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '0.5rem 0 1rem' }}>
            Grant administrative access (Attendance Admin, Content Editor, Campus Operator) to any verified student.
          </p>

          {roleSuccess && (
            <div className="alert-callout success">
              <Check size={16} />
              <span>{roleSuccess}</span>
            </div>
          )}

          {roleError && (
            <div className="alert-callout error">
              <AlertCircle size={16} />
              <span>{roleError}</span>
            </div>
          )}

          <form onSubmit={handleAssignRole}>
            <div className="form-field">
              <label className="form-label">User Register Number</label>
              <input
                type="text"
                className="form-control mono"
                placeholder="e.g. 22B91A0501"
                value={roleReg}
                onChange={(e) => setRoleReg(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Role to Grant</label>
              <select
                className="form-control mono"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={roleLoading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {roleLoading ? 'Assigning...' : 'Grant Role Permission'}
            </button>
          </form>
        </div>
      )}

      {/* SUB-VIEW 3: AUDIT TRAIL */}
      {adminTab === 'audit' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span className="card-header-title">Recent Security Audit Logs</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fetchAuditLogs}
                disabled={logsLoading}
              >
                <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} style={{ padding: '0.75rem', background: 'var(--surface-alt)', border: '1px solid var(--rule)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="card-header-badge good" style={{ fontSize: '0.68rem' }}>
                        {log.action}
                      </span>
                      <span className="mono-num" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        By {log.register_number}
                      </span>
                    </div>
                    {log.details && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                        {log.details}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={12} />
                    <span>{log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Recent'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                No audit entries recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Admin;
