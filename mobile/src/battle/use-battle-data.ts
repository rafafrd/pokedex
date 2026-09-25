import { useQueries, useQuery } from "@tanstack/react-query";

import { getBattlePokemon, getTypeRelations, isBattleApiAbortError } from "../api/battleApi";
import { BATTLE_CONFIG } from "./config";
import type { BattlePokemonDefinition, BattleType, TypeRelations } from "./contracts";
import type { TypeRelationsByType } from "./type-effectiveness";

export type BattlePokemonIdentifier = string | number;

export interface BattleDataResult {
  readonly player: BattlePokemonDefinition | null;
  readonly opponent: BattlePokemonDefinition | null;
  readonly typeRelations: TypeRelationsByType;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isReady: boolean;
  readonly error: Error | null;
  readonly retry: () => Promise<void>;
}

function normalizeIdentifier(identifier: BattlePokemonIdentifier): string {
  return String(identifier).trim().toLowerCase();
}

function getQueryError(error: Error | null): Error | null {
  return error && !isBattleApiAbortError(error) ? error : null;
}

function hasRelationForType(
  type: BattleType,
  relations: TypeRelationsByType,
): boolean {
  const relation = relations[type];
  return relation !== undefined && relation.attackingType === type;
}

export function useBattleData(
  playerIdentifier: BattlePokemonIdentifier,
  opponentIdentifier: BattlePokemonIdentifier,
): BattleDataResult {
  const playerQuery = useQuery({
    queryKey: ["battle", "pokemon", normalizeIdentifier(playerIdentifier)],
    queryFn: ({ signal }) => getBattlePokemon(playerIdentifier, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const opponentQuery = useQuery({
    queryKey: ["battle", "pokemon", normalizeIdentifier(opponentIdentifier)],
    queryFn: ({ signal }) => getBattlePokemon(opponentIdentifier, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const player = playerQuery.data ?? null;
  const opponent = opponentQuery.data ?? null;
  const attackTypes = new Set<BattleType>();
  if (player && opponent) {
    for (const move of player.moves) attackTypes.add(move.type);
    for (const move of opponent.moves) attackTypes.add(move.type);
    attackTypes.add(BATTLE_CONFIG.struggle.type);
  }
  const requiredTypes = [...attackTypes];

  const relationQueries = useQueries({
    queries: requiredTypes.map((type) => ({
      queryKey: ["battle", "type", type],
      queryFn: ({ signal }) => getTypeRelations(type, signal),
      staleTime: Number.POSITIVE_INFINITY,
    })),
  });

  const mutableRelations: Partial<Record<BattleType, TypeRelations>> = {};
  for (const [index, query] of relationQueries.entries()) {
    const requestedType = requiredTypes[index];
    const relation = query.data;
    if (
      requestedType !== undefined &&
      relation !== undefined &&
      relation.attackingType === requestedType
    ) {
      mutableRelations[requestedType] = relation;
    }
  }
  const typeRelations: TypeRelationsByType = mutableRelations;

  const error =
    getQueryError(playerQuery.error) ??
    getQueryError(opponentQuery.error) ??
    relationQueries
      .map((query) => getQueryError(query.error))
      .find((queryError) => queryError !== null) ??
    null;
  const isLoading =
    playerQuery.isLoading ||
    opponentQuery.isLoading ||
    relationQueries.some((query) => query.isLoading);
  const hasAllRelations =
    requiredTypes.length > 0 &&
    requiredTypes.every((type) => hasRelationForType(type, typeRelations));
  const isReady =
    player !== null &&
    opponent !== null &&
    hasAllRelations &&
    error === null;

  const retry = async (): Promise<void> => {
    const pendingRefetches: Promise<unknown>[] = [];
    const pokemonRefetches = new Map<string, () => Promise<unknown>>();
    if (playerQuery.isError || !playerQuery.data) {
      pokemonRefetches.set(normalizeIdentifier(playerIdentifier), () =>
        playerQuery.refetch(),
      );
    }
    if (opponentQuery.isError || !opponentQuery.data) {
      pokemonRefetches.set(normalizeIdentifier(opponentIdentifier), () =>
        opponentQuery.refetch(),
      );
    }
    for (const refetch of pokemonRefetches.values()) {
      pendingRefetches.push(refetch());
    }
    for (const query of relationQueries) {
      if (query.isError || !query.data) pendingRefetches.push(query.refetch());
    }
    await Promise.all(pendingRefetches);
  };

  return {
    player,
    opponent,
    typeRelations,
    isLoading,
    isError: error !== null,
    isReady,
    error,
    retry,
  };
}
