import AsyncStorage from "expo-sqlite/kv-store";

/** Android/iOS usam SQLite KV; Metro troca por storage.web.ts no navegador. */
export default AsyncStorage;
