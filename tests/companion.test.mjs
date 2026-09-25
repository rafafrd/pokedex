import test from "node:test";
import assert from "node:assert/strict";
import {
  activeCompanion,
  advanceCompanion,
  applyCommand,
  BERRIES,
  bondProgress,
  CompanionStore,
  emptySave,
  favoriteBerry,
  FORAGE_COOLDOWN,
  localDay,
  MAX_COMPANIONS,
  normalizeNickname,
  parseSave,
  REST_DURATION,
} from "../shared/companion.ts";

// Relógio fixo deixa cooldown, soneca e virada do dia previsíveis nos testes.
const start = new Date(2026, 8, 25, 12).getTime();
const pokemon = { id: 25, name: "pikachu" };
const adopted = () =>
  applyCommand(
    emptySave(),
    { type: "adopt", pokemon, nickname: "  Pingo  " },
    start,
  ).save;
const act = (save, command, at = start) => applyCommand(save, command, at).save;

test("adoption validates names, preserves species and starts a single shared pantry", () => {
  const save = adopted();
  assert.equal(activeCompanion(save, start).nickname, "Pingo");
  assert.equal(save.inventory.oran, 5);
  assert.throws(() => normalizeNickname("   "));
  assert.throws(() => normalizeNickname("a".repeat(21)));
  assert.equal(normalizeNickname("  Meu   amigo  "), "Meu amigo");
  assert.throws(() => act(save, { type: "adopt", pokemon, nickname: "Outro" }));
  const second = act(save, {
    type: "adopt",
    pokemon: { id: 133, name: "eevee" },
    nickname: "Sol",
  });
  assert.equal(second.companions.length, 2);
  assert.deepEqual(second.inventory, save.inventory);
  assert.equal(
    activeCompanion(act(second, { type: "select", id: 25 }), start).nickname,
    "Pingo",
  );
});

test("feeding consumes exactly one fruit and grants the favourite bonus without mutating input", () => {
  for (const berry of BERRIES) {
    const before = adopted();
    const after = act(before, { type: "feed", berry: berry.id });
    assert.equal(after.inventory[berry.id], before.inventory[berry.id] - 1);
    assert.equal(
      after.companions[0].xp,
      berry.xp + (favoriteBerry(25).id === berry.id ? 6 : 0),
    );
    assert.equal(after.companions[0].meals, 1);
    assert.equal(before.companions[0].meals, 0);
    assert.throws(() =>
      act(after, { type: "feed", berry: berry.id }, start + 9999),
    );
  }
});

test("full belly, empty inventory and insufficient energy block invalid care", () => {
  const full = adopted();
  full.companions[0].fullness = 100;
  assert.throws(() => act(full, { type: "feed", berry: "oran" }), /cheia/);
  const empty = adopted();
  empty.inventory.oran = 0;
  assert.throws(() => act(empty, { type: "feed", berry: "oran" }), /acabou/);
  const tired = adopted();
  tired.companions[0].energy = 14;
  assert.throws(() => act(tired, { type: "play" }), /energia/);
  const hungry = adopted();
  hungry.companions[0].fullness = 9;
  assert.throws(() => act(hungry, { type: "play" }), /fruta primeiro/);
});

test("care cooldowns survive reload; playing has real costs and affection grows", () => {
  let save = act(adopted(), { type: "pet" });
  assert.equal(save.companions[0].happiness, 77);
  save = parseSave(JSON.stringify(save));
  assert.throws(() => act(save, { type: "pet" }, start + 29_999));
  save = act(save, { type: "pet" }, start + 30_000);
  const played = act(save, { type: "play" }, start + 30_000);
  assert.equal(played.companions[0].xp, 24);
  assert.equal(played.companions[0].energy, save.companions[0].energy - 15);
  assert.equal(played.companions[0].fullness, save.companions[0].fullness - 8);
  assert.ok(played.companions[0].happiness <= 100);
});

test("sleep restores energy while closed and only decays after waking", () => {
  const save = adopted();
  save.companions[0].energy = 20;
  const asleep = act(save, { type: "rest" });
  assert.throws(() => act(asleep, { type: "pet" }, start + 10_000), /Acorda/);
  const half = activeCompanion(asleep, start + REST_DURATION / 2);
  assert.equal(half.energy, 42.5);
  assert.equal(activeCompanion(asleep, start + REST_DURATION).energy, 65);
  const later = activeCompanion(asleep, start + REST_DURATION + 3_600_000);
  assert.equal(later.energy, 63);
  assert.equal(later.sleepingUntil, null);
  assert.equal(later.xp, 0);
  const stepped = advanceCompanion(half, start + REST_DURATION);
  const direct = activeCompanion(asleep, start + REST_DURATION);
  for (const stat of ["energy", "fullness", "happiness"])
    assert.ok(Math.abs(stepped[stat] - direct[stat]) < 1e-9);
  assert.equal(stepped.sleepingUntil, direct.sleepingUntil);
});

test("time away is bounded, friendship persists and turning the clock back creates no energy", () => {
  const save = act(adopted(), { type: "pet" });
  const pet = activeCompanion(save, start + 1000 * 3_600_000);
  assert.equal(pet.fullness, 0);
  assert.equal(pet.happiness, 0);
  assert.equal(pet.energy, 0);
  assert.equal(pet.xp, 6);
  assert.deepEqual(advanceCompanion(pet, start - 1000), pet);
});

test("daily basket is once per local calendar day, streak continues then resets", () => {
  const saved = act(adopted(), { type: "basket" });
  assert.equal(saved.inventory.oran, 10);
  assert.equal(saved.basketStreak, 1);
  assert.throws(() => act(saved, { type: "basket" }, start + 1000));
  assert.throws(() => act(saved, { type: "basket" }, start - 86_400_000));
  const tomorrow = new Date(2026, 8, 26, 0, 0, 1).getTime();
  const next = act(
    parseSave(JSON.stringify(saved)),
    { type: "basket" },
    tomorrow,
  );
  assert.equal(next.lastBasketDay, localDay(tomorrow));
  assert.equal(next.basketStreak, 2);
  assert.equal(
    act(next, { type: "basket" }, new Date(2026, 8, 28, 12).getTime())
      .basketStreak,
    1,
  );
});

test("foraging replenishes fruit and cooldown is shared between companions", () => {
  const saved = act(adopted(), { type: "forage" });
  assert.equal(saved.inventory.oran, 7);
  const second = act(saved, {
    type: "adopt",
    pokemon: { id: 1, name: "bulbasaur" },
    nickname: "Broto",
  });
  assert.throws(() =>
    act(second, { type: "forage" }, start + FORAGE_COOLDOWN - 1),
  );
  assert.equal(
    act(second, { type: "forage" }, start + FORAGE_COOLDOWN).inventory.oran,
    9,
  );
});

test("renaming and selecting preserve the individual relationship and history is bounded", () => {
  let save = adopted();
  for (let i = 0; i < 20; i++)
    save = act(save, { type: "pet" }, start + i * 30_000);
  assert.equal(save.companions[0].history.length, 12);
  const previousXp = save.companions[0].xp;
  save = act(save, { type: "rename", nickname: "Faísca" }, start + 600_000);
  assert.equal(save.companions[0].xp, previousXp);
  assert.equal(save.companions[0].nickname, "Faísca");
  assert.equal(bondProgress(59).level, 1);
  assert.equal(bondProgress(60).level, 2);
  assert.equal(bondProgress(800).percent, 100);
  assert.equal(bondProgress(800).remaining, 0);
});

test("save validation rejects corrupted, duplicate and unknown-version data without resetting it", () => {
  assert.deepEqual(parseSave(null), emptySave());
  assert.deepEqual(parseSave(JSON.stringify(adopted())), adopted());
  for (const raw of [
    "",
    "null",
    "{broken",
    '{"version":2}',
    JSON.stringify({ ...adopted(), activeId: 999 }),
    JSON.stringify({
      ...adopted(),
      inventory: { oran: -1, pecha: 2, sitrus: 1 },
    }),
  ])
    assert.throws(() => parseSave(raw));
  const duplicate = adopted();
  duplicate.companions.push(duplicate.companions[0]);
  assert.throws(() => parseSave(JSON.stringify(duplicate)));
  const invalidStat = adopted();
  invalidStat.companions[0].energy = 101;
  assert.throws(() => parseSave(JSON.stringify(invalidStat)));
});

test("collection cap is enforced and switching never refills supplies", () => {
  let save = emptySave();
  for (let i = 1; i <= MAX_COMPANIONS; i++)
    save = act(save, {
      type: "adopt",
      pokemon: { id: i, name: `pokemon-${i}` },
      nickname: `Amigo ${i}`,
    });
  assert.deepEqual(save.inventory, emptySave().inventory);
  assert.throws(() =>
    act(save, {
      type: "adopt",
      pokemon: { id: 200, name: "extra" },
      nickname: "Extra",
    }),
  );
});

test("store retains state on write failure and permits retry without double consumption", async () => {
  let raw = JSON.stringify(adopted());
  let fail = true;
  const store = new CompanionStore({
    getItem: async () => raw,
    setItem: async (_key, value) => {
      if (fail) throw new Error("Disco cheio");
      raw = value;
    },
  });
  await store.hydrate();
  assert.equal(await store.execute({ type: "feed", berry: "oran" }), false);
  assert.equal(store.getSnapshot().save.inventory.oran, 5);
  assert.equal(store.getSnapshot().error, "Disco cheio");
  fail = false;
  assert.equal(await store.execute({ type: "feed", berry: "oran" }), true);
  assert.equal(store.getSnapshot().save.inventory.oran, 4);
  assert.equal(parseSave(raw).inventory.oran, 4);
});

test("rapid concurrent actions produce only one transaction", async () => {
  let raw = JSON.stringify(adopted());
  let writes = 0;
  const store = new CompanionStore({
    getItem: async () => raw,
    setItem: async (_key, value) => {
      writes++;
      raw = value;
    },
  });
  await store.hydrate();
  const results = await Promise.all([
    store.execute({ type: "basket" }),
    store.execute({ type: "basket" }),
  ]);
  assert.deepEqual(results, [true, false]);
  assert.equal(writes, 1);
});

test("loading errors block adoption until recovery and preserve the original saved data", async () => {
  let raw = "{broken";
  let writes = 0;
  const store = new CompanionStore({
    getItem: async () => raw,
    setItem: async () => {
      writes++;
    },
  });
  await store.hydrate();
  assert.equal(store.getSnapshot().ready, false);
  assert.equal(
    await store.execute({ type: "adopt", pokemon, nickname: "Pingo" }),
    false,
  );
  assert.equal(writes, 0);
  assert.equal(raw, "{broken");
  raw = JSON.stringify(adopted());
  await store.hydrate();
  assert.equal(store.getSnapshot().ready, true);
});
