import { ICharacterRepository, IEventRepository, IFactionRepository } from '@/domain/interfaces';
import { GameEvent } from '@/domain/models';
import { filterAvailableEvents, selectWeightedEvent } from '@/domain/engine/event-engine';
import { calculateCrossEffects } from '@/domain/engine/faction-engine';

export interface ProcessedEvent {
  event: GameEvent;
  outcomeDescription: string;
  effects: Record<string, unknown>;
}

export class EventProcessor {
  constructor(
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
    private factionRepo: IFactionRepository,
  ) {}

  async processDailyEvents(
    characterId: number,
    eventPool: GameEvent[],
    gameDay: number,
  ): Promise<ProcessedEvent | null> {
    const character = await this.characterRepo.get(characterId);
    if (!character) return null;

    // Get used event IDs
    const eventLog = await this.eventRepo.getEventLog(characterId, 200);
    const usedIdsRecord: Record<string, number> = {};
    for (const e of eventLog) {
      const eventId = (e.data as Record<string, string>).eventId;
      if (eventId) {
        usedIdsRecord[eventId] = (usedIdsRecord[eventId] ?? 0) + 1;
      }
    }

    const gameState = {
      level: character.level,
      flags: {} as Record<string, boolean>,
      sanity: character.sanity,
      corruption: character.corruption,
      factionReps: {} as Record<string, number>,
    };

    const available = filterAvailableEvents(eventPool, gameState, usedIdsRecord, gameDay);
    const event = selectWeightedEvent(available);

    if (!event) return null;

    // Apply first outcome by default (choices handled in UI)
    const outcome = event.outcomes[0];
    if (!outcome) return null;

    // Apply effects
    const updates: Record<string, unknown> = {};
    if (outcome.effects.xp) updates.xp = character.xp + outcome.effects.xp;
    if (outcome.effects.thrones) updates.thrones = Math.max(0, character.thrones + outcome.effects.thrones);
    if (outcome.effects.sanity) updates.sanity = Math.max(0, Math.min(character.sanityMax, character.sanity + outcome.effects.sanity));
    if (outcome.effects.corruption) updates.corruption = Math.max(0, Math.min(100, character.corruption + outcome.effects.corruption));

    if (Object.keys(updates).length > 0) {
      await this.characterRepo.update(characterId, updates as never);
    }

    // Apply faction rep changes
    if (outcome.effects.factionRep) {
      for (const [factionId, change] of Object.entries(outcome.effects.factionRep)) {
        await this.factionRepo.updateReputation(characterId, factionId, change);
        const crossEffects = calculateCrossEffects(factionId, change);
        for (const [crossFaction, crossChange] of Object.entries(crossEffects)) {
          await this.factionRepo.updateReputation(characterId, crossFaction, crossChange);
        }
      }
    }

    // Apply flags
    if (outcome.effects.flags) {
      // Flags are applied via story repo in use cases, logged here
    }

    await this.eventRepo.logEvent(characterId, {
      eventType: 'event_processed',
      title: event.title,
      description: outcome.description,
      data: { eventId: event.id, effects: outcome.effects },
      gameDay,
    });

    return {
      event,
      outcomeDescription: outcome.description,
      effects: outcome.effects as Record<string, unknown>,
    };
  }
}
