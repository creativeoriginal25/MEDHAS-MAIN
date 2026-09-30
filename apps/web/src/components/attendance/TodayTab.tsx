import React, { useState, useEffect, useMemo, useRef } from 'react';
import { attendanceApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Check, 
  X, 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  CheckCheck, 
  Lock, 
  RotateCcw, 
  FileText,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';

interface BlockItem {
  id: number;
  order_index: number;
  subject: string;
  periods: number;
}

export const TodayTab: React.FC = () => {
  const { user } = useAuth();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
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

  // Edit window
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() - 7);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 7);
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  const isCoveredByBaseline = Boolean(user?.baseline_date && currentDate <= user.baseline_date);
  const isDateEditable = currentDate >= minDateStr && currentDate <= maxDateStr && !isCoveredByBaseline;

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
        setBlocks(ttData.value?.blocks?.map((b: any) => ({
          id: b.block_id,
          order_index: b.order_index,
          subject: b.subject,
          periods: b.periods,
        })) || []);
      }
      if (logsData.status === 'fulfilled' && logsData.value?.logs_by_date) {
        setDailyLogs(logsData.value.logs_by_date);
        const entries = logsData.value.logs_by_date[currentDate] || [];
        const existingNote = entries.find((e: any) => e.notes)?.notes || '';
        setDayRemarks(existingNote);
        setShowRemarkInput(Boolean(existingNote));
      }
      if (dashData.status === 'fulfilled') {
        setSummary(dashData.value);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = -2; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const isPastBaseline = Boolean(user?.baseline_date && iso <= user.baseline_date);
      days.push({
        dateStr: iso,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isToday: iso === todayStr,
        isSunday: d.getDay() === 0,
        isPastBaseline,
        hasLogs: Boolean(dailyLogs[iso]?.length),
      });
    }
    return days;
  };

  const shiftDate = (offset: number) => {
    const cur = new Date(currentDate);
    cur.setDate(cur.getDate() + offset);
    setCurrentDate(cur.toISOString().split('T')[0]);
    setFeedback('');
    setUndoAction(null);
  };

  const getBlockStatus = (blockId: number) => {
    const entries = dailyLogs[currentDate] || [];
    const match = entries.find((e: any) => e.block_id === blockId);
    return match ? match.status : null;
  };

  const calculateImpact = (block: BlockItem) => {
    const totAttended = summary?.overall_attended ?? user?.baseline_attended ?? 0;
    const totTotal = summary?.overall_total ?? user?.baseline_total ?? 0;
    const currentPct = totTotal > 0 ? (totAttended / totTotal) * 100 : 0;
    const k = block.periods || 1;
    const curStatus = getBlockStatus(block.id);

    // Calculate baseline without current status of this specific block if marked
    let baseAtt = totAttended;
    let baseTot = totTotal;
    if (curStatus === 'present') {
      baseAtt = Math.max(0, totAttended - k);
      baseTot = Math.max(0, totTotal - k);
    } else if (curStatus === 'absent') {
      baseTot = Math.max(0, totTotal - k);
    }

    // Impact if marked present
    const newAttPres = baseAtt + k;
    const newTotPres = baseTot + k;
    const pctIfPres = newTotPres > 0 ? (newAttPres / newTotPres) * 100 : 100;
    const deltaPres = pctIfPres - currentPct;

    // Impact if marked absent
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

    // Cache previous for undo
    const prevEntries = dailyLogs[currentDate] ? [...dailyLogs[currentDate]] : [];
    setUndoAction({ date: currentDate, entries: prevEntries });

    // 0ms Optimistic UI update
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

    setDailyLogs(prev => ({ ...prev, [currentDate]: currentEntries }));
    setFeedback(targetStatus === 'unmarked' ? 'Unmarked' : `Saved ${targetStatus.toUpperCase()}`);
    setTimeout(() => setFeedback(''), 2000);

    // Sync to backend
    setSaving(true);
    try {
      await attendanceApi.markAttendance(currentDate, [{
        block_id: blockId,
        status: targetStatus,
        notes: dayRemarks || undefined,
      }]);
    } catch (err: any) {
      // Revert on error
      setDailyLogs(prev => ({ ...prev, [currentDate]: prevEntries }));
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
    setFeedback(`Marked All ${status.toUpperCase()}`);
    setTimeout(() => setFeedback(''), 2000);

    setSaving(true);
    try {
      await attendanceApi.markAttendance(currentDate, newEntries);
    } catch (err: any) {
      setDailyLogs(prev => ({ ...prev, [currentDate]: prevEntries }));
      setFeedback('Error saving batch status');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!undoAction) return;
    const { date, entries } = undoAction;
    setDailyLogs(prev => ({ ...prev, [date]: entries }));
    setUndoAction(null);
    setFeedback('Reverted action');
    setTimeout(() => setFeedback(''), 2000);

    try {
      await attendanceApi.markAttendance(date, entries.length > 0 ? entries : blocks.map(b => ({ block_id: b.id, status: 'unmarked' })));
    } catch (e) {
      console.error(e);
    }
  };

  const curD = new Date(currentDate);
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
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAll('present')}
                disabled={saving}
                style={{ fontSize: '0.72rem', padding: '0.28rem 0.55rem', color: 'var(--good)' }}
              >
                <Check size={13} />
                <span>All Present</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAll('absent')}
                disabled={saving}
                style={{ fontSize: '0.72rem', padding: '0.28rem 0.55rem', color: 'var(--bad)' }}
              >
                <X size={13} />
                <span>All Absent</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAll('holiday')}
                disabled={saving}
                style={{ fontSize: '0.72rem', padding: '0.28rem 0.55rem', color: 'var(--accent-gold)' }}
              >
                <Coffee size={13} />
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
                <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--good)', fontWeight: 600 }}>
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
        <div>
          {blocks.map((block) => {
            const status = getBlockStatus(block.id);
            const isPresent = status === 'present';
            const isAbsent = status === 'absent';
            const isHoliday = status === 'holiday';
            const impact = calculateImpact(block);

            return (
              <div key={block.id} className="period-ledger-block">
                <div className="block-title-box">
                  <div className="block-index-badge mono-num">
                    P{block.order_index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="block-name font-serif" style={{ fontSize: '0.98rem', fontWeight: 700 }}>
                      {block.subject}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                      <span className="block-weight">
                        {block.periods >= 4 ? '4 Periods (Lab)' : `${block.periods} Period${block.periods > 1 ? 's' : ''}`}
                      </span>
                      {isHoliday && (
                        <span className="badge badge-neutral" style={{ fontSize: '0.68rem', color: 'var(--accent-gold)' }}>
                          Batch Holiday
                        </span>
                      )}
                    </div>

                    {/* Live Percentage Impact Badge Strip */}
                    <div className="impact-delta-strip">
                      <span className="impact-badge present" title={`Attending this class projects overall attendance to ${impact.pctIfPresent}%`}>
                        <Check size={11} /> If Present: <strong>{impact.pctIfPresent}%</strong> ({impact.deltaPres})
                      </span>
                      <span className="impact-badge absent" title={`Missing this class projects overall attendance to ${impact.pctIfAbsent}%`}>
                        <X size={11} /> If Absent: <strong>{impact.pctIfAbsent}%</strong> ({impact.deltaAbs})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-State Full-Text Toggle Buttons with Smooth Animated Transitions */}
                <div className="status-pill-group">
                  <button
                    type="button"
                    className={`status-pill-btn ${isPresent ? 'active-present' : ''}`}
                    onClick={() => handleSetBlockStatus(block.id, 'present')}
                    disabled={!isDateEditable}
                    title="Mark Present"
                  >
                    <Check size={13} />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    className={`status-pill-btn ${isAbsent ? 'active-absent' : ''}`}
                    onClick={() => handleSetBlockStatus(block.id, 'absent')}
                    disabled={!isDateEditable}
                    title="Mark Absent"
                  >
                    <X size={13} />
                    <span>Absent</span>
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
