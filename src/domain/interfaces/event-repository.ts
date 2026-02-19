import { PendingConsequence } from '@/domain/models';

export interface EventLogEntry {
  id: number;
  characterId: number;
  eventType: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
  gameDay: number;
  createdAt: string;
}

export interface IEventRepository {
  logEvent(characterId: number, event: { eventType: string; title: string; description: string; data: Record<string, unknown>; gameDay: number }): Promise<EventLogEntry>;
  getEventLog(characterId: number, limit?: number): Promise<EventLogEntry[]>;
  createConsequence(data: Omit<PendingConsequence, 'id' | 'triggered' | 'triggeredDay'>): Promise<PendingConsequence>;
  getPendingConsequences(characterId: number): Promise<PendingConsequence[]>;
  triggerConsequence(id: number, gameDay: number): Promise<void>;
}
