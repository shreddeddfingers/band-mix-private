'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data-store';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Music,
  Loader2,
  Lock,
  Mail,
  User,
  Radio,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function LoginPage() {
  const router = useRouter();
  const {
    loginStudent,
    loginDirector,
    signInWithGoogle,
    isFirebaseActive,
    activeBranding,
    directors,
    currentUser,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [studentQuery, setStudentQuery] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorPassword, setDirectorPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableStudents = DataStore.getStudents();
  const availableDirectors =
    directors && directors.length > 0 ? directors : DataStore.getDirectors();

  const brandColor = activeBranding?.accentColor || activeBranding?.brandColor || '#F59E0B';
  const brandName = activeBranding?.studioName || 'BANDMIX';

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentQuery.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const student = await loginStudent(studentQuery.trim());
      const bands = DataStore.getBands();
      const myBand = bands.find((b) =>
        b.members?.some((m) => m.userId === student.id) ||
        (student.bandIds && student.bandIds.includes(b.id))
      );

      if (myBand) {
        router.push(`/bands/${myBand.id}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to sign in. Please verify your student email or name.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorEmail.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginDirector(directorEmail.trim(), directorPassword.trim() || undefined);
      router.push('/');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Failed to sign in as Director. Please check your email.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStudentSelect = async (studentId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const student = await loginStudent(studentId);
      const bands = DataStore.getBands();
      const myBand = bands.find((b) =>
        b.members?.some((m) => m.userId === student.id) ||
        (student.bandIds && student.bandIds.includes(b.id))
      );
      if (myBand) {
        router.push(`/bands/${myBand.id}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDirectorSelect = async (dirEmail: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginDirector(dirEmail);
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg bg-studio-900 border border-studio-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {activeBranding?.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={activeBranding.logoUrl}
              alt={brandName}
              className="w-14 h-14 rounded-2xl object-cover border border-studio-700 bg-studio-950 mx-auto shadow-lg"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg mx-auto"
              style={{ backgroundColor: brandColor }}
            >
              <Radio className="w-7 h-7 stroke-[2.5]" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign In to {brandName}
          </h1>
          <p className="text-xs sm:text-sm text-studio-400 max-w-sm mx-auto">
            Log in to access your band rehearsal hub, group messages, setlists, and schedule.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-studio-950 p-1 border border-studio-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMessage(null);
            }}
            className={clsx(
              'flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-2',
              activeTab === 'student'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-studio-400 hover:text-white'
            )}
          >
            <GraduationCap className="w-4 h-4" />
            Student Musician
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage(null);
            }}
            className={clsx(
              'flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-2',
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-studio-400 hover:text-white'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Band Director
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Student Form */}
        {activeTab === 'student' && (
          <div className="space-y-5">
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Student Email or Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-studio-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. student@email.com or Alex Johnson"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl pl-9 pr-3.5 py-3 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <p className="text-[11px] text-studio-400 mt-1.5">
                  Use the email address or name entered during student intake.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !studentQuery.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    Sign In to Band Hub
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-tap select for students */}
            {availableStudents.length > 0 && (
              <div className="pt-4 border-t border-studio-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-2 flex items-center justify-between">
                  <span>Profiles on This Studio</span>
                  <span className="text-[10px] text-studio-500 font-mono">1-Tap Login</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {availableStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleQuickStudentSelect(s.id)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-studio-950 hover:bg-studio-800 border border-studio-800 transition text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-studio-800 border border-studio-700 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate block">
                            {s.name}
                          </span>
                          <span className="text-[10px] text-studio-400 capitalize">
                            {s.primaryInstrument} • {s.skillLevel}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-studio-500 group-hover:text-amber-400 transition shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Register pass callout */}
            <div className="p-3.5 rounded-2xl bg-studio-950 border border-studio-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white">First time here?</div>
                <div className="text-[11px] text-studio-400">Join using a studio QR or intake code.</div>
              </div>
              <Link
                href="/onboard"
                className="px-3.5 py-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-amber-400 text-xs font-bold transition shrink-0"
              >
                Intake Pass →
              </Link>
            </div>
          </div>
        )}

        {/* Director Form */}
        {activeTab === 'admin' && (
          <div className="space-y-5">
            <form onSubmit={handleDirectorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Director Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-studio-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. director@musicstudio.edu"
                    value={directorEmail}
                    onChange={(e) => setDirectorEmail(e.target.value)}
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl pl-9 pr-3.5 py-3 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Password {isFirebaseActive ? '' : '(Optional in studio mode)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-studio-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={directorPassword}
                    onChange={(e) => setDirectorPassword(e.target.value)}
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl pl-9 pr-3.5 py-3 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !directorEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In as Director
                  </>
                )}
              </button>

              {isFirebaseActive && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    setErrorMessage(null);
                    try {
                      await signInWithGoogle();
                      router.push('/');
                    } catch (err: any) {
                      setErrorMessage(err?.message || 'Google sign-in failed');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-studio-950 hover:bg-studio-800 border border-studio-700 text-white text-xs font-semibold transition"
                >
                  Sign In with Google
                </button>
              )}
            </form>

            {availableDirectors.length > 0 && (
              <div className="pt-4 border-t border-studio-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-2">
                  Registered Band Directors
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {availableDirectors.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleQuickDirectorSelect(d.email)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-studio-950 hover:bg-studio-800 border border-studio-800 transition text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate block">
                            {d.name}
                          </span>
                          <span className="text-[10px] text-studio-400 truncate block">
                            {d.studioName || d.email}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-studio-500 group-hover:text-amber-400 transition shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
