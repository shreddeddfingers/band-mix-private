'use client';

import React, { useState } from 'react';
import { DataStore } from '@/lib/data-store';
import { useAuth } from '@/lib/auth-context';
import { InstrumentType, UserProfile } from '@/types';
import { InstrumentIcon, INSTRUMENT_METADATA } from '../InstrumentIcon';
import { X, Plus, Music, Users, ShieldCheck, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface CreateBandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bandId: string) => void;
}

export function CreateBandModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBandModalProps) {
  const { currentUser, activeDirectorId } = useAuth();
  const dirId = activeDirectorId || currentUser?.id || 'director-main';

  const [name, setName] = useState('');
  const [genre, setGenre] = useState('Rock / Alternative');
  const [description, setDescription] = useState('');
  const [rehearsalSchedule, setRehearsalSchedule] = useState('Thursdays 5:00 PM - 7:00 PM');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800'
  );

  // Selected student assignments: array of { studentId, instrument }
  const [assignments, setAssignments] = useState<
    { studentId: string; instrument: InstrumentType }[]
  >([]);

  const students = DataStore.getStudents(dirId);
  const director = DataStore.getDirector(dirId);

  if (!isOpen) return null;

  const handleToggleStudent = (student: UserProfile, instrument: InstrumentType) => {
    const existingIndex = assignments.findIndex((a) => a.studentId === student.id);
    if (existingIndex >= 0) {
      setAssignments(assignments.filter((a) => a.studentId !== student.id));
    } else {
      setAssignments([...assignments, { studentId: student.id, instrument }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = DataStore.createBand({
      name: name.trim(),
      genre,
      description: description.trim() || `${genre} ensemble formed under director guidance.`,
      rehearsalSchedule,
      coverImage,
      directorId: dirId,
      initialStudentIds: assignments,
    });

    onSuccess(created.id);
    onClose();
  };

  const sampleCoverImages = [
    {
      label: 'Studio Stage',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    },
    {
      label: 'Garage Rock',
      url: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&q=80&w=800',
    },
    {
      label: 'Jazz Club',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    },
    {
      label: 'Acoustic Loft',
      url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-studio-900 border border-studio-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-studio-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Create New Band
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Director Exclusive
                </span>
              </h3>
              <p className="text-xs text-studio-400">
                Form an ensemble, assign student instrument slots, and initialize its chat channel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-studio-400 hover:text-white p-1 rounded-lg hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Band Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                Band Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cobalt Skyline"
                required
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
                Genre / Style
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Funk / Soul / Indie"
                required
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the musical goals or target repertoire for this band?"
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
              Target Rehearsal Window
            </label>
            <input
              type="text"
              value={rehearsalSchedule}
              onChange={(e) => setRehearsalSchedule(e.target.value)}
              placeholder="e.g. Wednesdays 5:00 PM - 7:00 PM"
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Theme Photo Selection */}
          <div>
            <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-2">
              Band Cover Visual
            </label>
            <div className="grid grid-cols-4 gap-2">
              {sampleCoverImages.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCoverImage(img.url)}
                  className={clsx(
                    'relative rounded-xl overflow-hidden aspect-video border-2 transition',
                    coverImage === img.url
                      ? 'border-amber-400 scale-[1.02]'
                      : 'border-studio-800 opacity-60 hover:opacity-100'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Member Roster Assignment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider">
                Assign Members by Instrument
              </label>
              <span className="text-xs text-amber-400 font-medium">
                {assignments.length} Students Selected
              </span>
            </div>

            {/* Director Mandate notice */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-200 font-medium">
                  {director.name} (Director) is automatically assigned & locked in.
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Mandatory
              </span>
            </div>

            {/* Student selection grid */}
            <div className="max-h-52 overflow-y-auto space-y-2 border border-studio-800 rounded-xl p-2 bg-studio-950/60">
              {students.map((student) => {
                const isSelected = assignments.some((a) => a.studentId === student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() =>
                      handleToggleStudent(student, student.primaryInstrument)
                    }
                    className={clsx(
                      'flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border',
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-white'
                        : 'bg-studio-900/60 border-studio-800/80 text-studio-300 hover:border-studio-700'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-studio-800 border border-studio-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {student.name}
                          <InstrumentIcon
                            instrument={student.primaryInstrument}
                            size="xs"
                            showLabel
                          />
                        </div>
                        <div className="text-[10px] text-studio-400">
                          {student.skillLevel} • {student.musicalStyles.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div
                      className={clsx(
                        'w-5 h-5 rounded-md border flex items-center justify-center transition',
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'border-studio-700'
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-studio-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-studio-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/10 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Form Band & Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
