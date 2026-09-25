const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);
// Metro observa shared/ p/ usar as regras comuns, sem puxar o React do web.
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, "../shared")];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // No nativo, Three precisa da entrada WebGPU; no web, fica a resolução padrão.
  if (platform !== "web" && moduleName.startsWith("three") && moduleName !== "three/webgpu") {
    moduleName = "three/webgpu";
  }

  if (platform !== "web" && moduleName.startsWith("@react-three/fiber")) {
    return context.resolveRequest(
      {
        ...context,
        unstable_conditionNames: ["module"],
        mainFields: ["module"],
      },
      moduleName,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
