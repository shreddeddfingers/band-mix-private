import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Starting Director AutoFill, iOS Keychain & Google Credential Suite...\n');

// 1. Inspect CreateDirectorModal.tsx source directly for Apple / Google AutoFill tokens
const modalPath = path.resolve('src/components/directors/CreateDirectorModal.tsx');
const modalSource = fs.readFileSync(modalPath, 'utf8');

console.log('Test 1: Form container semantics for iOS Safari & Android Chrome');
assert.ok(modalSource.includes('method="post"'), 'Form must specify method="post"');
assert.ok(modalSource.includes('autoComplete="on"'), 'Form must declare autoComplete="on"');
assert.ok(modalSource.includes('action="#"'), 'Form must have explicit action attribute');
console.log('  ✓ Form has proper POST method, action, and autoComplete="on"\n');

console.log('Test 2: iOS Keychain & Google Password Manager credential bindings');
assert.ok(modalSource.includes('new-password'), 'Signup must contain new-password token');
assert.ok(modalSource.includes('authMode === \'register\' ? \'new-password\' : \'current-password\''), 'Form must dynamically toggle between new-password and current-password');
assert.ok(modalSource.includes('name="username"'), 'Identifier field must be named username for browser keychain matching');
assert.ok(modalSource.includes('autoComplete="username email"'), 'Identifier field must include username and email tokens');
assert.ok(modalSource.includes('Suggest Strong Password'), 'Must provide UI trigger to suggest strong passwords');
console.log('  ✓ Password credential pairing (username + new-password) verified for Keychain and Google Password Manager\n');

console.log('Test 3: Apple Contact Card AutoFill fields');
assert.ok(modalSource.includes('autoComplete="name"'), 'Name input must have autoComplete="name"');
assert.ok(modalSource.includes('autoComplete="organization"'), 'Studio input must have autoComplete="organization"');
assert.ok(modalSource.includes('autoCapitalize="words"'), 'Name/Studio inputs must have autoCapitalize="words"');
console.log('  ✓ Contact card attributes (name, organization) verified\n');

console.log('Test 4: Direct DOM element fallback extraction');
assert.ok(
  modalSource.includes('formEl.elements.namedItem'),
  'Form submission must read from direct DOM elements to prevent iOS Safari batch autofill desync'
);
console.log('  ✓ Direct DOM fallback extraction confirmed\n');

console.log('Test 5: 1-Tap Google Sign-In available');
assert.ok(modalSource.includes('Continue with Google'), '1-tap Google sign-in must be present for seamless zero-typing enrollment');
console.log('  ✓ Google 1-Tap button present\n');

console.log('🎉 ALL DIRECTOR AUTOFILL & CREDENTIAL MANAGER TESTS PASSED!\n');
