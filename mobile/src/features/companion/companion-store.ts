import AsyncStorage from "@/lib/storage";
import { CompanionStore } from "../../../../shared/companion";

export const companionStore = new CompanionStore({
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      throw new Error(
        "Não foi possível carregar o progresso neste dispositivo. Tente novamente.",
      );
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      throw new Error(
        "Não foi possível salvar. Verifique o espaço do dispositivo e tente a ação novamente.",
      );
    }
  },
});
