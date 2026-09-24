'use client';

import React from 'react';
import { DayOfWeek, RecurringTimeWindow } from '@/types';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface AvailabilityPickerProps {
  value: RecurringTimeWindow[];
  onChange: (windows: RecurringTimeWindow[]) => void;
}

const DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

export function AvailabilityPicker({ value, onChange }: AvailabilityPickerProps) {
  const addDayWindow = (day: DayOfWeek) => {
    const newWindow: RecurringTimeWindow = {
      id: `avail-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      dayOfWeek: day,
      startTime: '16:30',
      endTime: '18:30',
    };
    onChange([...value, newWindow]);
  };

  const removeWindow = (id: string) => {
    onChange(value.filter((w) => w.id !== id));
  };

  const updateWindow = (
    id: string,
    field: 'startTime' | 'endTime',
    val: string
  ) => {
    onChange(
      value.map((w) => (w.id === id ? { ...w, [field]: val } : w))
    );
  };

  const applyPreset = (preset: 'afterschool' | 'weekends') => {
    if (preset === 'afterschool') {
      const days: DayOfWeek[] = ['tuesday', 'thursday'];
      const windows: RecurringTimeWindow[] = days.map((day) => ({
        id: `avail-${day}-${Date.now().toString(36)}`,
        dayOfWeek: day,
        startTime: '16:30',
        endTime: '18:30',
      }));
      onChange(windows);
    } else if (preset === 'weekends') {
      const days: DayOfWeek[] = ['saturday'];
      const windows: RecurringTimeWindow[] = days.map((day) => ({
        id: `avail-${day}-${Date.now().toString(36)}`,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '13:00',
      }));
      onChange(windows);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-studio-400 font-semibold flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          Recurring Rehearsal Availability
        </span>
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => applyPreset('afterschool')}
            className="px-2.5 py-1 rounded-lg bg-studio-950 border border-studio-800 text-studio-300 hover:text-white hover:border-studio-700 transition text-[11px]"
          >
            Preset: Tue/Thu 4:30–6:30 PM
          </button>
          <button
            type="button"
            onClick={() => applyPreset('weekends')}
            className="px-2.5 py-1 rounded-lg bg-studio-950 border border-studio-800 text-studio-300 hover:text-white hover:border-studio-700 transition text-[11px]"
          >
            Preset: Sat 10:00 AM–1:00 PM
          </button>
        </div>
      </div>

      {/* Day Buttons */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day) => {
          const hasWindow = value.some((w) => w.dayOfWeek === day.id);
          return (
            <button
              type="button"
              key={day.id}
              onClick={() => {
                if (hasWindow) {
                  onChange(value.filter((w) => w.dayOfWeek !== day.id));
                } else {
                  addDayWindow(day.id);
                }
              }}
              className={clsx(
                'py-2 rounded-xl text-xs font-bold text-center border transition',
                hasWindow
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/10'
                  : 'bg-studio-950 border-studio-800 text-studio-400 hover:border-studio-700 hover:text-white'
              )}
            >
              {day.short}
            </button>
          );
        })}
      </div>

      {/* Configured Time Windows */}
      {value.length === 0 ? (
        <div className="p-4 rounded-xl bg-studio-950/70 border border-dashed border-studio-800 text-center text-xs text-studio-400">
          Click the days above when you are available for recurring rehearsals.
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {value.map((win) => {
            const dayMeta = DAYS.find((d) => d.id === win.dayOfWeek);
            return (
              <div
                key={win.id}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2.5 rounded-xl bg-studio-950 border border-studio-800 gap-2 sm:gap-3"
              >
                <div className="flex items-center gap-2 min-w-24">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-white">
                    {dayMeta?.label || win.dayOfWeek}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-studio-500" />
                  <input
                    type="time"
                    value={win.startTime}
                    onChange={(e) =>
                      updateWindow(win.id, 'startTime', e.target.value)
                    }
                    className="bg-studio-900 border border-studio-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-studio-500">to</span>
                  <input
                    type="time"
                    value={win.endTime}
                    onChange={(e) =>
                      updateWindow(win.id, 'endTime', e.target.value)
                    }
                    className="bg-studio-900 border border-studio-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeWindow(win.id)}
                  className="p-1 rounded-lg text-studio-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Remove this availability window"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
