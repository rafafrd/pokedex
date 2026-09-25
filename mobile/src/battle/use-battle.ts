import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TypeRelationsByType } from "./type-effectiveness";
import {
  BattleActionError,
  createBattleState,
  getAvailableBattleMoves,
  resolveBattleTurn,
  startBattle,
} from "./engine";
import type {
  BattleEvent,
  BattleMoveState,
  BattlePokemonDefinition,
  BattleState,
  RandomSource,
} from "./contracts";

export interface UseBattleOptions {
  readonly player: BattlePokemonDefinition;
  readonly opponent: BattlePokemonDefinition;
  readonly typeRelations: TypeRelationsByType;
  readonly randomSource?: RandomSource;
}

interface BattleSession {
  readonly playerDefinition: BattlePokemonDefinition;
  readonly opponentDefinition: BattlePokemonDefinition;
  readonly state: BattleState;
  readonly events: readonly BattleEvent[];
  readonly eventHistory: readonly BattleEvent[];
  readonly actionError: BattleActionError | null;
}

interface BattleRuntime {
  readonly typeRelations: TypeRelationsByType;
  readonly randomSource: RandomSource;
}

export interface UseBattleResult {
  readonly state: BattleState;
  readonly player: BattleState["player"];
  readonly opponent: BattleState["opponent"];
  /** Events from the most recently resolved full turn. */
  readonly events: readonly BattleEvent[];
  /** All domain events produced during this battle, in turn order. */
  readonly eventHistory: readonly BattleEvent[];
  /** Only currently usable moves, as decided by the Engine, with their PP state. */
  readonly availableMoves: readonly BattleMoveState[];
  readonly phase: BattleState["phase"];
  readonly winner: BattleState["winner"];
  readonly isActive: boolean;
  readonly isResolving: boolean;
  readonly canSelectMove: boolean;
  readonly canRematch: boolean;
  readonly actionError: BattleActionError | null;
  readonly selectMove: (move: BattleMoveState) => void;
  readonly rematch: () => void;
}

function createSession(
  playerDefinition: BattlePokemonDefinition,
  opponentDefinition: BattlePokemonDefinition,
): BattleSession {
  const initialState = startBattle(
    createBattleState(playerDefinition, opponentDefinition),
  );
  return {
    playerDefinition,
    opponentDefinition,
    state: initialState,
    events: [],
    eventHistory: [],
    actionError: null,
  };
}

/**
 * These normalized definitions have a fixed, small shape. Compare their
 * fields so a structurally equal query refresh does not erase battle state.
 */
function definitionsMatch(
  left: BattlePokemonDefinition,
  right: BattlePokemonDefinition,
): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.level === right.level &&
    left.types.length === right.types.length &&
    left.types.every((type, index) => type === right.types[index]) &&
    left.baseStats.hp === right.baseStats.hp &&
    left.baseStats.attack === right.baseStats.attack &&
    left.baseStats.defense === right.baseStats.defense &&
    left.baseStats.specialAttack === right.baseStats.specialAttack &&
    left.baseStats.specialDefense === right.baseStats.specialDefense &&
    left.baseStats.speed === right.baseStats.speed &&
    left.sprites.animatedFront === right.sprites.animatedFront &&
    left.sprites.animatedBack === right.sprites.animatedBack &&
    left.sprites.showdownFront === right.sprites.showdownFront &&
    left.sprites.showdownBack === right.sprites.showdownBack &&
    left.sprites.staticFront === right.sprites.staticFront &&
    left.sprites.staticBack === right.sprites.staticBack &&
    left.sprites.officialArtwork === right.sprites.officialArtwork &&
    left.moves.length === right.moves.length &&
    left.moves.every((move, index) => {
      const otherMove = right.moves[index];
      return (
        otherMove !== undefined &&
        move.id === otherMove.id &&
        move.name === otherMove.name &&
        move.type === otherMove.type &&
        move.damageClass === otherMove.damageClass &&
        move.power === otherMove.power &&
        move.accuracy === otherMove.accuracy &&
        move.priority === otherMove.priority &&
        move.maxPp === otherMove.maxPp
      );
    })
  );
}

export function useBattle({
  player,
  opponent,
  typeRelations,
  randomSource,
}: UseBattleOptions): UseBattleResult {
  const runtimeRandom: RandomSource = randomSource ?? Math.random;
  const runtimeRef = useRef<BattleRuntime>({
    typeRelations,
    randomSource: runtimeRandom,
  });
  runtimeRef.current = { typeRelations, randomSource: runtimeRandom };

  const [session, setSession] = useState<BattleSession>(() =>
    createSession(player, opponent),
  );
  const sessionRef = useRef(session);
  const [isResolving, setIsResolving] = useState(false);
  const isResolvingRef = useRef(false);
  const unlockAfterCommitRef = useRef<BattleSession | null>(null);

  if (
    !definitionsMatch(sessionRef.current.playerDefinition, player) ||
    !definitionsMatch(sessionRef.current.opponentDefinition, opponent)
  ) {
    const replacement = createSession(player, opponent);
    sessionRef.current = replacement;
    unlockAfterCommitRef.current = null;
    isResolvingRef.current = false;
    setSession(replacement);
    setIsResolving(false);
  }

  useEffect(() => {
    if (unlockAfterCommitRef.current !== session) return;
    unlockAfterCommitRef.current = null;
    isResolvingRef.current = false;
    setIsResolving(false);
  }, [session]);

  const publishSession = useCallback((nextSession: BattleSession) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  const selectMove = useCallback(
    (move: BattleMoveState): void => {
      const currentSession = sessionRef.current;
      if (
        isResolvingRef.current ||
        currentSession.state.phase !== "waiting-player"
      ) {
        return;
      }

      isResolvingRef.current = true;
      setIsResolving(true);
      let waitingForCommit = false;
      try {
        const turnResult = resolveBattleTurn(
          currentSession.state,
          move.move.id,
          runtimeRef.current.typeRelations,
          runtimeRef.current.randomSource,
        );
        const nextSession: BattleSession = {
          ...currentSession,
          state: turnResult.state,
          events: turnResult.events,
          eventHistory: [...currentSession.eventHistory, ...turnResult.events],
          actionError: null,
        };
        unlockAfterCommitRef.current = nextSession;
        waitingForCommit = true;
        publishSession(nextSession);
      } catch (error) {
        if (error instanceof BattleActionError) {
          const failedSession = { ...currentSession, actionError: error };
          unlockAfterCommitRef.current = failedSession;
          waitingForCommit = true;
          publishSession(failedSession);
          return;
        }
        throw error;
      } finally {
        if (!waitingForCommit) {
          isResolvingRef.current = false;
          setIsResolving(false);
        }
      }
    },
    [publishSession],
  );

  const rematch = useCallback((): void => {
    if (isResolvingRef.current || sessionRef.current.state.winner === null) return;
    const currentSession = sessionRef.current;
    publishSession(
      createSession(
        currentSession.playerDefinition,
        currentSession.opponentDefinition,
      ),
    );
  }, [publishSession]);

  const availableMoves = useMemo(
    () => getAvailableBattleMoves(session.state.player),
    [session.state.player],
  );
  const winner = session.state.winner;

  return {
    state: session.state,
    player: session.state.player,
    opponent: session.state.opponent,
    events: session.events,
    eventHistory: session.eventHistory,
    availableMoves,
    phase: session.state.phase,
    winner,
    isActive: winner === null,
    isResolving,
    canSelectMove:
      !isResolving &&
      session.state.phase === "waiting-player" &&
      winner === null,
    canRematch: winner !== null,
    actionError: session.actionError,
    selectMove,
    rematch,
  };
}
