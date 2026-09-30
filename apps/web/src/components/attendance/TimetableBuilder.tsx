import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

const DAYS = [
  { weekday: 1, name: 'Monday', short: 'Mon' },
  { weekday: 2, name: 'Tuesday', short: 'Tue' },
  { weekday: 3, name: 'Wednesday', short: 'Wed' },
  { weekday: 4, name: 'Thursday', short: 'Thu' },
  { weekday: 5, name: 'Friday', short: 'Fri' },
  { weekday: 6, name: 'Saturday', short: 'Sat' },
];

interface TimetableBuilderProps {
  initialBlocks?: any[];
  onSave: (blocks: any[]) => void;
  onCancel?: () => void;
  showHeader?: boolean;
}

export const TimetableBuilder: React.FC<TimetableBuilderProps> = ({
  initialBlocks = [],
  onSave,
  onCancel,
  showHeader = true,
}) => {
  const [activeDay, setActiveDay] = useState(1);

  const [blocksByDay, setBlocksByDay] = useState<Record<number, Array<{ subject: string; periods: number }>>>(() => {
    const map: Record<number, Array<{ subject: string; periods: number }>> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    if (Array.isArray(initialBlocks)) {
      initialBlocks.forEach(b => {
        if (map[b.weekday]) {
          map[b.weekday].push({
            subject: b.subject || '',
            periods: b.periods || 2,
          });
        }
      });
    }
    return map;
  });

  const handleAddBlock = () => {
    setBlocksByDay(prev => ({
      ...prev,
      [activeDay]: [...prev[activeDay], { subject: '', periods: 2 }],
    }));
  };

  const handleUpdateBlock = (index: number, field: 'subject' | 'periods', value: any) => {
    setBlocksByDay(prev => {
      const currentList = [...prev[activeDay]];
      currentList[index] = { ...currentList[index], [field]: value };
      return { ...prev, [activeDay]: currentList };
    });
  };

  const handleRemoveBlock = (index: number) => {
    setBlocksByDay(prev => ({
      ...prev,
      [activeDay]: prev[activeDay].filter((_, i) => i !== index),
    }));
  };

  const totalWeeklyPeriods = Object.values(blocksByDay).reduce(
    (acc, list) => acc + list.reduce((sum, b) => sum + (Number(b.periods) || 0), 0),
    0
  );

  const handleComplete = () => {
    const flattened: any[] = [];
    for (let w = 1; w <= 6; w++) {
      const list = blocksByDay[w] || [];
      list.forEach((b, idx) => {
        if (b.subject.trim()) {
          flattened.push({
            weekday: w,
            order_index: idx + 1,
            subject: b.subject.trim(),
            periods: Number(b.periods) || 1,
          });
        }
      });
    }
    onSave(flattened);
  };

  return (
    <div className="timetable-builder" style={{ padding: '0.5rem 0' }}>
      {showHeader && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 className="heading-ledger" style={{ fontSize: '1.15rem' }}>Section Timetable Builder</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '0.25rem' }}>
            Define subjects and period durations for Monday through Saturday. Sunday is always treated as a fixed holiday.
          </p>
        </div>
      )}

      {/* Day Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', marginBottom: '1rem' }}>
        {DAYS.map(d => {
          const count = blocksByDay[d.weekday]?.length || 0;
          const isActive = activeDay === d.weekday;
          return (
            <button
              key={d.weekday}
              type="button"
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveDay(d.weekday)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              {d.short} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Active Day Content */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span className="font-serif" style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>
            {DAYS.find(d => d.weekday === activeDay)?.name} Schedule
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddBlock}>
            <Plus size={14} /> Add Subject
          </button>
        </div>

        {blocksByDay[activeDay]?.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', color: 'var(--ink-soft)', fontSize: '0.85rem', border: '1px solid var(--rule)' }}>
            No classes scheduled for {DAYS.find(d => d.weekday === activeDay)?.name}.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {blocksByDay[activeDay].map((block, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. DBMS, OOPJ, PP LAB"
                  value={block.subject}
                  onChange={(e) => handleUpdateBlock(idx, 'subject', e.target.value)}
                  style={{ flex: 1 }}
                />

                <select
                  className="input-text"
                  value={block.periods}
                  onChange={(e) => handleUpdateBlock(idx, 'periods', parseInt(e.target.value) || 1)}
                  style={{ width: '110px', fontFamily: 'var(--font-mono)' }}
                >
                  <option value={1}>1 Period</option>
                  <option value={2}>2 Periods</option>
                  <option value={3}>3 Periods</option>
                  <option value={4}>4 Periods</option>
                </select>

                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={() => handleRemoveBlock(idx)}
                  title="Remove block"
                  style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--rule)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
          Total Weekly: <strong className="mono-num" style={{ color: 'var(--good)' }}>{totalWeeklyPeriods}</strong> periods
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onCancel && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={handleComplete}>
            <CheckCircle size={15} /> Save Timetable
          </button>
        </div>
      </div>
    </div>
  );
};
