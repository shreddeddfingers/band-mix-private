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
  Heart,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

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
      isPinned: isAdmin ? isPinned : false,
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
    if (confirm('Delete this post?')) {
      DataStore.deleteAnnouncement(id);
    }
  };

  const handleToggleLike = (annId: string) => {
    if (!currentUser) return;
    DataStore.toggleAnnouncementLike(band.id, annId, currentUser.id);
  };

  const handleAddComment = (annId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[annId]?.trim();
    if (!text || !currentUser) return;

    DataStore.addAnnouncementComment(band.id, annId, text, currentUser);
    setCommentInputs((prev) => ({ ...prev, [annId]: '' }));
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Facebook / Instagram "Create Post" Box */}
      <div className="bg-studio-900 border border-studio-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-studio-800 border border-studio-700 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
              }
              alt={currentUser?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-studio-950 hover:bg-studio-850 border border-studio-800 text-studio-400 hover:text-studio-200 text-sm font-medium transition cursor-pointer"
          >
            {isAdmin
              ? 'Post an official band announcement or rehearsal note...'
              : `Share an update with ${band.name}...`}
          </button>
        </div>

        {/* Quick action buttons row */}
        <div className="flex items-center justify-between border-t border-studio-800/80 mt-3 pt-2.5 px-1 text-xs text-studio-400 font-semibold">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 hover:text-amber-400 transition py-1"
          >
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>Announcement</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 hover:text-rose-400 transition py-1"
          >
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>Practice Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 hover:text-purple-400 transition py-1"
          >
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Event Update</span>
          </button>
        </div>
      </div>

      {/* Create Post Modal / Expand Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-studio-900 border border-studio-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-studio-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Create Band Feed Post</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full text-studio-400 hover:text-white hover:bg-studio-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title (e.g. Next Rehearsal Plan, Setlist Focus, Gig Call Time)"
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-2xl px-4 py-2.5 text-base sm:text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write post details, song links, or rehearsal reminders..."
                  rows={4}
                  required
                  className="w-full bg-studio-950 border border-studio-700 rounded-2xl p-4 text-base sm:text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {isAdmin && (
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-studio-300">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-studio-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Pin this post to the top of the Band Feed</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  Publish to Band
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feed Posts Stream (Facebook / Instagram Card Layout) */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-studio-900 border border-studio-800 rounded-3xl p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-studio-800 border border-studio-700 flex items-center justify-center mx-auto text-amber-400">
              <Megaphone className="w-7 h-7" />
            </div>
            <h4 className="text-white font-bold text-base">No Feed Posts Yet</h4>
            <p className="text-xs text-studio-400 max-w-sm mx-auto">
              Posts and announcements made here will be saved to your band wall for all members to view, like, and comment on.
            </p>
          </div>
        ) : (
          announcements.map((ann) => {
            const author = DataStore.getUserById(ann.authorId);
            const isAuthorAdmin =
              author?.role === 'admin' || ann.authorId === band.directorId;
            const likesCount = ann.likes ? ann.likes.length : 0;
            const isLikedByMe =
              currentUser && ann.likes ? ann.likes.includes(currentUser.id) : false;
            const commentsCount = ann.comments ? ann.comments.length : 0;
            const isCommentsOpen = activeCommentsPostId === ann.id;

            return (
              <div
                key={ann.id}
                className={clsx(
                  'bg-studio-900 border rounded-3xl overflow-hidden shadow-xl transition-all',
                  ann.isPinned
                    ? 'border-amber-500/40 shadow-amber-500/5'
                    : 'border-studio-800 hover:border-studio-750'
                )}
              >
                {/* Pinned Ribbon */}
                {ann.isPinned && (
                  <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-amber-500/20 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5" />
                    <span>PINNED ANNOUNCEMENT</span>
                  </div>
                )}

                {/* Post Header */}
                <div className="p-4 sm:p-5 pb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-full p-[2px] shrink-0',
                        isAuthorAdmin
                          ? 'bg-gradient-to-tr from-amber-400 to-amber-600'
                          : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          author?.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                        }
                        alt={ann.authorName}
                        className="w-full h-full object-cover rounded-full bg-studio-950"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm truncate">
                          {ann.authorName}
                        </span>
                        {isAuthorAdmin && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            Director
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-studio-400 block">
                        {format(new Date(ann.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>

                  {/* Director Post Controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(ann)}
                        className={clsx(
                          'p-1.5 rounded-full transition hover:bg-studio-800',
                          ann.isPinned
                            ? 'text-amber-400'
                            : 'text-studio-500 hover:text-studio-300'
                        )}
                        title={ann.isPinned ? 'Unpin post' : 'Pin to top'}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 rounded-full text-studio-500 hover:text-rose-400 hover:bg-studio-800 transition"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="px-4 sm:px-5 py-2 space-y-2">
                  <h4 className="font-bold text-white text-base leading-snug">
                    {ann.title}
                  </h4>
                  <p className="text-sm text-studio-200 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>
                </div>

                {/* Likes / Comments Counts (Facebook Style) */}
                {(likesCount > 0 || commentsCount > 0) && (
                  <div className="px-4 sm:px-5 pt-3 pb-1 text-xs text-studio-400 flex items-center justify-between border-t border-studio-800/60 mt-3">
                    <span className="flex items-center gap-1">
                      {likesCount > 0 && (
                        <>
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                            ❤️
                          </span>
                          <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
                        </>
                      )}
                    </span>
                    {commentsCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCommentsPostId(isCommentsOpen ? null : ann.id)
                        }
                        className="hover:underline"
                      >
                        {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
                      </button>
                    )}
                  </div>
                )}

                {/* Engagement Action Bar (Like, Comment, Share) */}
                <div className="px-4 sm:px-5 py-2 border-t border-studio-800 flex items-center justify-around text-xs font-semibold text-studio-400">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(ann.id)}
                    className={clsx(
                      'flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-studio-800 transition active:scale-95',
                      isLikedByMe ? 'text-rose-400 font-bold' : 'hover:text-white'
                    )}
                  >
                    <Heart
                      className={clsx(
                        'w-4 h-4',
                        isLikedByMe && 'fill-rose-500 text-rose-500'
                      )}
                    />
                    <span>{isLikedByMe ? 'Liked' : 'Like'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveCommentsPostId(isCommentsOpen ? null : ann.id)
                    }
                    className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-studio-800 hover:text-white transition active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                </div>

                {/* Inline Comment Thread */}
                {isCommentsOpen && (
                  <div className="bg-studio-950/90 border-t border-studio-800 p-4 space-y-3 animate-in fade-in duration-150">
                    {/* Comments List */}
                    {ann.comments && ann.comments.length > 0 ? (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {ann.comments.map((comm) => (
                          <div key={comm.id} className="flex gap-2.5 items-start">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={comm.authorAvatar}
                              alt={comm.authorName}
                              className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-studio-700"
                            />
                            <div className="bg-studio-900 border border-studio-800 rounded-2xl px-3.5 py-2 text-xs flex-1">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-bold text-white">
                                  {comm.authorName}
                                </span>
                                <span className="text-[10px] text-studio-500">
                                  {format(new Date(comm.createdAt), 'h:mm a')}
                                </span>
                              </div>
                              <p className="text-studio-200">{comm.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-studio-500 text-center py-1">
                        No comments yet. Be the first to reply!
                      </p>
                    )}

                    {/* Comment Input */}
                    <form
                      onSubmit={(e) => handleAddComment(ann.id, e)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        value={commentInputs[ann.id] || ''}
                        onChange={(e) =>
                          setCommentInputs({
                            ...commentInputs,
                            [ann.id]: e.target.value,
                          })
                        }
                        placeholder="Write a comment..."
                        className="flex-1 bg-studio-900 border border-studio-700 rounded-full px-4 py-2 text-xs text-white placeholder-studio-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[ann.id]?.trim()}
                        className="p-2 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 font-bold transition shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
