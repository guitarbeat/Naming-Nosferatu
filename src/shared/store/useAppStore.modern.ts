import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  
  // Tournament State
  currentTournamentId: string | null;
  
  // User Preferences
  preferences: {
    animationsEnabled: boolean;
    soundEnabled: boolean;
    autoSave: boolean;
  };
}

interface AppActions {
  // UI Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  
  // Tournament Actions
  setCurrentTournament: (id: string | null) => void;
  
  // Preference Actions
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      immer((set) => ({
        // Initial State
        theme: 'auto',
        sidebarOpen: false,
        currentTournamentId: null,
        preferences: {
          animationsEnabled: true,
          soundEnabled: false,
          autoSave: true,
        },

        // Actions
        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

        setCurrentTournament: (id) =>
          set((state) => {
            state.currentTournamentId = id;
          }),

        updatePreferences: (newPreferences) =>
          set((state) => {
            Object.assign(state.preferences, newPreferences);
          }),
      })),
      {
        name: 'app-store',
        partialize: (state) => ({
          theme: state.theme,
          preferences: state.preferences,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
