'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore } from '@/lib/data-store';
import {
  InstrumentType,
  SkillLevel,
  AgeGroup,
  Band,
  RecurringTimeWindow,
  HobbyInterest,
  MusicalGoal,
  CommitmentLevel,
  SocialStyle,
  BandEnvironmentPreference,
} from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { AvailabilityPicker } from '@/components/availability/AvailabilityPicker';
import {
  QrCode,
  Music,
  CheckCircle2,
  Sparkles,
  Calendar,
  Lock,
  Heart,
  Target,
  Smile,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';

function OnboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { switchUser } = useAuth();

  const codeParam = searchParams.get('code') || 'STUDIO-PASS';
  const bandIdParam = searchParams.get('bandId') || '';

  // 1. Basic Identity
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // 2. Instruments & Skills
  const [primaryInstrument, setPrimaryInstrument] = useState<InstrumentType>('guitars');
  const [secondaryInstruments, setSecondaryInstruments] = useState<InstrumentType[]>([]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('teens');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['Rock', 'Jazz']);
  const [bio, setBio] = useState('');

  // 3. Structured Availability
  const [availability, setAvailability] = useState<RecurringTimeWindow[]>([
    {
      id: 'default-tue',
      dayOfWeek: 'tuesday',
      startTime: '16:30',
      endTime: '18:30',
    },
    {
      id: 'default-thu',
      dayOfWeek: 'thursday',
      startTime: '16:30',
      endTime: '18:30',
    },
  ]);

  // 4. Lightweight Band Match Profile (1–2 minutes)
  const [selectedHobbies, setSelectedHobbies] = useState<HobbyInterest[]>([
    'video_games',
    'sports',
  ]);
  const [selectedGoals, setSelectedGoals] = useState<MusicalGoal[]>([
    'perform_live',
    'improve_skills',
  ]);
  const [commitmentLevel, setCommitmentLevel] =
    useState<CommitmentLevel>('fun_and_improve');
  const [socialStyle, setSocialStyle] = useState<SocialStyle>('middle');
  const [preferredEnvironment, setPreferredEnvironment] =
    useState<BandEnvironmentPreference>('high_energy');
  const [currentObsession, setCurrentObsession] = useState('');

  const [targetBand, setTargetBand] = useState<Band | null>(null);
  const [invite, setInvite] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStudentName, setCreatedStudentName] = useState('');

  useEffect(() => {
    const inv = DataStore.getInviteByCode(codeParam);
    if (inv) {
      setInvite(inv);
      if (!bandIdParam && inv.bandId) {
        const b = DataStore.getBand(inv.bandId);
        if (b) setTargetBand(b);
      }
    }
  }, [codeParam, bandIdParam]);

  useEffect(() => {
    if (bandIdParam) {
      const b = DataStore.getBand(bandIdParam);
      if (b) setTargetBand(b);
    }
  }, [bandIdParam]);

  const effectiveDirectorId =
    invite?.directorId ||
    (targetBand ? targetBand.directorId || targetBand.createdBy : undefined);
  const effectiveDirectorName = invite?.directorName || 'Director';
  const effectiveStudioName = invite?.studioName || 'Music Studio';
  const brandColor = invite?.accentColor || '#F59E0B';
  const studioLogo = invite?.logoUrl;
  const studioTagline = invite?.tagline || 'Ensemble Performance & Musician Training';

  const [isExpressMode, setIsExpressMode] = useState(true);
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleFastFill = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      const director = DataStore.getDirector();
      // If we have current user info or fallback
      if (director && director.name && !name) {
        setName(director.name);
      }
      if (director && director.email && !email) {
        setEmail(director.email);
      }
    } catch (err) {
      console.log('Google Sign-In prompt completed', err);
    } finally {
      setGoogleLoading(false);
    }
  };

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

  const HOBBY_OPTIONS: { id: HobbyInterest; label: string }[] = [
    { id: 'sports', label: 'Sports' },
    { id: 'video_games', label: 'Video Games' },
    { id: 'anime_manga', label: 'Anime / Manga' },
    { id: 'movies_tv', label: 'Movies & TV' },
    { id: 'art_design', label: 'Art & Design' },
    { id: 'technology_computers', label: 'Tech & Coding' },
    { id: 'outdoors', label: 'Outdoors' },
    { id: 'skateboarding', label: 'Skate / Action Sports' },
    { id: 'reading', label: 'Reading' },
    { id: 'theater_acting', label: 'Theater & Acting' },
    { id: 'content_creation', label: 'Content Creation' },
    { id: 'other', label: 'Other' },
  ];

  const GOAL_OPTIONS: { id: MusicalGoal; label: string }[] = [
    { id: 'learn_favorite_songs', label: 'Learning songs I already like' },
    { id: 'discover_new_music', label: 'Discovering new music' },
    { id: 'perform_live', label: 'Performing live' },
    { id: 'write_originals', label: 'Writing original music' },
    { id: 'jam_improvise', label: 'Improvising & jamming' },
    { id: 'record_music', label: 'Recording' },
    { id: 'make_videos', label: 'Making videos / content' },
    { id: 'improve_skills', label: 'Challenging myself & improving' },
    { id: 'mostly_fun', label: 'Mostly having fun with other musicians' },
  ];

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleSecondary = (inst: InstrumentType) => {
    if (inst === primaryInstrument) return;
    setSecondaryInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const toggleHobby = (hobby: HobbyInterest) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const toggleGoal = (goal: MusicalGoal) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
      name
    )}`;

    const newStudent = DataStore.createStudent({
      name: name.trim(),
      directorId: effectiveDirectorId,
      email:
        email.trim() ||
        `${name.toLowerCase().replace(/\s+/g, '.')}@student.musicstudio.edu`,
      pronouns: pronouns.trim() || undefined,
      avatar: fallbackAvatar,
      instruments: Array.from(
        new Set([primaryInstrument, ...secondaryInstruments])
      ),
      primaryInstrument,
      skillLevel,
      ageGroup,
      musicalStyles: selectedStyles,
      bio:
        bio.trim() ||
        `Excited to play ${primaryInstrument} and collaborate with bands!`,
      bandIdToJoin: targetBand?.id,
      availability,
      bandMatchProfile: {
        hobbies: selectedHobbies,
        musicalGoals: selectedGoals,
        commitmentLevel,
        socialStyle,
        preferredEnvironment,
        currentObsession: currentObsession.trim() || undefined,
      },
      // Restricted personal fields stored in private document:
      dateOfBirth: dateOfBirth || undefined,
      guardianEmail: guardianEmail.trim() || undefined,
      guardianPhone: guardianPhone.trim() || undefined,
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
        <div
          className="w-20 h-20 rounded-full border-2 text-emerald-400 flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${brandColor}20`, borderColor: brandColor, color: brandColor }}
        >
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span
          className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full border"
          style={{
            backgroundColor: `${brandColor}15`,
            borderColor: `${brandColor}40`,
            color: brandColor,
          }}
        >
          Enrollment Complete
        </span>

        <h2 className="text-3xl font-black text-white mt-4 tracking-tight">
          Welcome to {effectiveStudioName}, {createdStudentName}!
        </h2>

        <p className="text-studio-300 text-sm mt-3 max-w-md mx-auto leading-relaxed">
          {targetBand ? (
            <>
              You have been enrolled directly into <strong>{targetBand.name}</strong> as a{' '}
              <strong className="capitalize">{primaryInstrument}</strong> player!
            </>
          ) : (
            <>
              Your profile, availability, and musical match preferences have been indexed. Director {effectiveDirectorName} at {effectiveStudioName} will review your instruments and schedule to form compatible ensembles.
            </>
          )}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {targetBand ? (
            <button
              onClick={() => router.push(`/bands/${targetBand.id}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg"
              style={{
                backgroundColor: brandColor,
                color: brandColor === '#E11D48' || brandColor === '#2563EB' ? '#FFFFFF' : '#020617',
              }}
            >
              <Music className="w-4 h-4" />
              Go to {targetBand.name} Hub
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg"
              style={{
                backgroundColor: brandColor,
                color: brandColor === '#E11D48' || brandColor === '#2563EB' ? '#FFFFFF' : '#020617',
              }}
            >
              Enter Student Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4">
      {/* Onboarding Header */}
      <div className="text-center mb-8">
        {/* Studio Logo (if provided) */}
        {studioLogo && (
          <div className="mb-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={studioLogo}
              alt={effectiveStudioName}
              className="h-16 w-auto object-contain rounded-xl shadow-lg border border-studio-800 p-1 bg-studio-950"
            />
          </div>
        )}

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-3 shadow-sm"
          style={{
            backgroundColor: `${brandColor}15`,
            borderColor: `${brandColor}40`,
            color: brandColor,
          }}
        >
          <QrCode className="w-4 h-4" />
          {effectiveStudioName} Pass: <span className="font-mono">{codeParam}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Welcome to {effectiveStudioName}
        </h1>
        <p className="text-sm text-studio-400 max-w-lg mx-auto mt-2">
          {studioTagline}. Directed by {effectiveDirectorName}. Join ensembles, access charts, and coordinate rehearsals.
        </p>

        {targetBand && (
          <div
            className="mt-4 p-3.5 border rounded-2xl inline-flex items-center gap-3 text-left max-w-md"
            style={{
              backgroundColor: `${brandColor}10`,
              borderColor: `${brandColor}30`,
            }}
          >
            <Music className="w-6 h-6 shrink-0" style={{ color: brandColor }} />
            <div>
              <div
                className="text-xs font-bold uppercase tracking-wider font-mono"
                style={{ color: brandColor }}
              >
                Direct Band Pass Active
              </div>
              <div className="text-sm font-bold text-white">
                Joining: {targetBand.name} ({targetBand.genre})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AutoFill & Express Mode Control Bar */}
      <div className="mb-6 p-4 bg-studio-900 border border-studio-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Google / Apple AutoFill helper */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow shrink-0">
            {/* Google / Autofill Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              Apple & Google AutoFill Supported
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                W3C READY
              </span>
            </div>
            <div className="text-[11px] text-studio-400">
              Tap fields on iOS/Android to autofill Name, Email & Phone
            </div>
          </div>
        </div>

        {/* Express vs Full Mode Selector */}
        <div className="flex items-center gap-1 bg-studio-950 p-1 rounded-2xl border border-studio-800 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setIsExpressMode(true)}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
              isExpressMode
                ? 'bg-studio-800 text-white shadow-sm'
                : 'text-studio-400 hover:text-white'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            10-Second Intake
          </button>
          <button
            type="button"
            onClick={() => setIsExpressMode(false)}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
              !isExpressMode
                ? 'bg-studio-800 text-white shadow-sm'
                : 'text-studio-400 hover:text-white'
            )}
          >
            Full Profile
          </button>
        </div>
      </div>

      {/* Intake Form */}
      <form
        id="student-onboard-form"
        name="student_onboard"
        method="post"
        action="#"
        autoComplete="on"
        onSubmit={handleSubmit}
        className="bg-studio-900 border border-studio-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8"
      >
        {/* Section 1: Basic Identity & Guardian Contact */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-studio-800 pb-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
              >
                1
              </span>
              Musician Identity & Personal Information
            </h2>
            <span className="text-[11px] text-studio-400">
              {isExpressMode ? 'Fast Mode: Only name is required' : 'Standard Intake'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="student-full-name"
                className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5"
              >
                Full Name *
              </label>
              <input
                id="student-full-name"
                name="name"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck={false}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Julian Hayes"
                required
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label
                htmlFor="student-email"
                className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5"
              >
                Student / Primary Email
              </label>
              <input
                id="student-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="julian@student.musicstudio.edu"
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {!isExpressMode && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="student-bday"
                    className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center justify-between"
                  >
                    <span>Date of Birth</span>
                    <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Restricted PII
                    </span>
                  </label>
                  <input
                    id="student-bday"
                    name="bday"
                    type="date"
                    autoComplete="bday"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                  <p className="text-[11px] text-studio-400 mt-1 leading-tight">
                    DOB is kept in restricted private records. Only your calculated age is shown to the Director for band formation.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="student-pronouns"
                    className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center justify-between"
                  >
                    <span>Preferred Pronouns</span>
                    <span className="text-[10px] text-studio-400 font-normal lowercase">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="student-pronouns"
                    name="pronouns"
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g. he/him, she/her, they/them"
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label
                    htmlFor="guardian-email"
                    className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5"
                  >
                    Parent / Guardian Email (if student is minor)
                  </label>
                  <input
                    id="guardian-email"
                    name="guardian_email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="guardian-phone"
                    className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5"
                  >
                    Parent / Emergency Contact Phone
                  </label>
                  <input
                    id="guardian-phone"
                    name="guardian_tel"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section 2: Instruments & Skills */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-studio-800 pb-2">
            <span
              className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
            >
              2
            </span>
            Instrumentation & Experience
          </h2>

          <div>
            <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Primary Instrument *</span>
              <span className="capitalize font-semibold" style={{ color: brandColor }}>
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
                  style={
                    primaryInstrument === inst
                      ? { borderColor: brandColor, backgroundColor: `${brandColor}25` }
                      : {}
                  }
                >
                  <InstrumentIcon instrument={inst} size="lg" />
                  <span className="text-xs font-bold mt-2 capitalize">{inst}</span>
                </button>
              ))}
            </div>
          </div>

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
                Age Bracket (General)
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
        </div>

        {/* Express Mode Banner when folded */}
        {isExpressMode && (
          <div className="p-4 rounded-2xl bg-studio-950/80 border border-studio-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-studio-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>10-Second Express Active:</strong> Schedule & match questions auto-configured. You can customize them anytime later.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpressMode(false)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline shrink-0 transition"
            >
              Expand Full Profile &rarr;
            </button>
          </div>
        )}

        {/* Full Profile Sections 3, 4, 5 */}
        {!isExpressMode && (
          <>
            {/* Section 3: Structured Rehearsal Availability */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-studio-800 pb-2">
                <span
                  className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
                >
                  3
                </span>
                Weekly Rehearsal Availability
              </h2>
              <p className="text-xs text-studio-400">
                Select recurring days and times when you can attend weekly rehearsals. The Band Formation Assistant uses this to automatically calculate band schedule overlap.
              </p>
              <AvailabilityPicker
                value={availability}
                onChange={(wins) => setAvailability(wins)}
              />
            </div>

            {/* Section 4: Lightweight Band Match Profile (1–2 minutes) */}
            <div className="space-y-5">
              <div className="border-b border-studio-800 pb-2 flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
                  >
                    4
                  </span>
                  Band Match Profile
                </h2>
                <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  1–2 minute casual match
                </span>
              </div>

              {/* Hobbies / Interests */}
              <div>
                <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Interests & Hobbies outside music (Check all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {HOBBY_OPTIONS.map((hobby) => {
                    const isSelected = selectedHobbies.includes(hobby.id);
                    return (
                      <button
                        type="button"
                        key={hobby.id}
                        onClick={() => toggleHobby(hobby.id)}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl border text-xs font-semibold transition',
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                            : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                        )}
                      >
                        {hobby.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Musical Goals / What sounds fun */}
              <div>
                <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  Musical Goals & What Sounds Fun
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <button
                        type="button"
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={clsx(
                          'flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition',
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/40 text-white font-semibold'
                            : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                            isSelected
                              ? 'bg-amber-500 border-amber-400 text-slate-950'
                              : 'border-studio-700'
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{goal.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commitment Level */}
              <div>
                <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
                  Band Commitment & Ambition
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'mostly_fun', label: 'Mostly here to have fun' },
                    { id: 'fun_and_improve', label: 'Fun, but I want to improve' },
                    {
                      id: 'serious_improve',
                      label: 'Pretty serious about improving',
                    },
                    {
                      id: 'very_ambitious',
                      label: 'Very ambitious / competitive',
                    },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setCommitmentLevel(opt.id as CommitmentLevel)}
                      className={clsx(
                        'p-2.5 rounded-xl border text-xs text-left transition',
                        commitmentLevel === opt.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                          : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Style & Preferred Environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
                    Social Style
                  </label>
                  <select
                    value={socialStyle}
                    onChange={(e) => setSocialStyle(e.target.value as SocialStyle)}
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="reserved_at_first">
                      Usually quiet / reserved at first
                    </option>
                    <option value="middle">Somewhere in the middle</option>
                    <option value="outgoing_talkative">
                      Usually outgoing / talkative
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
                    Preferred Band Environment
                  </label>
                  <select
                    value={preferredEnvironment}
                    onChange={(e) =>
                      setPreferredEnvironment(
                        e.target.value as BandEnvironmentPreference
                      )
                    }
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="relaxed">Relaxed</option>
                    <option value="structured">Structured</option>
                    <option value="high_energy">High-energy</option>
                    <option value="any">Comfortable with any</option>
                  </select>
                </div>
              </div>

              {/* Optional Current Obsession */}
              <div>
                <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Anything you&apos;re really into right now?</span>
                  <span className="text-[10px] text-studio-400 font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={currentObsession}
                  onChange={(e) => setCurrentObsession(e.target.value)}
                  placeholder="e.g. 90s grunge, video game soundtracks, learning slap bass..."
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Section 5: Musical Styles & Bio */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-studio-800 pb-2">
                <span
                  className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ backgroundColor: `${brandColor}25`, color: brandColor }}
                >
                  5
                </span>
                Styles & Bio
              </h2>

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

              <div>
                <label className="block text-xs font-bold text-studio-300 uppercase tracking-wider mb-2">
                  Short Musician Bio / Musical Background
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the Director what you enjoy playing most..."
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Submit */}
        <div className="pt-4 border-t border-studio-800">
          <button
            type="submit"
            style={{ backgroundColor: brandColor }}
            className="w-full py-4 rounded-2xl text-slate-950 font-black text-sm tracking-wide uppercase transition hover:brightness-110 shadow-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isExpressMode ? 'Complete Instant Enrollment' : 'Complete Full Registration'}
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
