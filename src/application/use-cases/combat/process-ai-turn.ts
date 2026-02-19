import { CombatState, CombatActionResult } from '@/domain/models';
import { determineAIAction, resolveAction } from '@/domain/engine/combat-engine';

export interface ProcessAITurnOutput {
  newState: CombatState;
  actions: Array<{
    actorId: string;
    actorName: string;
    result: CombatActionResult;
  }>;
  combatEnded: boolean;
}

export class ProcessAITurnUseCase {
  async execute(combatState: CombatState): Promise<ProcessAITurnOutput> {
    if (combatState.isComplete) {
      throw new Error('Combat has already ended');
    }

    let state = combatState;
    const actions: ProcessAITurnOutput['actions'] = [];

    // Process all NPC turns until it's a player's turn again
    while (!state.isComplete) {
      const currentId = state.initiativeOrder[state.currentCombatantIndex];
      const current = state.combatants[currentId];
      if (!current) break;

      // Stop if it's the player's turn
      if (current.isPlayer) break;

      // Skip dead combatants
      if (current.hp <= 0) {
        const newIndex = (state.currentCombatantIndex + 1) % state.initiativeOrder.length;
        state = { ...state, currentCombatantIndex: newIndex };
        continue;
      }

      // Determine AI action
      const aiDecision = determineAIAction(current, state);
      const { newState, result } = resolveAction(
        state,
        currentId,
        aiDecision.action,
        aiDecision.targetId,
        aiDecision.params,
      );

      actions.push({
        actorId: currentId,
        actorName: current.name,
        result,
      });

      state = newState;

      if (state.isComplete) break;
    }

    return {
      newState: state,
      actions,
      combatEnded: state.isComplete,
    };
  }
}
