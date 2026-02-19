export type NPCRole = 'companion' | 'merchant' | 'quest_giver' | 'rival' | 'mentor' | 'love_interest' | 'authority' | 'informant';
export type NPCPersonality = 'loyal' | 'treacherous' | 'pragmatic' | 'idealistic' | 'cowardly' | 'brave' | 'greedy' | 'generous' | 'suspicious' | 'trusting';
export type RomanceStage = 0 | 1 | 2 | 3 | 4; // none, interest, courting, romance, bonded

export interface RelationshipDimensions {
  affinity: number;    // -100 to 100 — how much they like you
  respect: number;     // -100 to 100 — how much they respect you
  fear: number;        // 0 to 100 — how much they fear you
  knowledge: number;   // 0 to 100 — how well they know you
  loyalty: number;     // -100 to 100 — companions only
}

export interface NPCSecret {
  id: string;
  description: string;
  knowledgeRequired: number;
  revealed: boolean;
  effectOnReveal?: Record<string, unknown>;
}

export interface BreakingPoint {
  id: string;
  condition: string; // a flag or stat check
  description: string;
  consequence: string; // event triggered
  triggered: boolean;
}

export interface CompanionData {
  combatRole: string;
  primaryStats: import('./character').PrimaryStats;
  weapon: string;
  armor: string;
  abilities: string[];
  loyaltyThreshold: number; // below this, they leave or betray
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  role: NPCRole;
  personality: NPCPersonality;
  description: string;
  location: string;
  factionId: string | null;
  relationship: RelationshipDimensions;
  romanceEligible: boolean;
  romanceStage: RomanceStage;
  secrets: NPCSecret[];
  breakingPoints: BreakingPoint[];
  companion: CompanionData | null;
  isAlive: boolean;
  lastInteraction: Date | null;
  dialogueTreeId: string | null;
}
