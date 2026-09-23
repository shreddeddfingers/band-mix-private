'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data-store';
import { InstrumentType, SkillLevel, AgeGroup, Band } from '@/types';
import { InstrumentIcon, INSTRUMENT_METADATA } from '@/components/InstrumentIcon';
import {
  QrCode,
  Music,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';

function OnboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { switchUser } = useAuth();

  const codeParam = searchParams.get('code') || 'STUDIO-PASS';
  const bandIdParam = searchParams.get('bandId') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryInstrument, setPrimaryInstrument] = useState<InstrumentType>('guitars');
  const [secondaryInstruments, setSecondaryInstruments] = useState<InstrumentType[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('teens');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['Rock', 'Jazz']);
  const [bio, setBio] = useState('');
  const [targetBand, setTargetBand] = useState<Band | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStudentName, setCreatedStudentName] = useState('');

  useEffect(() => {
    if (bandIdParam) {
      const b = DataStore.getBand(bandIdParam);
      if (b) setTargetBand(b);
    }
  }, [bandIdParam]);

  const allInstruments: InstrumentType[] = [
    'drums',
    'bass',
    'vocals',
    'piano',
    'keyboard',
    'guitars',
    'horns',
  ];

  const availableStyles = [
    'Rock',
    'Jazz',
    'Funk',
    'Pop',
    'Soul',
    'Blues',
    'Metal',
    'Classical',
    'Indie',
    'R&B',
  ];

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const toggleSecondary = (inst: InstrumentType) => {
    if (inst === primaryInstrument) return;
    if (secondaryInstruments.includes(inst)) {
      setSecondaryInstruments(secondaryInstruments.filter((i) => i !== inst));
    } else {
      setSecondaryInstruments([...secondaryInstruments, inst]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate random avatar seed
    const avatar = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 90000000)}?auto=format&fit=crop&q=80&w=250`;
    const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    const newStudent = DataStore.createStudent({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@student.musicstudio.edu`,
      avatar: fallbackAvatar,
      instruments: Array.from(new Set([primaryInstrument, ...secondaryInstruments])),
      primaryInstrument,
      skillLevel,
      ageGroup,
      musicalStyles: selectedStyles,
      bio: bio.trim() || `Excited to play ${primaryInstrument} and collaborate with bands!`,
      bandIdToJoin: targetBand?.id,
    });

    DataStore.incrementInviteUse(codeParam);

    setCreatedStudentName(newStudent.name);
    setIsSuccess(true);

    // Switch perspective to the newly created student
    switchUser(newStudent.id);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Onboarding Complete
        </span>

        <h2 className="text-3xl font-black text-white mt-4 tracking-tight">
          Welcome to the Studio, {createdStudentName}!
        </h2>

        <p className="text-studio-300 text-sm mt-3 max-w-md mx-auto leading-relaxed">
          {targetBand ? (
            <>
              You have been enrolled directly into <strong>{targetBand.name}</strong> as a{' '}
              <strong className="capitalize">{primaryInstrument}</strong> player! Director Marcus Vance has been notified.
            </>
          ) : (
            <>
              Your profile has been indexed into the studio roster with tag attributes. Director Marcus Vance will review your instruments and assign you to an ensemble.
            </>
          )}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {targetBand ? (
            <button
              onClick={() => router.push(`/bands/${targetBand.id}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Music className="w-4 h-4" />
              Go to {targetBand.name} Chat Hub
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              Enter Student Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4">
      {/* Onboarding Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold mb-3">
          <QrCode className="w-4 h-4 text-amber-400" />
          Scanned Invite Pass: <span className="font-mono">{codeParam}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Student Musician Onboarding
        </h1>
        <p className="text-sm text-studio-400 max-w-md mx-auto mt-2">
          Set up your instruments and musical style. You will be matched with bands and rehearsal channels.
        </p>

        {targetBand && (
          <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl inline-flex items-center gap-3 text-left max-w-md">
            <Music className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                Direct Band Pass Active
              </div>
              <div className="text-sm font-bold text-white">
                Joining: {targetBand.name} ({targetBand.genre})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Intake Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-studio-900 border border-studio-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        {/* Student Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Julian Hayes"
              required
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
              Student / Parent Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="julian@student.musicstudio.edu"
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Primary Instrument Picker */}
        <div>
          <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Primary Instrument *</span>
            <span className="text-amber-400 capitalize">
              Selected: {primaryInstrument}
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {allInstruments.map((inst) => (
              <button
                type="button"
                key={inst}
                onClick={() => setPrimaryInstrument(inst)}
                className={clsx(
                  'flex flex-col items-center justify-center p-3 rounded-2xl border transition text-center',
                  primaryInstrument === inst
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-studio-950 border-studio-800 text-studio-400 hover:border-studio-700 hover:text-white'
                )}
              >
                <InstrumentIcon instrument={inst} size="lg" />
                <span className="text-xs font-bold mt-2 capitalize">{inst}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Instruments */}
        <div>
          <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
            Secondary / Additional Instruments (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {allInstruments
              .filter((i) => i !== primaryInstrument)
              .map((inst) => {
                const isSelected = secondaryInstruments.includes(inst);
                return (
                  <button
                    type="button"
                    key={inst}
                    onClick={() => toggleSecondary(inst)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize transition',
                      isSelected
                        ? 'bg-studio-800 border-amber-500/60 text-amber-300'
                        : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                    )}
                  >
                    <InstrumentIcon instrument={inst} size="xs" />
                    {inst}
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Skill Level & Age Bracket */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
              Skill Level
            </label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="beginner">Beginner (0–1 years)</option>
              <option value="intermediate">Intermediate (1–3 years)</option>
              <option value="advanced">Advanced (3–6 years)</option>
              <option value="expert">Expert (6+ years / Semi-pro)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
              Age Group
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="kids">Youth (Under 13)</option>
              <option value="teens">Teens (13–18)</option>
              <option value="adults">Adults (18+)</option>
            </select>
          </div>
        </div>

        {/* Musical Styles */}
        <div>
          <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
            Preferred Musical Styles (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableStyles.map((style) => {
              const isSelected = selectedStyles.includes(style);
              return (
                <button
                  type="button"
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={clsx(
                    'px-3 py-1.5 rounded-xl border text-xs font-semibold transition',
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                  )}
                >
                  #{style}
                </button>
              );
            })}
          </div>
        </div>

        {/* Short Bio */}
        <div>
          <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
            Short Musician Bio / Goals
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the director and bandmates what you love playing and what you want to learn..."
            className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-studio-800">
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide uppercase transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Complete Registration & Join Studio
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-studio-400">
          Loading student onboarding...
        </div>
      }
    >
      <OnboardContent />
    </Suspense>
  );
}
