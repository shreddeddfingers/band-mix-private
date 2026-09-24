'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, GraduationCap, ChevronDown, Check, Users, PlusCircle, Building } from 'lucide-react';
import { InstrumentIcon } from './InstrumentIcon';
import { CreateDirectorModal } from './directors/CreateDirectorModal';
import { clsx } from 'clsx';

export function RoleSwitcher() {
  const {
    currentUser,
    role,
    switchUser,
    switchDirector,
    directors,
    activeDirectorId,
    availableUsers,
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateDirectorOpen, setIsCreateDirectorOpen] = useState(false);

  // List all registered directors; fallback to any available admin
  const directorList =
    directors && directors.length > 0
      ? directors
      : availableUsers.filter((u) => u.role === 'admin');

  // Filter students to the currently active director
  const scopedStudents = availableUsers.filter(
    (u) =>
      u.role === 'student' &&
      (u.directorId === activeDirectorId ||
        (activeDirectorId === 'director-main' && (!u.directorId || u.directorId === 'director-main')))
  );

  return (
    <>
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
                  <span className="text-[10px] text-amber-400 font-mono">
                    ({currentUser?.studioName || 'Director'})
                  </span>
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
          <ChevronDown
            className={clsx(
              'w-3.5 h-3.5 text-studio-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-studio-900 border border-studio-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-studio-800 mb-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-studio-400">
                  Switch Workspace & Perspective
                </div>
                <p className="text-[11px] text-studio-400 mt-0.5">
                  Directors hold isolated studio rosters, QR invites, and band schedules.
                </p>
              </div>

              {/* Directors Section */}
              <div className="mt-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Band Directors
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {directorList.map((dir) => {
                    const isSelected = currentUser?.id === dir.id;
                    return (
                      <button
                        key={dir.id}
                        onClick={() => {
                          switchDirector(dir.id);
                          setIsOpen(false);
                        }}
                        className={clsx(
                          'w-full flex items-center justify-between p-2 rounded-xl text-left transition',
                          isSelected
                            ? 'bg-amber-500/15 border border-amber-500/30'
                            : 'hover:bg-studio-800 text-studio-200'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                              <span className="truncate">{dir.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold shrink-0">
                                DIRECTOR
                              </span>
                            </div>
                            <div className="text-[11px] text-studio-400 flex items-center gap-1 truncate">
                              <Building className="w-3 h-3 text-studio-500 shrink-0" />
                              <span className="truncate">{dir.studioName || 'Music Studio'}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Register New Director Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateDirectorOpen(true);
                  }}
                  className="w-full mt-1.5 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-purple-500/40 text-purple-300 hover:bg-purple-950/40 hover:border-purple-400 text-xs font-medium transition"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  + Register Band Director
                </button>
              </div>

              {/* Student Musicians Section */}
              <div className="mt-2 pt-2 border-t border-studio-800">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-studio-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Studio Students
                  </span>
                  <span className="text-[10px] text-studio-500 font-mono">
                    {scopedStudents.length}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
                  {scopedStudents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-studio-500 italic">
                      No students enrolled under this director yet.
                    </div>
                  ) : (
                    scopedStudents.map((student) => {
                      const isSelected = currentUser?.id === student.id;
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            switchUser(student.id);
                            setIsOpen(false);
                          }}
                          className={clsx(
                            'w-full flex items-center justify-between p-2 rounded-xl text-left transition',
                            isSelected
                              ? 'bg-studio-800 border border-studio-600'
                              : 'hover:bg-studio-800/60 text-studio-300'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-studio-800 border border-studio-700 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                                <span className="truncate">{student.name}</span>
                                <InstrumentIcon
                                  instrument={student.primaryInstrument}
                                  size="xs"
                                />
                              </div>
                              <div className="text-[10px] text-studio-400 capitalize truncate">
                                {student.primaryInstrument} • {student.skillLevel}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateDirectorModal
        isOpen={isCreateDirectorOpen}
        onClose={() => setIsCreateDirectorOpen(false)}
      />
    </>
  );
}
