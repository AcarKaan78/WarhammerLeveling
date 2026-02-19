import type { PrimaryStatKey } from '@/domain/models';

export interface CharacterCreationErrors {
  name?: string;
  age?: string;
  personality?: string;
  bonusStats?: string;
}

const MAX_BONUS_POINTS = 20;

export function validateCharacterName(name: string): string | null {
  if (!name || name.trim().length === 0) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (name.trim().length > 50) return 'Name must be under 50 characters';
  if (!/^[\p{L}\s'-]+$/u.test(name.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  return null;
}

export function validateAge(age: number): string | null {
  if (!Number.isInteger(age)) return 'Age must be a whole number';
  if (age < 16) return 'Minimum age is 16';
  if (age > 80) return 'Maximum age is 80';
  return null;
}

export function validatePersonalities(p1: string, p2: string): string | null {
  if (!p1 || !p2) return 'Both personality traits are required';
  if (p1 === p2) return 'Personality traits must be different';
  return null;
}

export function validateBonusAllocations(allocations: Partial<Record<PrimaryStatKey, number>>): string | null {
  const total = Object.values(allocations).reduce((sum, v) => sum + (v ?? 0), 0);
  if (total > MAX_BONUS_POINTS) return `Cannot allocate more than ${MAX_BONUS_POINTS} bonus points (used ${total})`;
  for (const [stat, value] of Object.entries(allocations)) {
    if (value !== undefined) {
      if (value < 0) return `${stat} allocation cannot be negative`;
      if (value > 8) return `Cannot allocate more than 8 points to a single stat`;
    }
  }
  return null;
}

export function validateCharacterCreation(data: {
  name: string;
  age: number;
  personality1: string;
  personality2: string;
  bonusStatAllocations: Partial<Record<PrimaryStatKey, number>>;
}): CharacterCreationErrors {
  const errors: CharacterCreationErrors = {};

  const nameError = validateCharacterName(data.name);
  if (nameError) errors.name = nameError;

  const ageError = validateAge(data.age);
  if (ageError) errors.age = ageError;

  const personalityError = validatePersonalities(data.personality1, data.personality2);
  if (personalityError) errors.personality = personalityError;

  const statsError = validateBonusAllocations(data.bonusStatAllocations);
  if (statsError) errors.bonusStats = statsError;

  return errors;
}

export function validateTaskName(name: string): string | null {
  if (!name || name.trim().length === 0) return 'Task name is required';
  if (name.trim().length > 100) return 'Task name must be under 100 characters';
  return null;
}

export function validateTimeEstimate(minutes: number): string | null {
  if (!Number.isInteger(minutes)) return 'Must be a whole number';
  if (minutes < 1) return 'Minimum 1 minute';
  if (minutes > 480) return 'Maximum 8 hours (480 minutes)';
  return null;
}

export function hasErrors(errors: Record<string, string | undefined> | CharacterCreationErrors): boolean {
  return Object.values(errors).some(e => e !== undefined);
}
