'use client';

import React, { useState, useEffect } from 'react';
import { Band, BandSong, SongStatus } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import {
  ListMusic,
  Plus,
  Trash2,
  Music,
  Clock,
  Sparkles,
  CheckCircle2,
  Edit2,
  X,
  Mic,
  Disc,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SetlistManagerProps {
  band: Band;
}

const STATUS_CONFIG: Record<
  SongStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  suggested: {
    label: 'Suggested',
    bg: 'bg-studio-800',
    text: 'text-studio-300',
    border: 'border-studio-700',
  },
  learning: {
    label: 'Learning',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
  },
  rehearsing: {
    label: 'Rehearsing',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  performance_ready: {
    label: 'Performance Ready',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  retired: {
    label: 'Retired',
    bg: 'bg-studio-900',
    text: 'text-studio-500',
    border: 'border-studio-800',
  },
};

export function SetlistManager({ band }: SetlistManagerProps) {
  const { isAdmin, currentUser } = useAuth();
  const [songs, setSongs] = useState<BandSong[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [tempoBpm, setTempoBpm] = useState('');
  const [vocalists, setVocalists] = useState('');
  const [directorNotes, setDirectorNotes] = useState('');
  const [status, setStatus] = useState<SongStatus>('learning');

  useEffect(() => {
    const refresh = () => {
      setSongs(DataStore.getSongs(band.id));
    };

    refresh();
    const unsub = subscribeToStore(`songs:${band.id}`, refresh);
    return () => unsub();
  }, [band.id]);

  const activeRepertoire = songs.filter((s) => s.status !== 'suggested');

  const filteredSongs = activeRepertoire.filter((s) => {
    if (activeFilter === 'all') return s.status !== 'retired';
    return s.status === activeFilter;
  });

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    DataStore.createSong({
      bandId: band.id,
      title: title.trim(),
      artist: artist.trim(),
      key: key.trim() || undefined,
      tempoBpm: tempoBpm ? parseInt(tempoBpm, 10) : undefined,
      vocalistAssignments: vocalists
        ? vocalists.split(',').map((v) => v.trim()).filter(Boolean)
        : undefined,
      directorNotes: directorNotes.trim() || undefined,
      status,
    });

    setTitle('');
    setArtist('');
    setKey('');
    setTempoBpm('');
    setVocalists('');
    setDirectorNotes('');
    setIsAddOpen(false);
  };

  const handleStatusChange = (songId: string, newStatus: SongStatus) => {
    if (!isAdmin) return;
    DataStore.updateSong(songId, { status: newStatus });
  };

  const handleDeleteSong = (songId: string, songTitle: string) => {
    if (!isAdmin) return;
    if (confirm(`Remove "${songTitle}" from master repertoire?`)) {
      DataStore.deleteSong(songId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-studio-900 border border-studio-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Master Band Repertoire & Setlist
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-studio-800 text-studio-300 font-mono">
              {activeRepertoire.length} Songs
            </span>
          </div>
          <p className="text-xs text-studio-400 mt-1">
            Active performance repertoire with keys, tempos, vocal assignments, and rehearsal readiness stages.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Repertoire Song
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Active Repertoire' },
          { id: 'learning', label: 'Learning' },
          { id: 'rehearsing', label: 'Rehearsing' },
          { id: 'performance_ready', label: 'Performance Ready' },
          { id: 'retired', label: 'Retired Archive' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border',
              activeFilter === tab.id
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-studio-900 border-studio-800 text-studio-400 hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Songs List */}
      {filteredSongs.length === 0 ? (
        <div className="py-16 text-center bg-studio-950 border border-dashed border-studio-800 rounded-2xl p-6 text-studio-400">
          <Disc className="w-10 h-10 text-studio-600 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">No songs in this view</h4>
          <p className="text-xs max-w-sm mx-auto mt-1">
            {isAdmin
              ? 'Add songs to the master repertoire or approve student suggestions from the voting tab.'
              : 'The Director has not added songs to this status category yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSongs.map((song) => {
            const statusConfig = STATUS_CONFIG[song.status];
            return (
              <div
                key={song.id}
                className="bg-studio-900 border border-studio-800 hover:border-studio-700 rounded-2xl p-5 transition shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        {song.title}
                      </h4>
                      <span className="text-xs font-semibold text-studio-400">
                        {song.artist}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={clsx(
                          'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border',
                          statusConfig.bg,
                          statusConfig.text,
                          statusConfig.border
                        )}
                      >
                        {statusConfig.label}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteSong(song.id, song.title)}
                          className="p-1 text-studio-500 hover:text-rose-400"
                          title="Remove Song"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Chips: Key, BPM, Vocals */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-studio-300 bg-studio-950 p-2.5 rounded-xl border border-studio-800">
                    {song.key && (
                      <span className="font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-studio-900 border border-studio-800">
                        Key: {song.key}
                      </span>
                    )}
                    {song.tempoBpm && (
                      <span className="font-mono text-studio-300 px-2 py-0.5 rounded bg-studio-900 border border-studio-800">
                        {song.tempoBpm} BPM
                      </span>
                    )}
                    {song.vocalistAssignments && song.vocalistAssignments.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-studio-300">
                        <Mic className="w-3 h-3 text-rose-400" />
                        {song.vocalistAssignments.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Director Notes */}
                  {song.directorNotes && (
                    <div className="text-xs text-studio-400 mt-2 italic bg-studio-950/40 p-2 rounded-lg border border-studio-800/80">
                      &quot;{song.directorNotes}&quot;
                    </div>
                  )}
                </div>

                {/* Director Quick Status Modifier */}
                {isAdmin && (
                  <div className="pt-2 border-t border-studio-800 flex items-center justify-between text-xs">
                    <span className="text-studio-400 font-medium">Stage:</span>
                    <select
                      value={song.status}
                      onChange={(e) =>
                        handleStatusChange(song.id, e.target.value as SongStatus)
                      }
                      className="bg-studio-950 border border-studio-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold capitalize"
                    >
                      <option value="learning">Learning</option>
                      <option value="rehearsing">Rehearsing</option>
                      <option value="performance_ready">Performance Ready</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Song Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-studio-900 border border-studio-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-studio-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-400" />
                Add Song to Master Repertoire
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-studio-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSong} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Song Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chameleon"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Original Artist / Composer *
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Herbie Hancock"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Musical Key
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. Bb Dorian / Am"
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                    Tempo (BPM)
                  </label>
                  <input
                    type="number"
                    value={tempoBpm}
                    onChange={(e) => setTempoBpm(e.target.value)}
                    placeholder="e.g. 112"
                    className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Vocalist / Soloist Assignments
                </label>
                <input
                  type="text"
                  value={vocalists}
                  onChange={(e) => setVocalists(e.target.value)}
                  placeholder="e.g. Julian (Lead), Maya (Harmonies)"
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Director Arrangement Notes
                </label>
                <textarea
                  rows={2}
                  value={directorNotes}
                  onChange={(e) => setDirectorNotes(e.target.value)}
                  placeholder="Specific solo order, bridge changes, horn intro..."
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Initial Repertoire Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SongStatus)}
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 capitalize"
                >
                  <option value="learning">Learning</option>
                  <option value="rehearsing">Rehearsing</option>
                  <option value="performance_ready">Performance Ready</option>
                </select>
              </div>

              <div className="pt-3 border-t border-studio-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  Add to Repertoire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
