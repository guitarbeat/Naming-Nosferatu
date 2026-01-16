import { STORAGE_KEYS } from "../../core/constants";
import { queryClient } from "../services/supabase/queryClient";

export function clearTournamentCache() {
  try {
    queryClient.removeQueries({ queryKey: ["tournament"] });
    queryClient.removeQueries({ queryKey: ["catNames"] });
    return true;
  } catch (error) {
    console.error("Error clearing tournament cache:", error);
    return false;
  }
}

export function clearAllCaches() {
  try {
    queryClient.clear();
    localStorage.removeItem(STORAGE_KEYS.TOURNAMENT);
    return true;
  } catch (error) {
    console.error("Error clearing all caches:", error);
    return false;
  }
}
