'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { isFirebaseConfigured } from '@/lib/firebase';
import { FirestoreService } from '@/lib/firestore-service';
import { Band, RehearsalEvent, UserProfile } from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import { CreateBandModal } from '@/components/bands/CreateBandModal';
import { CreateDirectorModal } from '@/components/directors/CreateDirectorModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import { LoginModal } from '@/components/auth/LoginModal';
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
  LogIn,
  Smartphone,
  Check,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';


export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, isAdmin, isStudent, activeDirectorId, activeBranding, isAuthLoading } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [rehearsals, setRehearsals] = useState<RehearsalEvent[]>([]);
  const [isCreateBandOpen, setIsCreateBandOpen] = useState(false);
  const [isCreateDirectorModalOpen, setIsCreateDirectorModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginDefaultRole, setLoginDefaultRole] = useState<'student' | 'admin'>('student');
  const [rememberOnDevice, setRememberOnDevice] = useState(() => DataStore.isRememberDevice());

  const toggleRememberDevice = () => {
    const next = !rememberOnDevice;
    setRememberOnDevice(next);
    DataStore.setRememberDevice(next);
  };

  useEffect(() => {
    const refresh = () => {
      let b = isStudent ? DataStore.getBands() : DataStore.getBands(activeDirectorId);
      if (b.length === 0) b = DataStore.getBands();
      setBands(b);
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
  }, [activeDirectorId, isStudent]);

  useEffect(() => {
    if (isStudent && isFirebaseConfigured) {
      FirestoreService.getBands()
        .then((remoteBands) => {
          if (remoteBands && remoteBands.length > 0) {
            DataStore.mergeRemoteBands(remoteBands);
          }
        })
        .catch(console.error);
    }
  }, [isStudent]);

  // Filter bands for current student if in student mode
  const displayedBands = isStudent
    ? DataStore.getBands().filter(
        (b) =>
          b.members?.some((m) => m.userId === currentUser?.id) ||
          (currentUser?.bandIds && currentUser.bandIds.includes(b.id))
      )
    : bands;

  const upcomingRehearsals = isStudent
    ? rehearsals.filter((r) =>
        displayedBands.some((b) => b.id === r.bandId)
      )
    : rehearsals;

  // Direct students to their band page
  useEffect(() => {
    if (isStudent && displayedBands.length > 0) {
      router.replace(`/bands/${displayedBands[0].id}`);
    }
  }, [isStudent, displayedBands, router]);

  // Loading persistent session state
  if (isAuthLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
        <div className="w-9 h-9 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-xs text-studio-400 font-semibold tracking-wide">
          Connecting to {activeBranding?.studioName || 'BandMix'} Studio...
        </p>
      </div>
    );
  }

  // Guest / Unauthenticated Portal View
  if (!currentUser) {
    return (
      <div className="py-8 sm:py-16 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            Studio Band Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome to {activeBranding?.studioName || 'BandMix'}
          </h1>
          <p className="text-sm sm:text-base text-studio-400 max-w-lg mx-auto">
            {activeBranding?.tagline ||
              'The ensemble platform for student musicians and band directors.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Student Musician */}
          <div className="p-6 rounded-3xl apple-glass-card hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-5 shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl apple-glass-pill flex items-center justify-center text-amber-400 shadow-sm">
                <Music className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Student Musician</h2>
              <p className="text-xs text-white/70 leading-relaxed">
                Log in to access your band rehearsal hub, setlists, song suggestions, and chat with your bandmates.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLoginDefaultRole('student');
                  setIsLoginModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition apple-spring min-h-[44px]"
              >
                <span>Student Sign In</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <Link
                href="/onboard"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full apple-glass-pill text-white/80 hover:text-white text-xs font-semibold transition apple-spring min-h-[40px]"
              >
                <span>New Student? Use Intake Pass →</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Band Director */}
          <div className="p-6 rounded-3xl apple-glass-card hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-5 shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl apple-glass-pill flex items-center justify-center text-purple-400 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Band Director</h2>
              <p className="text-xs text-white/70 leading-relaxed">
                Log in to coordinate rehearsals, match musicians into ensembles, manage student intake, and oversee band chats.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLoginDefaultRole('admin');
                  setIsLoginModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/20 transition apple-spring min-h-[44px]"
              >
                <span>Director Sign In</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreateDirectorModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full apple-glass-pill text-purple-300 hover:text-white text-xs font-semibold transition apple-spring min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>New Director? Create Account →</span>
              </button>

              <label className="flex items-center gap-2 text-xs text-white/60 hover:text-white cursor-pointer pt-1 justify-center select-none">
                <input
                  type="checkbox"
                  checked={rememberOnDevice}
                  onChange={(e) => {
                    setRememberOnDevice(e.target.checked);
                    DataStore.setRememberDevice(e.target.checked);
                  }}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-studio-950 border-studio-700 cursor-pointer"
                />
                <span>Remember Director on this device</span>
              </label>
            </div>
          </div>
        </div>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          defaultRole={loginDefaultRole}
        />

        <CreateDirectorModal
          isOpen={isCreateDirectorModalOpen}
          onClose={() => setIsCreateDirectorModalOpen(false)}
        />
      </div>
    );
  }

  if (isStudent) {
    if (displayedBands.length > 0) {
      return (
        <div className="py-20 text-center">
          <p className="text-studio-400">Loading your band hub...</p>
        </div>
      );
    }

    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <Music className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Welcome, {currentUser?.name}!</h2>
        <p className="text-sm text-studio-400 leading-relaxed">
          You are not currently enrolled in any bands. When your band director assigns you to an ensemble, your dedicated band page with chat, announcements, setlists, and rehearsals will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl apple-glass-card p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Live Studio Hub
              </span>
              {isAdmin ? (
                <span className="text-xs px-2.5 py-1 rounded-full apple-glass-pill text-white/80 font-mono">
                  {currentUser?.studioName || 'Director Administration'}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full apple-glass-pill text-white/80">
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

            <p className="mt-2 text-sm sm:text-base text-white/70 leading-relaxed">
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
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-[var(--brand-contrast-text)] text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition apple-spring min-h-[40px]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Create New Band
                  </button>
                  <button
                    onClick={() => setIsQrOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full apple-glass-pill text-white text-xs sm:text-sm font-semibold transition apple-spring min-h-[40px]"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    Student QR Invite
                  </button>
                  <Link
                    href="/roster"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full apple-glass-pill text-white/80 hover:text-white text-xs sm:text-sm font-semibold transition apple-spring min-h-[40px]"
                  >
                    <Users className="w-4 h-4" />
                    Manage Roster
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/bands"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-[var(--brand-contrast-text)] text-xs sm:text-sm font-bold transition apple-spring min-h-[40px]"
                  >
                    <Music className="w-4 h-4" />
                    My Band Hub
                  </Link>
                  <Link
                    href="/schedule"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full apple-glass-pill text-white text-xs sm:text-sm font-semibold transition apple-spring min-h-[40px]"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    View Rehearsal Calendar
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="apple-glass p-5 rounded-2xl flex flex-col justify-between gap-4 w-full md:w-72 shrink-0 border border-white/10 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Total Ensembles</span>
                <span className="font-bold text-white font-mono">{bands.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Enrolled Students</span>
                <span className="font-bold text-white font-mono">{students.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Upcoming Rehearsals</span>
                <span className="font-bold text-amber-400 font-mono">
                  {rehearsals.length}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 text-[11px] text-white/60 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mandated Director presence active on all channels.</span>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-white truncate">
                      Remember on this device
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleRememberDevice}
                    className={clsx(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none apple-spring',
                      rememberOnDevice ? 'bg-amber-500' : 'bg-white/20'
                    )}
                    title={rememberOnDevice ? 'Session remembered on this device' : 'Remember on this device'}
                  >
                    <span
                      className={clsx(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        rememberOnDevice ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-white/50 mt-1">
                  {rememberOnDevice
                    ? '✓ Auto-signs in as Director on this device'
                    : 'Session ends when browser closes'}
                </p>
              </div>
            )}
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
              <p className="text-xs text-white/60 mt-0.5">
                {isStudent
                  ? 'Groups you perform with and your assigned instrument slots.'
                  : 'All student bands with member instrument slots and chat channels.'}
              </p>
            </div>
            <Link
              href="/bands"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 group apple-spring"
            >
              View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBands.map((band) => (
              <Link
                key={band.id}
                href={`/bands/${band.id}`}
                className="group relative apple-glass-card rounded-2xl p-4 transition duration-200 shadow-sm flex flex-col justify-between apple-spring-subtle"
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
              <div className="apple-glass-card rounded-2xl p-6 text-center text-white/50 text-xs">
                No rehearsals scheduled yet.
              </div>
            ) : (
              upcomingRehearsals.slice(0, 3).map((reh) => (
                <div
                  key={reh.id}
                  className="apple-glass-card p-4 rounded-2xl space-y-2 hover:border-white/20 transition apple-spring-subtle"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-amber-400">
                      {reh.bandName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full apple-glass-pill text-white/80 font-mono text-[10px]">
                      {reh.startTime} – {reh.endTime}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{reh.title}</h4>

                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
                      {format(parseISO(reh.date), 'EEE, MMM d')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400/80" />
                      {reh.location.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Quick QR intake trigger box */}
            {isAdmin && (
              <div className="p-4 rounded-2xl apple-glass border border-amber-500/25 text-center shadow-lg">
                <div className="w-10 h-10 rounded-full apple-glass-pill flex items-center justify-center text-amber-400 mx-auto mb-2 shadow-sm">
                  <QrCode className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Invite New Students
                </h4>
                <p className="text-[11px] text-white/60 mt-1">
                  Students can scan the dynamic QR pass to choose instruments and join.
                </p>
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="mt-3 w-full py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition apple-spring shadow-md shadow-amber-500/20 min-h-[38px]"
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
