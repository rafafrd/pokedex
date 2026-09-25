/** A normalized Pokémon type used by the Battle domain. */
export type BattleType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

/** The only damage classes supported by the MVP's direct-damage engine. */
export type BattleDamageClass = "physical" | "special";

/** A Pokémon's immutable battle stats, with no current-HP runtime value. */
export interface BattleStats {
  readonly hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly specialAttack: number;
  readonly specialDefense: number;
  readonly speed: number;
}

export type BattleTypeList =
  | readonly [BattleType]
  | readonly [BattleType, BattleType];

/** URLs are candidates only; choosing a fallback is a presentation concern. */
export interface BattleSpriteSet {
  readonly animatedFront: string | null;
  readonly animatedBack: string | null;
  readonly showdownFront: string | null;
  readonly showdownBack: string | null;
  readonly staticFront: string | null;
  readonly staticBack: string | null;
  readonly officialArtwork: string | null;
}

export type BattleMoveId = number | string;

interface BattleMoveFields {
  /** Stable normalized identity, independent of the display name. */
  readonly id: BattleMoveId;
  readonly name: string;
  readonly type: BattleType;
  readonly damageClass: BattleDamageClass;
  /** MVP moves have positive direct-damage power. */
  readonly power: number;
  /** Null means the move does not fail an accuracy check in this MVP. */
  readonly accuracy: number | null;
  readonly priority: number;
}

/** A regular move has PP and is expected to satisfy the MVP move filter. */
export interface RegularBattleMove extends BattleMoveFields {
  readonly kind: "regular";
  readonly maxPp: number;
  /** Special emergency rules cannot be attached to a regular move. */
  readonly rules?: never;
}

/** Rules carried by the emergency move rather than inferred from its name. */
export interface EmergencyMoveRules {
  readonly availability: "when-all-regular-pp-is-zero";
  readonly pp: "none";
  readonly recoil: "none";
  readonly stab: "ignore";
  readonly typeImmunity: "ignore";
}

/**
 * An emergency move has no maxPp field. Its exceptional MVP rules are data,
 * while its "emergency" discriminant provides a stable semantic identity.
 */
export interface EmergencyBattleMove extends BattleMoveFields {
  readonly kind: "emergency";
  /** Emergency moves have no PP capacity. */
  readonly maxPp?: never;
  readonly rules: EmergencyMoveRules;
}

export type BattleMove = RegularBattleMove | EmergencyBattleMove;

/** Tuple unions preserve the required 1..4 regular moves at construction sites. */
export type OneToFour<T> =
  | readonly [T]
  | readonly [T, T]
  | readonly [T, T, T]
  | readonly [T, T, T, T];

export type BattleMoveList = OneToFour<RegularBattleMove>;

export interface RegularBattleMoveState {
  readonly kind: "regular";
  readonly move: RegularBattleMove;
  /** Runtime current PP; producers must keep it between 0 and move.maxPp. */
  readonly currentPp: number;
}

export interface EmergencyBattleMoveState {
  readonly kind: "emergency";
  readonly move: EmergencyBattleMove;
  // Deliberately no currentPp: emergency moves do not consume or store PP.
  readonly currentPp?: never;
}

export type BattleMoveState =
  | RegularBattleMoveState
  | EmergencyBattleMoveState;

export type RegularBattleMoveStateList = OneToFour<RegularBattleMoveState>;

/** Immutable, API-independent inputs used to create a combatant. */
export interface BattlePokemonDefinition {
  readonly id: number;
  readonly name: string;
  readonly level: number;
  readonly types: BattleTypeList;
  readonly baseStats: BattleStats;
  readonly sprites: BattleSpriteSet;
  /** Emergency moves are injected by configuration, not learned moves. */
  readonly moves: BattleMoveList;
}

/** Runtime battle values for one side; current HP is separate from stats. */
export interface BattleCombatant {
  readonly definition: BattlePokemonDefinition;
  readonly calculatedStats: BattleStats;
  readonly maxHp: number;
  readonly currentHp: number;
  /** The 1..4 regular moves and their remaining PP. */
  readonly moveStates: RegularBattleMoveStateList;
  /** Fallback state; the engine exposes it only when every regular move has 0 PP. */
  readonly emergencyMoveState: EmergencyBattleMoveState;
}

export type BattleSide = "player" | "opponent";

export type BattlePhase =
  | "intro"
  | "waiting-player"
  | "resolving-player"
  | "resolving-opponent"
  | "won"
  | "lost";

interface BattleStateFields {
  readonly player: BattleCombatant;
  readonly opponent: BattleCombatant;
  readonly turnNumber: number;
}

/** Active battles have no winner; terminal phases agree with their winner. */
export type BattleState =
  | (BattleStateFields & {
      readonly phase: "intro" | "waiting-player" | "resolving-player" | "resolving-opponent";
      readonly winner: null;
    })
  | (BattleStateFields & {
      readonly phase: "won";
      readonly winner: "player";
    })
  | (BattleStateFields & {
      readonly phase: "lost";
      readonly winner: "opponent";
    });

export type BattleEffectiveness = 0 | 0.25 | 0.5 | 1 | 2 | 4;

interface MoveEventFields {
  readonly actor: BattleSide;
  readonly target: BattleSide;
  readonly move: BattleMove;
}

/** Domain facts consumed by log and presentation layers; no visual state. */
export type BattleEvent =
  | ({ readonly type: "move-used" } & MoveEventFields)
  | ({ readonly type: "miss" } & MoveEventFields)
  | ({ readonly type: "critical-hit" } & MoveEventFields)
  | (MoveEventFields & {
      readonly type: "damage";
      readonly amount: number;
      readonly remainingHp: number;
    })
  | (MoveEventFields & {
      readonly type: "super-effective";
      readonly effectiveness: 2 | 4;
    })
  | (MoveEventFields & {
      readonly type: "not-very-effective";
      readonly effectiveness: 0.25 | 0.5;
    })
  | (MoveEventFields & {
      readonly type: "immune";
      readonly effectiveness: 0;
    })
  | {
      readonly type: "fainted";
      readonly side: BattleSide;
      readonly pokemonId: number;
    }
  | {
      readonly type: "battle-ended";
      readonly winner: BattleSide;
    };

/** Normalized damage relations from one attacking type to defender types. */
export interface TypeRelations {
  readonly attackingType: BattleType;
  readonly doubleDamageTo: readonly BattleType[];
  readonly halfDamageTo: readonly BattleType[];
  readonly noDamageTo: readonly BattleType[];
}

/** Injected random value source; each call must return a value in [0, 1). */
export type RandomSource = () => number;
