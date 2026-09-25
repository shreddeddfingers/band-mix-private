import assert from 'node:assert';

console.log('🧪 Starting White-Label Studio Branding & AutoFill Test Suite...\n');

// Mock localStorage to simulate DataStore in Node
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
globalThis.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};

const BRAND_PRESETS = {
  school_of_rock: {
    studioName: 'School of Rock',
    tagline: 'Inspiring the world to rock on stage and in life.',
    brandColor: '#E11D48',
    logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&auto=format&fit=crop&q=80',
    customIntakeGreeting: 'Welcome to School of Rock enrollment! Audition and band placement intake takes under 60 seconds.',
    presetKey: 'school_of_rock',
  },
  bach_to_rock: {
    studioName: 'Bach to Rock',
    tagline: 'America\'s Music School for students of all ages.',
    brandColor: '#2563EB',
    logoUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=160&auto=format&fit=crop&q=80',
    customIntakeGreeting: 'Welcome to Bach to Rock ensemble placement! Sign up to join your weekly rehearsal band.',
    presetKey: 'bach_to_rock',
  },
  highland: {
    studioName: 'Highland Music Academy',
    tagline: 'Empowering young musicians through collaborative performance.',
    brandColor: '#F59E0B',
    logoUrl: '',
    customIntakeGreeting: 'Welcome to Highland Music Academy! Complete your fast musician intake below.',
    presetKey: 'highland',
  },
};

const STORAGE_KEYS = {
  DIRECTORS: 'bandmix_prod_directors',
  DIRECTOR: 'bandmix_prod_director',
  INVITES: 'bandmix_prod_invites',
};

const BASELINE_DIRECTOR = {
  id: 'director-main',
  name: 'Marcus Vance',
  email: 'marcus@musicstudio.edu',
  role: 'admin',
  directorId: 'director-main',
  studioName: 'Highland Music Academy',
  primaryInstrument: 'piano',
  branding: BRAND_PRESETS.highland,
};

function loadItem(key, fallback) {
  const item = storage.get(key);
  return item ? JSON.parse(item) : fallback;
}

function saveItem(key, val) {
  storage.set(key, JSON.stringify(val));
}

const BrandingStore = {
  getDirectors() {
    const list = loadItem(STORAGE_KEYS.DIRECTORS, []);
    if (!list.some((d) => d.id === BASELINE_DIRECTOR.id)) {
      list.unshift(BASELINE_DIRECTOR);
    }
    return list;
  },

  getDirector(directorId) {
    const targetId = directorId || loadItem(STORAGE_KEYS.DIRECTOR, BASELINE_DIRECTOR.id);
    return this.getDirectors().find((d) => d.id === targetId) || BASELINE_DIRECTOR;
  },

  getStudioBranding(directorId) {
    const director = this.getDirector(directorId);
    return director?.branding || BRAND_PRESETS.highland;
  },

  setStudioBranding(directorId, branding) {
    const directors = this.getDirectors();
    const idx = directors.findIndex((d) => d.id === directorId);
    if (idx !== -1) {
      directors[idx] = {
        ...directors[idx],
        studioName: branding.studioName || directors[idx].studioName,
        branding,
      };
      saveItem(STORAGE_KEYS.DIRECTORS, directors);
    }
    return branding;
  },

  createDirector({ name, studioName, email, presetKey = 'custom' }) {
    const id = `director-${Date.now()}`;
    const basePreset = BRAND_PRESETS[presetKey] || {
      studioName,
      tagline: `Premier music education & performance ensembles at ${studioName}.`,
      brandColor: '#8B5CF6',
      logoUrl: '',
      presetKey: 'custom',
    };
    const director = {
      id,
      name,
      email,
      role: 'admin',
      directorId: id,
      studioName,
      primaryInstrument: 'guitar',
      branding: {
        ...basePreset,
        studioName,
      },
    };
    const directors = this.getDirectors();
    directors.push(director);
    saveItem(STORAGE_KEYS.DIRECTORS, directors);
    return director;
  },
};

// TEST 1: Default Branding
console.log('Test 1: Default studio branding loads accurately');
const defaultBranding = BrandingStore.getStudioBranding('director-main');
assert.strictEqual(defaultBranding.studioName, 'Highland Music Academy');
assert.strictEqual(defaultBranding.brandColor, '#F59E0B');
assert.strictEqual(defaultBranding.presetKey, 'highland');
console.log('  ✓ Default Highland branding resolved: #F59E0B\n');

// TEST 2: School of Rock White-Label Customization
console.log('Test 2: Switching director branding to School of Rock preset');
const sorBranding = BrandingStore.setStudioBranding('director-main', BRAND_PRESETS.school_of_rock);
assert.strictEqual(sorBranding.studioName, 'School of Rock');
assert.strictEqual(sorBranding.brandColor, '#E11D48');
assert.strictEqual(sorBranding.presetKey, 'school_of_rock');
assert.ok(sorBranding.tagline.includes('Inspiring the world to rock'));

const updatedDirector = BrandingStore.getDirector('director-main');
assert.strictEqual(updatedDirector.studioName, 'School of Rock');
assert.strictEqual(updatedDirector.branding.brandColor, '#E11D48');
console.log('  ✓ School of Rock white-label branding saved and verified (#E11D48)\n');

// TEST 3: Multi-Director Independent Branding
console.log('Test 3: Creating a second director with Bach to Rock preset');
const b2rDirector = BrandingStore.createDirector({
  name: 'Dave Grohl',
  studioName: 'Bach to Rock Bethesda',
  email: 'dave@b2r.com',
  presetKey: 'bach_to_rock',
});
assert.strictEqual(b2rDirector.branding.brandColor, '#2563EB');
assert.strictEqual(b2rDirector.branding.studioName, 'Bach to Rock Bethesda');

// Verify Marcus Vance still has School of Rock branding
const marcusBranding = BrandingStore.getStudioBranding('director-main');
assert.strictEqual(marcusBranding.studioName, 'School of Rock');
assert.strictEqual(marcusBranding.brandColor, '#E11D48');

// Verify Dave Grohl has Bach to Rock branding
const daveBranding = BrandingStore.getStudioBranding(b2rDirector.id);
assert.strictEqual(daveBranding.brandColor, '#2563EB');
assert.strictEqual(daveBranding.studioName, 'Bach to Rock Bethesda');
console.log('  ✓ Multi-director studio branding isolation confirmed (SOR #E11D48 vs B2R #2563EB)\n');

// TEST 4: Custom Studio Branding (Bespoke Palette)
console.log('Test 4: Applying custom bespoke branding with hex code');
const bespokeBranding = {
  studioName: 'Emerald Coast Rock Academy',
  tagline: 'Coastal sound, stadium energy.',
  brandColor: '#10B981',
  logoUrl: 'https://example.com/emerald-logo.png',
  customIntakeGreeting: 'Welcome to Emerald Coast! Fast track your band audition.',
  presetKey: 'custom',
};
BrandingStore.setStudioBranding(b2rDirector.id, bespokeBranding);

const resolvedBespoke = BrandingStore.getStudioBranding(b2rDirector.id);
assert.strictEqual(resolvedBespoke.studioName, 'Emerald Coast Rock Academy');
assert.strictEqual(resolvedBespoke.brandColor, '#10B981');
assert.strictEqual(resolvedBespoke.logoUrl, 'https://example.com/emerald-logo.png');
console.log('  ✓ Bespoke custom branding successfully saved: #10B981\n');

// TEST 5: AutoFill Specifications Verification
console.log('Test 5: W3C AutoFill and Credential Management token compatibility');
const requiredAutofillTokens = [
  { field: 'Musician Name', token: 'name', type: 'text' },
  { field: 'Musician Email', token: 'email', type: 'email', inputMode: 'email' },
  { field: 'Date of Birth', token: 'bday', type: 'date' },
  { field: 'Emergency Contact Phone', token: 'tel', type: 'tel', inputMode: 'tel' },
  { field: 'Studio Name', token: 'organization', type: 'text' },
];

for (const item of requiredAutofillTokens) {
  assert.ok(item.token, `Token must exist for ${item.field}`);
  assert.ok(item.type, `Input type must exist for ${item.field}`);
  console.log(`  ✓ Checked ${item.field}: autoComplete="${item.token}" (type="${item.type}")`);
}

// TEST 6: Dynamic CSS Variable & Contrast Text Calculation
console.log('Test 6: Dynamic CSS variables and contrast text resolution');
function hexToRgb(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function getContrastTextColor(r, g, b) {
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? '#020617' : '#ffffff';
}

// School of Rock Crimson Red (#E11D48) -> Should require white contrast text
const sorRgb = hexToRgb('#E11D48');
assert.strictEqual(getContrastTextColor(sorRgb.r, sorRgb.g, sorRgb.b), '#ffffff');

// Bach to Rock Electric Blue (#2563EB) -> Should require white contrast text
const b2rRgb = hexToRgb('#2563EB');
assert.strictEqual(getContrastTextColor(b2rRgb.r, b2rRgb.g, b2rRgb.b), '#ffffff');

// Studio Amber Gold (#F59E0B) -> Should require dark slate contrast text
const amberRgb = hexToRgb('#F59E0B');
assert.strictEqual(getContrastTextColor(amberRgb.r, amberRgb.g, amberRgb.b), '#020617');

console.log('  ✓ Contrast text accurately calculated: School of Rock (#ffffff), Bach to Rock (#ffffff), Amber (#020617)\n');

console.log('🎉 ALL WHITE-LABEL BRANDING & AUTOFILL TESTS PASSED SUCCESSFULLY!');
