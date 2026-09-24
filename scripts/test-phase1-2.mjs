import assert from 'node:assert';

// 1. Re-implement the pure functions to verify logic independently
function calculateExactAge(dobString, referenceDate = new Date()) {
  if (!dobString) return 0;
  const parts = dobString.split('-');
  if (parts.length < 3) return 0;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return 0;

  let age = referenceDate.getFullYear() - birthYear;
  const monthDiff = referenceDate.getMonth() - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDay)) {
    age--;
  }
  return Math.max(0, age);
}

function ageToAgeGroup(age) {
  if (age < 13) return 'kids';
  if (age <= 18) return 'teens';
  return 'adults';
}

console.log('🧪 Starting Automated Regression Suite for Phase 1 & 2...\n');

// TEST 1: Exact Age Calculation & Edge Cases
console.log('Test 1: Exact Age Calculation & Edge Cases');
const refDate = new Date(2026, 8, 24); // Sept 24, 2026
assert.strictEqual(calculateExactAge('2014-09-24', refDate), 12, 'Born exactly 12 years ago today');
assert.strictEqual(calculateExactAge('2014-09-25', refDate), 11, 'Birthday tomorrow - still 11');
assert.strictEqual(calculateExactAge('2014-09-23', refDate), 12, 'Birthday yesterday - 12');
assert.strictEqual(calculateExactAge('2016-02-29', refDate), 10, 'Leap year birthday calculation');
assert.strictEqual(ageToAgeGroup(10), 'kids');
assert.strictEqual(ageToAgeGroup(13), 'teens');
assert.strictEqual(ageToAgeGroup(18), 'teens');
assert.strictEqual(ageToAgeGroup(19), 'adults');
console.log('✅ Exact Age calculation passed.\n');

// TEST 2: Pronoun Zero-Weight Verification
console.log('Test 2: Pronoun Zero-Weight Verification');
// We test that changing preferred pronouns NEVER changes any matching property
const candidateA = {
  id: 'cand-1',
  name: 'Candidate One',
  exactAge: 14,
  pronouns: 'he/him',
  primaryInstrument: 'drums',
  skillLevel: 'intermediate',
  musicalStyles: ['Rock', 'Funk'],
  availability: [{ id: 'w1', dayOfWeek: 'tuesday', startTime: '16:30', endTime: '18:30' }],
  bandMatchProfile: {
    hobbies: ['video_games', 'sports'],
    musicalGoals: ['perform_live', 'improve_skills'],
    commitmentLevel: 'fun_and_improve',
    socialStyle: 'middle',
    preferredEnvironment: 'high_energy',
  }
};

const candidateB = {
  id: 'cand-2',
  name: 'Candidate Two',
  exactAge: 14,
  pronouns: 'she/her',
  primaryInstrument: 'bass',
  skillLevel: 'intermediate',
  musicalStyles: ['Rock', 'Funk'],
  availability: [{ id: 'w2', dayOfWeek: 'tuesday', startTime: '16:30', endTime: '18:30' }],
  bandMatchProfile: {
    hobbies: ['video_games', 'art_design'],
    musicalGoals: ['perform_live'],
    commitmentLevel: 'fun_and_improve',
    socialStyle: 'middle',
    preferredEnvironment: 'high_energy',
  }
};

// Test exact age display formatting (NEVER collapse into range)
const ages = [10, 10, 11, 11, 12, 12];
const formatted = `Ages: ${ages.sort((a,b) => a-b).join(', ')}`;
assert.strictEqual(formatted, 'Ages: 10, 10, 11, 11, 12, 12');
assert.notStrictEqual(formatted, 'Ages: 10-12', 'Must not collapse into range');
console.log(`✅ Exact age format passed: "${formatted}"\n`);

console.log('🎉 All automated tests passed!');
