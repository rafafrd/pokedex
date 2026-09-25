import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultTrainer,
  parseTrainer,
  validateTrainer,
  TrainerStore,
  TRAINER_STORAGE_KEY,
  LEGACY_TRAINER_NAME_KEY,
} from "../shared/trainer.ts";
import {
  applyCommand,
  emptySave,
  trainerProgress,
  activeCompanion,
  favoriteBerry,
} from "../shared/companion.ts";

test("profile migrates the existing mobile name without resetting preferences", () => {
  assert.equal(parseTrainer(null, "  Misty  ").name, "Misty");
  assert.equal(parseTrainer(null).region, "Kanto");
  const current = {
    ...defaultTrainer(),
    name: "Brock",
    avatar: "leaf",
    region: "Hoenn",
    bio: "Cuidando dos amigos.",
  };
  assert.deepEqual(parseTrainer(JSON.stringify(current), "Misty"), current);
});

test("profile rejects invalid names, unknown options and damaged data", () => {
  assert.throws(() => validateTrainer({ ...defaultTrainer(), name: " " }));
  assert.throws(() =>
    validateTrainer({ ...defaultTrainer(), name: "x".repeat(25) }),
  );
  assert.throws(() =>
    validateTrainer({ ...defaultTrainer(), bio: "x".repeat(101) }),
  );
  assert.throws(() =>
    validateTrainer({ ...defaultTrainer(), region: "unknown" }),
  );
  assert.throws(() =>
    validateTrainer({ ...defaultTrainer(), avatar: "unknown" }),
  );
  assert.throws(() => parseTrainer("{broken"));
  assert.throws(() =>
    parseTrainer(JSON.stringify({ ...defaultTrainer(), version: 2 })),
  );
  assert.equal(
    validateTrainer({ ...defaultTrainer(), name: "  Ash  Ketchum " }).name,
    "Ash Ketchum",
  );
});

test("profile changes persist as one transaction and failed writes retain saved identity", async () => {
  const storage = new Map([[LEGACY_TRAINER_NAME_KEY, "Misty"]]);
  let fail = false;
  const store = new TrainerStore({
    getItem: async (key) => storage.get(key) ?? null,
    setItem: async (key, value) => {
      if (fail) throw new Error("Espaço insuficiente");
      storage.set(key, value);
    },
  });
  await store.hydrate();
  assert.equal(store.getSnapshot().profile.name, "Misty");
  const draft = {
    ...defaultTrainer(),
    name: "Serena",
    avatar: "fire",
    region: "Kalos",
    bio: "Uma nova jornada.",
  };
  fail = true;
  assert.equal(await store.save(draft), false);
  assert.equal(store.getSnapshot().profile.name, "Misty");
  assert.equal(storage.has(TRAINER_STORAGE_KEY), false);
  fail = false;
  assert.equal(await store.save(draft), true);
  await store.hydrate();
  assert.deepEqual(store.getSnapshot().profile, draft);
  assert.equal(storage.get(LEGACY_TRAINER_NAME_KEY), "Misty");
});

test("corrupt profiles are preserved and cannot be silently overwritten", async () => {
  let writes = 0;
  const store = new TrainerStore({
    getItem: async () => "null",
    setItem: async () => {
      writes++;
    },
  });
  await store.hydrate();
  assert.equal(store.getSnapshot().ready, false);
  assert.equal(await store.save(defaultTrainer()), false);
  assert.equal(writes, 0);
});

test("trainer counters and badges derive from the saved companions", () => {
  assert.equal(
    trainerProgress(emptySave()).badges.filter((b) => b.unlocked).length,
    0,
  );
  const save = applyCommand(
    emptySave(),
    { type: "adopt", pokemon: { id: 1, name: "bulbasaur" }, nickname: "Broto" },
    1000,
  ).save;
  assert.equal(trainerProgress(save).badges[0].unlocked, true);
  save.companions[0].careCount = 25;
  save.companions[0].meals = 10;
  save.companions[0].xp = 180;
  const stats = trainerProgress(save);
  assert.equal(stats.care, 25);
  assert.equal(stats.meals, 10);
  assert.equal(stats.badges.filter((b) => b.unlocked).length, 4);
});

test("walks reward a fruit, charge energy and cannot be repeated during cooldown", () => {
  const initial = applyCommand(
    emptySave(),
    { type: "adopt", pokemon: { id: 133, name: "eevee" }, nickname: "Sol" },
    1000,
  ).save;
  const walked = applyCommand(initial, { type: "walk" }, 1000).save;
  const pet = activeCompanion(walked, 1000);
  assert.equal(pet.energy, 60);
  assert.equal(pet.fullness, 55);
  assert.equal(pet.xp, 10);
  const berry = favoriteBerry(133).id;
  assert.equal(walked.inventory[berry], initial.inventory[berry] + 1);
  assert.throws(() => applyCommand(walked, { type: "walk" }, 120_999));
  assert.equal(
    applyCommand(walked, { type: "walk" }, 121_000).save.companions[0].xp,
    20,
  );
});

test("grooming improves mood and tricks unlock only at friendship level two", () => {
  const initial = applyCommand(
    emptySave(),
    { type: "adopt", pokemon: { id: 133, name: "eevee" }, nickname: "Sol" },
    1000,
  ).save;
  assert.throws(
    () => applyCommand(initial, { type: "trick" }, 1000),
    /nível 2/,
  );
  const groomed = applyCommand(initial, { type: "groom" }, 1000).save;
  assert.equal(groomed.companions[0].happiness, 80);
  assert.equal(groomed.companions[0].xp, 8);
  assert.throws(() => applyCommand(groomed, { type: "groom" }, 90_999));
  groomed.companions[0].xp = 60;
  const trained = applyCommand(groomed, { type: "trick" }, 1000).save;
  assert.equal(trained.companions[0].xp, 78);
  assert.equal(trained.companions[0].energy, 60);
  const asleep = applyCommand(trained, { type: "rest" }, 1000).save;
  for (const type of ["walk", "groom", "trick"])
    assert.throws(() => applyCommand(asleep, { type }, 2000), /Acorda/);
});
