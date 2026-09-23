'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band, RehearsalEvent } from '@/types';
import { RehearsalPlanner } from '@/components/scheduling/RehearsalPlanner';
import { Calendar, Music, Filter, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export default function SchedulePage() {
  const { isAdmin } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBandFilter, setSelectedBandFilter] = useState<string>('all');

  useEffect(() => {
    const refresh = () => setBands(DataStore.getBands());
    refresh();
    const unsub = subscribeToStore('bands', refresh);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-amber-400" />
            Master Rehearsal Schedule
          </h1>
          <p className="text-sm text-studio-400 mt-1">
            Studio-wide practice bookings, rehearsal agendas, and song setlists managed exclusively by Director Marcus Vance.
          </p>
        </div>

        {/* Filter by band selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-studio-400" />
          <select
            value={selectedBandFilter}
            onChange={(e) => setSelectedBandFilter(e.target.value)}
            className="bg-studio-900 border border-studio-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Ensembles ({bands.length})</option>
            {bands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Rehearsal Planner */}
      <RehearsalPlanner
        bandId={selectedBandFilter === 'all' ? undefined : selectedBandFilter}
      />
    </div>
  );
}
