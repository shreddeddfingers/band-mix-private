'use client';

import React, { useState, useEffect } from 'react';
import { Band, BandAnnouncement } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import {
  Pin,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Megaphone,
  Edit2,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface BandAnnouncementsTabProps {
  band: Band;
}

export function BandAnnouncementsTab({ band }: BandAnnouncementsTabProps) {
  const { isAdmin, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<BandAnnouncement[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setAnnouncements(DataStore.getAnnouncements(band.id));
    };

    refresh();
    const unsub = subscribeToStore(`announcements:${band.id}`, refresh);
    return () => unsub();
  }, [band.id]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUser) return;

    DataStore.createAnnouncement({
      bandId: band.id,
      title: title.trim(),
      content: content.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      isPinned,
    });

    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsCreateOpen(false);
  };

  const handleTogglePin = (ann: BandAnnouncement) => {
    if (!isAdmin) return;
    DataStore.updateAnnouncement(ann.id, { isPinned: !ann.isPinned });
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (confirm('Delete this announcement?')) {
      DataStore.deleteAnnouncement(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-studio-900 border border-studio-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Persistent Band Announcements
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-studio-800 text-studio-300 font-mono">
              {announcements.length}
            </span>
          </div>
          <p className="text-xs text-studio-400 mt-1">
            Important Director notices and official band updates that remain pinned and saved outside the chat stream.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Post Announcement
          </button>
        )}
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="py-16 text-center bg-studio-950 border border-dashed border-studio-800 rounded-2xl p-6 text-studio-400">
          <Megaphone className="w-10 h-10 text-studio-600 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">No announcements yet</h4>
          <p className="text-xs max-w-sm mx-auto mt-1">
            Official communications from Director Marcus Vance will be posted here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={clsx(
                'p-5 rounded-2xl border transition shadow-sm space-y-3',
                ann.isPinned
                  ? 'bg-gradient-to-r from-amber-500/10 via-studio-900 to-studio-900 border-amber-500/40'
                  : 'bg-studio-900 border-studio-800'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {ann.isPinned && (
                    <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      <Pin className="w-3 h-3" /> Pinned Notice
                    </span>
                  )}
                  <h4 className="text-base font-bold text-white">{ann.title}</h4>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-studio-500 text-[11px]">
                    {format(new Date(ann.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(ann)}
                        className={clsx(
                          'p-1.5 rounded-lg transition',
                          ann.isPinned
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : 'text-studio-500 hover:text-white'
                        )}
                        title={ann.isPinned ? 'Unpin announcement' : 'Pin to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 rounded-lg text-studio-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-studio-200 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="pt-2 border-t border-studio-800/80 flex items-center justify-between text-[11px] text-studio-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Posted by Director {ann.authorName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-studio-900 border border-studio-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-studio-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                Post Persistent Announcement
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-studio-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rehearsal Room Change & Concert Charts"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                  Announcement Details
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the full message for the band members..."
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-studio-950 border-studio-700"
                />
                <label
                  htmlFor="pinNotice"
                  className="text-xs text-studio-300 font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  Pin this notice to top of announcements
                </label>
              </div>

              <div className="pt-3 border-t border-studio-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
