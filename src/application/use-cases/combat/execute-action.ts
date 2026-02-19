import {
  CombatState,
  CombatAction,
  CombatActionResult,
} from '@/domain/models';
import { resolveAction } from '@/domain/engine/combat-engine';

export interface ExecuteActionInput {
  /** Current combat state */
  combatState: CombatState;
  /** ID of the combatant performing the action */
  actorId: string;
  /** The combat action to perform */
  action: CombatAction;
  /** Optional target combatant ID */
  targetId?: string;
  /** Optional extra parameters (item name, called shot location, move direction, etc.) */
  params?: Record<string, unknown>;
}

export interface ExecuteActionOutput {
  /** The updated combat state after the action */
  newState: CombatState;
  /** The result details of the action performed */
  result: CombatActionResult;
  /** Whether combat has ended after this action */
  combatEnded: boolean;
}

export class ExecuteActionUseCase {
  /**
   * Executes a single combat action using the combat engine.
   * This use case is a pure orchestration layer -- it delegates all
   * combat logic to the domain engine and returns the result.
   */
  async execute(input: ExecuteActionInput): Promise<ExecuteActionOutput> {
    // 1. Validate the combat is still active
    if (input.combatState.isComplete) {
      throw new Error('Combat has already ended');
    }

    // 2. Validate the actor exists in the combat state
    const actor = input.combatState.combatants[input.actorId];
    if (!actor) {
      throw new Error(`Combatant with id "${input.actorId}" not found in combat`);
    }

    // 3. Validate the target exists if provided
    if (input.targetId && !input.combatState.combatants[input.targetId]) {
      throw new Error(`Target with id "${input.targetId}" not found in combat`);
    }

    // 4. Resolve the action through the combat engine
    const { newState, result } = resolveAction(
      input.combatState,
      input.actorId,
      input.action,
      input.targetId,
      input.params,
    );

    return {
      newState,
      result,
      combatEnded: newState.isComplete,
    };
  }
}
