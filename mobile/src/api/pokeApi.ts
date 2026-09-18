import type {
  PokeApiAbilitySlot,
  PokeApiListResponse,
  PokeApiNamedResource,
  PokeApiPokemonResponse,
  PokeApiSprites,
  PokeApiStat,
  PokeApiTypeSlot,
} from "../types/pokeapi";
import type {
  PokemonDetail,
  PokemonListPage,
  PokemonSpriteSet,
  PokemonStat,
  PokemonSummary,
} from "../types/pokemon";

export const POKE_API_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
export const DEFAULT_POKEMON_LIMIT = 20;

export type PokeApiErrorCode =
  | "invalid-input"
  | "network"
  | "http"
  | "not-found"
  | "invalid-response";

export interface ListPokemonOptions {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export interface PokeApiErrorOptions {
  code: PokeApiErrorCode;
  endpoint?: string;
  status?: number;
  cause?: unknown;
}

/** A readable, typed error for both transport and PokeAPI response failures. */
export class PokeApiError extends Error {
  readonly code: PokeApiErrorCode;
  readonly endpoint: string | null;
  readonly status: number | null;
  readonly cause: unknown;

  constructor(message: string, options: PokeApiErrorOptions) {
    super(message);
    this.name = "PokeApiError";
    this.code = options.code;
    this.endpoint = options.endpoint ?? null;
    this.status = options.status ?? null;
    this.cause = options.cause;
  }
}

/** Abort errors are intentionally allowed through so callers can ignore them. */
export function isAbortError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return "name" in error && (error as { name?: unknown }).name === "AbortError";
}

function invalidInput(message: string): never {
  throw new PokeApiError(message, { code: "invalid-input" });
}

function invalidResponse(endpoint: string, detail?: unknown): never {
  throw new PokeApiError(
    "A PokéAPI retornou dados em um formato inesperado.",
    { code: "invalid-response", endpoint, cause: detail },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  value: unknown,
  field: string,
  endpoint: string,
  allowEmpty = false,
): string {
  if (typeof value !== "string" || (!allowEmpty && value.trim().length === 0)) {
    return invalidResponse(endpoint, `Campo inválido: ${field}`);
  }
  return value;
}

function readNullableString(
  value: unknown,
  field: string,
  endpoint: string,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  return readString(value, field, endpoint);
}

function readFiniteNumber(
  value: unknown,
  field: string,
  endpoint: string,
  options: { integer?: boolean; minimum?: number } = {},
): number {
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const isInteger = !options.integer || (isNumber && Number.isInteger(value));
  const meetsMinimum =
    options.minimum === undefined || (isNumber && value >= options.minimum);

  if (!isNumber || !isInteger || !meetsMinimum) {
    return invalidResponse(endpoint, `Campo numérico inválido: ${field}`);
  }
  return value;
}

function readArray(value: unknown, field: string, endpoint: string): unknown[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return invalidResponse(endpoint, `Campo inválido: ${field}`);
  return value;
}

async function fetchJson(endpoint: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(endpoint, { signal });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new PokeApiError(
      "Não foi possível acessar a PokéAPI. Verifique sua conexão e tente novamente.",
      { code: "network", endpoint, cause: error },
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new PokeApiError("Pokémon não encontrado na PokéAPI.", {
        code: "not-found",
        endpoint,
        status: response.status,
      });
    }

    throw new PokeApiError(
      `A PokéAPI respondeu com um erro (HTTP ${response.status}).`,
      { code: "http", endpoint, status: response.status },
    );
  }

  try {
    return (await response.json()) as unknown;
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new PokeApiError(
      "A PokéAPI retornou uma resposta inválida. Tente novamente mais tarde.",
      { code: "invalid-response", endpoint, cause: error },
    );
  }
}

function parseNamedResource(
  value: unknown,
  endpoint: string,
  field: string,
  requireUrl = true,
): PokeApiNamedResource {
  if (!isRecord(value)) return invalidResponse(endpoint, `Recurso inválido: ${field}`);
  return {
    name: readString(value.name, `${field}.name`, endpoint),
    url:
      value.url === undefined && !requireUrl
        ? ""
        : readString(value.url, `${field}.url`, endpoint),
  };
}

function parseListResponse(payload: unknown, endpoint: string): PokeApiListResponse {
  if (!isRecord(payload)) return invalidResponse(endpoint);

  const resultValues = readArray(payload.results, "results", endpoint);
  return {
    count: readFiniteNumber(payload.count, "count", endpoint, {
      integer: true,
      minimum: 0,
    }),
    next: readNullableString(payload.next, "next", endpoint),
    previous: readNullableString(payload.previous, "previous", endpoint),
    results: resultValues.map((value, index) =>
      parseNamedResource(value, endpoint, `results[${index}]`),
    ),
  };
}

function parseTypeSlots(value: unknown, endpoint: string): PokeApiTypeSlot[] {
  return readArray(value, "types", endpoint).map((entry, index) => {
    if (!isRecord(entry)) return invalidResponse(endpoint, `Tipo inválido: ${index}`);
    return {
      slot: readFiniteNumber(entry.slot, `types[${index}].slot`, endpoint, {
        integer: true,
        minimum: 1,
      }),
      type: parseNamedResource(entry.type, endpoint, `types[${index}].type`),
    };
  });
}

function parseStats(value: unknown, endpoint: string): PokeApiStat[] {
  return readArray(value, "stats", endpoint).map((entry, index) => {
    if (!isRecord(entry)) return invalidResponse(endpoint, `Estatística inválida: ${index}`);
    return {
      base_stat: readFiniteNumber(
        entry.base_stat,
        `stats[${index}].base_stat`,
        endpoint,
        { minimum: 0 },
      ),
      effort:
        entry.effort === undefined
          ? undefined
          : readFiniteNumber(entry.effort, `stats[${index}].effort`, endpoint, {
              minimum: 0,
            }),
      stat: parseNamedResource(entry.stat, endpoint, `stats[${index}].stat`, false),
    };
  });
}

function parseAbilities(value: unknown, endpoint: string): PokeApiAbilitySlot[] {
  return readArray(value, "abilities", endpoint).map((entry, index) => {
    if (!isRecord(entry)) return invalidResponse(endpoint, `Habilidade inválida: ${index}`);
    return {
      ability: parseNamedResource(
        entry.ability,
        endpoint,
        `abilities[${index}].ability`,
        false,
      ),
      is_hidden:
        entry.is_hidden === undefined
          ? undefined
          : typeof entry.is_hidden === "boolean"
            ? entry.is_hidden
            : invalidResponse(endpoint, `abilities[${index}].is_hidden`),
      slot:
        entry.slot === undefined
          ? undefined
          : readFiniteNumber(entry.slot, `abilities[${index}].slot`, endpoint, {
              integer: true,
              minimum: 1,
            }),
    };
  });
}

function parseSpriteVariant(value: unknown, endpoint: string): {
  front_default: string | null;
  front_shiny?: string | null;
} {
  if (value === undefined || value === null) return { front_default: null };
  if (!isRecord(value)) return invalidResponse(endpoint, "sprite inválido");
  return {
    front_default: readNullableString(value.front_default, "front_default", endpoint),
    front_shiny: readNullableString(value.front_shiny, "front_shiny", endpoint),
  };
}

function parseSprites(value: unknown, endpoint: string): PokeApiSprites {
  if (value === undefined || value === null) return { front_default: null };
  if (!isRecord(value)) return invalidResponse(endpoint, "sprites");

  const other = isRecord(value.other)
    ? {
        showdown:
          value.other.showdown === undefined
            ? undefined
            : parseSpriteVariant(value.other.showdown, endpoint),
        "official-artwork":
          value.other["official-artwork"] === undefined
            ? undefined
            : parseSpriteVariant(value.other["official-artwork"], endpoint),
      }
    : undefined;

  const versions = isRecord(value.versions)
    ? (() => {
        const generationV = isRecord(value.versions?.["generation-v"])
          ? value.versions["generation-v"]
          : undefined;
        const blackWhite = isRecord(generationV?.["black-white"])
          ? generationV["black-white"]
          : undefined;
        return {
          "generation-v": {
            "black-white": {
              animated:
                blackWhite?.animated === undefined
                  ? undefined
                  : parseSpriteVariant(blackWhite.animated, endpoint),
            },
          },
        };
      })()
    : undefined;

  return {
    front_default: readNullableString(value.front_default, "front_default", endpoint),
    front_shiny: readNullableString(value.front_shiny, "front_shiny", endpoint),
    other,
    versions,
  };
}

function parsePokemonResponse(
  payload: unknown,
  endpoint: string,
): PokeApiPokemonResponse {
  if (!isRecord(payload)) return invalidResponse(endpoint);

  return {
    id: readFiniteNumber(payload.id, "id", endpoint, { integer: true, minimum: 1 }),
    name: readString(payload.name, "name", endpoint),
    height: readFiniteNumber(payload.height, "height", endpoint, { minimum: 0 }),
    weight: readFiniteNumber(payload.weight, "weight", endpoint, { minimum: 0 }),
    base_experience:
      payload.base_experience === null || payload.base_experience === undefined
        ? null
        : readFiniteNumber(payload.base_experience, "base_experience", endpoint, {
            minimum: 0,
          }),
    types: parseTypeSlots(payload.types, endpoint),
    stats: parseStats(payload.stats, endpoint),
    abilities: parseAbilities(payload.abilities, endpoint),
    sprites: parseSprites(payload.sprites, endpoint),
  };
}

/** Maps PokeAPI sprite fields, preferring official artwork over the front sprite. */
export function mapPokeApiSprites(sprites: PokeApiSprites): PokemonSpriteSet {
  return {
    animated:
      sprites.versions?.["generation-v"]?.["black-white"]?.animated
        ?.front_default ?? null,
    showdown: sprites.other?.showdown?.front_default ?? null,
    artwork: sprites.other?.["official-artwork"]?.front_default ?? null,
    front: sprites.front_default ?? null,
  };
}

/** Selects the preferred image URL, with the base sprite as a safe fallback. */
export function selectPokemonSprite(sprites: PokemonSpriteSet): string | null {
  return sprites.artwork ?? sprites.front;
}

export function mapPokeApiSummary(raw: PokeApiPokemonResponse): PokemonSummary {
  return {
    id: raw.id,
    name: raw.name,
    sprites: mapPokeApiSprites(raw.sprites),
    types: raw.types
      .slice()
      .sort((left, right) => left.slot - right.slot)
      .map((entry) => entry.type.name),
  };
}

export function mapPokeApiDetail(raw: PokeApiPokemonResponse): PokemonDetail {
  const summary = mapPokeApiSummary(raw);
  const stats: PokemonStat[] = raw.stats.map((entry) => ({
    name: entry.stat.name,
    base: entry.base_stat,
  }));

  return {
    ...summary,
    height: raw.height,
    weight: raw.weight,
    baseExperience: raw.base_experience,
    stats,
    abilities: raw.abilities.map((entry) => entry.ability.name),
  };
}

/**
 * Fetches a paginated list and enriches each resource with its detail payload.
 * The list endpoint itself has no types or sprites, so the detail requests are
 * intentionally parallel and share the caller's cancellation signal.
 */
export async function listPokemon(
  options: ListPokemonOptions = {},
): Promise<PokemonListPage> {
  const limit = options.limit ?? DEFAULT_POKEMON_LIMIT;
  const offset = options.offset ?? 0;

  if (!Number.isInteger(limit) || limit < 1) {
    invalidInput("O limite deve ser um número inteiro maior que zero.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    invalidInput("O deslocamento deve ser um número inteiro igual ou maior que zero.");
  }

  const endpoint = `${POKE_API_BASE_URL}?limit=${limit}&offset=${offset}`;
  const payload = await fetchJson(endpoint, options.signal);
  const response = parseListResponse(payload, endpoint);
  const summaries = await Promise.all(
    response.results.map(async (entry) => {
      const detailPayload = await fetchJson(entry.url, options.signal);
      return mapPokeApiSummary(parsePokemonResponse(detailPayload, entry.url));
    }),
  );

  return {
    count: response.count,
    next: response.next,
    previous: response.previous,
    results: summaries,
  };
}

/** Fetches and maps one Pokémon by its numeric id or case-insensitive name. */
export async function getPokemon(
  idOrName: string | number,
  signal?: AbortSignal,
): Promise<PokemonDetail> {
  const value = typeof idOrName === "number" ? String(idOrName) : idOrName.trim().toLowerCase();

  if (value.length === 0) {
    invalidInput("Informe o id ou nome de um Pokémon.");
  }
  if (typeof idOrName === "number" && (!Number.isInteger(idOrName) || idOrName < 1)) {
    invalidInput("O id do Pokémon deve ser um número inteiro maior que zero.");
  }

  const endpoint = `${POKE_API_BASE_URL}/${encodeURIComponent(value)}`;
  const payload = await fetchJson(endpoint, signal);
  return mapPokeApiDetail(parsePokemonResponse(payload, endpoint));
}

// Short aliases keep imports convenient for callers that use a generic mapper name.
export const mapSprites = mapPokeApiSprites;
export const mapPokemonSummary = mapPokeApiSummary;
export const mapPokemonDetail = mapPokeApiDetail;
