// ============================================================================
// INVENTORY ENGINE — Pure functions for inventory and equipment calculations.
// No database access, no side effects.
// ============================================================================

import { InventoryItem, WeaponProperties, ArmorProperties } from '@/domain/models';
import { CONFIG } from '@/domain/config';

/**
 * Calculate total encumbrance from all inventory items.
 * Each item's weight is multiplied by its quantity.
 * The max carry capacity is passed in as a parameter would normally come
 * from the character, but we derive it from CONFIG defaults when not provided.
 */
export function calculateEncumbrance(
  items: InventoryItem[],
  carryCapacity?: number,
): { current: number; max: number; overloaded: boolean } {
  const current = items.reduce((total, invItem) => {
    return total + invItem.item.weight * invItem.quantity;
  }, 0);

  const max = carryCapacity ?? 0;

  return {
    current,
    max,
    overloaded: current > max,
  };
}

/**
 * Sum up all stat bonuses from equipped items' properties.
 * Looks for a `statBonuses` record inside each item's properties.
 */
export function calculateEquipmentBonuses(
  equippedItems: InventoryItem[],
): Record<string, number> {
  const bonuses: Record<string, number> = {};

  for (const invItem of equippedItems) {
    if (!invItem.equipped) continue;

    const props = invItem.item.properties;
    if (!props) continue;

    // Aggregate stat bonuses from item properties
    const statBonuses = props['statBonuses'] as Record<string, number> | undefined;
    if (statBonuses) {
      for (const [stat, value] of Object.entries(statBonuses)) {
        bonuses[stat] = (bonuses[stat] ?? 0) + value;
      }
    }

    // Weapon accuracy bonus counts as a ballisticSkill/weaponSkill modifier
    const weaponProps = props as unknown as Partial<WeaponProperties>;
    if (typeof weaponProps.accuracy === 'number') {
      bonuses['accuracy'] = (bonuses['accuracy'] ?? 0) + weaponProps.accuracy;
    }
    if (typeof weaponProps.damage === 'number') {
      bonuses['damage'] = (bonuses['damage'] ?? 0) + weaponProps.damage;
    }
    if (typeof weaponProps.armorPenetration === 'number') {
      bonuses['armorPenetration'] = (bonuses['armorPenetration'] ?? 0) + weaponProps.armorPenetration;
    }

    // Armor protection and agility penalty
    const armorProps = props as unknown as Partial<ArmorProperties>;
    if (typeof armorProps.protection === 'number') {
      bonuses['protection'] = (bonuses['protection'] ?? 0) + armorProps.protection;
    }
    if (typeof armorProps.agilityPenalty === 'number') {
      bonuses['agilityPenalty'] = (bonuses['agilityPenalty'] ?? 0) + armorProps.agilityPenalty;
    }
  }

  return bonuses;
}

/**
 * Check whether a character meets the requirements to equip an item.
 * Requirements map stat names to minimum values.
 */
export function checkEquipRequirements(
  requirements: Record<string, number>,
  characterStats: Record<string, number>,
): { canEquip: boolean; reason?: string } {
  for (const [stat, requiredValue] of Object.entries(requirements)) {
    const currentValue = characterStats[stat] ?? 0;
    if (currentValue < requiredValue) {
      return {
        canEquip: false,
        reason: `Requires ${stat} ${requiredValue}, you have ${currentValue}`,
      };
    }
  }

  return { canEquip: true };
}

/**
 * Look up condition-based performance multiplier from CONFIG brackets.
 * Interpolates between defined thresholds for smooth degradation.
 * Condition is 0-100 (0 = destroyed, 100 = pristine).
 */
export function getConditionPerformance(condition: number): number {
  const brackets = CONFIG.combat.conditionPerformance;

  // Map condition 0-100 to the named brackets
  // pristine: 80-100, good: 60-79, worn: 40-59, damaged: 20-39, broken: 0-19
  if (condition >= 80) return brackets.pristine;
  if (condition >= 60) {
    // Interpolate between good and pristine
    const t = (condition - 60) / 20;
    return brackets.good + t * (brackets.pristine - brackets.good);
  }
  if (condition >= 40) {
    const t = (condition - 40) / 20;
    return brackets.worn + t * (brackets.good - brackets.worn);
  }
  if (condition >= 20) {
    const t = (condition - 20) / 20;
    return brackets.damaged + t * (brackets.worn - brackets.damaged);
  }
  // 0-19: interpolate from broken upward
  const t = condition / 20;
  return brackets.broken + t * (brackets.damaged - brackets.broken);
}

/**
 * Look up condition-based jam chance from CONFIG brackets.
 * Uses the same bracket interpolation as performance.
 * Condition is 0-100.
 */
export function getConditionJamChance(condition: number): number {
  const brackets = CONFIG.combat.conditionJamChance;

  if (condition >= 80) return brackets.pristine;
  if (condition >= 60) {
    const t = (condition - 60) / 20;
    return brackets.good + t * (brackets.pristine - brackets.good);
  }
  if (condition >= 40) {
    const t = (condition - 40) / 20;
    return brackets.worn + t * (brackets.good - brackets.worn);
  }
  if (condition >= 20) {
    const t = (condition - 20) / 20;
    return brackets.damaged + t * (brackets.worn - brackets.damaged);
  }
  const t = condition / 20;
  return brackets.broken + t * (brackets.damaged - brackets.broken);
}
