export const TRAINER_STORAGE_KEY = "pokedex.trainer.v1";
// Mantemos a chave antiga só p/ recuperar o nome de quem já usava o mobile.
export const LEGACY_TRAINER_NAME_KEY = "pokedex.preferences.userName";
export const TRAINER_AVATARS = [
  { id: "cap", emoji: "🧢", label: "Treinador" },
  { id: "backpack", emoji: "🎒", label: "Explorador" },
  { id: "leaf", emoji: "🌿", label: "Natureza" },
  { id: "bolt", emoji: "⚡", label: "Elétrico" },
  { id: "moon", emoji: "🌙", label: "Noturno" },
  { id: "fire", emoji: "🔥", label: "Chama" },
] as const;
export const TRAINER_REGIONS = [
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar",
  "Paldea",
] as const;
export interface TrainerProfile {
  version: 1;
  name: string;
  avatar: (typeof TRAINER_AVATARS)[number]["id"];
  region: (typeof TRAINER_REGIONS)[number];
  bio: string;
}
export const defaultTrainer = (): TrainerProfile => ({
  version: 1,
  name: "Treinador",
  avatar: "cap",
  region: "Kanto",
  bio: "Toda grande amizade começa com um pequeno cuidado.",
});
export const trainerAvatar = (profile: TrainerProfile) =>
  TRAINER_AVATARS.find((a) => a.id === profile.avatar)!;
export function validateTrainer(value: unknown): TrainerProfile {
  // A tela pode mandar um rascunho; aqui garantimos limites e opções válidas.
  if (!value || typeof value !== "object")
    throw new Error("Perfil inválido. Seus dados foram preservados.");
  const profile = value as Partial<TrainerProfile>;
  if (
    profile.version !== 1 ||
    typeof profile.name !== "string" ||
    typeof profile.bio !== "string" ||
    !TRAINER_AVATARS.some((a) => a.id === profile.avatar) ||
    !TRAINER_REGIONS.some((r) => r === profile.region)
  )
    throw new Error(
      "Não foi possível ler o perfil. Seus dados foram preservados.",
    );
  const name = profile.name.trim().replace(/\s+/g, " ");
  const bio = profile.bio.trim();
  if (!name || name.length > 24)
    throw new Error("Use um nome de treinador de 1 a 24 caracteres.");
  if (bio.length > 100)
    throw new Error("A apresentação pode ter até 100 caracteres.");
  if (/[\u0000-\u001f\u007f]/.test(name + bio))
    throw new Error("Use apenas texto no nome e na apresentação.");
  return {
    version: 1,
    name,
    bio,
    avatar: profile.avatar!,
    region: profile.region!,
  };
}
export function parseTrainer(
  raw: string | null,
  legacyName: string | null = null,
): TrainerProfile {
  // Sem perfil v1, aproveitamos o nome antigo. JSON inválido não é zerado em silêncio.
  if (raw === null)
    return {
      ...defaultTrainer(),
      name: legacyName?.trim().slice(0, 24) || "Treinador",
    };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "Não foi possível ler o perfil salvo. Seus dados foram preservados.",
    );
  }
  return validateTrainer(value);
}
interface TrainerStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}
interface TrainerSnapshot {
  profile: TrainerProfile;
  ready: boolean;
  busy: boolean;
  error: string | null;
}
export class TrainerStore {
  private storage: TrainerStorage;
  private listeners = new Set<() => void>();
  private snapshot: TrainerSnapshot = {
    profile: defaultTrainer(),
    ready: false,
    busy: false,
    error: null,
  };
  constructor(storage: TrainerStorage) {
    this.storage = storage;
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<TrainerSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  hydrate = async () => {
    if (this.snapshot.busy) return;
    this.update({ busy: true, error: null });
    try {
      const raw = await this.storage.getItem(TRAINER_STORAGE_KEY);
      const legacy =
        raw === null
          ? await this.storage.getItem(LEGACY_TRAINER_NAME_KEY)
          : null;
      this.update({ profile: parseTrainer(raw, legacy), ready: true });
    } catch (error) {
      this.update({
        ready: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o perfil. Tente novamente.",
      });
    } finally {
      this.update({ busy: false });
    }
  };
  save = async (draft: TrainerProfile): Promise<boolean> => {
    // Publica o perfil na UI só depois da gravação; se falhar, o rascunho fica na tela.
    if (!this.snapshot.ready || this.snapshot.busy) return false;
    this.update({ busy: true, error: null });
    try {
      const profile = validateTrainer(draft);
      await this.storage.setItem(TRAINER_STORAGE_KEY, JSON.stringify(profile));
      this.update({ profile });
      return true;
    } catch (error) {
      this.update({
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o perfil. Seu rascunho foi mantido.",
      });
      return false;
    } finally {
      this.update({ busy: false });
    }
  };
}
