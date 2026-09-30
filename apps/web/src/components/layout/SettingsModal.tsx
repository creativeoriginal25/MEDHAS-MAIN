import React, { useState, useEffect } from 'react';
import { authApi, attendanceApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  School,
  Bell,
  KeyRound,
  ShieldCheck,
  Server,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  Activity,
  Check,
  Share2,
  Lock,
  Plus
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
  initialTab?: 'profile' | 'reminders' | 'security' | 'privacy' | 'server' | 'about';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
  initialTab = 'profile',
}) => {
  const { user, refreshUser, hasRole, logout } = useAuth();
  const isAdmin = hasRole('attendance_admin') || hasRole('platform_admin');
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile State
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(user?.section_id || 1);
  const [attended, setAttended] = useState<number | string>(user?.baseline_attended || 0);
  const [total, setTotal] = useState<number | string>(user?.baseline_total || 0);
  const [bDate, setBDate] = useState<string>(user?.baseline_date || '2026-08-24');
  const [profileLoading, setProfileLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Reminders State
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('reminders_enabled') === 'true');
  const [reminderTimes, setReminderTimes] = useState<string[]>(() => {
    const saved = localStorage.getItem('reminder_times');
    return saved ? JSON.parse(saved) : ['09:00', '12:00', '16:30'];
  });
  const [newTime, setNewTime] = useState('');
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Security / PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Privacy / DPDP State
  const [deletePin, setDeletePin] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Server Diagnostics State
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  // About State
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load sections on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setMsg('');
      setError('');
      attendanceApi.getSections().then((res) => {
        if (res.sections) setSections(res.sections);
      }).catch(console.error);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    const bAtt = parseInt(String(attended), 10) || 0;
    const bTot = parseInt(String(total), 10) || 0;

    if (bTot < bAtt) {
      setError('Baseline total periods cannot be less than attended periods.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await authApi.updateBaseline({
        baseline_attended: bAtt,
        baseline_total: bTot,
        baseline_date: bTot > 0 ? bDate : null,
        section_id: selectedSectionId,
      });
      if (res.user) {
        await refreshUser();
      }
      setMsg('Profile, Section & Baseline updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile settings.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!notifEnabled) {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm !== 'granted') {
          setError('Browser notification permission was denied. Please allow notifications in site settings.');
          return;
        }
      }
      setNotifEnabled(true);
      localStorage.setItem('reminders_enabled', 'true');
      setMsg('Daily attendance reminders enabled!');
    } else {
      setNotifEnabled(false);
      localStorage.setItem('reminders_enabled', 'false');
      setMsg('Reminders disabled.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleAddReminderTime = () => {
    if (!newTime || reminderTimes.includes(newTime)) return;
    const updated = [...reminderTimes, newTime].sort();
    setReminderTimes(updated);
    localStorage.setItem('reminder_times', JSON.stringify(updated));
    setNewTime('');
  };

  const handleRemoveReminderTime = (time: string) => {
    const updated = reminderTimes.filter(t => t !== time);
    setReminderTimes(updated);
    localStorage.setItem('reminder_times', JSON.stringify(updated));
  };

  const handleSendTestNotification = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('MEDHAS Attendance Ledger', {
        body: 'Reminder: Remember to log your class periods today!',
        icon: '/favicon.ico',
      });
      setMsg('Test notification sent!');
      setTimeout(() => setMsg(''), 2500);
    } else {
      setError('Please allow browser notifications first.');
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (newPin !== confirmNewPin) {
      setError('New PIN and Confirm PIN do not match.');
      return;
    }
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setError('New PIN must be 4 to 6 numeric digits.');
      return;
    }

    setPinLoading(true);
    try {
      await authApi.changePin(currentPin, newPin);
      setMsg('Security PIN changed successfully! Please remember your new PIN.');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: any) {
      setError(err.message || 'Failed to change PIN. Verify your current PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      await attendanceApi.exportCsv();
      setMsg('Attendance ledger CSV exported successfully.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePin) {
      setError('Please enter your PIN to verify erasure.');
      return;
    }
    setDeleteLoading(true);
    try {
      await authApi.deleteAccount(deletePin);
      alert('Your account and all associated attendance records have been permanently erased under DPDP Act 2023.');
      logout();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. Check your PIN.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTestPing = async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const diff = Math.round(performance.now() - start);
        setPingLatency(diff);
        setPingStatus('ok');
      } else {
        setPingStatus('fail');
      }
    } catch {
      setPingStatus('fail');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '540px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.85rem',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: '0.65rem',
        }}>
          <div>
            <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              Settings & Preferences
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
              {user?.register_number} · Section <strong>{user?.section_label || 'A'} ({user?.branch || 'CSE'})</strong>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ fontWeight: 700 }}
            title="Close Settings (Esc)"
          >
            <X size={15} /> <span>Close</span>
          </button>
        </div>

        {/* Admin Quick Banner */}
        {isAdmin && (
          <div style={{
            background: 'rgba(217, 119, 6, 0.1)',
            border: '1px solid var(--accent-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldCheck size={16} color="var(--accent-gold)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>
                Administrator Console Active
              </span>
            </div>
            {onOpenAdmin && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.55rem',
                  background: 'var(--accent-gold)',
                  borderColor: 'var(--accent-gold)',
                  color: 'var(--ink)',
                  fontWeight: 700,
                }}
              >
                PIN Reset Panel
              </button>
            )}
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--surface-alt)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          border: '1px solid var(--rule)',
          gap: '3px',
          overflowX: 'auto',
        }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.4rem 0.35rem', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
            onClick={() => { setActiveTab('profile'); setMsg(''); setError(''); }}
          >
            <School size={13} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'reminders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.4rem 0.35rem', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
            onClick={() => { setActiveTab('reminders'); setMsg(''); setError(''); }}
          >
            <Bell size={13} />
            <span>Reminders</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.4rem 0.35rem', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
            onClick={() => { setActiveTab('security'); setMsg(''); setError(''); }}
          >
            <KeyRound size={13} />
            <span>Security</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'privacy' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1.1, padding: '0.4rem 0.35rem', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
            onClick={() => { setActiveTab('privacy'); setMsg(''); setError(''); }}
          >
            <ShieldCheck size={13} />
            <span>Privacy</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'server' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 0.9, padding: '0.4rem 0.35rem', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
            onClick={() => { setActiveTab('server'); setMsg(''); setError(''); }}
          >
            <Server size={13} />
            <span>Server</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'about' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 0.8, padding: '0.4rem 0.35rem', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
            onClick={() => { setActiveTab('about'); setMsg(''); setError(''); }}
          >
            <Info size={13} />
            <span>About</span>
          </button>
        </div>

        {/* Global Feedback Banners */}
        {msg && (
          <div className="alert-callout success">
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}
        {error && (
          <div className="alert-callout error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: PROFILE & BASELINE                                 */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile}>
            <div style={{ marginBottom: '1rem' }}>
              <span className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                Academic Section & Baseline
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                Your baseline represents historical periods attended before logging on this platform.
              </p>
            </div>

            <div className="form-field">
              <label className="form-label">Register Number</label>
              <input
                type="text"
                className="form-control mono"
                value={user?.register_number || ''}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Timetable Section</label>
              <select
                className="form-control mono"
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(parseInt(e.target.value) || 1)}
              >
                {sections.length > 0 ? (
                  sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.branch} — Section {s.section_label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>CSE — Section A</option>
                    <option value={2}>CSE — Section B</option>
                    <option value={3}>CSE — Section C</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-field">
                <label className="form-label">Baseline Attended</label>
                <input
                  type="number"
                  className="form-control mono"
                  min="0"
                  value={attended}
                  onChange={(e) => setAttended(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Baseline Total</label>
                <input
                  type="number"
                  className="form-control mono"
                  min="0"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Baseline Cutoff Date</label>
              <input
                type="date"
                className="form-control mono"
                value={bDate}
                onChange={(e) => setBDate(e.target.value)}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
                Daily records on or before this date are locked historical baseline.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileLoading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {profileLoading ? 'Saving Changes...' : 'Save Baseline & Section'}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 2: REMINDERS                                          */}
        {/* ========================================================= */}
        {activeTab === 'reminders' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                Daily Attendance Reminders
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                Receive scheduled alerts to mark your periods on time so your 75% ledger remains accurate.
              </p>
            </div>

            {/* Master Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--rule)',
              marginBottom: '1rem',
            }}>
              <div>
                <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Attendance Notifications</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                  Permission Status: <strong>{notifPermission}</strong>
                </div>
              </div>

              <button
                type="button"
                className={`btn btn-sm ${notifEnabled ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleToggleNotifications}
                style={{ fontWeight: 700 }}
              >
                {notifEnabled ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>

            {/* Configured Notification Times */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Scheduled Reminder Times</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
                {reminderTimes.map((time) => (
                  <span
                    key={time}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.55rem',
                      background: 'var(--surface)',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <Clock size={12} color="var(--accent-gold)" />
                    <span>{time}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReminderTime(time)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bad)', padding: 0 }}
                      title="Remove time"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Time */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="time"
                  className="form-control mono"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  style={{ maxWidth: '140px', padding: '0.4rem 0.6rem' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddReminderTime}
                  disabled={!newTime}
                >
                  <Plus size={14} /> <span>Add Time</span>
                </button>
              </div>
            </div>

            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--rule)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSendTestNotification}
                style={{ width: '100%' }}
              >
                <Bell size={14} /> <span>Send Test Notification Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SECURITY & PIN                                     */}
        {/* ========================================================= */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePin}>
            <div style={{ marginBottom: '1rem' }}>
              <span className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                Account Security & PIN
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                Update your login PIN. PINs are salted and hashed using bcrypt.
              </p>
            </div>

            <div className="form-field">
              <label className="form-label">Current PIN</label>
              <input
                type="password"
                className="form-control mono"
                placeholder="••••"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
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

            <div className="form-field">
              <label className="form-label">Confirm New PIN</label>
              <input
                type="password"
                className="form-control mono"
                placeholder="••••"
                maxLength={6}
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={pinLoading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {pinLoading ? 'Updating PIN...' : 'Change Security PIN'}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PRIVACY & DPDP ACT 2023                            */}
        {/* ========================================================= */}
        {activeTab === 'privacy' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                Privacy & DPDP Act 2023
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                MEDHAS complies with India's Digital Personal Data Protection (DPDP) Act 2023.
              </p>
            </div>

            <div style={{
              background: 'var(--surface-alt)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--rule)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: 'var(--ink-soft)',
              marginBottom: '1rem',
            }}>
              <div>🛡️ <strong>Purpose Limitation:</strong> Attendance data is strictly used for calculating academic 75% thresholds and timetabling.</div>
              <div style={{ marginTop: '0.35rem' }}>🔒 <strong>Storage & Encryption:</strong> Passwords and PINs are protected with bcrypt. Session tokens expire and are verifiable.</div>
              <div style={{ marginTop: '0.35rem' }}>📜 <strong>Consent:</strong> Explicit user consent is logged with timestamp upon registration.</div>
            </div>

            {/* Data Portability */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Data Portability (Right to Access)</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportCsv}
                disabled={exportLoading}
                style={{ width: '100%' }}
              >
                <Download size={14} color="var(--accent-gold)" />
                <span>{exportLoading ? 'Generating...' : 'Download Attendance Ledger Archive (CSV)'}</span>
              </button>
            </div>

            {/* Right to Erasure */}
            <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--rule)' }}>
              <label className="form-label" style={{ color: 'var(--bad)' }}>Right to Erasure (Delete Account)</label>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ color: 'var(--bad)', borderColor: 'var(--bad)', width: '100%' }}
                >
                  <Trash2 size={14} /> <span>Request Account & Data Erasure</span>
                </button>
              ) : (
                <div style={{ background: 'var(--bad-soft)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(224,86,63,0.3)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--bad)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Warning: This action is permanent and deletes all attendance records. Enter your PIN to confirm:
                  </div>
                  <input
                    type="password"
                    className="form-control mono"
                    placeholder="Enter PIN"
                    maxLength={6}
                    value={deletePin}
                    onChange={(e) => setDeletePin(e.target.value)}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      style={{ background: 'var(--bad)', color: '#fff', flex: 1 }}
                    >
                      {deleteLoading ? 'Erasing...' : 'Confirm Erasure'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SERVER DIAGNOSTICS                                 */}
        {/* ========================================================= */}
        {activeTab === 'server' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
                Server Endpoint & Diagnostics
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                Verify backend API health and network latency.
              </p>
            </div>

            <div className="form-field">
              <label className="form-label">Active API Base</label>
              <input
                type="text"
                className="form-control mono"
                value="/api (Local / Proxied Backend)"
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            <div style={{
              background: 'var(--surface-alt)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--rule)',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>FastAPI + SQLite Engine</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                    Host: 127.0.0.1:8000 · Port: 8000
                  </div>
                </div>
                {pingStatus === 'ok' && (
                  <span className="card-header-badge good">
                    {pingLatency} ms ping
                  </span>
                )}
                {pingStatus === 'fail' && (
                  <span className="card-header-badge bad">
                    Unreachable
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestPing}
              disabled={pingStatus === 'testing'}
              style={{ width: '100%' }}
            >
              <Activity size={14} color="var(--accent-gold)" />
              <span>{pingStatus === 'testing' ? 'Testing Connection...' : 'Test Connection Latency'}</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ABOUT                                              */}
        {/* ========================================================= */}
        {activeTab === 'about' && (
          <div>
            <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
              <div className="brand-crest" style={{ margin: '0 auto 0.6rem', width: '42px', height: '42px' }}>
                <School size={20} className="brand-icon-glyph" />
              </div>
              <h4 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)' }}>
                MEDHAS
              </h4>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                Version 1.0.0 · Production Ready
              </div>
            </div>

            <div style={{
              background: 'var(--surface-alt)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--rule)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: 'var(--ink-soft)',
              marginBottom: '1rem',
            }}>
              <div>🏛️ <strong>Institution:</strong> S.R.K.R. Engineering College (Autonomous), Bhimavaram, AP.</div>
              <div style={{ marginTop: '0.35rem' }}>📊 <strong>Attendance Suite:</strong> Period ledger, 75% calculator, safe bunk estimator, multi-day forecasting.</div>
              <div style={{ marginTop: '0.35rem' }}>📚 <strong>Academic Hub:</strong> 10 branches, 8 first-year subjects (40 units syllabus & notes), 19 AI prompt templates.</div>
              <div style={{ marginTop: '0.35rem' }}>🚀 <strong>Career & Campus:</strong> 50 career pathways, 4-year roadmaps, NutriDelight cafeteria catalog, helpline contacts.</div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyLink}
                style={{ flex: 1 }}
              >
                {copiedLink ? <Check size={14} color="var(--good)" /> : <Share2 size={14} color="var(--accent-gold)" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Portal Link'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SettingsModal;
