import React, { useState, useEffect, useMemo } from 'react';
import { attendanceApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Check, 
  X, 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
} from 'lucide-react';

interface BlockItem {
  id: number;
  order_index: number;
  subject: string;
  periods: number;
  status?: string;
  notes?: string;
}

function getTodayIST(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export const TodayTab: React.FC = () => {
  const { user } = useAuth();
  const todayStr = useMemo(() => getTodayIST(), []);
  const [currentDate, setCurrentDate] = useState<string>(todayStr);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, any[]>>({});
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [undoAction, setUndoAction] = useState<any | null>(null);
  const [dayRemarks, setDayRemarks] = useState('');
  const [showRemarkInput, setShowRemarkInput] = useState(false);

  // Edit window: Allow editing within 14 days and after baseline date
  const isCoveredByBaseline = Boolean(user?.baseline_date && currentDate <= user.baseline_date);
  const isDateEditable = !isCoveredByBaseline;

  useEffect(() => {
    loadTimetableAndLogs();
  }, [currentDate]);

  const loadTimetableAndLogs = async () => {
    setLoading(true);
    try {
      const [ttData, logsData, dashData] = await Promise.allSettled([
        attendanceApi.getDate(currentDate),
        attendanceApi.getLogs(),
        attendanceApi.getDashboard(),
      ]);

      if (ttData.status === 'fulfilled') {
        const rawBlocks = ttData.value?.blocks || [];
        const mapped = rawBlocks.map((b: any) => ({
          id: b.block_id,
          order_index: b.order_index,
          subject: b.subject,
          periods: b.periods,
          status: b.status,
          notes: b.notes,
        }));
        setBlocks(mapped);

        // Seed current day logs directly from date response
        const fromDateEntries = rawBlocks
          .filter((b: any) => b.status && b.status !== 'unmarked')
          .map((b: any) => ({
            block_id: b.block_id,
            status: b.status,
            notes: b.notes,
          }));

        setDailyLogs(prev => ({
          ...prev,
          [currentDate]: fromDateEntries,
        }));
      }

      if (logsData.status === 'fulfilled' && logsData.value?.logs_by_date) {
        setDailyLogs(prev => ({
          ...logsData.value.logs_by_date,
          // Keep current date entries from getDate if present
          [currentDate]: prev[currentDate] || logsData.value.logs_by_date[currentDate] || [],
        }));
        const entries = logsData.value.logs_by_date[currentDate] || [];
        const existingNote = entries.find((e: any) => e.notes)?.notes || '';
        setDayRemarks(existingNote);
        setShowRemarkInput(Boolean(existingNote));
      }

      if (dashData.status === 'fulfilled') {
        setSummary(dashData.value);
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    // Anchor to today in IST
    const [y, m, d] = todayStr.split('-').map(Number);
    for (let i = -2; i <= 6; i++) {
      const target = new Date(y, m - 1, d + i);
      const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const isPastBaseline = Boolean(user?.baseline_date && iso <= user.baseline_date);
      days.push({
        dateStr: iso,
        dayName: dayNames[target.getDay()],
        dayNum: target.getDate(),
        isToday: iso === todayStr,
        isSunday: target.getDay() === 0,
        isPastBaseline,
        hasLogs: Boolean(dailyLogs[iso]?.length),
      });
    }
    return days;
  };

  const shiftDate = (offset: number) => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const target = new Date(y, m - 1, d + offset);
    const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    setCurrentDate(iso);
    setFeedback('');
    setUndoAction(null);
  };

  const getBlockStatus = (blockId: number): string | null => {
    const entries = dailyLogs[currentDate];
    if (entries !== undefined) {
      const match = entries.find((e: any) => e.block_id === blockId);
      return match ? match.status : null;
    }
    const b = blocks.find(b => b.id === blockId);
    return (b?.status && b.status !== 'unmarked') ? b.status : null;
  };

  const calculateImpact = (block: BlockItem) => {
    const totAttended = summary?.total_attended ?? summary?.overall?.attended ?? user?.baseline_attended ?? 0;
    const totTotal = summary?.total_periods ?? summary?.overall?.total ?? user?.baseline_total ?? 0;
    const currentPct = totTotal > 0 ? (totAttended / totTotal) * 100 : 0;
    const k = block.periods || 1;
    const curStatus = getBlockStatus(block.id);

    let baseAtt = totAttended;
    let baseTot = totTotal;
    if (curStatus === 'present') {
      baseAtt = Math.max(0, totAttended - k);
      baseTot = Math.max(0, totTotal - k);
    } else if (curStatus === 'absent') {
      baseTot = Math.max(0, totTotal - k);
    }

    const newAttPres = baseAtt + k;
    const newTotPres = baseTot + k;
    const pctIfPres = newTotPres > 0 ? (newAttPres / newTotPres) * 100 : 100;
    const deltaPres = pctIfPres - currentPct;

    const newAttAbs = baseAtt;
    const newTotAbs = baseTot + k;
    const pctIfAbs = newTotAbs > 0 ? (newAttAbs / newTotAbs) * 100 : 0;
    const deltaAbs = pctIfAbs - currentPct;

    return {
      pctIfPresent: pctIfPres.toFixed(1),
      deltaPres: deltaPres >= 0 ? `+${deltaPres.toFixed(1)}%` : `${deltaPres.toFixed(1)}%`,
      pctIfAbsent: pctIfAbs.toFixed(1),
      deltaAbs: `${deltaAbs.toFixed(1)}%`,
    };
  };

  const handleSetBlockStatus = async (blockId: number, clickedStatus: string) => {
    if (!isDateEditable) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const currentStatus = getBlockStatus(blockId);
    const targetStatus = (currentStatus === clickedStatus) ? 'unmarked' : clickedStatus;

    // Cache previous entries for undo
    const prevEntries = dailyLogs[currentDate] ? [...dailyLogs[currentDate]] : [];
    setUndoAction({ date: currentDate, entries: prevEntries });

    // Immediate 0ms Optimistic UI update
    const currentEntries = [...prevEntries];
    const idx = currentEntries.findIndex((e: any) => e.block_id === blockId);
    if (targetStatus === 'unmarked') {
      if (idx >= 0) currentEntries.splice(idx, 1);
    } else {
      if (idx >= 0) {
        currentEntries[idx] = { ...currentEntries[idx], status: targetStatus, notes: dayRemarks || null };
      } else {
        currentEntries.push({ block_id: blockId, status: targetStatus, notes: dayRemarks || null });
      }
    }

    // Update state immediately
    setDailyLogs(prev => ({ ...prev, [currentDate]: currentEntries }));
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, status: targetStatus } : b));
    setFeedback(targetStatus === 'unmarked' ? 'Unmarked' : `Marked ${targetStatus.toUpperCase()}`);
    setTimeout(() => setFeedback(''), 2200);

    // Sync to backend API
    setSaving(true);
    try {
      const res = await attendanceApi.markAttendance(currentDate, [{
        block_id: blockId,
        status: targetStatus,
        notes: dayRemarks || undefined,
      }]);
      if (res?.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      // Revert optimistic update only on actual network error
      setDailyLogs(prev => ({ ...prev, [currentDate]: prevEntries }));
      setBlocks(prev => prev.map(b => {
        const pe = prevEntries.find((e: any) => e.block_id === b.id);
        return { ...b, status: pe ? pe.status : 'unmarked' };
      }));
      setFeedback('Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = async (status: string) => {
    if (!isDateEditable || blocks.length === 0) return;

    const prevEntries = dailyLogs[currentDate] ? [...dailyLogs[currentDate]] : [];
    setUndoAction({ date: currentDate, entries: prevEntries });

    const newEntries = blocks.map(b => ({
      block_id: b.id,
      status,
      notes: dayRemarks || null,
    }));

    setDailyLogs(prev => ({ ...prev, [currentDate]: newEntries }));
    setBlocks(prev => prev.map(b => ({ ...b, status })));
    setFeedback(`Marked All ${status.toUpperCase()}`);
    setTimeout(() => setFeedback(''), 2200);

    setSaving(true);
    try {
      const res = await attendanceApi.markAttendance(currentDate, newEntries);
      if (res?.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      console.error('Batch save failed:', err);
      setDailyLogs(prev => ({ ...prev, [currentDate]: prevEntries }));
      setBlocks(prev => prev.map(b => {
        const pe = prevEntries.find((e: any) => e.block_id === b.id);
        return { ...b, status: pe ? pe.status : 'unmarked' };
      }));
      setFeedback('Error saving batch status');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!undoAction) return;
    const { date, entries } = undoAction;
    setDailyLogs(prev => ({ ...prev, [date]: entries }));
    setBlocks(prev => prev.map(b => {
      const pe = entries.find((e: any) => e.block_id === b.id);
      return { ...b, status: pe ? pe.status : 'unmarked' };
    }));
    setUndoAction(null);
    setFeedback('Reverted action');
    setTimeout(() => setFeedback(''), 2000);

    try {
      await attendanceApi.markAttendance(date, entries.length > 0 ? entries : blocks.map(b => ({ block_id: b.id, status: 'unmarked' })));
    } catch (e) {
      console.error(e);
    }
  };

  const [y, m, d] = currentDate.split('-').map(Number);
  const curD = new Date(y, m - 1, d);
  const formattedHeaderDate = curD.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div>
      {/* 10-Day Ribbon Date Navigator (Exact APY Style) */}
      <div className="week-navigator-ribbon">
        {getWeekDays().map((d) => {
          const isActive = d.dateStr === currentDate;
          return (
            <div
              key={d.dateStr}
              className={`ribbon-day-cell ${isActive ? 'active' : ''}`}
              onClick={() => {
                setCurrentDate(d.dateStr);
                setFeedback('');
                setUndoAction(null);
              }}
            >
              <div className="ribbon-day-label">{d.dayName}</div>
              <div className="ribbon-day-num mono-num">{d.dayNum}</div>
              <div className={`ribbon-status-dot ${d.hasLogs ? 'logged' : ''}`} />
            </div>
          );
        })}
      </div>

      {/* Date Header Card with Left/Right Arrows */}
      <div className="ledger-card" style={{ padding: '0.9rem 1.1rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={() => shiftDate(-1)} 
            title="Previous Day"
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <div className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)' }}>
              {formattedHeaderDate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.15rem' }}>
              <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                {currentDate}
              </span>
              {currentDate === todayStr && (
                <span className="card-header-badge good">TODAY</span>
              )}
              {isCoveredByBaseline && (
                <span className="card-header-badge bad">LOCKED (BASELINE)</span>
              )}
            </div>
          </div>

          <button 
            type="button" 
            className="btn-icon" 
            onClick={() => shiftDate(1)} 
            title="Next Day"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Quick Batch Actions Row */}
        {isDateEditable && blocks.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.85rem',
            paddingTop: '0.65rem',
            borderTop: '1px solid var(--rule)',
            flexWrap: 'wrap',
            gap: '0.4rem',
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAll('present')}
                disabled={saving}
                style={{ fontSize: '0.75rem', padding: '0.32rem 0.65rem', color: '#16a34a', fontWeight: 700 }}
              >
                <Check size={14} strokeWidth={2.5} />
                <span>All Present</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAll('absent')}
                disabled={saving}
                style={{ fontSize: '0.75rem', padding: '0.32rem 0.65rem', color: '#dc2626', fontWeight: 700 }}
              >
                <X size={14} strokeWidth={2.5} />
                <span>All Absent</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAll('holiday')}
                disabled={saving}
                style={{ fontSize: '0.75rem', padding: '0.32rem 0.65rem', color: '#d97706', fontWeight: 700 }}
              >
                <Coffee size={14} />
                <span>Holiday</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {undoAction && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleUndo}
                  style={{ fontSize: '0.72rem', padding: '0.28rem 0.55rem' }}
                >
                  <RotateCcw size={12} />
                  <span>Undo</span>
                </button>
              )}
              {feedback && (
                <span className="mono-num" style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                  {feedback}
                </span>
              )}
              {saving && (
                <span className="mono-num" style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                  Saving...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Period Ledger Rows */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="ledger-card" style={{ height: '70px', opacity: 0.5 }} />
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <div className="ledger-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
          <Coffee size={36} color="var(--accent-gold)" style={{ margin: '0 auto 0.75rem' }} />
          <div className="font-serif" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>
            No Classes Scheduled
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
            There are no timetable blocks for this weekday.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {blocks.map((block) => {
            const status = getBlockStatus(block.id);
            const isPresent = status === 'present';
            const isAbsent = status === 'absent';
            const isHoliday = status === 'holiday';
            const impact = calculateImpact(block);

            return (
              <div key={block.id} className="period-ledger-block">
                <div className="block-title-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                    <div className="block-index-badge mono-num">
                      P{block.order_index + 1}
                    </div>
                    <div>
                      <div className="block-name font-serif" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {block.subject}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                        <span className="block-weight">
                          {block.periods >= 4 ? '4 Periods (Lab)' : `${block.periods} Period${block.periods > 1 ? 's' : ''}`}
                        </span>
                        {isHoliday && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700 }}>
                            Batch Holiday
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Percentage Impact Strip */}
                <div className="impact-delta-strip">
                  <span className="impact-badge present" title={`Attending this class projects overall attendance to ${impact.pctIfPresent}%`}>
                    <Check size={11} strokeWidth={2.5} /> If Present: <strong>{impact.pctIfPresent}%</strong> ({impact.deltaPres})
                  </span>
                  <span className="impact-badge absent" title={`Missing this class projects overall attendance to ${impact.pctIfAbsent}%`}>
                    <X size={11} strokeWidth={2.5} /> If Absent: <strong>{impact.pctIfAbsent}%</strong> ({impact.deltaAbs})
                  </span>
                </div>

                {/* Full-width, Mobile-optimized PRESENT / ABSENT Buttons */}
                <div className="status-pill-group">
                  <button
                    type="button"
                    className={`status-pill-btn btn-present ${isPresent ? 'active-present' : ''}`}
                    onClick={() => handleSetBlockStatus(block.id, 'present')}
                    disabled={!isDateEditable}
                    title="Mark Present"
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>PRESENT</span>
                  </button>

                  <button
                    type="button"
                    className={`status-pill-btn btn-absent ${isAbsent ? 'active-absent' : ''}`}
                    onClick={() => handleSetBlockStatus(block.id, 'absent')}
                    disabled={!isDateEditable}
                    title="Mark Absent"
                  >
                    <X size={16} strokeWidth={3} />
                    <span>ABSENT</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
