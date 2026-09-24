import type {
  UserProfile,
  InstrumentType,
  SkillLevel,
  DayOfWeek,
  RecurringTimeWindow,
  HobbyInterest,
  MusicalGoal,
} from '../types/index.ts';

export interface ScheduleIntersection {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  availableCount: number;
  totalMembers: number;
  conflictingMemberNames: string[];
}

export interface InstrumentSlotStatus {
  instrument: InstrumentType;
  count: number;
  memberNames: string[];
  isFilled: boolean;
}

export interface GroupCompatibilityReport {
  memberCount: number;
  exactAges: number[];
  exactAgesFormatted: string; // "Ages: 10, 10, 11, 11, 12, 12"
  ageSpread: number;
  ageCompatibilitySignal: 'Close Peer Cohort' | 'Moderate Age Spread' | 'Wide Age Spread';

  // Schedule Overlap
  bestScheduleWindow?: ScheduleIntersection;
  hasFullScheduleOverlap: boolean;
  scheduleSummary: string; // e.g. "Tuesday 5:00–7:00 — 6/6 available"

  // Instrument Coverage
  instrumentCoverage: InstrumentSlotStatus[];
  instrumentSummary: string; // "Drums ✓ Bass ✓ Guitar ×2 ✓ Keys ✓ Vocals ✓"
  missingCoreInstruments: InstrumentType[];
  hasStandardRhythmSection: boolean; // drums + bass

  // Skill Compatibility
  skillSpread: number; // 0 = all same, 1 = adjacent tiers, etc.
  skillCompatibilitySignal: 'Strong' | 'Moderate' | 'Mixed';
  skillCounts: Record<SkillLevel, number>;

  // Musical Overlap
  sharedStyles: { style: string; count: number }[];
  styleSummary: string;

  // Goals & Commitment
  sharedGoals: { goal: MusicalGoal; count: number }[];
  commitmentSummary: string;

  // Shared Interests
  sharedHobbies: { hobby: HobbyInterest; count: number }[];

  // Missing Needs
  recommendations: string[];
}

const CORE_INSTRUMENTS: InstrumentType[] = [
  'drums',
  'bass',
  'guitars',
  'keyboard',
  'piano',
  'vocals',
];

const SKILL_SCORES: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/**
 * Parses "HH:mm" into minutes from midnight
 */
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

/**
 * Formats minutes from midnight to "h:mm a" or "HH:mm"
 */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Evaluates schedule overlap across a group of student profiles.
 * Finds recurring time blocks where members have overlapping availability.
 */
export function calculateScheduleOverlap(
  members: UserProfile[]
): ScheduleIntersection[] {
  if (members.length === 0) return [];

  const days: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const results: ScheduleIntersection[] = [];

  days.forEach((day) => {
    // Collect all valid windows for this day across members
    const memberWindows = members.map((m) => {
      const validWins = (m.availability || [])
        .filter((w) => w.dayOfWeek === day)
        .map((w) => ({
          start: toMinutes(w.startTime),
          end: toMinutes(w.endTime),
        }))
        .filter((w) => w.start < w.end); // ignore invalid/inverted windows
      return { member: m, windows: validWins };
    });

    // If nobody has availability on this day, skip
    const anyAvailable = memberWindows.some((mw) => mw.windows.length > 0);
    if (!anyAvailable) return;

    // Collect all unique boundary points
    const timePointsSet = new Set<number>();
    memberWindows.forEach((mw) => {
      mw.windows.forEach((w) => {
        timePointsSet.add(w.start);
        timePointsSet.add(w.end);
      });
    });

    const timePoints = Array.from(timePointsSet).sort((a, b) => a - b);
    if (timePoints.length < 2) return;

    // For each elementary segment [t[i], t[i+1]], find which members are available
    interface Segment {
      start: number;
      end: number;
      availableMembers: UserProfile[];
      conflictingMembers: UserProfile[];
    }

    const segments: Segment[] = [];
    for (let i = 0; i < timePoints.length - 1; i++) {
      const segStart = timePoints[i];
      const segEnd = timePoints[i + 1];
      if (segStart >= segEnd) continue;

      const available: UserProfile[] = [];
      const conflicting: UserProfile[] = [];

      memberWindows.forEach((mw) => {
        const isFree = mw.windows.some((w) => w.start <= segStart && w.end >= segEnd);
        if (isFree) {
          available.push(mw.member);
        } else {
          conflicting.push(mw.member);
        }
      });

      if (available.length > 0) {
        segments.push({
          start: segStart,
          end: segEnd,
          availableMembers: available,
          conflictingMembers: conflicting,
        });
      }
    }

    if (segments.length === 0) return;

    // Merge adjacent segments that share the exact same available members
    interface MergedInterval {
      start: number;
      end: number;
      availableCount: number;
      conflictingMemberNames: string[];
    }

    const mergedIntervals: MergedInterval[] = [];
    let current: MergedInterval | null = null;

    segments.forEach((seg) => {
      const conflictNames = seg.conflictingMembers.map((m) => m.name).sort();
      const conflictKey = conflictNames.join('|');

      if (
        current &&
        current.end === seg.start &&
        current.conflictingMemberNames.join('|') === conflictKey
      ) {
        current.end = seg.end;
      } else {
        if (current) {
          mergedIntervals.push(current);
        }
        current = {
          start: seg.start,
          end: seg.end,
          availableCount: seg.availableMembers.length,
          conflictingMemberNames: conflictNames,
        };
      }
    });
    if (current) {
      mergedIntervals.push(current);
    }

    // Pick the best interval for this day:
    // 1. Highest availableCount
    // 2. Longest duration (end - start)
    mergedIntervals.sort((a, b) => {
      if (b.availableCount !== a.availableCount) {
        return b.availableCount - a.availableCount;
      }
      return b.end - b.start - (a.end - a.start);
    });

    const bestForDay = mergedIntervals[0];
    if (bestForDay && bestForDay.availableCount > 0) {
      results.push({
        dayOfWeek: day,
        startTime: minutesToTime(bestForDay.start),
        endTime: minutesToTime(bestForDay.end),
        availableCount: bestForDay.availableCount,
        totalMembers: members.length,
        conflictingMemberNames: bestForDay.conflictingMemberNames,
      });
    }
  });

  return results.sort((a, b) => {
    if (b.availableCount !== a.availableCount) {
      return b.availableCount - a.availableCount;
    }
    const aDur = toMinutes(a.endTime) - toMinutes(a.startTime);
    const bDur = toMinutes(b.endTime) - toMinutes(b.startTime);
    return bDur - aDur;
  });
}

/**
 * Computes comprehensive Band Compatibility Signals.
 *
 * NOTE ON PRIVACY & EQUALITY:
 * Preferred Pronouns have ZERO weight and are strictly excluded from calculations.
 */
export function analyzeGroupCompatibility(
  members: UserProfile[]
): GroupCompatibilityReport {
  if (members.length === 0) {
    return {
      memberCount: 0,
      exactAges: [],
      exactAgesFormatted: 'No members selected',
      ageSpread: 0,
      ageCompatibilitySignal: 'Close Peer Cohort',
      hasFullScheduleOverlap: false,
      scheduleSummary: 'No schedule overlap available',
      instrumentCoverage: [],
      instrumentSummary: 'No instruments',
      missingCoreInstruments: ['drums', 'bass', 'guitars', 'vocals'],
      hasStandardRhythmSection: false,
      skillSpread: 0,
      skillCompatibilitySignal: 'Strong',
      skillCounts: { beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
      sharedStyles: [],
      styleSummary: 'None',
      sharedGoals: [],
      commitmentSummary: 'None',
      sharedHobbies: [],
      recommendations: ['Select candidate students to assemble a band.'],
    };
  }

  // 1. Exact Ages (NEVER collapse into a range!)
  const exactAges: number[] = members
    .map((m) => m.exactAge || (m.ageGroup === 'kids' ? 10 : m.ageGroup === 'teens' ? 15 : 20))
    .sort((a, b) => a - b);

  const exactAgesFormatted = `Ages: ${exactAges.join(', ')}`;
  const minAge = exactAges[0];
  const maxAge = exactAges[exactAges.length - 1];
  const ageSpread = maxAge - minAge;

  let ageCompatibilitySignal: 'Close Peer Cohort' | 'Moderate Age Spread' | 'Wide Age Spread' =
    'Close Peer Cohort';
  if (ageSpread > 4) {
    ageCompatibilitySignal = 'Wide Age Spread';
  } else if (ageSpread > 2) {
    ageCompatibilitySignal = 'Moderate Age Spread';
  }

  // 2. Schedule Overlap
  const scheduleIntersections = calculateScheduleOverlap(members);
  const bestScheduleWindow = scheduleIntersections[0];
  const hasFullScheduleOverlap =
    Boolean(bestScheduleWindow && bestScheduleWindow.availableCount === members.length);

  const dayCapitalized = bestScheduleWindow
    ? bestScheduleWindow.dayOfWeek.charAt(0).toUpperCase() +
      bestScheduleWindow.dayOfWeek.slice(1)
    : '';

  const scheduleSummary = bestScheduleWindow
    ? `${dayCapitalized} ${bestScheduleWindow.startTime}–${bestScheduleWindow.endTime} — ${bestScheduleWindow.availableCount}/${members.length} available`
    : 'No common recurring availability window';

  // 3. Instrumentation Coverage
  const instrumentCounts: Record<InstrumentType, { count: number; memberNames: string[] }> = {
    drums: { count: 0, memberNames: [] },
    bass: { count: 0, memberNames: [] },
    vocals: { count: 0, memberNames: [] },
    piano: { count: 0, memberNames: [] },
    keyboard: { count: 0, memberNames: [] },
    guitars: { count: 0, memberNames: [] },
    horns: { count: 0, memberNames: [] },
    other: { count: 0, memberNames: [] },
  };

  members.forEach((m) => {
    const inst = m.primaryInstrument || 'other';
    instrumentCounts[inst].count++;
    instrumentCounts[inst].memberNames.push(m.name);
  });

  const instrumentCoverage: InstrumentSlotStatus[] = (
    Object.keys(instrumentCounts) as InstrumentType[]
  ).map((inst) => ({
    instrument: inst,
    count: instrumentCounts[inst].count,
    memberNames: instrumentCounts[inst].memberNames,
    isFilled: instrumentCounts[inst].count > 0,
  }));

  // Build string: Drums ✓ Bass ✓ Guitar ×2 ✓ Keys ✓ Vocals ✓
  const summaryTokens: string[] = [];
  if (instrumentCounts.drums.count > 0) {
    summaryTokens.push(
      instrumentCounts.drums.count > 1 ? `Drums ×${instrumentCounts.drums.count} ✓` : 'Drums ✓'
    );
  }
  if (instrumentCounts.bass.count > 0) {
    summaryTokens.push(
      instrumentCounts.bass.count > 1 ? `Bass ×${instrumentCounts.bass.count} ✓` : 'Bass ✓'
    );
  }
  if (instrumentCounts.guitars.count > 0) {
    summaryTokens.push(
      instrumentCounts.guitars.count > 1 ? `Guitar ×${instrumentCounts.guitars.count} ✓` : 'Guitar ✓'
    );
  }
  const keysCount = instrumentCounts.keyboard.count + instrumentCounts.piano.count;
  if (keysCount > 0) {
    summaryTokens.push(keysCount > 1 ? `Keys ×${keysCount} ✓` : 'Keys ✓');
  }
  if (instrumentCounts.vocals.count > 0) {
    summaryTokens.push(
      instrumentCounts.vocals.count > 1 ? `Vocals ×${instrumentCounts.vocals.count} ✓` : 'Vocals ✓'
    );
  }
  if (instrumentCounts.horns.count > 0) {
    summaryTokens.push(`Horns ×${instrumentCounts.horns.count} ✓`);
  }

  const instrumentSummary = summaryTokens.join(' ') || 'No instruments assigned';

  const missingCoreInstruments: InstrumentType[] = [];
  if (instrumentCounts.drums.count === 0) missingCoreInstruments.push('drums');
  if (instrumentCounts.bass.count === 0) missingCoreInstruments.push('bass');
  if (instrumentCounts.guitars.count === 0) missingCoreInstruments.push('guitars');
  if (instrumentCounts.vocals.count === 0) missingCoreInstruments.push('vocals');

  const hasStandardRhythmSection =
    instrumentCounts.drums.count > 0 && instrumentCounts.bass.count > 0;

  // 4. Skill Compatibility
  const skillCounts: Record<SkillLevel, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    expert: 0,
  };

  members.forEach((m) => {
    skillCounts[m.skillLevel || 'intermediate']++;
  });

  const memberScores = members.map((m) => SKILL_SCORES[m.skillLevel || 'intermediate']);
  const maxSkill = Math.max(...memberScores);
  const minSkill = Math.min(...memberScores);
  const skillSpread = maxSkill - minSkill;

  let skillCompatibilitySignal: 'Strong' | 'Moderate' | 'Mixed' = 'Strong';
  if (skillSpread > 2) {
    skillCompatibilitySignal = 'Mixed';
  } else if (skillSpread > 1) {
    skillCompatibilitySignal = 'Moderate';
  }

  // 5. Musical Style Overlap
  const styleCountMap: Record<string, number> = {};
  members.forEach((m) => {
    (m.musicalStyles || []).forEach((style) => {
      styleCountMap[style] = (styleCountMap[style] || 0) + 1;
    });
  });

  const sharedStyles = Object.entries(styleCountMap)
    .filter(([_, count]) => count >= 2)
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count);

  const styleSummary =
    sharedStyles.length > 0
      ? sharedStyles.slice(0, 3).map((s) => s.style).join(' / ')
      : 'Diverse musical preferences';

  // 6. Musical Goals & Commitment Compatibility
  const goalCountMap: Record<string, number> = {};
  const commitmentCountMap: Record<string, number> = {};

  members.forEach((m) => {
    (m.bandMatchProfile?.musicalGoals || []).forEach((g) => {
      goalCountMap[g] = (goalCountMap[g] || 0) + 1;
    });
    if (m.bandMatchProfile?.commitmentLevel) {
      commitmentCountMap[m.bandMatchProfile.commitmentLevel] =
        (commitmentCountMap[m.bandMatchProfile.commitmentLevel] || 0) + 1;
    }
  });

  const sharedGoals = Object.entries(goalCountMap)
    .filter(([_, count]) => count >= 2)
    .map(([goal, count]) => ({ goal: goal as MusicalGoal, count }))
    .sort((a, b) => b.count - a.count);

  const topCommitment = Object.entries(commitmentCountMap).sort((a, b) => b[1] - a[1])[0];
  const commitmentSummary = topCommitment
    ? `${topCommitment[0].replace(/_/g, ' ')} (${topCommitment[1]}/${members.length} members)`
    : 'Varied ambition';

  // 7. Shared Interests (Hobbies)
  const hobbyCountMap: Record<string, number> = {};
  members.forEach((m) => {
    (m.bandMatchProfile?.hobbies || []).forEach((h) => {
      hobbyCountMap[h] = (hobbyCountMap[h] || 0) + 1;
    });
  });

  const sharedHobbies = Object.entries(hobbyCountMap)
    .filter(([_, count]) => count >= 2)
    .map(([hobby, count]) => ({ hobby: hobby as HobbyInterest, count }))
    .sort((a, b) => b.count - a.count);

  // 8. Recommendations / Missing Needs
  const recommendations: string[] = [];
  if (!hasStandardRhythmSection) {
    if (instrumentCounts.drums.count === 0 && instrumentCounts.bass.count === 0) {
      recommendations.push('Missing rhythm section foundation (Needs Drums & Bass)');
    } else if (instrumentCounts.drums.count === 0) {
      recommendations.push('Rhythm section incomplete: Needs a Drummer');
    } else {
      recommendations.push('Rhythm section incomplete: Needs a Bassist');
    }
  }

  if (instrumentCounts.vocals.count === 0) {
    recommendations.push('No lead vocalist designated yet');
  }

  if (!hasFullScheduleOverlap) {
    recommendations.push('Partial schedule conflict exists for some members');
  }

  if (ageSpread > 3) {
    recommendations.push(`Age difference spans ${ageSpread} years; verify ensemble fit`);
  }

  return {
    memberCount: members.length,
    exactAges,
    exactAgesFormatted,
    ageSpread,
    ageCompatibilitySignal,
    bestScheduleWindow,
    hasFullScheduleOverlap,
    scheduleSummary,
    instrumentCoverage,
    instrumentSummary,
    missingCoreInstruments,
    hasStandardRhythmSection,
    skillSpread,
    skillCompatibilitySignal,
    skillCounts,
    sharedStyles,
    styleSummary,
    sharedGoals,
    commitmentSummary,
    sharedHobbies,
    recommendations,
  };
}
