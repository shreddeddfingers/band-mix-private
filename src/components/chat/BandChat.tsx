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

  return (
    <div className="flex flex-col h-[650px] bg-studio-950 border border-studio-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Channel Header */}
      <div className="px-5 py-3.5 bg-studio-900 border-b border-studio-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">
                #{band.name.toLowerCase().replace(/\s+/g, '-')}-chat
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Channel
              </span>
            </div>
            <div className="text-xs text-studio-400 flex items-center gap-2 mt-0.5">
              <span>{band.members.length} Members</span>
              <span>•</span>
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                Director Mandated Presence
              </span>
            </div>
          </div>
        </div>

        {/* Action: Director can open scheduling modal directly from chat discussions */}
        {isAdmin && onOpenSchedulePlanner && (
          <button
            onClick={onOpenSchedulePlanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Rehearsal</span>
          </button>
        )}
      </div>

      {/* Mandated Presence Notice Banner */}
      <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Director Oversight Active:</strong> Director Marcus Vance is locked into this channel to coordinate rehearsals and monitor student communication.
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

      {/* Student Availability Quick-Prompt Chips */}
      <div className="px-4 py-2 bg-studio-900/60 border-t border-studio-800/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-studio-400 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          Availability Chips:
        </span>
        <button
          onClick={() =>
            handleQuickAvailability(
              "I'm free this Tuesday & Thursday after 4:30 PM!"
            )
          }
          className="px-2.5 py-1 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white border border-studio-700 text-xs whitespace-nowrap transition"
        >
          Free Tue/Thu after 4:30pm
        </button>
        <button
          onClick={() =>
            handleQuickAvailability(
              'Saturday morning 10am works best for my instrument practice.'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white border border-studio-700 text-xs whitespace-nowrap transition"
        >
          Sat 10am works for me
        </button>
        <button
          onClick={() =>
            handleQuickAvailability(
              'I have a conflict on Wednesday afternoons, any other day is good.'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white border border-studio-700 text-xs whitespace-nowrap transition"
        >
          Wednesday conflict
        </button>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-studio-900 border-t border-studio-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isAdmin
              ? 'Post instruction, answer availability, or direct the band...'
              : `Discuss rehearsal times or songs as ${currentUser?.name || 'student'}...`
          }
          className="flex-1 bg-studio-950 border border-studio-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition shadow-sm"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
