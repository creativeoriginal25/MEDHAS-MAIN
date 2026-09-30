import React, { useState, useEffect, useMemo } from 'react';
import { attendanceApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertTriangle,
  Target,
  Share2,
  Check,
} from 'lucide-react';

const FORECAST_HORIZON_DAYS = 14;

export const ForecastTab: React.FC = () => {
  const { user } = useAuth();
  // Navigation mode: 'continuous', 'snapshot', or 'goal'
  const [viewMode, setViewMode] = useState<'continuous' | 'snapshot' | 'goal'>('continuous');

  // Single-day snapshot state
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Continuous multi-day forecast state
  const [summary, setSummary] = useState<any>(null);
  const [timetableByDay, setTimetableByDay] = useState<Record<number, any[]>>({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Scenario selections per date: { [dateStr]: attendedPeriodCount }
  const [selectedScenarios, setSelectedScenarios] = useState<Record<string, number>>({});

  // Target Goal Calculator state
  const [targetPct, setTargetPct] = useState(75);
  const [targetResult, setTargetResult] = useState<any>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // 8-day ribbon for snapshot mode
  const nextDays = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        dateStr: d.toISOString().split('T')[0],
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0,
        isSunday: d.getDay() === 0,
      };
    });
  }, []);

  // Fetch summary and timetable data on mount
  useEffect(() => {
    loadContinuousData();
  }, [user?.section_id]);

  // Load single-day snapshot data when date changes or snapshot view is opened
  useEffect(() => {
    if (viewMode === 'snapshot') {
      loadSnapshotForecast(selectedDate);
    }
  }, [viewMode, selectedDate]);

  const loadContinuousData = async () => {
    setDataLoading(true);
    try {
      const [sumRes, ttRes] = await Promise.all([
        attendanceApi.getSummary().catch(() => null),
        user?.section_id ? attendanceApi.getSectionTimetable(user.section_id).catch(() => null) : Promise.resolve(null),
      ]);

      if (sumRes) {
        setSummary(sumRes);
        const subjectKeys = Object.keys(sumRes.subjects || {});
        if (!selectedSubject && subjectKeys.length > 0) {
          setSelectedSubject(subjectKeys[0]);
        }
      }

      if (ttRes?.timetable_by_day) {
        setTimetableByDay(ttRes.timetable_by_day);
      }
    } catch (err) {
      console.error('Failed to load forecast base data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadSnapshotForecast = async (dStr: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await attendanceApi.getForecast(dStr);
      setForecastData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to compute forecast');
    } finally {
      setLoading(false);
    }
  };

  // Collect unique subject list from attendance records and timetable
  const subjectList = useMemo(() => {
    const set = new Set<string>();
    if (summary?.subjects) {
      Object.keys(summary.subjects).forEach((s) => set.add(s));
    }
    if (timetableByDay) {
      Object.values(timetableByDay).forEach((blocks) => {
        if (Array.isArray(blocks)) {
          blocks.forEach((b: any) => {
            if (b.subject) set.add(b.subject);
          });
        }
      });
    }
    const list = Array.from(set);
    return [{ key: 'OVERALL', name: 'Overall Aggregate', isOverall: true }, ...list.map((s) => ({ key: s, name: s, isOverall: false }))];
  }, [summary, timetableByDay]);

  // Current attendance statistics for the selected subject
  const currentStats = useMemo(() => {
    if (!summary) return { attended: 0, total: 0, percentage: 0, safe_to_miss: 0, must_attend_next: 0, is_below_threshold: false };
    if (selectedSubject === 'OVERALL') {
      return {
        attended: summary.overall?.attended || summary.total_attended || 0,
        total: summary.overall?.total || summary.total_periods || 0,
        percentage: summary.overall?.percentage || 0,
        safe_to_miss: summary.overall?.safe_to_miss || 0,
        must_attend_next: summary.overall?.must_attend_next || 0,
        is_below_threshold: summary.overall?.is_below_threshold || false,
      };
    }
    const subjData = summary.subjects?.[selectedSubject || ''];
    if (subjData) {
      return {
        attended: subjData.attended || 0,
        total: subjData.total || 0,
        percentage: subjData.percentage || 0,
        safe_to_miss: subjData.safe_to_miss || 0,
        must_attend_next: subjData.must_attend_next || 0,
        is_below_threshold: subjData.is_below_threshold || false,
      };
    }
    return { attended: 0, total: 0, percentage: 0, safe_to_miss: 0, must_attend_next: 0, is_below_threshold: false };
  }, [summary, selectedSubject]);

  // Generate calendar days for forecast horizon
  const forecastDays = useMemo(() => {
    const days: any[] = [];
    const baseDate = new Date();

    for (let i = 0; i < FORECAST_HORIZON_DAYS; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const weekday = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${shortMonthNames[d.getMonth()]} ${d.getDate()}`;

      const blocks = timetableByDay[weekday] || [];

      let periods = 0;
      if (weekday !== 0 && blocks.length > 0) {
        if (selectedSubject === 'OVERALL') {
          periods = blocks.reduce((sum: number, b: any) => sum + (b.periods || 0), 0);
        } else {
          periods = blocks
            .filter((b: any) => b.subject === selectedSubject)
            .reduce((sum: number, b: any) => sum + (b.periods || 0), 0);
        }
      }

      days.push({
        index: i,
        dateStr,
        dayNum: d.getDate(),
        dayName: dayNames[weekday],
        shortDay: dayNames[weekday].slice(0, 3),
        formattedDate,
        isToday: i === 0,
        isSunday: weekday === 0,
        periods,
        weekday,
      });
    }

    return days;
  }, [timetableByDay, selectedSubject]);

  // Compute continuous multi-day projections sequentially across all days
  const multiDayProjections = useMemo(() => {
    let runningAttended = currentStats.attended;
    let runningTotal = currentStats.total;

    return forecastDays.map((day) => {
      const startingAttended = runningAttended;
      const startingTotal = runningTotal;
      const startingPercentage = startingTotal > 0 ? (startingAttended / startingTotal) * 100 : 0;

      const pCount = day.periods;

      if (day.isSunday || pCount === 0) {
        return {
          ...day,
          hasClasses: false,
          startingAttended,
          startingTotal,
          startingPercentage,
          resultingAttended: startingAttended,
          resultingTotal: startingTotal,
          resultingPercentage: startingPercentage,
          scenarios: [],
          selectedScenario: null,
        };
      }

      const scenarios: any[] = [];
      for (let k = pCount; k >= 0; k--) {
        const projAttended = startingAttended + k;
        const projTotal = startingTotal + pCount;
        const projPercentage = projTotal > 0 ? (projAttended / projTotal) * 100 : 0;
        const delta = projPercentage - startingPercentage;

        let label = '';
        if (pCount === 1) {
          label = k === 1 ? 'Attend' : 'Miss';
        } else if (pCount === 2) {
          if (k === 2) label = 'Attend both';
          else if (k === 1) label = 'Attend 1, miss 1';
          else label = 'Miss both';
        } else {
          if (k === pCount) label = `Attend all (${pCount})`;
          else if (k === 0) label = `Miss all (${pCount})`;
          else label = `Attend ${k}, miss ${pCount - k}`;
        }

        scenarios.push({
          k,
          label,
          projectedAttended: projAttended,
          projectedTotal: projTotal,
          projectedPercentage: projPercentage,
          delta,
        });
      }

      const chosenK = selectedScenarios[day.dateStr] !== undefined
        ? selectedScenarios[day.dateStr]
        : pCount;

      const activeScenario = scenarios.find((s) => s.k === chosenK) || scenarios[0];

      runningAttended = activeScenario.projectedAttended;
      runningTotal = activeScenario.projectedTotal;

      return {
        ...day,
        hasClasses: true,
        startingAttended,
        startingTotal,
        startingPercentage,
        resultingAttended: runningAttended,
        resultingTotal: runningTotal,
        resultingPercentage: activeScenario.projectedPercentage,
        scenarios,
        selectedScenario: activeScenario,
      };
    });
  }, [currentStats, forecastDays, selectedScenarios]);

  const handleSelectScenario = (dateStr: string, k: number) => {
    setSelectedScenarios((prev) => ({
      ...prev,
      [dateStr]: k,
    }));
  };

  const handleSimulateAttendAll = () => {
    const nextSelections: Record<string, number> = {};
    forecastDays.forEach((day) => {
      if (day.periods > 0) {
        nextSelections[day.dateStr] = day.periods;
      }
    });
    setSelectedScenarios(nextSelections);
  };

  const handleSimulateMissAll = () => {
    const nextSelections: Record<string, number> = {};
    forecastDays.forEach((day) => {
      if (day.periods > 0) {
        nextSelections[day.dateStr] = 0;
      }
    });
    setSelectedScenarios(nextSelections);
  };

  const handleResetScenarios = () => {
    setSelectedScenarios({});
  };

  const loadTargetCalc = async (pct: number) => {
    setTargetLoading(true);
    try {
      const res = await attendanceApi.getTargetCalculation(pct);
      setTargetResult(res);
    } catch (e) {
      console.error('Target calc error:', e);
    } finally {
      setTargetLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'goal') {
      loadTargetCalc(targetPct);
    }
  }, [viewMode, targetPct]);

  const handleShareCard = () => {
    if (!summary?.overall) return;
    const ov = summary.overall;
    const text = `📊 MEDHAS Attendance Status — ${user?.register_number || 'Student'}\n` +
      `Overall: ${ov.percentage.toFixed(2)}% (${ov.attended}/${ov.total} periods)\n` +
      `Status: ${ov.is_below_threshold ? 'Under 75% ⚠️' : 'Safe Zone ✅'}\n` +
      `${ov.is_below_threshold ? `Must Attend Next: ${ov.must_attend_next} periods` : `Safe to Miss: ${ov.safe_to_miss} periods`}\n` +
      `SRKR Unified College Platform`;
    try {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div>
      {/* Top View Toggle: Continuous Multi-Day Forecast vs Single-Day Snapshot vs Goal Calculator */}
      <div className="forecast-view-switch" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className={`forecast-view-btn ${viewMode === 'continuous' ? 'active' : ''}`}
          onClick={() => setViewMode('continuous')}
        >
          <TrendingUp size={15} />
          <span>Multi-Day</span>
        </button>
        <button
          type="button"
          className={`forecast-view-btn ${viewMode === 'snapshot' ? 'active' : ''}`}
          onClick={() => setViewMode('snapshot')}
        >
          <Calendar size={15} />
          <span>Snapshot</span>
        </button>
        <button
          type="button"
          className={`forecast-view-btn ${viewMode === 'goal' ? 'active' : ''}`}
          onClick={() => setViewMode('goal')}
        >
          <Target size={15} />
          <span>Goal Calc</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleShareCard}
          style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          title="Copy formatted attendance summary card"
        >
          {copiedShare ? <Check size={13} color="var(--good)" /> : <Share2 size={13} color="var(--accent-gold)" />}
          <span>{copiedShare ? 'Copied Card!' : 'Share Summary'}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: CONTINUOUS MULTI-DAY FORECASTING SYSTEM           */}
      {/* ========================================================= */}
      {viewMode === 'continuous' && (
        <div>
          {/* Dynamic Subject Selector Ribbon */}
          <div className="subject-pills-container">
            {subjectList.map((subj) => {
              const isActive = selectedSubject === subj.key;
              const subjPct = subj.isOverall
                ? summary?.overall?.percentage
                : summary?.subjects?.[subj.key]?.percentage;

              return (
                <button
                  key={subj.key}
                  type="button"
                  className={`subject-select-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSubject(subj.key);
                    setSelectedScenarios({});
                  }}
                >
                  <span>{subj.name}</span>
                  {subjPct !== undefined && (
                    <span className="pill-pct">{subjPct.toFixed(1)}%</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Subject Attendance State Card */}
          <div className="ledger-card" style={{ marginBottom: '1rem' }}>
            <div className="card-header-ruled">
              <div className="card-header-title">
                <Sparkles size={16} color="var(--accent-gold)" />
                <span>
                  {selectedSubject === 'OVERALL'
                    ? 'Overall Academic Ledger'
                    : selectedSubject || 'Selected Subject'}
                </span>
              </div>
              <span
                className={`card-header-badge ${
                  currentStats.percentage >= 75 ? 'good' : 'bad'
                }`}
              >
                {currentStats.percentage >= 75 ? 'Above 75%' : 'Below 75%'}
              </span>
            </div>

            <div className="hero-figure-group">
              <div>
                <div
                  className={`hero-number ${
                    currentStats.percentage < 75 ? 'below-threshold' : ''
                  }`}
                >
                  {currentStats.percentage.toFixed(2)}
                  <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>%</span>
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: '0.25rem',
                  }}
                >
                  {currentStats.attended} / {currentStats.total} classes attended
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {currentStats.percentage >= 75 ? (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--good)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <strong>Safe to bunk:</strong> {currentStats.safe_to_miss} classes
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--bad)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <strong>Must attend:</strong> {currentStats.must_attend_next} classes
                  </div>
                )}
              </div>
            </div>

            {/* Quick Simulation Presets */}
            <div className="forecast-preset-bar">
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-soft)',
                  fontWeight: 600,
                }}
              >
                Simulation Presets:
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSimulateAttendAll}
                  title="Simulate attending all upcoming classes"
                >
                  <CheckCircle2 size={13} color="var(--good)" />
                  <span>Attend All</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSimulateMissAll}
                  title="Simulate missing all upcoming classes"
                >
                  <XCircle size={13} color="var(--bad)" />
                  <span>Miss All</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetScenarios}
                  title="Reset scenarios"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sequential Multi-Day Timeline */}
          <div className="forecast-timeline">
            {multiDayProjections.map((day) => {
              const isSelectedDayClass = day.hasClasses;

              return (
                <div
                  key={day.dateStr}
                  className={`forecast-day-card ${day.isSunday ? 'holiday' : ''}`}
                >
                  {/* Day Header */}
                  <div className="forecast-day-header">
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
                        {day.isToday
                          ? `Today — ${day.formattedDate} (${day.shortDay})`
                          : `${day.formattedDate} (${day.shortDay})`}
                      </strong>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: '0.1rem',
                        }}
                      >
                        {day.isSunday
                          ? 'Sunday — College Holiday'
                          : day.periods === 0
                          ? `No ${selectedSubject === 'OVERALL' ? 'classes' : selectedSubject} periods scheduled`
                          : `${day.periods} ${day.periods === 1 ? 'Period' : 'Periods'} scheduled`}
                      </div>
                    </div>

                    {/* Projected State Badge */}
                    <div style={{ textAlign: 'right' }}>
                      <span
                        className="mono-num"
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color:
                            day.resultingPercentage >= 75
                              ? 'var(--good)'
                              : 'var(--bad)',
                        }}
                      >
                        {day.resultingPercentage.toFixed(2)}%
                      </span>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {day.resultingAttended} / {day.resultingTotal}
                      </div>
                    </div>
                  </div>

                  {/* Scenarios Grid */}
                  {isSelectedDayClass ? (
                    <div>
                      <div
                        style={{
                          fontSize: '0.725rem',
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--font-mono)',
                          marginBottom: '0.4rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>
                          Starting from previous day:{' '}
                          <strong>
                            {day.startingAttended}/{day.startingTotal} (
                            {day.startingPercentage.toFixed(2)}%)
                          </strong>
                        </span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--accent-gold)' }}>
                          Tap scenario to select branch
                        </span>
                      </div>

                      <div className="forecast-scenarios-grid">
                        {day.scenarios.map((sc: any) => {
                          const isSelected = day.selectedScenario?.k === sc.k;
                          const deltaText =
                            sc.delta > 0
                              ? `+${sc.delta.toFixed(2)}%`
                              : sc.delta < 0
                              ? `${sc.delta.toFixed(2)}%`
                              : '0.00%';

                          return (
                            <div
                              key={sc.k}
                              className={`scenario-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSelectScenario(day.dateStr, sc.k)}
                            >
                              <div className="scenario-title">
                                {sc.label}
                                {isSelected && ' ✓'}
                              </div>
                              <div
                                className="scenario-pct"
                                style={{
                                  color:
                                    sc.projectedPercentage >= 75
                                      ? 'var(--good)'
                                      : 'var(--bad)',
                                }}
                              >
                                {sc.projectedPercentage.toFixed(2)}%
                              </div>
                              <div
                                className="scenario-delta"
                                style={{
                                  color:
                                    sc.delta > 0
                                      ? 'var(--good)'
                                      : sc.delta < 0
                                      ? 'var(--bad)'
                                      : 'var(--ink-soft)',
                                }}
                              >
                                {deltaText} · {sc.projectedAttended}/{sc.projectedTotal}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          marginTop: '0.5rem',
                          fontSize: '0.725rem',
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--font-mono)',
                          background: 'var(--surface-alt)',
                          padding: '0.35rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <ArrowRight size={12} color="var(--accent-gold)" />
                        <span>
                          Selected: <strong>{day.selectedScenario?.label}</strong> →{' '}
                          <strong>{day.resultingPercentage.toFixed(2)}%</strong> ({day.resultingAttended}/{day.resultingTotal}). Next day projects from this outcome.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--ink-soft)',
                        fontFamily: 'var(--font-mono)',
                        padding: '0.35rem 0',
                      }}
                    >
                      {day.isSunday
                        ? 'Sunday is a fixed holiday. Attendance unaffected.'
                        : `No periods for ${selectedSubject === 'OVERALL' ? 'any subject' : selectedSubject}. Attendance rolls forward unaffected.`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: EXISTING SINGLE-DAY SNAPSHOT (FAT TOOL)          */}
      {/* ========================================================= */}
      {viewMode === 'snapshot' && (
        <div>
          {/* Date Ribbon */}
          <div className="week-navigator-ribbon">
            {nextDays.map((d) => (
              <div
                key={d.dateStr}
                className={`ribbon-day-cell ${selectedDate === d.dateStr ? 'active' : ''}`}
                onClick={() => setSelectedDate(d.dateStr)}
              >
                <div className="ribbon-day-label">{d.dayName}</div>
                <div className="ribbon-day-num">{d.dayNum}</div>
                <div className={`ribbon-status-dot ${d.isSunday ? 'holiday' : ''}`} />
              </div>
            ))}
          </div>

          <div className="ledger-card">
            <div className="card-header-ruled">
              <div>
                <div className="card-header-title">
                  <Sparkles size={16} color="var(--accent-gold)" />
                  <span>FAT — Single-Day Period Simulations</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                  {forecastData?.day_name} ({selectedDate}) Outcome Projections
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                Current: <strong style={{ color: 'var(--ink)' }}>{forecastData?.blocks?.[0]?.current_overall_pct?.toFixed(2) || '—'}%</strong>
              </div>
            </div>

            {error && (
              <div className="alert-callout error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                Simulating period outcomes...
              </div>
            ) : forecastData?.is_holiday ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)' }}>
                <h4 className="heading-ledger" style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}>Sunday — Holiday</h4>
                <p style={{ fontSize: '0.775rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                  No periods scheduled. Aggregate attendance percentage is unaffected.
                </p>
              </div>
            ) : forecastData?.blocks?.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                No scheduled periods found for this date.
              </div>
            ) : (
              <div className="forecast-pc-grid">
                {forecastData?.blocks?.map((block: any) => (
                  <div
                    key={block.block_id}
                    style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="block-index-badge">#{block.order_index}</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{block.subject}</strong>
                        <span className="mono-num" style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                          [{block.periods} {block.periods === 1 ? 'Period' : 'Periods'}]
                        </span>
                      </div>

                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                        Subj: {block.current_subject_pct?.toFixed(1)}%
                      </span>
                    </div>

                    {/* Two-Outcome Comparison Side by Side */}
                    <div className="fat-comparison-grid">
                      <div className="fat-box present">
                        <div className="fat-box-label">If Present</div>
                        <div className="fat-box-pct">{block.overall_if_present?.toFixed(2)}%</div>
                        <div className="fat-box-sub">Subject: {block.subject_if_present?.toFixed(1)}%</div>
                      </div>

                      <div className="fat-box absent">
                        <div className="fat-box-label">If Absent</div>
                        <div className="fat-box-pct">{block.overall_if_absent?.toFixed(2)}%</div>
                        <div className="fat-box-sub">Subject: {block.subject_if_absent?.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: TARGET ATTENDANCE GOAL CALCULATOR                 */}
      {/* ========================================================= */}
      {viewMode === 'goal' && (
        <div className="ledger-card">
          <div className="card-header-ruled">
            <div>
              <span className="card-header-title">Target Attendance Goal Simulator</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                Calculate exact periods & calendar date required to reach any target percentage
              </div>
            </div>
            <span className="card-header-badge good">Dynamic FAT Engine</span>
          </div>

          <div style={{ margin: '1rem 0' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '0.4rem' }}>
              Choose or Enter Desired Target Percentage:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {[75, 80, 85, 90].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn btn-sm ${targetPct === preset ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetPct(preset)}
                  style={{ minWidth: '70px', fontWeight: 700 }}
                >
                  {preset}% {preset === 75 ? '(Pass)' : preset === 85 ? '(Distinction)' : ''}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '240px' }}>
              <input
                type="number"
                className="input-text"
                min="1"
                max="100"
                step="0.5"
                value={targetPct}
                onChange={(e) => setTargetPct(parseFloat(e.target.value) || 75)}
                style={{ textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}
              />
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>%</span>
            </div>
          </div>

          {targetLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-soft)' }}>
              Computing timetable projection...
            </div>
          ) : targetResult ? (
            <div style={{ background: 'var(--surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>CURRENT STATUS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {targetResult.current_percentage?.toFixed(2)}%
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>TARGET GOAL</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                    {targetResult.target_percentage}%
                  </div>
                </div>
              </div>

              {targetResult.status === 'above_target' ? (
                <div className="bunk-banner good">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Already Above Target!</strong> You are currently at {targetResult.current_percentage?.toFixed(2)}%. You can safely miss <strong>{targetResult.safe_to_miss} periods</strong> while staying at or above {targetResult.target_percentage}%.
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bunk-banner bad" style={{ marginBottom: '0.75rem' }}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Must attend {targetResult.periods_needed} consecutive periods</strong> to reach {targetResult.target_percentage}%.
                    </div>
                  </div>

                  {targetResult.projected_date && (
                    <div style={{ padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)', fontSize: '0.85rem' }}>
                      📅 <strong>Estimated Completion Date:</strong>{' '}
                      <span style={{ color: 'var(--good)', fontWeight: 700 }}>
                        {new Date(targetResult.projected_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>
                        Calculated by mapping upcoming classes in Section {user?.section_label || 'timetable'}.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
export default ForecastTab;
