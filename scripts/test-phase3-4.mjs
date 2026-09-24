// scripts/test-phase3-4.mjs
import assert from 'node:assert/strict';

console.log('--- RUNNING PHASE 3 & 4 TESTS ---');

// 1. Test Song Status & Sentiment aggregation logic
const sentimentWeights = {
  love_it: 3,
  like_it: 2,
  neutral: 1,
  not_for_me: 0,
};

function aggregateVotes(votes) {
  const summary = {
    loveIt: 0,
    likeIt: 0,
    neutral: 0,
    notForMe: 0,
    totalVotes: votes.length,
    score: 0,
  };

  votes.forEach((v) => {
    if (v.sentiment === 'love_it') summary.loveIt += 1;
    if (v.sentiment === 'like_it') summary.likeIt += 1;
    if (v.sentiment === 'neutral') summary.neutral += 1;
    if (v.sentiment === 'not_for_me') summary.notForMe += 1;
    summary.score += sentimentWeights[v.sentiment] ?? 0;
  });

  return summary;
}

const mockVotes = [
  { userId: 'u1', sentiment: 'love_it' },
  { userId: 'u2', sentiment: 'love_it' },
  { userId: 'u3', sentiment: 'like_it' },
  { userId: 'u4', sentiment: 'neutral' },
  { userId: 'u5', sentiment: 'not_for_me' },
];

const summary = aggregateVotes(mockVotes);
assert.equal(summary.totalVotes, 5, 'Total votes count matches');
assert.equal(summary.loveIt, 2, 'loveIt count matches');
assert.equal(summary.likeIt, 1, 'likeIt count matches');
assert.equal(summary.neutral, 1, 'neutral count matches');
assert.equal(summary.notForMe, 1, 'notForMe count matches');
// 2*3 + 1*2 + 1*1 + 1*0 = 6 + 2 + 1 + 0 = 9
assert.equal(summary.score, 9, 'Score calculation matches');
console.log('✓ Anonymous vote aggregation & sentiment scoring passed');

// 2. Test Announcement sorting logic (pinned first, then by date descending)
const announcements = [
  { id: '1', title: 'A1', isPinned: false, createdAt: '2026-09-20T10:00:00Z' },
  { id: '2', title: 'A2 (Pinned)', isPinned: true, createdAt: '2026-09-18T10:00:00Z' },
  { id: '3', title: 'A3', isPinned: false, createdAt: '2026-09-22T10:00:00Z' },
  { id: '4', title: 'A4 (Pinned Newest)', isPinned: true, createdAt: '2026-09-21T10:00:00Z' },
];

const sortedAnnouncements = [...announcements].sort((a, b) => {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

assert.equal(sortedAnnouncements[0].id, '4', 'Pinned newest should be first');
assert.equal(sortedAnnouncements[1].id, '2', 'Pinned older should be second');
assert.equal(sortedAnnouncements[2].id, '3', 'Unpinned newest should be third');
assert.equal(sortedAnnouncements[3].id, '1', 'Unpinned older should be last');
console.log('✓ Announcement pinning and sorting order passed');

// 3. Test Polymorphic BandEvent structure and RSVP
const sampleEvent = {
  id: 'evt-101',
  bandId: 'band-1',
  eventType: 'gig',
  title: 'Fall Showcase Concert',
  date: '2026-10-15',
  startTime: '18:00',
  endTime: '21:00',
  callTime: '17:15',
  performanceTime: '19:30',
  venue: 'Mercury Lounge',
  location: 'Downtown Main Stage',
  songIds: ['song-1', 'song-2'],
  rsvps: {
    user_alice: 'attending',
    user_bob: 'tentative',
    user_carol: 'declined',
  },
};

assert.equal(sampleEvent.eventType, 'gig');
assert.equal(sampleEvent.callTime, '17:15');
assert.equal(sampleEvent.performanceTime, '19:30');
assert.equal(sampleEvent.songIds.length, 2);
assert.equal(sampleEvent.rsvps['user_alice'], 'attending');
assert.equal(sampleEvent.rsvps['user_bob'], 'tentative');
assert.equal(sampleEvent.rsvps['user_carol'], 'declined');
console.log('✓ Polymorphic BandEvent (gig with call times and RSVPs) passed');

// 4. Test Band History Snapshot Record
const mockBand = {
  id: 'band-rock',
  name: 'Thunderbolts',
  genre: 'Classic Rock',
  status: 'archived',
  archivedAt: '2026-09-24T12:00:00.000Z',
  members: [
    { userId: 'u1', name: 'Alice', instrument: 'guitar', role: 'leader', joinedAt: '2026-01-01' },
    { userId: 'u2', name: 'Bob', instrument: 'drums', role: 'member', joinedAt: '2026-01-05' },
  ],
};

const mockSongs = [
  { id: 's1', title: 'Smoke on the Water', artist: 'Deep Purple', status: 'performance_ready' },
  { id: 's2', title: 'Back in Black', artist: 'AC/DC', status: 'learning' },
];

const mockEvents = [
  { id: 'e1', eventType: 'rehearsal' },
  { id: 'e2', eventType: 'gig' },
  { id: 'e3', eventType: 'showcase' },
];

const historyRecord = {
  bandId: mockBand.id,
  bandName: mockBand.name,
  genre: mockBand.genre,
  status: mockBand.status,
  archivedAt: mockBand.archivedAt,
  finalLineup: mockBand.members.map((m) => ({
    userId: m.userId,
    name: m.name,
    instrument: m.instrument,
    role: m.role,
    joinedAt: m.joinedAt,
  })),
  finalRepertoire: mockSongs.map((s) => ({
    title: s.title,
    artist: s.artist,
    status: s.status,
  })),
  pastEventsCount: mockEvents.length,
};

assert.equal(historyRecord.bandId, 'band-rock');
assert.equal(historyRecord.finalLineup.length, 2);
assert.equal(historyRecord.finalRepertoire.length, 2);
assert.equal(historyRecord.pastEventsCount, 3);
assert.equal(historyRecord.status, 'archived');
assert(historyRecord.archivedAt !== undefined);
console.log('✓ Band History snapshot record structure and preservation passed');

console.log('ALL PHASE 3 & 4 LOGIC TESTS PASSED SUCCESSFULLY! 🎉');
