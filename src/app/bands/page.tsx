'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { Band } from '@/types';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { CreateBandModal } from '@/components/bands/CreateBandModal';
import { QRCodeModal } from '@/components/QRCodeModal';
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
} from 'lucide-react';
import { clsx } from 'clsx';

export default function BandsPage() {
  const { isAdmin, currentUser, isStudent } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrBandId, setQrBandId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setBands(DataStore.getBands());
    refresh();
    const unsub = subscribeToStore('bands', refresh);
    return () => unsub();
  }, []);

  const genres = [
    'all',
    ...Array.from(new Set(bands.map((b) => b.genre.split('/')[0].trim()))),
  ];

  const filteredBands = bands.filter((band) => {
    const matchesSearch =
      band.name.toLowerCase().includes(search.toLowerCase()) ||
      band.genre.toLowerCase().includes(search.toLowerCase()) ||
      band.description.toLowerCase().includes(search.toLowerCase());

    const matchesGenre =
      selectedGenre === 'all' ||
      band.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    if (isStudent) {
      // Show bands where student is a member, or allow browsing
      return matchesSearch && matchesGenre;
    }
    return matchesSearch && matchesGenre;
  });

  const handleDeleteBand = (e: React.MouseEvent, bandId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to disband "${name}"?`)) {
      DataStore.deleteBand(bandId);
    }
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
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Band
          </button>
        )}
      </div>

      {/* Filters & Search */}
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

      {/* Band Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBands.map((band) => {
          const isMember = band.members.some((m) => m.userId === currentUser?.id);

          return (
            <div
              key={band.id}
              className="group bg-studio-900 border border-studio-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between"
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
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-amber-300 border border-white/10">
                      {band.genre}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeleteBand(e, band.id, band.name)}
                        className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-studio-400 hover:text-rose-400 transition"
                        title="Disband Band"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
              <div className="p-4 bg-studio-950/60 border-t border-studio-800/80 flex items-center justify-between">
                {isAdmin ? (
                  <button
                    onClick={() => setQrBandId(band.id)}
                    className="text-xs text-studio-400 hover:text-amber-300 flex items-center gap-1.5 transition font-semibold"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    Band Join QR
                  </button>
                ) : (
                  <span className="text-xs text-studio-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Director Supervised
                  </span>
                )}

                <Link
                  href={`/bands/${band.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Band Hub & Chat
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
        onSuccess={() => setBands(DataStore.getBands())}
      />
      {qrBandId && (
        <QRCodeModal
          isOpen={Boolean(qrBandId)}
          onClose={() => setQrBandId(null)}
          preselectedBandId={qrBandId}
        />
      )}
    </div>
  );
}
