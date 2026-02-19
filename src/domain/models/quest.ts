export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'expired';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'flag' | 'item' | 'kill' | 'reach_location' | 'stat_check' | 'reputation';
  target: string;
  targetAmount: number;
  currentAmount: number;
  completed: boolean;
  optional: boolean;
}

export interface QuestReward {
  xp: number;
  thrones: number;
  items: string[];
  factionRep: Record<string, number>;
  traits: string[];
  flags: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  giver: string | null; // NPC id
  factionId: string | null;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: QuestReward;
  failureConsequences: Record<string, unknown>;
  deadline: number | null; // game day or null for no deadline
  startDay: number;
  completedDay: number | null;
  chainNext: string | null; // next quest in chain
}
