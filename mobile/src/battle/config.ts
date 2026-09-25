import type { EmergencyBattleMove } from "./contracts";

/** Stable rules and defaults shared by all Battle MVP layers. */
export const BATTLE_CONFIG = {
  level: 50,
  iv: 31,
  ev: 0,
  natureMultiplier: 1,
  maxMoves: 4,
  stabMultiplier: 1.5,
  criticalMultiplier: 1.5,
  criticalChance: 1 / 24,
  damageRandomMinimum: 0.85,
  damageRandomMaximum: 1,
  preferredMoveVersionGroup: "scarlet-violet",
  struggle: {
    kind: "emergency",
    id: "struggle",
    name: "Struggle",
    type: "normal",
    damageClass: "physical",
    power: 50,
    accuracy: null,
    priority: 0,
    rules: {
      availability: "when-all-regular-pp-is-zero",
      pp: "none",
      recoil: "none",
      stab: "ignore",
      typeImmunity: "ignore",
    },
  } satisfies EmergencyBattleMove,
} as const;
