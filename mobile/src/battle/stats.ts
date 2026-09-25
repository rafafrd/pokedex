import { BATTLE_CONFIG } from "./config";
import type { BattleStats } from "./contracts";

const STAT_FORMULA_DIVISOR = 100;
const HP_BASE_ADDITION = 10;
const OTHER_STAT_BASE_ADDITION = 5;

/**
 * Calculates level-scaled battle stats. The shared MVP config supplies level,
 * IV, EV, and neutral nature; callers may pass a level for pure formula use.
 */
export function calculateBattleStats(
  baseStats: BattleStats,
  level: number = BATTLE_CONFIG.level,
): BattleStats {
  if (!Number.isFinite(level) || level <= 0) {
    throw new RangeError("Battle level must be a positive finite number.");
  }

  for (const [name, value] of Object.entries(baseStats)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`Base stat '${name}' must be a non-negative finite number.`);
    }
  }

  const evContribution = Math.floor(BATTLE_CONFIG.ev / 4);
  const hp =
    Math.floor(
      ((2 * baseStats.hp + BATTLE_CONFIG.iv + evContribution) * level) /
        STAT_FORMULA_DIVISOR,
    ) +
    level +
    HP_BASE_ADDITION;

  const calculateNonHpStat = (baseStat: number): number => {
    const levelScaled =
      Math.floor(
        ((2 * baseStat + BATTLE_CONFIG.iv + evContribution) * level) /
          STAT_FORMULA_DIVISOR,
      ) + OTHER_STAT_BASE_ADDITION;

    return Math.floor(levelScaled * BATTLE_CONFIG.natureMultiplier);
  };

  return {
    hp,
    attack: calculateNonHpStat(baseStats.attack),
    defense: calculateNonHpStat(baseStats.defense),
    specialAttack: calculateNonHpStat(baseStats.specialAttack),
    specialDefense: calculateNonHpStat(baseStats.specialDefense),
    speed: calculateNonHpStat(baseStats.speed),
  };
}
