'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data-store';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import {
  X,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Music,
  Loader2,
  Lock,
  Mail,
  User,
  Sparkles,
  Radio,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'student' | 'admin';
}

export function LoginModal({
  isOpen,
  onClose,
  defaultRole = 'student',
}: LoginModalProps) {
  const router = useRouter();
  const {
    loginStudent,
    loginDirector,
    signInWithGoogle,
    isFirebaseActive,
    activeBranding,
    directors,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>(defaultRole);
  const [studentQuery, setStudentQuery] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorPassword, setDirectorPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Local student candidates for 1-tap quick select
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
      onClose();

      // Find band
      const bands = DataStore.getBands();
      const myBand = bands.find((b) =>
        b.members.some((m) => m.userId === student.id)
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
      onClose();
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
      onClose();
      const bands = DataStore.getBands();
      const myBand = bands.find((b) =>
        b.members.some((m) => m.userId === student.id)
      );
      if (myBand) {
        router.push(`/bands/${myBand.id}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to switch student.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDirectorSelect = async (dirEmail: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginDirector(dirEmail);
      onClose();
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-studio-900 border border-studio-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-studio-800 bg-studio-950/70">
          <div className="flex items-center gap-3">
            {activeBranding?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activeBranding.logoUrl}
                alt={brandName}
                className="w-9 h-9 rounded-xl object-cover border border-studio-700 bg-studio-900 shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-lg shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                <Radio className="w-4 h-4 stroke-[2.5]" />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Sign In to {brandName}
              </h2>
              <p className="text-[11px] text-studio-400">
                Access your ensemble hub, schedule, and studio resources
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

        {/* Role Tabs */}
        <div className="p-4 sm:p-5 pb-0">
          <div className="flex rounded-xl bg-studio-950 p-1 border border-studio-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMessage(null);
              }}
              className={clsx(
                'flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2',
                activeTab === 'student'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
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
                'flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2',
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-studio-400 hover:text-white'
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              Band Director
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Student Tab Form */}
          {activeTab === 'student' && (
            <div className="space-y-4">
              <form onSubmit={handleStudentSubmit} className="space-y-3">
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
                      className="w-full bg-studio-950 border border-studio-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <p className="text-[11px] text-studio-400 mt-1">
                    Enter the email address or name you used during intake.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !studentQuery.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
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

              {/* Quick Select from Registered Students */}
              {availableStudents.length > 0 && (
                <div className="pt-3 border-t border-studio-800/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-2 flex items-center justify-between">
                    <span>Registered Studio Students</span>
                    <span className="text-[10px] text-studio-500 font-mono">
                      1-Tap Login
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {availableStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickStudentSelect(s.id)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-studio-950 hover:bg-studio-800/80 border border-studio-800 transition text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-studio-800 border border-studio-700 shrink-0">
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
                        <ArrowRight className="w-3.5 h-3.5 text-studio-500 group-hover:text-amber-400 transition shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Intake Pass Callout */}
              <div className="p-3 rounded-xl bg-studio-950 border border-studio-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">Don&apos;t have a profile yet?</div>
                  <div className="text-[11px] text-studio-400">Join your studio using an intake code.</div>
                </div>
                <Link
                  href="/onboard"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 text-amber-400 text-xs font-bold transition shrink-0 whitespace-nowrap"
                >
                  Intake Pass →
                </Link>
              </div>
            </div>
          )}

          {/* Director Tab Form */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <form onSubmit={handleDirectorSubmit} className="space-y-3">
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
                      className="w-full bg-studio-950 border border-studio-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
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
                      className="w-full bg-studio-950 border border-studio-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !directorEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
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
                        onClose();
                        router.push('/');
                      } catch (err: any) {
                        setErrorMessage(err?.message || 'Google sign-in failed');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-studio-950 hover:bg-studio-800 border border-studio-700 text-white text-xs font-semibold transition"
                  >
                    Sign In with Google
                  </button>
                )}
              </form>

              {/* Quick Select Director Profile */}
              {availableDirectors.length > 0 && (
                <div className="pt-3 border-t border-studio-800/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-2">
                    Registered Band Directors
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {availableDirectors.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleQuickDirectorSelect(d.email)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-studio-950 hover:bg-studio-800 border border-studio-800 transition text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
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
                        <ArrowRight className="w-3.5 h-3.5 text-studio-500 group-hover:text-amber-400 transition shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
