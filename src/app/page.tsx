'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band, RehearsalEvent, UserProfile } from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import { CreateBandModal } from '@/components/bands/CreateBandModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import {
  Music,
  Users,
  Calendar,
  Clock,
  MapPin,
  Plus,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Radio,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function DashboardPage() {
  const { currentUser, isAdmin, isStudent, activeDirectorId } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [rehearsals, setRehearsals] = useState<RehearsalEvent[]>([]);
  const [isCreateBandOpen, setIsCreateBandOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setBands(DataStore.getBands(activeDirectorId));
      setStudents(DataStore.getStudents(activeDirectorId));
      setRehearsals(DataStore.getRehearsals());
    };

    refresh();
    const unsubBands = subscribeToStore('bands', refresh);
    const unsubStudents = subscribeToStore('students', refresh);
    const unsubRehearsals = subscribeToStore('rehearsals', refresh);

    return () => {
      unsubBands();
      unsubStudents();
      unsubRehearsals();
    };
  }, [activeDirectorId]);

  // Filter bands for current student if in student mode
  const displayedBands = isStudent
    ? bands.filter((b) => b.members.some((m) => m.userId === currentUser?.id))
    : bands;

  const upcomingRehearsals = isStudent
    ? rehearsals.filter((r) =>
        displayedBands.some((b) => b.id === r.bandId)
      )
    : rehearsals;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-studio-900 via-studio-900 to-studio-950 border border-studio-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Live Studio Hub
              </span>
              {isAdmin ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-studio-800 text-studio-300 border border-studio-700 font-mono">
                  {currentUser?.studioName || 'Director Administration'}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-studio-800 text-studio-300 border border-studio-700">
                  Student Musician View
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {isAdmin ? (
                <>Welcome back, Director {currentUser?.name?.split(' ')[0]}</>
              ) : (
                <>Welcome back, {currentUser?.name}!</>
              )}
            </h1>

            <p className="mt-2 text-sm sm:text-base text-studio-300 leading-relaxed">
              {isAdmin
                ? 'Oversee all student ensembles, track instrument rosters, mandate chat channels, and schedule rehearsal times.'
                : `You are enrolled in ${displayedBands.length} band${
                    displayedBands.length === 1 ? '' : 's'
                  }. Review your rehearsal schedule and coordinate in the band chat.`}
            </p>

            {/* Quick Action buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setIsCreateBandOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Create New Band
                  </button>
                  <button
                    onClick={() => setIsQrOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs sm:text-sm font-semibold border border-studio-700 transition"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    Student QR Invite
                  </button>
                  <Link
                    href="/roster"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-studio-900/80 hover:bg-studio-800 text-studio-300 hover:text-white text-xs sm:text-sm font-semibold border border-studio-800 transition"
                  >
                    <Users className="w-4 h-4" />
                    Manage Roster
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/bands"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition"
                  >
                    <Music className="w-4 h-4" />
                    My Band Hub
                  </Link>
                  <Link
                    href="/schedule"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-white text-xs sm:text-sm font-semibold border border-studio-700 transition"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    View Rehearsal Calendar
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-studio-950/70 border border-studio-800 p-5 rounded-2xl flex flex-col justify-between gap-4 w-full md:w-72 shrink-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-studio-400">Total Ensembles</span>
                <span className="font-bold text-white font-mono">{bands.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-studio-400">Enrolled Students</span>
                <span className="font-bold text-white font-mono">{students.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-studio-400">Upcoming Rehearsals</span>
                <span className="font-bold text-amber-400 font-mono">
                  {rehearsals.length}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-studio-800 text-[11px] text-studio-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mandated Director presence active on all channels.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Bands & Upcoming Rehearsals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Bands */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-400" />
                {isStudent ? 'My Ensembles' : 'Active Bands & Ensembles'}
              </h2>
              <p className="text-xs text-studio-400 mt-0.5">
                {isStudent
                  ? 'Groups you perform with and your assigned instrument slots.'
                  : 'All student bands with member instrument slots and chat channels.'}
              </p>
            </div>
            <Link
              href="/bands"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
            >
              View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBands.map((band) => (
              <Link
                key={band.id}
                href={`/bands/${band.id}`}
                className="group relative bg-studio-900 border border-studio-800 hover:border-amber-500/50 rounded-2xl p-4 transition duration-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Cover Header */}
                  <div className="relative h-28 rounded-xl overflow-hidden mb-3.5 bg-studio-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        band.coverImage ||
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'
                      }
                      alt={band.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-studio-950 via-studio-950/40 to-transparent" />
                    <span className="absolute bottom-2 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-amber-300 border border-white/10">
                      {band.genre}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition">
                    {band.name}
                  </h3>
                  <p className="text-xs text-studio-400 line-clamp-2 mt-1">
                    {band.description}
                  </p>
                </div>

                {/* Member Instruments Breakdown */}
                <div className="mt-4 pt-3 border-t border-studio-800/80">
                  <div className="flex items-center justify-between text-xs text-studio-400 mb-2">
                    <span className="font-semibold text-studio-300">
                      {band.members.length} Members
                    </span>
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {band.rehearsalSchedule || 'TBD'}
                    </span>
                  </div>

                  {/* Instrument Icons row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {band.members.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center p-1 rounded-lg bg-studio-950 border border-studio-800"
                        title={`${m.name} (${m.instrument})`}
                      >
                        <InstrumentIcon instrument={m.instrument} size="xs" />
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Rehearsals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Next Rehearsals
            </h2>
            <Link
              href="/schedule"
              className="text-xs font-semibold text-studio-400 hover:text-white"
            >
              Full Calendar
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingRehearsals.length === 0 ? (
              <div className="bg-studio-900 border border-studio-800 rounded-2xl p-6 text-center text-studio-400 text-xs">
                No rehearsals scheduled yet.
              </div>
            ) : (
              upcomingRehearsals.slice(0, 3).map((reh) => (
                <div
                  key={reh.id}
                  className="bg-studio-900 border border-studio-800 p-4 rounded-2xl space-y-2 hover:border-studio-700 transition"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-amber-400">
                      {reh.bandName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-studio-800 text-studio-300 font-mono">
                      {reh.startTime} – {reh.endTime}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{reh.title}</h4>

                  <div className="flex items-center gap-3 text-xs text-studio-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-studio-500" />
                      {format(parseISO(reh.date), 'EEE, MMM d')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-studio-500" />
                      {reh.location.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Quick QR intake trigger box */}
            {isAdmin && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-studio-900 border border-amber-500/20 text-center">
                <QrCode className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Invite New Students
                </h4>
                <p className="text-[11px] text-studio-400 mt-1">
                  Students can scan the dynamic QR pass to choose instruments and join.
                </p>
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="mt-3 w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                >
                  Show Studio QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateBandModal
        isOpen={isCreateBandOpen}
        onClose={() => setIsCreateBandOpen(false)}
        onSuccess={() => {
          setBands(DataStore.getBands(activeDirectorId));
        }}
      />
      <QRCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </div>
  );
}
