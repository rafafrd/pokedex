import { Button, Host } from "@expo/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  activeCompanion,
  artworkUrl,
  BERRIES,
  CARE_OPTIONS,
  bondProgress,
  careBlockedReason,
  companionMood,
  countdown,
  favoriteBerry,
  FORAGE_COOLDOWN,
  localDay,
  MAX_COMPANIONS,
  STARTERS,
  type CompanionPokemon,
} from "../../../shared/companion";
import { PokemonArtwork } from "@/components/pokemon-artwork";
import { useCompanion } from "@/features/companion/use-companion";
import { usePreferences } from "@/features/preferences";
import { getAppTheme, type AppThemePalette } from "@/theme";

const petColors = { green: "#74B99D", pink: "#ED92AD", gold: "#F2C96D" };

function ActionButton({
  label,
  onPress,
  disabled,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const { appTheme } = usePreferences();
  const theme = getAppTheme(appTheme);
  return (
    <Host
      matchContents
      colorScheme={appTheme === "gengar" ? "dark" : "light"}
      seedColor={theme.accent}
      style={{ minHeight: 48 }}
    >
      <Button
        label={label}
        onPress={onPress}
        disabled={disabled}
        variant={secondary ? "outlined" : "filled"}
      />
    </Host>
  );
}
function Meter({
  label,
  value,
  theme,
  color,
  caption,
}: {
  label: string;
  value: number;
  theme: AppThemePalette;
  color: string;
  caption?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.between}>
        <Text style={{ color: theme.text, fontSize: 13 }}>{label}</Text>
        <Text
          selectable
          style={{
            color: theme.text,
            fontWeight: "800",
            fontVariant: ["tabular-nums"],
            fontSize: 12,
          }}
        >
          {caption ?? `${Math.round(value)}/100`}
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
        style={[styles.track, { backgroundColor: theme.border }]}
      >
        <View
          style={{
            height: "100%",
            width: `${value}%`,
            backgroundColor: color,
            borderRadius: 8,
          }}
        />
      </View>
    </View>
  );
}

export function CompanionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    pokemonId?: string;
    pokemonName?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { appTheme } = usePreferences();
  const theme = getAppTheme(appTheme);
  const { save, ready, busy, error, message, now, execute, reload } =
    useCompanion();
  const [candidate] = useState<CompanionPokemon | null>(() => {
    const id = Number(params.pokemonId);
    return Number.isSafeInteger(id) &&
      id > 0 &&
      typeof params.pokemonName === "string" &&
      /^[a-zA-Z0-9 -]{1,60}$/.test(params.pokemonName)
      ? { id, name: params.pokemonName }
      : null;
  });
  const [choosing, setChoosing] = useState(!!candidate);
  const [selected, setSelected] = useState(candidate ?? STARTERS[3]);
  const [nickname, setNickname] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const pet = activeCompanion(save, now);
  const panel = [
    styles.panel,
    { backgroundColor: theme.surface, borderColor: theme.border },
  ];
  const heading = [styles.sectionTitle, { color: theme.text }];
  const muted = [styles.hint, { color: theme.mutedText }];
  const input = [
    styles.input,
    {
      backgroundColor: theme.surfaceMuted,
      borderColor: theme.border,
      color: theme.text,
    },
  ];
  const choices =
    candidate && !STARTERS.some((p) => p.id === candidate.id)
      ? [candidate, ...STARTERS]
      : STARTERS;
  const owned = save.companions.some((p) => p.pokemon.id === selected.id);
  const selectPet = async (id: number) => {
    if (await execute({ type: "select", id })) {
      setChoosing(false);
      setRenaming(false);
    }
  };
  const adopt = async () => {
    if (await execute({ type: "adopt", pokemon: selected, nickname })) {
      setChoosing(false);
      setNickname("");
    }
  };
  const rename = async () => {
    if (await execute({ type: "rename", nickname: draft })) setRenaming(false);
  };
  const bond = pet ? bondProgress(pet.xp) : null;
  const mood = pet ? companionMood(pet) : null;
  const favorite = pet ? favoriteBerry(pet.pokemon.id) : null;
  const forageRemaining =
    save.lastForageAt === null
      ? 0
      : Math.max(0, FORAGE_COOLDOWN - (now - save.lastForageAt));
  const basketClaimed =
    !!save.lastBasketDay && save.lastBasketDay >= localDay(now);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top + 44}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(24, insets.bottom + 16) },
        ]}
      >
        {!ready ? (
          <View style={panel}>
            {busy && <ActivityIndicator color={theme.accent} />}
            <Text style={heading}>
              {error
                ? "Seu progresso está guardado"
                : "Preparando seu cantinho…"}
            </Text>
            {error && (
              <>
                <Text selectable accessibilityRole="alert" style={muted}>
                  {error}
                </Text>
                <ActionButton
                  label="Tentar carregar novamente"
                  disabled={busy}
                  onPress={() => void reload()}
                />
              </>
            )}
          </View>
        ) : (
          <>
            <View style={{ gap: 7 }}>
              <Text style={[styles.eyebrow, { color: theme.accent }]}>
                SEU CANTINHO NA POKÉDEX
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                Uma amizade para cuidar.
              </Text>
              <Text style={muted}>
                Frutas, carinho e um tempinho juntos. É assim que o vínculo
                cresce.
              </Text>
            </View>
            {(error || message) && (
              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.notice,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: error ? petColors.pink : petColors.green,
                  },
                ]}
              >
                <Text
                  selectable
                  accessibilityRole={error ? "alert" : undefined}
                  style={{ color: theme.text, fontSize: 13, lineHeight: 20 }}
                >
                  {error || message}
                </Text>
              </View>
            )}

            {save.companions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, padding: 4 }}
                accessibilityLabel="Seus companheiros"
              >
                {save.companions.map((p) => (
                  <Pressable
                    key={p.pokemon.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Visitar ${p.nickname}`}
                    accessibilityState={{
                      selected: p.pokemon.id === save.activeId && !choosing,
                      disabled: busy,
                    }}
                    disabled={busy}
                    onPress={() => void selectPet(p.pokemon.id)}
                    style={[
                      styles.teamMember,
                      {
                        backgroundColor: theme.surface,
                        borderColor:
                          p.pokemon.id === save.activeId && !choosing
                            ? theme.accent
                            : theme.border,
                      },
                    ]}
                  >
                    <PokemonArtwork
                      uri={artworkUrl(p.pokemon.id)}
                      name={p.pokemon.name}
                      size={40}
                    />
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {p.nickname}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {!pet || choosing ? (
              <View style={panel}>
                <Text style={heading}>Quem vai estar ao seu lado?</Text>
                <Text style={muted}>
                  Escolha um Pokémon e dê um apelido. A mochila compartilhada
                  começa com 10 frutas.
                </Text>
                <View style={styles.starters}>
                  {choices.map((p) => (
                    <Pressable
                      key={p.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Escolher ${p.name}`}
                      accessibilityState={{ selected: selected.id === p.id }}
                      onPress={() => setSelected(p)}
                      style={[
                        styles.starter,
                        {
                          backgroundColor:
                            selected.id === p.id
                              ? theme.surfaceMuted
                              : theme.background,
                          borderColor:
                            selected.id === p.id ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <PokemonArtwork
                        uri={artworkUrl(p.id)}
                        name={p.name}
                        size={66}
                      />
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: 11,
                          textAlign: "center",
                          textTransform: "capitalize",
                        }}
                      >
                        {p.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <ActionButton
                  label="Escolher outro na Pokédex"
                  secondary
                  onPress={() => router.navigate("/")}
                />
                {owned ? (
                  <ActionButton
                    label="Visitar companheiro"
                    disabled={busy}
                    onPress={() => void selectPet(selected.id)}
                  />
                ) : (
                  <>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      Como vamos chamar {selected.name}?
                    </Text>
                    <TextInput
                      value={nickname}
                      onChangeText={setNickname}
                      maxLength={20}
                      placeholder="Um apelido especial…"
                      placeholderTextColor={theme.mutedText}
                      accessibilityLabel="Apelido do companheiro"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (nickname.trim()) void adopt();
                      }}
                      style={input}
                    />
                    <Text
                      style={[
                        styles.hint,
                        { color: theme.mutedText, textAlign: "right" },
                      ]}
                    >
                      {nickname.length}/20 caracteres
                    </Text>
                    <ActionButton
                      label={busy ? "Salvando…" : "Começar nossa amizade"}
                      disabled={
                        busy ||
                        !nickname.trim() ||
                        save.companions.length >= MAX_COMPANIONS
                      }
                      onPress={() => void adopt()}
                    />
                  </>
                )}
                {pet && (
                  <ActionButton
                    label={`Voltar para ${pet.nickname}`}
                    secondary
                    onPress={() => setChoosing(false)}
                  />
                )}
              </View>
            ) : (
              <>
                <View style={panel}>
                  <View style={styles.between}>
                    <Text
                      style={[
                        styles.pill,
                        { color: theme.text, borderColor: theme.border },
                      ]}
                    >
                      {mood!.emoji} {mood!.label}
                    </Text>
                    <Text
                      selectable
                      style={[styles.hint, { color: theme.mutedText }]}
                    >
                      #{String(pet.pokemon.id).padStart(3, "0")}
                    </Text>
                  </View>
                  <View style={styles.scene}>
                    <View
                      style={[styles.orbit, { borderColor: theme.border }]}
                    />
                    <View style={styles.ground} />
                    <PokemonArtwork
                      uri={artworkUrl(pet.pokemon.id)}
                      name={pet.pokemon.name}
                      size={210}
                      style={{ opacity: pet.sleepingUntil ? 0.65 : 1 }}
                    />
                    <Text
                      style={[
                        styles.sceneSymbol,
                        {
                          color: pet.sleepingUntil
                            ? petColors.gold
                            : petColors.pink,
                        },
                      ]}
                    >
                      {pet.sleepingUntil ? "z z Z" : "♥"}
                    </Text>
                  </View>
                  {renaming ? (
                    <View style={{ gap: 10 }}>
                      <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        autoFocus
                        maxLength={20}
                        accessibilityLabel="Novo apelido"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (draft.trim()) void rename();
                        }}
                        style={input}
                      />
                      <ActionButton
                        label="Salvar apelido"
                        disabled={busy || !draft.trim()}
                        onPress={() => void rename()}
                      />
                      <ActionButton
                        label="Cancelar"
                        secondary
                        onPress={() => setRenaming(false)}
                      />
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Text
                        selectable
                        style={[styles.petName, { color: theme.text }]}
                      >
                        {pet.nickname}
                      </Text>
                      <Text
                        style={[
                          styles.hint,
                          {
                            color: theme.mutedText,
                            textTransform: "capitalize",
                          },
                        ]}
                      >
                        {pet.pokemon.name}
                      </Text>
                      <ActionButton
                        label="Editar apelido"
                        secondary
                        onPress={() => {
                          setDraft(pet.nickname);
                          setRenaming(true);
                        }}
                      />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.hint,
                      { color: theme.mutedText, textAlign: "center" },
                    ]}
                  >
                    {mood!.hint}
                  </Text>
                  {pet.sleepingUntil && (
                    <Text
                      accessibilityLiveRegion="none"
                      style={{
                        color: theme.accent,
                        textAlign: "center",
                        fontVariant: ["tabular-nums"],
                      }}
                    >
                      Acorda em {countdown(pet.sleepingUntil - now)}
                    </Text>
                  )}
                  <View style={styles.actions}>
                    {CARE_OPTIONS.map(({ type, label, emoji, hint }) => {
                      const blocked = careBlockedReason(pet, type, now);
                      return (
                        <Pressable
                          key={type}
                          accessibilityRole="button"
                          accessibilityLabel={`${label}. ${blocked ?? hint}`}
                          accessibilityState={{ disabled: busy || !!blocked }}
                          disabled={busy || !!blocked}
                          onPress={() => void execute({ type })}
                          style={({ pressed }) => [
                            styles.care,
                            {
                              backgroundColor: theme.surfaceMuted,
                              opacity:
                                busy || blocked ? 0.5 : pressed ? 0.75 : 1,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 22 }}>{emoji}</Text>
                          <Text
                            style={{
                              color: theme.text,
                              fontSize: 12,
                              fontWeight: "800",
                            }}
                          >
                            {label}
                          </Text>
                          <Text
                            style={{
                              color: theme.mutedText,
                              fontSize: 10,
                              textAlign: "center",
                            }}
                          >
                            {blocked ?? hint}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={panel}>
                  <Text style={heading}>Nosso vínculo</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View style={styles.level}>
                      <Text
                        style={{
                          color: "#32172A",
                          fontSize: 27,
                          fontWeight: "900",
                        }}
                      >
                        {bond!.level}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={[styles.eyebrow, { color: theme.mutedText }]}
                      >
                        NÍVEL DE AMIZADE
                      </Text>
                      <Text style={heading}>{bond!.name}</Text>
                    </View>
                  </View>
                  <Meter
                    label="Vínculo"
                    value={bond!.percent}
                    caption={`${pet.xp} pontos`}
                    theme={theme}
                    color={petColors.pink}
                  />
                  <Text style={muted}>
                    {bond!.next
                      ? `Faltam ${bond!.remaining} pontos para ${bond!.next.toLowerCase()}.`
                      : "Uma amizade para a vida toda!"}
                  </Text>
                  <View style={[styles.needs, { borderColor: theme.border }]}>
                    <Meter
                      label="Saciedade"
                      value={pet.fullness}
                      theme={theme}
                      color={petColors.green}
                    />
                    <Meter
                      label="Alegria"
                      value={pet.happiness}
                      theme={theme}
                      color={petColors.pink}
                    />
                    <Meter
                      label="Energia"
                      value={pet.energy}
                      theme={theme}
                      color={petColors.gold}
                    />
                  </View>
                  <View
                    style={[
                      styles.favorite,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text style={{ fontSize: 32 }}>{favorite!.emoji}</Text>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontWeight: "800",
                          fontSize: 14,
                        }}
                      >
                        Favorita: {favorite!.name}
                      </Text>
                      <Text style={muted}>
                        +6 de vínculo extra ao alimentar
                      </Text>
                    </View>
                  </View>
                  <Text selectable style={muted}>
                    Juntos desde{" "}
                    {new Date(pet.adoptedAt).toLocaleDateString("pt-BR")} ·{" "}
                    {pet.careCount} cuidados
                  </Text>
                </View>

                <View style={panel}>
                  <Text style={[styles.eyebrow, { color: theme.accent }]}>
                    HORA DO LANCHINHO
                  </Text>
                  <Text style={heading}>Mochila de frutas</Text>
                  <Text style={muted}>
                    Escolha uma fruta para alimentar {pet.nickname}.
                  </Text>
                  {BERRIES.map((berry) => {
                    const blocked = careBlockedReason(pet, "feed", now);
                    const empty = save.inventory[berry.id] === 0;
                    return (
                      <Pressable
                        key={berry.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Dar ${berry.name}, ${save.inventory[berry.id]} disponíveis. ${blocked ?? berry.description}`}
                        accessibilityState={{
                          disabled: busy || !!blocked || empty,
                        }}
                        disabled={busy || !!blocked || empty}
                        onPress={() =>
                          void execute({ type: "feed", berry: berry.id })
                        }
                        style={({ pressed }) => [
                          styles.berry,
                          {
                            backgroundColor: theme.surfaceMuted,
                            borderColor: theme.border,
                            opacity:
                              busy || blocked || empty
                                ? 0.55
                                : pressed
                                  ? 0.75
                                  : 1,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 36 }}>{berry.emoji}</Text>
                        <View style={{ flex: 1, gap: 5 }}>
                          <Text
                            style={{
                              color: theme.text,
                              fontSize: 15,
                              fontWeight: "800",
                            }}
                          >
                            {berry.name}
                            {favorite!.id === berry.id ? " ♥" : ""} · ×
                            {save.inventory[berry.id]}
                          </Text>
                          <Text style={muted}>{berry.description}</Text>
                          <Text
                            style={{
                              color: theme.accent,
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {empty ? "Sem frutas" : (blocked ?? "Dar fruta →")}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                  <View style={[styles.supply, { borderColor: theme.border }]}>
                    <Text style={heading}>🎁 Cesta diária</Text>
                    <Text style={muted}>
                      10 frutas · {save.basketStreak}{" "}
                      {save.basketStreak === 1
                        ? "dia seguido"
                        : "dias seguidos"}
                    </Text>
                    <ActionButton
                      label={basketClaimed ? "Volte amanhã" : "Coletar cesta"}
                      disabled={busy || basketClaimed}
                      onPress={() => void execute({ type: "basket" })}
                    />
                  </View>
                  <View style={{ gap: 8 }}>
                    <Text style={heading}>🌿 Pomar</Text>
                    <Text style={muted}>Colha 4 frutas a cada 5 minutos.</Text>
                    <ActionButton
                      label={
                        forageRemaining > 0
                          ? `Novas frutas em ${countdown(forageRemaining)}`
                          : "Colher frutas"
                      }
                      disabled={busy || forageRemaining > 0}
                      secondary
                      onPress={() => void execute({ type: "forage" })}
                    />
                  </View>
                </View>

                <View style={panel}>
                  <Text style={[styles.eyebrow, { color: theme.accent }]}>
                    PEQUENAS MEMÓRIAS
                  </Text>
                  <Text style={heading}>Diário de vocês</Text>
                  {pet.history.slice(0, 5).map((entry, index) => (
                    <View
                      style={[styles.entry, { borderColor: theme.border }]}
                      key={`${entry.at}-${index}`}
                    >
                      <Text
                        selectable
                        style={{
                          color: theme.text,
                          fontSize: 13,
                          lineHeight: 20,
                        }}
                      >
                        {entry.text}
                      </Text>
                      <Text style={muted}>
                        {new Date(entry.at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
                {save.companions.length < MAX_COMPANIONS && (
                  <ActionButton
                    label="Adicionar novo companheiro"
                    secondary
                    onPress={() => {
                      setChoosing(true);
                      setNickname("");
                    }}
                  />
                )}
              </>
            )}
            <Text style={[styles.footnote, { color: theme.mutedText }]}>
              Os cuidados continuam com o passar do tempo. Seu vínculo nunca
              diminui e seu companheiro sempre espera por você. Progresso salvo
              neste dispositivo, sem sincronização com a web.
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 18,
    width: "100%",
    maxWidth: 740,
    alignSelf: "center",
  },
  panel: {
    gap: 16,
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: "continuous",
  },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.8 },
  sectionTitle: { fontSize: 19, fontWeight: "800" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  hint: { fontSize: 12, lineHeight: 18 },
  footnote: {
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  notice: { borderWidth: 1, borderRadius: 14, padding: 14 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  teamMember: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 30,
    borderWidth: 1,
    padding: 5,
    paddingRight: 15,
  },
  starters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  starter: {
    flexGrow: 1,
    flexBasis: "29%",
    gap: 6,
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderRadius: 16,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  scene: { height: 240, alignItems: "center", justifyContent: "center" },
  orbit: {
    width: 225,
    height: 225,
    borderRadius: 113,
    borderWidth: 1,
    borderStyle: "dashed",
    position: "absolute",
  },
  ground: {
    width: 220,
    height: 60,
    borderRadius: 110,
    backgroundColor: petColors.green,
    opacity: 0.18,
    position: "absolute",
    bottom: 8,
    transform: [{ rotate: "-5deg" }],
  },
  sceneSymbol: { position: "absolute", right: "10%", top: "17%", fontSize: 25 },
  petName: { fontSize: 32, fontWeight: "900", textAlign: "center" },
  pill: {
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 11,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  care: {
    flexGrow: 1,
    flexBasis: "29%",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    paddingHorizontal: 6,
    paddingVertical: 15,
    minHeight: 108,
  },
  level: {
    width: 50,
    height: 56,
    backgroundColor: petColors.pink,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { height: 7, borderRadius: 8, overflow: "hidden" },
  needs: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20, gap: 20 },
  favorite: {
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  berry: {
    flexDirection: "row",
    gap: 15,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  supply: { gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 18 },
  entry: { paddingLeft: 12, gap: 5, borderLeftWidth: 2 },
});
