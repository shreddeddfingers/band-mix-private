'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band, RehearsalEvent } from '@/types';
import { RehearsalPlanner } from '@/components/scheduling/RehearsalPlanner';
import { Calendar, Music, Filter, Clock, Lock } from 'lucide-react';
import { clsx } from 'clsx';

export default function SchedulePage() {
  const router = useRouter();
  const { isAdmin, activeDirectorId, currentUser } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBandFilter, setSelectedBandFilter] = useState<string>('all');

  useEffect(() => {
    const refresh = () => setBands(DataStore.getBands(activeDirectorId));
    refresh();
    const unsub = subscribeToStore('bands', refresh);
    return () => unsub();
  }, [activeDirectorId]);

  useEffect(() => {
    if (!isAdmin && currentUser?.role === 'student') {
      const studentBands = DataStore.getBands().filter((b) =>
        b.members.some((m) => m.userId === currentUser.id)
      );
      if (studentBands.length > 0) {
        router.replace(`/bands/${studentBands[0].id}`);
      }
    }
  }, [isAdmin, currentUser, router]);

  if (!isAdmin) {
    const studentBands = currentUser
      ? DataStore.getBands().filter((b) => b.members.some((m) => m.userId === currentUser.id))
      : [];
    const myBand = studentBands[0];

    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Director Master Schedule</h2>
        <p className="text-sm text-studio-400 leading-relaxed">
          The master calendar is for studio-wide rehearsal coordination. To view your rehearsals, live call-times, and RSVP, visit your band page.
        </p>
        <div className="pt-2">
          {myBand ? (
            <Link
              href={`/bands/${myBand.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-lg shadow-amber-500/20"
            >
              <Music className="w-4 h-4" />
              Go to My Band ({myBand.name})
            </Link>
          ) : (
            <Link
              href="/bands"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs sm:text-sm font-semibold transition"
            >
              Back to Ensembles
            </Link>
          )}
        </div>
      </div>
    );
  }

  const rawName = currentUser?.name || 'Director';
  const directorTitle = rawName.toLowerCase().startsWith('director')
    ? rawName
    : `Director ${rawName}`;

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
            Studio-wide practice bookings, rehearsal agendas, and song setlists managed by {directorTitle}.
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
