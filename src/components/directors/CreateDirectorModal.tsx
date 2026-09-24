'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { InstrumentType } from '@/types';
import { InstrumentIcon, INSTRUMENT_METADATA } from '../InstrumentIcon';
import { X, Sparkles, Building, User, Mail, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

interface CreateDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (directorId: string) => void;
}

const INSTRUMENT_OPTIONS: InstrumentType[] = [
  'piano',
  'guitars',
  'drums',
  'bass',
  'vocals',
  'horns',
  'keyboard',
  'other',
];

export function CreateDirectorModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDirectorModalProps) {
  const { createDirectorAccount } = useAuth();

  const [name, setName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryInstrument, setPrimaryInstrument] = useState<InstrumentType>('piano');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your director name.');
      return;
    }
    if (!studioName.trim()) {
      setError('Please provide your studio or school name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid director email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const newDirector = createDirectorAccount({
        name: name.trim(),
        studioName: studioName.trim(),
        email: email.trim(),
        primaryInstrument,
        bio:
          bio.trim() ||
          `Band Director & Ensemble Coordinator at ${studioName.trim()}.`,
      });

      if (onSuccess) {
        onSuccess(newDirector.id);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create director account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Register Band Director
              </h2>
              <p className="text-xs text-slate-400">
                Create a dedicated director workspace and studio roster.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Director Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              Director Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Studio Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              Studio or School Name
            </label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="e.g. Highland School of Rock"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Director Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Director Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@highlandschool.edu"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Primary Instrument */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Primary Teaching Instrument
            </label>
            <div className="grid grid-cols-4 gap-2">
              {INSTRUMENT_OPTIONS.map((inst) => {
                const meta = INSTRUMENT_METADATA[inst];
                const isSelected = primaryInstrument === inst;
                return (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => setPrimaryInstrument(inst)}
                    className={clsx(
                      'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition text-center',
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    )}
                  >
                    <InstrumentIcon
                      instrument={inst}
                      className={clsx('w-4 h-4', isSelected ? 'text-purple-400' : 'text-slate-400')}
                    />
                    <span className="truncate w-full">{meta?.label || inst}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bio / Teaching Philosophy */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Bio & Focus (Optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="e.g. 10+ years directing modern rock ensembles, chart arrangements, and student showcases."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
            />
          </div>

          {/* Explanatory Callout */}
          <div className="p-3.5 bg-purple-950/30 border border-purple-800/30 rounded-xl text-xs text-purple-200/90 leading-relaxed">
            <span className="font-semibold text-purple-300">Isolated Studio Workspace:</span> Students who onboard via your studio QR pass, as well as bands and rehearsals you create, will be strictly linked to your director account only.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Director Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
