'use client';

import React from 'react';
import { Band, BandMember, UserProfile } from '@/types';
import { DataStore } from '@/lib/data-store';
import { InstrumentIcon } from '@/components/InstrumentIcon';
import { Plus, ShieldCheck, Music } from 'lucide-react';

interface BandStoriesBarProps {
  band: Band;
  currentUserId?: string;
  onSelectMember: (member: BandMember, studentDetails?: UserProfile) => void;
  onOpenAddMember?: () => void;
  isAdmin?: boolean;
}

export function BandStoriesBar({
  band,
  currentUserId,
  onSelectMember,
  onOpenAddMember,
  isAdmin,
}: BandStoriesBarProps) {
  return (
    <div className="w-full bg-studio-950/80 border border-studio-800/80 rounded-2xl p-3 shadow-inner">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1">
        {/* Story 1: Band Story / Cover */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div className="relative p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full transition-transform group-hover:scale-105 active:scale-95">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-studio-900 border-2 border-studio-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  band.coverImage ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=250'
                }
                alt={band.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
              <Music className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-white max-w-[68px] truncate text-center group-hover:text-amber-400 transition">
            {band.name}
          </span>
        </div>

        {/* Member Stories */}
        {band.members.map((member) => {
          const studentDetails = DataStore.getUserById(member.userId);
          const isMe = member.userId === currentUserId;
          const isDir = member.role === 'director';

          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => onSelectMember(member, studentDetails)}
              className="flex flex-col items-center gap-1.5 shrink-0 group text-center focus:outline-none"
              title={`${member.name} - Tap to view profile & questionnaire`}
            >
              <div
                className={`relative p-[2.5px] rounded-full transition-transform group-hover:scale-105 active:scale-95 ${
                  isDir
                    ? 'bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 shadow-amber-500/20 shadow-md'
                    : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                }`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-studio-900 border-2 border-studio-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Badge: Director Shield or Instrument Icon */}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-studio-950 border border-studio-700 flex items-center justify-center shadow-md">
                  {isDir ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <InstrumentIcon instrument={member.instrument} size="xs" />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-studio-200 group-hover:text-white max-w-[68px] truncate transition">
                  {isMe ? 'You' : member.name.split(' ')[0]}
                </span>
                {studentDetails?.exactAge && (
                  <span className="text-[9px] text-amber-400/90 font-mono -mt-0.5">
                    Age {studentDetails.exactAge}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Add Member Story (Director Only) */}
        {isAdmin && onOpenAddMember && (
          <button
            type="button"
            onClick={onOpenAddMember}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            title="Add a student musician to this band"
          >
            <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-studio-700 group-hover:border-amber-400 flex items-center justify-center bg-studio-900/60 transition-colors group-hover:bg-studio-900">
              <Plus className="w-5 h-5 text-studio-400 group-hover:text-amber-400 transition" />
            </div>
            <span className="text-[11px] font-semibold text-studio-400 group-hover:text-amber-400 transition max-w-[68px] truncate text-center">
              Add Member
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
