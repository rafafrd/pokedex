import AsyncStorage from "expo-sqlite/kv-store";

/** Native SQLite implementation; Metro selects storage.web.ts for Expo web. */
export default AsyncStorage;
