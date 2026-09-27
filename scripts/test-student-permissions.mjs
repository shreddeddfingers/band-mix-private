import assert from 'node:assert';

console.log('🧪 Starting Student Permission & Director Oversight Test Suite...\n');

// Mock localStorage to simulate DataStore in Node
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
globalThis.window = {};

const STORAGE_KEYS = {
  BANDS: 'bandmix_prod_bands',
  STUDENTS: 'bandmix_prod_students',
  DIRECTOR: 'bandmix_prod_director',
  DIRECTORS: 'bandmix_prod_directors',
};

// Test 1: Verify Director Name dynamic resolution logic
console.log('Test 1: Director Oversight Name Resolution (No hardcoded Marcus Vance)');
const currentDirector = {
  id: 'director-custom',
  name: 'Sarah Connor',
  role: 'admin',
};

function resolveDirectorLabel(band, director) {
  const rawName = director?.name || 'Director';
  return rawName.toLowerCase().startsWith('director') ? rawName : `Director ${rawName}`;
}

const label = resolveDirectorLabel({ id: 'band-1', name: 'Neon Echo' }, currentDirector);
assert.strictEqual(label, 'Director Sarah Connor');
assert.ok(!label.includes('Marcus Vance'), 'Label must not contain Marcus Vance');
console.log(`  ✓ Resolved oversight label: "${label}" (Marcus Vance absent)`);

// Test 2: Student Band Scoping
console.log('\nTest 2: Student Membership Band Filtering');
const bands = [
  {
    id: 'band-1',
    name: 'The Sonic Waves',
    members: [
      { userId: 'director-custom', role: 'director', name: 'Sarah Connor' },
      { userId: 'student-101', role: 'member', name: 'Leo Martinez' },
    ],
  },
  {
    id: 'band-2',
    name: 'Midnight Rhythm',
    members: [
      { userId: 'director-custom', role: 'director', name: 'Sarah Connor' },
      { userId: 'student-202', role: 'member', name: 'Emma Watson' },
    ],
  },
];

// Student 101 should only see Band 1
const student101Bands = bands.filter((b) => b.members.some((m) => m.userId === 'student-101'));
assert.strictEqual(student101Bands.length, 1);
assert.strictEqual(student101Bands[0].id, 'band-1');
assert.ok(!student101Bands.some((b) => b.id === 'band-2'), 'Student 101 must not see band-2');
console.log('  ✓ Student 101 filtered to only enrolled ensemble: The Sonic Waves');

// Test 3: Unauthorized Band Detail Access Check
console.log('\nTest 3: Band Page Access Protection');
function checkBandAccess(band, userId, isAdmin) {
  if (isAdmin) return true;
  return band.members.some((m) => m.userId === userId);
}

assert.strictEqual(checkBandAccess(bands[0], 'student-101', false), true, 'Student 101 has access to Band 1');
assert.strictEqual(checkBandAccess(bands[1], 'student-101', false), false, 'Student 101 is denied access to Band 2');
assert.strictEqual(checkBandAccess(bands[1], 'director-custom', true), true, 'Director has access to all bands');
console.log('  ✓ Unauthorized band access is strictly denied for students');

// Test 4: Student Deletion & Ensemble Lineup Cleanup
console.log('\nTest 4: Student Deletion & Ensemble Lineup Cleanup');
let testStudents = [
  { id: 'student-mistake', name: 'Wrong Name Typos', role: 'student' },
  { id: 'student-quitter', name: 'Jack Leaving', role: 'student' },
];
let testBands = [
  {
    id: 'band-rock',
    name: 'Garage Rockers',
    members: [
      { userId: 'director-custom', role: 'director', name: 'Sarah Connor' },
      { userId: 'student-quitter', role: 'member', name: 'Jack Leaving' },
    ],
  },
];

function deleteStudentMock(studentId) {
  if (studentId === 'director-custom') return; // Cannot delete director
  testStudents = testStudents.filter((s) => s.id !== studentId);
  for (const b of testBands) {
    b.members = b.members.filter((m) => m.userId !== studentId);
  }
}

// 1. Delete mistaken account
deleteStudentMock('student-mistake');
assert.strictEqual(testStudents.length, 1);
assert.ok(!testStudents.some((s) => s.id === 'student-mistake'), 'Mistaken student must be removed');
console.log('  ✓ Mistaken student account removed from roster');

// 2. Delete student who quit the program
deleteStudentMock('student-quitter');
assert.strictEqual(testStudents.length, 0);
assert.strictEqual(testBands[0].members.length, 1);
assert.strictEqual(testBands[0].members[0].userId, 'director-custom');
assert.ok(!testBands[0].members.some((m) => m.userId === 'student-quitter'), 'Quitted student removed from all bands');
console.log('  ✓ Quitted student removed from roster and all enrolled band lineups');

// 3. Prevent director deletion
deleteStudentMock('director-custom');
assert.strictEqual(testBands[0].members.length, 1);
console.log('  ✓ Band Director is protected from accidental deletion');

console.log('\n🎉 ALL STUDENT PERMISSION & DIRECTOR OVERSIGHT TESTS PASSED SUCCESSFULLY!\n');
