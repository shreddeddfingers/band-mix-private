'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { isFirebaseConfigured } from '@/lib/firebase';
import { FirestoreService } from '@/lib/firestore-service';
import { Band, InstrumentType, UserProfile, ChatMessage } from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { Badge } from '@/components/Badge';
import { BandChat } from '@/components/chat/BandChat';
import { RehearsalPlanner } from '@/components/scheduling/RehearsalPlanner';
import { QRCodeModal } from '@/components/QRCodeModal';
import { StudentProfileModal } from '@/components/roster/StudentProfileModal';
import { BandAnnouncementsTab } from '@/components/announcements/BandAnnouncementsTab';
import { SetlistManager } from '@/components/repertoire/SetlistManager';
import { SongSuggestionVoting } from '@/components/repertoire/SongSuggestionVoting';
import { ChangeBandCoverModal } from '@/components/bands/ChangeBandCoverModal';
import { BandStoriesBar } from '@/components/social/BandStoriesBar';
import {
  Music,
  Calendar,
  MessageSquare,
  MessageCircle,
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
  Camera,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function BandHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAdmin, currentUser, isAuthLoading } = useAuth();
  const [band, setBand] = useState<Band | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'songs' | 'schedule'>('feed');
  const [songsSubTab, setSongsSubTab] = useState<'setlist' | 'voting'>('setlist');
  const [bandMessages, setBandMessages] = useState<ChatMessage[]>([]);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isChangeCoverOpen, setIsChangeCoverOpen] = useState(false);
  const [viewProfileStudent, setViewProfileStudent] = useState<UserProfile | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [selectedInstrumentToAdd, setSelectedInstrumentToAdd] = useState<InstrumentType>('guitars');

  // Restore saved active tab on page mount/refresh (URL query param or localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'chat' || tabParam === 'songs' || tabParam === 'schedule' || tabParam === 'feed') {
      setActiveTab(tabParam);
      return;
    }
    const saved = localStorage.getItem(`band_${resolvedParams.id}_activeTab`);
    if (saved === 'chat' || saved === 'songs' || saved === 'schedule' || saved === 'feed') {
      setActiveTab(saved);
    }
  }, [resolvedParams.id]);

  const handleTabChange = (newTab: 'feed' | 'chat' | 'songs' | 'schedule') => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`band_${resolvedParams.id}_activeTab`, newTab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', newTab);
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Real-time messages sync at page level
  useEffect(() => {
    const refreshMsgs = () => {
      setBandMessages(DataStore.getMessages(resolvedParams.id));
    };

    refreshMsgs();
    const unsubLocal = subscribeToStore(`messages:${resolvedParams.id}`, refreshMsgs);

    let unsubFirestore: (() => void) | undefined;
    if (isFirebaseConfigured) {
      FirestoreService.getMessages(resolvedParams.id)
        .then((remoteMsgs) => {
          if (remoteMsgs && remoteMsgs.length > 0) {
            setBandMessages(remoteMsgs);
            DataStore.mergeRemoteMessages(resolvedParams.id, remoteMsgs);
          }
        })
        .catch(console.error);

      unsubFirestore = FirestoreService.subscribeMessages(resolvedParams.id, (remoteMsgs) => {
        if (remoteMsgs) {
          setBandMessages(remoteMsgs);
          DataStore.mergeRemoteMessages(resolvedParams.id, remoteMsgs);
        }
      });
    }

    return () => {
      unsubLocal();
      if (unsubFirestore) unsubFirestore();
    };
  }, [resolvedParams.id]);

  useEffect(() => {
    const refresh = () => {
      const b = DataStore.getBand(resolvedParams.id);
      if (b) {
        setBand({ ...b });
      }
    };

    refresh();
    const unsubBands = subscribeToStore('bands', refresh);
    const unsubStudents = subscribeToStore('students', refresh);

    let unsubFirestore: (() => void) | undefined;
    if (isFirebaseConfigured) {
      FirestoreService.getBand(resolvedParams.id)
        .then((remoteB) => {
          if (remoteB) {
            DataStore.mergeRemoteBands([remoteB]);
            const b = DataStore.getBand(resolvedParams.id) || remoteB;
            setBand({ ...b });
          }
        })
        .catch(console.error);

      unsubFirestore = FirestoreService.subscribeBand(resolvedParams.id, (remoteB) => {
        if (remoteB) {
          DataStore.mergeRemoteBands([remoteB]);
          const b = DataStore.getBand(resolvedParams.id) || remoteB;
          setBand({ ...b });
        }
      });
    }

    return () => {
      unsubBands();
      unsubStudents();
      if (unsubFirestore) unsubFirestore();
    };
  }, [resolvedParams.id]);

  if (isAuthLoading || !band) {
    return (
      <div className="py-20 text-center">
        <p className="text-studio-400">Loading ensemble hub...</p>
      </div>
    );
  }

  const isMember =
    band.members?.some((m) => m.userId === currentUser?.id) ||
    Boolean(currentUser?.bandIds && currentUser.bandIds.includes(band.id));

  if (!isAdmin && !isMember) {
    const studentBands = currentUser
      ? DataStore.getBands().filter(
          (b) =>
            b.members?.some((m) => m.userId === currentUser.id) ||
            (currentUser.bandIds && currentUser.bandIds.includes(b.id))
        )
      : [];
    const myBand = studentBands[0];

    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Access Restricted</h2>
        <p className="text-sm text-studio-400 leading-relaxed">
          You are not enrolled in <strong>{band.name}</strong>. Student musicians are only permitted to access their assigned band and band page.
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

  const handleRemoveMember = (userId: string, memberName: string) => {
    if (!isAdmin) return;
    if (confirm(`Remove ${memberName} from this band?`)) {
      DataStore.removeMemberFromBand(band.id, userId);
      setBand((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.userId !== userId),
              memberIds: (prev.memberIds || []).filter((id) => id !== userId),
            }
          : null
      );
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedStudentToAdd) return;

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
      {/* Back button (directors or students with multiple bands) */}
      {isAdmin && (
        <div>
          <Link
            href="/bands"
            className="inline-flex items-center gap-1.5 text-xs text-studio-400 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Bands
          </Link>
        </div>
      )}

      {/* Instagram / Facebook Style Band Profile Header */}
      <div className="relative rounded-3xl bg-studio-900 border border-studio-800 overflow-hidden shadow-2xl">
        {/* Cover Photo Banner */}
        <div className="relative h-44 sm:h-56 bg-studio-950 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              band.coverImage ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1000'
            }
            alt={band.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-studio-950 via-studio-950/60 to-transparent" />

          {/* Instagram-Style Top-Right Header Actions (Band Chat, Photo, QR Pass) */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {/* Instagram Band Chat Button */}
            <button
              type="button"
              onClick={() => handleTabChange(activeTab === 'chat' ? 'feed' : 'chat')}
              className={clsx(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition active:scale-95 border backdrop-blur-md',
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 border-pink-400 text-white shadow-pink-500/30'
                  : 'bg-black/75 hover:bg-black/90 border-white/20 text-white'
              )}
              title={activeTab === 'chat' ? 'Return to Band Feed' : 'Open Band Chat'}
            >
              <MessageCircle className="w-4 h-4 text-pink-400 stroke-[2.5]" />
              <span>{activeTab === 'chat' ? 'Feed' : 'Band Chat'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {bandMessages.length > 0 && activeTab !== 'chat' && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-pink-500 text-white leading-none">
                  {bandMessages.length}
                </span>
              )}
            </button>

            {(isAdmin || isMember) && (
              <button
                type="button"
                onClick={() => setIsChangeCoverOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 active:scale-95 text-white text-xs font-semibold border border-white/20 backdrop-blur-md transition shadow-md"
                title="Change band cover picture"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">Photo</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 active:scale-95 text-white text-xs font-semibold border border-white/20 backdrop-blur-md transition shadow-md"
                title="Invite student with QR Intake Pass"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">QR Pass</span>
              </button>
            )}
          </div>
        </div>

        {/* Instagram Profile Info & Stats */}
        <div className="px-4 sm:px-6 pb-5 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            {/* Band Avatar with Story Ring */}
            <div className="flex items-end gap-3.5">
              <div className="relative p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full shadow-2xl shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-studio-950 border-4 border-studio-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      band.coverImage ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=250'
                    }
                    alt={band.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {(isAdmin || isMember) && (
                  <button
                    type="button"
                    onClick={() => setIsChangeCoverOpen(true)}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-500 text-slate-950 border-2 border-studio-900 shadow-md hover:bg-amber-400 active:scale-95 transition"
                    title="Change picture"
                  >
                    <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>

              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {band.name}
                  </h1>
                  <span className="text-amber-400 text-sm font-bold" title="Verified Ensemble">
                    ✓
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {band.genre}
                  </span>
                </div>
                <p className="text-xs text-studio-400 mt-0.5 flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 inline" />
                  <span>Director {DataStore.getDirector(band.directorId || band.createdBy)?.name || 'Studio Director'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Instagram Bio / Description */}
          {band.description && (
            <p className="text-xs sm:text-sm text-studio-200 max-w-2xl mb-3 leading-relaxed">
              {band.description}
            </p>
          )}

          {/* Instagram Stats Row */}
          <div className="flex items-center gap-3 sm:gap-6 py-2.5 px-3.5 rounded-2xl bg-studio-950/70 border border-studio-800/80 text-xs overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleTabChange('feed')}
              className="flex items-center gap-1.5 hover:text-amber-400 transition shrink-0"
            >
              <strong className="text-white font-extrabold">{DataStore.getAnnouncements(band.id).length}</strong>
              <span className="text-studio-400">Posts</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleTabChange('chat')}
              className="flex items-center gap-1.5 hover:text-amber-400 transition shrink-0"
            >
              <strong className="text-white font-extrabold">{bandMessages.length}</strong>
              <span className="text-studio-400">Chat</span>
            </button>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-studio-300 shrink-0">
              <strong className="text-white font-extrabold">{band.members.length}</strong>
              <span className="text-studio-400">Musicians</span>
            </div>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleTabChange('songs')}
              className="flex items-center gap-1.5 hover:text-amber-400 transition shrink-0"
            >
              <strong className="text-white font-extrabold">{DataStore.getSongs(band.id).length}</strong>
              <span className="text-studio-400">Songs</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => handleTabChange('schedule')}
              className="hidden sm:flex items-center gap-1 text-studio-300 hover:text-amber-400 transition truncate"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Target: {band.rehearsalSchedule || 'TBD'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instagram Stories Bar: Band Members & Profiles */}
      <BandStoriesBar
        band={band}
        currentUserId={currentUser?.id}
        onSelectMember={(member, studentDetails) => {
          if (studentDetails) {
            setViewProfileStudent(studentDetails);
          } else {
            const user = DataStore.getUserById(member.userId);
            if (user) setViewProfileStudent(user);
          }
        }}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenChangeCover={() => setIsChangeCoverOpen(true)}
        isAdmin={isAdmin}
      />

      {/* Primary Navigation - 4 Clean Segmented Buttons & Apple Pop-Down (Zero Horizontal Scrolling) */}
      <div className="bg-studio-900 border border-studio-800 rounded-2xl p-2 sm:p-2.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* 4 Clean Segmented Buttons that fit smoothly on mobile without horizontal scrolling */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleTabChange('feed')}
            className={clsx(
              'flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition shadow-sm active:scale-95',
              activeTab === 'feed'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                : 'bg-studio-950 hover:bg-studio-800 text-studio-300 hover:text-white'
            )}
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span>Feed</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('chat')}
            className={clsx(
              'relative flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition shadow-sm active:scale-95',
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white font-extrabold shadow-pink-500/20'
                : 'bg-studio-950 hover:bg-studio-800 text-studio-300 hover:text-white'
            )}
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0 text-pink-400" />
            <span>Chat</span>
            {bandMessages.length > 0 && (
              <span
                className={clsx(
                  'text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-full leading-none shrink-0',
                  activeTab === 'chat'
                    ? 'bg-white/25 text-white'
                    : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                )}
              >
                {bandMessages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('songs')}
            className={clsx(
              'flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition shadow-sm active:scale-95',
              activeTab === 'songs'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                : 'bg-studio-950 hover:bg-studio-800 text-studio-300 hover:text-white'
            )}
          >
            <ListMusic className="w-3.5 h-3.5 shrink-0" />
            <span>Songs</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('schedule')}
            className={clsx(
              'flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition shadow-sm active:scale-95',
              activeTab === 'schedule'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                : 'bg-studio-950 hover:bg-studio-800 text-studio-300 hover:text-white'
            )}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Apple Pop-Down Controller */}
        <div className="relative w-full sm:w-64 shrink-0">
          <select
            value={activeTab}
            onChange={(e) => handleTabChange(e.target.value as any)}
            className="w-full bg-studio-950 border border-studio-700/80 rounded-xl px-3 py-2 text-base sm:text-xs font-bold text-white focus:outline-none focus:border-amber-400 appearance-none pr-8 cursor-pointer"
          >
            <option value="feed">📢 Band Feed (Updates &amp; Wall)</option>
            <option value="chat">💬 Band Chat ({bandMessages.length} messages)</option>
            <option value="songs">🎵 Songs, Setlist &amp; Voting</option>
            <option value="schedule">📅 Rehearsal Schedule</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-studio-400 text-xs font-bold">
            ▼
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      {/* 1. Band Chat Panel */}
      {activeTab === 'chat' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleTabChange('feed')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-studio-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Band Feed</span>
            </button>
            <span className="text-xs text-studio-400 font-medium">
              Live sync • {bandMessages.length} {bandMessages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
          <BandChat
            band={band}
            onOpenSchedulePlanner={() => handleTabChange('schedule')}
          />
        </div>
      )}

      {/* 2. Band Feed (Default Wall) */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Quick Jump to Active Band Chat Banner */}
          <div
            onClick={() => handleTabChange('chat')}
            className="cursor-pointer group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-studio-900 to-studio-900 border border-purple-500/30 hover:border-purple-500/60 shadow-lg transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px] shrink-0">
                <div className="w-full h-full rounded-full bg-studio-950 flex items-center justify-center text-amber-400">
                  <MessageCircle className="w-5 h-5 text-pink-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                    Band Chat
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-studio-400 font-medium">
                    ({bandMessages.length} {bandMessages.length === 1 ? 'message' : 'messages'})
                  </span>
                </div>
                <p className="text-xs text-studio-300 truncate mt-0.5">
                  {bandMessages.length > 0 ? (
                    <>
                      <strong className="text-white">
                        {bandMessages[bandMessages.length - 1].senderName}:
                      </strong>{' '}
                      {bandMessages[bandMessages.length - 1].text}
                    </>
                  ) : (
                    'Tap here to chat with your bandmates in real-time!'
                  )}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold group-hover:bg-purple-500 group-hover:text-white transition">
              <span>Open Chat</span>
              <span>→</span>
            </div>
          </div>

          <BandAnnouncementsTab band={band} />
        </div>
      )}

      {/* 3. Unified Songs & Setlist Area (Selecting a song & voting are inside) */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-studio-900 border border-studio-800 rounded-2xl p-2 shadow-md">
            <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSongsSubTab('setlist')}
                className={clsx(
                  'flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition shadow-sm active:scale-95',
                  songsSubTab === 'setlist'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                    : 'bg-studio-950 text-studio-300 hover:text-white'
                )}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Master Setlist ({DataStore.getSongs(band.id).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSongsSubTab('voting')}
                className={clsx(
                  'flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition shadow-sm active:scale-95',
                  songsSubTab === 'voting'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                    : 'bg-studio-950 text-studio-300 hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Song Voting &amp; Suggestions</span>
              </button>
            </div>
          </div>

          {songsSubTab === 'setlist' ? (
            <SetlistManager band={band} />
          ) : (
            <SongSuggestionVoting band={band} />
          )}
        </div>
      )}

      {/* 4. Schedule & Rehearsals */}
      {activeTab === 'schedule' && (
        <RehearsalPlanner bandId={band.id} />
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
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-amber-500 capitalize"
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

      {/* Student Profile & Questionnaire Modal */}
      <StudentProfileModal
        isOpen={Boolean(viewProfileStudent)}
        onClose={() => setViewProfileStudent(null)}
        student={viewProfileStudent}
        bands={band ? [band] : []}
        onDeleteStudent={async (student) => {
          if (
            confirm(
              `Permanently remove "${student.name}" from the studio roster? This deletes their account and removes them from all ensembles.`
            )
          ) {
            const targetId = student.id;
            setBand((prev) =>
              prev
                ? {
                    ...prev,
                    members: prev.members.filter((m) => m.userId !== targetId),
                    memberIds: (prev.memberIds || []).filter((id) => id !== targetId),
                  }
                : null
            );
            await DataStore.deleteStudent(targetId);
            if (band) {
              const updated = DataStore.getBand(band.id);
              if (updated) setBand({ ...updated });
            }
          }
        }}
        onStudentUpdated={(updated) => {
          setViewProfileStudent(updated);
          if (band) {
            const b = DataStore.getBand(band.id);
            if (b) setBand({ ...b });
          }
        }}
      />

      {band && (
        <ChangeBandCoverModal
          isOpen={isChangeCoverOpen}
          onClose={() => setIsChangeCoverOpen(false)}
          bandName={band.name}
          currentCover={band.coverImage}
          onSave={(newCoverUrl) => {
            DataStore.updateBand(band.id, { coverImage: newCoverUrl });
            setBand((prev) => (prev ? { ...prev, coverImage: newCoverUrl } : prev));
          }}
        />
      )}
    </div>
  );
}
