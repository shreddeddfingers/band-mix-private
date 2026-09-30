'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { UserProfile, InstrumentType, SkillLevel, AgeGroup, Band } from '@/types';
import { InstrumentIcon, INSTRUMENT_METADATA } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import { AssignBandModal } from '@/components/roster/AssignBandModal';
import { StudentProfileModal } from '@/components/roster/StudentProfileModal';
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
  Lock,
  Trash2,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { DirectMessagesModal } from '@/components/chat/DirectMessagesModal';
import { clsx } from 'clsx';

export default function RosterPage() {
  const router = useRouter();
  const { isAdmin, currentUser, activeDirectorId, isAuthLoading } = useAuth();
  const [activeView, setActiveView] = useState<'roster' | 'matching'>('roster');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [search, setSearch] = useState('');

  // Filter criteria
  const [selectedInstrument, setSelectedInstrument] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedBandStatus, setSelectedBandStatus] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [isRefineOpen, setIsRefineOpen] = useState(false);

  // Modals
  const [viewProfileStudent, setViewProfileStudent] = useState<UserProfile | null>(null);
  const [assignStudent, setAssignStudent] = useState<UserProfile | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isDmOpen, setIsDmOpen] = useState(false);
  const [dmStudent, setDmStudent] = useState<UserProfile | null>(null);

  useEffect(() => {
    const refresh = () => {
      setStudents(DataStore.getStudents(activeDirectorId));
      setBands(DataStore.getBands(activeDirectorId));
    };

    refresh();
    const unsubStudents = subscribeToStore('students', refresh);
    const unsubBands = subscribeToStore('bands', refresh);

    return () => {
      unsubStudents();
      unsubBands();
    };
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

  if (isAuthLoading) {
    return (
      <div className="py-20 text-center">
        <p className="text-studio-400">Loading studio roster...</p>
      </div>
    );
  }

  if (!isAdmin) {
    const studentBands = currentUser
      ? DataStore.getBands().filter((b) => b.members.some((m) => m.userId === currentUser.id))
      : [];
    const myBand = studentBands[0];

    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Director Access Only</h2>
        <p className="text-sm text-studio-400 leading-relaxed">
          The studio roster, matching engine, and student intake tools are restricted to band directors. Student musicians only have access to their assigned band.
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
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.primaryInstrument.toLowerCase().includes(query) ||
      student.instruments.some((i) => i.toLowerCase().includes(query)) ||
      (student.musicalStyles && student.musicalStyles.some((s) => s.toLowerCase().includes(query))) ||
      (student.bio && student.bio.toLowerCase().includes(query));

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

    const studentBands = bands.filter(
      (b) =>
        b.members?.some((m) => m.userId === student.id) ||
        (student.bandIds && student.bandIds.includes(b.id))
    );
    const matchesBandStatus =
      selectedBandStatus === 'all' ||
      (selectedBandStatus === 'unassigned' && studentBands.length === 0) ||
      (selectedBandStatus === 'assigned' && studentBands.length > 0);

    return (
      matchesSearch &&
      matchesInstrument &&
      matchesSkill &&
      matchesAge &&
      matchesStyle &&
      matchesBandStatus
    );
  });

  const clearFilters = () => {
    setSelectedInstrument('all');
    setSelectedSkill('all');
    setSelectedAge('all');
    setSelectedStyle('all');
    setSelectedBandStatus('all');
    setSearch('');
  };

  const activeFilterCount =
    (selectedInstrument !== 'all' ? 1 : 0) +
    (selectedSkill !== 'all' ? 1 : 0) +
    (selectedAge !== 'all' ? 1 : 0) +
    (selectedStyle !== 'all' ? 1 : 0) +
    (selectedBandStatus !== 'all' ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0 || search !== '';


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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[var(--brand-contrast-text)] text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition"
          >
            <QrCode className="w-4 h-4" />
            Dynamic QR Intake
          </button>
        </div>
      </div>

      {/* View Selector Pop-down Menu */}
      <div className="flex items-center justify-between gap-3 bg-studio-900 border border-studio-800 p-2 sm:p-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 pl-2 min-w-0">
          {activeView === 'roster' ? (
            <Users className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-studio-400 truncate">
            Roster View:
          </span>
        </div>

        <div className="relative min-w-[190px] sm:min-w-[260px]">
          <select
            value={activeView}
            onChange={(e) => setActiveView(e.target.value as any)}
            className="w-full bg-studio-950 border border-amber-500/40 rounded-xl px-3.5 py-2 text-base sm:text-xs font-bold text-white focus:outline-none focus:border-amber-400 appearance-none pr-8 cursor-pointer shadow-sm"
          >
            <option value="roster">👥 Tagged Roster Directory ({students.length})</option>
            <option value="matching">✨ Band Formation Assistant</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400 text-xs font-bold">
            ▾
          </div>
        </div>
      </div>

      {activeView === 'matching' ? (
        <BandFormationAssistant
          students={students}
          onBandCreated={() => {
            setStudents(DataStore.getStudents(activeDirectorId));
            setBands(DataStore.getBands(activeDirectorId));
          }}
        />
      ) : (
        <>
          {/* Amazon-Style Search & Refine System */}
          <div className="space-y-2.5">
            {/* Main Search & Refine Bar */}
            <div className="flex items-center gap-2 bg-studio-900 border border-studio-800 rounded-2xl p-2 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-studio-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, instrument, style, or bio..."
                  className="w-full bg-studio-950 border border-studio-800 rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Amazon-Style Refine Button */}
              <button
                type="button"
                onClick={() => setIsRefineOpen(!isRefineOpen)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 active:scale-95 border',
                  isRefineOpen || activeFilterCount > 0
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-studio-950 hover:bg-studio-800 border-studio-800 text-studio-300 hover:text-white'
                )}
                title="Refine search filters by category"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Refine</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center text-[10px] font-black">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={clsx(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    isRefineOpen && 'rotate-180'
                  )}
                />
              </button>
            </div>

            {/* Amazon-Style Active Filter Chips (if any filter is applied) */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
                <span className="text-[11px] font-bold text-studio-400 uppercase tracking-wider mr-1">
                  Active:
                </span>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-studio-900 border border-studio-700 text-studio-200 text-xs hover:border-studio-500"
                  >
                    <span>&ldquo;{search}&rdquo;</span>
                    <X className="w-3 h-3 text-studio-400 hover:text-white" />
                  </button>
                )}
                {selectedInstrument !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedInstrument('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-studio-900 border border-studio-700 text-amber-300 text-xs hover:border-amber-500"
                  >
                    <span>{INSTRUMENT_METADATA[selectedInstrument as InstrumentType]?.label || selectedInstrument}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedSkill !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSkill('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-studio-900 border border-studio-700 text-amber-300 text-xs capitalize hover:border-amber-500"
                  >
                    <span>Skill: {selectedSkill}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedStyle !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-studio-900 border border-studio-700 text-amber-300 text-xs hover:border-amber-500"
                  >
                    <span>Style: {selectedStyle}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedAge !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedAge('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-studio-900 border border-studio-700 text-amber-300 text-xs capitalize hover:border-amber-500"
                  >
                    <span>Age: {selectedAge}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedBandStatus !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedBandStatus('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-studio-900 border border-studio-700 text-amber-300 text-xs capitalize hover:border-amber-500"
                  >
                    <span>{selectedBandStatus === 'unassigned' ? 'Unassigned Only' : 'Assigned to Band'}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Amazon-Style Collapsible Refine Sub-menu */}
            {isRefineOpen && (
              <div className="bg-studio-900 border border-studio-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-studio-800 pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Refine Roster by Category</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-studio-400 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsRefineOpen(false)}
                      className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                    >
                      Done
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Category 1: Instrument */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-1.5 flex items-center justify-between">
                      <span>Instrument</span>
                      {selectedInstrument !== 'all' && (
                        <span className="text-amber-400 text-[10px]">Filtered</span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                        className="w-full bg-studio-950 border border-studio-700/80 rounded-xl px-3 py-2 text-base sm:text-xs font-semibold text-white focus:outline-none focus:border-amber-500 appearance-none pr-7 cursor-pointer capitalize"
                      >
                        <option value="all">All Instruments</option>
                        {instrumentsList.map((inst) => (
                          <option key={inst} value={inst}>
                            {INSTRUMENT_METADATA[inst]?.label || inst}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-studio-400 text-xs font-bold">
                        ▾
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Skill Level */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-1.5 flex items-center justify-between">
                      <span>Skill Level</span>
                      {selectedSkill !== 'all' && (
                        <span className="text-amber-400 text-[10px]">Filtered</span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSkill}
                        onChange={(e) => setSelectedSkill(e.target.value)}
                        className="w-full bg-studio-950 border border-studio-700/80 rounded-xl px-3 py-2 text-base sm:text-xs font-semibold text-white focus:outline-none focus:border-amber-500 appearance-none pr-7 cursor-pointer capitalize"
                      >
                        <option value="all">All Skill Levels</option>
                        {skillList.map((skill) => (
                          <option key={skill} value={skill} className="capitalize">
                            {skill}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-studio-400 text-xs font-bold">
                        ▾
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Musical Style */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-1.5 flex items-center justify-between">
                      <span>Musical Style</span>
                      {selectedStyle !== 'all' && (
                        <span className="text-amber-400 text-[10px]">Filtered</span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="w-full bg-studio-950 border border-studio-700/80 rounded-xl px-3 py-2 text-base sm:text-xs font-semibold text-white focus:outline-none focus:border-amber-500 appearance-none pr-7 cursor-pointer"
                      >
                        <option value="all">All Styles ({allStyles.length})</option>
                        {allStyles.map((style) => (
                          <option key={style} value={style}>
                            {style}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-studio-400 text-xs font-bold">
                        ▾
                      </div>
                    </div>
                  </div>

                  {/* Category 4: Age Bracket */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-1.5 flex items-center justify-between">
                      <span>Age Bracket</span>
                      {selectedAge !== 'all' && (
                        <span className="text-amber-400 text-[10px]">Filtered</span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedAge}
                        onChange={(e) => setSelectedAge(e.target.value)}
                        className="w-full bg-studio-950 border border-studio-700/80 rounded-xl px-3 py-2 text-base sm:text-xs font-semibold text-white focus:outline-none focus:border-amber-500 appearance-none pr-7 cursor-pointer capitalize"
                      >
                        <option value="all">All Age Groups</option>
                        <option value="kids">Kids (Under 13)</option>
                        <option value="teens">Teens (13–18)</option>
                        <option value="adults">Adults (18+)</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-studio-400 text-xs font-bold">
                        ▾
                      </div>
                    </div>
                  </div>

                  {/* Category 5: Ensemble Status */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-1.5 flex items-center justify-between">
                      <span>Band Status</span>
                      {selectedBandStatus !== 'all' && (
                        <span className="text-amber-400 text-[10px]">Filtered</span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBandStatus}
                        onChange={(e) => setSelectedBandStatus(e.target.value as any)}
                        className="w-full bg-studio-950 border border-studio-700/80 rounded-xl px-3 py-2 text-base sm:text-xs font-semibold text-white focus:outline-none focus:border-amber-500 appearance-none pr-7 cursor-pointer"
                      >
                        <option value="all">All Musicians</option>
                        <option value="unassigned">⚡ Unassigned Only</option>
                        <option value="assigned">🎵 In an Ensemble</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-studio-400 text-xs font-bold">
                        ▾
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Roster Overview Count Header */}
          <div className="flex items-center justify-between text-xs text-studio-400 px-1 pt-1">
            <span>
              Showing <strong className="text-white">{filteredStudents.length}</strong> of{' '}
              {students.length} Musicians
            </span>
            <span className="text-[11px] text-studio-500">
              Tap any student to view their full profile card &amp; questionnaire
            </span>
          </div>

          {/* Compact Student Overview List (No giant cards taking over the screen) */}
          {filteredStudents.length === 0 ? (
            <div className="bg-studio-900 border border-studio-800 rounded-3xl p-8 text-center space-y-3">
              <Users className="w-10 h-10 text-studio-600 mx-auto" />
              <p className="font-bold text-white text-base">No students matched your search</p>
              <p className="text-xs text-studio-400 max-w-sm mx-auto">
                Try clearing active filters or refining your search keywords.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="bg-studio-900 border border-studio-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-studio-800/80">
              {filteredStudents.map((student) => {
                const studentBands = bands.filter(
                  (b) =>
                    b.members?.some((m) => m.userId === student.id) ||
                    (student.bandIds && student.bandIds.includes(b.id))
                );

                return (
                  <div
                    key={student.id}
                    onClick={() => setViewProfileStudent(student)}
                    className="p-3.5 sm:p-4 hover:bg-studio-850/80 transition-colors cursor-pointer flex items-center justify-between gap-3 group active:bg-studio-800"
                    title="Tap to open full student card, questionnaire, and band controls"
                  >
                    {/* Left: Avatar + Primary Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-studio-800 border-2 border-studio-700 group-hover:border-amber-500 shrink-0 shadow-md transition">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition truncate">
                            {student.name}
                          </h3>
                          {student.exactAge ? (
                            <Badge exactAge={student.exactAge} />
                          ) : (
                            <Badge age={student.ageGroup} />
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-studio-400 truncate">
                          <div className="flex items-center gap-1 text-white font-medium">
                            <InstrumentIcon
                              instrument={student.primaryInstrument}
                              size="xs"
                              showLabel
                            />
                          </div>
                          <span>•</span>
                          <span className="capitalize text-studio-300">
                            {student.skillLevel}
                          </span>
                          {student.musicalStyles && student.musicalStyles.length > 0 && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline text-studio-400 truncate max-w-[160px]">
                                {student.musicalStyles.slice(0, 2).join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Band Status Pill + Direct Message + Chevron */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                      {studentBands.length === 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Unassigned
                        </span>
                      ) : (
                        <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-studio-950 text-studio-300 border border-studio-800">
                          <Music className="w-3 h-3 text-amber-400" />
                          <span>
                            {studentBands.length} {studentBands.length === 1 ? 'Band' : 'Bands'}
                          </span>
                        </span>
                      )}

                      {/* Quick Direct Message Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDmStudent(student);
                          setIsDmOpen(true);
                        }}
                        className="p-1.5 sm:p-2 rounded-xl bg-studio-950 hover:bg-amber-500 hover:text-slate-950 text-studio-300 border border-studio-800 transition shrink-0"
                        title={`Send direct message to ${student.name}`}
                        aria-label={`Send direct message to ${student.name}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <div className="w-7 h-7 rounded-full bg-studio-950 group-hover:bg-amber-500 group-hover:text-slate-950 text-studio-400 transition flex items-center justify-center">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <StudentProfileModal
        isOpen={Boolean(viewProfileStudent)}
        onClose={() => setViewProfileStudent(null)}
        student={viewProfileStudent}
        bands={bands}
        onAssignBand={(student) => setAssignStudent(student)}
        onDeleteStudent={(student) => setStudentToDelete(student)}
        onOpenDirectMessage={(student) => {
          setDmStudent(student);
          setIsDmOpen(true);
        }}
        onStudentUpdated={(updated) => {
          setStudents(DataStore.getStudents(activeDirectorId));
          setViewProfileStudent(updated);
        }}
      />

      <DirectMessagesModal
        isOpen={isDmOpen}
        onClose={() => {
          setIsDmOpen(false);
          setDmStudent(null);
        }}
        initialStudent={dmStudent}
      />

      <AssignBandModal
        isOpen={Boolean(assignStudent)}
        onClose={() => setAssignStudent(null)}
        student={assignStudent}
        onSuccess={() => {
          setStudents(DataStore.getStudents(activeDirectorId));
          setBands(DataStore.getBands(activeDirectorId));
        }}
      />

      <QRCodeModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />

      {/* Remove Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-studio-900 border border-studio-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Remove Student from Studio
                </h3>
                <p className="text-xs text-studio-400">
                  Permanently remove student account and records.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-studio-950 border border-studio-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-studio-800 border border-studio-700 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={studentToDelete.avatar}
                  alt={studentToDelete.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white text-sm truncate">
                  {studentToDelete.name}
                </div>
                <div className="text-xs text-studio-400 flex items-center gap-1.5 capitalize">
                  <InstrumentIcon instrument={studentToDelete.primaryInstrument} size="xs" />
                  <span>{studentToDelete.primaryInstrument}</span>
                  <span>•</span>
                  <span>{studentToDelete.skillLevel}</span>
                </div>
              </div>
            </div>

            {bands.some((b) => b.members.some((m) => m.userId === studentToDelete.id)) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Ensemble Notice:</strong> This student is currently in{' '}
                  <strong>
                    {bands
                      .filter((b) => b.members.some((m) => m.userId === studentToDelete.id))
                      .map((b) => b.name)
                      .join(', ')}
                  </strong>
                  . Removing them will take them off those band rosters automatically.
                </span>
              </div>
            )}

            <p className="text-xs text-studio-400 leading-relaxed">
              Use this if a student has quit the band program, or if an account was mistakenly registered with a typo or wrong name.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-studio-800">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl text-studio-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!studentToDelete) return;
                  setIsDeleting(true);
                  const targetId = studentToDelete.id;
                  setStudentToDelete(null);
                  // Optimistically remove from state immediately
                  setStudents((prev) => prev.filter((s) => s.id !== targetId));
                  try {
                    await DataStore.deleteStudent(targetId);
                    setStudents(DataStore.getStudents(activeDirectorId));
                    setBands(DataStore.getBands(activeDirectorId));
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
