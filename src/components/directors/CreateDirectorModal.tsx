'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { InstrumentType } from '@/types';
import { InstrumentIcon, INSTRUMENT_METADATA } from '../InstrumentIcon';
import {
  X,
  Sparkles,
  Building,
  User,
  Mail,
  BookOpen,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface CreateDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (directorId: string) => void;
}

const INSTRUMENT_OPTIONS: InstrumentType[] = [
  'piano',
  'guitars',
  'drums',
  'bass',
  'vocals',
  'horns',
  'keyboard',
  'other',
];

export function CreateDirectorModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDirectorModalProps) {
  const { createDirectorAccount, signInWithEmailPassword, signInWithGoogle, isFirebaseActive } = useAuth();

  const [authMode, setAuthMode] = useState<'register' | 'signin'>('register');
  const [name, setName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [primaryInstrument, setPrimaryInstrument] = useState<InstrumentType>('piano');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerateStrongPassword = () => {
    // Generate secure 16-character alphanumeric + symbol password for Keychain
    const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%&*';
    const all = letters + numbers + symbols;

    let pass = '';
    // Ensure at least one of each category
    pass += letters.charAt(Math.floor(Math.random() * letters.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    for (let i = 3; i < 16; i++) {
      pass += all.charAt(Math.floor(Math.random() * all.length));
    }
    // Shuffle
    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(shuffled);
    setShowPassword(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      await signInWithGoogle();
      if (onSuccess) {
        onSuccess('google-director');
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;

    // Direct DOM fallback in case iOS Safari autofilled without triggering React state listeners
    const resolvedName = (
      name ||
      (formEl.elements.namedItem('name') as HTMLInputElement)?.value ||
      ''
    ).trim();

    const resolvedStudioName = (
      studioName ||
      (formEl.elements.namedItem('organization') as HTMLInputElement)?.value ||
      ''
    ).trim();

    const resolvedEmail = (
      email ||
      (formEl.elements.namedItem('username') as HTMLInputElement)?.value ||
      (formEl.elements.namedItem('email') as HTMLInputElement)?.value ||
      ''
    ).trim();

    const resolvedPassword = (
      password ||
      (formEl.elements.namedItem('password') as HTMLInputElement)?.value ||
      ''
    ).trim();

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      setError('Please provide a valid director email address.');
      return;
    }

    if (!resolvedPassword || resolvedPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (authMode === 'register') {
        if (!resolvedName) {
          setError('Please provide your director name.');
          return;
        }
        if (!resolvedStudioName) {
          setError('Please provide your studio or school name.');
          return;
        }

        const newDirector = await createDirectorAccount({
          name: resolvedName,
          studioName: resolvedStudioName,
          email: resolvedEmail,
          password: resolvedPassword,
          primaryInstrument,
          bio:
            bio.trim() ||
            `Band Director & Ensemble Coordinator at ${resolvedStudioName}.`,
        });

        if (onSuccess) {
          onSuccess(newDirector.id);
        }
      } else {
        // Sign-in mode
        const signedInDirector = await signInWithEmailPassword(
          resolvedEmail,
          resolvedPassword
        );
        if (onSuccess) {
          onSuccess(signedInDirector.id);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {authMode === 'register' ? 'Register Band Director' : 'Director Sign In'}
              </h2>
              <p className="text-xs text-slate-400">
                {authMode === 'register'
                  ? 'Create an isolated studio workspace with Apple & Google AutoFill.'
                  : 'Access your studio roster and rehearsal schedules.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="director-auth-form"
          name="director_auth"
          method="post"
          action="#"
          autoComplete="on"
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Apple & Google AutoFill Helper Banner */}
          <div className="p-3 bg-studio-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Key className="w-3.5 h-3.5" />
              </div>
              <div className="leading-snug">
                <div className="font-bold text-white flex items-center gap-1.5">
                  Apple Keychain & Google Password Ready
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-semibold">
                    AUTOFILL
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Tap AutoFill on iOS or Android to fill contact & store credentials.
                </div>
              </div>
            </div>
          </div>

          {/* 1-Tap Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl transition shadow-sm border border-slate-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Or Use Email & AutoFill
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              className={clsx(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition text-center',
                authMode === 'register'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError('');
              }}
              className={clsx(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition text-center',
                authMode === 'signin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Sign In
            </button>
          </div>

          {/* Register Mode: Name & Studio Name */}
          {authMode === 'register' && (
            <>
              <div>
                <label
                  htmlFor="director-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  Director Full Name *
                </label>
                <input
                  id="director-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onInput={(e) => setName((e.target as HTMLInputElement).value)}
                  placeholder="e.g. Sarah Jenkins"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div>
                <label
                  htmlFor="director-studio-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"
                >
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  Studio or School Name *
                </label>
                <input
                  id="director-studio-name"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  autoCapitalize="words"
                  autoCorrect="off"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  onInput={(e) => setStudioName((e.target as HTMLInputElement).value)}
                  placeholder="e.g. Highland School of Rock"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </>
          )}

          {/* Email / Username (Apple Keychain & Android Credential Identifier) */}
          <div>
            <label
              htmlFor="director-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Director Email (Username) *
            </label>
            <input
              id="director-email"
              name="username"
              type="email"
              inputMode="email"
              autoComplete="username email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              placeholder="e.g. sarah@highlandschool.edu"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Password (with new-password token for Keychain and current-password for signin) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="director-password"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                {authMode === 'register' ? 'Director Password *' : 'Password *'}
              </label>
              {authMode === 'register' && (
                <button
                  type="button"
                  onClick={handleGenerateStrongPassword}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition"
                  title="Generate a secure password for Keychain"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Suggest Strong Password
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="director-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {authMode === 'register' && (
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>iPhone Passwords app & Google Password Manager will remember this for you.</span>
              </p>
            )}
          </div>

          {/* Register Mode Only: Teaching Instrument & Bio */}
          {authMode === 'register' && (
            <>
              {/* Primary Instrument */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Primary Teaching Instrument
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {INSTRUMENT_OPTIONS.map((inst) => {
                    const meta = INSTRUMENT_METADATA[inst];
                    const isSelected = primaryInstrument === inst;
                    return (
                      <button
                        key={inst}
                        type="button"
                        onClick={() => setPrimaryInstrument(inst)}
                        className={clsx(
                          'flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition text-center',
                          isSelected
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        )}
                      >
                        <InstrumentIcon
                          instrument={inst}
                          className={clsx(
                            'w-3.5 h-3.5',
                            isSelected ? 'text-purple-400' : 'text-slate-400'
                          )}
                        />
                        <span className="truncate w-full text-[11px]">
                          {meta?.label || inst}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bio / Teaching Philosophy */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Bio & Focus (Optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="e.g. 10+ years directing modern rock ensembles, chart arrangements, and student showcases."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                />
              </div>

              {/* Explanatory Callout */}
              <div className="p-3 bg-purple-950/30 border border-purple-800/30 rounded-xl text-xs text-purple-200/90 leading-relaxed">
                <span className="font-semibold text-purple-300">
                  Isolated Studio Workspace:
                </span>{' '}
                Students who onboard via your studio QR pass, as well as bands and rehearsals you create, will be strictly linked to your director account only.
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Key className="w-4 h-4 text-purple-200" />
              {isSubmitting
                ? 'Processing...'
                : authMode === 'register'
                ? 'Create & Save to Keychain'
                : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
