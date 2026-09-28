'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Band, ChatMessage } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { InstrumentIcon } from '../InstrumentIcon';
import { Badge } from '../Badge';
import {
  Send,
  ShieldCheck,
  Calendar,
  Lock,
  Sparkles,
  Clock,
  Pin,
  MessageSquare,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface BandChatProps {
  band: Band;
  onOpenSchedulePlanner?: () => void;
}

export function BandChat({ band, onOpenSchedulePlanner }: BandChatProps) {
  const { currentUser, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = () => {
      setMessages(DataStore.getMessages(band.id));
    };

    loadMessages();
    const unsub = subscribeToStore(`messages:${band.id}`, loadMessages);
    return () => unsub();
  }, [band.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    DataStore.sendMessage(band.id, inputText.trim(), currentUser);
    setInputText('');
  };

  const handleQuickAvailability = (text: string) => {
    if (!currentUser) return;
    DataStore.sendMessage(band.id, text, currentUser);
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
    <div className="flex flex-col h-[520px] sm:h-[650px] bg-studio-950 border border-studio-800 rounded-2xl overflow-hidden shadow-xl w-full max-w-full">
      {/* Channel Header */}
      <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-studio-900 border-b border-studio-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">
                #{band.name.toLowerCase().replace(/\s+/g, '-')}-chat
              </h3>
              <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-studio-400 flex items-center gap-1.5 sm:gap-2 mt-0.5 truncate">
              <span>{band.members.length} Members</span>
              <span>•</span>
              <span className="text-amber-400 font-medium flex items-center gap-1 truncate">
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Director Oversight</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action: Director can open scheduling modal directly from chat discussions */}
        {isAdmin && onOpenSchedulePlanner && (
          <button
            type="button"
            onClick={onOpenSchedulePlanner}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold transition shadow-sm shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Schedule</span>
          </button>
        )}
      </div>

      {/* Mandated Presence Notice Banner */}
      <div className="px-3.5 sm:px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] sm:text-xs text-amber-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="truncate">
            <strong>Director Oversight Active:</strong> {directorLabel} monitoring
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-studio-400">
            <MessageSquare className="w-12 h-12 text-studio-600 mb-2" />
            <p className="font-semibold text-studio-300">No messages yet</p>
            <p className="text-xs max-w-sm mt-1">
              Start the discussion! Share your weekly practice availability and song preferences.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const isMsgAdmin = msg.senderRole === 'admin';

            return (
              <div
                key={msg.id}
                className={clsx(
                  'flex gap-3 max-w-[85%]',
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto',
                  msg.isPinnedRehearsalNotice && 'w-full max-w-full'
                )}
              >
                {/* Avatar */}
                {!msg.isPinnedRehearsalNotice && (
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover border border-studio-700 bg-studio-800"
                    />
                    {isMsgAdmin && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                )}

                {/* Content Bubble */}
                <div
                  className={clsx(
                    'flex flex-col',
                    isMe && !msg.isPinnedRehearsalNotice && 'items-end'
                  )}
                >
                  {/* Sender meta */}
                  {!msg.isPinnedRehearsalNotice && (
                    <div
                      className={clsx(
                        'flex items-center gap-1.5 text-xs mb-1',
                        isMe ? 'flex-row-reverse text-right' : 'text-left'
                      )}
                    >
                      <span className="font-bold text-white text-xs">
                        {msg.senderName}
                      </span>
                      {isMsgAdmin ? (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
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
                      <span className="text-[10px] text-studio-400">
                        {format(new Date(msg.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  )}

                  {/* Bubble text */}
                  {msg.isPinnedRehearsalNotice ? (
                    <div className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-studio-900 to-amber-500/10 border border-amber-500/40 shadow-lg">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5">
                        <Pin className="w-3.5 h-3.5 text-amber-400" />
                        <span>OFFICIAL REHEARSAL ANNOUNCEMENT</span>
                        <span className="text-studio-400 font-normal">
                          • {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-studio-100 font-medium">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={clsx(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
                        isMe
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-br-sm'
                          : isMsgAdmin
                          ? 'bg-studio-900 border border-amber-500/30 text-white rounded-bl-sm'
                          : 'bg-studio-900 border border-studio-800 text-studio-100 rounded-bl-sm'
                      )}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Student Availability Quick-Prompt Pop-Down Menu */}
      <div className="px-3.5 sm:px-4 py-2 bg-studio-900/80 border-t border-studio-800/80 flex items-center justify-between gap-2 text-xs">
        <span className="text-studio-400 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Availability:</span>
        </span>
        <div className="relative flex-1 max-w-xs">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                handleQuickAvailability(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full bg-studio-950 border border-studio-700/80 rounded-lg px-2.5 py-1.5 text-base sm:text-xs font-medium text-amber-300 focus:outline-none focus:border-amber-500 appearance-none pr-7 cursor-pointer"
          >
            <option value="" disabled>⚡ Choose message to send... ▾</option>
            <option value="I'm free this Tuesday & Thursday after 4:30 PM!">Free Tue/Thu after 4:30pm</option>
            <option value="Saturday morning 10am works best for my instrument practice.">Sat 10am works best</option>
            <option value="I have a conflict on Wednesday afternoons, any other day is good.">Wednesday afternoon conflict</option>
            <option value="Ready for rehearsal this weekend! Let me know call time.">Ready for weekend rehearsal</option>
            <option value="Need 30-min call time heads up before rehearsals.">Need 30-min call time heads up</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400 text-[10px] font-bold">
            ▼
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 sm:p-3 bg-studio-900 border-t border-studio-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isAdmin
              ? 'Post instruction, answer availability, or direct band...'
              : `Chat as ${currentUser?.name || 'student'}...`
          }
          className="flex-1 bg-studio-950 border border-studio-700 rounded-xl px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition min-w-0"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition shadow-sm shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
