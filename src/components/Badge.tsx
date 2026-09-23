import React from 'react';
import { SkillLevel, AgeGroup, UserRole } from '@/types';
import { clsx } from 'clsx';
import { ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'skill' | 'style' | 'role' | 'age' | 'status';
  skill?: SkillLevel;
  role?: UserRole;
  age?: AgeGroup;
  className?: string;
}

export function Badge({
  children,
  variant = 'style',
  skill,
  role,
  age,
  className,
}: BadgeProps) {
  if (role) {
    if (role === 'admin') {
      return (
        <span
          className={clsx(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30',
            className
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          Director
        </span>
      );
    }
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-studio-700/50 text-studio-300 border border-studio-600/50',
          className
        )}
      >
        <GraduationCap className="w-3.5 h-3.5 text-studio-400" />
        Student
      </span>
    );
  }

  if (skill) {
    const config = {
      beginner: {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        label: 'Beginner',
      },
      intermediate: {
        bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        label: 'Intermediate',
      },
      advanced: {
        bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        label: 'Advanced',
      },
      expert: {
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        label: 'Expert',
      },
    }[skill];

    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border uppercase tracking-wider',
          config.bg,
          className
        )}
      >
        <Sparkles className="w-3 h-3 opacity-80" />
        {config.label}
      </span>
    );
  }

  if (age) {
    const labels = {
      kids: 'Youth (Under 13)',
      teens: 'Teens (13–18)',
      adults: 'Adults (18+)',
    };
    return (
      <span
        className={clsx(
          'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700',
          className
        )}
      >
        {labels[age]}
      </span>
    );
  }

  // Default style tag
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-studio-800/80 text-studio-200 border border-studio-700/60 hover:border-studio-500/80 transition-colors',
        className
      )}
    >
      #{children}
    </span>
  );
}
