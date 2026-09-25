import { BATTLE_CONFIG } from "./config";
import type {
  BattleEffectiveness,
  BattleMove,
  BattleStats,
  BattleTypeList,
  RandomSource,
} from "./contracts";

const DAMAGE_FORMULA_DIVISOR = 50;
const DAMAGE_LEVEL_SCALE = 5;
const MINIMUM_NON_IMMUNE_DAMAGE = 1;
const RANDOM_FACTOR_RANGE =
  BATTLE_CONFIG.damageRandomMaximum - BATTLE_CONFIG.damageRandomMinimum;
const RANDOM_FACTOR_STEP_SIZE = 0.01;
const RANDOM_FACTOR_BUCKET_COUNT =
  Math.round(RANDOM_FACTOR_RANGE / RANDOM_FACTOR_STEP_SIZE) + 1;

export interface DamageCalculationInput {
  readonly attackerStats: BattleStats;
  readonly defenderStats: BattleStats;
  readonly attackerTypes: BattleTypeList;
  readonly move: BattleMove;
  readonly level: number;
  readonly effectiveness: BattleEffectiveness;
  readonly isCritical: boolean;
  readonly randomFactor: number;
}

/** Returns a validated sample from the injected [0, 1) random source. */
export function readBattleRandom(randomSource: RandomSource): number {
  const sample = randomSource();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError("RandomSource must return a finite value in [0, 1).");
  }
  return sample;
}

/** Emergency move behavior is read from semantic contract fields, never names. */
export function getMoveStabMultiplier(
  move: BattleMove,
  attackerTypes: BattleTypeList,
): number {
  if (move.kind === "emergency" && move.rules.stab === "ignore") {
    return 1;
  }
  return attackerTypes.includes(move.type) ? BATTLE_CONFIG.stabMultiplier : 1;
}

/**
 * Rolls critical before damage variation; consumes exactly one random sample.
 * A sample strictly below 1/24 is critical; equality is not critical.
 */
export function rollCriticalHit(randomSource: RandomSource): boolean {
  return readBattleRandom(randomSource) < BATTLE_CONFIG.criticalChance;
}

/**
 * Maps one injected [0, 1) sample into configured hundredth-step buckets,
 * including both configured endpoints. With MVP config the values are 0.85,
 * 0.86, ..., 0.99, 1.00; each call consumes exactly one sample.
 */
export function rollDamageRandomFactor(randomSource: RandomSource): number {
  const bucket = Math.floor(
    readBattleRandom(randomSource) * RANDOM_FACTOR_BUCKET_COUNT,
  );
  return Math.min(
    BATTLE_CONFIG.damageRandomMaximum,
    BATTLE_CONFIG.damageRandomMinimum + bucket * RANDOM_FACTOR_STEP_SIZE,
  );
}

/**
 * Pure direct-damage formula. Rounding is explicit: floor the base formula,
 * multiply STAB/effectiveness/critical/random modifiers, then floor once more.
 * A non-immune hit deals at least one HP; immunity is represented by zero.
 */
export function calculateDamage(input: DamageCalculationInput): number {
  const {
    attackerStats,
    defenderStats,
    attackerTypes,
    move,
    level,
    effectiveness,
    isCritical,
    randomFactor,
  } = input;

  const attack =
    move.damageClass === "physical"
      ? attackerStats.attack
      : attackerStats.specialAttack;
  const defense =
    move.damageClass === "physical"
      ? defenderStats.defense
      : defenderStats.specialDefense;

  if (effectiveness === 0) return 0;
  if (!Number.isFinite(defense) || defense <= 0) {
    throw new RangeError("Defending stat must be a positive finite number.");
  }
  if (!Number.isFinite(level) || level <= 0) {
    throw new RangeError("Battle level must be a positive finite number.");
  }
  if (!Number.isFinite(move.power) || move.power <= 0) {
    throw new RangeError("Damage moves must have positive finite power.");
  }
  if (
    !Number.isFinite(effectiveness) ||
    effectiveness < 0 ||
    !Number.isFinite(randomFactor) ||
    randomFactor < BATTLE_CONFIG.damageRandomMinimum ||
    randomFactor > BATTLE_CONFIG.damageRandomMaximum
  ) {
    throw new RangeError("Damage modifiers are outside the supported range.");
  }

  const baseDamage = Math.floor(
    (((2 * level) / DAMAGE_LEVEL_SCALE + 2) * move.power * attack) /
      defense /
      DAMAGE_FORMULA_DIVISOR +
      2,
  );

  const stab = getMoveStabMultiplier(move, attackerTypes);
  const criticalMultiplier = isCritical ? BATTLE_CONFIG.criticalMultiplier : 1;
  const modifiedDamage = Math.floor(
    baseDamage * stab * effectiveness * criticalMultiplier * randomFactor,
  );

  return Math.max(MINIMUM_NON_IMMUNE_DAMAGE, modifiedDamage);
}
