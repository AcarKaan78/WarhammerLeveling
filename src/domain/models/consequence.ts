export type TriggerType = 'game_day' | 'flag_set' | 'location_enter' | 'stat_reach' | 'reputation_reach' | 'item_acquire';
export type ConsequenceType = 'scene_trigger' | 'event_trigger' | 'stat_change' | 'npc_action' | 'faction_change' | 'item_gain' | 'combat_encounter';

export interface PendingConsequence {
  id: number;
  characterId: number;
  source: string; // what caused it (scene/choice/event id)
  triggerType: TriggerType;
  triggerValue: string | number;
  consequenceType: ConsequenceType;
  data: Record<string, unknown>;
  createdDay: number;
  expiresDay: number | null;
  triggered: boolean;
  triggeredDay: number | null;
}
