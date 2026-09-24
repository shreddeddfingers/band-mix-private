import type { AgeGroup } from '../types/index.ts';

/**
 * Calculates exact age in years from an ISO date string (YYYY-MM-DD).
 * Accurately accounts for leap years and whether the birthday has occurred in the reference year.
 */
export function calculateExactAge(
  dobString: string,
  referenceDate: Date = new Date()
): number {
  if (!dobString) return 0;

  const parts = dobString.split('-');
  if (parts.length < 3) return 0;

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return 0;

  const birthDate = new Date(birthYear, birthMonth, birthDay);
  if (isNaN(birthDate.getTime())) return 0;

  let age = referenceDate.getFullYear() - birthYear;
  const monthDiff = referenceDate.getMonth() - birthMonth;

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDay)) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Converts an exact numeric age to an appropriate AgeGroup bracket for backward compatibility.
 */
export function ageToAgeGroup(age: number): AgeGroup {
  if (age < 13) return 'kids';
  if (age <= 18) return 'teens';
  return 'adults';
}

/**
 * Formats a display string for age.
 * Prefers exact calculated age (e.g. "Age 14"), falling back to ageGroup label if unavailable.
 */
export function formatAgeDisplay(
  exactAge?: number,
  fallbackAgeGroup?: AgeGroup
): string {
  if (typeof exactAge === 'number' && exactAge > 0) {
    return `Age ${exactAge}`;
  }

  if (fallbackAgeGroup) {
    switch (fallbackAgeGroup) {
      case 'kids':
        return 'Youth (<13)';
      case 'teens':
        return 'Teens (13–18)';
      case 'adults':
        return 'Adults (18+)';
    }
  }

  return 'Age Unknown';
}
