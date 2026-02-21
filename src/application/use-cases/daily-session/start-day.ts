import {
  ICharacterRepository,
  ITaskRepository,
  IEventRepository,
  INPCRepository,
  IFactionRepository,
} from '@/domain/interfaces';
import { CONFIG } from '@/domain/config';
import { isNewDay, getGameDay } from '@/domain/engine/calendar-engine';
import { calculateStreakBreak } from '@/domain/engine/task-engine';
import { getSanityState, checkNightmare } from '@/domain/engine/sanity-engine';
import { checkTriggerCondition, isExpired } from '@/domain/engine/consequence-engine';
import { calculateDecay } from '@/domain/engine/relationship-engine';
import { filterAvailableEvents, selectWeightedEvent } from '@/domain/engine/event-engine';
import { getDailyXPCap } from '@/domain/engine/task-engine';

export interface DailyBriefing {
  isNewDay: boolean;
  gameDay: number;
  notifications: string[];
  brokenStreaks: string[];
  nightmareReport: { hadNightmare: boolean; description?: string | null; sanityLoss: number };
  dailyEvent: { id: string; title: string; description: string } | null;
  triggeredConsequences: string[];
  warnings: string[];
  xpCap: number;
}

export class StartDayUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private taskRepo: ITaskRepository,
    private eventRepo: IEventRepository,
    private npcRepo: INPCRepository,
    private factionRepo: IFactionRepository,
  ) {}

  async execute(characterId: number, eventPool?: import('@/domain/models').GameEvent[]): Promise<DailyBriefing> {
    const character = await this.characterRepo.get(characterId);
    if (!character) throw new Error('Character not found');

    const now = new Date();
    const newDay = isNewDay(character.lastPlayed, now);
    const gameDay = getGameDay(character.createdAt, now);
    const notifications: string[] = [];
    const warnings: string[] = [];
    const brokenStreaks: string[] = [];
    let nightmareReport = { hadNightmare: false, description: null as string | null, sanityLoss: 0 };
    let dailyEvent: DailyBriefing['dailyEvent'] = null;
    const triggeredConsequences: string[] = [];

    if (newDay) {
      // 1. Check all task streaks & calculate yesterday's completion %
      const tasks = await this.taskRepo.getAll(characterId, true);
      for (const task of tasks) {
        if (task.recurring && task.currentStreak > 0) {
          const broken = calculateStreakBreak(task.lastCompleted, now, task.recurring);
          if (broken) {
            brokenStreaks.push(task.name);
            await this.taskRepo.update(task.id, { currentStreak: 0 });
          }
        }
      }
      if (brokenStreaks.length > 0) {
        notifications.push(`Streaks broken: ${brokenStreaks.join(', ')}`);
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdaySession = await this.taskRepo.getDailySession(characterId, yesterdayStr);
      const categoryCounts = (yesterdaySession?.categoryCounts ?? {}) as Record<string, number>;
      const hadSelfCare = (categoryCounts['self_care'] ?? 0) > 0 || (categoryCounts['meditation_discipline'] ?? 0) > 0;

      // Calculate completion percentage — this scales EVERYTHING
      const totalActiveTasks = tasks.filter(t => t.recurring).length;
      const yesterdayCompleted = yesterdaySession?.tasksCompleted ?? 0;
      const completionPct = totalActiveTasks > 0 ? Math.min(1, yesterdayCompleted / totalActiveTasks) : 0;
      const pct = Math.round(completionPct * 100);
      // Penalties are reduced by completion %: 50% done = penalties halved, 100% = no penalties
      const penaltyScale = Math.max(0, 1 - completionPct);
      const maxDailyPenalty = (CONFIG.sanity as Record<string, unknown>).maxDailyPenalty as number ?? 15;
      let totalPenalty = 0;

      // 2. Apply sanity penalty if no self-care yesterday (scaled by completion %)
      if (!hadSelfCare) {
        const rawPenalty = CONFIG.sanity.noSelfCarePenalty;
        const penalty = Math.min(Math.round(rawPenalty * penaltyScale), maxDailyPenalty - totalPenalty);
        if (penalty > 0) {
          totalPenalty += penalty;
          const newSanity = Math.max(0, character.sanity - penalty);
          await this.characterRepo.update(characterId, { sanity: newSanity });
          character.sanity = newSanity;
          notifications.push(`No self-care yesterday. Sanity -${penalty}.`);
        }
      }

      // 3. Streak break sanity penalty (scaled by completion %, capped)
      if (brokenStreaks.length > 0 && totalPenalty < maxDailyPenalty) {
        const rawPenalty = brokenStreaks.length * CONFIG.sanity.streakBreakPenalty;
        const penalty = Math.min(Math.round(rawPenalty * penaltyScale), maxDailyPenalty - totalPenalty);
        if (penalty > 0) {
          totalPenalty += penalty;
          const newSanity = Math.max(0, character.sanity - penalty);
          await this.characterRepo.update(characterId, { sanity: newSanity });
          character.sanity = newSanity;
          notifications.push(`Broken streaks cost ${penalty} sanity.`);
        }
      }

      // 4. Sanity & corruption bonus for task completion
      if (completionPct > 0) {
        // Sanity recovery (scales with completion %)
        const maxSanityBonus = (CONFIG.sanity as Record<string, unknown>).dailyCompletionBonusMax as number ?? 8;
        const sanityBonus = Math.round(completionPct * maxSanityBonus);
        if (sanityBonus > 0) {
          const newSanity = Math.min(character.sanityMax, character.sanity + sanityBonus);
          if (newSanity > character.sanity) {
            const gained = newSanity - character.sanity;
            await this.characterRepo.update(characterId, { sanity: newSanity });
            character.sanity = newSanity;
            notifications.push(`${pct}% tasks completed. Sanity +${gained}.`);
          }
        }

        // Corruption reduction (discipline purges the taint)
        const maxCorruptionReduction = (CONFIG.sanity as Record<string, unknown>).dailyCompletionCorruptionReduction as number ?? 3;
        const corruptionReduction = Math.round(completionPct * maxCorruptionReduction);
        if (corruptionReduction > 0 && character.corruption > 0) {
          const newCorruption = Math.max(0, character.corruption - corruptionReduction);
          if (newCorruption < character.corruption) {
            const reduced = character.corruption - newCorruption;
            await this.characterRepo.update(characterId, { corruption: newCorruption });
            character.corruption = newCorruption;
            notifications.push(`Discipline purges the taint. Corruption -${reduced}.`);
          }
        }
      }

      // 5. Check pending consequences
      const consequences = await this.eventRepo.getPendingConsequences(characterId);
      const storyState = { currentGameDay: gameDay, flags: {}, currentLocation: character.currentLocation, stats: {}, factionReps: {}, inventory: [] };
      for (const consequence of consequences) {
        if (isExpired(consequence, gameDay)) continue;
        if (checkTriggerCondition(consequence, storyState)) {
          await this.eventRepo.triggerConsequence(consequence.id, gameDay);
          triggeredConsequences.push(consequence.source);
          notifications.push(`A past decision comes back to haunt you...`);
        }
      }

      // 6. Relationship decay (weekly check)
      if (gameDay % 7 === 0) {
        const npcs = await this.npcRepo.getAll(characterId);
        for (const npc of npcs) {
          if (!npc.isAlive) continue;
          const decay = calculateDecay(npc.lastInteraction, now, CONFIG.relationships.decayRatePerWeek);
          if (decay > 0) {
            const newAffinity = Math.max(-100, npc.relationship.affinity - decay);
            await this.npcRepo.updateRelationship(npc.id, { affinity: newAffinity });
          }
        }
      }

      // 7. Check nightmare (also capped by daily limit)
      const sanityState = getSanityState(character.sanity);
      const nightmare = checkNightmare(sanityState);
      if (nightmare.hasNightmare && totalPenalty < maxDailyPenalty) {
        const cappedLoss = Math.min(nightmare.sanityLoss, maxDailyPenalty - totalPenalty);
        nightmareReport = {
          hadNightmare: true,
          description: nightmare.description,
          sanityLoss: cappedLoss,
        };
        totalPenalty += cappedLoss;
        const newSanity = Math.max(0, character.sanity - cappedLoss);
        await this.characterRepo.update(characterId, { sanity: newSanity });
        notifications.push(`Nightmare! Sanity -${cappedLoss}.`);
      }

      // 8. Daily event
      if (eventPool && eventPool.length > 0) {
        const eventLog = await this.eventRepo.getEventLog(characterId, 100);
        const usedIds: Record<string, number> = {};
        for (const e of eventLog) {
          const eventId = (e.data as Record<string, string>).eventId;
          if (eventId) {
            usedIds[eventId] = (usedIds[eventId] ?? 0) + 1;
          }
        }
        const gameState = {
          level: character.level,
          flags: {} as Record<string, boolean>,
          sanity: character.sanity,
          corruption: character.corruption,
          factionReps: {} as Record<string, number>,
        };
        const available = filterAvailableEvents(eventPool, gameState, usedIds, gameDay);
        const event = selectWeightedEvent(available);
        if (event) {
          dailyEvent = { id: event.id, title: event.title, description: event.description };
          await this.eventRepo.logEvent(characterId, {
            eventType: 'daily_event',
            title: event.title,
            description: event.description,
            data: { eventId: event.id },
            gameDay,
          });
        }
      }

      // 9. Update last played and create today's session
      await this.characterRepo.update(characterId, { lastPlayed: now });
      const todayStr = now.toISOString().split('T')[0];
      const existingSession = await this.taskRepo.getDailySession(characterId, todayStr);
      if (!existingSession) {
        await this.taskRepo.upsertDailySession({
          id: 0,
          characterId,
          date: todayStr,
          totalXPEarned: 0,
          xpCap: getDailyXPCap(character.level),
          tasksCompleted: 0,
          categoryCounts: {},
          streaksBroken: brokenStreaks,
          gameDay,
        });
      }
    }

    // Warnings
    if (character.sanity < 40) warnings.push('Sanity is critically low!');
    if (character.corruption > 60) warnings.push('Corruption is dangerously high!');
    if (character.hpCurrent < character.hpMax * 0.25) warnings.push('Health is critical!');
    if (character.thrones < 10) warnings.push('Running low on Thrones.');

    return {
      isNewDay: newDay,
      gameDay,
      notifications,
      brokenStreaks,
      nightmareReport,
      dailyEvent,
      triggeredConsequences,
      warnings,
      xpCap: getDailyXPCap(character.level),
    };
  }
}
