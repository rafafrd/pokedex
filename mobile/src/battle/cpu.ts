import type {
  BattleCombatant,
  BattleMove,
  BattleMoveState,
  RandomSource,
} from "./contracts";
import { getMoveStabMultiplier, readBattleRandom } from "./damage";
import {
  getTypeEffectiveness,
  requireTypeRelations,
  type TypeRelationsByType,
} from "./type-effectiveness";

const CPU_VARIATION_MINIMUM = 0.9;
const CPU_VARIATION_RANGE = 0.2;

function scoreMove(
  combatant: BattleCombatant,
  target: BattleCombatant,
  move: BattleMove,
  typeRelations: TypeRelationsByType,
): number {
  const effectiveness = getTypeEffectiveness(
    move.type,
    target.definition.types,
    requireTypeRelations(move.type, typeRelations),
    {
      ignoreImmunity:
        move.kind === "emergency" && move.rules.typeImmunity === "ignore",
    },
  );
  const accuracyFactor = move.accuracy === null ? 1 : move.accuracy / 100;
  const stab = getMoveStabMultiplier(move, combatant.definition.types);

  return move.power * accuracyFactor * stab * effectiveness;
}

/**
 * Picks only a regular move with PP remaining, or emergency Struggle when all
 * regular PP is spent. For multiple choices one variation draw is consumed per
 * candidate in move-list order; ties retain the earliest move.
 */
export function chooseCpuMove(
  combatant: BattleCombatant,
  target: BattleCombatant,
  typeRelations: TypeRelationsByType,
  randomSource: RandomSource,
): BattleMoveState {
  const available = combatant.moveStates.filter((state) => state.currentPp > 0);
  if (available.length === 0) return combatant.emergencyMoveState;
  const firstAvailable = available[0];
  if (!firstAvailable) return combatant.emergencyMoveState;
  if (available.length === 1) return firstAvailable;

  let best = firstAvailable;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of available) {
    const variation =
      CPU_VARIATION_MINIMUM +
      readBattleRandom(randomSource) * CPU_VARIATION_RANGE;
    const score =
      scoreMove(combatant, target, candidate.move, typeRelations) * variation;

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
