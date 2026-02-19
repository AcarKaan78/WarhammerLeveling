import type { PrimaryStats } from './character';

export enum CombatAction {
  ATTACK = 'ATTACK',
  AIM = 'AIM',
  ALL_OUT_ATTACK = 'ALL_OUT_ATTACK',
  DEFENSIVE_STANCE = 'DEFENSIVE_STANCE',
  CHARGE = 'CHARGE',
  SUPPRESSIVE_FIRE = 'SUPPRESSIVE_FIRE',
  USE_PSYCHIC = 'USE_PSYCHIC',
  USE_ITEM = 'USE_ITEM',
  DISENGAGE = 'DISENGAGE',
  CALLED_SHOT = 'CALLED_SHOT',
  OVERWATCH = 'OVERWATCH',
  COMMAND = 'COMMAND',
  MOVE = 'MOVE',
}

export type AIBehaviorType =
  | 'aggressive'
  | 'defensive'
  | 'tactical'
  | 'berserk'
  | 'support'
  | 'ranged_preference';

export type HitLocation =
  | 'head'
  | 'leftArm'
  | 'rightArm'
  | 'body'
  | 'leftLeg'
  | 'rightLeg';

export type WoundSeverity = 'light' | 'serious' | 'critical' | 'mortal';

export interface Wound {
  location: HitLocation;
  severity: WoundSeverity;
  damage: number;
  bleedPerRound: number;
  penalties: Record<string, number>;
}

export interface Combatant {
  id: string;
  name: string;
  isPlayer: boolean;
  isCompanion: boolean;
  hp: number;
  hpMax: number;
  primaryStats: PrimaryStats;
  weapon: {
    name: string;
    damage: number;
    accuracy: number;
    armorPenetration: number;
    range: string;
    rateOfFire: number;
    condition: number;
  };
  armor: {
    name: string;
    protection: number;
    locations: HitLocation[];
  };
  wounds: Wound[];
  statusEffects: string[];
  initiative: number;
  position: number;
  aiType?: AIBehaviorType;
  isAiming: boolean;
  isDefending: boolean;
  isOverwatching: boolean;
}

export interface EnvironmentModifier {
  name: string;
  effect: string;
  modifier: number;
}

export interface CombatState {
  id: string;
  turnNumber: number;
  currentCombatantIndex: number;
  initiativeOrder: string[];
  combatants: Record<string, Combatant>;
  environmentModifiers: EnvironmentModifier[];
  combatLog: string[];
  isComplete: boolean;
  result: CombatResult | null;
}

export interface CombatActionResult {
  action: CombatAction;
  actorId: string;
  targetId?: string;
  hit: boolean;
  damage: number;
  wound?: Wound;
  critical: boolean;
  description: string;
  stateChanges: Record<string, unknown>;
}

export interface CombatResult {
  victory: boolean;
  xpEarned: number;
  loot: string[];
  woundsReceived: Wound[];
  sanityChange: number;
  corruptionChange: number;
  companionDeaths: string[];
  description: string;
}
