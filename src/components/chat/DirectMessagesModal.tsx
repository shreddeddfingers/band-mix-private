'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DirectMessage } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { FirestoreService } from '@/lib/firestore-service';
import { isFirebaseConfigured } from '@/lib/firebase';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import {
  MessageSquare,
  Send,
  X,
  Search,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  User,
  Clock,
  Music,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, isToday, isYesterday } from 'date-fns';

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudent?: UserProfile | null;
}

const DIRECTOR_QUICK_PROMPTS = [
  'Reminder: Rehearsal is coming up this week!',
  'Great work in our rehearsal session today! 🎸',
  'Please check the new setlist chart in your band hub.',
  'Let me know if you need any extra practice tempo charts.',
];

const STUDENT_QUICK_PROMPTS = [
  'Hi Director, quick question about rehearsal time!',
  'I practiced the new song chart! 🎸',
  'Need help with the chord changes in the bridge.',
  'Ready for the upcoming performance!',
];

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isToday(d)) {
      return format(d, 'h:mm a');
    }
    if (isYesterday(d)) {
      return `Yesterday ${format(d, 'h:mm a')}`;
    }
    return format(d, 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

export function DirectMessagesModal({
  isOpen,
  onClose,
  initialStudent = null,
}: DirectMessagesModalProps) {
  const { currentUser, isAdmin, activeDirectorId } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(initialStudent);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When initialStudent changes (e.g. director clicked "Message" on student card)
  useEffect(() => {
    if (initialStudent) {
      setSelectedStudent(initialStudent);
    }
  }, [initialStudent]);

  // Load students for director
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const refreshStudents = () => {
      if (isAdmin) {
        setStudents(DataStore.getStudents(activeDirectorId));
      }
    };

    refreshStudents();
    const unsub = subscribeToStore('students', refreshStudents);
    return () => unsub();
  }, [isOpen, currentUser, isAdmin, activeDirectorId]);

  // For student user: their direct message target is always their Director
  const studentDirector: UserProfile | null = !isAdmin && currentUser
    ? (currentUser.directorId ? DataStore.getDirector(currentUser.directorId) : DataStore.getDirector())
    : null;

  // Compute active target user
  const activeRecipient: UserProfile | null = isAdmin
    ? selectedStudent
    : studentDirector;

  const conversationId = currentUser && activeRecipient
    ? DataStore.getDmConversationId(currentUser.id, activeRecipient.id)
    : null;

  // Real-time messages sync for active conversation
  useEffect(() => {
    if (!isOpen || !conversationId || !currentUser) {
      setMessages([]);
      return;
    }

    const refreshLocal = () => {
      setMessages(DataStore.getDirectMessages(conversationId));
      DataStore.markDirectMessagesRead(conversationId, currentUser.id);
    };

    refreshLocal();
    const unsubLocal = subscribeToStore(`direct_messages:${conversationId}`, refreshLocal);

    let unsubFirestore: (() => void) | undefined;
    if (isFirebaseConfigured) {
      FirestoreService.getDirectMessages(conversationId)
        .then((remoteMsgs) => {
          if (remoteMsgs && remoteMsgs.length > 0) {
            DataStore.mergeRemoteDirectMessages(conversationId, remoteMsgs);
          }
        })
        .catch(console.error);

      unsubFirestore = FirestoreService.subscribeDirectMessages(conversationId, (remoteMsgs) => {
        if (remoteMsgs) {
          DataStore.mergeRemoteDirectMessages(conversationId, remoteMsgs);
        }
      });
    }

    return () => {
      unsubLocal();
      if (unsubFirestore) unsubFirestore();
    };
  }, [isOpen, conversationId, currentUser]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedStudent]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !currentUser || !activeRecipient) return;

    DataStore.sendDirectMessage({
      sender: currentUser,
      recipient: activeRecipient,
      text,
    });

    setInputText('');
  };

  if (!isOpen || !currentUser) return null;

  // Filter students for director view
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.primaryInstrument.toLowerCase().includes(q) ||
      (s.skillLevel && s.skillLevel.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-[92vh] sm:h-[680px] bg-studio-950 border border-studio-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Main Content: Either Student Selector or Conversation Thread */}
        {isAdmin && !selectedStudent ? (
          // DIRECTOR: Student / Conversation Selection List
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-studio-800 bg-studio-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Direct Messages
                  </h2>
                  <p className="text-xs text-studio-400">
                    1-on-1 private messaging with student musicians
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-studio-400 hover:text-white hover:bg-studio-800 transition"
                aria-label="Close direct messages"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3.5 border-b border-studio-800/80 bg-studio-900/40 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-studio-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students by name or instrument..."
                  className="w-full bg-studio-950 border border-studio-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto divide-y divide-studio-800/60 p-2">
              {filteredStudents.length === 0 ? (
                <div className="py-16 text-center text-studio-400 space-y-2">
                  <User className="w-8 h-8 mx-auto text-studio-600" />
                  <p className="text-sm font-semibold text-white">No students found</p>
                  <p className="text-xs max-w-xs mx-auto">
                    {searchQuery
                      ? 'No students matched your search.'
                      : 'Enroll students via onboarding or QR pass to start messaging.'}
                  </p>
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const convId = DataStore.getDmConversationId(currentUser.id, student.id);
                  const threadMessages = DataStore.getDirectMessages(convId);
                  const lastMsg = threadMessages[threadMessages.length - 1];
                  const unreadCount = threadMessages.filter(
                    (m) => m.recipientId === currentUser.id && !m.read
                  ).length;

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className="w-full p-3 rounded-2xl hover:bg-studio-900 transition flex items-center justify-between gap-3 text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-12 h-12 rounded-full object-cover border border-studio-700 group-hover:border-amber-500 transition"
                          />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-studio-950">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white group-hover:text-amber-300 transition truncate">
                              {student.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-studio-800 text-[10px] font-semibold text-studio-300 capitalize flex items-center gap-1 shrink-0">
                              <InstrumentIcon instrument={student.primaryInstrument} size="xs" />
                              {student.primaryInstrument}
                            </span>
                          </div>

                          <p className="text-xs text-studio-400 truncate mt-0.5 max-w-sm">
                            {lastMsg ? (
                              <span>
                                {lastMsg.senderId === currentUser.id ? 'You: ' : ''}
                                {lastMsg.text}
                              </span>
                            ) : (
                              <span className="italic text-studio-500">
                                Tap to start 1-on-1 direct message...
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {lastMsg && (
                          <span className="text-[10px] text-studio-500 font-mono block">
                            {formatMessageTime(lastMsg.timestamp)}
                          </span>
                        )}
                        <span className="text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-block mt-0.5">
                          Chat →
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          // CONVERSATION THREAD (Director <-> Selected Student OR Student <-> Director)
          <div className="flex flex-col h-full">
            {/* Thread Header */}
            <div className="px-4 py-3 sm:py-3.5 border-b border-studio-800 bg-studio-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="p-1.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-studio-300 hover:text-white transition shrink-0"
                    title="Back to all conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeRecipient?.avatar}
                    alt={activeRecipient?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-studio-700"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-studio-900" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {activeRecipient?.name}
                    </h3>
                    {isAdmin ? (
                      <span className="px-2 py-0.5 rounded-full bg-studio-800 text-[10px] font-semibold text-studio-300 capitalize flex items-center gap-1 shrink-0">
                        <InstrumentIcon
                          instrument={activeRecipient?.primaryInstrument || 'guitars'}
                          size="xs"
                        />
                        {activeRecipient?.primaryInstrument}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 shrink-0">
                        Band Director
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Direct Private Line • End-to-End Synced
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-studio-400 hover:text-white hover:bg-studio-800 transition shrink-0"
                aria-label="Close conversation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-studio-950/70">
              {messages.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Start a 1-on-1 conversation with {activeRecipient?.name}
                  </h4>
                  <p className="text-xs text-studio-400 max-w-sm mx-auto leading-relaxed">
                    Direct messages are private between you and {activeRecipient?.name}. Send a
                    rehearsal question, chart update, or quick encouragement!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={clsx('flex items-end gap-2 group', isMe ? 'justify-end' : 'justify-start')}
                    >
                      {!isMe && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-studio-800 mb-1"
                        />
                      )}

                      <div
                        className={clsx(
                          'max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm space-y-1',
                          isMe
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-br-sm'
                            : 'bg-studio-900 border border-studio-800 text-white rounded-bl-sm'
                        )}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                        <div
                          className={clsx(
                            'text-[10px] font-mono flex items-center gap-1 justify-end',
                            isMe ? 'text-slate-800/80' : 'text-studio-500'
                          )}
                        >
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-slate-900" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 sm:px-4 py-2 bg-studio-900/60 border-t border-studio-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-studio-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick:
              </span>
              {(isAdmin ? DIRECTOR_QUICK_PROMPTS : STUDENT_QUICK_PROMPTS).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-studio-950 hover:bg-studio-800 text-studio-300 hover:text-white border border-studio-800 text-[11px] whitespace-nowrap transition shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 sm:p-4 bg-studio-900/90 border-t border-studio-800 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeRecipient?.name || '...'}`}
                className="flex-1 bg-studio-950 border border-studio-700/80 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-studio-500 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition shadow-sm shrink-0 flex items-center justify-center"
                aria-label="Send direct message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
