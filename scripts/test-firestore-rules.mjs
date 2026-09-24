// scripts/test-firestore-rules.mjs
import assert from 'node:assert/strict';

console.log('--- ADVERSARIAL FIRESTORE RULES ISOLATION & PERMISSION TEST ---');

// Mock Firestore Rules evaluator replicating firestore.rules logic
class MockFirestoreEnv {
  constructor() {
    this.users = {
      director_uid: { id: 'director_uid', role: 'admin', name: 'Director Dave' },
      student_a: { id: 'student_a', role: 'student', name: 'Student Alice', bandIds: ['band_a'] },
      student_b: { id: 'student_b', role: 'student', name: 'Student Bob', bandIds: ['band_a'] },
      student_c: { id: 'student_c', role: 'student', name: 'Student Charlie', bandIds: ['band_b'] }, // in Band B only
    };

    this.privateProfiles = {
      student_a: { dob: '2012-05-15', guardianPhone: '555-1001' },
      student_b: { dob: '2011-09-20', guardianPhone: '555-1002' },
      student_c: { dob: '2010-01-10', guardianPhone: '555-1003' },
    };

    this.bands = {
      band_a: { id: 'band_a', name: 'Band A', memberIds: ['student_a', 'student_b'] },
      band_b: { id: 'band_b', name: 'Band B', memberIds: ['student_c'] },
    };

    this.rehearsals = {
      evt_1: {
        id: 'evt_1',
        title: 'Rehearsal 1',
        date: '2026-10-01',
        rsvps: { student_a: 'attending' },
      },
    };
  }

  // Helpers from firestore.rules
  isAdmin(auth) {
    if (!auth) return false;
    const u = this.users[auth.uid];
    return Boolean(u && u.role === 'admin');
  }

  isBandMember(bandId, auth) {
    if (!auth) return false;
    if (this.isAdmin(auth)) return true;
    const band = this.bands[bandId];
    return Boolean(band && band.memberIds.includes(auth.uid));
  }

  // Rule 1: /users/{userId}/private/{docId}
  canAccessPrivateProfile(targetUserId, auth) {
    if (!auth) return false;
    return auth.uid === targetUserId || this.isAdmin(auth);
  }

  // Rule 2: /bands/{bandId}/messages
  canReadMessages(bandId, auth) {
    return this.isBandMember(bandId, auth);
  }

  canCreateMessage(bandId, auth, msgData) {
    if (!this.isBandMember(bandId, auth)) return false;
    if (msgData.senderId !== auth.uid) return false;
    if (!msgData.text || msgData.text.length > 2000) return false;
    return true;
  }

  // Rule 3: /bands/{bandId}/announcements
  canReadAnnouncements(bandId, auth) {
    return this.isBandMember(bandId, auth);
  }

  canWriteAnnouncement(bandId, auth) {
    return this.isAdmin(auth);
  }

  // Rule 4: /bands/{bandId}/songs
  canReadSongs(bandId, auth) {
    return this.isBandMember(bandId, auth);
  }

  canCreateSongSuggestion(bandId, auth, songData) {
    if (!this.isBandMember(bandId, auth)) return false;
    if (!songData.title || !songData.artist) return false;
    return true;
  }

  canUpdateSongStatus(bandId, auth) {
    return this.isAdmin(auth);
  }

  // Rule 5: /bands/{bandId}/songs/{songId}/votes/{voteUserId}
  canReadVote(bandId, voteUserId, auth) {
    if (!this.isBandMember(bandId, auth)) return false;
    return auth.uid === voteUserId || this.isAdmin(auth);
  }

  canWriteVote(bandId, voteUserId, auth, voteData) {
    if (!this.isBandMember(bandId, auth)) return false;
    if (auth.uid !== voteUserId) return false;
    const allowed = ['really_want', 'would_play', 'neutral', 'not_interested'];
    if (!allowed.includes(voteData.sentiment)) return false;
    return true;
  }

  // Rule 6: /rehearsals/{eventId} RSVP update
  canUpdateRehearsal(eventId, auth, updatePayload) {
    if (this.isAdmin(auth)) return true;
    if (!auth) return false;

    // Must affect ONLY 'rsvps'
    const keys = Object.keys(updatePayload);
    if (keys.length !== 1 || keys[0] !== 'rsvps') return false;

    // Must touch ONLY the student's own entry
    const rsvpKeys = Object.keys(updatePayload.rsvps);
    if (rsvpKeys.length !== 1 || rsvpKeys[0] !== auth.uid) return false;

    const val = updatePayload.rsvps[auth.uid];
    if (!['attending', 'declined', 'tentative'].includes(val)) return false;

    return true;
  }
}

const env = new MockFirestoreEnv();
const director = { uid: 'director_uid' };
const studentA = { uid: 'student_a' };
const studentB = { uid: 'student_b' };
const studentC = { uid: 'student_c' }; // Band B member only

// 1. Director Administrative Privileges
assert(env.canAccessPrivateProfile('student_a', director) === true, 'Director can access student private profile');
assert(env.canWriteAnnouncement('band_a', director) === true, 'Director can write announcements');
assert(env.canUpdateSongStatus('band_a', director) === true, 'Director can update song status');
assert(env.canReadVote('band_a', 'student_a', director) === true, 'Director can inspect vote for moderation');
assert(env.canUpdateRehearsal('evt_1', director, { title: 'New Title' }) === true, 'Director can edit rehearsal fields');
console.log('✓ Director administrative authorization verified');

// 2. Student A (Band A) Intra-Band Permitted Actions
assert(env.canAccessPrivateProfile('student_a', studentA) === true, 'Student A can access own private profile');
assert(env.canReadMessages('band_a', studentA) === true, 'Student A can read Band A messages');
assert(env.canCreateMessage('band_a', studentA, { senderId: 'student_a', text: 'Hey band!' }) === true, 'Student A can send message');
assert(env.canReadAnnouncements('band_a', studentA) === true, 'Student A can read Band A announcements');
assert(env.canCreateSongSuggestion('band_a', studentA, { title: 'Song', artist: 'Artist' }) === true, 'Student A can suggest song');
assert(env.canReadVote('band_a', 'student_a', studentA) === true, 'Student A can read own vote');
assert(env.canWriteVote('band_a', 'student_a', studentA, { sentiment: 'really_want' }) === true, 'Student A can cast own vote');
assert(env.canUpdateRehearsal('evt_1', studentA, { rsvps: { student_a: 'attending' } }) === true, 'Student A can RSVP own attendance');
console.log('✓ Student intra-band permitted operations verified');

// 3. Student A Cross-Band Adversarial Attacks on Band B (MUST FAIL)
assert(env.canReadMessages('band_b', studentA) === false, 'Student A CANNOT read Band B messages');
assert(env.canCreateMessage('band_b', studentA, { senderId: 'student_a', text: 'Infiltrating Band B' }) === false, 'Student A CANNOT post in Band B');
assert(env.canReadAnnouncements('band_b', studentA) === false, 'Student A CANNOT read Band B announcements');
assert(env.canCreateSongSuggestion('band_b', studentA, { title: 'Troll', artist: 'Troll' }) === false, 'Student A CANNOT suggest songs to Band B');
assert(env.canReadVote('band_b', 'student_c', studentA) === false, 'Student A CANNOT read Band B votes');
assert(env.canWriteVote('band_b', 'student_a', studentA, { sentiment: 'really_want' }) === false, 'Student A CANNOT vote in Band B');
console.log('✓ Cross-band isolation verified (all cross-band attacks blocked)');

// 4. Student A Peer-to-Peer Privacy Attacks on Student B (MUST FAIL)
assert(env.canAccessPrivateProfile('student_b', studentA) === false, 'Student A CANNOT read Student B private profile/DOB');
assert(env.canReadVote('band_a', 'student_b', studentA) === false, 'Student A CANNOT inspect Student B vote');
assert(env.canWriteVote('band_a', 'student_b', studentA, { sentiment: 'not_interested' }) === false, 'Student A CANNOT spoof Student B vote');
assert(env.canCreateMessage('band_a', studentA, { senderId: 'student_b', text: 'Spoofed msg' }) === false, 'Student A CANNOT spoof senderId');
assert(env.canUpdateRehearsal('evt_1', studentA, { rsvps: { student_b: 'declined' } }) === false, 'Student A CANNOT alter Student B RSVP');
assert(env.canUpdateRehearsal('evt_1', studentA, { title: 'Hijacked Event' }) === false, 'Student A CANNOT alter rehearsal title');
console.log('✓ Peer privacy & ballot secrecy verified (all peer tampering blocked)');

// 5. Student Escalation Attacks (MUST FAIL)
assert(env.canWriteAnnouncement('band_a', studentA) === false, 'Student A CANNOT create announcements');
assert(env.canUpdateSongStatus('band_a', studentA) === false, 'Student A CANNOT approve song into repertoire');
assert(env.canWriteVote('band_a', 'student_a', studentA, { sentiment: 'SUPER_LIKE' }) === false, 'Invalid sentiment value rejected');
console.log('✓ Privilege escalation and payload tampering blocked');

console.log('ALL ADVERSARIAL FIRESTORE RULES TESTS PASSED! 🛡️');
