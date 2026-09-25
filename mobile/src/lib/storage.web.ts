/** Browser storage keeps Expo web free of SQLite's native/WASM requirements. */
const storage = {
  getItem: async (key: string) =>
    typeof window === "undefined" ? null : window.localStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    window.localStorage.setItem(key, value);
  },
};
export default storage;
