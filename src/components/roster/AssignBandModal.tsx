'use client';

import React, { useState } from 'react';
import { UserProfile, InstrumentType, Band } from '@/types';
import { DataStore } from '@/lib/data-store';
import { useAuth } from '@/lib/auth-context';
import { InstrumentIcon } from '../InstrumentIcon';
import { X, Check, Music, UserPlus } from 'lucide-react';

interface AssignBandModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserProfile | null;
  onSuccess?: () => void;
}

export function AssignBandModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: AssignBandModalProps) {
  const { activeDirectorId } = useAuth();
  const [selectedBandId, setSelectedBandId] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>(
    student?.primaryInstrument || 'drums'
  );

  const dirId = student?.directorId || activeDirectorId || 'director-main';
  const bands = DataStore.getBands(dirId);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBandId) return;

    DataStore.addMemberToBand(selectedBandId, student, selectedInstrument);
    if (onSuccess) onSuccess();
    onClose();
  };

  const instrumentOptions: InstrumentType[] = [
    'drums',
    'bass',
    'vocals',
    'piano',
    'keyboard',
    'guitars',
    'horns',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-studio-900 border border-studio-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 pb-4 border-b border-studio-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign to Band</h3>
              <p className="text-xs text-studio-400">
                Enroll <strong className="text-white">{student.name}</strong> into an ensemble.
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-1.5">
              Select Band
            </label>
            <select
              value={selectedBandId}
              onChange={(e) => setSelectedBandId(e.target.value)}
              required
              className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Choose an Ensemble --</option>
              {bands.map((band) => {
                const isAlreadyIn = band.members.some(
                  (m) => m.userId === student.id
                );
                return (
                  <option
                    key={band.id}
                    value={band.id}
                    disabled={isAlreadyIn}
                  >
                    {band.name} ({band.members.length} members)
                    {isAlreadyIn ? ' - Already enrolled' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider mb-2">
              Designated Instrument in Band
            </label>
            <div className="grid grid-cols-2 gap-2">
              {instrumentOptions.map((inst) => (
                <button
                  type="button"
                  key={inst}
                  onClick={() => setSelectedInstrument(inst)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition ${
                    selectedInstrument === inst
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-studio-950 border-studio-800 text-studio-400 hover:border-studio-700'
                  }`}
                >
                  <InstrumentIcon instrument={inst} size="sm" />
                  <span className="capitalize">{inst}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-studio-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-studio-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedBandId}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
