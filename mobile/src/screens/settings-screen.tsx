import { Host, Picker } from "@expo/ui";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  DEFAULT_USER_NAME,
  usePreferences,
  type AppTheme,
} from "@/features/preferences";
import { getAppTheme, type AppThemePalette } from "@/theme";

const themeOptions: ReadonlyArray<{ label: string; value: AppTheme }> = [
  { label: "Gengar", value: "gengar" },
  { label: "Mewtwo", value: "mewtwo" },
];

function LoadingState({ theme }: { theme: AppThemePalette }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando preferências"
      style={styles.state}
    >
      <ActivityIndicator color={theme.accent} size="large" />
      <Text style={[styles.stateTitle, { color: theme.text }]} selectable>
        Carregando preferências
      </Text>
      <Text style={[styles.stateText, { color: theme.mutedText }]} selectable>
        Recuperando seu nome e tema salvos.
      </Text>
    </View>
  );
}

export function SettingsScreen() {
  const {
    userName,
    appTheme,
    setUserName,
    setAppTheme,
    isHydrated,
    loadError,
    saveError,
  } = usePreferences();
  const theme = getAppTheme(appTheme);
  const [draftName, setDraftName] = useState(userName);
  const [draftTheme, setDraftTheme] = useState<AppTheme>(appTheme);
  const [isSavingName, setIsSavingName] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // The provider starts with defaults and replaces them after hydration. Keep
  // the form draft aligned once, without overwriting an in-progress edit.
  const [didHydrateDraft, setDidHydrateDraft] = useState(false);
  useEffect(() => {
    if (!isHydrated || didHydrateDraft) return;
    setDidHydrateDraft(true);
    setDraftName(userName);
    setDraftTheme(appTheme);
  }, [appTheme, didHydrateDraft, isHydrated, userName]);

  const handleNameChange = (value: string) => {
    setDraftName(value);
    setLocalError(null);
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    setLocalError(null);

    try {
      await setUserName(draftName);
      setDraftName(draftName.trim() || DEFAULT_USER_NAME);
    } catch (error) {
      // Keep draftName untouched so the user can retry or edit it.
      setLocalError(error instanceof Error ? error.message : "Não foi possível salvar o nome.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleThemeChange = (value: AppTheme) => {
    setDraftTheme(value);
    setLocalError(null);
    void setAppTheme(value).catch((error: unknown) => {
      setLocalError(error instanceof Error ? error.message : "Não foi possível salvar o tema.");
    });
  };

  const visibleError = localError ?? saveError ?? loadError;
  const errorTitle = saveError || localError ? "Não foi possível salvar" : "Não foi possível carregar";

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {!isHydrated ? (
        <LoadingState theme={theme} />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: theme.accent }]} selectable>
              PREFERÊNCIAS
            </Text>
            <Text style={[styles.title, { color: theme.text }]} selectable>
              Configurações
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedText }]} selectable>
              Personalize sua experiência na Pokédex.
            </Text>
          </View>

          {visibleError ? (
            <View
              accessible
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[
                styles.errorCard,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.accent },
              ]}
            >
              <Text style={[styles.errorTitle, { color: theme.text }]} selectable>
                {errorTitle}
              </Text>
              <Text style={[styles.errorText, { color: theme.mutedText }]} selectable>
                {visibleError}
              </Text>
            </View>
          ) : null}

          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]} selectable>
              Seu nome
            </Text>
            <Text style={[styles.sectionHint, { color: theme.mutedText }]} selectable>
              Como devemos chamar você?
            </Text>
            <TextInput
              value={draftName}
              onChangeText={handleNameChange}
              placeholder={DEFAULT_USER_NAME}
              placeholderTextColor={theme.mutedText}
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Nome do treinador"
              returnKeyType="done"
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              onSubmitEditing={() => void handleSaveName()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Salvar nome"
              accessibilityState={{ disabled: isSavingName, busy: isSavingName }}
              disabled={isSavingName}
              onPress={() => void handleSaveName()}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.accent },
                isSavingName && styles.buttonDisabled,
                pressed && !isSavingName && styles.buttonPressed,
              ]}
            >
              {isSavingName ? (
                <ActivityIndicator color={theme.accentContrast} size="small" />
              ) : (
                <Text style={[styles.primaryButtonLabel, { color: theme.accentContrast }]} selectable>
                  Salvar nome
                </Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]} selectable>
              Tema geral
            </Text>
            <Text style={[styles.sectionHint, { color: theme.mutedText }]} selectable>
              Escolha a identidade visual da Pokédex.
            </Text>
            <View
              accessible
              accessibilityLabel="Selecionar tema geral"
              style={[
                styles.pickerContainer,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              ]}
            >
              <Host matchContents style={styles.pickerHost}>
                <Picker<AppTheme>
                  selectedValue={draftTheme}
                  onValueChange={handleThemeChange}
                  testID="preferences-theme-picker"
                >
                  {themeOptions.map((option) => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </Host>
            </View>
            <Text style={[styles.selectionHint, { color: theme.mutedText }]} selectable>
              Tema selecionado: {draftTheme === "gengar" ? "Gengar" : "Mewtwo"}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 20,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 10,
    padding: 18,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 124,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  pickerContainer: {
    minHeight: 48,
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerHost: {
    minHeight: 48,
    width: "100%",
  },
  selectionHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorCard: {
    gap: 5,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
  },
  state: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    minHeight: 300,
    padding: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});

export default SettingsScreen;
