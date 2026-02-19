// Pure RNG utilities — no side effects beyond randomness

export interface RollResult {
  roll: number;
  target: number;
  modifier: number;
  success: boolean;
  margin: number;
  criticalSuccess: boolean;
  criticalFailure: boolean;
}

/** Roll a d100 (1-100) */
export function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}

/** Roll a die with N sides (1-N) */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** Roll NdS (e.g., 2d10) and sum */
export function rollDice(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += rollDie(sides);
  }
  return total;
}

/** Roll d100 against a target number with optional modifier. Success = roll <= target + modifier */
export function rollUnder(target: number, modifier: number = 0): RollResult {
  const roll = rollD100();
  const effectiveTarget = Math.max(1, Math.min(100, target + modifier));
  const success = roll <= effectiveTarget;
  const margin = success ? effectiveTarget - roll : roll - effectiveTarget;

  return {
    roll,
    target: effectiveTarget,
    modifier,
    success,
    margin,
    criticalSuccess: roll <= 5,
    criticalFailure: roll >= 96,
  };
}

/** Roll damage: base + random variation + modifier */
export function rollDamage(base: number, modifier: number = 0): number {
  const variation = rollDie(10);
  return Math.max(0, base + variation + modifier);
}

/** Weighted random selection from a list of options */
export function weightedRandom<T>(options: Array<{ item: T; weight: number }>): T {
  if (options.length === 0) {
    throw new Error('Cannot select from empty options');
  }

  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }

  let random = Math.random() * totalWeight;
  for (const option of options) {
    random -= option.weight;
    if (random <= 0) {
      return option.item;
    }
  }

  // Fallback (shouldn't reach here due to floating point)
  return options[options.length - 1].item;
}

/** Returns true with the given probability (0-1) */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Shuffle an array (Fisher-Yates) — returns new array */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
