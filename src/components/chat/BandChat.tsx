'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Band, ChatMessage } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { FirestoreService } from '@/lib/firestore-service';
import { isFirebaseConfigured } from '@/lib/firebase';
import { InstrumentIcon } from '../InstrumentIcon';
import {
  Send,
  ShieldCheck,
  Calendar,
  Lock,
  Sparkles,
  Clock,
  Pin,
  Smile,
  Heart,
  CheckCheck,
  Info,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface BandChatProps {
  band: Band;
  onOpenSchedulePlanner?: () => void;
  onOpenRoster?: () => void;
}

const QUICK_EMOJIS = ['❤️', '🔥', '🎸', '🤘', '🥁', '🎤', '🎹', '👏', '😂', '🙌'];

const QUICK_PROMPTS = [
  'Free this Tue/Thu after 4:30 PM!',
  'Sat 10 AM works best for me!',
  'Ready for rehearsal this weekend!',
  'Working on the bridge section now 🎸',
  'Need 30-min call time heads up before rehearsals.',
];

export function BandChat({ band, onOpenSchedulePlanner, onOpenRoster }: BandChatProps) {
  const { currentUser, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = () => {
      setMessages(DataStore.getMessages(band.id));
    };

    loadMessages();
    const unsubLocal = subscribeToStore(`messages:${band.id}`, loadMessages);

    let unsubFirestore: (() => void) | undefined;
    if (isFirebaseConfigured) {
      FirestoreService.getMessages(band.id)
        .then((remoteMsgs) => {
          if (remoteMsgs && remoteMsgs.length > 0) {
            setMessages(remoteMsgs);
            DataStore.mergeRemoteMessages(band.id, remoteMsgs);
          }
        })
        .catch(console.error);

      unsubFirestore = FirestoreService.subscribeMessages(band.id, (remoteMsgs) => {
        if (remoteMsgs) {
          setMessages(remoteMsgs);
          DataStore.mergeRemoteMessages(band.id, remoteMsgs);
        }
      });
    }

    return () => {
      unsubLocal();
      if (unsubFirestore) unsubFirestore();
    };
  }, [band.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    DataStore.sendMessage(band.id, inputText.trim(), currentUser);
    setMessages(DataStore.getMessages(band.id));
    setInputText('');
    setShowEmojiPicker(false);
    setShowQuickPrompts(false);
  };

  const handleSendPrompt = (promptText: string) => {
    if (!currentUser) return;
    DataStore.sendMessage(band.id, promptText, currentUser);
    setMessages(DataStore.getMessages(band.id));
    setShowQuickPrompts(false);
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    DataStore.toggleMessageReaction(band.id, messageId, emoji, currentUser.id);
    setActiveReactionMsgId(null);
  };

  const bandDirector =
    (band.directorId ? DataStore.getDirector(band.directorId) : null) ||
    (band.createdBy ? DataStore.getDirector(band.createdBy) : null) ||
    (isAdmin && currentUser ? currentUser : DataStore.getDirector());

  const rawDirectorName = bandDirector?.name || 'Director';
  const directorLabel = rawDirectorName.toLowerCase().startsWith('director')
    ? rawDirectorName
    : `Director ${rawDirectorName}`;

  return (
    <div className="flex flex-col h-[560px] sm:h-[680px] bg-studio-950 border border-studio-800/90 rounded-3xl overflow-hidden shadow-2xl w-full max-w-full">
      {/* Instagram Direct Group Header */}
      <div className="px-4 py-3 sm:py-3.5 bg-studio-900/95 backdrop-blur-md border-b border-studio-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Group Avatar Stack (IG Style) */}
          <div className="relative shrink-0 flex -space-x-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  band.coverImage ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=250'
                }
                alt={band.name}
                className="w-full h-full object-cover rounded-full bg-studio-900"
              />
            </div>
            {band.members[0] && (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-studio-900 overflow-hidden bg-studio-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={band.members[0].avatar}
                  alt={band.members[0].name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">
                {band.name}
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
            </div>
            <div className="text-[11px] text-studio-400 flex items-center gap-1.5 truncate">
              <span className="text-emerald-400 font-medium">Active now</span>
              <span>•</span>
              <span className="text-studio-300 font-medium">{messages.length} messages</span>
              <span>•</span>
              <span>{band.members.length} members</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex text-amber-400/90 font-medium truncate items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0 inline" />
                {directorLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons (Instagram Style) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onOpenRoster && (
            <button
              type="button"
              onClick={onOpenRoster}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-studio-800 active:scale-95 text-studio-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
              title="View Band Members"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Members</span>
            </button>
          )}

          {isAdmin && onOpenSchedulePlanner && (
            <button
              type="button"
              onClick={onOpenSchedulePlanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Schedule Rehearsal"
            >
              <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area (Instagram Direct Layout) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-studio-400 space-y-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-white text-base">Direct Band Chat</p>
              <p className="text-xs text-studio-400 max-w-xs mt-1">
                Say hello to your bandmates! Share song ideas, availability for rehearsal, or practice questions.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-2 max-w-sm">
              {QUICK_PROMPTS.slice(0, 2).map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendPrompt(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-studio-900 hover:bg-studio-800 text-amber-300 border border-studio-700 transition active:scale-95"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const isMsgAdmin = msg.senderRole === 'admin';
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

            return (
              <div
                key={msg.id}
                className={clsx(
                  'group relative flex gap-2.5 max-w-[85%] sm:max-w-[75%]',
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto',
                  msg.isPinnedRehearsalNotice && 'w-full max-w-full'
                )}
              >
                {/* Avatar (Instagram Group Chat Style) */}
                {!msg.isPinnedRehearsalNotice && (
                  <div className="relative shrink-0 self-end mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className={clsx(
                        'w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border bg-studio-800',
                        isMsgAdmin
                          ? 'border-amber-500 shadow-sm shadow-amber-500/30'
                          : 'border-studio-700'
                      )}
                    />
                    {isMsgAdmin && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>
                    )}
                  </div>
                )}

                {/* Content Bubble Column */}
                <div
                  className={clsx(
                    'flex flex-col min-w-0',
                    isMe && !msg.isPinnedRehearsalNotice && 'items-end'
                  )}
                >
                  {/* Sender Name & Meta */}
                  {!msg.isPinnedRehearsalNotice && !isMe && (
                    <div className="flex items-center gap-1.5 text-xs mb-1 px-1">
                      <span className="font-bold text-white text-xs">
                        {msg.senderName}
                      </span>
                      {isMsgAdmin ? (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Director
                        </span>
                      ) : (
                        msg.senderInstrument && (
                          <InstrumentIcon
                            instrument={msg.senderInstrument}
                            size="xs"
                            showLabel
                          />
                        )
                      )}
                      <span className="text-[10px] text-studio-500">
                        {format(new Date(msg.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  )}

                  {/* Message Card or Bubble */}
                  {msg.isPinnedRehearsalNotice ? (
                    <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-studio-900 to-amber-500/10 border border-amber-500/40 shadow-lg">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5">
                        <Pin className="w-3.5 h-3.5 text-amber-400" />
                        <span>REHEARSAL ANNOUNCEMENT</span>
                        <span className="text-studio-400 font-normal">
                          • {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-studio-100 font-medium">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div className="relative group/bubble">
                      {/* Bubble */}
                      <div
                        onDoubleClick={() => handleToggleReaction(msg.id, '❤️')}
                        className={clsx(
                          'px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all',
                          isMe
                            ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white font-medium rounded-2xl rounded-br-xs'
                            : isMsgAdmin
                            ? 'bg-studio-900 border border-amber-500/40 text-white rounded-2xl rounded-bl-xs'
                            : 'bg-studio-850 border border-studio-800 text-studio-100 rounded-2xl rounded-bl-xs'
                        )}
                      >
                        {msg.text}
                      </div>

                      {/* Floating Quick-React Trigger (Hover / Tap button like IG/Messenger) */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReactionMsgId(
                            activeReactionMsgId === msg.id ? null : msg.id
                          )
                        }
                        className={clsx(
                          'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 rounded-full bg-studio-900 border border-studio-700 text-studio-400 hover:text-white hover:scale-110 shadow-md',
                          isMe ? '-left-8' : '-right-8'
                        )}
                        title="React to message"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick React Emoji Drawer Popover */}
                      {activeReactionMsgId === msg.id && (
                        <div
                          className={clsx(
                            'absolute -top-10 z-30 flex items-center gap-1 p-1 rounded-full bg-studio-900 border border-studio-700 shadow-xl backdrop-blur-md animate-in zoom-in-90 duration-150',
                            isMe ? 'right-0' : 'left-0'
                          )}
                        >
                          {QUICK_EMOJIS.slice(0, 6).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-studio-800 hover:scale-125 transition-transform text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Displayed Emoji Reactions Badges (Instagram Pill Style) */}
                      {hasReactions && (
                        <div
                          className={clsx(
                            'flex flex-wrap items-center gap-1 mt-1',
                            isMe ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {Object.entries(msg.reactions!).map(([emoji, userIds]) => {
                            const iReacted = currentUser
                              ? userIds.includes(currentUser.id)
                              : false;

                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={clsx(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition border active:scale-90',
                                  iReacted
                                    ? 'bg-purple-900/50 border-purple-500/60 text-white font-bold'
                                    : 'bg-studio-900/90 border-studio-700/80 text-studio-300 hover:border-studio-500'
                                )}
                              >
                                <span>{emoji}</span>
                                <span>{userIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sent Checkmark / Timestamp for Me */}
                  {isMe && !msg.isPinnedRehearsalNotice && (
                    <div className="flex items-center gap-1 text-[10px] text-studio-500 mt-0.5 px-1">
                      <span>{format(new Date(msg.timestamp), 'h:mm a')}</span>
                      <CheckCheck className="w-3 h-3 text-purple-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Status / Availability Chips (Instagram Story Reply Style) */}
      <div className="px-3.5 py-1.5 bg-studio-900/80 border-t border-studio-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          <span className="text-[11px] font-bold text-studio-400 whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Quick Send:</span>
          </span>
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendPrompt(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-studio-950 hover:bg-studio-800 text-amber-300/90 hover:text-amber-200 border border-studio-800 whitespace-nowrap transition active:scale-95 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Instagram Emoji Drawer */}
      {showEmojiPicker && (
        <div className="px-3 py-2 bg-studio-900 border-t border-studio-800 flex items-center gap-2 overflow-x-auto no-scrollbar animate-in slide-in-from-bottom-2 duration-150">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setInputText((prev) => prev + emoji)}
              className="text-xl p-1.5 rounded-xl hover:bg-studio-800 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Instagram Capsule Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-studio-900 border-t border-studio-800 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center gap-2 bg-studio-950 border border-studio-700/80 rounded-full px-4 py-2 focus-within:border-purple-500 transition shadow-inner">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-studio-400 hover:text-amber-400 transition"
            title="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isAdmin
                ? 'Message band as Director...'
                : `Message as ${currentUser?.name || 'student'}...`
            }
            className="flex-1 bg-transparent text-base sm:text-sm text-white placeholder-studio-500 focus:outline-none min-w-0"
          />
        </div>

        {/* Send Button: Gradient IG Circle */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 hover:opacity-90 active:scale-95 disabled:opacity-40 text-white font-bold flex items-center justify-center transition shadow-md shadow-pink-500/20 shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
