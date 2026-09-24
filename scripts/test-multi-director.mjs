import assert from 'node:assert';

console.log('🧪 Starting Multi-Director Isolation & Account Scoping Test Suite...\n');

// Mock localStorage to simulate DataStore in Node
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
globalThis.window = {};

// We can define the DataStore logic matching our production data-store.ts
const STORAGE_KEYS = {
  BANDS: 'bandmix_prod_bands',
  STUDENTS: 'bandmix_prod_students',
  DIRECTOR: 'bandmix_prod_director',
  DIRECTORS: 'bandmix_prod_directors',
  INVITES: 'bandmix_prod_invites',
};

const BASELINE_DIRECTOR = {
  id: 'director-main',
  name: 'Marcus Vance',
  email: 'marcus@musicstudio.edu',
  role: 'admin',
  directorId: 'director-main',
  studioName: 'Highland Music Studio',
  primaryInstrument: 'piano',
};

const BASELINE_INVITE = {
  code: 'STUDIO-PASS',
  directorId: 'director-main',
  directorName: 'Marcus Vance',
  studioName: 'Highland Music Studio',
  role: 'student',
  label: 'Studio Student Intake Pass',
  usedCount: 0,
  maxUses: 1000,
};

function loadItem(key, fallback) {
  const item = storage.get(key);
  return item ? JSON.parse(item) : fallback;
}

function saveItem(key, val) {
  storage.set(key, JSON.stringify(val));
}

const TestDataStore = {
  getDirectors() {
    const list = loadItem(STORAGE_KEYS.DIRECTORS, []);
    if (!list.some((d) => d.id === BASELINE_DIRECTOR.id)) {
      list.unshift(BASELINE_DIRECTOR);
    }
    return list;
  },

  getDirector(id) {
    if (id) {
      const directors = this.getDirectors();
      const found = directors.find((d) => d.id === id);
      if (found) return found;
    }
    return loadItem(STORAGE_KEYS.DIRECTOR, BASELINE_DIRECTOR);
  },

  createDirector(data) {
    const newId = `director-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newDirector = {
      id: newId,
      name: data.name,
      email: data.email,
      role: 'admin',
      directorId: newId,
      studioName: data.studioName,
      primaryInstrument: data.primaryInstrument,
      bio: data.bio || `Band Director at ${data.studioName}.`,
      joinedAt: new Date().toISOString(),
      bandIds: [],
    };

    const directors = this.getDirectors();
    directors.push(newDirector);
    saveItem(STORAGE_KEYS.DIRECTORS, directors);
    saveItem(STORAGE_KEYS.DIRECTOR, newDirector);

    // Auto-create invite pass
    const cleanPrefix = data.studioName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'STUDIO';
    const studioInvite = {
      code: `${cleanPrefix}-PASS`,
      role: 'student',
      label: `${data.studioName} Student QR Intake Pass`,
      directorId: newId,
      directorName: data.name,
      studioName: data.studioName,
      usedCount: 0,
      maxUses: 500,
    };

    const invites = loadItem(STORAGE_KEYS.INVITES, [BASELINE_INVITE]);
    saveItem(STORAGE_KEYS.INVITES, [studioInvite, ...invites]);

    return newDirector;
  },

  getStudents(directorId) {
    const students = loadItem(STORAGE_KEYS.STUDENTS, []);
    if (!directorId) return students;
    return students.filter(
      (s) =>
        s.directorId === directorId ||
        (directorId === 'director-main' && (!s.directorId || s.directorId === 'director-main'))
    );
  },

  createStudent(data) {
    const students = loadItem(STORAGE_KEYS.STUDENTS, []);
    const newId = `student-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    let resolvedDirectorId = data.directorId;
    if (!resolvedDirectorId && data.bandIdToJoin) {
      const targetBand = this.getBands().find((b) => b.id === data.bandIdToJoin);
      if (targetBand) {
        resolvedDirectorId = targetBand.directorId || targetBand.createdBy;
      }
    }
    if (!resolvedDirectorId) {
      resolvedDirectorId = this.getDirector().id || 'director-main';
    }

    const newStudent = {
      ...data,
      id: newId,
      directorId: resolvedDirectorId,
      role: 'student',
      bandIds: data.bandIdToJoin ? [data.bandIdToJoin] : [],
    };

    saveItem(STORAGE_KEYS.STUDENTS, [newStudent, ...students]);
    return newStudent;
  },

  getBands(directorId) {
    const bands = loadItem(STORAGE_KEYS.BANDS, []);
    if (!directorId) return bands;
    return bands.filter(
      (b) =>
        b.directorId === directorId ||
        b.createdBy === directorId ||
        (directorId === 'director-main' &&
          (!b.directorId && (!b.createdBy || b.createdBy === 'director-main')))
    );
  },

  createBand(data) {
    const bands = loadItem(STORAGE_KEYS.BANDS, []);
    const director = data.directorId ? this.getDirector(data.directorId) : this.getDirector();
    const newBandId = `band-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

    const newBand = {
      id: newBandId,
      name: data.name,
      genre: data.genre,
      createdBy: director.id,
      directorId: director.id,
      members: [
        {
          userId: director.id,
          name: director.name,
          role: 'director',
          instrument: director.primaryInstrument,
        },
      ],
    };

    saveItem(STORAGE_KEYS.BANDS, [newBand, ...bands]);
    return newBand;
  },

  getInvites(directorId) {
    const all = loadItem(STORAGE_KEYS.INVITES, [BASELINE_INVITE]);
    if (!directorId) return all;
    return all.filter(
      (i) =>
        i.directorId === directorId ||
        (directorId === 'director-main' && (!i.directorId || i.directorId === 'director-main'))
    );
  },
};

// TEST 1: Baseline Director Bootstrap
console.log('Test 1: Baseline Director & Default Workspace');
const initialDirectors = TestDataStore.getDirectors();
assert.strictEqual(initialDirectors.length, 1);
assert.strictEqual(initialDirectors[0].id, 'director-main');
assert.strictEqual(initialDirectors[0].studioName, 'Highland Music Studio');
console.log('✅ Baseline Director initialized successfully.\n');

// TEST 2: Director Self-Registration
console.log('Test 2: Registering a New Independent Director (Elena Cruz)');
const elena = TestDataStore.createDirector({
  name: 'Elena Cruz',
  email: 'elena@soundwaves.org',
  studioName: 'SoundWaves Academy',
  primaryInstrument: 'drums',
  bio: 'Modern ensemble instructor and percussionist.',
});

assert.ok(elena.id.startsWith('director-'));
assert.strictEqual(elena.name, 'Elena Cruz');
assert.strictEqual(elena.studioName, 'SoundWaves Academy');
assert.strictEqual(elena.role, 'admin');

const directorsList = TestDataStore.getDirectors();
assert.strictEqual(directorsList.length, 2);
assert.ok(directorsList.some((d) => d.id === 'director-main'));
assert.ok(directorsList.some((d) => d.id === elena.id));
console.log('✅ Second Director registered alongside baseline.\n');

// TEST 3: Director Invite Pass Generation
console.log('Test 3: Automatic Studio Invite Pass Isolation');
const elenaInvites = TestDataStore.getInvites(elena.id);
assert.strictEqual(elenaInvites.length, 1);
assert.strictEqual(elenaInvites[0].directorId, elena.id);
assert.strictEqual(elenaInvites[0].studioName, 'SoundWaves Academy');
assert.strictEqual(elenaInvites[0].code, 'SOUN-PASS');

const marcusInvites = TestDataStore.getInvites('director-main');
assert.strictEqual(marcusInvites.length, 1);
assert.strictEqual(marcusInvites[0].directorId, 'director-main');
assert.strictEqual(marcusInvites[0].code, 'STUDIO-PASS');
console.log('✅ Studio invite passes strictly isolated per director.\n');

// TEST 4: Student Onboarding Under Elena vs Marcus
console.log('Test 4: Student Musician Onboarding Scoping');
// Onboard student under Marcus (director-main)
const studentMarcus1 = TestDataStore.createStudent({
  name: 'Sam Miller',
  email: 'sam@highland.edu',
  directorId: 'director-main',
  primaryInstrument: 'guitars',
});

// Onboard students under Elena (SoundWaves)
const studentElena1 = TestDataStore.createStudent({
  name: 'Maya Lin',
  email: 'maya@soundwaves.org',
  directorId: elena.id,
  primaryInstrument: 'piano',
});
const studentElena2 = TestDataStore.createStudent({
  name: 'Leo Rossi',
  email: 'leo@soundwaves.org',
  directorId: elena.id,
  primaryInstrument: 'bass',
});

// Check Marcus students
const marcusStudents = TestDataStore.getStudents('director-main');
assert.strictEqual(marcusStudents.length, 1);
assert.strictEqual(marcusStudents[0].name, 'Sam Miller');
assert.strictEqual(marcusStudents[0].directorId, 'director-main');

// Check Elena students
const elenaStudents = TestDataStore.getStudents(elena.id);
assert.strictEqual(elenaStudents.length, 2);
assert.ok(elenaStudents.some((s) => s.name === 'Maya Lin'));
assert.ok(elenaStudents.some((s) => s.name === 'Leo Rossi'));
assert.ok(!elenaStudents.some((s) => s.name === 'Sam Miller')); // Must NOT see Marcus's student!
console.log('✅ Students are completely partitioned between directors.\n');

// TEST 5: Band Creation & Isolation
console.log('Test 5: Band Creation & Workspace Isolation');
// Marcus creates a band
const marcusBand = TestDataStore.createBand({
  name: 'Highland Jazz Collective',
  genre: 'Jazz / Fusion',
  directorId: 'director-main',
});

// Elena creates a band
const elenaBand = TestDataStore.createBand({
  name: 'SoundWaves Alt Rockers',
  genre: 'Alternative Rock',
  directorId: elena.id,
});

assert.strictEqual(marcusBand.directorId, 'director-main');
assert.strictEqual(marcusBand.members[0].name, 'Marcus Vance');

assert.strictEqual(elenaBand.directorId, elena.id);
assert.strictEqual(elenaBand.members[0].name, 'Elena Cruz');

// Verify band scoping
const marcusBands = TestDataStore.getBands('director-main');
assert.strictEqual(marcusBands.length, 1);
assert.strictEqual(marcusBands[0].name, 'Highland Jazz Collective');

const elenaBands = TestDataStore.getBands(elena.id);
assert.strictEqual(elenaBands.length, 1);
assert.strictEqual(elenaBands[0].name, 'SoundWaves Alt Rockers');
console.log('✅ Bands and band rosters strictly isolated per director.\n');

// TEST 6: Legacy / Backward Compatibility
console.log('Test 6: Backward Compatibility with Legacy Unassigned Records');
// Direct insert of a legacy student without directorId (as found in older databases)
const legacyStudent = {
  id: 'legacy-student-1',
  name: 'Old Record Student',
  email: 'old@student.edu',
  role: 'student',
  primaryInstrument: 'drums',
  directorId: undefined, // Simulates legacy unassigned database record
  bandIds: [],
};

const existingStudents = loadItem(STORAGE_KEYS.STUDENTS, []);
saveItem(STORAGE_KEYS.STUDENTS, [legacyStudent, ...existingStudents]);

// Should safely appear under director-main
const marcusRosterWithLegacy = TestDataStore.getStudents('director-main');
assert.ok(marcusRosterWithLegacy.some((s) => s.name === 'Old Record Student'));

// Elena must STILL not see legacy student
const elenaRosterAfterLegacy = TestDataStore.getStudents(elena.id);
assert.ok(!elenaRosterAfterLegacy.some((s) => s.name === 'Old Record Student'));
console.log('✅ Backward compatibility confirmed: legacy records map to director-main without leaking.\n');

// TEST 7: Direct Band Invite Binding
console.log('Test 7: Direct Band Invite Onboarding to Elena');
const elenaDirectStudent = TestDataStore.createStudent({
  name: 'Nora Evans',
  email: 'nora@soundwaves.org',
  bandIdToJoin: elenaBand.id, // Direct join
  primaryInstrument: 'vocals',
});
assert.strictEqual(elenaDirectStudent.directorId, elena.id);
assert.deepStrictEqual(elenaDirectStudent.bandIds, [elenaBand.id]);
console.log('✅ Joining a band automatically inherits that band\'s directorId.\n');

console.log('🎉 ALL MULTI-DIRECTOR ISOLATION & SCOPING TESTS PASSED SUCCESSFULLY!\n');
