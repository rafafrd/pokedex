import { BATTLE_CONFIG } from "./config";
import type {
  BattleCombatant,
  BattleEvent,
  BattleMove,
  BattleMoveId,
  BattleMoveState,
  BattlePhase,
  BattlePokemonDefinition,
  BattleSide,
  BattleState,
  RegularBattleMoveState,
  RegularBattleMoveStateList,
  RandomSource,
} from "./contracts";
import {
  calculateDamage,
  readBattleRandom,
  rollCriticalHit,
  rollDamageRandomFactor,
} from "./damage";
import { chooseCpuMove } from "./cpu";
import { calculateBattleStats } from "./stats";
import {
  getTypeEffectiveness,
  requireTypeRelations,
  type TypeRelationsByType,
} from "./type-effectiveness";
import { resolveTurnOrder } from "./turn-order";

export type ActiveBattlePhase = Extract<
  BattlePhase,
  "intro" | "waiting-player" | "resolving-player" | "resolving-opponent"
>;

export interface BattleTurnResult {
  readonly state: BattleState;
  readonly events: readonly BattleEvent[];
}

export type BattleActionErrorCode =
  | "battle-not-ready"
  | "battle-already-ended"
  | "unknown-move"
  | "move-out-of-pp";

const ACCURACY_ROLL_SCALE = 100;

export class BattleActionError extends Error {
  readonly code: BattleActionErrorCode;

  constructor(code: BattleActionErrorCode, message: string) {
    super(message);
    this.name = "BattleActionError";
    this.code = code;
  }
}

function createCombatant(definition: BattlePokemonDefinition): BattleCombatant {
  if (
    definition.moves.length < 1 ||
    definition.moves.length > BATTLE_CONFIG.maxMoves
  ) {
    throw new RangeError(
      `A battle definition must contain 1 to ${BATTLE_CONFIG.maxMoves} regular moves.`,
    );
  }

  const seenMoveIds = new Set<BattleMoveId>();
  for (const move of definition.moves) {
    if (seenMoveIds.has(move.id)) {
      throw new RangeError(`Duplicate move id '${String(move.id)}' in '${definition.name}'.`);
    }
    if (!Number.isInteger(move.maxPp) || move.maxPp <= 0) {
      throw new RangeError(`Move '${move.name}' must have positive integer maximum PP.`);
    }
    if (!Number.isFinite(move.power) || move.power <= 0) {
      throw new RangeError(`Move '${move.name}' must have positive finite power.`);
    }
    if (
      move.accuracy !== null &&
      (!Number.isFinite(move.accuracy) ||
        move.accuracy < 0 ||
        move.accuracy > ACCURACY_ROLL_SCALE)
    ) {
      throw new RangeError(
        `Move '${move.name}' accuracy must be between 0 and ${ACCURACY_ROLL_SCALE}.`,
      );
    }
    if (!Number.isFinite(move.priority)) {
      throw new RangeError(`Move '${move.name}' priority must be finite.`);
    }
    seenMoveIds.add(move.id);
  }

  const normalizedDefinition: BattlePokemonDefinition = {
    ...definition,
    level: BATTLE_CONFIG.level,
  };
  const calculatedStats = calculateBattleStats(
    normalizedDefinition.baseStats,
    BATTLE_CONFIG.level,
  );
  const moveStates = normalizedDefinition.moves.map(
    (move): RegularBattleMoveState => ({
      kind: "regular",
      move,
      currentPp: move.maxPp,
    }),
  ) as RegularBattleMoveStateList;

  return {
    definition: normalizedDefinition,
    calculatedStats,
    maxHp: calculatedStats.hp,
    currentHp: calculatedStats.hp,
    moveStates,
    emergencyMoveState: {
      kind: "emergency",
      move: BATTLE_CONFIG.struggle,
    },
  };
}

/** Creates a level-50 battle in the intro phase with full HP and PP. */
export function createBattleState(
  playerDefinition: BattlePokemonDefinition,
  opponentDefinition: BattlePokemonDefinition,
): BattleState {
  return {
    player: createCombatant(playerDefinition),
    opponent: createCombatant(opponentDefinition),
    turnNumber: 1,
    phase: "intro",
    winner: null,
  };
}

/** Moves a newly created battle from its intro to the first player decision. */
export function startBattle(state: BattleState): BattleState {
  if (state.phase !== "intro") return state;
  return activeState(state, "waiting-player");
}

/** Returns usable regular moves, or the emergency move once every PP is zero. */
export function getAvailableBattleMoves(
  combatant: BattleCombatant,
): readonly BattleMoveState[] {
  const regularMoves = combatant.moveStates.filter((state) => state.currentPp > 0);
  return regularMoves.length > 0 ? regularMoves : [combatant.emergencyMoveState];
}

function activeState(
  state: BattleState,
  phase: ActiveBattlePhase,
  turnNumber: number = state.turnNumber,
): BattleState {
  return {
    player: state.player,
    opponent: state.opponent,
    turnNumber,
    phase,
    winner: null,
  };
}

function terminalState(
  state: BattleState,
  winner: BattleSide,
): BattleState {
  return winner === "player"
    ? { ...state, phase: "won", winner: "player" }
    : { ...state, phase: "lost", winner: "opponent" };
}

function combatantFor(state: BattleState, side: BattleSide): BattleCombatant {
  return side === "player" ? state.player : state.opponent;
}

function replaceCombatant(
  state: BattleState,
  side: BattleSide,
  combatant: BattleCombatant,
): BattleState {
  return side === "player"
    ? { ...state, player: combatant }
    : { ...state, opponent: combatant };
}

function oppositeSide(side: BattleSide): BattleSide {
  return side === "player" ? "opponent" : "player";
}

function findSelectedMove(
  combatant: BattleCombatant,
  moveId: BattleMoveId,
): BattleMoveState {
  const available = getAvailableBattleMoves(combatant);
  const selected = available.find((state) => state.move.id === moveId);
  if (selected) return selected;

  const knownMove = combatant.moveStates.find((state) => state.move.id === moveId);
  if (knownMove && knownMove.currentPp === 0) {
    throw new BattleActionError(
      "move-out-of-pp",
      `Move '${knownMove.move.name}' has no PP remaining.`,
    );
  }
  throw new BattleActionError("unknown-move", `Move '${String(moveId)}' is not available.`);
}

function consumeMovePp(
  combatant: BattleCombatant,
  selected: BattleMoveState,
): BattleCombatant {
  if (selected.kind === "emergency") return combatant;

  const moveStates = combatant.moveStates.map((state) =>
    state.move.id === selected.move.id
      ? { ...state, currentPp: Math.max(0, state.currentPp - 1) }
      : state,
  ) as RegularBattleMoveStateList;

  return { ...combatant, moveStates };
}

function resolvingPhaseFor(side: BattleSide): ActiveBattlePhase {
  return side === "player" ? "resolving-player" : "resolving-opponent";
}

/** Accuracy uses a [0, 100) roll; rolls strictly below the move's accuracy hit. */
function moveHits(move: BattleMove, randomSource: RandomSource): boolean {
  if (move.accuracy === null) return true;
  return (
    readBattleRandom(randomSource) * ACCURACY_ROLL_SCALE < move.accuracy
  );
}

function resolveAction(
  initialState: BattleState,
  actorSide: BattleSide,
  selectedState: BattleMoveState,
  typeRelations: TypeRelationsByType,
  randomSource: RandomSource,
  events: BattleEvent[],
): BattleState {
  let state = activeState(initialState, resolvingPhaseFor(actorSide));
  const targetSide = oppositeSide(actorSide);
  let actor = combatantFor(state, actorSide);
  let target = combatantFor(state, targetSide);

  // A faster attack can end the battle before the second selected action runs.
  if (actor.currentHp <= 0 || target.currentHp <= 0) return state;

  actor = consumeMovePp(actor, selectedState);
  state = replaceCombatant(state, actorSide, actor);
  const move = selectedState.move;
  events.push({ type: "move-used", actor: actorSide, target: targetSide, move });

  const hit = moveHits(move, randomSource);
  if (!hit) {
    events.push({ type: "miss", actor: actorSide, target: targetSide, move });
    return state;
  }

  target = combatantFor(state, targetSide);
  const effectiveness = getTypeEffectiveness(
    move.type,
    target.definition.types,
    requireTypeRelations(move.type, typeRelations),
    {
      ignoreImmunity:
        move.kind === "emergency" && move.rules.typeImmunity === "ignore",
    },
  );

  if (effectiveness === 0) {
    events.push({
      type: "immune",
      actor: actorSide,
      target: targetSide,
      move,
      effectiveness: 0,
    });
    return state;
  }

  // For each non-immune hit, critical is rolled before random damage variation.
  const isCritical = rollCriticalHit(randomSource);
  const randomFactor = rollDamageRandomFactor(randomSource);
  if (isCritical) {
    events.push({ type: "critical-hit", actor: actorSide, target: targetSide, move });
  }

  if (effectiveness > 1) {
    events.push({
      type: "super-effective",
      actor: actorSide,
      target: targetSide,
      move,
      effectiveness: effectiveness as 2 | 4,
    });
  } else if (effectiveness < 1) {
    events.push({
      type: "not-very-effective",
      actor: actorSide,
      target: targetSide,
      move,
      effectiveness: effectiveness as 0.25 | 0.5,
    });
  }

  const damage = calculateDamage({
    attackerStats: actor.calculatedStats,
    defenderStats: target.calculatedStats,
    attackerTypes: actor.definition.types,
    move,
    level: actor.definition.level,
    effectiveness,
    isCritical,
    randomFactor,
  });
  const nextHp = Math.max(0, target.currentHp - damage);
  const dealt = target.currentHp - nextHp;
  target = { ...target, currentHp: nextHp };
  state = replaceCombatant(state, targetSide, target);

  events.push({
    type: "damage",
    actor: actorSide,
    target: targetSide,
    move,
    amount: dealt,
    remainingHp: nextHp,
  });

  if (nextHp === 0) {
    events.push({
      type: "fainted",
      side: targetSide,
      pokemonId: target.definition.id,
    });
    const winner = actorSide;
    state = terminalState(state, winner);
    events.push({ type: "battle-ended", winner });
  }

  return state;
}

/**
 * Resolves one complete player/CPU turn. RNG draw order: CPU variation (one
 * per available CPU move when there are multiple), speed-tie draw if needed,
 * then per executed action an accuracy draw (unless accuracy is null), followed
 * on a non-immune hit by critical and damage-variation draws, in that order.
 * `typeRelations` must include each regular move type on both combatants and
 * normal, because emergency Struggle may be selected when regular PP is spent.
 */
export function resolveBattleTurn(
  state: BattleState,
  playerMoveId: BattleMoveId,
  typeRelations: TypeRelationsByType,
  randomSource: RandomSource,
): BattleTurnResult {
  if (state.phase === "won" || state.phase === "lost") {
    throw new BattleActionError("battle-already-ended", "The battle has already ended.");
  }
  if (state.phase !== "waiting-player") {
    throw new BattleActionError(
      "battle-not-ready",
      "The battle must be waiting for a player move before resolving a turn.",
    );
  }

  const playerMove = findSelectedMove(state.player, playerMoveId);
  const opponentMove = chooseCpuMove(
    state.opponent,
    state.player,
    typeRelations,
    randomSource,
  );
  const actionOrder = resolveTurnOrder(
    state.player,
    playerMove.move,
    state.opponent,
    opponentMove.move,
    randomSource,
  );

  let nextState = state;
  const events: BattleEvent[] = [];
  const moveBySide: Record<BattleSide, BattleMoveState> = {
    player: playerMove,
    opponent: opponentMove,
  };

  for (const side of actionOrder) {
    if (nextState.winner !== null) break;
    if (combatantFor(nextState, side).currentHp <= 0) break;
    nextState = resolveAction(
      nextState,
      side,
      moveBySide[side],
      typeRelations,
      randomSource,
      events,
    );
  }

  if (nextState.winner === null) {
    nextState = activeState(nextState, "waiting-player", state.turnNumber + 1);
  }

  return { state: nextState, events };
}
