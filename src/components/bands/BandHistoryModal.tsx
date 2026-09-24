'use client';

import React, { useMemo } from 'react';
import { DataStore } from '@/lib/data-store';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import {
  X,
  History,
  Users,
  Music2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Archive,
} from 'lucide-react';
import { clsx } from 'clsx';

interface BandHistoryModalProps {
  bandId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BandHistoryModal({ bandId, isOpen, onClose }: BandHistoryModalProps) {
  const history = useMemo(() => {
    if (!bandId) return undefined;
    return DataStore.getBandHistory(bandId);
  }, [bandId]);

  if (!isOpen || !history) return null;

  const readySongs = history.finalRepertoire.filter(
    (s) => s.status === 'performance_ready'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-studio-900 border border-studio-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-studio-800 flex items-center justify-between bg-studio-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{history.bandName}</h2>
                <span
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                    history.status === 'archived'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  )}
                >
                  {history.status}
                </span>
              </div>
              <p className="text-xs text-studio-400">
                {history.genre} • Band Season Record & Preservation
                {history.archivedAt && (
                  <span>
                    {' '}
                    • Archived {new Date(history.archivedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-studio-400 hover:text-white hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-studio-950/80 border border-studio-800 p-3.5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-studio-400 font-semibold mb-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Lineup
              </div>
              <div className="text-xl font-black text-white">
                {history.finalLineup.length}
              </div>
              <div className="text-[10px] text-studio-500">Musicians</div>
            </div>

            <div className="bg-studio-950/80 border border-studio-800 p-3.5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-studio-400 font-semibold mb-1">
                <Music2 className="w-3.5 h-3.5 text-amber-400" />
                Repertoire
              </div>
              <div className="text-xl font-black text-white">
                {history.finalRepertoire.length}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {readySongs} Stage Ready
              </div>
            </div>

            <div className="bg-studio-950/80 border border-studio-800 p-3.5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-studio-400 font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Past Events
              </div>
              <div className="text-xl font-black text-white">
                {history.pastEventsCount}
              </div>
              <div className="text-[10px] text-studio-500">Rehearsals & Gigs</div>
            </div>
          </div>

          {/* Final Lineup */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Band Roster Lineup
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {history.finalLineup.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-studio-950 border border-studio-800/80"
                >
                  <div className="w-8 h-8 rounded-lg bg-studio-900 flex items-center justify-center text-amber-400 shrink-0">
                    <InstrumentIcon instrument={member.instrument} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {member.name}
                      </span>
                      {member.role === 'director' && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          Dir
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-studio-400 capitalize">
                      {member.instrument}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Repertoire */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-amber-400" />
              Preserved Repertoire ({history.finalRepertoire.length})
            </h3>
            {history.finalRepertoire.length === 0 ? (
              <p className="text-xs text-studio-500 italic p-3 bg-studio-950 rounded-xl border border-studio-800">
                No songs were recorded in this band's master setlist.
              </p>
            ) : (
              <div className="space-y-1.5">
                {history.finalRepertoire.map((song, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-studio-950 border border-studio-800/80 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{song.title}</span>
                      <span className="text-studio-400 ml-2">by {song.artist}</span>
                    </div>
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-md capitalize',
                        song.status === 'performance_ready' &&
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                        song.status === 'rehearsing' &&
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                        song.status === 'learning' &&
                          'bg-sky-500/20 text-sky-300 border border-sky-500/30',
                        song.status === 'retired' &&
                          'bg-slate-800 text-slate-400 border border-slate-700'
                      )}
                    >
                      {song.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-studio-950/80 border-t border-studio-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs font-bold transition"
          >
            Close History Record
          </button>
        </div>
      </div>
    </div>
  );
}
