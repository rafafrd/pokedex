import type { ComponentType } from "react";
import { Platform, TurboModuleRegistry } from "react-native";

import type { PokeballFlightBackgroundProps } from "@/three";

/**
 * Expo Go does not contain react-native-wgpu's `WebGPUModule`. Importing that
 * package at module scope makes its `getEnforcing` call crash before the detail
 * route can export its component. Keep the Three runtime behind this native
 * module check so the normal detail screen remains available in Expo Go.
 */
function hasWebGPUModule(): boolean {
  return (
    Platform.OS !== "web" &&
    TurboModuleRegistry.get("WebGPUModule") !== null
  );
}

export function PokeballFlightBackground(
  props: PokeballFlightBackgroundProps,
): React.JSX.Element | null {
  if (!hasWebGPUModule()) {
    return null;
  }

  // The require is intentionally lazy. It only evaluates react-native-wgpu in
  // a binary rebuilt with that native module (a development build or release).
  const { PokeballFlightBackground: NativePokeballFlightBackground } = require("@/three") as {
    PokeballFlightBackground: ComponentType<PokeballFlightBackgroundProps>;
  };

  return <NativePokeballFlightBackground {...props} />;
}
