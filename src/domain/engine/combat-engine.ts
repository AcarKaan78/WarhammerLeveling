// ============================================================================
// COMBAT ENGINE -- Pure functions, no database access, no side effects.
// ============================================================================

import {
  CombatState,
  Combatant,
  CombatAction,
  CombatActionResult,
  CombatResult,
  Wound,
  HitLocation,
  WoundSeverity,
  EnvironmentModifier,
  AIBehaviorType,
} from '@/domain/models';
import { CONFIG } from '@/domain/config';
import { rollD100, rollUnder, rollDamage, rollDie, weightedRandom, chance, clamp } from './dice';

// ---------------------------------------------------------------------------
// Deep clone helper (structuredClone-safe for plain objects)
// ---------------------------------------------------------------------------
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function uid(): string {
  return 'cmbt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

// ---------------------------------------------------------------------------
// calculateInitiative
// ---------------------------------------------------------------------------
export function calculateInitiative(combatant: Combatant): number {
  const agility = combatant.primaryStats.agility;
  const perception = combatant.primaryStats.perception;
  return agility + Math.floor(perception / 2) + rollDie(10);
}

// ---------------------------------------------------------------------------
// initializeCombat
// ---------------------------------------------------------------------------
export function initializeCombat(
  playerCombatant: Combatant,
  companions: Combatant[],
  enemies: Combatant[],
  environmentModifiers: EnvironmentModifier[],
): CombatState {
  const allCombatants = [playerCombatant, ...companions, ...enemies];

  const combatants: Record<string, Combatant> = {};
  for (const c of allCombatants) {
    const copy = deepClone(c);
    copy.initiative = calculateInitiative(copy);
    copy.isAiming = false;
    copy.isDefending = false;
    copy.isOverwatching = false;
    combatants[copy.id] = copy;
  }

  const initiativeOrder = Object.values(combatants)
    .sort((a, b) => b.initiative - a.initiative)
    .map((c) => c.id);

  return {
    id: uid(),
    turnNumber: 1,
    currentCombatantIndex: 0,
    initiativeOrder,
    combatants,
    environmentModifiers: deepClone(environmentModifiers),
    combatLog: ['Combat begins!'],
    isComplete: false,
    result: null,
  };
}

// ---------------------------------------------------------------------------
// getAvailableActions
// ---------------------------------------------------------------------------
export function getAvailableActions(
  combatant: Combatant,
  combatState: CombatState,
): CombatAction[] {
  const actions: CombatAction[] = [
    CombatAction.ATTACK,
    CombatAction.MOVE,
    CombatAction.USE_ITEM,
  ];

  if (!combatant.isAiming) {
    actions.push(CombatAction.AIM);
  }

  actions.push(CombatAction.DEFENSIVE_STANCE);

  const psyRating = (combatant as unknown as { psyRating?: number }).psyRating;
  if (psyRating !== undefined && psyRating > 0) {
    actions.push(CombatAction.USE_PSYCHIC);
  }

  const isPlayerSide = combatant.isPlayer || combatant.isCompanion;
  const enemies = Object.values(combatState.combatants).filter(
    (c) =>
      (isPlayerSide ? !c.isPlayer && !c.isCompanion : c.isPlayer || c.isCompanion) &&
      c.hp > 0,
  );
  const hasDistantEnemy = enemies.some(
    (e) => Math.abs(e.position - combatant.position) > 0,
  );
  if (hasDistantEnemy) {
    actions.push(CombatAction.CHARGE);
  }

  actions.push(CombatAction.DISENGAGE);
  actions.push(CombatAction.CALLED_SHOT);
  actions.push(CombatAction.ALL_OUT_ATTACK);

  if (combatant.weapon && combatant.weapon.range !== 'melee') {
    actions.push(CombatAction.OVERWATCH);
  }

  const hasCompanions = Object.values(combatState.combatants).some(
    (c) =>
      c.id !== combatant.id &&
      c.isCompanion &&
      c.hp > 0 &&
      (combatant.isPlayer || combatant.isCompanion) === (c.isPlayer || c.isCompanion),
  );
  if (hasCompanions) {
    actions.push(CombatAction.COMMAND);
  }

  return actions;
}

// ---------------------------------------------------------------------------
// calculateHitChance
// ---------------------------------------------------------------------------
export function calculateHitChance(
  attackerSkill: number,
  weaponAccuracy: number,
  modifiers: number[],
  targetDefense: number,
): number {
  const totalModifiers = modifiers.reduce((sum, m) => sum + m, 0);
  const raw = attackerSkill + weaponAccuracy + totalModifiers - targetDefense;
  return clamp(raw, 5, 95);
}

// ---------------------------------------------------------------------------
// calculateDamage
// ---------------------------------------------------------------------------
export function calculateDamage(
  weaponDamage: number,
  strengthMod: number,
  armorValue: number,
  penetration: number,
): number {
  const effectiveArmor = Math.max(0, armorValue - penetration);
  const raw = weaponDamage + strengthMod + rollDie(10) - effectiveArmor;
  return Math.max(0, raw);
}

// ---------------------------------------------------------------------------
// determineHitLocation
// ---------------------------------------------------------------------------
export function determineHitLocation(): HitLocation {
  const weights = CONFIG.combat.hitLocationWeights;
  const options = Object.entries(weights).map(([loc, weight]) => ({
    item: loc as HitLocation,
    weight,
  }));
  return weightedRandom(options);
}

// ---------------------------------------------------------------------------
// applyWound
// ---------------------------------------------------------------------------
export function applyWound(
  combatant: Combatant,
  damage: number,
  hitLocation?: HitLocation,
): Wound {
  const location = hitLocation ?? determineHitLocation();

  const toughness = combatant.primaryStats.toughness;
  const ratio = damage / Math.max(1, toughness);

  let severity: WoundSeverity;
  if (ratio >= 1.5) {
    severity = 'mortal';
  } else if (ratio >= 1.0) {
    severity = 'critical';
  } else if (ratio >= 0.5) {
    severity = 'serious';
  } else {
    severity = 'light';
  }

  const bleedMap: Record<WoundSeverity, number> = {
    light: 0,
    serious: 1,
    critical: 2,
    mortal: 4,
  };

  const penalties: Record<string, number> = {};
  const severityPenalty: Record<WoundSeverity, number> = {
    light: -5,
    serious: -10,
    critical: -20,
    mortal: -30,
  };

  if (location === 'head') {
    penalties.intelligence = severityPenalty[severity];
    penalties.perception = severityPenalty[severity];
  } else if (location === 'body') {
    penalties.toughness = Math.floor(severityPenalty[severity] / 2);
    penalties.strength = Math.floor(severityPenalty[severity] / 2);
  } else if (location === 'leftArm' || location === 'rightArm') {
    penalties.weaponSkill = severityPenalty[severity];
    penalties.ballisticSkill = severityPenalty[severity];
  } else if (location === 'leftLeg' || location === 'rightLeg') {
    penalties.agility = severityPenalty[severity];
  }

  return {
    location,
    severity,
    damage,
    bleedPerRound: bleedMap[severity],
    penalties,
  };
}

// ---------------------------------------------------------------------------
// degradeEquipment
// ---------------------------------------------------------------------------
export function degradeEquipment(
  condition: number,
  amount: number,
): { newCondition: number; jammed: boolean } {
  const newCondition = Math.max(0, condition - amount);

  let conditionLabel: string;
  if (newCondition >= 90) conditionLabel = 'pristine';
  else if (newCondition >= 70) conditionLabel = 'good';
  else if (newCondition >= 50) conditionLabel = 'worn';
  else if (newCondition >= 25) conditionLabel = 'damaged';
  else conditionLabel = 'broken';

  const jamChance = CONFIG.combat.conditionJamChance[conditionLabel] ?? 0;
  const jammed = chance(jamChance);

  return { newCondition, jammed };
}

// ---------------------------------------------------------------------------
// resolveAction -- main combat resolution dispatcher
// ---------------------------------------------------------------------------
export function resolveAction(
  combatState: CombatState,
  actorId: string,
  action: CombatAction,
  targetId?: string,
  params?: Record<string, unknown>,
): { newState: CombatState; result: CombatActionResult } {
  const newState = deepClone(combatState);
  const actor = newState.combatants[actorId];

  if (!actor || actor.hp <= 0) {
    return {
      newState,
      result: {
        action,
        actorId,
        hit: false,
        damage: 0,
        critical: false,
        description: actorId + ' cannot act.',
        stateChanges: {},
      },
    };
  }

  let result: CombatActionResult;

  switch (action) {
    case CombatAction.ATTACK:
      result = resolveAttack(newState, actor, targetId);
      break;
    case CombatAction.AIM:
      result = resolveAim(newState, actor);
      break;
    case CombatAction.ALL_OUT_ATTACK:
      result = resolveAllOutAttack(newState, actor, targetId);
      break;
    case CombatAction.DEFENSIVE_STANCE:
      result = resolveDefensiveStance(newState, actor);
      break;
    case CombatAction.CHARGE:
      result = resolveCharge(newState, actor, targetId);
      break;
    case CombatAction.USE_ITEM:
      result = resolveUseItem(newState, actor, params);
      break;
    case CombatAction.DISENGAGE:
      result = resolveDisengage(newState, actor);
      break;
    case CombatAction.CALLED_SHOT:
      result = resolveCalledShot(newState, actor, targetId, params);
      break;
    case CombatAction.OVERWATCH:
      result = resolveOverwatch(newState, actor);
      break;
    case CombatAction.COMMAND:
      result = resolveCommand(newState, actor);
      break;
    case CombatAction.MOVE:
      result = resolveMove(newState, actor, params);
      break;
    default:
      result = {
        action,
        actorId,
        hit: false,
        damage: 0,
        critical: false,
        description: actor.name + ' takes an unknown action.',
        stateChanges: {},
      };
  }

  // Clear aiming flag after any non-aim action
  if (action !== CombatAction.AIM) {
    actor.isAiming = false;
  }

  // Apply bleed damage to all combatants
  for (const c of Object.values(newState.combatants)) {
    const totalBleed = c.wounds.reduce((sum, w) => sum + w.bleedPerRound, 0);
    if (totalBleed > 0) {
      c.hp = Math.max(0, c.hp - totalBleed);
    }
  }

  newState.combatLog.push(result.description);

  const combatResult = checkCombatEnd(newState);
  if (combatResult) {
    newState.isComplete = true;
    newState.result = combatResult;
  }

  return { newState, result };
}

// ---------------------------------------------------------------------------
// Internal action resolvers
// ---------------------------------------------------------------------------

function resolveAttack(
  state: CombatState,
  actor: Combatant,
  targetId?: string,
): CombatActionResult {
  const target = targetId ? state.combatants[targetId] : findNearestEnemy(state, actor);
  if (!target || target.hp <= 0) {
    return makeResult(CombatAction.ATTACK, actor.id, targetId, false, 0, false,
      actor.name + ' has no valid target.');
  }

  const modifiers: number[] = [];
  if (actor.isAiming) modifiers.push(CONFIG.combat.aimBonus);

  for (const em of state.environmentModifiers) {
    modifiers.push(em.modifier);
  }

  const woundPenalty = actor.wounds.reduce(
    (sum, w) => sum + (w.penalties.weaponSkill ?? 0) + (w.penalties.ballisticSkill ?? 0),
    0,
  );
  modifiers.push(woundPenalty);

  const isRanged = actor.weapon.range !== 'melee';
  const attackStat = isRanged
    ? actor.primaryStats.ballisticSkill
    : actor.primaryStats.weaponSkill;

  const targetDefense = target.isDefending ? CONFIG.combat.defensiveStanceBonus : 0;
  const hitChance = calculateHitChance(attackStat, actor.weapon.accuracy, modifiers, targetDefense);
  const rollResult = rollUnder(hitChance);

  const { newCondition, jammed } = degradeEquipment(
    actor.weapon.condition,
    CONFIG.combat.conditionDegradationPerUse,
  );
  actor.weapon.condition = newCondition;

  if (jammed) {
    return makeResult(CombatAction.ATTACK, actor.id, target.id, false, 0, false,
      actor.name + "'s " + actor.weapon.name + ' jams!');
  }

  if (!rollResult.success) {
    return makeResult(CombatAction.ATTACK, actor.id, target.id, false, 0,
      rollResult.criticalFailure,
      actor.name + ' attacks ' + target.name + ' and misses.');
  }

  const isCritical = rollResult.criticalSuccess ||
    rollResult.margin >= CONFIG.combat.criticalHitThreshold;
  const strengthMod = Math.floor(actor.primaryStats.strength / 10);
  let damage = calculateDamage(
    actor.weapon.damage, strengthMod,
    target.armor.protection, actor.weapon.armorPenetration,
  );

  if (isCritical) {
    damage = Math.floor(damage * 1.5);
  }

  const wound = applyWound(target, damage);
  target.wounds.push(wound);
  target.hp = Math.max(0, target.hp - damage);

  const desc = isCritical
    ? 'CRITICAL! ' + actor.name + ' strikes ' + target.name + ' in the ' + wound.location + ' for ' + damage + ' damage (' + wound.severity + ' wound)!'
    : actor.name + ' hits ' + target.name + ' in the ' + wound.location + ' for ' + damage + ' damage (' + wound.severity + ' wound).';

  return makeResult(CombatAction.ATTACK, actor.id, target.id, true, damage, isCritical, desc, wound);
}

function resolveAim(_state: CombatState, actor: Combatant): CombatActionResult {
  actor.isAiming = true;
  return makeResult(CombatAction.AIM, actor.id, undefined, false, 0, false,
    actor.name + ' takes aim (+' + CONFIG.combat.aimBonus + ' to next attack).');
}

function resolveAllOutAttack(
  state: CombatState,
  actor: Combatant,
  targetId?: string,
): CombatActionResult {
  const target = targetId ? state.combatants[targetId] : findNearestEnemy(state, actor);
  if (!target || target.hp <= 0) {
    return makeResult(CombatAction.ALL_OUT_ATTACK, actor.id, targetId, false, 0, false,
      actor.name + ' has no valid target.');
  }

  const modifiers: number[] = [CONFIG.combat.allOutAttackBonus];
  if (actor.isAiming) modifiers.push(CONFIG.combat.aimBonus);

  const woundPenalty = actor.wounds.reduce(
    (sum, w) => sum + (w.penalties.weaponSkill ?? 0) + (w.penalties.ballisticSkill ?? 0),
    0,
  );
  modifiers.push(woundPenalty);

  const isRanged = actor.weapon.range !== 'melee';
  const attackStat = isRanged
    ? actor.primaryStats.ballisticSkill
    : actor.primaryStats.weaponSkill;

  const hitChance = calculateHitChance(attackStat, actor.weapon.accuracy, modifiers, 0);
  const rollResult = rollUnder(hitChance);

  actor.statusEffects.push('all_out_attack_penalty');

  if (!rollResult.success) {
    return makeResult(CombatAction.ALL_OUT_ATTACK, actor.id, target.id, false, 0, false,
      actor.name + ' goes all-out against ' + target.name + ' but misses! (' + actor.name + ' is now vulnerable)');
  }

  const isCritical = rollResult.criticalSuccess ||
    rollResult.margin >= CONFIG.combat.criticalHitThreshold;
  const strengthMod = Math.floor(actor.primaryStats.strength / 10);
  let damage = calculateDamage(
    actor.weapon.damage, strengthMod,
    target.armor.protection, actor.weapon.armorPenetration,
  );
  if (isCritical) damage = Math.floor(damage * 1.5);

  const wound = applyWound(target, damage);
  target.wounds.push(wound);
  target.hp = Math.max(0, target.hp - damage);

  return makeResult(CombatAction.ALL_OUT_ATTACK, actor.id, target.id, true, damage, isCritical,
    actor.name + ' goes all-out! Hits ' + target.name + ' in the ' + wound.location + ' for ' + damage + ' damage (' + wound.severity + '). ' + actor.name + ' is now vulnerable (-' + CONFIG.combat.allOutAttackDefensePenalty + ' defense).',
    wound);
}

function resolveDefensiveStance(_state: CombatState, actor: Combatant): CombatActionResult {
  actor.isDefending = true;
  return makeResult(CombatAction.DEFENSIVE_STANCE, actor.id, undefined, false, 0, false,
    actor.name + ' takes a defensive stance (+' + CONFIG.combat.defensiveStanceBonus + ' to dodge/parry).');
}

function resolveCharge(
  state: CombatState,
  actor: Combatant,
  targetId?: string,
): CombatActionResult {
  const target = targetId ? state.combatants[targetId] : findNearestEnemy(state, actor);
  if (!target || target.hp <= 0) {
    return makeResult(CombatAction.CHARGE, actor.id, targetId, false, 0, false,
      actor.name + ' has no valid target to charge.');
  }

  actor.position = target.position;

  const modifiers: number[] = [];
  const woundPenalty = actor.wounds.reduce(
    (sum, w) => sum + (w.penalties.weaponSkill ?? 0), 0,
  );
  modifiers.push(woundPenalty);

  const hitChance = calculateHitChance(
    actor.primaryStats.weaponSkill, actor.weapon.accuracy, modifiers, 0,
  );
  const rollResult = rollUnder(hitChance);

  actor.statusEffects.push('charge_defense_penalty');

  if (!rollResult.success) {
    return makeResult(CombatAction.CHARGE, actor.id, target.id, false, 0, false,
      actor.name + ' charges ' + target.name + ' but the attack fails!');
  }

  const isCritical = rollResult.criticalSuccess ||
    rollResult.margin >= CONFIG.combat.criticalHitThreshold;
  const strengthMod = Math.floor(actor.primaryStats.strength / 10);
  let damage = calculateDamage(
    actor.weapon.damage + CONFIG.combat.chargeDamageBonus,
    strengthMod, target.armor.protection, actor.weapon.armorPenetration,
  );
  if (isCritical) damage = Math.floor(damage * 1.5);

  const wound = applyWound(target, damage);
  target.wounds.push(wound);
  target.hp = Math.max(0, target.hp - damage);

  return makeResult(CombatAction.CHARGE, actor.id, target.id, true, damage, isCritical,
    actor.name + ' charges ' + target.name + '! Hits the ' + wound.location + ' for ' + damage + ' damage (+' + CONFIG.combat.chargeDamageBonus + ' charge bonus, ' + wound.severity + ' wound).',
    wound);
}

function resolveUseItem(
  state: CombatState,
  actor: Combatant,
  params?: Record<string, unknown>,
): CombatActionResult {
  const itemName = (params?.itemName as string) ?? 'unknown item';
  const healAmount = (params?.healAmount as number) ?? 0;
  const itemTargetId = params?.targetId as string | undefined;
  const stateChanges: Record<string, unknown> = {};

  if (healAmount > 0) {
    const healTarget = itemTargetId ? state.combatants[itemTargetId] : actor;
    if (healTarget) {
      healTarget.hp = Math.min(healTarget.hpMax, healTarget.hp + healAmount);
      stateChanges.healed = healAmount;
      return makeResult(CombatAction.USE_ITEM, actor.id, healTarget.id, true, 0, false,
        actor.name + ' uses ' + itemName + ' on ' + healTarget.name + ', restoring ' + healAmount + ' HP.',
        undefined, stateChanges);
    }
  }

  return makeResult(CombatAction.USE_ITEM, actor.id, undefined, true, 0, false,
    actor.name + ' uses ' + itemName + '.', undefined, stateChanges);
}

function resolveDisengage(_state: CombatState, actor: Combatant): CombatActionResult {
  actor.position += 5;
  return makeResult(CombatAction.DISENGAGE, actor.id, undefined, false, 0, false,
    actor.name + ' disengages from melee combat.');
}

function resolveCalledShot(
  state: CombatState,
  actor: Combatant,
  targetId?: string,
  params?: Record<string, unknown>,
): CombatActionResult {
  const target = targetId ? state.combatants[targetId] : findNearestEnemy(state, actor);
  if (!target || target.hp <= 0) {
    return makeResult(CombatAction.CALLED_SHOT, actor.id, targetId, false, 0, false,
      actor.name + ' has no valid target.');
  }

  const calledLocation = (params?.location as HitLocation) ?? 'head';

  const modifiers: number[] = [-20];
  if (actor.isAiming) modifiers.push(CONFIG.combat.aimBonus);

  const woundPenalty = actor.wounds.reduce(
    (sum, w) => sum + (w.penalties.weaponSkill ?? 0) + (w.penalties.ballisticSkill ?? 0), 0,
  );
  modifiers.push(woundPenalty);

  const isRanged = actor.weapon.range !== 'melee';
  const attackStat = isRanged
    ? actor.primaryStats.ballisticSkill
    : actor.primaryStats.weaponSkill;

  const targetDefense = target.isDefending ? CONFIG.combat.defensiveStanceBonus : 0;
  const hitChance = calculateHitChance(attackStat, actor.weapon.accuracy, modifiers, targetDefense);
  const rollResult = rollUnder(hitChance);

  if (!rollResult.success) {
    return makeResult(CombatAction.CALLED_SHOT, actor.id, target.id, false, 0, false,
      actor.name + ' aims for ' + target.name + "'s " + calledLocation + ' but misses!');
  }

  const isCritical = rollResult.criticalSuccess ||
    rollResult.margin >= CONFIG.combat.criticalHitThreshold;
  const strengthMod = Math.floor(actor.primaryStats.strength / 10);
  let damage = calculateDamage(
    actor.weapon.damage, strengthMod,
    target.armor.protection, actor.weapon.armorPenetration,
  );
  if (isCritical) damage = Math.floor(damage * 1.5);

  const wound = applyWound(target, damage, calledLocation);
  target.wounds.push(wound);
  target.hp = Math.max(0, target.hp - damage);

  return makeResult(CombatAction.CALLED_SHOT, actor.id, target.id, true, damage, isCritical,
    actor.name + ' lands a called shot on ' + target.name + "'s " + calledLocation + ' for ' + damage + ' damage (' + wound.severity + ' wound)!',
    wound);
}

function resolveOverwatch(_state: CombatState, actor: Combatant): CombatActionResult {
  actor.isOverwatching = true;
  return makeResult(CombatAction.OVERWATCH, actor.id, undefined, false, 0, false,
    actor.name + ' sets up overwatch. Will fire on enemy movement.');
}

function resolveCommand(state: CombatState, actor: Combatant): CombatActionResult {
  const companions = Object.values(state.combatants).filter(
    (c) => c.id !== actor.id && c.isCompanion && c.hp > 0,
  );
  for (const comp of companions) {
    comp.statusEffects.push('commanded_bonus');
  }
  const names = companions.map((c) => c.name).join(', ');
  return makeResult(CombatAction.COMMAND, actor.id, undefined, true, 0, false,
    actor.name + ' commands their companions (' + names + '), granting them +10 to next action.');
}

function resolveMove(
  state: CombatState,
  actor: Combatant,
  params?: Record<string, unknown>,
): CombatActionResult {
  const direction = (params?.direction as number) ?? 1;
  const distance = Math.floor(actor.primaryStats.agility / 10) + 3;
  actor.position += distance * (direction >= 0 ? 1 : -1);

  const isPlayerSide = actor.isPlayer || actor.isCompanion;
  const overwatchers = Object.values(state.combatants).filter(
    (c) =>
      (isPlayerSide ? !c.isPlayer && !c.isCompanion : c.isPlayer || c.isCompanion) &&
      c.hp > 0 && c.isOverwatching,
  );

  for (const watcher of overwatchers) {
    const attackStat = watcher.primaryStats.ballisticSkill;
    const hitChance = calculateHitChance(attackStat, watcher.weapon.accuracy, [-10], 0);
    const rollResult = rollUnder(hitChance);

    if (rollResult.success) {
      const sMod = Math.floor(watcher.primaryStats.strength / 10);
      const dmg = calculateDamage(
        watcher.weapon.damage, sMod,
        actor.armor.protection, watcher.weapon.armorPenetration,
      );
      const wound = applyWound(actor, dmg);
      actor.wounds.push(wound);
      actor.hp = Math.max(0, actor.hp - dmg);
      state.combatLog.push('OVERWATCH: ' + watcher.name + ' fires at ' + actor.name + ' for ' + dmg + ' damage!');
    } else {
      state.combatLog.push('OVERWATCH: ' + watcher.name + ' fires at ' + actor.name + ' but misses!');
    }
    watcher.isOverwatching = false;
  }

  return makeResult(CombatAction.MOVE, actor.id, undefined, false, 0, false,
    actor.name + ' moves ' + distance + ' units.');
}

// ---------------------------------------------------------------------------
// determineAIAction
// ---------------------------------------------------------------------------
export function determineAIAction(
  npc: Combatant,
  combatState: CombatState,
): { action: CombatAction; targetId?: string; params?: Record<string, unknown> } {
  const aiType = npc.aiType ?? 'aggressive';
  const enemies = Object.values(combatState.combatants).filter(
    (c) => (c.isPlayer || c.isCompanion) && c.hp > 0,
  );
  const allies = Object.values(combatState.combatants).filter(
    (c) => c.id !== npc.id && !c.isPlayer && !c.isCompanion && c.hp > 0,
  );

  if (enemies.length === 0) {
    return { action: CombatAction.DEFENSIVE_STANCE };
  }

  const weakestEnemy = [...enemies].sort((a, b) => a.hp - b.hp)[0];
  const strongestEnemy = [...enemies].sort((a, b) => b.hp - a.hp)[0];
  const hpRatio = npc.hp / Math.max(1, npc.hpMax);
  const isLowHP = hpRatio < 0.3;

  switch (aiType) {
    case 'aggressive':
      return { action: CombatAction.ATTACK, targetId: weakestEnemy.id };

    case 'defensive':
      if (isLowHP) {
        return { action: CombatAction.DEFENSIVE_STANCE };
      }
      return { action: CombatAction.ATTACK, targetId: strongestEnemy.id };

    case 'tactical':
      if (!npc.isAiming) {
        return { action: CombatAction.AIM };
      }
      return { action: CombatAction.ATTACK, targetId: weakestEnemy.id };

    case 'berserk':
      return { action: CombatAction.ALL_OUT_ATTACK, targetId: weakestEnemy.id };

    case 'support': {
      if (allies.length > 0) {
        const woundedAlly = allies.find((a) => a.hp < a.hpMax * 0.5);
        if (woundedAlly) {
          return {
            action: CombatAction.USE_ITEM,
            params: { itemName: 'Medkit', healAmount: 10, targetId: woundedAlly.id },
          };
        }
        return { action: CombatAction.COMMAND };
      }
      return { action: CombatAction.ATTACK, targetId: weakestEnemy.id };
    }

    case 'ranged_preference': {
      const closestEnemy = [...enemies].sort(
        (a, b) => Math.abs(a.position - npc.position) - Math.abs(b.position - npc.position),
      )[0];
      const distance = Math.abs(closestEnemy.position - npc.position);

      if (distance <= 2) {
        return { action: CombatAction.DISENGAGE };
      }
      if (!npc.isOverwatching && npc.weapon.range !== 'melee') {
        return { action: CombatAction.OVERWATCH };
      }
      return { action: CombatAction.ATTACK, targetId: closestEnemy.id };
    }

    default:
      return { action: CombatAction.ATTACK, targetId: weakestEnemy.id };
  }
}

// ---------------------------------------------------------------------------
// checkCombatEnd
// ---------------------------------------------------------------------------
export function checkCombatEnd(combatState: CombatState): CombatResult | null {
  const combatants = Object.values(combatState.combatants);
  const playerSide = combatants.filter((c) => c.isPlayer || c.isCompanion);
  const enemySide = combatants.filter((c) => !c.isPlayer && !c.isCompanion);

  const allEnemiesDead = enemySide.every((e) => e.hp <= 0);
  const playerDead = combatants.find((c) => c.isPlayer)?.hp === 0;
  const allPlayerSideDead = playerSide.every((c) => c.hp <= 0);

  if (!allEnemiesDead && !allPlayerSideDead) {
    return null;
  }

  const victory = allEnemiesDead && !allPlayerSideDead;

  const defeatedEnemies = enemySide.filter((e) => e.hp <= 0);
  const xpEarned = victory
    ? defeatedEnemies.reduce((sum, e) => {
        const level = Math.floor(
          (e.primaryStats.weaponSkill + e.primaryStats.ballisticSkill) / 20,
        );
        return sum + (level + 1) * 15;
      }, 0)
    : 0;

  const player = combatants.find((c) => c.isPlayer);
  const woundsReceived = player?.wounds ?? [];

  const companionDeaths = playerSide
    .filter((c) => c.isCompanion && c.hp <= 0)
    .map((c) => c.name);

  const sanityChange = victory
    ? companionDeaths.length > 0
      ? -5 * companionDeaths.length
      : 0
    : -10;

  const corruptionChange = 0;

  return {
    victory,
    xpEarned,
    loot: [],
    woundsReceived,
    sanityChange,
    corruptionChange,
    companionDeaths,
    description: victory
      ? 'Victory! ' + defeatedEnemies.length + ' enemies defeated. ' + xpEarned + ' XP earned.'
      : playerDead
        ? 'Defeat. The player has fallen.'
        : 'Defeat. The party has been wiped out.',
  };
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function findNearestEnemy(state: CombatState, actor: Combatant): Combatant | undefined {
  const isPlayerSide = actor.isPlayer || actor.isCompanion;
  const enemies = Object.values(state.combatants).filter(
    (c) =>
      (isPlayerSide ? !c.isPlayer && !c.isCompanion : c.isPlayer || c.isCompanion) &&
      c.hp > 0,
  );

  if (enemies.length === 0) return undefined;

  return enemies.reduce((nearest, e) =>
    Math.abs(e.position - actor.position) < Math.abs(nearest.position - actor.position)
      ? e
      : nearest,
  );
}

function makeResult(
  action: CombatAction,
  actorId: string,
  targetId: string | undefined,
  hit: boolean,
  damage: number,
  critical: boolean,
  description: string,
  wound?: Wound,
  stateChanges?: Record<string, unknown>,
): CombatActionResult {
  return {
    action,
    actorId,
    targetId,
    hit,
    damage,
    wound,
    critical,
    description,
    stateChanges: stateChanges ?? {},
  };
}
