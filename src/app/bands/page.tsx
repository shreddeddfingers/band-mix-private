'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band } from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { CreateBandModal } from '@/components/bands/CreateBandModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import { BandHistoryModal } from '@/components/bands/BandHistoryModal';
import {
  Music,
  Plus,
  Search,
  Users,
  Clock,
  ArrowRight,
  Trash2,
  QrCode,
  ShieldCheck,
  MessageSquare,
  Archive,
  RotateCcw,
  History,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function BandsPage() {
  const { isAdmin, currentUser, isStudent, activeDirectorId } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrBandId, setQrBandId] = useState<string | null>(null);
  const [historyBandId, setHistoryBandId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setBands(DataStore.getBands(activeDirectorId));
    refresh();
    const unsub = subscribeToStore('bands', refresh);
    return () => unsub();
  }, [activeDirectorId]);

  const genres = [
    'all',
    ...Array.from(new Set(bands.map((b) => b.genre.split('/')[0].trim()))),
  ];

  const activeCount = bands.filter((b) => b.status !== 'archived').length;
  const archivedCount = bands.filter((b) => b.status === 'archived').length;

  const filteredBands = bands.filter((band) => {
    const matchesSearch =
      band.name.toLowerCase().includes(search.toLowerCase()) ||
      band.genre.toLowerCase().includes(search.toLowerCase()) ||
      band.description.toLowerCase().includes(search.toLowerCase());

    const matchesGenre =
      selectedGenre === 'all' ||
      band.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'archived'
        ? band.status === 'archived'
        : band.status !== 'archived';

    return matchesSearch && matchesGenre && matchesStatus;
  });

  const handleDeleteBand = (e: React.MouseEvent, bandId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      DataStore.deleteBand(bandId);
    }
  };

  const handleArchiveBand = (e: React.MouseEvent, bandId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (
      confirm(
        `Archive band "${name}"? This preserves its lineup, setlist repertoire, and event history for the archives.`
      )
    ) {
      DataStore.archiveBand(bandId);
    }
  };

  const handleReactivateBand = (e: React.MouseEvent, bandId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    DataStore.reactivateBand(bandId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Music className="w-7 h-7 text-amber-400" />
            Bands & Ensembles
          </h1>
          <p className="text-sm text-studio-400 mt-1">
            Organized student bands with instrument rosters, dedicated chat channels, and rehearsal schedules.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[var(--brand-contrast-text)] text-sm font-bold shadow-lg shadow-amber-500/20 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Band
          </button>
        )}
      </div>

      {/* Status & Search Filters */}
      <div className="space-y-3">
        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('active')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border',
              statusFilter === 'active'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                : 'bg-studio-900 border-studio-800 text-studio-400 hover:text-white'
            )}
          >
            <span>Active Ensembles</span>
            <span
              className={clsx(
                'text-[11px] px-2 py-0.5 rounded-full font-black',
                statusFilter === 'active'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-studio-800 text-studio-300'
              )}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('archived')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border',
              statusFilter === 'archived'
                ? 'bg-rose-500 text-slate-950 border-rose-500 shadow-md'
                : 'bg-studio-900 border-studio-800 text-studio-400 hover:text-white'
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Past Seasons (Archived)</span>
            <span
              className={clsx(
                'text-[11px] px-2 py-0.5 rounded-full font-black',
                statusFilter === 'archived'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-studio-800 text-studio-300'
              )}
            >
              {archivedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={clsx(
              'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border',
              statusFilter === 'all'
                ? 'bg-studio-800 text-white border-studio-700 shadow-md'
                : 'bg-studio-900 border-studio-800 text-studio-400 hover:text-white'
            )}
          >
            <span>All</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-black bg-studio-800 text-studio-300">
              {bands.length}
            </span>
          </button>
        </div>

        {/* Search & Genre bar */}
        <div className="flex flex-col md:flex-row items-center gap-3 bg-studio-900 border border-studio-800 p-3 rounded-2xl">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-studio-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search band name, genre, or description..."
              className="w-full bg-studio-950 border border-studio-700/80 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 md:pb-0">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition border',
                  selectedGenre === g
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-studio-950 border-studio-800 text-studio-400 hover:text-white'
                )}
              >
                {g === 'all' ? 'All Genres' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Band Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBands.map((band) => {
          const isMember = band.members.some((m) => m.userId === currentUser?.id);
          const isArchived = band.status === 'archived';

          return (
            <div
              key={band.id}
              className={clsx(
                'group bg-studio-900 border rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between',
                isArchived
                  ? 'border-rose-900/40 opacity-90'
                  : 'border-studio-800 hover:border-amber-500/50'
              )}
            >
              <div>
                {/* Band Cover */}
                <div className="relative h-44 bg-studio-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      band.coverImage ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'
                    }
                    alt={band.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-studio-900 via-studio-900/40 to-transparent" />

                  {/* Badges on cover */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-amber-300 border border-white/10">
                        {band.genre}
                      </span>
                      {isArchived && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/80 text-white backdrop-blur-sm">
                          Archived
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-xl">
                        {isArchived ? (
                          <button
                            onClick={(e) => handleReactivateBand(e, band.id)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition"
                            title="Reactivate Band"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleArchiveBand(e, band.id, band.name)}
                            className="p-1.5 rounded-lg text-studio-400 hover:text-amber-400 hover:bg-white/10 transition"
                            title="Archive Band Season"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteBand(e, band.id, band.name)}
                          className="p-1.5 rounded-lg text-studio-400 hover:text-rose-400 hover:bg-white/10 transition"
                          title="Permanently Delete Band"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isMember && (
                    <span className="absolute bottom-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                      Enrolled
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                    {band.name}
                  </h3>
                  <p className="text-xs text-studio-400 line-clamp-2 mt-1 leading-relaxed">
                    {band.description}
                  </p>

                  {/* Rehearsal Window */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 font-medium bg-studio-950 p-2 rounded-xl border border-studio-800/80">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{band.rehearsalSchedule || 'TBD'}</span>
                  </div>

                  {/* Member Instruments Visual List */}
                  <div className="mt-4 pt-3 border-t border-studio-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400 mb-2 flex items-center justify-between">
                      <span>Roster ({band.members.length})</span>
                      <span className="text-[10px] text-studio-400">
                        Instruments Filled
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {band.members.map((m) => (
                        <div
                          key={m.userId}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-studio-950 border border-studio-800/80 text-[11px] text-studio-200"
                        >
                          <InstrumentIcon instrument={m.instrument} size="xs" />
                          <span className="font-semibold text-white">
                            {m.name.split(' ')[0]}
                          </span>
                          {m.role === 'director' && (
                            <span className="text-[9px] text-amber-400 font-bold uppercase">
                              Dir
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-studio-950/60 border-t border-studio-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <button
                      onClick={() => setQrBandId(band.id)}
                      className="text-xs text-studio-400 hover:text-amber-300 flex items-center gap-1.5 transition font-semibold"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      QR
                    </button>
                  ) : (
                    <span className="text-xs text-studio-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Supervised
                    </span>
                  )}

                  <button
                    onClick={() => setHistoryBandId(band.id)}
                    className="text-xs text-studio-400 hover:text-amber-300 flex items-center gap-1.5 transition font-semibold"
                    title="View Band Season History Record"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    History
                  </button>
                </div>

                <Link
                  href={`/bands/${band.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Band Hub
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <CreateBandModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setBands(DataStore.getBands(activeDirectorId))}
      />
      {qrBandId && (
        <QRCodeModal
          isOpen={Boolean(qrBandId)}
          onClose={() => setQrBandId(null)}
          preselectedBandId={qrBandId}
        />
      )}
      {historyBandId && (
        <BandHistoryModal
          isOpen={Boolean(historyBandId)}
          bandId={historyBandId}
          onClose={() => setHistoryBandId(null)}
        />
      )}
    </div>
  );
}
