'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { UserProfile, InstrumentType, SkillLevel, AgeGroup, Band } from '@/types';
import { InstrumentIcon, INSTRUMENT_METADATA } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import { AssignBandModal } from '@/components/roster/AssignBandModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import { BandFormationAssistant } from '@/components/matching/BandFormationAssistant';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  QrCode,
  Music,
  Sparkles,
  Layers,
  GraduationCap,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function RosterPage() {
  const { isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<'roster' | 'matching'>('roster');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [search, setSearch] = useState('');

  // Filter criteria
  const [selectedInstrument, setSelectedInstrument] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');

  // Modals
  const [assignStudent, setAssignStudent] = useState<UserProfile | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setStudents(DataStore.getStudents());
      setBands(DataStore.getBands());
    };

    refresh();
    const unsubStudents = subscribeToStore('students', refresh);
    const unsubBands = subscribeToStore('bands', refresh);

    return () => {
      unsubStudents();
      unsubBands();
    };
  }, []);

  const instrumentsList: InstrumentType[] = [
    'drums',
    'bass',
    'vocals',
    'piano',
    'keyboard',
    'guitars',
    'horns',
  ];

  const skillList: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const ageList: AgeGroup[] = ['kids', 'teens', 'adults'];

  // Collect all unique styles across students
  const allStyles = Array.from(
    new Set(students.flatMap((s) => s.musicalStyles || []))
  );

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      (student.bio && student.bio.toLowerCase().includes(search.toLowerCase()));

    const matchesInstrument =
      selectedInstrument === 'all' ||
      student.instruments.includes(selectedInstrument as InstrumentType);

    const matchesSkill =
      selectedSkill === 'all' || student.skillLevel === selectedSkill;

    const matchesAge =
      selectedAge === 'all' || student.ageGroup === selectedAge;

    const matchesStyle =
      selectedStyle === 'all' ||
      student.musicalStyles?.includes(selectedStyle);

    return (
      matchesSearch &&
      matchesInstrument &&
      matchesSkill &&
      matchesAge &&
      matchesStyle
    );
  });

  const clearFilters = () => {
    setSelectedInstrument('all');
    setSelectedSkill('all');
    setSelectedAge('all');
    setSelectedStyle('all');
    setSearch('');
  };

  const hasActiveFilters =
    selectedInstrument !== 'all' ||
    selectedSkill !== 'all' ||
    selectedAge !== 'all' ||
    selectedStyle !== 'all' ||
    search !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-400" />
            Tagged Student Roster
          </h1>
          <p className="text-sm text-studio-400 mt-1">
            Index and organize student musicians by instrument tags, skill level, musical style, and age group.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsQrOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition"
          >
            <QrCode className="w-4 h-4" />
            Dynamic QR Intake
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs: Directory vs Formation Assistant */}
      <div className="flex items-center gap-2 border-b border-studio-800 pb-2">
        <button
          onClick={() => setActiveView('roster')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition',
            activeView === 'roster'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <Users className="w-4 h-4" />
          Tagged Roster Directory ({students.length})
        </button>

        <button
          onClick={() => setActiveView('matching')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition',
            activeView === 'matching'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <Sparkles className="w-4 h-4" />
          Band Formation Assistant
        </button>
      </div>

      {activeView === 'matching' ? (
        <BandFormationAssistant
          students={students}
          onBandCreated={() => {
            setStudents(DataStore.getStudents());
            setBands(DataStore.getBands());
          }}
        />
      ) : (
        <>
          {/* Filter Matrix Card */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-5 space-y-4 shadow-sm">
        {/* Search & Clear Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-studio-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or bio..."
              className="w-full bg-studio-950 border border-studio-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold self-end sm:self-center"
            >
              <X className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>

        {/* Tag Filters */}
        <div className="space-y-3 pt-2 border-t border-studio-800/80 text-xs">
          {/* Instrument Filter Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-studio-400 font-bold uppercase tracking-wider text-[10px] w-24 shrink-0">
              Instruments:
            </span>
            <button
              onClick={() => setSelectedInstrument('all')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold transition border',
                selectedInstrument === 'all'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
              )}
            >
              All Instruments
            </button>
            {instrumentsList.map((inst) => (
              <button
                key={inst}
                onClick={() => setSelectedInstrument(inst)}
                className={clsx(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition border capitalize',
                  selectedInstrument === inst
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                )}
              >
                <InstrumentIcon instrument={inst} size="xs" />
                {inst}
              </button>
            ))}
          </div>

          {/* Skill Filter Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-studio-400 font-bold uppercase tracking-wider text-[10px] w-24 shrink-0">
              Skill Level:
            </span>
            <button
              onClick={() => setSelectedSkill('all')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold transition border',
                selectedSkill === 'all'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
              )}
            >
              All Levels
            </button>
            {skillList.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg font-semibold transition border capitalize',
                  selectedSkill === skill
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                )}
              >
                {skill}
              </button>
            ))}
          </div>

          {/* Musical Style Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-studio-400 font-bold uppercase tracking-wider text-[10px] w-24 shrink-0">
              Musical Style:
            </span>
            <button
              onClick={() => setSelectedStyle('all')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold transition border',
                selectedStyle === 'all'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
              )}
            >
              All Styles
            </button>
            {allStyles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg font-semibold transition border',
                  selectedStyle === style
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                )}
              >
                #{style}
              </button>
            ))}
          </div>

          {/* Age Group */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-studio-400 font-bold uppercase tracking-wider text-[10px] w-24 shrink-0">
              Age Bracket:
            </span>
            <button
              onClick={() => setSelectedAge('all')}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold transition border',
                selectedAge === 'all'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
              )}
            >
              All Ages
            </button>
            {ageList.map((age) => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg font-semibold transition border capitalize',
                  selectedAge === age
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                )}
              >
                {age === 'kids' ? 'Youth (<13)' : age === 'teens' ? 'Teens (13–18)' : 'Adults (18+)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Grid Count */}
      <div className="flex items-center justify-between text-xs text-studio-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredStudents.length}</strong> of{' '}
          {students.length} Enrolled Musicians
        </span>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((student) => {
          const studentBands = bands.filter((b) =>
            b.members.some((m) => m.userId === student.id)
          );

          return (
            <div
              key={student.id}
              className="bg-studio-900 border border-studio-800 hover:border-studio-700 rounded-2xl p-5 transition shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Top: Avatar & Name */}
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-studio-800 border-2 border-studio-700 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="text-base font-bold text-white truncate">
                        {student.name}
                      </h3>
                      {student.pronouns && <Badge pronouns={student.pronouns} />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <InstrumentIcon
                        instrument={student.primaryInstrument}
                        size="xs"
                        showLabel
                      />
                      <Badge skill={student.skillLevel} />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {student.bio && (
                  <p className="text-xs text-studio-300 line-clamp-2 mb-3 leading-relaxed">
                    {student.bio}
                  </p>
                )}

                {/* Metadata Tags */}
                <div className="space-y-2 text-xs bg-studio-950/70 p-3 rounded-xl border border-studio-800/80 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-studio-400">Age:</span>
                    {student.exactAge ? (
                      <div className="flex items-center gap-1">
                        <Badge exactAge={student.exactAge} />
                        <span className="text-[10px] text-studio-500">
                          ({student.ageGroup})
                        </span>
                      </div>
                    ) : (
                      <Badge age={student.ageGroup} />
                    )}
                  </div>

                  {student.availability && student.availability.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-studio-400">Availability:</span>
                      <span className="text-[11px] text-amber-300 font-medium">
                        {student.availability.map((a) => a.dayOfWeek.slice(0, 3)).join(', ')}
                      </span>
                    </div>
                  )}

                  {student.bandMatchProfile?.commitmentLevel && (
                    <div className="flex items-center justify-between">
                      <span className="text-studio-400">Band Goal:</span>
                      <span className="text-[11px] text-studio-300 capitalize">
                        {student.bandMatchProfile.commitmentLevel.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {student.instruments.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-studio-400">All Instruments:</span>
                      <div className="flex items-center gap-1">
                        {student.instruments.map((inst) => (
                          <InstrumentIcon key={inst} instrument={inst} size="xs" />
                        ))}
                      </div>
                    </div>
                  )}

                  {student.musicalStyles && student.musicalStyles.length > 0 && (
                    <div>
                      <span className="text-studio-400 block mb-1">
                        Preferred Styles:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {student.musicalStyles.map((style) => (
                          <span
                            key={style}
                            className="px-2 py-0.5 rounded bg-studio-900 border border-studio-800 text-[10px] text-studio-300 font-medium"
                          >
                            #{style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Enrolled Bands */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-studio-400 mb-1.5">
                    Active Ensembles ({studentBands.length})
                  </div>
                  {studentBands.length === 0 ? (
                    <span className="text-xs text-amber-400/80 italic">
                      Not currently assigned to any band.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {studentBands.map((b) => (
                        <span
                          key={b.id}
                          className="text-xs px-2.5 py-1 rounded-lg bg-studio-950 border border-studio-800 text-studio-200 font-semibold"
                        >
                          {b.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {isAdmin && (
                <div className="pt-3 border-t border-studio-800">
                  <button
                    onClick={() => setAssignStudent(student)}
                    className="w-full py-2 rounded-xl bg-studio-800 hover:bg-amber-500 hover:text-slate-950 text-studio-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign to Band
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* Modals */}
      <AssignBandModal
        isOpen={Boolean(assignStudent)}
        onClose={() => setAssignStudent(null)}
        student={assignStudent}
        onSuccess={() => {
          setStudents(DataStore.getStudents());
          setBands(DataStore.getBands());
        }}
      />

      <QRCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </div>
  );
}
