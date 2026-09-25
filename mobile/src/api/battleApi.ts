import { BATTLE_CONFIG } from "../battle/config";
import type {
  BattleDamageClass,
  BattleMoveList,
  BattlePokemonDefinition,
  BattleStats,
  BattleType,
  TypeRelations,
} from "../battle/contracts";

export const BATTLE_API_BASE_URL = "https://pokeapi.co/api/v2";

/** At most twelve move-detail requests are made while preparing one Pokémon. */
export const BATTLE_MOVE_DETAIL_CANDIDATE_LIMIT = 12;
const MOVE_DETAIL_CONCURRENCY = 4;
const PREFERRED_GROUP_CANDIDATE_LIMIT = 8;
const FALLBACK_GROUP_CANDIDATE_LIMIT = 4;

/**
 * Stable fallback priority after the configured preferred group. This favors
 * recent main-series learnsets and never depends on PokeAPI array order.
 */
const MOVE_VERSION_GROUP_FALLBACK_ORDER = [
  "sword-shield",
  "brilliant-diamond-shining-pearl",
  "ultra-sun-ultra-moon",
  "sun-moon",
  "omega-ruby-alpha-sapphire",
  "x-y",
  "black-2-white-2",
  "black-white",
  "heartgold-soulsilver",
  "platinum",
  "diamond-pearl",
  "emerald",
  "firered-leafgreen",
  "ruby-sapphire",
  "crystal",
  "gold-silver",
  "red-blue",
] as const;

export type BattleApiErrorCode =
  | "invalid-input"
  | "network"
  | "http"
  | "not-found"
  | "invalid-response"
  | "no-valid-moves";

export interface BattleApiErrorOptions {
  readonly code: BattleApiErrorCode;
  readonly endpoint?: string;
  readonly status?: number;
  readonly cause?: unknown;
}

/** A recoverable, readable error from Battle's isolated PokeAPI adapter. */
export class BattleApiError extends Error {
  readonly code: BattleApiErrorCode;
  readonly endpoint: string | null;
  readonly status: number | null;
  readonly cause: unknown;

  constructor(message: string, options: BattleApiErrorOptions) {
    super(message);
    this.name = "BattleApiError";
    this.code = options.code;
    this.endpoint = options.endpoint ?? null;
    this.status = options.status ?? null;
    this.cause = options.cause;
  }
}

/** Abort remains distinguishable so a query/controller can treat it as cancellation. */
export function isBattleApiAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

const BATTLE_TYPES = new Set<BattleType>([
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidInput(message: string): never {
  throw new BattleApiError(message, { code: "invalid-input" });
}

function invalidResponse(endpoint: string, field?: string): never {
  throw new BattleApiError(
    `A PokéAPI retornou uma resposta inválida${field ? ` (${field})` : ""}.`,
    { code: "invalid-response", endpoint },
  );
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error("A solicitação à PokéAPI foi cancelada.");
  error.name = "AbortError";
  throw error;
}

async function fetchJson(endpoint: string, signal?: AbortSignal): Promise<unknown> {
  throwIfAborted(signal);

  let response: Response;
  try {
    response = await fetch(endpoint, { signal });
  } catch (error) {
    if (isBattleApiAbortError(error) || signal?.aborted) {
      if (isBattleApiAbortError(error)) throw error;
      throwIfAborted(signal);
    }
    throw new BattleApiError(
      "Não foi possível acessar a PokéAPI. Verifique sua conexão e tente novamente.",
      { code: "network", endpoint, cause: error },
    );
  }

  throwIfAborted(signal);
  if (!response.ok) {
    if (response.status === 404) {
      throw new BattleApiError("O Pokémon ou recurso solicitado não foi encontrado.", {
        code: "not-found",
        endpoint,
        status: response.status,
      });
    }
    throw new BattleApiError(
      `A PokéAPI respondeu com um erro (HTTP ${response.status}).`,
      { code: "http", endpoint, status: response.status },
    );
  }

  try {
    const payload: unknown = await response.json();
    throwIfAborted(signal);
    return payload;
  } catch (error) {
    if (isBattleApiAbortError(error) || signal?.aborted) {
      if (isBattleApiAbortError(error)) throw error;
      throwIfAborted(signal);
    }
    throw new BattleApiError(
      "A PokéAPI retornou dados que não puderam ser lidos.",
      { code: "invalid-response", endpoint, cause: error },
    );
  }
}

function readString(value: unknown, endpoint: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return invalidResponse(endpoint, field);
  }
  return value.trim();
}

function readInteger(
  value: unknown,
  endpoint: string,
  field: string,
  minimum = 0,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum
  ) {
    return invalidResponse(endpoint, field);
  }
  return value;
}

function readNullableInteger(
  value: unknown,
  endpoint: string,
  field: string,
): number | null {
  if (value === null || value === undefined) return null;
  return readInteger(value, endpoint, field);
}

function readBattleType(value: unknown, endpoint: string, field: string): BattleType {
  const name = readString(value, endpoint, field);
  if (!BATTLE_TYPES.has(name as BattleType)) {
    return invalidResponse(endpoint, `${field} não é um tipo compatível`);
  }
  return name as BattleType;
}

function readNamedResourceName(
  value: unknown,
  endpoint: string,
  field: string,
): string {
  if (!isRecord(value)) return invalidResponse(endpoint, field);
  return readString(value.name, endpoint, `${field}.name`);
}

function optionalSprite(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : null;
}

function getSprite(record: unknown, key: string): string | null {
  return isRecord(record) ? optionalSprite(record[key]) : null;
}

function mapSprites(value: unknown): BattlePokemonDefinition["sprites"] {
  const sprites = isRecord(value) ? value : undefined;
  const versions = isRecord(sprites?.versions) ? sprites.versions : undefined;
  const generationV = isRecord(versions?.["generation-v"])
    ? versions["generation-v"]
    : undefined;
  const blackWhite = isRecord(generationV?.["black-white"])
    ? generationV["black-white"]
    : undefined;
  const animated = isRecord(blackWhite?.animated) ? blackWhite.animated : undefined;
  const other = isRecord(sprites?.other) ? sprites.other : undefined;
  const showdown = isRecord(other?.showdown) ? other.showdown : undefined;
  const artwork = isRecord(other?.["official-artwork"])
    ? other["official-artwork"]
    : undefined;

  return {
    animatedFront: getSprite(animated, "front_default"),
    animatedBack: getSprite(animated, "back_default"),
    showdownFront: getSprite(showdown, "front_default"),
    showdownBack: getSprite(showdown, "back_default"),
    staticFront: getSprite(sprites, "front_default"),
    staticBack: getSprite(sprites, "back_default"),
    officialArtwork: getSprite(artwork, "front_default"),
  };
}

function parseTypes(value: unknown, endpoint: string): BattlePokemonDefinition["types"] {
  if (!Array.isArray(value)) return invalidResponse(endpoint, "types");
  const entries = value.map((item, index) => {
    if (!isRecord(item)) return invalidResponse(endpoint, `types[${index}]`);
    return {
      slot: readInteger(item.slot, endpoint, `types[${index}].slot`, 1),
      type: readBattleType(
        readNamedResourceName(item.type, endpoint, `types[${index}].type`),
        endpoint,
        `types[${index}].type.name`,
      ),
    };
  });
  entries.sort((left, right) => left.slot - right.slot);

  if (entries.length === 1) return [entries[0].type];
  if (
    entries.length === 2 &&
    entries[0].slot !== entries[1].slot
  ) {
    return [entries[0].type, entries[1].type];
  }
  return invalidResponse(endpoint, "types deve conter um ou dois slots distintos");
}

const STAT_FIELDS = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "specialAttack",
  "special-defense": "specialDefense",
  speed: "speed",
} as const;

function parseBaseStats(value: unknown, endpoint: string): BattleStats {
  if (!Array.isArray(value)) return invalidResponse(endpoint, "stats");
  const stats: Partial<Record<keyof BattleStats, number>> = {};

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) return invalidResponse(endpoint, `stats[${index}]`);
    const statName = readNamedResourceName(item.stat, endpoint, `stats[${index}].stat`);
    if (!Object.prototype.hasOwnProperty.call(STAT_FIELDS, statName)) continue;
    const field = STAT_FIELDS[statName as keyof typeof STAT_FIELDS];
    if (stats[field] !== undefined) {
      return invalidResponse(endpoint, `stat duplicada: ${statName}`);
    }
    stats[field] = readInteger(item.base_stat, endpoint, `stats[${index}].base_stat`);
  }

  if (
    stats.hp === undefined ||
    stats.attack === undefined ||
    stats.defense === undefined ||
    stats.specialAttack === undefined ||
    stats.specialDefense === undefined ||
    stats.speed === undefined
  ) {
    return invalidResponse(endpoint, "stats base incompletas");
  }
  return stats as BattleStats;
}

interface LearnsetDetail {
  readonly versionGroup: string;
  readonly method: string;
  readonly level: number;
  readonly order: number;
}

interface LearnsetMove {
  readonly name: string;
  readonly details: readonly LearnsetDetail[];
}

interface MoveCandidate {
  readonly name: string;
  readonly level: number;
  readonly order: number;
}

function parseLearnset(value: unknown, endpoint: string): LearnsetMove[] {
  if (!Array.isArray(value)) return invalidResponse(endpoint, "moves");
  return value.map((entry, index) => {
    if (!isRecord(entry)) return invalidResponse(endpoint, `moves[${index}]`);
    const name = readNamedResourceName(entry.move, endpoint, `moves[${index}].move`);
    if (!Array.isArray(entry.version_group_details)) {
      return invalidResponse(endpoint, `moves[${index}].version_group_details`);
    }
    const details = entry.version_group_details.map((rawDetail, detailIndex) => {
      if (!isRecord(rawDetail)) {
        return invalidResponse(
          endpoint,
          `moves[${index}].version_group_details[${detailIndex}]`,
        );
      }
      const detailField = `moves[${index}].version_group_details[${detailIndex}]`;
      return {
        versionGroup: readNamedResourceName(
          rawDetail.version_group,
          endpoint,
          `${detailField}.version_group`,
        ),
        method: readNamedResourceName(
          rawDetail.move_learn_method,
          endpoint,
          `${detailField}.move_learn_method`,
        ),
        level: readInteger(
          rawDetail.level_learned_at,
          endpoint,
          `${detailField}.level_learned_at`,
        ),
        order:
          rawDetail.order === null || rawDetail.order === undefined
            ? 0
            : readInteger(rawDetail.order, endpoint, `${detailField}.order`),
      };
    });
    return { name, details };
  });
}

function getEligibleCandidates(
  learnset: readonly LearnsetMove[],
  versionGroup: string,
): MoveCandidate[] {
  const byName = new Map<string, MoveCandidate>();
  for (const move of learnset) {
    for (const detail of move.details) {
      if (
        detail.versionGroup !== versionGroup ||
        detail.method !== "level-up" ||
        detail.level > BATTLE_CONFIG.level
      ) {
        continue;
      }
      const current = byName.get(move.name);
      if (
        !current ||
        detail.level > current.level ||
        (detail.level === current.level && detail.order > current.order)
      ) {
        byName.set(move.name, {
          name: move.name,
          level: detail.level,
          order: detail.order,
        });
      }
    }
  }

  return [...byName.values()].sort(
    (left, right) =>
      right.level - left.level ||
      right.order - left.order ||
      (left.name < right.name ? -1 : left.name > right.name ? 1 : 0),
  );
}

/** Samples the whole stable level/order ranking, including both early and recent moves. */
function sampleCandidatesAcrossLearnset(
  candidates: readonly MoveCandidate[],
  limit: number,
): MoveCandidate[] {
  if (candidates.length <= limit) return [...candidates];
  if (limit <= 1) return [candidates[0]];

  const lastIndex = candidates.length - 1;
  const indexes = new Set<number>();
  for (let slot = 0; slot < limit; slot += 1) {
    indexes.add(Math.round((slot * lastIndex) / (limit - 1)));
  }
  return [...indexes]
    .sort((left, right) => left - right)
    .map((index) => candidates[index]);
}

function getVersionGroupOrder(learnset: readonly LearnsetMove[]): string[] {
  const available = new Set(
    learnset.flatMap((move) => move.details.map((detail) => detail.versionGroup)),
  );
  const preferred = BATTLE_CONFIG.preferredMoveVersionGroup;
  const prioritized = [
    preferred,
    ...MOVE_VERSION_GROUP_FALLBACK_ORDER.filter((group) => group !== preferred),
  ].filter((group, index, groups) => available.has(group) && groups.indexOf(group) === index);
  const prioritizedSet = new Set(prioritized);
  const remaining = [...available]
    .filter((group) => !prioritizedSet.has(group))
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  return [...prioritized, ...remaining];
}

interface ParsedMoveMeta {
  readonly category: string;
  readonly minHits: number | null;
  readonly maxHits: number | null;
  readonly minTurns: number | null;
  readonly maxTurns: number | null;
  readonly drain: number | null;
  readonly healing: number | null;
  readonly criticalRate: number | null;
}

interface ParsedMoveDetail {
  readonly id: number;
  readonly name: string;
  readonly type: BattleType | null;
  readonly damageClass: string;
  readonly power: number | null;
  readonly accuracy: number | null;
  readonly pp: number | null;
  readonly priority: number | null;
  readonly target: string;
  readonly meta: ParsedMoveMeta | null;
  readonly effectText: string;
}

function parseMoveMeta(value: unknown, endpoint: string): ParsedMoveMeta | null {
  if (!isRecord(value)) return null;
  const category = isRecord(value.category)
    ? readString(value.category.name, endpoint, "meta.category.name")
    : "";
  if (!category) return null;

  const readMetaValue = (field: string): number | null => {
    const raw = value[field];
    if (raw === undefined || raw === null) return null;
    if (typeof raw !== "number" || !Number.isFinite(raw)) {
      return invalidResponse(endpoint, `meta.${field}`);
    }
    return raw;
  };

  return {
    category,
    minHits: readNullableInteger(value.min_hits, endpoint, "meta.min_hits"),
    maxHits: readNullableInteger(value.max_hits, endpoint, "meta.max_hits"),
    minTurns: readNullableInteger(value.min_turns, endpoint, "meta.min_turns"),
    maxTurns: readNullableInteger(value.max_turns, endpoint, "meta.max_turns"),
    drain: readMetaValue("drain"),
    healing: readMetaValue("healing"),
    criticalRate: readNullableInteger(value.crit_rate, endpoint, "meta.crit_rate"),
  };
}

function readEffectText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .filter((entry) => isRecord(entry.language) && entry.language.name === "en")
    .flatMap((entry) => [entry.short_effect, entry.effect])
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
}

function parseMoveDetail(payload: unknown, endpoint: string): ParsedMoveDetail {
  if (!isRecord(payload)) return invalidResponse(endpoint);
  const damageClass = readNamedResourceName(payload.damage_class, endpoint, "damage_class");
  const rawType = readNamedResourceName(payload.type, endpoint, "type");
  const power =
    payload.power === null || payload.power === undefined
      ? null
      : readInteger(payload.power, endpoint, "power");
  const accuracy =
    payload.accuracy === null || payload.accuracy === undefined
      ? null
      : readInteger(payload.accuracy, endpoint, "accuracy");
  const pp =
    payload.pp === null || payload.pp === undefined
      ? null
      : readInteger(payload.pp, endpoint, "pp");
  const priority =
    payload.priority === null || payload.priority === undefined
      ? null
      : readInteger(payload.priority, endpoint, "priority", -8);
  if (priority !== null && priority > 8) return invalidResponse(endpoint, "priority");

  return {
    id: readInteger(payload.id, endpoint, "id", 1),
    name: readString(payload.name, endpoint, "name"),
    type: BATTLE_TYPES.has(rawType as BattleType) ? (rawType as BattleType) : null,
    damageClass,
    power,
    accuracy,
    pp,
    priority,
    target: readNamedResourceName(payload.target, endpoint, "target"),
    meta: parseMoveMeta(payload.meta, endpoint),
    effectText: readEffectText(payload.effect_entries),
  };
}

/**
 * PokeAPI's meta category and hit/turn fields cover many special formulas.
 * These remaining names cover edge cases whose metadata/effect text is
 * incomplete or ambiguous; general HP, weight, stat, and conditional checks
 * below handle the rest without maintaining a catalog of every special move.
 */
const UNSUPPORTED_MOVE_NAMES = new Set([
  "counter",
  "mirror-coat",
  "metal-burst",
  "seismic-toss",
  "night-shade",
  "dragon-rage",
  "sonic-boom",
  "psywave",
  "super-fang",
  "natures-madness",
  "ruination",
  "magnitude",
  "present",
  "trump-card",
  "beat-up",
  "self-destruct",
  "explosion",
  "misty-explosion",
  "jump-kick",
  "high-jump-kick",
  "axe-kick",
  "frost-breath",
  "storm-throw",
  "surging-strikes",
  "wicked-blow",
  "flower-trick",
]);

const OPPONENT_TARGETS = new Set([
  "selected-pokemon",
  "random-opponent",
  "all-opponents",
  "all-other-pokemon",
]);

function hasUnsupportedEffect(move: ParsedMoveDetail): boolean {
  if (UNSUPPORTED_MOVE_NAMES.has(move.name)) return true;
  if (move.effectText.trim().length === 0) return true;
  if (!move.meta || move.meta.category !== "damage") return true;
  if (
    move.meta.minHits !== null ||
    move.meta.maxHits !== null ||
    move.meta.minTurns !== null ||
    move.meta.maxTurns !== null ||
    move.meta.drain === null ||
    move.meta.drain !== 0 ||
    move.meta.healing === null ||
    move.meta.healing !== 0 ||
    move.meta.criticalRate === null ||
    move.meta.criticalRate > 0
  ) {
    return true;
  }

  return (
    /one[- ]hit knockout|knocks? (?:the )?target out in one hit/.test(move.effectText) ||
    /always (?:results? in|lands?|is) (?:a )?critical hit|critical hit (?:is )?guaranteed|always critical hit/.test(
      move.effectText,
    ) ||
    /(?:fixed|exactly) damage|damage (?:is )?(?:equal to|based on|depends on)/.test(
      move.effectText,
    ) ||
    /(?:current|remaining|maximum|max(?:imum)?) hp|user['’]s level|target['’]s level|weight of/.test(
      move.effectText,
    ) ||
    /(?:power|damage|type).{0,80}(?:double[ds]?|tripl(?:e|es|ed)|var(?:y|ies|ied)|depend|based on|increas|chang|boost|rais|determin|scal)/.test(
      move.effectText,
    ) ||
    /(?:friendship|happiness|affection).{0,80}(?:power|damage)|(?:power|damage).{0,80}(?:friendship|happiness|affection)|uses?.{0,80}(?:target['’]s? )?(?:attack|defense|stat).{0,40}(?:instead|calculate|damage)/.test(
      move.effectText,
    ) ||
    /(?:depends on|varies with|changes with|based on|increases with|doubles? if|fails (?:if|unless)|does nothing if|only works if).{0,80}(?:hp|health|weight|level|speed|stat|item|weather|terrain|status|turn|move|switch|attack|berry|party|trainer|priority)/.test(
      move.effectText,
    ) ||
    /recharge|cannot (?:move|attack|act) (?:(?:in|on) )?(?:the )?(?:next|following) turn|user.{0,80}faints?|faints?.{0,80}user|if.{0,80}miss.{0,100}(?:damage|hp)|user.{0,80}(?:crash|damage).{0,60}miss/.test(
      move.effectText,
    ) ||
    /charges? (?:for|during|on).{0,40}(?:turn|first|next|second)|(?:first|second|next) turn.{0,50}(?:charges?|attacks?)/.test(
      move.effectText,
    )
  );
}

function mapRegularMove(move: ParsedMoveDetail): BattleMoveList[number] | null {
  if (
    (move.damageClass !== "physical" && move.damageClass !== "special") ||
    move.type === null ||
    move.power === null ||
    move.power <= 0 ||
    move.pp === null ||
    move.pp <= 0 ||
    move.priority === null ||
    (move.accuracy !== null && (move.accuracy <= 0 || move.accuracy > 100)) ||
    !OPPONENT_TARGETS.has(move.target) ||
    hasUnsupportedEffect(move)
  ) {
    return null;
  }

  const damageClass: BattleDamageClass = move.damageClass;
  return {
    id: move.id,
    name: move.name,
    type: move.type,
    damageClass,
    power: move.power,
    accuracy: move.accuracy,
    priority: move.priority,
    kind: "regular",
    maxPp: move.pp,
  };
}

function normalizeInput(idOrName: string | number): string {
  if (typeof idOrName === "number") {
    if (!Number.isInteger(idOrName) || idOrName < 1) {
      return invalidInput("O id do Pokémon deve ser um inteiro maior que zero.");
    }
    return String(idOrName);
  }
  if (typeof idOrName !== "string" || idOrName.trim().length === 0) {
    return invalidInput("Informe o id ou nome de um Pokémon.");
  }
  return idOrName.trim().toLowerCase();
}

async function getMoveDetail(
  candidate: MoveCandidate,
  signal?: AbortSignal,
): Promise<ParsedMoveDetail> {
  const endpoint = `${BATTLE_API_BASE_URL}/move/${encodeURIComponent(candidate.name)}`;
  return parseMoveDetail(await fetchJson(endpoint, signal), endpoint);
}

async function selectMoves(
  learnset: readonly LearnsetMove[],
  pokemonEndpoint: string,
  signal?: AbortSignal,
): Promise<BattleMoveList> {
  const selected: BattleMoveList[number][] = [];
  const requestedNames = new Set<string>();
  let detailedCandidates = 0;
  const versionGroups = getVersionGroupOrder(learnset);
  const candidateGroups = versionGroups.map((versionGroup) => ({
    versionGroup,
    candidates: getEligibleCandidates(learnset, versionGroup),
  }));
  const preferredNames = new Set(
    candidateGroups
      .find((group) => group.versionGroup === BATTLE_CONFIG.preferredMoveVersionGroup)
      ?.candidates.map((candidate) => candidate.name) ?? [],
  );
  const hasDistinctFallbackCandidate = candidateGroups.some(
    (group) =>
      group.versionGroup !== BATTLE_CONFIG.preferredMoveVersionGroup &&
      group.candidates.some((candidate) => !preferredNames.has(candidate.name)),
  );

  for (const { versionGroup, candidates: eligibleCandidates } of candidateGroups) {
    if (
      selected.length >= BATTLE_CONFIG.maxMoves ||
      detailedCandidates >= BATTLE_MOVE_DETAIL_CANDIDATE_LIMIT
    ) {
      break;
    }
    throwIfAborted(signal);

    const isPreferred = versionGroup === BATTLE_CONFIG.preferredMoveVersionGroup;
    const groupLimit = isPreferred
      ? hasDistinctFallbackCandidate
        ? PREFERRED_GROUP_CANDIDATE_LIMIT
        : BATTLE_MOVE_DETAIL_CANDIDATE_LIMIT
      : FALLBACK_GROUP_CANDIDATE_LIMIT;
    const unrequestedCandidates = eligibleCandidates.filter(
      (candidate) => !requestedNames.has(candidate.name),
    );
    const candidates = sampleCandidatesAcrossLearnset(
      unrequestedCandidates,
      Math.min(groupLimit, BATTLE_MOVE_DETAIL_CANDIDATE_LIMIT - detailedCandidates),
    );

    for (let offset = 0; offset < candidates.length; offset += MOVE_DETAIL_CONCURRENCY) {
      if (
        selected.length >= BATTLE_CONFIG.maxMoves ||
        detailedCandidates >= BATTLE_MOVE_DETAIL_CANDIDATE_LIMIT
      ) {
        break;
      }
      throwIfAborted(signal);

      const batch = candidates
        .slice(offset, offset + MOVE_DETAIL_CONCURRENCY)
        .slice(0, BATTLE_MOVE_DETAIL_CANDIDATE_LIMIT - detailedCandidates);
      for (const candidate of batch) requestedNames.add(candidate.name);
      detailedCandidates += batch.length;

      const details = await Promise.all(
        batch.map((candidate) => getMoveDetail(candidate, signal)),
      );
      for (const detail of details) {
        const move = mapRegularMove(detail);
        if (move && !selected.some((existing) => existing.id === move.id)) {
          selected.push(move);
          if (selected.length >= BATTLE_CONFIG.maxMoves) break;
        }
      }
    }
  }

  if (selected.length === 0) {
    throw new BattleApiError(
      "Não foi possível preparar a batalha: nenhum golpe compatível foi encontrado.",
      { code: "no-valid-moves", endpoint: pokemonEndpoint },
    );
  }
  switch (selected.length) {
    case 1:
      return [selected[0]];
    case 2:
      return [selected[0], selected[1]];
    case 3:
      return [selected[0], selected[1], selected[2]];
    case 4:
      return [selected[0], selected[1], selected[2], selected[3]];
    default:
      throw new BattleApiError("A seleção interna de golpes ficou inconsistente.", {
        code: "invalid-response",
      });
  }
}

/** Fetches and normalizes a battle-ready Pokémon, including at most four valid level-up moves. */
export async function getBattlePokemon(
  idOrName: string | number,
  signal?: AbortSignal,
): Promise<BattlePokemonDefinition> {
  const identifier = normalizeInput(idOrName);
  const endpoint = `${BATTLE_API_BASE_URL}/pokemon/${encodeURIComponent(identifier)}`;
  const payload = await fetchJson(endpoint, signal);
  if (!isRecord(payload)) return invalidResponse(endpoint);

  const id = readInteger(payload.id, endpoint, "id", 1);
  const name = readString(payload.name, endpoint, "name");
  const types = parseTypes(payload.types, endpoint);
  const baseStats = parseBaseStats(payload.stats, endpoint);
  const learnset = parseLearnset(payload.moves, endpoint);
  const moves = await selectMoves(learnset, endpoint, signal);

  return {
    id,
    name,
    level: BATTLE_CONFIG.level,
    types,
    baseStats,
    sprites: mapSprites(payload.sprites),
    moves,
  };
}

function parseRelationTypes(
  value: unknown,
  endpoint: string,
  field: string,
): BattleType[] {
  if (!Array.isArray(value)) return invalidResponse(endpoint, field);
  const types: BattleType[] = [];
  for (const [index, entry] of value.entries()) {
    const name = readNamedResourceName(entry, endpoint, `${field}[${index}]`);
    if (BATTLE_TYPES.has(name as BattleType)) types.push(name as BattleType);
  }
  return types;
}

/** Returns attacking-type relations from that type's perspective. */
export async function getTypeRelations(
  type: BattleType,
  signal?: AbortSignal,
): Promise<TypeRelations> {
  if (!BATTLE_TYPES.has(type)) return invalidInput("O tipo informado não é compatível.");
  const endpoint = `${BATTLE_API_BASE_URL}/type/${encodeURIComponent(type)}`;
  const payload = await fetchJson(endpoint, signal);
  if (!isRecord(payload) || !isRecord(payload.damage_relations)) {
    return invalidResponse(endpoint, "damage_relations");
  }
  const relations = payload.damage_relations;

  return {
    attackingType: type,
    doubleDamageTo: parseRelationTypes(
      relations.double_damage_to,
      endpoint,
      "damage_relations.double_damage_to",
    ),
    halfDamageTo: parseRelationTypes(
      relations.half_damage_to,
      endpoint,
      "damage_relations.half_damage_to",
    ),
    noDamageTo: parseRelationTypes(
      relations.no_damage_to,
      endpoint,
      "damage_relations.no_damage_to",
    ),
  };
}
