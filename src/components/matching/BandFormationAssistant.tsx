'use client';

import React, { useState, useMemo } from 'react';
import { UserProfile, InstrumentType, Band } from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import {
  analyzeGroupCompatibility,
  GroupCompatibilityReport,
} from '@/lib/matching-engine';
import { DataStore } from '@/lib/data-store';
import {
  Users,
  Calendar,
  Sparkles,
  Music,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  X,
  Target,
  Heart,
  Clock,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface BandFormationAssistantProps {
  students: UserProfile[];
  onBandCreated?: (band: Band) => void;
}

export function BandFormationAssistant({
  students,
  onBandCreated,
}: BandFormationAssistantProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bandName, setBandName] = useState('New Ensemble');
  const [genre, setGenre] = useState('Rock / Alternative');
  const [targetSchedule, setTargetSchedule] = useState('Tuesdays 4:30 PM - 6:30 PM');
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdBand, setCreatedBand] = useState<Band | null>(null);

  // Selected students objects
  const selectedStudents = useMemo(() => {
    return students.filter((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  // Candidate pool (unselected or filtered)
  const candidatePool = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.primaryInstrument.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesInst =
        instrumentFilter === 'all' || s.primaryInstrument === instrumentFilter;
      return matchesSearch && matchesInst;
    });
  }, [students, searchQuery, instrumentFilter]);

  // Compute live signals using the matching engine
  const report: GroupCompatibilityReport = useMemo(() => {
    return analyzeGroupCompatibility(selectedStudents);
  }, [selectedStudents]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateBand = () => {
    if (selectedStudents.length === 0 || !bandName.trim()) return;

    const initialStudentIds = selectedStudents.map((s) => ({
      studentId: s.id,
      instrument: s.primaryInstrument,
    }));

    const newBand = DataStore.createBand({
      name: bandName.trim(),
      genre,
      description: `${genre} student ensemble formed via Director Formation Assistant.`,
      rehearsalSchedule: report.bestScheduleWindow
        ? `${report.bestScheduleWindow.dayOfWeek.charAt(0).toUpperCase() + report.bestScheduleWindow.dayOfWeek.slice(1)}s ${report.bestScheduleWindow.startTime} - ${report.bestScheduleWindow.endTime}`
        : targetSchedule,
      initialStudentIds,
    });

    setCreatedBand(newBand);
    setIsSuccessModalOpen(true);
    setSelectedStudentIds([]);
    if (onBandCreated) onBandCreated(newBand);
  };

  return (
    <div className="space-y-6">
      {/* Assistant Header */}
      <div className="bg-gradient-to-r from-studio-900 via-studio-900 to-studio-950 border border-studio-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Director Decision Support
            </span>
            <span className="text-xs text-studio-400">
              Availability → Exact Age → Instrumentation → Skill → Style → Goals
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Band Formation & Matching Assistant
          </h2>
          <p className="text-xs sm:text-sm text-studio-300 mt-1 max-w-2xl leading-relaxed">
            Move students into proposed ensembles to evaluate schedule overlap, exact peer ages, instrument coverage, and shared interests in real-time.
          </p>
        </div>

        {selectedStudents.length > 0 && (
          <button
            onClick={handleCreateBand}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center gap-2 shrink-0 self-start md:self-center"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            Finalize & Form Ensemble ({selectedStudents.length})
          </button>
        )}
      </div>

      {/* Main Workbench Grid: Candidate Pool (Left) + Prospective Band & Signal Analysis (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Candidate Bench */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Available Candidate Bench ({candidatePool.length})
              </h3>
              <span className="text-[11px] text-studio-400">Click to add/remove</span>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates..."
                className="w-full bg-studio-950 border border-studio-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={instrumentFilter}
                onChange={(e) => setInstrumentFilter(e.target.value)}
                className="bg-studio-950 border border-studio-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 capitalize"
              >
                <option value="all">All</option>
                {['drums', 'bass', 'guitars', 'keyboard', 'vocals', 'horns'].map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            {/* Candidate List */}
            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
              {candidatePool.map((candidate) => {
                const isSelected = selectedStudentIds.includes(candidate.id);
                return (
                  <div
                    key={candidate.id}
                    onClick={() => toggleStudent(candidate.id)}
                    className={clsx(
                      'p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3',
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                        : 'bg-studio-950/70 border-studio-800 hover:border-studio-700 text-studio-300'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-studio-800 border border-studio-700 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={candidate.avatar}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-white truncate">
                            {candidate.name}
                          </span>
                          {candidate.pronouns && (
                            <span className="text-[10px] text-studio-400 font-normal">
                              ({candidate.pronouns})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-studio-400">
                          <InstrumentIcon
                            instrument={candidate.primaryInstrument}
                            size="xs"
                            showLabel
                          />
                          <span>•</span>
                          <span className="font-mono text-amber-300 font-bold">
                            {candidate.exactAge ? `Age ${candidate.exactAge}` : candidate.ageGroup}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{candidate.skillLevel}</span>
                        </div>

                        {/* Preferred Styles / Availability Pill */}
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-studio-500">
                          <span>
                            Avail:{' '}
                            {candidate.availability && candidate.availability.length > 0
                              ? candidate.availability.map((a) => a.dayOfWeek.slice(0, 3)).join(', ')
                              : 'None listed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={clsx(
                        'w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition',
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'border-studio-700 text-studio-500'
                      )}
                    >
                      {isSelected ? <X className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Proposed Band Analysis & Decision Workspace */}
        <div className="lg:col-span-7 space-y-4">
          {/* Prospective Band Header Configuration */}
          <div className="bg-studio-900 border border-studio-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-studio-800 pb-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  placeholder="Band Name..."
                  className="bg-transparent text-lg font-black text-white focus:outline-none focus:border-b focus:border-amber-400 w-full"
                />
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Target Genre / Style..."
                  className="bg-transparent text-xs text-amber-400 font-semibold focus:outline-none mt-0.5 w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-xl bg-studio-950 border border-studio-800 text-studio-300 font-mono">
                  {selectedStudents.length} Candidates Assembled
                </span>
              </div>
            </div>

            {/* Empty State */}
            {selectedStudents.length === 0 ? (
              <div className="py-16 text-center text-studio-400 bg-studio-950/60 rounded-xl border border-dashed border-studio-800 p-6">
                <Users className="w-10 h-10 text-studio-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No candidates selected yet</p>
                <p className="text-xs max-w-sm mx-auto mt-1">
                  Select student musicians from the candidate bench on the left to see live schedule overlap, age distribution, and instrument coverage.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. Schedule Overlap Signal Banner */}
                <div
                  className={clsx(
                    'p-3.5 rounded-2xl border flex items-center justify-between gap-3',
                    report.hasFullScheduleOverlap
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock
                      className={clsx(
                        'w-5 h-5 shrink-0',
                        report.hasFullScheduleOverlap ? 'text-emerald-400' : 'text-amber-400'
                      )}
                    />
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider">
                        Availability Overlap Signal
                      </div>
                      <div className="text-sm font-black text-white font-mono">
                        {report.scheduleSummary}
                      </div>
                    </div>
                  </div>
                  {report.hasFullScheduleOverlap ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                      100% Match
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      Partial
                    </span>
                  )}
                </div>

                {/* 2. Exact Age Signal Panel (Never collapsed into a range!) */}
                <div className="p-3.5 bg-studio-950 rounded-2xl border border-studio-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Exact Individual Ages
                    </span>
                    <span
                      className={clsx(
                        'text-[10px] font-bold uppercase px-2 py-0.5 rounded border',
                        report.ageCompatibilitySignal === 'Close Peer Cohort'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : report.ageCompatibilitySignal === 'Moderate Age Spread'
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      )}
                    >
                      {report.ageCompatibilitySignal}
                    </span>
                  </div>

                  <div className="text-sm font-mono font-bold text-white tracking-wide">
                    {report.exactAgesFormatted}
                  </div>
                  <div className="text-[11px] text-studio-400">
                    Age spread spans {report.ageSpread} year{report.ageSpread === 1 ? '' : 's'} across {selectedStudents.length} members.
                  </div>
                </div>

                {/* 3. Instrumentation Coverage Strip */}
                <div className="p-3.5 bg-studio-950 rounded-2xl border border-studio-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                      Instrumentation Coverage
                    </span>
                    {report.hasStandardRhythmSection ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Rhythm Section Intact
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Incomplete Rhythm
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-amber-300 font-mono">
                    {report.instrumentSummary}
                  </div>

                  {/* Missing needs warning */}
                  {report.missingCoreInstruments.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Missing slots: {report.missingCoreInstruments.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* 4. Skill & Musical Style Compatibility Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-studio-950 rounded-2xl border border-studio-800 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400">
                      Skill Compatibility
                    </div>
                    <div className="font-bold text-white text-sm">
                      {report.skillCompatibilitySignal} (Spread: {report.skillSpread})
                    </div>
                    <div className="text-[11px] text-studio-400">
                      {Object.entries(report.skillCounts)
                        .filter(([_, count]) => count > 0)
                        .map(([lvl, count]) => `${count} ${lvl}`)
                        .join(', ')}
                    </div>
                  </div>

                  <div className="p-3 bg-studio-950 rounded-2xl border border-studio-800 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400">
                      Musical Style Overlap
                    </div>
                    <div className="font-bold text-amber-300 text-sm truncate">
                      {report.styleSummary}
                    </div>
                    <div className="text-[11px] text-studio-400 truncate">
                      {report.sharedStyles.map((s) => `#${s.style}`).join(' ')}
                    </div>
                  </div>
                </div>

                {/* 5. Musical Goals & Shared Hobbies */}
                <div className="p-3.5 bg-studio-950 rounded-2xl border border-studio-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      Musical Goals & Ambition
                    </span>
                    <span className="text-[11px] text-studio-300 capitalize">
                      {report.commitmentSummary}
                    </span>
                  </div>

                  {report.sharedHobbies.length > 0 && (
                    <div className="pt-2 border-t border-studio-800/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1 mb-1">
                        <Heart className="w-3 h-3 text-rose-400" />
                        Shared Non-Musical Interests:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {report.sharedHobbies.map((h) => (
                          <span
                            key={h.hobby}
                            className="px-2 py-0.5 rounded-lg bg-studio-900 border border-studio-800 text-[10px] text-studio-200 capitalize font-medium"
                          >
                            {h.hobby.replace(/_/g, ' ')} ({h.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assembled Roster Strip with Remove */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-2">
                    Current Ensemble Roster ({selectedStudents.length} Students)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudents.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-studio-950 border border-studio-800 text-xs text-white"
                      >
                        <InstrumentIcon instrument={s.primaryInstrument} size="xs" />
                        <span className="font-bold">{s.name}</span>
                        <span className="font-mono text-amber-300 text-[11px]">
                          (Age {s.exactAge || (s.ageGroup === 'kids' ? 10 : 15)})
                        </span>
                        <button
                          onClick={() => toggleStudent(s.id)}
                          className="text-studio-500 hover:text-rose-400 ml-1 p-0.5"
                          title="Remove student"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && createdBand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-studio-900 border border-studio-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">Ensemble Formed!</h3>
            <p className="text-xs text-studio-300 leading-relaxed">
              <strong>{createdBand.name}</strong> ({createdBand.genre}) has been registered with {createdBand.members.length} members. Dedicated chat channel initialized and Director Marcus Vance is locked in.
            </p>

            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
