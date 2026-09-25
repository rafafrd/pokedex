import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";

import { PreferencesProvider, usePreferences } from "@/features/preferences";
import { getAppTheme } from "@/theme";

const queryClient = new QueryClient({
  // Dados recentes ficam 5 min frescos; falha de rede ganha até 2 tentativas.
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AppNavigator />
    </PreferencesProvider>
  );
}

function AppNavigator() {
  const { appTheme, isHydrated } = usePreferences();
  const palette = getAppTheme(appTheme);

  // Esperamos o tema salvo antes de montar as telas p/ evitar um flash da paleta errada.
  if (!isHydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={appTheme === "gengar" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="pokemon/[id]" />
        <Stack.Screen
          name="companion"
          options={{
            headerShown: true,
            title: "Companheiro",
            headerStyle: { backgroundColor: palette.surface },
            headerTintColor: palette.text,
            contentStyle: { backgroundColor: palette.background },
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: palette.surface },
            headerTintColor: palette.text,
            headerTitleStyle: { color: palette.text },
            title: "Perfil do treinador",
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
