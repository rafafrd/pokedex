import type {
  BattleEffectiveness,
  BattleType,
  BattleTypeList,
  TypeRelations,
} from "./contracts";

/**
 * Relations are indexed by attacking type. The Controller must provide entries
 * for every type used by either combatant's regular moves, plus normal for the
 * configured emergency Struggle move.
 */
export type TypeRelationsByType = Readonly<
  Partial<Record<BattleType, TypeRelations>>
>;

/** Fails explicitly when the Controller has not loaded an attacker's relations. */
export function requireTypeRelations(
  attackingType: BattleType,
  relationsByType: TypeRelationsByType,
): TypeRelations {
  const relations = relationsByType[attackingType];
  if (!relations) {
    throw new Error(
      `Missing type relations for '${attackingType}'. Load relations for every move type and normal for emergency Struggle.`,
    );
  }
  if (relations.attackingType !== attackingType) {
    throw new RangeError(
      `Expected relations for attacking type '${attackingType}', received '${relations.attackingType}'.`,
    );
  }
  return relations;
}

export interface TypeEffectivenessOptions {
  /** Skips only immunity; weaknesses and resistances still apply. */
  readonly ignoreImmunity?: boolean;
}

/**
 * Computes one attacking type against one or two defending types. PokeAPI
 * relations are directional: each entry describes the attacking type here.
 */
export function getTypeEffectiveness(
  attackingType: BattleType,
  defendingTypes: BattleTypeList,
  relations: TypeRelations,
  options: TypeEffectivenessOptions = {},
): BattleEffectiveness {
  if (relations.attackingType !== attackingType) {
    throw new RangeError(
      `Expected relations for attacking type '${attackingType}', received '${relations.attackingType}'.`,
    );
  }

  let multiplier = 1;

  for (const defendingType of defendingTypes) {
    if (
      !options.ignoreImmunity &&
      relations.noDamageTo.includes(defendingType)
    ) {
      return 0;
    }

    if (relations.doubleDamageTo.includes(defendingType)) {
      multiplier *= 2;
    } else if (relations.halfDamageTo.includes(defendingType)) {
      multiplier *= 0.5;
    }
  }

  // With one or two defenders and normalized PokeAPI relations, the product
  // can only be one of the multipliers represented by the shared contract.
  return multiplier as BattleEffectiveness;
}
