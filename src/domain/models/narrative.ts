export type NarrativeBlockType = 'description' | 'dialogue' | 'system_message';

export interface NarrativeBlock {
  type: NarrativeBlockType;
  text: string;
  speaker?: string;
  speakerMood?: string;
  systemLevel?: number; // minimum system level to see
  requiredFlags?: string[];
  forbiddenFlags?: string[];
}

export interface SceneConditions {
  minLevel?: number;
  maxLevel?: number;
  requiredFlags?: string[];
  forbiddenFlags?: string[];
  minStat?: Record<string, number>;
  minReputation?: Record<string, number>;
  npcAlive?: string[];
  npcDead?: string[];
  minSanity?: number;
  maxSanity?: number;
  minCorruption?: number;
  maxCorruption?: number;
  hasMutation?: string[];
  questActive?: string[];
  questComplete?: string[];
  systemLevel?: number;
}

export type ChoiceVisibility =
  | { type: 'available' }
  | { type: 'locked'; reason: string }
  | { type: 'skill_check'; stat: string; difficulty: number };

export interface ChoiceEffect {
  setFlags?: string[];
  removeFlags?: string[];
  successFlags?: string[];
  failureFlags?: string[];
  statChanges?: Record<string, number>;
  npcRelationshipChanges?: Record<string, Record<string, number>>;
  factionRepChanges?: Record<string, number>;
  xpGain?: number;
  throneChange?: number;
  sanityChange?: number;
  corruptionChange?: number;
  addItems?: string[];
  removeItems?: string[];
  startQuest?: string;
  updateQuest?: { questId: string; objectiveId: string; complete: boolean };
  completeQuest?: string;
  failQuest?: string;
  killNpc?: string;
  addTrait?: string;
  removeTrait?: string;
  triggerCombat?: { enemyIds: string[]; environment?: string };
  scheduledConsequence?: { type: string; triggerDay: number; data: Record<string, unknown> };
  nextScene?: string;
}

export interface Choice {
  id: string;
  text: string;
  tooltip?: string;
  conditions?: SceneConditions;
  skillCheck?: { stat: string; difficulty: number; successScene?: string; failureScene?: string };
  effects: ChoiceEffect;
  visibleWhenLocked: boolean;
  lockReason?: string;
}

export interface Scene {
  id: string;
  chapter: string;
  title: string;
  conditions: SceneConditions;
  blocks: NarrativeBlock[];
  choices: Choice[];
  onEnterEffects?: ChoiceEffect;
  isHub: boolean;
  tags: string[];
  location?: string;
}

export interface StoryState {
  characterId: number;
  currentSceneId: string | null;
  flags: Record<string, boolean>;
  visitedScenes: string[];
  choiceHistory: Array<{ sceneId: string; choiceId: string; timestamp: Date }>;
  variables: Record<string, string | number>;
}
