'use client';

import React, { useState, useEffect } from 'react';
import { Band, BandSong, SongSentiment } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import {
  Sparkles,
  Plus,
  ThumbsUp,
  Heart,
  Smile,
  Meh,
  ThumbsDown,
  CheckCircle2,
  Lock,
  ArrowRight,
  Music,
  X,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SongSuggestionVotingProps {
  band: Band;
}

const SENTIMENT_OPTIONS: {
  id: SongSentiment;
  label: string;
  icon: typeof Heart;
  color: string;
  bg: string;
}[] = [
  {
    id: 'really_want',
    label: 'Really want to play it',
    icon: Heart,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
  },
  {
    id: 'would_play',
    label: 'Would play it',
    icon: ThumbsUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    icon: Meh,
    color: 'text-studio-400',
    bg: 'bg-studio-800 border-studio-700 text-studio-300',
  },
  {
    id: 'not_interested',
    label: 'Not interested',
    icon: ThumbsDown,
    color: 'text-slate-400',
    bg: 'bg-slate-800/80 border-slate-700 text-slate-400',
  },
];

export function SongSuggestionVoting({ band }: SongSuggestionVotingProps) {
  const { currentUser, isAdmin } = useAuth();
  const [suggestedSongs, setSuggestedSongs] = useState<BandSong[]>([]);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Suggestion form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const refresh = () => {
      const allSongs = DataStore.getSongs(band.id);
      setSuggestedSongs(allSongs.filter((s) => s.status === 'suggested'));
    };

    refresh();
    const unsub = subscribeToStore(`songs:${band.id}`, refresh);
    return () => unsub();
  }, [band.id]);

  const handleSuggestSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !currentUser) return;

    DataStore.createSong({
      bandId: band.id,
      title: title.trim(),
      artist: artist.trim(),
      directorNotes: notes.trim() || undefined,
      status: 'suggested',
      suggestedBy: currentUser.id,
    });

    setTitle('');
    setArtist('');
    setNotes('');
    setIsSuggestModalOpen(false);
  };

  const handleVote = (songId: string, sentiment: SongSentiment) => {
    if (!currentUser) return;
    DataStore.castSongVote(songId, band.id, currentUser.id, sentiment);
  };

  const handlePromoteToRepertoire = (songId: string) => {
    if (!isAdmin) return;
    DataStore.updateSong(songId, { status: 'learning' });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-studio-900 border border-studio-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Song Suggestions & Anonymous Voting
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-studio-800 text-studio-300 font-mono">
              {suggestedSongs.length} Suggestions
            </span>
          </div>
          <p className="text-xs text-studio-400 mt-1 max-w-2xl leading-relaxed">
            Suggest songs for the band to learn. Submissions are anonymous to peers, and preference votes are compiled into aggregate sentiment bars. Director retains final repertoire authority.
          </p>
        </div>

        <button
          onClick={() => setIsSuggestModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Suggest a Song
        </button>
      </div>

      {/* Suggestion Cards */}
      {suggestedSongs.length === 0 ? (
        <div className="py-16 text-center bg-studio-950 border border-dashed border-studio-800 rounded-2xl p-6 text-studio-400">
          <Music className="w-10 h-10 text-studio-600 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">No song suggestions yet</h4>
          <p className="text-xs max-w-sm mx-auto mt-1">
            Be the first to suggest a track for {band.name} to learn and rehearse!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestedSongs.map((song) => {
            const summary = song.sentimentSummary || {
              reallyWant: 0,
              wouldPlay: 0,
              neutral: 0,
              notInterested: 0,
              totalVotes: 0,
            };

            const myVote = currentUser
              ? DataStore.getUserVote(song.id, currentUser.id)?.sentiment
              : undefined;

            const positiveCount = summary.reallyWant + summary.wouldPlay;
            const percentPositive =
              summary.totalVotes > 0
                ? Math.round((positiveCount / summary.totalVotes) * 100)
                : 0;

            return (
              <div
                key={song.id}
                className="bg-studio-900 border border-studio-800 rounded-2xl p-5 transition shadow-sm space-y-4 hover:border-studio-700"
              >
                {/* Header: Title, Artist, Anonymity Notice */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{song.title}</h4>
                      <span className="text-xs font-medium text-studio-400">
                        by {song.artist}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-studio-400">
                      {isAdmin && song.suggestedBy ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Suggested by {DataStore.getUserById(song.suggestedBy)?.name || 'Student'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-studio-500">
                          <Lock className="w-3 h-3 text-studio-500" />
                          Anonymous Member Suggestion
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Director Promote Action */}
                  {isAdmin && (
                    <button
                      onClick={() => handlePromoteToRepertoire(song.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition self-start sm:self-auto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Approve to Active Repertoire
                    </button>
                  )}
                </div>

                {/* Notes if any */}
                {song.directorNotes && (
                  <p className="text-xs text-studio-300 italic bg-studio-950 p-2.5 rounded-xl border border-studio-800">
                    &quot;{song.directorNotes}&quot;
                  </p>
                )}

                {/* Aggregate Sentiment Bar */}
                <div className="space-y-1.5 bg-studio-950 p-3 rounded-xl border border-studio-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-studio-400 font-semibold flex items-center gap-1.5">
                      Band Sentiment Aggregate ({summary.totalVotes} vote{summary.totalVotes === 1 ? '' : 's'})
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {percentPositive}% Positive
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-studio-800 rounded-full overflow-hidden flex">
                    {summary.totalVotes > 0 ? (
                      <>
                        <div
                          style={{
                            width: `${(summary.reallyWant / summary.totalVotes) * 100}%`,
                          }}
                          className="bg-rose-500"
                          title={`Really want: ${summary.reallyWant}`}
                        />
                        <div
                          style={{
                            width: `${(summary.wouldPlay / summary.totalVotes) * 100}%`,
                          }}
                          className="bg-emerald-500"
                          title={`Would play: ${summary.wouldPlay}`}
                        />
                        <div
                          style={{
                            width: `${(summary.neutral / summary.totalVotes) * 100}%`,
                          }}
                          className="bg-studio-500"
                          title={`Neutral: ${summary.neutral}`}
                        />
                        <div
                          style={{
                            width: `${(summary.notInterested / summary.totalVotes) * 100}%`,
                          }}
                          className="bg-slate-700"
                          title={`Not interested: ${summary.notInterested}`}
                        />
                      </>
                    ) : (
                      <div className="w-full bg-studio-800" />
                    )}
                  </div>

                  {/* Aggregate counts */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-studio-400 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Really want: <strong className="text-white">{summary.reallyWant}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Would play: <strong className="text-white">{summary.wouldPlay}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-studio-500" />
                      Neutral: <strong className="text-white">{summary.neutral}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      Not interested: <strong className="text-white">{summary.notInterested}</strong>
                    </span>
                  </div>
                </div>

                {/* Individual Private Voting Buttons (Only user sees their own selection) */}
                <div className="pt-2 border-t border-studio-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-studio-400 font-semibold">
                    Your Private Vote:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SENTIMENT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = myVote === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVote(song.id, opt.id)}
                          className={clsx(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border',
                            isSelected
                              ? opt.bg
                              : 'bg-studio-950 border-studio-800 text-studio-400 hover:border-studio-700 hover:text-white'
                          )}
                        >
                          <Icon className={clsx('w-3.5 h-3.5', isSelected ? '' : opt.color)} />
                          <span>{opt.label}</span>
                          {isSelected && <span className="text-xs font-black">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggest a Song Modal */}
      {isSuggestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-studio-900 border border-studio-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-studio-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Suggest Song to Band
              </h3>
              <button
                onClick={() => setIsSuggestModalOpen(false)}
                className="text-studio-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSuggestSong} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Song Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Superstition"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Artist / Band *
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Stevie Wonder"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Why would this song be great for the band? (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Great keyboard groove, fun brass lines, energetic tempo..."
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-studio-950 border border-studio-800 text-[11px] text-studio-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Your name is hidden from peers. Only aggregate votes are shown.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-studio-800">
                <button
                  type="button"
                  onClick={() => setIsSuggestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  Submit Suggestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
