import React from 'react';
import { InstrumentType } from '@/types';
import { clsx } from 'clsx';

interface InstrumentIconProps {
  instrument: InstrumentType;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const INSTRUMENT_METADATA: Record<
  InstrumentType,
  { label: string; bg: string; text: string; border: string; accent: string }
> = {
  drums: {
    label: 'Drums',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    accent: '#f59e0b',
  },
  bass: {
    label: 'Bass',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    accent: '#10b981',
  },
  vocals: {
    label: 'Vocals',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    accent: '#f43f5e',
  },
  piano: {
    label: 'Piano',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    accent: '#6366f1',
  },
  keyboard: {
    label: 'Keyboard',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    accent: '#06b6d4',
  },
  guitars: {
    label: 'Guitar',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    accent: '#a855f7',
  },
  horns: {
    label: 'Horns',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    accent: '#f97316',
  },
  other: {
    label: 'Other',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    accent: '#94a3b8',
  },
};

const sizeClasses = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function InstrumentSvg({
  instrument,
  className,
}: {
  instrument: InstrumentType;
  className?: string;
}) {
  switch (instrument) {
    case 'drums':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Snare / Tom Drum */}
          <ellipse cx="12" cy="7" rx="9" ry="3.5" />
          <path d="M3 7v10c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5V7" />
          {/* Drumsticks */}
          <line x1="5" y1="2" x2="10" y2="7" />
          <line x1="19" y1="2" x2="14" y2="7" />
          {/* Snare detail */}
          <line x1="6" y1="10.5" x2="8" y2="19.5" />
          <line x1="12" y1="10.5" x2="12" y2="20.5" />
          <line x1="18" y1="10.5" x2="16" y2="19.5" />
        </svg>
      );

    case 'bass':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Bass Guitar silhouette with 4 pegs */}
          <circle cx="16" cy="16" r="5" />
          <path d="M12.5 12.5L5 5" />
          <circle cx="4" cy="4" r="1.5" />
          <line x1="3.5" y1="2.5" x2="2.5" y2="3.5" />
          <line x1="5.5" y1="4.5" x2="6.5" y2="5.5" />
          <line x1="2" y1="5" x2="3.5" y2="6.5" />
          <path d="M14 18a2 2 0 0 1 2-2" />
        </svg>
      );

    case 'vocals':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Studio Microphone */}
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      );

    case 'piano':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Grand Piano Keys */}
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="6" y1="5" x2="6" y2="19" />
          <line x1="10" y1="5" x2="10" y2="19" />
          <line x1="14" y1="5" x2="14" y2="19" />
          <line x1="18" y1="5" x2="18" y2="19" />
          {/* Black Keys */}
          <rect x="5" y="5" width="2" height="7" fill="currentColor" />
          <rect x="9" y="5" width="2" height="7" fill="currentColor" />
          <rect x="15" y="5" width="2" height="7" fill="currentColor" />
        </svg>
      );

    case 'keyboard':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Synthesizer keyboard */}
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="2" y1="11" x2="22" y2="11" />
          {/* Synth knobs/sliders */}
          <circle cx="5" cy="8.5" r="0.8" fill="currentColor" />
          <circle cx="8" cy="8.5" r="0.8" fill="currentColor" />
          <circle cx="11" cy="8.5" r="0.8" fill="currentColor" />
          <line x1="15" y1="7.5" x2="19" y2="7.5" />
          <line x1="15" y1="9.5" x2="18" y2="9.5" />
          {/* Keys */}
          <line x1="6" y1="11" x2="6" y2="18" />
          <line x1="10" y1="11" x2="10" y2="18" />
          <line x1="14" y1="11" x2="14" y2="18" />
          <line x1="18" y1="11" x2="18" y2="18" />
        </svg>
      );

    case 'guitars':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Electric Guitar */}
          <path d="M19 3l2 2-7 7" />
          <path d="M14 12c-1.5-1.5-3.5-1.5-5 0l-5 5a4.24 4.24 0 0 0 6 6l5-5c1.5-1.5 1.5-3.5 0-5" />
          <circle cx="11" cy="17" r="1.5" />
          <line x1="16" y1="6" x2="19" y2="9" />
        </svg>
      );

    case 'horns':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Trumpet / Saxophone Horn Flare */}
          <path d="M3 11h9l8-6v14l-8-6H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
          <line x1="7" y1="7" x2="7" y2="11" />
          <line x1="9" y1="7" x2="9" y2="11" />
          <line x1="11" y1="7" x2="11" y2="11" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Music Note */}
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
  }
}

export function InstrumentIcon({
  instrument,
  className,
  size = 'md',
  showLabel = false,
}: InstrumentIconProps) {
  const meta = INSTRUMENT_METADATA[instrument] || INSTRUMENT_METADATA.other;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium transition-colors',
        showLabel && 'px-2 py-0.5 rounded-full border',
        showLabel && meta.bg,
        showLabel && meta.text,
        showLabel && meta.border,
        className
      )}
      title={meta.label}
    >
      <InstrumentSvg
        instrument={instrument}
        className={clsx(sizeClasses[size], !showLabel && meta.text)}
      />
      {showLabel && <span className="text-xs uppercase tracking-wider font-semibold">{meta.label}</span>}
    </span>
  );
}
