'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserProfile,
  Band,
  HobbyInterest,
  MusicalGoal,
  CommitmentLevel,
  SocialStyle,
  BandEnvironmentPreference,
} from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import { DataStore } from '@/lib/data-store';
import { calculateExactAge, ageToAgeGroup } from '@/lib/age-utils';
import {
  X,
  Calendar,
  Clock,
  Music,
  Users,
  Heart,
  Sparkles,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Trash2,
  UserPlus,
  Edit2,
  Check,
  ShieldCheck,
  Compass,
  Camera,
} from 'lucide-react';
import { ChangeAvatarModal } from '@/components/profile/ChangeAvatarModal';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserProfile | null;
  bands: Band[];
  onAssignBand?: (student: UserProfile) => void;
  onDeleteStudent?: (student: UserProfile) => void;
  onStudentUpdated?: (updated: UserProfile) => void;
}

const HOBBY_LABELS: Record<HobbyInterest, string> = {
  sports: 'Sports & Athletics',
  video_games: 'Video Games & Gaming',
  anime_manga: 'Anime & Manga',
  movies_tv: 'Movies & TV',
  art_design: 'Art & Design',
  technology_computers: 'Tech & Coding',
  outdoors: 'Outdoors & Hiking',
  skateboarding: 'Skate & Action Sports',
  reading: 'Reading & Literature',
  theater_acting: 'Theater & Acting',
  content_creation: 'Content Creation (YouTube/TikTok)',
  other: 'Other Interests',
};

const GOAL_LABELS: Record<MusicalGoal, string> = {
  learn_favorite_songs: 'Learning songs I already like',
  discover_new_music: 'Discovering new music',
  perform_live: 'Performing live on stage',
  write_originals: 'Writing original music',
  jam_improvise: 'Improvising & jamming',
  record_music: 'Studio recording',
  make_videos: 'Making music videos & content',
  improve_skills: 'Challenging myself & improving technique',
  mostly_fun: 'Mostly having fun with bandmates',
};

const COMMITMENT_INFO: Record<
  CommitmentLevel,
  { label: string; desc: string; color: string }
> = {
  mostly_fun: {
    label: 'Casual & Fun',
    desc: 'Low pressure, jam with friends and learn at a relaxed pace.',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  fun_and_improve: {
    label: 'Fun & Growth',
    desc: 'Wants to improve skills while keeping rehearsals enjoyable.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  serious_improve: {
    label: 'Dedicated & Serious',
    desc: 'Focused on steady rehearsal discipline, tight arrangements, and high skill growth.',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  very_ambitious: {
    label: 'Very Ambitious',
    desc: 'Preparing for live performance tours, studio recording, or music career paths.',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
};

const SOCIAL_STYLE_INFO: Record<SocialStyle, { label: string; desc: string }> = {
  reserved_at_first: {
    label: 'Reserved at First / Focused',
    desc: 'Observant, focused on their instrument, warms up as they jam.',
  },
  middle: {
    label: 'Balanced & Easygoing',
    desc: 'Collaborative, gets along with everyone, great ensemble glue.',
  },
  outgoing_talkative: {
    label: 'Outgoing & Energetic',
    desc: 'Hyped, expressive, natural stage presence and conversation starter.',
  },
};

const ENVIRONMENT_INFO: Record<
  BandEnvironmentPreference,
  { label: string; desc: string }
> = {
  relaxed: {
    label: 'Low-Stress & Relaxed',
    desc: 'Comfortable, relaxed environment with plenty of room to experiment.',
  },
  structured: {
    label: 'Balanced & Structured',
    desc: 'Equal parts focused song practice, feedback, and social interaction.',
  },
  high_energy: {
    label: 'High-Energy & Dynamic',
    desc: 'Loud, fast-paced, rocking out with high tempo and enthusiasm.',
  },
  any: {
    label: 'Flexible / Open to Any',
    desc: 'Adaptable to whatever ensemble environment the director creates.',
  },
};

export function StudentProfileModal({
  isOpen,
  onClose,
  student,
  bands,
  onAssignBand,
  onDeleteStudent,
  onStudentUpdated,
}: StudentProfileModalProps) {
  const [isEditingAge, setIsEditingAge] = useState(false);
  const [newAgeInput, setNewAgeInput] = useState('');
  const [isChangeAvatarOpen, setIsChangeAvatarOpen] = useState(false);

  if (!isOpen || !student) return null;

  // Resolve private profile if exactAge was not stored directly on public user
  const privateProfile = DataStore.getPrivateProfile(student.id);
  const calculatedAge =
    student.exactAge ??
    (privateProfile?.dateOfBirth
      ? calculateExactAge(privateProfile.dateOfBirth)
      : undefined);

  // Student's enrolled bands
  const enrolledBands = bands.filter((b) =>
    b.members.some((m) => m.userId === student.id)
  );

  const matchProfile = student.bandMatchProfile;

  const handleSaveExactAge = () => {
    const ageNum = parseInt(newAgeInput, 10);
    if (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) {
      const updated = DataStore.updateStudent(student.id, {
        exactAge: ageNum,
        ageGroup: ageToAgeGroup(ageNum),
      });
      if (updated && onStudentUpdated) {
        onStudentUpdated(updated);
      }
    }
    setIsEditingAge(false);
    setNewAgeInput('');
  };

  const handleSaveAvatar = (newAvatarUrl: string) => {
    DataStore.updateUserAvatar(student.id, newAvatarUrl);
    if (onStudentUpdated) {
      onStudentUpdated({
        ...student,
        avatar: newAvatarUrl,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-studio-900 border border-studio-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Sticky Header */}
        <div className="px-5 py-4 border-b border-studio-800 bg-studio-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
              Musician Questionnaire & Studio Profile
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-studio-900 hover:bg-studio-800 text-studio-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Section 1: Hero Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-studio-950/60 p-4 rounded-2xl border border-studio-800/80">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-studio-800 border-2 border-studio-700 shrink-0 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setIsChangeAvatarOpen(true)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity"
                  title="Change profile picture"
                >
                  <Camera className="w-4 h-4 text-amber-400 mb-0.5" />
                  Change
                </button>
              </div>

              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {student.name}
                  </h2>
                  {student.pronouns && <Badge pronouns={student.pronouns} />}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-studio-900 border border-studio-700 text-xs text-white capitalize font-semibold">
                    <InstrumentIcon
                      instrument={student.primaryInstrument}
                      size="xs"
                      showLabel
                    />
                  </div>
                  <Badge skill={student.skillLevel} />
                  <Badge role="student" />
                </div>

                <p className="text-xs text-studio-400 font-mono truncate">
                  {student.email}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-stretch sm:self-center">
              <button
                type="button"
                onClick={() => setIsChangeAvatarOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-800 text-studio-300 hover:text-white border border-studio-700 text-xs font-semibold transition"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Change Photo</span>
              </button>
            </div>
          </div>

          {/* Section 2: Key Age & Core Demographic Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Exact Age Card */}
            <div className="p-3.5 rounded-2xl bg-studio-950 border border-studio-800/90 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 flex items-center justify-between">
                <span>Exact Age</span>
                {!isEditingAge && (
                  <button
                    onClick={() => {
                      setNewAgeInput(calculatedAge ? String(calculatedAge) : '');
                      setIsEditingAge(true);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                    title="Edit or set actual age"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingAge ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="number"
                    min="4"
                    max="100"
                    value={newAgeInput}
                    onChange={(e) => setNewAgeInput(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-20 bg-studio-900 border border-studio-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSaveExactAge}
                    className="p-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingAge(false)}
                    className="p-1 rounded-lg bg-studio-800 text-studio-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  {calculatedAge ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-400">
                        {calculatedAge}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        years old
                      </span>
                      <span className="text-[10px] text-studio-500 capitalize">
                        ({student.ageGroup})
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-300 font-medium">
                      Bracket: {student.ageGroup === 'kids' ? 'Youth (<13)' : student.ageGroup === 'teens' ? 'Teens (13–18)' : 'Adults (18+)'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary Instruments */}
            <div className="p-3.5 rounded-2xl bg-studio-950 border border-studio-800/90 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400">
                All Instruments
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {student.instruments.map((inst) => (
                  <span
                    key={inst}
                    className="px-2 py-0.5 rounded-md bg-studio-900 border border-studio-700/80 text-[11px] text-studio-300 capitalize flex items-center gap-1"
                  >
                    <InstrumentIcon instrument={inst} size="xs" />
                    {inst}
                  </span>
                ))}
              </div>
            </div>

            {/* Enrolled Ensemble Status */}
            <div className="p-3.5 rounded-2xl bg-studio-950 border border-studio-800/90 flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 flex items-center justify-between">
                <span>Ensembles</span>
                <span className="text-[10px] font-mono text-studio-500">
                  {enrolledBands.length}
                </span>
              </div>
              <div className="mt-2">
                {enrolledBands.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {enrolledBands.map((b) => (
                      <Link
                        key={b.id}
                        href={`/bands/${b.id}`}
                        onClick={onClose}
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] text-amber-300 font-semibold transition truncate max-w-full"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-studio-500 italic">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Bio */}
          {student.bio && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-studio-400 uppercase tracking-wider">
                Musician Bio & Self-Description
              </div>
              <div className="p-3.5 rounded-2xl bg-studio-950/70 border border-studio-800/90 text-xs text-studio-200 leading-relaxed italic">
                &ldquo;{student.bio}&rdquo;
              </div>
            </div>
          )}

          {/* Section 4: Musical Styles & Current Obsession */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-studio-400 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Musical Styles & Genres</span>
            </div>

            {student.musicalStyles && student.musicalStyles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {student.musicalStyles.map((style) => (
                  <span
                    key={style}
                    className="px-3 py-1 rounded-xl bg-studio-950 border border-studio-700/80 text-xs font-semibold text-studio-200 shadow-sm"
                  >
                    {style}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-studio-500 italic">
                No specific musical styles chosen.
              </p>
            )}

            {/* Current Obsession */}
            {matchProfile?.currentObsession && (
              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 flex items-start gap-3">
                <Headphones className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Current Favorite Band / Song Obsession
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {matchProfile.currentObsession}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Band Match Questionnaire Responses */}
          <div className="space-y-4 pt-2 border-t border-studio-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Intake Questionnaire Responses</span>
              </div>
            </div>

            {/* Musical Goals */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-studio-400">
                What they want to accomplish in a band:
              </div>
              {matchProfile?.musicalGoals && matchProfile.musicalGoals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {matchProfile.musicalGoals.map((goal) => (
                    <div
                      key={goal}
                      className="p-2.5 rounded-xl bg-studio-950 border border-studio-800 flex items-center gap-2 text-xs text-studio-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{GOAL_LABELS[goal] || goal}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-studio-500 italic">
                  Default goal selections applied.
                </p>
              )}
            </div>

            {/* Hobbies & Outside Interests */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-studio-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Hobbies & Chemistry Interests:</span>
              </div>
              {matchProfile?.hobbies && matchProfile.hobbies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {matchProfile.hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="px-2.5 py-1 rounded-xl bg-studio-950 border border-studio-800 text-xs text-studio-300 flex items-center gap-1"
                    >
                      • {HOBBY_LABELS[hobby] || hobby}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-studio-500 italic">
                  No outside hobbies specified.
                </p>
              )}
            </div>

            {/* 3 Dynamics Badges: Commitment, Social Style, Rehearsal Env */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Commitment */}
              <div className="p-3 rounded-2xl bg-studio-950 border border-studio-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-studio-400 mb-1">
                  Commitment Level
                </div>
                {matchProfile?.commitmentLevel &&
                COMMITMENT_INFO[matchProfile.commitmentLevel] ? (
                  <div>
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                        COMMITMENT_INFO[matchProfile.commitmentLevel].color
                      }`}
                    >
                      {COMMITMENT_INFO[matchProfile.commitmentLevel].label}
                    </span>
                    <p className="text-[11px] text-studio-400 mt-1.5 leading-snug">
                      {COMMITMENT_INFO[matchProfile.commitmentLevel].desc}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-studio-500">Unspecified</span>
                )}
              </div>

              {/* Social Style */}
              <div className="p-3 rounded-2xl bg-studio-950 border border-studio-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-studio-400 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-studio-400" />
                  Social Personality
                </div>
                {matchProfile?.socialStyle &&
                SOCIAL_STYLE_INFO[matchProfile.socialStyle] ? (
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {SOCIAL_STYLE_INFO[matchProfile.socialStyle].label}
                    </span>
                    <p className="text-[11px] text-studio-400 mt-1 leading-snug">
                      {SOCIAL_STYLE_INFO[matchProfile.socialStyle].desc}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-studio-500">Unspecified</span>
                )}
              </div>

              {/* Preferred Environment */}
              <div className="p-3 rounded-2xl bg-studio-950 border border-studio-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-studio-400 mb-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-studio-400" />
                  Band Atmosphere
                </div>
                {matchProfile?.preferredEnvironment &&
                ENVIRONMENT_INFO[matchProfile.preferredEnvironment] ? (
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {ENVIRONMENT_INFO[matchProfile.preferredEnvironment].label}
                    </span>
                    <p className="text-[11px] text-studio-400 mt-1 leading-snug">
                      {ENVIRONMENT_INFO[matchProfile.preferredEnvironment].desc}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-studio-500">Unspecified</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Weekly Rehearsal Availability */}
          <div className="space-y-2 pt-2 border-t border-studio-800">
            <div className="text-xs font-bold text-studio-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Weekly Availability Windows</span>
            </div>

            {student.availability && student.availability.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {student.availability.map((win) => (
                  <div
                    key={win.id || `${win.dayOfWeek}-${win.startTime}`}
                    className="p-2.5 rounded-xl bg-studio-950 border border-studio-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white capitalize">
                      {win.dayOfWeek}
                    </span>
                    <span className="text-amber-300 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {win.startTime} – {win.endTime}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-studio-500 italic">
                No recurring rehearsal time windows entered.
              </p>
            )}
          </div>

          {/* Safe Records Protection Notice */}
          <div className="p-3 rounded-2xl bg-studio-950/40 border border-studio-800 text-[11px] text-studio-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Sensitive personal records (such as parent emergency contact details and raw date of birth) are maintained under strict director privacy partitioning.
            </span>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-5 py-3.5 border-t border-studio-800 bg-studio-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            {onDeleteStudent && (
              <button
                type="button"
                onClick={() => {
                  onDeleteStudent(student);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Student
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onAssignBand && (
              <button
                type="button"
                onClick={() => {
                  onAssignBand(student);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-studio-800 hover:bg-amber-500 hover:text-slate-950 text-studio-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign to Band
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-studio-900 hover:bg-studio-800 text-white text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {student && (
        <ChangeAvatarModal
          isOpen={isChangeAvatarOpen}
          onClose={() => setIsChangeAvatarOpen(false)}
          currentAvatar={student.avatar}
          userName={student.name}
          onSave={handleSaveAvatar}
        />
      )}
    </div>
  );
}
