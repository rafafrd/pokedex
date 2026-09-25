import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";

import { PreferencesProvider, usePreferences } from "@/features/preferences";
import { getAppTheme } from "@/theme";

const queryClient = new QueryClient({
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

  // The persisted preference must win over the default before the catalogue
  // mounts, otherwise the app flashes the wrong visual theme on launch.
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
