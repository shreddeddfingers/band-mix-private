'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, GraduationCap, ChevronDown, Check, Users } from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { clsx } from 'clsx';

export function RoleSwitcher() {
  const { currentUser, role, switchUser, availableUsers } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const director = availableUsers.find((u) => u.role === 'admin');
  const students = availableUsers.filter((u) => u.role === 'student');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-sm',
          role === 'admin'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20'
            : 'bg-studio-800/80 border-studio-700 text-studio-200 hover:bg-studio-700/80'
        )}
      >
        {role === 'admin' ? (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="font-bold flex items-center gap-1 leading-none text-white">
                {currentUser?.name}
                <span className="text-[10px] text-amber-400 font-mono">(Director)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-studio-400" />
            <div className="text-left">
              <div className="font-bold flex items-center gap-1 leading-none text-white">
                {currentUser?.name}
                {currentUser?.primaryInstrument && (
                  <InstrumentIcon instrument={currentUser.primaryInstrument} size="xs" />
                )}
              </div>
            </div>
          </div>
        )}
        <ChevronDown className={clsx('w-3.5 h-3.5 text-studio-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-studio-900 border border-studio-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-studio-800 mb-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400">
                Switch Perspective
              </div>
              <p className="text-[11px] text-studio-400 mt-0.5">
                Toggle between Director authority and Student access to preview permissions.
              </p>
            </div>

            {/* Director Option */}
            {director && (
              <button
                onClick={() => {
                  switchUser(director.id);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center justify-between p-2 rounded-xl text-left transition',
                  currentUser?.id === director.id
                    ? 'bg-amber-500/15 border border-amber-500/30'
                    : 'hover:bg-studio-800 text-studio-200'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {director.name}
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
                        DIRECTOR
                      </span>
                    </div>
                    <div className="text-[11px] text-studio-400">
                      Full scheduling & admin controls
                    </div>
                  </div>
                </div>
                {currentUser?.id === director.id && (
                  <Check className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}

            {/* Student Options */}
            <div className="mt-2 pt-2 border-t border-studio-800">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-studio-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Student Musicians
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 mt-1">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      switchUser(student.id);
                      setIsOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between p-2 rounded-xl text-left transition',
                      currentUser?.id === student.id
                        ? 'bg-studio-800 border border-studio-600'
                        : 'hover:bg-studio-800/60 text-studio-300'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-studio-800 border border-studio-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          {student.name}
                          <InstrumentIcon
                            instrument={student.primaryInstrument}
                            size="xs"
                          />
                        </div>
                        <div className="text-[10px] text-studio-400 capitalize">
                          {student.primaryInstrument} • {student.skillLevel}
                        </div>
                      </div>
                    </div>
                    {currentUser?.id === student.id && (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
