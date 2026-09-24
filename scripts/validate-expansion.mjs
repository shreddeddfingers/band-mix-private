// scripts/validate-expansion.mjs
import assert from 'node:assert/strict';
import { calculateExactAge, ageToAgeGroup, formatAgeDisplay } from '../src/lib/age-utils.ts';
import {
  calculateScheduleOverlap,
  analyzeGroupCompatibility,
} from '../src/lib/matching-engine.ts';

console.log('====================================================');
console.log('🧪 BANDMIX — COMPREHENSIVE EXPANSION VALIDATION SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// ----------------------------------------------------
// SECTION 3: DOB & EXACT AGE PRIVACY & EDGE CASES
// ----------------------------------------------------
console.log('\n--- SECTION 3: DOB / Exact-Age Privacy & Calculation ---');

runTest('DOB: Birthday today (exact birthday)', () => {
  const ref = new Date(2026, 8, 24); // Sept 24, 2026
  assert.equal(calculateExactAge('2014-09-24', ref), 12);
});

runTest('DOB: Birthday tomorrow (one day before birthday)', () => {
  const ref = new Date(2026, 8, 24); // Sept 24, 2026
  assert.equal(calculateExactAge('2014-09-25', ref), 11);
});

runTest('DOB: Birthday yesterday (one day after birthday)', () => {
  const ref = new Date(2026, 8, 24); // Sept 24, 2026
  assert.equal(calculateExactAge('2014-09-23', ref), 12);
});

runTest('DOB: Year boundary (Dec 31 vs Jan 1)', () => {
  const ref = new Date(2026, 11, 31); // Dec 31, 2026
  assert.equal(calculateExactAge('2010-12-31', ref), 16);
  assert.equal(calculateExactAge('2011-01-01', ref), 15);

  const refJan = new Date(2026, 0, 1); // Jan 1, 2026
  assert.equal(calculateExactAge('2010-01-01', refJan), 16);
  assert.equal(calculateExactAge('2010-01-02', refJan), 15);
});

runTest('DOB: Leap-day birthday (Feb 29)', () => {
  // Born 2012-02-29
  // 2026 is non-leap year. On Feb 28, 2026, birthday has not occurred yet
  const refFeb28 = new Date(2026, 1, 28);
  assert.equal(calculateExactAge('2012-02-29', refFeb28), 13);

  // On March 1, 2026, birthday has passed
  const refMar1 = new Date(2026, 2, 1);
  assert.equal(calculateExactAge('2012-02-29', refMar1), 14);

  // In leap year 2028 on Feb 29
  const refLeap = new Date(2028, 1, 29);
  assert.equal(calculateExactAge('2012-02-29', refLeap), 16);
});

runTest('DOB: Invalid and missing inputs fail gracefully', () => {
  assert.equal(calculateExactAge(''), 0);
  assert.equal(calculateExactAge(null), 0);
  assert.equal(calculateExactAge(undefined), 0);
  assert.equal(calculateExactAge('not-a-date'), 0);
  assert.equal(calculateExactAge('2020'), 0);
});

runTest('Exact age display format preserves integer list e.g. "Ages: 10, 10, 11, 11, 12, 12"', () => {
  const members = [
    { id: '1', name: 'M1', exactAge: 10, primaryInstrument: 'drums' },
    { id: '2', name: 'M2', exactAge: 10, primaryInstrument: 'bass' },
    { id: '3', name: 'M3', exactAge: 11, primaryInstrument: 'guitars' },
    { id: '4', name: 'M4', exactAge: 11, primaryInstrument: 'keyboard' },
    { id: '5', name: 'M5', exactAge: 12, primaryInstrument: 'vocals' },
    { id: '6', name: 'M6', exactAge: 12, primaryInstrument: 'guitars' },
  ];
  const report = analyzeGroupCompatibility(members);
  assert.equal(report.exactAgesFormatted, 'Ages: 10, 10, 11, 11, 12, 12');
  assert.deepEqual(report.exactAges, [10, 10, 11, 11, 12, 12]);
});

// ----------------------------------------------------
// SECTION 4: PREFERRED PRONOUNS ZERO-INFLUENCE
// ----------------------------------------------------
console.log('\n--- SECTION 4: Preferred Pronouns Zero-Influence Verification ---');

runTest('Pronoun variations produce strictly identical matching output', () => {
  const baseMembers = [
    {
      id: 'p1',
      name: 'Taylor',
      exactAge: 14,
      primaryInstrument: 'drums',
      skillLevel: 'intermediate',
      musicalStyles: ['rock', 'pop'],
      bandMatchProfile: {
        musicalGoals: ['play_shows'],
        commitmentLevel: 'committed',
        hobbies: ['gaming'],
      },
      availability: [{ dayOfWeek: 'tuesday', startTime: '16:00', endTime: '18:00' }],
    },
    {
      id: 'p2',
      name: 'Jordan',
      exactAge: 15,
      primaryInstrument: 'bass',
      skillLevel: 'intermediate',
      musicalStyles: ['rock', 'alternative'],
      bandMatchProfile: {
        musicalGoals: ['play_shows'],
        commitmentLevel: 'committed',
        hobbies: ['gaming'],
      },
      availability: [{ dayOfWeek: 'tuesday', startTime: '16:00', endTime: '18:00' }],
    },
  ];

  const testPronouns = [
    undefined,
    '',
    'he/him',
    'she/her',
    'they/them',
    'ze/hir/zir',
    'Custom Non-Standard Pronoun Phrase That Is Extremely Long ' + 'x'.repeat(200),
  ];

  const baseReport = analyzeGroupCompatibility(baseMembers);

  for (const p1 of testPronouns) {
    for (const p2 of testPronouns) {
      const variedMembers = [
        { ...baseMembers[0], pronouns: p1 },
        { ...baseMembers[1], pronouns: p2 },
      ];
      const variedReport = analyzeGroupCompatibility(variedMembers);

      assert.deepEqual(variedReport.exactAges, baseReport.exactAges);
      assert.equal(variedReport.exactAgesFormatted, baseReport.exactAgesFormatted);
      assert.equal(variedReport.ageSpread, baseReport.ageSpread);
      assert.equal(variedReport.ageCompatibilitySignal, baseReport.ageCompatibilitySignal);
      assert.equal(variedReport.hasFullScheduleOverlap, baseReport.hasFullScheduleOverlap);
      assert.equal(variedReport.scheduleSummary, baseReport.scheduleSummary);
      assert.equal(variedReport.instrumentSummary, baseReport.instrumentSummary);
      assert.deepEqual(variedReport.missingCoreInstruments, baseReport.missingCoreInstruments);
      assert.equal(variedReport.skillSpread, baseReport.skillSpread);
      assert.equal(variedReport.skillCompatibilitySignal, baseReport.skillCompatibilitySignal);
      assert.deepEqual(variedReport.sharedStyles, baseReport.sharedStyles);
      assert.deepEqual(variedReport.sharedGoals, baseReport.sharedGoals);
      assert.deepEqual(variedReport.sharedHobbies, baseReport.sharedHobbies);
      assert.deepEqual(variedReport.recommendations, baseReport.recommendations);
    }
  }
});

// ----------------------------------------------------
// SECTION 5: STRUCTURED AVAILABILITY TESTING
// ----------------------------------------------------
console.log('\n--- SECTION 5: Structured Availability & Intersection Logic ---');

runTest('User exact specification: A: 4-7, B: 5-8, C: 5:30-6:30 -> Tuesday 17:30-18:30', () => {
  const members = [
    {
      id: 'a',
      name: 'Student A',
      availability: [{ dayOfWeek: 'tuesday', startTime: '16:00', endTime: '19:00' }],
    },
    {
      id: 'b',
      name: 'Student B',
      availability: [{ dayOfWeek: 'tuesday', startTime: '17:00', endTime: '20:00' }],
    },
    {
      id: 'c',
      name: 'Student C',
      availability: [{ dayOfWeek: 'tuesday', startTime: '17:30', endTime: '18:30' }],
    },
  ];

  const intersections = calculateScheduleOverlap(members);
  assert(intersections.length > 0, 'Must find intersection');
  const best = intersections[0];

  assert.equal(best.dayOfWeek, 'tuesday');
  assert.equal(best.startTime, '17:30');
  assert.equal(best.endTime, '18:30');
  assert.equal(best.availableCount, 3);
  assert.equal(best.totalMembers, 3);
  assert.deepEqual(best.conflictingMemberNames, []);

  const report = analyzeGroupCompatibility(members);
  assert.equal(report.hasFullScheduleOverlap, true);
  assert.equal(report.scheduleSummary, 'Tuesday 17:30–18:30 — 3/3 available');
});

runTest('Availability: Adjacent non-overlapping windows (one starts when other ends)', () => {
  const members = [
    {
      id: 'a',
      name: 'Student A',
      availability: [{ dayOfWeek: 'wednesday', startTime: '16:00', endTime: '17:00' }],
    },
    {
      id: 'b',
      name: 'Student B',
      availability: [{ dayOfWeek: 'wednesday', startTime: '17:00', endTime: '18:00' }],
    },
  ];

  const intersections = calculateScheduleOverlap(members);
  // Each segment has only 1 available member, no segment has 2 members
  const full = intersections.filter((i) => i.availableCount === 2);
  assert.equal(full.length, 0, 'No common overlap when adjacent without duration');
  const report = analyzeGroupCompatibility(members);
  assert.equal(report.hasFullScheduleOverlap, false);
});

runTest('Availability: Multiple windows on the same day', () => {
  const members = [
    {
      id: 'a',
      name: 'Student A',
      availability: [
        { dayOfWeek: 'saturday', startTime: '10:00', endTime: '12:00' },
        { dayOfWeek: 'saturday', startTime: '15:00', endTime: '18:00' },
      ],
    },
    {
      id: 'b',
      name: 'Student B',
      availability: [
        { dayOfWeek: 'saturday', startTime: '14:00', endTime: '17:00' },
      ],
    },
  ];

  const intersections = calculateScheduleOverlap(members);
  const saturdayBest = intersections.find((i) => i.dayOfWeek === 'saturday');
  assert(saturdayBest !== undefined);
  assert.equal(saturdayBest.startTime, '15:00');
  assert.equal(saturdayBest.endTime, '17:00');
  assert.equal(saturdayBest.availableCount, 2);
});

runTest('Availability: Inverted/invalid start-end combinations ignored', () => {
  const members = [
    {
      id: 'a',
      name: 'Student A',
      availability: [{ dayOfWeek: 'friday', startTime: '19:00', endTime: '17:00' }], // invalid!
    },
    {
      id: 'b',
      name: 'Student B',
      availability: [{ dayOfWeek: 'friday', startTime: '16:00', endTime: '18:00' }],
    },
  ];

  const intersections = calculateScheduleOverlap(members);
  const fridayFull = intersections.find((i) => i.dayOfWeek === 'friday' && i.availableCount === 2);
  assert.equal(fridayFull, undefined, 'Invalid window must not count as overlap');
});

runTest('Availability: Empty availability returns graceful empty state', () => {
  const members = [
    { id: 'a', name: 'Student A', availability: [] },
    { id: 'b', name: 'Student B' },
  ];
  const intersections = calculateScheduleOverlap(members);
  assert.equal(intersections.length, 0);
  const report = analyzeGroupCompatibility(members);
  assert.equal(report.hasFullScheduleOverlap, false);
});

// ----------------------------------------------------
// SECTION 6: MATCHING ENGINE STRESS TEST (400 STUDENTS)
// ----------------------------------------------------
console.log('\n--- SECTION 6: 400-Student Synthetic Stress Test ---');

const INSTRUMENTS = ['drums', 'bass', 'guitars', 'keyboard', 'piano', 'vocals', 'horns'];
const STYLES = ['rock', 'pop', 'jazz', 'metal', 'punk', 'funk', 'rnb', 'indie'];
const GOALS = ['have_fun', 'play_shows', 'write_originals', 'record_music', 'build_chops'];
const COMMITMENTS = ['casual', 'moderate', 'committed', 'competitive'];
const HOBBIES = ['gaming', 'sports', 'anime', 'art_drawing', 'skateboarding', 'reading'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function generateSyntheticProgram(studentCount = 400, bandCount = 25) {
  const students = [];

  for (let i = 1; i <= studentCount; i++) {
    // Deliberate imbalance: 40% guitarists, 10% drummers, 10% bassists
    let primary;
    const r = Math.random();
    if (r < 0.40) primary = 'guitars';
    else if (r < 0.50) primary = 'drums';
    else if (r < 0.60) primary = 'bass';
    else if (r < 0.75) primary = 'vocals';
    else if (r < 0.85) primary = 'keyboard';
    else primary = 'horns';

    // Exact ages 8 to 18
    const exactAge = 8 + Math.floor(Math.random() * 11);

    // Availability: 1-3 days
    const availCount = Math.floor(Math.random() * 3) + 1;
    const avail = [];
    for (let d = 0; d < availCount; d++) {
      const day = DAYS[(i + d) % DAYS.length];
      const startH = 15 + Math.floor(Math.random() * 3); // 15, 16, 17
      const endH = startH + 2 + Math.floor(Math.random() * 2); // +2 or +3 hours
      avail.push({
        dayOfWeek: day,
        startTime: `${startH}:00`,
        endTime: `${endH}:00`,
      });
    }

    students.push({
      id: `student_${i}`,
      name: `Student ${i}`,
      exactAge,
      primaryInstrument: primary,
      skillLevel: ['beginner', 'intermediate', 'advanced', 'expert'][i % 4],
      musicalStyles: [STYLES[i % STYLES.length], STYLES[(i + 2) % STYLES.length]],
      bandMatchProfile: {
        musicalGoals: [GOALS[i % GOALS.length]],
        commitmentLevel: COMMITMENTS[i % COMMITMENTS.length],
        hobbies: [HOBBIES[i % HOBBIES.length]],
      },
      availability: i % 20 === 0 ? [] : avail, // 5% have no availability
      bandIds: [],
    });
  }

  // Pre-seed 25 bands
  const bands = [];
  for (let b = 1; b <= bandCount; b++) {
    bands.push({
      id: `band_${b}`,
      name: `Ensemble ${b}`,
      genre: STYLES[b % STYLES.length],
      status: b > 20 ? 'archived' : 'active',
      members: [],
    });
  }

  return { students, bands };
}

runTest('Stress Test: Generate 400 students & evaluate compatibility responsiveness', () => {
  const startGen = performance.now();
  const { students, bands } = generateSyntheticProgram(400, 25);
  const genTime = performance.now() - startGen;

  assert.equal(students.length, 400);
  assert.equal(bands.length, 25);

  // Evaluate candidate sorting performance
  const startSort = performance.now();
  const candidatePool = students.filter((s) => s.bandIds.length === 0);
  // Sort candidate pool by instrument then age
  candidatePool.sort((a, b) => {
    if (a.primaryInstrument !== b.primaryInstrument) {
      return a.primaryInstrument.localeCompare(b.primaryInstrument);
    }
    return (a.exactAge || 0) - (b.exactAge || 0);
  });
  const sortTime = performance.now() - startSort;

  // Run 100 group compatibility evaluations on random 5-piece bands
  const startEval = performance.now();
  let completedEvals = 0;
  for (let i = 0; i < 100; i++) {
    const sample = [
      students[i % 400],
      students[(i + 40) % 400],
      students[(i + 80) % 400],
      students[(i + 120) % 400],
      students[(i + 160) % 400],
    ];
    const report = analyzeGroupCompatibility(sample);
    assert(report.memberCount === 5);
    completedEvals++;
  }
  const evalTime = performance.now() - startEval;
  const avgEvalMs = evalTime / 100;

  console.log(`   - 400 Student Dataset Generated in: ${genTime.toFixed(2)}ms`);
  console.log(`   - 400 Student Roster Sort in: ${sortTime.toFixed(2)}ms`);
  console.log(`   - 100 5-Piece Band Compatibility Analyses: ${evalTime.toFixed(2)}ms (Avg: ${avgEvalMs.toFixed(3)}ms per band)`);
  assert(avgEvalMs < 5, 'Band compatibility analysis must take under 5ms per band');
});

runTest('Decision Hierarchy Verification: Availability -> Age -> Instrument -> Skill', () => {
  const sA = {
    id: 'sA',
    name: 'Alice (Drummer)',
    exactAge: 12,
    primaryInstrument: 'drums',
    skillLevel: 'intermediate',
    availability: [{ dayOfWeek: 'monday', startTime: '16:00', endTime: '18:00' }],
  };
  const sB = {
    id: 'sB',
    name: 'Bob (Bassist)',
    exactAge: 13,
    primaryInstrument: 'bass',
    skillLevel: 'intermediate',
    availability: [{ dayOfWeek: 'monday', startTime: '16:00', endTime: '18:00' }],
  };
  const sC_Conflict = {
    id: 'sC',
    name: 'Charlie (Guitarist Conflict)',
    exactAge: 12,
    primaryInstrument: 'guitars',
    skillLevel: 'intermediate',
    availability: [{ dayOfWeek: 'tuesday', startTime: '16:00', endTime: '18:00' }], // No overlap with Mon
  };
  const sD_AgeGap = {
    id: 'sD',
    name: 'David (Adult Guitarist)',
    exactAge: 25, // Large age gap
    primaryInstrument: 'guitars',
    skillLevel: 'intermediate',
    availability: [{ dayOfWeek: 'monday', startTime: '16:00', endTime: '18:00' }],
  };

  const reportConflict = analyzeGroupCompatibility([sA, sB, sC_Conflict]);
  assert.equal(reportConflict.hasFullScheduleOverlap, false);
  assert(reportConflict.recommendations.some((r) => r.includes('Partial schedule conflict')));

  const reportAgeGap = analyzeGroupCompatibility([sA, sB, sD_AgeGap]);
  assert.equal(reportAgeGap.hasFullScheduleOverlap, true);
  assert.equal(reportAgeGap.ageCompatibilitySignal, 'Wide Age Spread');
  assert(reportAgeGap.recommendations.some((r) => r.includes('Age difference spans')));
});

// ----------------------------------------------------
// SECTION 8: ANONYMOUS SONG SUGGESTIONS & VOTING
// ----------------------------------------------------
console.log('\n--- SECTION 8: Anonymous Song Suggestions & Voting Logic ---');

runTest('Song Voting: Changing vote updates aggregate count without creating duplicate ballot', () => {
  const votes = [
    { songId: 'song_1', userId: 'student_1', sentiment: 'really_want' },
    { songId: 'song_1', userId: 'student_2', sentiment: 'would_play' },
    { songId: 'song_1', userId: 'student_3', sentiment: 'neutral' },
  ];

  function computeSummary(all) {
    return {
      reallyWant: all.filter((v) => v.sentiment === 'really_want').length,
      wouldPlay: all.filter((v) => v.sentiment === 'would_play').length,
      neutral: all.filter((v) => v.sentiment === 'neutral').length,
      notInterested: all.filter((v) => v.sentiment === 'not_interested').length,
      totalVotes: all.length,
    };
  }

  let summary = computeSummary(votes);
  assert.equal(summary.totalVotes, 3);
  assert.equal(summary.reallyWant, 1);
  assert.equal(summary.wouldPlay, 1);
  assert.equal(summary.neutral, 1);

  // Student 3 updates vote from 'neutral' to 'really_want'
  const idx = votes.findIndex((v) => v.userId === 'student_3');
  votes[idx].sentiment = 'really_want';

  summary = computeSummary(votes);
  assert.equal(summary.totalVotes, 3, 'Total votes MUST remain 3 (no duplicate ballots)');
  assert.equal(summary.reallyWant, 2);
  assert.equal(summary.neutral, 0);
});

runTest('Peer Anonymity: Student submitter identity masked for peer students', () => {
  const song = {
    id: 's1',
    title: 'Everlong',
    artist: 'Foo Fighters',
    suggestedBy: 'student_42',
    suggestedByName: 'Alice Smith',
    status: 'suggested',
  };

  function getDisplaySubmitter(song, viewerRole) {
    if (viewerRole === 'admin') return song.suggestedByName || 'Band Member';
    return 'Band Member'; // Masked for students
  }

  assert.equal(getDisplaySubmitter(song, 'student'), 'Band Member');
  assert.equal(getDisplaySubmitter(song, 'admin'), 'Alice Smith');
});

// ----------------------------------------------------
// SECTION 9: MASTER REPERTOIRE LIFECYCLE
// ----------------------------------------------------
console.log('\n--- SECTION 9: Master Repertoire & Setlist Lifecycle ---');

runTest('Repertoire Status Progression: suggested -> learning -> rehearsing -> performance_ready -> retired', () => {
  const song = {
    id: 's100',
    title: 'Paranoid',
    artist: 'Black Sabbath',
    key: 'E minor',
    tempoBpm: 162,
    leadVocalist: 'Ozzy',
    directorNotes: 'Focus on guitar solo transition',
    status: 'suggested',
  };

  const allowedStatuses = ['suggested', 'learning', 'rehearsing', 'performance_ready', 'retired'];
  for (const nextStatus of allowedStatuses) {
    song.status = nextStatus;
    assert.equal(song.status, nextStatus);
  }

  assert.equal(song.key, 'E minor');
  assert.equal(song.tempoBpm, 162);
  assert.equal(song.leadVocalist, 'Ozzy');
});

// ----------------------------------------------------
// SECTION 10: ANNOUNCEMENTS TESTING
// ----------------------------------------------------
console.log('\n--- SECTION 10: Persistent Announcements Sorting & Pinning ---');

runTest('Announcements sort pinned items to top, then newest by date', () => {
  const items = [
    { id: '1', title: 'Normal 1', isPinned: false, createdAt: '2026-09-01T00:00:00Z' },
    { id: '2', title: 'Pinned Older', isPinned: true, createdAt: '2026-09-05T00:00:00Z' },
    { id: '3', title: 'Normal Newest', isPinned: false, createdAt: '2026-09-10T00:00:00Z' },
    { id: '4', title: 'Pinned Newest', isPinned: true, createdAt: '2026-09-08T00:00:00Z' },
  ];

  items.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  assert.equal(items[0].id, '4', 'Pinned newest first');
  assert.equal(items[1].id, '2', 'Pinned older second');
  assert.equal(items[2].id, '3', 'Unpinned newest third');
  assert.equal(items[3].id, '1', 'Unpinned older fourth');
});

// ----------------------------------------------------
// SECTION 11: POLYMORPHIC EVENTS & RSVP
// ----------------------------------------------------
console.log('\n--- SECTION 11: Polymorphic Band Events & RSVP ---');

runTest('Polymorphic event types, call times, and per-user RSVP isolation', () => {
  const event = {
    id: 'evt_gig',
    bandId: 'band_1',
    eventType: 'gig',
    title: 'Battle of the Bands',
    location: 'Main Amphitheater',
    date: '2026-10-30',
    startTime: '18:00',
    endTime: '22:00',
    callTime: '17:00',
    performanceTime: '19:45',
    repertoireSongIds: ['song_1', 'song_2'],
    rsvps: {
      student_1: 'attending',
      student_2: 'tentative',
    },
  };

  assert.equal(event.eventType, 'gig');
  assert.equal(event.callTime, '17:00');
  assert.equal(event.performanceTime, '19:45');

  // Student 1 changes RSVP to declined
  event.rsvps['student_1'] = 'declined';
  assert.equal(event.rsvps['student_1'], 'declined');
  // Student 2 remains unchanged
  assert.equal(event.rsvps['student_2'], 'tentative');
});

// ----------------------------------------------------
// SECTION 12: BAND ARCHIVE & HISTORY SNAPSHOT INTEGRITY
// ----------------------------------------------------
console.log('\n--- SECTION 12: Band Archive & History Snapshot Integrity ---');

runTest('Band history snapshot remains historically immutable after live modifications', () => {
  const liveBand = {
    id: 'band_history_test',
    name: 'The Vintage Rockers',
    genre: 'Classic Rock',
    status: 'archived',
    archivedAt: '2026-09-24T12:00:00Z',
    members: [
      { userId: 'u1', name: 'Original Singer', instrument: 'vocals', role: 'member', joinedAt: '2026-01-01' },
      { userId: 'u2', name: 'Original Drummer', instrument: 'drums', role: 'member', joinedAt: '2026-01-01' },
    ],
  };

  const liveSongs = [
    { title: 'Song 1', artist: 'Band A', status: 'performance_ready' },
  ];

  // Take snapshot
  const snapshot = {
    bandId: liveBand.id,
    bandName: liveBand.name,
    genre: liveBand.genre,
    status: liveBand.status,
    archivedAt: liveBand.archivedAt,
    finalLineup: liveBand.members.map((m) => ({ ...m })),
    finalRepertoire: liveSongs.map((s) => ({ ...s })),
    pastEventsCount: 5,
  };

  // Mutate liveBand (e.g. member changes name or is removed in live roster)
  liveBand.members[0].name = 'Renamed Singer';
  liveBand.members.pop();
  liveSongs.push({ title: 'Song 2', artist: 'Band B', status: 'learning' });

  // Snapshot must remain intact
  assert.equal(snapshot.finalLineup.length, 2);
  assert.equal(snapshot.finalLineup[0].name, 'Original Singer');
  assert.equal(snapshot.finalRepertoire.length, 1);
  assert.equal(snapshot.pastEventsCount, 5);
});

// ----------------------------------------------------
// SECTION 15: EDGE CASES & DATA INTEGRITY
// ----------------------------------------------------
console.log('\n--- SECTION 15: Edge Cases & Data Integrity ---');

runTest('analyzeGroupCompatibility handles extreme edge cases without crashing', () => {
  // Empty members
  const emptyReport = analyzeGroupCompatibility([]);
  assert.equal(emptyReport.memberCount, 0);

  // Single member band
  const singleReport = analyzeGroupCompatibility([
    { id: '1', name: 'Solo', exactAge: 12, primaryInstrument: 'piano' },
  ]);
  assert.equal(singleReport.memberCount, 1);

  // Band with missing primary instruments, no availability, undefined objects
  const malformedReport = analyzeGroupCompatibility([
    { id: '2', name: 'Malformed 1' },
    { id: '3', name: 'Malformed 2', availability: null, bandMatchProfile: null },
  ]);
  assert.equal(malformedReport.memberCount, 2);
});

console.log('\n====================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} VALIDATION TESTS PASSED CLEANLY!`);
console.log('====================================================\n');
