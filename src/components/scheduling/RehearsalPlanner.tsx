'use client';

import React, { useState, useEffect } from 'react';
import { RehearsalEvent, Band } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  ListMusic,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { format, isAfter, isPast, parseISO } from 'date-fns';
import { clsx } from 'clsx';

interface RehearsalPlannerProps {
  bandId?: string;
  showCreateModalInitially?: boolean;
}

export function RehearsalPlanner({
  bandId,
  showCreateModalInitially = false,
}: RehearsalPlannerProps) {
  const { isAdmin, currentUser } = useAuth();
  const [rehearsals, setRehearsals] = useState<RehearsalEvent[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(showCreateModalInitially);

  // Form state
  const [selectedBandId, setSelectedBandId] = useState(bandId || '');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Studio A (Main Soundstage)');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [setlistInput, setSetlistInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadData = () => {
      setRehearsals(DataStore.getRehearsals(bandId));
      setBands(DataStore.getBands());
    };

    loadData();
    const unsub = subscribeToStore('rehearsals', loadData);
    return () => unsub();
  }, [bandId]);

  useEffect(() => {
    if (bandId) {
      setSelectedBandId(bandId);
    } else if (bands.length > 0 && !selectedBandId) {
      setSelectedBandId(bands[0].id);
    }
  }, [bandId, bands, selectedBandId]);

  const handleCreateRehearsal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedBandId || !title.trim()) return;

    const songs = setlistInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    DataStore.createRehearsal({
      bandId: selectedBandId,
      title: title.trim(),
      location,
      date,
      startTime,
      endTime,
      notes: notes.trim(),
      setlist: songs,
    });

    // Reset
    setTitle('');
    setSetlistInput('');
    setNotes('');
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (confirm('Are you sure you want to cancel this rehearsal?')) {
      DataStore.deleteRehearsal(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-studio-900 border border-studio-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Rehearsal Schedule
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-studio-800 text-studio-300 border border-studio-700 font-semibold">
              {rehearsals.length} Sessions
            </span>
          </div>
          <p className="text-xs text-studio-400 mt-1">
            {isAdmin
              ? 'As Director, you have sole authority to schedule and modify practice times.'
              : 'Official rehearsals scheduled by Director Marcus Vance based on band chat availability.'}
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/10 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Schedule Practice
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-studio-800/80 border border-studio-700 text-xs text-studio-400">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin-Led Scheduling (Read-Only)</span>
          </div>
        )}
      </div>

      {/* Rehearsal Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rehearsals.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-studio-950 border border-dashed border-studio-800 rounded-2xl p-6">
            <Calendar className="w-12 h-12 text-studio-600 mx-auto mb-3" />
            <h4 className="text-white font-semibold">No rehearsals scheduled</h4>
            <p className="text-xs text-studio-400 max-w-sm mx-auto mt-1">
              {isAdmin
                ? 'Check student availability in the band chat and schedule your first rehearsal.'
                : 'Your director has not scheduled any upcoming rehearsals for this band yet.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule First Session
              </button>
            )}
          </div>
        ) : (
          rehearsals.map((reh) => {
            const rehDate = parseISO(`${reh.date}T${reh.startTime}`);
            const isUpcoming = isAfter(rehDate, new Date());

            return (
              <div
                key={reh.id}
                className={clsx(
                  'group relative bg-studio-900 border rounded-2xl p-5 transition shadow-sm flex flex-col justify-between',
                  isUpcoming
                    ? 'border-studio-700/80 hover:border-amber-500/50'
                    : 'border-studio-800 opacity-75'
                )}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                        {reh.bandName}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                        {reh.title}
                      </h4>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(reh.id)}
                        className="p-1.5 rounded-lg text-studio-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Cancel Rehearsal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Timing & Room */}
                  <div className="space-y-1.5 text-xs text-studio-300 mb-4 bg-studio-950 p-3 rounded-xl border border-studio-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-white">
                        {format(parseISO(reh.date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-studio-400" />
                      <span>
                        {reh.startTime} – {reh.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-studio-400" />
                      <span className="text-studio-200">{reh.location}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {reh.notes && (
                    <div className="text-xs text-studio-400 mb-4 bg-studio-950/40 p-2.5 rounded-lg border border-studio-800">
                      <span className="font-bold text-studio-300 block mb-0.5">
                        Director Agenda:
                      </span>
                      {reh.notes}
                    </div>
                  )}

                  {/* Setlist */}
                  {reh.setlist && reh.setlist.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-1.5">
                        <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                        Target Rehearsal Setlist:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {reh.setlist.map((song, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-studio-950 border border-studio-800 text-studio-200 font-medium flex items-center gap-1"
                          >
                            <Music className="w-3 h-3 text-studio-400" />
                            {song}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-studio-800/80 flex items-center justify-between text-[11px] text-studio-500">
                  <span>Scheduled by Director Marcus</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Confirmed
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Rehearsal Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-studio-900 border border-studio-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 pb-4 border-b border-studio-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Schedule Official Rehearsal
                  </h3>
                  <p className="text-xs text-studio-400">
                    Set date, studio location, and setlist for the band.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-studio-400 hover:text-white p-1 rounded-lg hover:bg-studio-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRehearsal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Select Band
                </label>
                <select
                  value={selectedBandId}
                  onChange={(e) => setSelectedBandId(e.target.value)}
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {bands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.genre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Rehearsal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rhythm Section Tightening & Solos"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Studio / Room Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Studio A (Main Soundstage)">
                    Studio A (Main Soundstage)
                  </option>
                  <option value="Live Room 3 (Amplified)">
                    Live Room 3 (Amplified)
                  </option>
                  <option value="Rehearsal Hall 2 (Acoustic / Big Ensembles)">
                    Rehearsal Hall 2 (Acoustic / Big Ensembles)
                  </option>
                  <option value="Keyboard Lab B">Keyboard Lab B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Setlist Songs (comma separated)
                </label>
                <input
                  type="text"
                  value={setlistInput}
                  onChange={(e) => setSetlistInput(e.target.value)}
                  placeholder="e.g. Chameleon, Superstition, Cissy Strut"
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Director Notes / Objectives
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific section goals, dynamics, charts to prepare..."
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-studio-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-studio-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Publish to Band & Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
