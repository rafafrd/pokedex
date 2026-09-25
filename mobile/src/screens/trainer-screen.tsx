import { Button, Host, Picker } from "@expo/ui";
import { useEffect, useState } from "react";
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
  TRAINER_AVATARS,
  TRAINER_REGIONS,
  trainerAvatar,
  type TrainerProfile,
} from "../../../shared/trainer";
import { trainerProgress } from "../../../shared/companion";
import { useCompanion } from "@/features/companion/use-companion";
import { usePreferences, type AppTheme } from "@/features/preferences";
import { getAppTheme } from "@/theme";

export function TrainerScreen() {
  const {
    appTheme,
    setAppTheme,
    trainerProfile,
    trainerReady,
    trainerBusy,
    saveTrainerProfile,
    reloadTrainer,
    error,
  } = usePreferences();
  const theme = getAppTheme(appTheme);
  const insets = useSafeAreaInsets();
  const companion = useCompanion();
  const stats = trainerProgress(companion.save);
  const [draft, setDraft] = useState(trainerProfile);
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [themeBusy, setThemeBusy] = useState(false);
  useEffect(() => {
    if (trainerReady && !initialized) {
      setDraft(trainerProfile);
      setInitialized(true);
    }
  }, [trainerReady, trainerProfile, initialized]);
  const edit = (patch: Partial<TrainerProfile>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  };
  const save = async () => {
    setSaved(await saveTrainerProfile(draft));
  };
  const changeTheme = async (value: AppTheme) => {
    setThemeBusy(true);
    try {
      await setAppTheme(value);
    } catch {
      /* The provider exposes the save error. */
    } finally {
      setThemeBusy(false);
    }
  };
  const hostProps = {
    matchContents: true as const,
    colorScheme: appTheme === "gengar" ? ("dark" as const) : ("light" as const),
    seedColor: theme.accent,
  };
  const panel = [
    styles.panel,
    { backgroundColor: theme.surface, borderColor: theme.border },
  ];
  const heading = [styles.heading, { color: theme.text }];
  const hint = [styles.hint, { color: theme.mutedText }];
  const label = [styles.label, { color: theme.text }];
  const input = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.surfaceMuted,
      borderColor: theme.border,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top + 44}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 30 },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.accent }]}>
          SEU JEITO DE EXPLORAR
        </Text>
        {!trainerReady ? (
          <View style={panel}>
            {trainerBusy && <ActivityIndicator color={theme.accent} />}
            <Text
              selectable
              accessibilityRole={error ? "alert" : undefined}
              style={hint}
            >
              {error ?? "Carregando seu perfil…"}
            </Text>
            {error && (
              <Host {...hostProps}>
                <Button
                  label="Tentar carregar novamente"
                  disabled={trainerBusy}
                  onPress={() => void reloadTrainer()}
                />
              </Host>
            )}
          </View>
        ) : (
          <>
            <View style={[...panel, { alignItems: "center" }]}>
              <Text style={[styles.eyebrow, { color: theme.mutedText }]}>
                CARTEIRA DE TREINADOR · PRÉVIA
              </Text>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  accessibilityLabel={trainerAvatar(draft).label}
                  style={{ fontSize: 54 }}
                >
                  {trainerAvatar(draft).emoji}
                </Text>
              </View>
              <Text selectable style={[styles.name, { color: theme.text }]}>
                {draft.name.trim() || "Seu nome"}
              </Text>
              <Text style={hint}>📍 {draft.region}</Text>
              <Text selectable style={[...hint, { textAlign: "center" }]}>
                {draft.bio || "Sua história começa aqui."}
              </Text>
            </View>

            <View style={panel}>
              <Text style={heading}>Do seu jeito</Text>
              <Text style={label}>Nome do treinador</Text>
              <TextInput
                value={draft.name}
                onChangeText={(name) => edit({ name })}
                editable={!trainerBusy}
                maxLength={24}
                accessibilityLabel="Nome do treinador"
                autoComplete="nickname"
                autoCorrect={false}
                returnKeyType="done"
                style={input}
              />
              <Text style={label}>Seu avatar</Text>
              <View style={styles.avatars}>
                {TRAINER_AVATARS.map((avatar) => (
                  <Pressable
                    key={avatar.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Avatar ${avatar.label}`}
                    accessibilityState={{
                      selected: draft.avatar === avatar.id,
                      disabled: trainerBusy,
                    }}
                    disabled={trainerBusy}
                    onPress={() => edit({ avatar: avatar.id })}
                    style={[
                      styles.avatarOption,
                      {
                        backgroundColor: theme.surfaceMuted,
                        borderColor:
                          draft.avatar === avatar.id
                            ? theme.accent
                            : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 27 }}>{avatar.emoji}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={label}>Região favorita</Text>
              <Host {...hostProps}>
                <Picker<TrainerProfile["region"]>
                  selectedValue={draft.region}
                  enabled={!trainerBusy}
                  onValueChange={(region) => {
                    if (!trainerBusy) edit({ region });
                  }}
                  testID="trainer-region-picker"
                >
                  {TRAINER_REGIONS.map((region) => (
                    <Picker.Item key={region} label={region} value={region} />
                  ))}
                </Picker>
              </Host>
              <Text style={label}>Sua apresentação</Text>
              <TextInput
                value={draft.bio}
                onChangeText={(bio) => edit({ bio })}
                editable={!trainerBusy}
                maxLength={100}
                accessibilityLabel="Sua apresentação"
                placeholder="O que move sua jornada?"
                placeholderTextColor={theme.mutedText}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (draft.name.trim()) void save();
                }}
                style={input}
              />
              <Text style={[...hint, { textAlign: "right" }]}>
                {draft.bio.length}/100 caracteres
              </Text>
              <Host {...hostProps} style={{ minHeight: 48 }}>
                <Button
                  label={trainerBusy ? "Salvando…" : "Salvar perfil"}
                  disabled={trainerBusy || !draft.name.trim()}
                  onPress={() => void save()}
                />
              </Host>
              <Host {...hostProps} style={{ minHeight: 44 }}>
                <Button
                  label="Descartar alterações"
                  disabled={trainerBusy}
                  variant="text"
                  onPress={() => {
                    setDraft(trainerProfile);
                    setSaved(false);
                  }}
                />
              </Host>
              {(error || saved) && (
                <Text
                  selectable
                  accessibilityLiveRegion="polite"
                  accessibilityRole={error ? "alert" : undefined}
                  style={{ color: theme.text, fontSize: 13 }}
                >
                  {error ?? "✓ Perfil salvo!"}
                </Text>
              )}
            </View>
            <View style={panel}>
              <Text style={heading}>Tema da Pokédex</Text>
              <Text style={hint}>Aplicado e salvo ao selecionar.</Text>
              <Host {...hostProps}>
                <Picker<AppTheme>
                  selectedValue={appTheme}
                  enabled={!themeBusy}
                  onValueChange={(value) => {
                    if (!themeBusy) void changeTheme(value);
                  }}
                  testID="preferences-theme-picker"
                >
                  <Picker.Item label="Gengar · escuro" value="gengar" />
                  <Picker.Item label="Mewtwo · claro" value="mewtwo" />
                </Picker>
              </Host>
            </View>
          </>
        )}

        <View style={panel}>
          <Text style={heading}>Laços que você construiu</Text>
          {!companion.ready ? (
            <>
              <Text style={hint}>
                {companion.error ?? "Carregando suas conquistas…"}
              </Text>
              {companion.error && (
                <Host {...hostProps}>
                  <Button
                    label="Carregar conquistas"
                    disabled={companion.busy}
                    onPress={() => void companion.reload()}
                  />
                </Host>
              )}
            </>
          ) : (
            <>
              <View style={styles.stats}>
                {[
                  { value: stats.companions, label: "Companheiros" },
                  { value: stats.care, label: "Cuidados" },
                  { value: stats.meals, label: "Frutas servidas" },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    style={[
                      styles.stat,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <Text
                      selectable
                      style={[styles.statValue, { color: theme.text }]}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      style={[...hint, { fontSize: 10, textAlign: "center" }]}
                    >
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
              {stats.badges.map((badge) => (
                <View
                  key={badge.name}
                  style={[
                    styles.badge,
                    {
                      borderColor: badge.unlocked ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{ fontSize: 30, opacity: badge.unlocked ? 1 : 0.4 }}
                  >
                    {badge.emoji}
                  </Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={label}>
                      {badge.name} {badge.unlocked ? "✓" : ""}
                    </Text>
                    <Text style={hint}>{badge.description}</Text>
                    <Text style={[styles.eyebrow, { color: theme.accent }]}>
                      {badge.unlocked ? "CONQUISTADO" : "EM PROGRESSO"}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
        <Text style={[...hint, { textAlign: "center" }]}>
          Seu perfil e suas conquistas ficam salvos neste dispositivo.
        </Text>
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
    gap: 14,
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: "continuous",
  },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  heading: { fontSize: 20, fontWeight: "800" },
  name: { fontSize: 28, fontWeight: "900", textAlign: "center" },
  hint: { fontSize: 12, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: "700" },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 10,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  avatars: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  avatarOption: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 14,
  },
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    gap: 5,
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 14,
  },
  statValue: { fontSize: 25, fontWeight: "800", fontVariant: ["tabular-nums"] },
  badge: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
  },
});
