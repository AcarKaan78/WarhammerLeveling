// ============================================================================
// ECONOMY ENGINE - Pure functions for pricing, upkeep, and trade.
// No database access, no side effects.
// ============================================================================

import { CONFIG } from '@/domain/config';

// ---------------------------------------------------------------------------
// calculateBuyPrice
// ---------------------------------------------------------------------------

/**
 * Calculate the final buy price of an item after applying discounts from
 * the character Fellowship stat, merchant relationship, and faction reputation.
 *
 * Each discount source contributes up to a 50% reduction (divided by 200),
 * but the total discount is capped at 50% of the base price.
 *
 * @param basePrice            - The item listed price in Thrones.
 * @param fellowshipStat       - Character Fellowship primary stat (0-100).
 * @param merchantRelationship - Relationship value with the merchant NPC (0-100).
 * @param factionRep           - Reputation with the merchant faction (-100 to 100).
 * @returns The final price, floored to an integer, minimum 1.
 */
export function calculateBuyPrice(
  basePrice: number,
  fellowshipStat: number,
  merchantRelationship: number,
  factionRep: number,
): number {
  const discount =
    fellowshipStat / 200 +
    merchantRelationship / 200 +
    Math.max(0, factionRep) / 200; // only positive rep gives a discount

  // Cap total discount at 50%
  const effectiveMultiplier = Math.max(0.5, 1 - discount);

  return Math.max(1, Math.floor(basePrice * effectiveMultiplier));
}

// ---------------------------------------------------------------------------
// calculateSellPrice
// ---------------------------------------------------------------------------

/**
 * Calculate how much a character receives for selling an item.
 *
 * Formula: basePrice * sellPriceMultiplier * (condition / 100) * (1 + merchantMod / 100)
 *
 * @param basePrice    - The item listed base price.
 * @param condition    - Item condition (0-100, where 100 is pristine).
 * @param merchantMod  - Bonus percentage from merchant relationship / perks (0+).
 * @returns The sell price, floored to an integer, minimum 1.
 */
export function calculateSellPrice(
  basePrice: number,
  condition: number,
  merchantMod: number,
): number {
  const multiplier = CONFIG.economy.sellPriceMultiplier;
  const conditionFactor = condition / 100;
  const merchantFactor = 1 + merchantMod / 100;

  return Math.max(1, Math.floor(basePrice * multiplier * conditionFactor * merchantFactor));
}

// ---------------------------------------------------------------------------
// calculateMonthlyUpkeep
// ---------------------------------------------------------------------------

/**
 * Calculate the total monthly upkeep cost in Thrones.
 *
 * Components:
 * - Housing rent (looked up from CONFIG by housing level key).
 * - Companion upkeep (10 Thrones per companion per month).
 *
 * @param housingLevel   - Key into CONFIG.economy.housingRent (e.g. 'hab_block').
 * @param companionCount - Number of active companions.
 * @returns The total monthly upkeep in Thrones.
 */
export function calculateMonthlyUpkeep(
  housingLevel: string,
  companionCount: number,
): number {
  const rent = CONFIG.economy.housingRent[housingLevel] ?? 0;
  const companionCost = companionCount * 10;

  return rent + companionCost;
}
