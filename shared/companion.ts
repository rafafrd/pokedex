/** Platform-independent pet rules. No React, network, or storage dependencies. */
export const COMPANION_STORAGE_KEY = "pokedex.companion.v1";
export const BERRIES = [
  {
    id: "oran",
    name: "Oran",
    emoji: "🫐",
    description: "+25 saciedade · +5 alegria",
    fullness: 25,
    happiness: 5,
    energy: 0,
    xp: 8,
  },
  {
    id: "pecha",
    name: "Pecha",
    emoji: "🍑",
    description: "+15 saciedade · +18 alegria",
    fullness: 15,
    happiness: 18,
    energy: 0,
    xp: 10,
  },
  {
    id: "sitrus",
    name: "Sitrus",
    emoji: "🍊",
    description: "+35 saciedade · +12 energia",
    fullness: 35,
    happiness: 8,
    energy: 12,
    xp: 12,
  },
] as const;
export type BerryId = (typeof BERRIES)[number]["id"];
export type CareAction =
  | "pet"
  | "play"
  | "rest"
  | "feed"
  | "walk"
  | "groom"
  | "trick";
export interface CompanionPokemon {
  id: number;
  name: string;
}
export const STARTERS: CompanionPokemon[] = [
  { id: 1, name: "Bulbasaur" },
  { id: 4, name: "Charmander" },
  { id: 7, name: "Squirtle" },
  { id: 25, name: "Pikachu" },
  { id: 133, name: "Eevee" },
  { id: 94, name: "Gengar" },
];
export const BOND_LEVELS = [
  { name: "Primeiros laços", xp: 0 },
  { name: "Amigos", xp: 60 },
  { name: "Grandes amigos", xp: 180 },
  { name: "Inseparáveis", xp: 400 },
  { name: "Melhores amigos", xp: 800 },
] as const;
export const CARE_COOLDOWNS = {
  feed: 10_000,
  pet: 30_000,
  play: 60_000,
  rest: 60_000,
  walk: 120_000,
  groom: 90_000,
  trick: 180_000,
};
export const CARE_OPTIONS = [
  {
    type: "pet",
    label: "Fazer carinho",
    emoji: "💗",
    hint: "+12 alegria · +6 vínculo",
  },
  {
    type: "play",
    label: "Brincar",
    emoji: "🎾",
    hint: "+20 alegria · −15 energia",
  },
  {
    type: "rest",
    label: "Descansar",
    emoji: "🌙",
    hint: "+45 energia em 1 min",
  },
  {
    type: "walk",
    label: "Passear",
    emoji: "🌿",
    hint: "+10 vínculo · encontra 1 fruta",
  },
  {
    type: "groom",
    label: "Escovar",
    emoji: "🪮",
    hint: "+15 alegria · +8 vínculo",
  },
  {
    type: "trick",
    label: "Ensinar truque",
    emoji: "✨",
    hint: "+18 vínculo · a partir do nível 2",
  },
] as const;
export const FORAGE_COOLDOWN = 5 * 60_000;
export const REST_DURATION = 60_000;
export const MAX_COMPANIONS = 12;
const HOUR = 3_600_000;
export interface Companion {
  pokemon: CompanionPokemon;
  nickname: string;
  adoptedAt: number;
  updatedAt: number;
  fullness: number;
  happiness: number;
  energy: number;
  xp: number;
  sleepingUntil: number | null;
  lastActions: Partial<Record<CareAction, number>>;
  meals: number;
  careCount: number;
  history: { at: number; text: string }[];
}
export interface CompanionSave {
  version: 1;
  activeId: number | null;
  companions: Companion[];
  inventory: Record<BerryId, number>;
  lastBasketDay: string | null;
  basketStreak: number;
  lastForageAt: number | null;
}
export type CompanionCommand =
  | { type: "adopt"; pokemon: CompanionPokemon; nickname: string }
  | { type: "select"; id: number }
  | { type: "rename"; nickname: string }
  | { type: "feed"; berry: BerryId }
  | { type: Exclude<CareAction, "feed"> | "basket" | "forage" };

export function emptySave(): CompanionSave {
  return {
    version: 1,
    activeId: null,
    companions: [],
    inventory: { oran: 5, pecha: 3, sitrus: 2 },
    lastBasketDay: null,
    basketStreak: 0,
    lastForageAt: null,
  };
}
export const artworkUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
export const frontSpriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
export const favoriteBerry = (id: number) => BERRIES[id % BERRIES.length];
const clamp = (n: number) => Math.max(0, Math.min(100, n));
export function normalizeNickname(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 20 || /[\u0000-\u001f\u007f]/.test(name))
    throw new Error("Use um apelido de 1 a 20 caracteres.");
  return name;
}
export function localDay(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function countdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
/** Project elapsed time, including the portion spent sleeping while the app was closed. */
export function advanceCompanion(pet: Companion, now: number): Companion {
  const at = Math.max(pet.updatedAt, now);
  const elapsed = at - pet.updatedAt;
  const sleeping =
    pet.sleepingUntil === null
      ? 0
      : Math.max(0, Math.min(at, pet.sleepingUntil) - pet.updatedAt);
  return {
    ...pet,
    updatedAt: at,
    fullness: clamp(pet.fullness - (elapsed / HOUR) * 4),
    happiness: clamp(pet.happiness - (elapsed / HOUR) * 3),
    energy: clamp(
      clamp(pet.energy + (sleeping / REST_DURATION) * 45) -
        ((elapsed - sleeping) / HOUR) * 2,
    ),
    sleepingUntil:
      pet.sleepingUntil !== null && pet.sleepingUntil > at
        ? pet.sleepingUntil
        : null,
  };
}
export function activeCompanion(
  save: CompanionSave,
  now: number,
): Companion | null {
  const pet = save.companions.find((p) => p.pokemon.id === save.activeId);
  return pet ? advanceCompanion(pet, now) : null;
}
export function bondProgress(xp: number) {
  let index = 0;
  for (let i = 1; i < BOND_LEVELS.length; i++)
    if (xp >= BOND_LEVELS[i].xp) index = i;
  const current = BOND_LEVELS[index];
  const next = BOND_LEVELS[index + 1];
  return {
    level: index + 1,
    name: current.name,
    next: next?.name,
    remaining: next ? next.xp - xp : 0,
    percent: next ? ((xp - current.xp) / (next.xp - current.xp)) * 100 : 100,
  };
}
export function trainerProgress(save: CompanionSave) {
  const companions = save.companions.length;
  const care = save.companions.reduce((sum, pet) => sum + pet.careCount, 0);
  const meals = save.companions.reduce((sum, pet) => sum + pet.meals, 0);
  const bestLevel = Math.max(
    0,
    ...save.companions.map((pet) => bondProgress(pet.xp).level),
  );
  return {
    companions,
    care,
    meals,
    badges: [
      {
        emoji: "🌱",
        name: "Primeiro laço",
        description: "Adote seu primeiro companheiro",
        unlocked: companions > 0,
      },
      {
        emoji: "🍓",
        name: "Mesa farta",
        description: "Sirva 10 frutas aos companheiros",
        unlocked: meals >= 10,
      },
      {
        emoji: "💝",
        name: "Sempre por perto",
        description: "Complete 25 cuidados",
        unlocked: care >= 25,
      },
      {
        emoji: "🏅",
        name: "Amizade de ouro",
        description: "Alcance o nível 3 de amizade",
        unlocked: bestLevel >= 3,
      },
    ],
  };
}
export function companionMood(pet: Companion) {
  if (pet.sleepingUntil)
    return {
      emoji: "💤",
      label: "Tirando uma soneca",
      hint: "Um minutinho de descanso recupera até 45 de energia.",
    };
  if (pet.fullness < 30)
    return {
      emoji: "🍓",
      label: "Barriguinha vazia",
      hint: "Uma fruta e um pouco de companhia vão fazer bem.",
    };
  if (pet.energy < 25)
    return {
      emoji: "🌙",
      label: "Precisando descansar",
      hint: "Hora de uma soneca para recuperar a energia.",
    };
  if (pet.happiness < 35)
    return {
      emoji: "💭",
      label: "Com saudade de você",
      hint: "Que tal um carinho ou uma brincadeira?",
    };
  return {
    emoji: "💗",
    label: pet.happiness >= 80 ? "Feliz da vida" : "Curtindo sua companhia",
    hint: "Cada pequeno cuidado aproxima vocês dois.",
  };
}
export function careBlockedReason(
  pet: Companion,
  action: CareAction,
  now: number,
): string | null {
  now = Math.max(now, pet.updatedAt);
  if (pet.sleepingUntil)
    return `Acorda em ${countdown(pet.sleepingUntil - now)}`;
  const last = pet.lastActions[action];
  if (last !== undefined && now - last < CARE_COOLDOWNS[action])
    return `Disponível em ${countdown(CARE_COOLDOWNS[action] - (now - last))}`;
  if (action === "feed" && pet.fullness >= 95) return "Barriguinha cheia";
  if (action === "play" && pet.energy < 15) return "Precisa de 15 de energia";
  if (action === "play" && pet.fullness < 10) return "Dê uma fruta primeiro";
  if (action === "trick" && bondProgress(pet.xp).level < 2)
    return "Desbloqueia no nível 2";
  if ((action === "walk" || action === "trick") && pet.energy < 10)
    return "Precisa de 10 de energia";
  if ((action === "walk" || action === "trick") && pet.fullness < 10)
    return "Dê uma fruta primeiro";
  if (action === "rest" && pet.energy >= 95) return "Já está com energia";
  return null;
}
function log(pet: Companion, now: number, text: string): Companion {
  return { ...pet, history: [{ at: now, text }, ...pet.history].slice(0, 12) };
}
export function applyCommand(
  original: CompanionSave,
  command: CompanionCommand,
  now: number,
): { save: CompanionSave; message: string } {
  let save: CompanionSave = {
    ...original,
    inventory: { ...original.inventory },
    companions: original.companions.map((p) => advanceCompanion(p, now)),
  };
  const done = (message: string) => ({ save, message });
  if (command.type === "adopt") {
    const nickname = normalizeNickname(command.nickname);
    if (
      !Number.isSafeInteger(command.pokemon.id) ||
      command.pokemon.id < 1 ||
      !/^[a-zA-Z0-9 -]{1,60}$/.test(command.pokemon.name)
    )
      throw new Error("Escolha um Pokémon válido na Pokédex.");
    if (save.companions.some((p) => p.pokemon.id === command.pokemon.id))
      throw new Error(
        "Esse Pokémon já está entre seus companheiros. Selecione-o na sua equipe.",
      );
    if (save.companions.length >= MAX_COMPANIONS)
      throw new Error(`Seu espaço já tem ${MAX_COMPANIONS} companheiros.`);
    save = {
      ...save,
      activeId: command.pokemon.id,
      companions: [
        ...save.companions,
        {
          pokemon: { ...command.pokemon },
          nickname,
          adoptedAt: now,
          updatedAt: now,
          fullness: 60,
          happiness: 65,
          energy: 70,
          xp: 0,
          sleepingUntil: null,
          lastActions: {},
          meals: 0,
          careCount: 0,
          history: [{ at: now, text: `${nickname} chegou para ficar!` }],
        },
      ],
    };
    return done(`Boas-vindas, ${nickname}! Sua amizade começa aqui.`);
  }
  if (command.type === "select") {
    if (!save.companions.some((p) => p.pokemon.id === command.id))
      throw new Error("Companheiro não encontrado.");
    save.activeId = command.id;
    return done("Companheiro selecionado. Vamos cuidar dele!");
  }
  let pet = activeCompanion(save, now);
  if (!pet) throw new Error("Escolha seu primeiro companheiro para começar.");
  now = pet.updatedAt;
  if (command.type === "basket") {
    const today = localDay(now);
    if (save.lastBasketDay && save.lastBasketDay >= today)
      throw new Error("A cesta de hoje já foi coletada. Volte amanhã!");
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    save.basketStreak =
      save.lastBasketDay === localDay(yesterday.getTime())
        ? save.basketStreak + 1
        : 1;
    save.lastBasketDay = today;
    save.inventory.oran += 5;
    save.inventory.pecha += 3;
    save.inventory.sitrus += 2;
    return done("Cesta coletada: 5 Oran, 3 Pecha e 2 Sitrus!");
  }
  if (command.type === "forage") {
    if (save.lastForageAt !== null && now - save.lastForageAt < FORAGE_COOLDOWN)
      throw new Error(
        `Novas frutas em ${countdown(FORAGE_COOLDOWN - (now - save.lastForageAt))}.`,
      );
    save.lastForageAt = now;
    save.inventory.oran += 2;
    save.inventory.pecha += 1;
    save.inventory.sitrus += 1;
    return done("Você colheu 2 Oran, 1 Pecha e 1 Sitrus no pomar!");
  }
  let message: string;
  if (command.type === "rename") {
    const nickname = normalizeNickname(command.nickname);
    pet = { ...pet, nickname };
    message = `Agora pode me chamar de ${nickname}!`;
  } else {
    const blocked = careBlockedReason(pet, command.type, now);
    if (blocked) throw new Error(blocked);
    let xp = 0;
    if (command.type === "feed") {
      const berry = BERRIES.find((b) => b.id === command.berry);
      if (!berry || save.inventory[berry.id] < 1)
        throw new Error(
          "Essa fruta acabou. Colete mais no pomar ou na cesta diária.",
        );
      save.inventory[berry.id] -= 1;
      const favorite = favoriteBerry(pet.pokemon.id).id === berry.id;
      xp = berry.xp + (favorite ? 6 : 0);
      pet = {
        ...pet,
        fullness: clamp(pet.fullness + berry.fullness),
        happiness: clamp(pet.happiness + berry.happiness),
        energy: clamp(pet.energy + berry.energy),
        meals: pet.meals + 1,
      };
      message = `${pet.nickname} adorou a ${berry.name}${favorite ? ", sua fruta favorita" : ""}! +${xp} de vínculo.`;
    } else if (command.type === "pet") {
      xp = 6;
      pet = { ...pet, happiness: clamp(pet.happiness + 12) };
      message = `${pet.nickname} se aconchegou em você. +6 de vínculo.`;
    } else if (command.type === "play") {
      xp = 12;
      pet = {
        ...pet,
        happiness: clamp(pet.happiness + 20),
        energy: clamp(pet.energy - 15),
        fullness: clamp(pet.fullness - 8),
      };
      message = `${pet.nickname} se divertiu com você! +12 de vínculo.`;
    } else if (command.type === "walk") {
      xp = 10;
      const berry = favoriteBerry(pet.pokemon.id);
      save.inventory[berry.id] += 1;
      pet = {
        ...pet,
        happiness: clamp(pet.happiness + 12),
        energy: clamp(pet.energy - 10),
        fullness: clamp(pet.fullness - 5),
      };
      message = `${pet.nickname} encontrou uma ${berry.name} no passeio! +10 de vínculo.`;
    } else if (command.type === "groom") {
      xp = 8;
      pet = { ...pet, happiness: clamp(pet.happiness + 15) };
      message = `${pet.nickname} ficou radiante depois da escovação. +8 de vínculo.`;
    } else if (command.type === "trick") {
      xp = 18;
      pet = {
        ...pet,
        happiness: clamp(pet.happiness + 8),
        energy: clamp(pet.energy - 10),
        fullness: clamp(pet.fullness - 4),
      };
      message = `${pet.nickname} aprendeu a dar a patinha! +18 de vínculo.`;
    } else {
      pet = { ...pet, sleepingUntil: now + REST_DURATION };
      message = `${pet.nickname} vai tirar uma soneca de 1 minuto.`;
    }
    const oldLevel = bondProgress(pet.xp).level;
    pet = {
      ...pet,
      xp: pet.xp + xp,
      careCount: pet.careCount + 1,
      lastActions: { ...pet.lastActions, [command.type]: now },
    };
    if (bondProgress(pet.xp).level > oldLevel)
      message += ` Agora vocês são ${bondProgress(pet.xp).name.toLowerCase()}!`;
  }
  pet = log(pet, now, message);
  save.companions = save.companions.map((p) =>
    p.pokemon.id === pet.pokemon.id ? pet : p,
  );
  return done(message);
}

/** Reject unsupported or damaged saves instead of silently discarding the user's pets. */
export function parseSave(raw: string | null): CompanionSave {
  if (raw === null) return emptySave();
  const invalid = () => {
    throw new Error(
      "Não foi possível ler o progresso salvo. Os dados foram preservados. Tente carregar novamente.",
    );
  };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return invalid();
  }
  const record = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const number = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;
  const integer = (v: unknown): v is number =>
    number(v) && Number.isSafeInteger(v);
  const timestamp = (v: unknown): v is number =>
    integer(v) && v <= 8_640_000_000_000_000;
  const day = (v: unknown) =>
    v === null || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v));
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.companions) ||
    value.companions.length > MAX_COMPANIONS ||
    !record(value.inventory) ||
    !BERRIES.every((b) =>
      integer((value.inventory as Record<string, unknown>)[b.id]),
    ) ||
    !day(value.lastBasketDay) ||
    !integer(value.basketStreak) ||
    !(value.lastForageAt === null || timestamp(value.lastForageAt))
  )
    return invalid();
  const ids = new Set<number>();
  for (const pet of value.companions) {
    if (
      !record(pet) ||
      !record(pet.pokemon) ||
      !integer(pet.pokemon.id) ||
      pet.pokemon.id < 1 ||
      ids.has(pet.pokemon.id) ||
      typeof pet.pokemon.name !== "string" ||
      !/^[a-zA-Z0-9 -]{1,60}$/.test(pet.pokemon.name) ||
      typeof pet.nickname !== "string"
    )
      return invalid();
    try {
      if (normalizeNickname(pet.nickname) !== pet.nickname) return invalid();
    } catch {
      return invalid();
    }
    if (
      ![pet.fullness, pet.happiness, pet.energy].every(
        (n) => number(n) && n <= 100,
      ) ||
      ![pet.adoptedAt, pet.updatedAt].every(timestamp) ||
      ![pet.xp, pet.meals, pet.careCount].every(integer) ||
      !(pet.sleepingUntil === null || timestamp(pet.sleepingUntil)) ||
      !record(pet.lastActions) ||
      !Object.entries(pet.lastActions).every(
        ([key, n]) => Object.hasOwn(CARE_COOLDOWNS, key) && timestamp(n),
      ) ||
      !Array.isArray(pet.history) ||
      pet.history.length > 12 ||
      !pet.history.every(
        (entry) =>
          record(entry) &&
          timestamp(entry.at) &&
          typeof entry.text === "string" &&
          entry.text.length <= 500,
      )
    )
      return invalid();
    ids.add(pet.pokemon.id);
  }
  if (
    value.companions.length
      ? !integer(value.activeId) || !ids.has(value.activeId)
      : value.activeId !== null
  )
    return invalid();
  return value as unknown as CompanionSave;
}

export interface CompanionStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  exclusive?: (work: () => Promise<void>) => Promise<void>;
}
export interface CompanionSnapshot {
  save: CompanionSave;
  ready: boolean;
  busy: boolean;
  error: string | null;
  message: string;
}
/** A failed write does not consume fruit or award points. Operations are serialized. */
export class CompanionStore {
  private storage: CompanionStorage;
  private listeners = new Set<() => void>();
  private snapshot: CompanionSnapshot = {
    save: emptySave(),
    ready: false,
    busy: false,
    error: null,
    message: "",
  };
  constructor(storage: CompanionStorage) {
    this.storage = storage;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<CompanionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  hydrate = async () => {
    if (this.snapshot.busy) return;
    this.update({ busy: true, error: null });
    try {
      const save = parseSave(await this.storage.getItem(COMPANION_STORAGE_KEY));
      this.update({ save, ready: true });
    } catch (error) {
      this.update({
        ready: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o companheiro. Tente novamente.",
      });
    } finally {
      this.update({ busy: false });
    }
  };
  execute = async (command: CompanionCommand): Promise<boolean> => {
    if (this.snapshot.busy || !this.snapshot.ready) return false;
    this.update({ busy: true, error: null, message: "" });
    let success = false;
    try {
      const work = async () => {
        const latest = parseSave(
          await this.storage.getItem(COMPANION_STORAGE_KEY),
        );
        const result = applyCommand(latest, command, Date.now());
        await this.storage.setItem(
          COMPANION_STORAGE_KEY,
          JSON.stringify(result.save),
        );
        this.update({ save: result.save, message: result.message });
        success = true;
      };
      if (this.storage.exclusive) await this.storage.exclusive(work);
      else await work();
    } catch (error) {
      this.update({
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar. Tente a ação novamente.",
      });
    } finally {
      this.update({ busy: false });
    }
    return success;
  };
}
