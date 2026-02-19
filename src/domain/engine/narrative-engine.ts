// ============================================================================
// NARRATIVE ENGINE -- Pure functions for scene/choice resolution
// ============================================================================

import { Scene, Choice, ChoiceVisibility, ChoiceEffect, SceneConditions, StoryState } from '@/domain/models';
import { CONFIG } from '@/domain/config';

export interface GameStateForNarrative {
  level: number;
  systemLevel: number;
  flags: Record<string, boolean>;
  primaryStats: Record<string, number>;
  factionReps: Record<string, number>;
  npcStates: Record<string, { isAlive: boolean; relationship: Record<string, number> }>;
  sanity: number;
  corruption: number;
  mutations: string[];
  activeQuests: string[];
  completedQuests: string[];
  variables: Record<string, string | number>;
  playerName: string;
  thrones: number;
  inventory: string[];
}

// ----------------------------------------------------------------------------
// checkSceneConditions
// ----------------------------------------------------------------------------

export function checkSceneConditions(
  conditions: SceneConditions,
  gameState: GameStateForNarrative,
): { available: boolean; reason?: string } {
  if (conditions.minLevel !== undefined && gameState.level < conditions.minLevel) {
    return { available: false, reason: `Requires level ${conditions.minLevel}` };
  }

  if (conditions.maxLevel !== undefined && gameState.level > conditions.maxLevel) {
    return { available: false, reason: `Requires level ${conditions.maxLevel} or below` };
  }

  if (conditions.requiredFlags) {
    for (const flag of conditions.requiredFlags) {
      if (!gameState.flags[flag]) {
        return { available: false, reason: `Missing required flag: ${flag}` };
      }
    }
  }

  if (conditions.forbiddenFlags) {
    for (const flag of conditions.forbiddenFlags) {
      if (gameState.flags[flag]) {
        return { available: false, reason: `Forbidden flag present: ${flag}` };
      }
    }
  }

  if (conditions.minStat) {
    for (const [stat, required] of Object.entries(conditions.minStat)) {
      const current = gameState.primaryStats[stat] ?? 0;
      if (current < required) {
        return { available: false, reason: `${stat} too low (${current}/${required})` };
      }
    }
  }

  if (conditions.minReputation) {
    for (const [faction, required] of Object.entries(conditions.minReputation)) {
      const current = gameState.factionReps[faction] ?? 0;
      if (current < required) {
        return { available: false, reason: `${faction} reputation too low (${current}/${required})` };
      }
    }
  }

  if (conditions.npcAlive) {
    for (const npcId of conditions.npcAlive) {
      const npc = gameState.npcStates[npcId];
      if (!npc || !npc.isAlive) {
        return { available: false, reason: `${npcId} must be alive` };
      }
    }
  }

  if (conditions.npcDead) {
    for (const npcId of conditions.npcDead) {
      const npc = gameState.npcStates[npcId];
      if (!npc || npc.isAlive) {
        return { available: false, reason: `${npcId} must be dead` };
      }
    }
  }

  if (conditions.minSanity !== undefined && gameState.sanity < conditions.minSanity) {
    return { available: false, reason: `Sanity too low (${gameState.sanity}/${conditions.minSanity})` };
  }

  if (conditions.maxSanity !== undefined && gameState.sanity > conditions.maxSanity) {
    return { available: false, reason: `Sanity too high (${gameState.sanity}/${conditions.maxSanity})` };
  }

  if (conditions.minCorruption !== undefined && gameState.corruption < conditions.minCorruption) {
    return { available: false, reason: `Corruption too low (${gameState.corruption}/${conditions.minCorruption})` };
  }

  if (conditions.maxCorruption !== undefined && gameState.corruption > conditions.maxCorruption) {
    return { available: false, reason: `Corruption too high (${gameState.corruption}/${conditions.maxCorruption})` };
  }

  if (conditions.hasMutation) {
    for (const mutation of conditions.hasMutation) {
      if (!gameState.mutations.includes(mutation)) {
        return { available: false, reason: `Missing mutation: ${mutation}` };
      }
    }
  }

  if (conditions.questActive) {
    for (const questId of conditions.questActive) {
      if (!gameState.activeQuests.includes(questId)) {
        return { available: false, reason: `Quest not active: ${questId}` };
      }
    }
  }

  if (conditions.questComplete) {
    for (const questId of conditions.questComplete) {
      if (!gameState.completedQuests.includes(questId)) {
        return { available: false, reason: `Quest not completed: ${questId}` };
      }
    }
  }

  if (conditions.systemLevel !== undefined && gameState.systemLevel < conditions.systemLevel) {
    return { available: false, reason: `System level ${conditions.systemLevel} required` };
  }

  return { available: true };
}

// ----------------------------------------------------------------------------
// filterAvailableChoices
// ----------------------------------------------------------------------------

export function filterAvailableChoices(
  choices: Choice[],
  gameState: GameStateForNarrative,
  systemLevel: number,
): Array<{ choice: Choice; visibility: ChoiceVisibility }> {
  const result: Array<{ choice: Choice; visibility: ChoiceVisibility }> = [];

  for (const choice of choices) {
    // Check system level requirement
    if (choice.conditions?.systemLevel !== undefined && systemLevel < choice.conditions.systemLevel) {
      if (choice.visibleWhenLocked) {
        result.push({
          choice,
          visibility: {
            type: 'locked',
            reason: choice.lockReason ?? `Requires system level ${choice.conditions.systemLevel}`,
          },
        });
      }
      // Hidden -- excluded entirely
      continue;
    }

    const hasSkillCheck = !!choice.skillCheck;

    // Check conditions
    if (choice.conditions) {
      const { available, reason } = checkSceneConditions(choice.conditions, gameState);

      if (!available) {
        if (choice.visibleWhenLocked) {
          result.push({
            choice,
            visibility: {
              type: 'locked',
              reason: choice.lockReason ?? reason ?? 'Requirements not met',
            },
          });
        }
        // Hidden -- excluded
        continue;
      }
    }

    // Conditions met (or no conditions)
    if (hasSkillCheck) {
      result.push({
        choice,
        visibility: {
          type: 'skill_check',
          stat: choice.skillCheck!.stat,
          difficulty: choice.skillCheck!.difficulty,
        },
      });
    } else {
      result.push({
        choice,
        visibility: { type: 'available' },
      });
    }
  }

  return result;
}

// ----------------------------------------------------------------------------
// processChoiceEffects
// ----------------------------------------------------------------------------

export function processChoiceEffects(effects: ChoiceEffect): { notifications: string[] } {
  const notifications: string[] = [];

  if (effects.xpGain) {
    notifications.push(`Gained ${effects.xpGain} XP`);
  }

  if (effects.throneChange) {
    if (effects.throneChange > 0) {
      notifications.push(`Gained ${effects.throneChange} Thrones`);
    } else {
      notifications.push(`Lost ${Math.abs(effects.throneChange)} Thrones`);
    }
  }

  if (effects.sanityChange) {
    if (effects.sanityChange > 0) {
      notifications.push(`Sanity restored by ${effects.sanityChange}`);
    } else {
      notifications.push(`Sanity reduced by ${Math.abs(effects.sanityChange)}`);
    }
  }

  if (effects.corruptionChange) {
    if (effects.corruptionChange > 0) {
      notifications.push(`Corruption increased by ${effects.corruptionChange}`);
    } else {
      notifications.push(`Corruption decreased by ${Math.abs(effects.corruptionChange)}`);
    }
  }

  if (effects.statChanges) {
    for (const [stat, change] of Object.entries(effects.statChanges)) {
      if (change > 0) {
        notifications.push(`${stat} increased by ${change}`);
      } else if (change < 0) {
        notifications.push(`${stat} decreased by ${Math.abs(change)}`);
      }
    }
  }

  if (effects.factionRepChanges) {
    for (const [faction, change] of Object.entries(effects.factionRepChanges)) {
      notifications.push(`Reputation with ${faction} changed by ${change > 0 ? '+' : ''}${change}`);
    }
  }

  if (effects.npcRelationshipChanges) {
    for (const [npcId, changes] of Object.entries(effects.npcRelationshipChanges)) {
      for (const [dimension, change] of Object.entries(changes)) {
        notifications.push(`${npcId} ${dimension} changed by ${change > 0 ? '+' : ''}${change}`);
      }
    }
  }

  if (effects.setFlags) {
    for (const flag of effects.setFlags) {
      notifications.push(`Flag set: ${flag}`);
    }
  }

  if (effects.removeFlags) {
    for (const flag of effects.removeFlags) {
      notifications.push(`Flag removed: ${flag}`);
    }
  }

  if (effects.addItems) {
    for (const item of effects.addItems) {
      notifications.push(`Item acquired: ${item}`);
    }
  }

  if (effects.removeItems) {
    for (const item of effects.removeItems) {
      notifications.push(`Item lost: ${item}`);
    }
  }

  if (effects.startQuest) {
    notifications.push(`Quest started: ${effects.startQuest}`);
  }

  if (effects.completeQuest) {
    notifications.push(`Quest completed: ${effects.completeQuest}`);
  }

  if (effects.failQuest) {
    notifications.push(`Quest failed: ${effects.failQuest}`);
  }

  if (effects.updateQuest) {
    const status = effects.updateQuest.complete ? 'completed' : 'updated';
    notifications.push(
      `Quest ${effects.updateQuest.questId} objective ${effects.updateQuest.objectiveId} ${status}`,
    );
  }

  if (effects.killNpc) {
    notifications.push(`${effects.killNpc} has died`);
  }

  if (effects.addTrait) {
    notifications.push(`Trait gained: ${effects.addTrait}`);
  }

  if (effects.removeTrait) {
    notifications.push(`Trait lost: ${effects.removeTrait}`);
  }

  if (effects.triggerCombat) {
    notifications.push(`Combat initiated!`);
  }

  return { notifications };
}

// ----------------------------------------------------------------------------
// substituteVariables
// ----------------------------------------------------------------------------

export function substituteVariables(
  text: string,
  variables: Record<string, string | number>,
): string {
  return text.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey in variables) {
      return String(variables[trimmedKey]);
    }
    return `{${trimmedKey}}`;
  });
}
