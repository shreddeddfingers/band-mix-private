'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band, InstrumentType, UserProfile } from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import { BandChat } from '@/components/chat/BandChat';
import { RehearsalPlanner } from '@/components/scheduling/RehearsalPlanner';
import { QRCodeModal } from '@/components/QRCodeModal';
import { BandAnnouncementsTab } from '@/components/announcements/BandAnnouncementsTab';
import { SetlistManager } from '@/components/repertoire/SetlistManager';
import { SongSuggestionVoting } from '@/components/repertoire/SongSuggestionVoting';
import {
  Music,
  Calendar,
  MessageSquare,
  Users,
  QrCode,
  ArrowLeft,
  Clock,
  ShieldCheck,
  UserPlus,
  Trash2,
  Sparkles,
  Megaphone,
  ListMusic,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function BandHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAdmin, currentUser } = useAuth();
  const [band, setBand] = useState<Band | null>(null);
  const [activeTab, setActiveTab] = useState<
    'chat' | 'announcements' | 'repertoire' | 'suggestions' | 'schedule' | 'roster'
  >('chat');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [selectedInstrumentToAdd, setSelectedInstrumentToAdd] = useState<InstrumentType>('guitars');

  useEffect(() => {
    const refresh = () => {
      const b = DataStore.getBand(resolvedParams.id);
      if (b) {
        setBand({ ...b });
      }
    };

    refresh();
    const unsub = subscribeToStore('bands', refresh);
    return () => unsub();
  }, [resolvedParams.id]);

  if (!band) {
    return (
      <div className="py-20 text-center">
        <p className="text-studio-400">Loading ensemble hub...</p>
      </div>
    );
  }

  const handleRemoveMember = (userId: string, memberName: string) => {
    if (!isAdmin) return;
    if (confirm(`Remove ${memberName} from this band?`)) {
      DataStore.removeMemberFromBand(band.id, userId);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentToAdd) return;

    const student = DataStore.getUserById(selectedStudentToAdd);
    if (student) {
      DataStore.addMemberToBand(band.id, student, selectedInstrumentToAdd);
      setIsAddMemberOpen(false);
      setSelectedStudentToAdd('');
    }
  };

  const bandDirectorId = band.directorId || band.createdBy || 'director-main';
  const availableStudents = DataStore.getStudents(bandDirectorId).filter(
    (s) => !band.members.some((m) => m.userId === s.id)
  );

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/bands"
          className="inline-flex items-center gap-1.5 text-xs text-studio-400 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Bands
        </Link>
      </div>

      {/* Band Hero Banner */}
      <div className="relative rounded-3xl bg-studio-900 border border-studio-800 overflow-hidden shadow-2xl">
        <div className="relative h-48 sm:h-64 bg-studio-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              band.coverImage ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'
            }
            alt={band.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-studio-950 via-studio-950/60 to-transparent" />

          {/* Banner content */}
          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                  {band.genre}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-black/60 text-studio-300 border border-white/10 font-mono">
                  {band.members.length} Musicians
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {band.name}
              </h1>
              <p className="text-xs sm:text-sm text-studio-300 max-w-2xl mt-1">
                {band.description}
              </p>
            </div>

            {/* Quick Actions on banner */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold border border-white/20 backdrop-blur-md transition shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  Band QR Pass
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Member instrument strip */}
        <div className="p-4 bg-studio-950/80 border-t border-studio-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-studio-400 mr-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Roster:
            </span>
            {band.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-studio-900 border border-studio-800 text-xs shrink-0"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-studio-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-white">{member.name}</span>
                <InstrumentIcon instrument={member.instrument} size="xs" showLabel />
                {member.role === 'director' ? (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    DIRECTOR
                  </span>
                ) : (
                  isAdmin && (
                    <button
                      onClick={() =>
                        handleRemoveMember(member.userId, member.name)
                      }
                      className="text-studio-500 hover:text-rose-400 p-0.5 rounded"
                      title="Remove from Band"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )
                )}
              </div>
            ))}

            {isAdmin && (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-studio-900 hover:bg-studio-800 border border-dashed border-studio-700 text-xs text-amber-400 font-semibold transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Student
              </button>
            )}
          </div>

          <div className="text-xs text-studio-400 flex items-center gap-1.5 font-medium shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Target: {band.rehearsalSchedule || 'TBD'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-studio-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition',
            activeTab === 'chat'
              ? 'bg-amber-500 text-[var(--brand-contrast-text)] shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Chat Channel
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition',
            activeTab === 'announcements'
              ? 'bg-amber-500 text-[var(--brand-contrast-text)] shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <Megaphone className="w-4 h-4" />
          Announcements
        </button>

        <button
          onClick={() => setActiveTab('repertoire')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition',
            activeTab === 'repertoire'
              ? 'bg-amber-500 text-[var(--brand-contrast-text)] shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <ListMusic className="w-4 h-4" />
          Master Setlist
        </button>

        <button
          onClick={() => setActiveTab('suggestions')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition',
            activeTab === 'suggestions'
              ? 'bg-amber-500 text-[var(--brand-contrast-text)] shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <Sparkles className="w-4 h-4" />
          Song Suggestions & Voting
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition',
            activeTab === 'schedule'
              ? 'bg-amber-500 text-[var(--brand-contrast-text)] shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <Calendar className="w-4 h-4" />
          Rehearsal Schedule
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={clsx(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition',
            activeTab === 'roster'
              ? 'bg-amber-500 text-[var(--brand-contrast-text)] shadow-md shadow-amber-500/10'
              : 'text-studio-400 hover:text-white hover:bg-studio-900'
          )}
        >
          <Users className="w-4 h-4" />
          Roster ({band.members.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'chat' && (
        <BandChat
          band={band}
          onOpenSchedulePlanner={() => setActiveTab('schedule')}
        />
      )}

      {activeTab === 'announcements' && (
        <BandAnnouncementsTab band={band} />
      )}

      {activeTab === 'repertoire' && (
        <SetlistManager band={band} />
      )}

      {activeTab === 'suggestions' && (
        <SongSuggestionVoting band={band} />
      )}

      {activeTab === 'schedule' && (
        <RehearsalPlanner bandId={band.id} />
      )}

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {band.members.map((member) => {
            const studentDetails = DataStore.getUserById(member.userId);

            return (
              <div
                key={member.userId}
                className="bg-studio-900 border border-studio-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-studio-800 border-2 border-studio-700 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {member.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <InstrumentIcon
                        instrument={member.instrument}
                        size="xs"
                        showLabel
                      />
                      {member.role === 'director' && (
                        <Badge role="admin" />
                      )}
                    </div>
                  </div>
                </div>

                {studentDetails && (
                  <div className="space-y-2 text-xs pt-2 border-t border-studio-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-studio-400">Skill Level</span>
                      <Badge skill={studentDetails.skillLevel} />
                    </div>
                    {studentDetails.musicalStyles && (
                      <div>
                        <span className="text-studio-400 block mb-1">
                          Musical Styles:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {studentDetails.musicalStyles.map((style) => (
                            <span
                              key={style}
                              className="px-2 py-0.5 rounded bg-studio-950 border border-studio-800 text-[10px] text-studio-300"
                            >
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        preselectedBandId={band.id}
      />

      {/* Add Member Modal (Director) */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-studio-900 border border-studio-700 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Add Student to {band.name}
            </h3>
            <p className="text-xs text-studio-400 mb-4">
              Select an available student from the roster and designate their instrument.
            </p>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Select Student
                </label>
                <select
                  value={selectedStudentToAdd}
                  onChange={(e) => {
                    setSelectedStudentToAdd(e.target.value);
                    const s = DataStore.getUserById(e.target.value);
                    if (s) setSelectedInstrumentToAdd(s.primaryInstrument);
                  }}
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Student --</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.primaryInstrument} • {s.skillLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Instrument in Band
                </label>
                <select
                  value={selectedInstrumentToAdd}
                  onChange={(e) =>
                    setSelectedInstrumentToAdd(
                      e.target.value as InstrumentType
                    )
                  }
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 capitalize"
                >
                  {[
                    'drums',
                    'bass',
                    'vocals',
                    'piano',
                    'keyboard',
                    'guitars',
                    'horns',
                  ].map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-studio-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl text-studio-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentToAdd}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                >
                  Add to Band
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
