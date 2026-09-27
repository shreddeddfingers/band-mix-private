'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile, InstrumentType, Band } from '@/types';
import { DataStore, subscribeToStore } from '@/lib/data-store';
import { FirestoreService } from '@/lib/firestore-service';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { InstrumentIcon } from '../InstrumentIcon';
import { X, Check, Music, UserPlus, Loader2, AlertCircle, Plus } from 'lucide-react';

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
  const { activeDirectorId, isAdmin } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBandId, setSelectedBandId] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('drums');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync available bands reactively
  useEffect(() => {
    const refreshBands = () => {
      let available = DataStore.getBands(activeDirectorId);
      if (available.length === 0) {
        available = DataStore.getBands();
      }
      setBands(available);
    };

    if (isOpen) {
      refreshBands();

      // Proactively pull remote Firestore bands to guarantee newly created bands from any device are present
      if (isFirebaseConfigured) {
        FirestoreService.getBands()
          .then((remoteBands) => {
            if (remoteBands && remoteBands.length > 0) {
              DataStore.mergeRemoteBands(remoteBands);
              refreshBands();
            }
          })
          .catch((err) => console.warn('Could not sync remote bands for AssignBandModal:', err));
      }
    }

    const unsub = subscribeToStore('bands', refreshBands);
    return () => unsub();
  }, [isOpen, activeDirectorId]);

  // Reset form selections on student change or modal open
  useEffect(() => {
    if (student) {
      setSelectedBandId('');
      setSelectedInstrument(student.primaryInstrument || 'drums');
      setErrorMsg(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !isAdmin || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedBandId || !student) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      DataStore.addMemberToBand(selectedBandId, student, selectedInstrument);

      // Force cloud sync to guarantee immediate persistence across all student devices
      if (isFirebaseConfigured) {
        const updatedBand = DataStore.getBand(selectedBandId);
        if (updatedBand) {
          await FirestoreService.setBand(updatedBand).catch(console.error);
        }
        const updatedBandIds = Array.from(
          new Set([...(student.bandIds || []), selectedBandId])
        );
        await FirestoreService.updateUser(student.id, {
          bandIds: updatedBandIds,
        }).catch(console.error);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to assign member to band:', err);
      setErrorMsg(err?.message || 'Failed to assign student to ensemble.');
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Header */}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-studio-300 uppercase tracking-wider">
                Select Band
              </label>
              <span className="text-[11px] text-studio-400">
                {bands.length} {bands.length === 1 ? 'ensemble' : 'ensembles'} available
              </span>
            </div>

            {bands.length === 0 ? (
              <div className="p-4 rounded-xl bg-studio-950 border border-studio-800 text-center space-y-2">
                <Music className="w-6 h-6 text-studio-500 mx-auto" />
                <p className="text-xs text-studio-300 font-medium">
                  No active bands found in your studio.
                </p>
                <p className="text-[11px] text-studio-500">
                  Please create a band first so students can be enrolled.
                </p>
                <Link
                  href="/bands"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Band
                </Link>
              </div>
            ) : (
              <select
                value={selectedBandId}
                onChange={(e) => setSelectedBandId(e.target.value)}
                required
                className="w-full bg-studio-950 border border-studio-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Choose an Ensemble --</option>
                {bands.map((band) => {
                  const isAlreadyIn =
                    band.members?.some((m) => m.userId === student.id) ||
                    (student.bandIds && student.bandIds.includes(band.id));
                  return (
                    <option
                      key={band.id}
                      value={band.id}
                      disabled={isAlreadyIn}
                    >
                      {band.name} ({band.genre}) - {band.members?.length || 0} members
                      {isAlreadyIn ? ' [Already enrolled]' : ''}
                    </option>
                  );
                })}
              </select>
            )}
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
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-studio-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedBandId || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Confirm Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
