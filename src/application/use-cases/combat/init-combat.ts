import { ICharacterRepository, IEventRepository } from '@/domain/interfaces';
import {
  CombatState,
  Combatant,
  EnvironmentModifier,
} from '@/domain/models';
import { initializeCombat } from '@/domain/engine/combat-engine';

export interface InitCombatInput {
  characterId: number;
  /** Pre-built player combatant data (weapon, armor, position, etc.) */
  playerCombatant: Combatant;
  /** Companion combatants fighting alongside the player */
  companions: Combatant[];
  /** Enemy combatants to fight against */
  enemies: Combatant[];
  /** Environmental conditions affecting combat (cover, darkness, etc.) */
  environmentModifiers?: EnvironmentModifier[];
  /** Current in-game day for event logging */
  gameDay: number;
}

export class InitCombatUseCase {
  constructor(
    private characterRepo: ICharacterRepository,
    private eventRepo: IEventRepository,
  ) {}

  async execute(input: InitCombatInput): Promise<CombatState> {
    // 1. Verify the character exists
    const character = await this.characterRepo.get(input.characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // 2. Initialize combat state using the combat engine
    const combatState = initializeCombat(
      input.playerCombatant,
      input.companions,
      input.enemies,
      input.environmentModifiers ?? [],
    );

    // 3. Log the combat initiation event
    const enemyNames = input.enemies.map((e) => e.name).join(', ');
    const companionNames =
      input.companions.length > 0
        ? input.companions.map((c) => c.name).join(', ')
        : 'none';

    await this.eventRepo.logEvent(input.characterId, {
      eventType: 'combat_initiated',
      title: 'Combat Initiated',
      description: `Combat began against: ${enemyNames}. Companions: ${companionNames}. ${input.enemies.length} hostiles engaged.`,
      data: {
        combatId: combatState.id,
        enemyCount: input.enemies.length,
        companionCount: input.companions.length,
        environmentModifiers: input.environmentModifiers ?? [],
        initiativeOrder: combatState.initiativeOrder,
      },
      gameDay: input.gameDay,
    });

    return combatState;
  }
}
