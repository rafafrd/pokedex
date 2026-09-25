import type {
  BattleCombatant,
  BattleMove,
  BattleSide,
  RandomSource,
} from "./contracts";
import { readBattleRandom } from "./damage";

const PLAYER_FIRST_ON_SPEED_TIE_THRESHOLD = 0.5;

/**
 * Orders the two actions by priority, then Speed. A full tie consumes exactly
 * one injected sample; values below 0.5 put the player first.
 */
export function resolveTurnOrder(
  player: BattleCombatant,
  playerMove: BattleMove,
  opponent: BattleCombatant,
  opponentMove: BattleMove,
  randomSource: RandomSource,
): readonly [BattleSide, BattleSide] {
  if (playerMove.priority !== opponentMove.priority) {
    return playerMove.priority > opponentMove.priority
      ? ["player", "opponent"]
      : ["opponent", "player"];
  }

  if (player.calculatedStats.speed !== opponent.calculatedStats.speed) {
    return player.calculatedStats.speed > opponent.calculatedStats.speed
      ? ["player", "opponent"]
      : ["opponent", "player"];
  }

  return readBattleRandom(randomSource) < PLAYER_FIRST_ON_SPEED_TIE_THRESHOLD
    ? ["player", "opponent"]
    : ["opponent", "player"];
}
